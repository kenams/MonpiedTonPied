import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/access";
import { fetchRedditPhotos } from "@/lib/reddit";
import { fetchPhotos as fetchPexels } from "@/lib/pexels";
import FeedScroll from "@/components/FeedScroll";
import AgeGate from "@/components/AgeGate";
import type { FeedItem } from "@/app/api/feed/route";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";

  // Check premium
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";
  let isPremium = false;
  if (token) {
    const payload = await verifyAccessToken(token);
    isPremium = !!payload;
  }

  // Load initial content: Reddit first, fallback Pexels
  const { photos: redditPhotos, nextAfter } = await fetchRedditPhotos(category, "", 20);

  let items: FeedItem[] = redditPhotos.map(p => ({
    id: `r_${p.id}`,
    url: p.url,
    source: "reddit" as const,
    title: p.title,
    width: p.width,
    height: p.height,
  }));

  if (items.length < 8) {
    const pexels = await fetchPexels(category, 1, 15);
    items = [
      ...items,
      ...pexels.map(p => ({
        id: `p_${p.id}`,
        url: p.src.large2x,
        source: "pexels" as const,
        width: p.width,
        height: p.height,
      })),
    ];
  }

  return (
    <>
      <AgeGate />
      <FeedScroll
        initialItems={items}
        initialNextAfter={nextAfter}
        initialCategory={category}
        isPremium={isPremium}
      />
    </>
  );
}
