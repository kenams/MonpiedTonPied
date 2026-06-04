"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Heart, Eye, Lock, Users, Star, Loader2, Grid3X3, Play } from "lucide-react";
import PaywallModal from "@/components/PaywallModal";
import AuthModal from "@/components/AuthModal";

type Creator = {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  verifiedCreator: boolean;
  stats: { totalLikes: number; totalViews: number; totalContent: number; subscribers: number };
  subscriptionPrice?: number;
  subscriptionActive?: boolean;
};

type ContentItem = {
  _id: string;
  title?: string;
  files: { url: string; thumbnail?: string; type: string }[];
  stats: { views: number; likes: number };
  locked: boolean;
  price?: number;
};

export default function CreatorProfilePage({ params }: { params: { username: string } }) {
  const { user, token, isPremium } = useAuth();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.username]);

  async function loadData() {
    try {
      const [creatorData, contentData] = await Promise.all([
        api.get<Creator>(`/api/users/${params.username}`, token || undefined),
        api.get<{ items: ContentItem[] }>(`/api/content?creator=${params.username}`, token || undefined),
      ]);
      setCreator(creatorData);
      setContents(contentData.items || []);
      setSubscribed(creatorData.subscriptionActive || false);
    } catch {}
    finally { setLoading(false); }
  }

  async function handleSubscribe() {
    if (!user) { setShowAuth(true); return; }
    try {
      const data = await api.post<{ url?: string; success?: boolean }>(
        `/api/billing/subscribe-creator`,
        { creatorId: creator?._id },
        token!
      );
      if (data.url) window.location.href = data.url;
      else setSubscribed(true);
    } catch { setShowPaywall(true); }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-white/40">
        Créateur introuvable
      </div>
    );
  }

  const isOwn = user?.username === creator.username;

  return (
    <>
      <div className="page-with-nav max-w-lg mx-auto">
        {/* Cover / Avatar */}
        <div className="relative">
          <div className="h-36 bg-gradient-to-br from-[var(--rose-dark)]/30 to-[#6d3d5a]/30" />
          <div className="absolute -bottom-12 left-4">
            <img
              src={creator.avatarUrl || "/default-avatar.svg"}
              alt={creator.displayName}
              className="w-24 h-24 rounded-full object-cover avatar-ring border-4 border-[#080808]"
            />
          </div>
        </div>

        {/* Profile info */}
        <div className="pt-14 px-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{creator.displayName}</h1>
                {creator.verifiedCreator && (
                  <span className="badge badge-gold">✓ Vérifié</span>
                )}
              </div>
              <p className="text-sm text-white/40">@{creator.username}</p>
            </div>

            {!isOwn && (
              <button
                onClick={handleSubscribe}
                className={subscribed ? "btn-secondary py-2 px-4 text-sm rounded-full" : "btn-primary py-2 px-4 text-sm rounded-full"}
              >
                {subscribed ? "✓ Abonné" : "S'abonner"}
              </button>
            )}
          </div>

          {creator.bio && (
            <p className="text-sm text-white/60 mt-3 leading-relaxed">{creator.bio}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/8">
            {[
              { value: creator.stats?.totalContent || 0, label: "Publi." },
              { value: creator.stats?.subscribers || 0, label: "Abonnés" },
              { value: creator.stats?.totalLikes || 0, label: "Likes" },
              { value: creator.stats?.totalViews || 0, label: "Vues" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-base font-bold text-white">{value.toLocaleString()}</p>
                <p className="text-[11px] text-white/40">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content grid */}
        <div className="px-0">
          <div className="content-grid">
            {contents.map((c, i) => {
              const file = c.files?.[0];
              const locked = c.locked && !isPremium && !subscribed;
              return (
                <div key={c._id} className="content-grid-item group" onClick={() => locked && setShowPaywall(true)}>
                  {file && (
                    file.type?.startsWith("video") ? (
                      <>
                        <img src={file.thumbnail || file.url} alt="" className={locked ? "blur-sm" : ""} />
                        <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center">
                          <Play size={10} fill="white" className="text-white ml-0.5" />
                        </div>
                      </>
                    ) : (
                      <img src={file.url} alt={c.title || ""} className={locked ? "blur-sm" : ""} />
                    )
                  )}
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Lock size={20} className="text-[var(--rose)]" />
                    </div>
                  )}
                  {!locked && (
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex items-center gap-2 text-white text-xs">
                      <span className="flex items-center gap-1"><Heart size={10} />{c.stats.likes}</span>
                      <span className="flex items-center gap-1"><Eye size={10} />{c.stats.views}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {contents.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-sm">Aucune publication pour le moment</p>
            </div>
          )}
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
