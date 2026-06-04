"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Heart, Loader2, Lock, Eye } from "lucide-react";
import Link from "next/link";
import PaywallModal from "@/components/PaywallModal";

type FeedItem = {
  _id: string;
  title?: string;
  files: { url: string; thumbnail?: string; type: string }[];
  stats: { views: number; likes: number };
  creator: { username: string; displayName: string; avatarUrl: string };
  locked: boolean;
};

export default function FavoritesPage() {
  const { user, token, loading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    api.get<{ items: FeedItem[] }>("/api/content/liked", token!)
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
    </div>
  );

  return (
    <>
      <div className="page-with-nav px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 py-4 mb-4">
          <Heart size={20} className="text-[var(--rose)]" />
          <h1 className="text-xl font-bold text-white">Mes favoris</h1>
          {items.length > 0 && <span className="badge badge-rose ml-auto">{items.length}</span>}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Heart size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium mb-2">Aucun favori</p>
            <p className="text-sm">Likez des contenus pour les retrouver ici</p>
            <Link href="/" className="btn-primary mt-6 inline-flex py-2.5 px-6 rounded-full text-sm">
              Explorer le feed
            </Link>
          </div>
        ) : (
          <div className="content-grid">
            {items.map(c => {
              const file = c.files?.[0];
              const locked = c.locked && !isPremium;
              return (
                <div
                  key={c._id}
                  className="content-grid-item group"
                  onClick={() => locked && setShowPaywall(true)}
                >
                  {file && (
                    <img
                      src={file.thumbnail || file.url}
                      alt={c.title || ""}
                      className={`w-full h-full object-cover ${locked ? "blur-sm" : ""}`}
                    />
                  )}
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Lock size={18} className="text-[var(--rose)]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col gap-0.5">
                    <p className="text-white text-[10px] font-medium">@{c.creator.username}</p>
                    <div className="flex gap-2 text-white/60 text-[9px]">
                      <span className="flex items-center gap-0.5"><Heart size={8} />{c.stats.likes}</span>
                      <span className="flex items-center gap-0.5"><Eye size={8} />{c.stats.views}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}
