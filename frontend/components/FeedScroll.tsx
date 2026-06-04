"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, Lock, Loader2, ChevronDown, Share2, MessageCircle, Plus, Eye } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import PaywallModal from "./PaywallModal";
import AuthModal from "./AuthModal";
import Link from "next/link";

export type FeedItem = {
  _id: string;
  title?: string;
  description?: string;
  creator: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    verifiedCreator?: boolean;
  };
  files: { url: string; type: string; thumbnail?: string; price?: number }[];
  tags?: string[];
  category?: string;
  stats: { views: number; likes: number };
  locked: boolean;
  price?: number;
  liked?: boolean;
};

const FREE_LIMIT = 5;

export default function FeedScroll() {
  const { user, token, isPremium } = useAuth();
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [paywallDone, setPaywallDone] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (cat: string, pg: number, replace = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: cat === "all" ? "" : cat, page: String(pg), limit: "10" });
      const data = await api.get<{ items: FeedItem[]; hasMore: boolean }>(`/api/content/feed?${params}`, token || undefined);
      const newItems = data.items ?? [];
      setItems(prev => replace ? newItems : [...prev, ...newItems]);
      setHasMore(data.hasMore ?? false);
      setPage(pg + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, token]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setPaywallDone(false);
    loadPage(category, 1, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasMore && !loading) loadPage(category, page); },
      { rootMargin: "600px" }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loading, category, page]);

  // Paywall trigger on scroll
  useEffect(() => {
    if (isPremium || paywallDone) return;
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.round(container.scrollTop / window.innerHeight);
      if (idx >= FREE_LIMIT) { setShowPaywall(true); setPaywallDone(true); }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [isPremium, paywallDone]);

  async function toggleLike(item: FeedItem) {
    if (!user) { setShowAuth(true); return; }
    try {
      await api.post(`/api/content/${item._id}/like`, {}, token || undefined);
      setLikedIds(prev => {
        const n = new Set(prev);
        if (n.has(item._id)) n.delete(item._id); else n.add(item._id);
        return n;
      });
    } catch {}
  }

  const isLocked = (i: number, item: FeedItem) =>
    item.locked && !isPremium && i >= FREE_LIMIT;

  return (
    <>
      {/* Category pills */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pt-14">
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 w-full max-w-lg" style={{ scrollbarWidth: "none" }}>
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button key={key} onClick={() => setCategory(key)} className={`pill ${category === key ? "active" : ""}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex justify-center bg-[#080808]">
        <div ref={containerRef} className="feed-container w-full" style={{ maxWidth: 480 }}>

          {/* Empty */}
          {!loading && items.length === 0 && (
            <div className="feed-item flex flex-col items-center justify-center gap-4 text-white/30">
              <p className="text-4xl">📸</p>
              <p className="text-sm">Aucun contenu dans cette catégorie</p>
              <p className="text-xs">Les créateurs arrivent bientôt...</p>
            </div>
          )}

          {/* Initial loading */}
          {loading && items.length === 0 && (
            <div className="feed-item flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
            </div>
          )}

          {items.map((item, i) => {
            const locked = isLocked(i, item);
            const file = item.files?.[0];
            const liked = likedIds.has(item._id);

            return (
              <div
                key={`${item._id}-${i}`}
                className="feed-item"
                onClick={() => locked && (isPremium ? null : setShowPaywall(true))}
                style={{ cursor: locked ? "pointer" : "default" }}
              >
                {/* Media */}
                {file && (
                  file.type?.startsWith("video") ? (
                    <video
                      src={file.url}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${locked ? "blurred" : ""}`}
                      style={{ objectPosition: "center 60%" }}
                      autoPlay muted loop playsInline
                    />
                  ) : (
                    <img
                      src={file.url}
                      alt={item.title || ""}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${locked ? "blurred" : ""}`}
                      style={{ objectPosition: "center 60%" }}
                      loading={i < 3 ? "eager" : "lazy"}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )
                )}

                {/* Overlays */}
                <div className="absolute top-0 inset-x-0 h-32 gradient-top pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-56 gradient-bottom pointer-events-none" />

                {/* Lock overlay */}
                {locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-4 fade-up px-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-black/60 border border-[var(--rose)]/40 flex items-center justify-center">
                        <Lock size={22} className="text-[var(--rose)]" />
                      </div>
                      <p className="text-white font-bold text-lg">Contenu réservé aux membres</p>
                      <p className="text-[var(--rose)]/80 text-sm">Accès illimité, HD, sans pub</p>
                      <button
                        className="btn-primary px-8 rounded-full"
                        onClick={e => { e.stopPropagation(); setShowPaywall(true); }}
                      >
                        Débloquer — dès €4.99/mois
                      </button>
                    </div>
                  </div>
                )}

                {/* Right actions */}
                {!locked && (
                  <div className="absolute right-4 bottom-24 flex flex-col items-center gap-5 z-20">
                    {/* Creator avatar */}
                    <div className="relative">
                      <Link href={`/creator/${item.creator?.username}`}>
                        <img
                          src={item.creator?.avatarUrl || "/default-avatar.svg"}
                          alt={item.creator?.displayName}
                          className="w-12 h-12 rounded-full object-cover avatar-ring"
                        />
                      </Link>
                      <button
                        onClick={e => { e.stopPropagation(); }}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[var(--rose)] rounded-full flex items-center justify-center"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Like */}
                    <button onClick={e => { e.stopPropagation(); toggleLike(item); }} className="flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${liked ? "bg-red-500/20" : "bg-black/40"}`}>
                        <Heart size={22} fill={liked ? "#ef4444" : "none"} stroke={liked ? "#ef4444" : "white"} />
                      </div>
                      <span className="text-white text-xs font-medium">{(item.stats?.likes || 0) + (liked ? 1 : 0)}</span>
                    </button>

                    {/* Comments */}
                    <button onClick={e => { e.stopPropagation(); if (!user) setShowAuth(true); }} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                        <MessageCircle size={22} className="text-white" />
                      </div>
                      <span className="text-white text-xs font-medium">0</span>
                    </button>

                    {/* Share */}
                    <button onClick={e => { e.stopPropagation(); navigator.share?.({ url: window.location.href }); }} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                        <Share2 size={20} className="text-white" />
                      </div>
                    </button>

                    {/* Views */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                        <Eye size={18} className="text-white/60" />
                      </div>
                      <span className="text-white/50 text-xs">{item.stats?.views || 0}</span>
                    </div>
                  </div>
                )}

                {/* Bottom info */}
                {!locked && (
                  <div className="absolute bottom-6 left-4 right-20 z-20">
                    <Link href={`/creator/${item.creator?.username}`} className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold text-sm">@{item.creator?.username}</span>
                      {item.creator?.verifiedCreator && (
                        <span className="badge badge-gold text-[9px] py-0.5 px-1.5">✓ Vérifié</span>
                      )}
                    </Link>
                    {item.title && (
                      <p className="text-white/80 text-sm leading-snug line-clamp-2 mb-2">{item.title}</p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 4).map(t => (
                          <span key={t} className="text-[var(--rose)] text-xs font-medium">#{t}</span>
                        ))}
                      </div>
                    )}
                    {/* Free counter */}
                    {!isPremium && i < FREE_LIMIT - 1 && (
                      <p className="text-white/25 text-[10px] tracking-widest uppercase mt-2">
                        {FREE_LIMIT - 1 - i} gratuite{FREE_LIMIT - 1 - i > 1 ? "s" : ""} restante{FREE_LIMIT - 1 - i > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                {/* Scroll hint */}
                {!locked && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <ChevronDown size={16} className="text-white/20 animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Infinite loader */}
          <div ref={loaderRef} className="h-32 flex items-center justify-center">
            {loading && items.length > 0 && <Loader2 size={18} className="animate-spin text-[var(--rose)]/50" />}
            {!hasMore && items.length > 0 && (
              <p className="text-white/20 text-xs">Vous avez tout vu ✨</p>
            )}
          </div>
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
