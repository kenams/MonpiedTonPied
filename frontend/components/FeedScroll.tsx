"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Lock, Loader2, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/pexels";
import { FREE_LIMIT } from "@/lib/access";
import PaywallModal from "./PaywallModal";
import type { FeedItem } from "@/app/api/feed/route";

interface Props {
  initialItems: FeedItem[];
  initialNextAfter: string;
  initialCategory: string;
  isPremium: boolean;
}

export default function FeedScroll({ initialItems, initialNextAfter, initialCategory, isPremium }: Props) {
  const [category, setCategory] = useState(initialCategory);
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [nextAfter, setNextAfter] = useState(initialNextAfter);
  const [page, setPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallTriggered, setPaywallTriggered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ category, after: nextAfter, page: String(page) });
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      if (data.items?.length > 0) {
        setItems(prev => {
          const ids = new Set(prev.map(i => i.id));
          const fresh = data.items.filter((i: FeedItem) => !ids.has(i.id));
          return [...prev, ...fresh];
        });
        setNextAfter(data.nextAfter ?? "");
        setPage(p => p + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, category, nextAfter, page]);

  async function switchCategory(cat: string) {
    if (cat === category || loading) return;
    setCategory(cat);
    setPage(2);
    setLoading(true);
    setPaywallTriggered(false);
    setItems([]);
    const res = await fetch(`/api/feed?category=${cat}&after=&page=1`);
    const data = await res.json();
    setItems(data.items ?? []);
    setNextAfter(data.nextAfter ?? "");
    setLoading(false);
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "400px" }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // Paywall trigger
  useEffect(() => {
    if (isPremium || paywallTriggered) return;
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.round(container.scrollTop / window.innerHeight);
      if (idx >= FREE_LIMIT) {
        setShowPaywall(true);
        setPaywallTriggered(true);
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [isPremium, paywallTriggered]);

  const isLocked = (i: number) => !isPremium && i >= FREE_LIMIT;
  const cat = CATEGORIES[category];

  return (
    <>
      {/* Category pills */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center">
        <div
          className="flex items-center gap-2 overflow-x-auto px-4 py-3 w-full max-w-lg"
          style={{ scrollbarWidth: "none" }}
        >
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button
              key={key}
              onClick={() => switchCategory(key)}
              className={`pill flex-shrink-0 ${category === key ? "active" : ""}`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex justify-center bg-[#080808] min-h-screen">
        <div
          ref={containerRef}
          className="feed-container w-full"
          style={{ maxWidth: "480px" }}
        >
          {/* Loading initial */}
          {loading && items.length === 0 && (
            <div className="feed-item flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-[#c8907a]" />
            </div>
          )}

          {items.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              className="feed-item"
              onClick={() => isLocked(i) && setShowPaywall(true)}
              style={{ cursor: isLocked(i) ? "pointer" : "default" }}
            >
              {/* Image */}
              <img
                src={item.url}
                alt={item.title ?? `${cat?.label} feet`}
                className={`absolute inset-0 w-full h-full transition-all duration-300 ${isLocked(i) ? "blurred" : ""}`}
                style={{ objectFit: "cover", objectPosition: "center 65%" }}
                loading={i < 4 ? "eager" : "lazy"}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />

              {/* Overlays */}
              <div className="absolute top-0 inset-x-0 h-28 gradient-top pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-40 gradient-bottom pointer-events-none" />

              {/* Badge source + catégorie */}
              {!isLocked(i) && (
                <div className="absolute top-14 left-4 z-10 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {item.source === "reddit" ? "r/feet" : "gallery"}
                  </span>
                </div>
              )}

              {/* Lock */}
              {isLocked(i) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-4 fade-up px-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-black/60 border border-[#c8907a]/40 flex items-center justify-center">
                      <Lock size={22} className="text-[#c8907a]" />
                    </div>
                    <p className="text-white font-bold text-lg">Suite réservée aux membres</p>
                    <p className="text-[#c8907a]/80 text-sm">Accès illimité, HD, sans pub</p>
                    <button
                      className="bg-gradient-to-r from-[#c8907a] to-[#9d6552] text-white font-bold px-8 py-3 rounded-full text-sm shadow-lg"
                      onClick={(e) => { e.stopPropagation(); setShowPaywall(true); }}
                    >
                      Débloquer — dès €4.99
                    </button>
                  </div>
                </div>
              )}

              {/* Bas */}
              {!isLocked(i) && (
                <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center gap-1 z-10">
                  {!isPremium && i < FREE_LIMIT - 1 && (
                    <p className="text-white/30 text-[9px] tracking-widest uppercase">
                      {FREE_LIMIT - 1 - i} gratuite{FREE_LIMIT - 1 - i > 1 ? "s" : ""}
                    </p>
                  )}
                  <ChevronDown size={16} className="text-white/25 animate-bounce" />
                </div>
              )}
            </div>
          ))}

          {/* Infinite loader */}
          <div ref={loaderRef} className="h-32 flex items-center justify-center">
            {loading && items.length > 0 && (
              <Loader2 size={18} className="animate-spin text-[#c8907a]/50" />
            )}
          </div>
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}
