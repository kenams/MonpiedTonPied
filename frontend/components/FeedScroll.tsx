"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Lock, Loader2, ChevronDown } from "lucide-react";
import type { PexelsPhoto } from "@/lib/pexels";
import { CATEGORIES } from "@/lib/pexels";
import { FREE_LIMIT } from "@/lib/access";
import PaywallModal from "./PaywallModal";

interface Props {
  initialPhotos: PexelsPhoto[];
  initialCategory: string;
  isPremium: boolean;
}

export default function FeedScroll({ initialPhotos, initialCategory, isPremium }: Props) {
  const [category, setCategory] = useState(initialCategory);
  const [photos, setPhotos] = useState<PexelsPhoto[]>(initialPhotos);
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
      const res = await fetch(`/api/photos?category=${category}&page=${page}`);
      const data: PexelsPhoto[] = await res.json();
      if (data.length > 0) {
        setPhotos(prev => [...prev, ...data]);
        setPage(p => p + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, category, page]);

  // Change category
  async function switchCategory(cat: string) {
    setCategory(cat);
    setPage(2);
    setLoading(true);
    const res = await fetch(`/api/photos?category=${cat}&page=1`);
    const data = await res.json();
    setPhotos(data);
    setLoading(false);
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // Detect scroll past free limit
  useEffect(() => {
    if (isPremium || paywallTriggered) return;
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.round(container.scrollTop / window.innerHeight);
      if (idx >= FREE_LIMIT && !showPaywall) {
        setShowPaywall(true);
        setPaywallTriggered(true);
      }
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [isPremium, paywallTriggered, showPaywall]);

  const isLocked = (index: number) => !isPremium && index >= FREE_LIMIT;

  return (
    <>
      {/* Category bar */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => switchCategory(key)}
              className={`pill flex-shrink-0 ${category === key ? "active" : ""}`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div ref={containerRef} className="feed-container">
        {photos.map((photo, i) => (
          <div key={`${photo.id}-${i}`} className={`feed-item ${isLocked(i) ? "cursor-pointer" : ""}`}
            onClick={() => isLocked(i) && setShowPaywall(true)}>
            {/* Photo */}
            <img
              src={photo.src.large2x}
              alt={photo.alt || ""}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${isLocked(i) ? "blurred" : ""}`}
              loading={i < 3 ? "eager" : "lazy"}
            />

            {/* Gradient bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 gradient-bottom" />

            {/* Lock overlay */}
            {isLocked(i) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="flex flex-col items-center gap-4 fade-up">
                  <div className="w-16 h-16 rounded-full bg-black/60 border border-[#c8907a]/40 flex items-center justify-center">
                    <Lock size={24} className="text-[#c8907a]" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">Contenu verrouillé</p>
                    <p className="text-[#c8907a] text-sm mt-1">Débloquer pour voir la suite</p>
                  </div>
                  <button
                    className="bg-gradient-to-r from-[#c8907a] to-[#9d6552] text-white font-bold px-8 py-3 rounded-full text-sm"
                    onClick={() => setShowPaywall(true)}
                  >
                    Accès illimité dès €4.99
                  </button>
                </div>
              </div>
            )}

            {/* Bottom info */}
            {!isLocked(i) && (
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="pill text-xs opacity-70">
                      {CATEGORIES[category]?.emoji} {CATEGORIES[category]?.label}
                    </span>
                  </div>
                  {i < FREE_LIMIT - 1 && !isPremium && (
                    <div className="text-xs text-white/50 text-right">
                      {FREE_LIMIT - 1 - i} photos<br/>gratuites restantes
                    </div>
                  )}
                </div>
                <div className="flex justify-center mt-4">
                  <ChevronDown size={20} className="text-white/30 animate-bounce" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="h-20 flex items-center justify-center">
          {loading && <Loader2 size={20} className="animate-spin text-[#c8907a]" />}
        </div>
      </div>

      {/* Paywall modal */}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}
