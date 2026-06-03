import { NextRequest, NextResponse } from "next/server";
import { fetchRedditPhotos } from "@/lib/reddit";
import { fetchPhotos as fetchPexels } from "@/lib/pexels";

export type FeedItem = {
  id: string;
  url: string;
  source: "reddit" | "pexels";
  title?: string;
  width: number;
  height: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "all";
  const after = searchParams.get("after") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");

  // Essayer Reddit en priorité
  const { photos: redditPhotos, nextAfter } = await fetchRedditPhotos(category, after, 20);

  let items: FeedItem[] = redditPhotos.map(p => ({
    id: `r_${p.id}`,
    url: p.url,
    source: "reddit",
    title: p.title,
    width: p.width,
    height: p.height,
  }));

  // Compléter avec Pexels si Reddit < 10 photos
  if (items.length < 10) {
    const pexelsPhotos = await fetchPexels(category, page, 15 - items.length);
    const pexelsItems: FeedItem[] = pexelsPhotos.map(p => ({
      id: `p_${p.id}`,
      url: p.src.large2x,
      source: "pexels",
      width: p.width,
      height: p.height,
    }));
    items = [...items, ...pexelsItems];
  }

  return NextResponse.json({ items, nextAfter, page });
}
