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

// Multiple queries per category → rotate for variety + precision
export const CATEGORIES: Record<string, {
  label: string;
  labelEn: string;
  emoji: string;
  queries: string[];
}> = {
  all: {
    label: "Tout", labelEn: "All",
    emoji: "✨",
    queries: [
      "pedicure feet toes close up",
      "beautiful feet pedicure portrait",
      "feet toes nail art close up",
    ],
  },
  french: {
    label: "French", labelEn: "French",
    emoji: "🤍",
    queries: [
      "french tip pedicure toes",
      "french manicure toenails feet",
      "white tip nail pedicure feet",
    ],
  },
  red: {
    label: "Rouge", labelEn: "Red",
    emoji: "❤️",
    queries: [
      "red nail polish toenails feet",
      "red pedicure feet toes closeup",
      "scarlet nail polish feet portrait",
    ],
  },
  natural: {
    label: "Naturel", labelEn: "Natural",
    emoji: "🌿",
    queries: [
      "bare feet no nail polish pedicure",
      "natural feet toenails unpainted",
      "clean natural pedicure feet close up",
    ],
  },
  nude: {
    label: "Nude", labelEn: "Nude",
    emoji: "🍑",
    queries: [
      "nude beige nail polish toenails feet",
      "light pink pedicure feet toes",
      "neutral nail color feet close up",
    ],
  },
  white: {
    label: "Blanc", labelEn: "White",
    emoji: "🤍",
    queries: [
      "white nail polish toenails feet",
      "white pedicure toes close up",
      "snow white nail feet portrait",
    ],
  },
  colorful: {
    label: "Coloré", labelEn: "Colorful",
    emoji: "🌈",
    queries: [
      "colorful nail art toenails feet",
      "bright color nail polish toes",
      "multicolor pedicure nail art feet",
    ],
  },
  tanned: {
    label: "Bronzé", labelEn: "Tanned",
    emoji: "☀️",
    queries: [
      "tanned feet summer beach pedicure",
      "dark skin feet toes beautiful",
      "bronze skin feet close up summer",
    ],
  },
  jewel: {
    label: "Bijoux", labelEn: "Jewelry",
    emoji: "💍",
    queries: [
      "ankle bracelet feet toes jewelry",
      "toe ring feet close up",
      "foot jewelry anklet pedicure",
    ],
  },
  arches: {
    label: "Arches", labelEn: "Arches",
    emoji: "🦶",
    queries: [
      "foot arch sole beautiful",
      "high arch foot portrait",
      "foot arch heel close up",
    ],
  },
};

// Fetch from multiple queries and deduplicate for variety
export async function fetchPhotos(category = "all", page = 1, perPage = 12): Promise<PexelsPhoto[]> {
  const cat = CATEGORIES[category] ?? CATEGORIES.all;
  // Rotate query based on page to get variety
  const queryIndex = (page - 1) % cat.queries.length;
  const q = cat.queries[queryIndex];

  const url = `${BASE}/search?query=${encodeURIComponent(q)}&per_page=${perPage}&page=${Math.ceil(page / cat.queries.length) || 1}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { Authorization: API_KEY },
    next: { revalidate: 1800 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.photos ?? []) as PexelsPhoto[];
}
