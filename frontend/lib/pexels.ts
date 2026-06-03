const API_KEY = process.env.PEXELS_API_KEY!;
const BASE = "https://api.pexels.com/v1";

export type PexelsPhoto = {
  id: number;
  url: string;
  src: { large2x: string; large: string; medium: string; portrait: string };
  alt: string;
  width: number;
  height: number;
  photographer: string;
};

export const CATEGORIES: Record<string, { label: string; emoji: string; query: string }> = {
  all:      { label: "Tout",       emoji: "✨", query: "pedicure feet toes beautiful" },
  natural:  { label: "Naturel",    emoji: "🌿", query: "natural bare feet pedicure" },
  french:   { label: "French",     emoji: "🤍", query: "french pedicure toes feet" },
  red:      { label: "Rouge",      emoji: "❤️", query: "red nail polish feet toes" },
  colorful: { label: "Coloré",     emoji: "🌈", query: "colorful nail polish feet toes" },
  nude:     { label: "Nude",       emoji: "🍑", query: "nude beige nail feet toes" },
  tanned:   { label: "Bronzé",     emoji: "☀️", query: "tanned feet summer beach" },
  jewel:    { label: "Bijoux",     emoji: "💍", query: "ankle bracelet feet jewelry" },
};

export async function fetchPhotos(category = "all", page = 1, perPage = 15): Promise<PexelsPhoto[]> {
  const q = CATEGORIES[category]?.query ?? CATEGORIES.all.query;
  const url = `${BASE}/search?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${page}&orientation=portrait`;
  const res = await fetch(url, {
    headers: { Authorization: API_KEY },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.photos ?? []) as PexelsPhoto[];
}
