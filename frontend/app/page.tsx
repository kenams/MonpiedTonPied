import { cookies } from "next/headers";
import { fetchPhotos } from "@/lib/pexels";
import { verifyAccessToken, FREE_LIMIT } from "@/lib/access";
import FeedScroll from "@/components/FeedScroll";
import AgeGate from "@/components/AgeGate";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; age?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";

  // Check premium access
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value ?? "";
  let isPremium = false;
  if (token) {
    const payload = await verifyAccessToken(token);
    isPremium = !!payload;
  }

  // Initial photos
  const photos = await fetchPhotos(category, 1, 15);

  return (
    <>
      <AgeGate />
      <FeedScroll
        initialPhotos={photos}
        initialCategory={category}
        isPremium={isPremium}
      />
    </>
  );
}
