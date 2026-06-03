export type RedditPhoto = {
  id: string;
  url: string;
  title: string;
  subreddit: string;
  score: number;
  permalink: string;
  thumbnail: string;
  width: number;
  height: number;
  source: "reddit";
};

// Subreddits par catégorie
const SUBREDDITS: Record<string, string[]> = {
  all:      ["feet", "Feetishh", "FootFetish", "barefeet"],
  natural:  ["barefeet", "feet"],
  french:   ["feet", "Feetishh"],
  red:      ["feet", "Feetishh", "FootFetish"],
  nude:     ["barefeet", "feet"],
  white:    ["feet", "Feetishh"],
  colorful: ["feet", "Feetishh"],
  tanned:   ["feet", "Feetishh", "FootFetish"],
  jewel:    ["feet", "Feetishh"],
  arches:   ["feet", "heels", "HighHeels"],
};

function isDirectImage(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url) ||
    url.includes("i.redd.it") ||
    url.includes("i.imgur.com");
}

function getImageUrl(post: any): string | null {
  // i.redd.it direct
  if (post.url && isDirectImage(post.url)) return post.url;
  // Reddit gallery — prendre la première image
  if (post.gallery_data && post.media_metadata) {
    const firstId = post.gallery_data.items?.[0]?.media_id;
    if (firstId && post.media_metadata[firstId]) {
      const meta = post.media_metadata[firstId];
      const src = meta.s?.u || meta.s?.gif;
      if (src) return src.replace(/&amp;/g, "&");
    }
  }
  // preview image
  if (post.preview?.images?.[0]?.source?.url) {
    return post.preview.images[0].source.url.replace(/&amp;/g, "&");
  }
  return null;
}

export async function fetchRedditPhotos(
  category = "all",
  after = "",
  limit = 25
): Promise<{ photos: RedditPhoto[]; nextAfter: string }> {
  const subs = SUBREDDITS[category] ?? SUBREDDITS.all;
  // Choisir un sub en rotation basée sur after
  const subIndex = after ? parseInt(after.split("_")[0] ?? "0", 10) % subs.length : 0;
  const sub = subs[subIndex];
  const redditAfter = after ? after.split("_").slice(1).join("_") : "";

  const url = `https://www.reddit.com/r/${sub}/top.json?limit=${limit}&t=month${redditAfter ? `&after=${redditAfter}` : ""}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ArcaneFeetsApp/1.0" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { photos: [], nextAfter: "" };

    const data = await res.json();
    const posts = data.data?.children ?? [];
    const nextAfterRaw = data.data?.after ?? "";

    const photos: RedditPhoto[] = posts
      .map((child: any) => child.data)
      .filter((p: any) => !p.is_video && (p.url || p.preview))
      .map((p: any) => {
        const imgUrl = getImageUrl(p);
        if (!imgUrl) return null;
        return {
          id: p.id,
          url: imgUrl,
          title: p.title,
          subreddit: sub,
          score: p.score,
          permalink: `https://reddit.com${p.permalink}`,
          thumbnail: p.thumbnail || "",
          width: p.preview?.images?.[0]?.source?.width ?? 600,
          height: p.preview?.images?.[0]?.source?.height ?? 900,
          source: "reddit" as const,
        };
      })
      .filter(Boolean);

    // Encode: subIndex_redditAfter
    const newAfter = nextAfterRaw ? `${subIndex}_${nextAfterRaw}` : `${(subIndex + 1) % subs.length}_`;

    return { photos, nextAfter: newAfter };
  } catch {
    return { photos: [], nextAfter: "" };
  }
}
