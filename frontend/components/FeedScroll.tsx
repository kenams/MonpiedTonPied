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

  async function switchCategory(cat: string) {
    if (cat === category) return;
    setCategory(cat);
    setPage(2);
    setLoading(true);
    setPaywallTriggered(false);
    const res = await fetch(`/api/photos?category=${cat}&page=1`);
    const data = await res.json();
    setPhotos(data);
    setLoading(false);
    containerRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
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

  const isLocked = (index: number) => !isPremium && index >= FREE_LIMIT;
  const cat = CATEGORIES[category];

  return (
    <>
      {/* Category bar — sticky top */}
      <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pt-safe-top">
        <div
          className="flex items-center gap-2 overflow-x-auto px-4 py-3 w-full max-w-sm"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {Object.entries(CATEGORIES).map(([key, c]) => (
            <button
              key={key}
              onClick={() => switchCategory(key)}
              className={`pill flex-shrink-0 ${category === key ? "active" : ""}`}
            >
              <span>{c.emoji}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed — centré max-w-sm */}
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="feed-container w-full"
          style={{ maxWidth: "480px" }}
        >
          {loading && photos.length === 0 ? (
            <div className="feed-item flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-[#c8907a]" />
            </div>
          ) : (
            photos.map((photo, i) => (
              <div
                key={`${photo.id}-${i}`}
                className="feed-item"
                onClick={() => isLocked(i) && setShowPaywall(true)}
                style={{ cursor: isLocked(i) ? "pointer" : "default" }}
              >
                {/* Photo — centrée, focus bas pour les pieds */}
                <img
                  src={photo.width > photo.height ? photo.src.large : photo.src.large2x}
                  alt={photo.alt || `${cat?.label} feet`}
                  className={`absolute inset-0 w-full h-full transition-all duration-500 ${isLocked(i) ? "blurred" : ""}`}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center 70%",
                  }}
                  loading={i < 3 ? "eager" : "lazy"}
                />

                {/* Gradient haut */}
                <div className="absolute top-0 left-0 right-0 h-32 gradient-top pointer-events-none" />

                {/* Gradient bas */}
                <div className="absolute bottom-0 left-0 right-0 h-48 gradient-bottom pointer-events-none" />

                {/* Badge catégorie — haut gauche */}
                {!isLocked(i) && (
                  <div className="absolute top-14 left-4 z-10">
                    <span className="pill text-xs" style={{ background: "rgba(8,8,8,0.6)", backdropFilter: "blur(6px)" }}>
                      {cat?.emoji} {cat?.label} / {cat?.labelEn}
                    </span>
                  </div>
                )}

                {/* Lock overlay */}
                {isLocked(i) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-4 fade-up px-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-black/60 border border-[#c8907a]/40 flex items-center justify-center">
                        <Lock size={22} className="text-[#c8907a]" />
                      </div>
                      <p className="text-white font-bold text-lg">Contenu verrouillé</p>
                      <p className="text-[#c8907a] text-sm">Débloquez pour continuer</p>
                      <button
                        className="bg-gradient-to-r from-[#c8907a] to-[#9d6552] text-white font-bold px-8 py-3 rounded-full text-sm shadow-lg"
                        onClick={() => setShowPaywall(true)}
                      >
                        Accès illimité — dès €4.99
                      </button>
                    </div>
                  </div>
                )}

                {/* Bas — compteur gratuit + chevron */}
                {!isLocked(i) && (
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex flex-col items-center gap-2">
                    {!isPremium && i < FREE_LIMIT - 1 && (
                      <p className="text-white/40 text-[10px] tracking-widest uppercase">
                        {FREE_LIMIT - 1 - i} photo{FREE_LIMIT - 1 - i > 1 ? "s" : ""} gratuites restantes
                      </p>
                    )}
                    <ChevronDown size={18} className="text-white/30 animate-bounce" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loader infinite scroll */}
          <div ref={loaderRef} className="h-24 flex items-center justify-center">
            {loading && photos.length > 0 && (
              <Loader2 size={20} className="animate-spin text-[#c8907a]" />
            )}
          </div>
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}
