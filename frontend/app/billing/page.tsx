"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Crown, Zap, Check, Loader2, ExternalLink, AlertCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import PaywallModal from "@/components/PaywallModal";

type BillingStatus = {
  subscriptionActive: boolean;
  subscriptionExpiresAt?: string;
  accessPassActive: boolean;
  accessPassExpiresAt?: string;
  premiumAccess: boolean;
  passPrice: number;
  subscriptionPrice: number;
};

export default function BillingPage() {
  const { user, token, loading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    api.get<BillingStatus>("/api/billing/status", token!)
      .then(d => setStatus(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const data = await api.post<{ url: string }>("/api/stripe/portal", {}, token!);
      if (data.url) window.location.href = data.url;
    } catch {}
    finally { setPortalLoading(false); }
  }

  if (authLoading || loading) return (
    <div className="min-h-dvh flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-[var(--rose)]" />
    </div>
  );

  return (
    <>
      <div className="page-with-nav px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3 py-4 mb-6">
          <Link href="/profile" className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white transition">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-white">Abonnement</h1>
        </div>

        {/* Current status */}
        <div className={`p-5 rounded-3xl mb-6 border ${isPremium ? "bg-gradient-to-br from-[var(--rose)]/15 to-[#6d3d5a]/10 border-[var(--rose)]/30" : "bg-white/5 border-white/10"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPremium ? "bg-[var(--rose)]/20" : "bg-white/10"}`}>
              <Crown size={18} className={isPremium ? "text-[var(--rose)]" : "text-white/40"} />
            </div>
            <div>
              <p className="text-base font-bold text-white">{isPremium ? "Premium actif" : "Plan gratuit"}</p>
              {status?.subscriptionActive && status.subscriptionExpiresAt && (
                <p className="text-xs text-white/40">
                  Renouvellement le {new Date(status.subscriptionExpiresAt).toLocaleDateString("fr-FR")}
                </p>
              )}
              {status?.accessPassActive && status.accessPassExpiresAt && (
                <p className="text-xs text-white/40">
                  Expire le {new Date(status.accessPassExpiresAt).toLocaleDateString("fr-FR")}
                </p>
              )}
              {!isPremium && (
                <p className="text-xs text-white/40">5 contenus gratuits · puis paywall</p>
              )}
            </div>
          </div>

          {isPremium ? (
            <div className="space-y-2">
              {["Accès illimité à tout le contenu", "HD sans compression", "Messagerie avec les créateurs", "Favoris & collections"].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={13} className="text-[var(--rose)]" />
                  <span className="text-sm text-white/70">{f}</span>
                </div>
              ))}
            </div>
          ) : (
            <button onClick={() => setShowPaywall(true)} className="btn-primary w-full mt-3 rounded-2xl">
              <Crown size={16} />
              Passer Premium
            </button>
          )}
        </div>

        {/* Manage subscription */}
        {isPremium && (
          <div className="mb-6">
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-white">Gérer l&apos;abonnement</p>
                <p className="text-xs text-white/40">Annuler, changer de plan, historique</p>
              </div>
              {portalLoading ? <Loader2 size={16} className="animate-spin text-white/40" /> : <ExternalLink size={16} className="text-white/30" />}
            </button>
          </div>
        )}

        {/* Plans */}
        {!isPremium && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white/60 mb-2">Choisir un plan</p>
            {[
              { key: "monthly", label: "Mensuel", price: "€4.99/mois", desc: "Accès illimité 30 jours · renouvellement auto", badge: "Populaire", color: "from-[var(--rose)] to-[var(--rose-dark)]" },
              { key: "annual", label: "Annuel", price: "€29.99/an", desc: "Économise €29.89 · soit €2.50/mois", badge: "Meilleur deal", color: "from-[#a06a88] to-[#6d3d5a]" },
            ].map(p => (
              <button key={p.key} onClick={() => setShowPaywall(true)}
                className={`w-full relative overflow-hidden rounded-2xl p-4 text-left bg-gradient-to-r ${p.color} hover:opacity-90 transition`}>
                <div className="absolute top-2 right-3 bg-black/30 rounded-full px-2 py-0.5 text-[10px] text-white font-semibold">{p.badge}</div>
                <p className="text-white font-bold">{p.label} — {p.price}</p>
                <p className="text-white/70 text-xs mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Legal */}
        <div className="mt-8 pt-6 border-t border-white/8 space-y-2">
          <p className="text-xs text-white/25 text-center">Paiement sécurisé via Stripe · Annulable à tout moment · TVA incluse</p>
        </div>
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  );
}
