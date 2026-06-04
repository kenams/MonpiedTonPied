"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, DollarSign, Eye, Heart, Upload, Settings,
  Users, Star, ExternalLink, Loader2, AlertCircle, CheckCircle
} from "lucide-react";

type Stats = {
  totalRevenue: number;
  thisMonthRevenue: number;
  totalViews: number;
  totalLikes: number;
  totalSubscribers: number;
  contentCount: number;
  pendingPayout: number;
};

type ContentItem = {
  _id: string;
  title: string;
  files: { url: string; thumbnail?: string; type: string }[];
  stats: { views: number; likes: number };
  createdAt: string;
  price?: number;
};

export default function DashboardPage() {
  const { user, token, isCreator, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (!isCreator) { router.push("/"); return; }
    loadData();
  }, [user, isCreator, authLoading]);

  async function loadData() {
    try {
      const [statsData, contentData] = await Promise.all([
        api.get<Stats>("/api/dashboard/stats", token!),
        api.get<{ items: ContentItem[] }>("/api/content?mine=true", token!),
      ]);
      setStats(statsData);
      setContents(contentData.items || []);
    } catch {}
    finally { setLoadingData(false); }
  }

  async function connectStripe() {
    try {
      const data = await api.post<{ url: string }>("/api/stripe/connect/onboard", {}, token!);
      if (data.url) window.location.href = data.url;
    } catch {}
  }

  if (authLoading || loadingData) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
      </div>
    );
  }

  const stripeConnected = user?.stripeConnectChargesEnabled;

  return (
    <div className="page-with-nav px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40">@{user?.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/upload" className="btn-primary py-2 px-4 text-sm rounded-full">
            <Upload size={14} />
            Publier
          </Link>
          <Link href="/profile/settings" className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white transition">
            <Settings size={16} />
          </Link>
        </div>
      </div>

      {/* Stripe alert */}
      {!stripeConnected && (
        <div className="mb-4 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Configurez vos paiements</p>
              <p className="text-xs text-amber-400/70 mt-0.5 mb-3">Connectez Stripe pour recevoir vos revenus</p>
              <button onClick={connectStripe} className="btn-primary py-2 px-4 text-xs rounded-full bg-amber-500 hover:bg-amber-400" style={{ background: "#f59e0b" }}>
                Connecter Stripe
              </button>
            </div>
          </div>
        </div>
      )}

      {stripeConnected && (
        <div className="mb-4 p-3 rounded-2xl border border-[var(--green)]/20 bg-[var(--green)]/5 flex items-center gap-2">
          <CheckCircle size={16} className="text-[var(--green)]" />
          <p className="text-sm text-[var(--green)]/80">Paiements Stripe actifs</p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Revenus ce mois", value: `€${((stats?.thisMonthRevenue || 0) / 100).toFixed(2)}`, icon: DollarSign, color: "text-[var(--rose)]" },
          { label: "Revenus total", value: `€${((stats?.totalRevenue || 0) / 100).toFixed(2)}`, icon: TrendingUp, color: "text-[var(--gold)]" },
          { label: "Vues", value: (stats?.totalViews || 0).toLocaleString(), icon: Eye, color: "text-blue-400" },
          { label: "Likes", value: (stats?.totalLikes || 0).toLocaleString(), icon: Heart, color: "text-red-400" },
          { label: "Abonnés", value: (stats?.totalSubscribers || 0).toLocaleString(), icon: Users, color: "text-purple-400" },
          { label: "Publications", value: (stats?.contentCount || 0).toLocaleString(), icon: Star, color: "text-amber-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <Icon size={16} className={`${color} mb-2`} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Payout pending */}
      {(stats?.pendingPayout || 0) > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[var(--rose)]/10 to-transparent border border-[var(--rose)]/20">
          <p className="text-xs text-[var(--rose)]/70 mb-1">En attente de versement</p>
          <p className="text-2xl font-bold text-white">€{((stats?.pendingPayout || 0) / 100).toFixed(2)}</p>
          <p className="text-xs text-white/30 mt-1">Versement automatique · Stripe Connect</p>
        </div>
      )}

      {/* Link to public profile */}
      <Link
        href={`/creator/${user?.username}`}
        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/8 hover:border-white/15 transition mb-6"
      >
        <div>
          <p className="text-sm font-medium text-white">Voir mon profil public</p>
          <p className="text-xs text-white/40">arcane-feet.vercel.app/creator/{user?.username}</p>
        </div>
        <ExternalLink size={16} className="text-white/30" />
      </Link>

      {/* Recent content */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Mes publications</h2>
          {contents.length > 0 && (
            <Link href="/dashboard/upload" className="text-xs text-[var(--rose)] hover:underline">+ Nouvelle</Link>
          )}
        </div>

        {contents.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <p className="text-4xl mb-3">📸</p>
            <p className="text-sm text-white/50 mb-4">Aucune publication pour l&apos;instant</p>
            <Link href="/dashboard/upload" className="btn-primary py-2.5 px-6 text-sm rounded-full">
              <Upload size={14} />
              Publier mon premier contenu
            </Link>
          </div>
        ) : (
          <div className="content-grid">
            {contents.map(c => {
              const file = c.files?.[0];
              return (
                <div key={c._id} className="content-grid-item group">
                  {file && (
                    file.type?.startsWith("video") ? (
                      <video src={file.url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={file.thumbnail || file.url} alt={c.title} />
                    )
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                    <div className="flex items-center gap-3 text-white text-xs">
                      <span className="flex items-center gap-1"><Eye size={11} />{c.stats.views}</span>
                      <span className="flex items-center gap-1"><Heart size={11} />{c.stats.likes}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
