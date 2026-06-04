"use client";
import { useState, useEffect } from "react";
import { Search, Loader2, Heart, Eye } from "lucide-react";
import { CATEGORIES, ALL_TAGS } from "@/lib/categories";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

type ContentItem = {
  _id: string;
  title?: string;
  files: { url: string; thumbnail?: string; type: string }[];
  stats: { views: number; likes: number };
  creator: { username: string; displayName: string; avatarUrl: string };
  tags?: string[];
  category?: string;
};

type Creator = {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verifiedCreator?: boolean;
  bio?: string;
};

export default function ExplorePage() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [tab, setTab] = useState<"content" | "creators">("content");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, [activeCategory, activeTag, tab]);

  async function load() {
    setLoading(true);
    try {
      if (tab === "content") {
        const params = new URLSearchParams();
        if (activeCategory !== "all") params.set("category", activeCategory);
        if (activeTag) params.set("tag", activeTag);
        const data = await api.get<{ items: ContentItem[] }>(`/api/content/feed?${params}`, token || undefined);
        setItems(data.items || []);
      } else {
        const data = await api.get<{ creators: Creator[] }>(`/api/creators`, token || undefined);
        setCreators(data.creators || []);
      }
    } catch {}
    finally { setLoading(false); }
  }

  const filtered = tab === "content"
    ? items.filter(c =>
        !search ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.creator.username.toLowerCase().includes(search.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : creators.filter(c =>
        !search ||
        c.username.toLowerCase().includes(search.toLowerCase()) ||
        c.displayName.toLowerCase().includes(search.toLowerCase())
      );

  return (
    <div className="page-with-nav px-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white pt-4 mb-4">Explorer</h1>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          className="input pl-10"
          type="text"
          placeholder="Rechercher contenus, créateurs, tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5">
        {(["content", "creators"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t ? "bg-[var(--rose)] text-white" : "text-white/50 hover:text-white"}`}>
            {t === "content" ? "📸 Contenu" : "🌟 Créateurs"}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <>
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4" style={{ scrollbarWidth: "none" }}>
            {Object.entries(CATEGORIES).map(([key, c]) => (
              <button key={key} onClick={() => setActiveCategory(key)}
                className={`pill flex-shrink-0 ${activeCategory === key ? "active" : ""}`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {ALL_TAGS.slice(0, 20).map(t => (
              <button key={t} onClick={() => setActiveTag(activeTag === t.replace("#","") ? "" : t.replace("#",""))}
                className={`tag-chip ${activeTag === t.replace("#","") ? "selected" : ""}`}>
                {t}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[var(--rose)]" />
        </div>
      ) : tab === "content" ? (
        filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">Aucun résultat</p>
          </div>
        ) : (
          <div className="content-grid">
            {(filtered as ContentItem[]).map(c => {
              const file = c.files?.[0];
              return (
                <Link key={c._id} href={`/creator/${c.creator.username}`} className="content-grid-item group block">
                  {file && <img src={file.thumbnail || file.url} alt={c.title || ""} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-2">
                    <p className="text-white text-[10px] font-medium truncate">@{c.creator.username}</p>
                    <div className="flex gap-2 text-white/70 text-[9px] mt-0.5">
                      <span className="flex items-center gap-0.5"><Heart size={8} />{c.stats.likes}</span>
                      <span className="flex items-center gap-0.5"><Eye size={8} />{c.stats.views}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {(filtered as Creator[]).map(c => (
            <Link key={c._id} href={`/creator/${c.username}`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/8 hover:border-white/15 transition">
              <img src={c.avatarUrl || "/default-avatar.svg"} alt={c.displayName}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0 avatar-ring" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white truncate">{c.displayName}</p>
                  {c.verifiedCreator && <span className="badge badge-gold text-[9px]">✓</span>}
                </div>
                <p className="text-sm text-white/40">@{c.username}</p>
                {c.bio && <p className="text-xs text-white/30 mt-1 line-clamp-1">{c.bio}</p>}
              </div>
            </Link>
          ))}
          {(filtered as Creator[]).length === 0 && (
            <div className="text-center py-16 text-white/30">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-sm">Aucun créateur trouvé</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
