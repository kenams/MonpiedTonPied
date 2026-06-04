"use client";
import { useState } from "react";
import { X, Zap, Crown, Lock, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "./AuthModal";

const PLANS = [
  {
    key: "monthly",
    label: "Mensuel",
    price: "€4.99",
    period: "/mois",
    description: "Accès illimité 30 jours",
    icon: Zap,
    badge: "Populaire",
    color: "from-[var(--rose)] to-[var(--rose-dark)]",
  },
  {
    key: "annual",
    label: "Annuel",
    price: "€29.99",
    period: "/an",
    description: "Économise €29.89 · €2.50/mois",
    icon: Crown,
    badge: "Meilleur deal",
    color: "from-[#a06a88] to-[#6d3d5a]",
  },
];

const FEATURES = [
  "Accès illimité à tout le contenu",
  "Qualité HD sans compression",
  "Nouvelles publications quotidiennes",
  "Messagerie avec les créateurs",
  "Favoris & collections privées",
  "Annulable à tout moment",
];

export default function PaywallModal({ onClose }: { onClose: () => void }) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  async function checkout(plan: string) {
    if (!user) { setShowAuth(true); return; }
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { } finally { setLoading(null); }
  }

  if (showAuth) return <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 modal-bg" onClick={onClose} />
      <div className="relative w-full max-w-sm glass rounded-3xl p-6 fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white transition">
          <X size={15} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[var(--rose)]/15 border border-[var(--rose)]/30 flex items-center justify-center mx-auto mb-3">
            <Lock size={20} className="text-[var(--rose)]" />
          </div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>
            Accès Premium
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Débloquez tout le contenu des créateurs
          </p>
        </div>

        {/* Features */}
        <div className="mb-5 space-y-2">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[var(--rose)]/20 flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-[var(--rose)]" />
              </div>
              <span className="text-sm text-white/70">{f}</span>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="flex flex-col gap-3">
          {PLANS.map(plan => (
            <button
              key={plan.key}
              onClick={() => checkout(plan.key)}
              disabled={!!loading}
              className={`relative overflow-hidden rounded-2xl p-4 text-left transition hover:opacity-90 disabled:opacity-50 bg-gradient-to-r ${plan.color}`}
            >
              <div className="absolute top-2 right-3 bg-black/30 rounded-full px-2 py-0.5 text-[10px] text-white font-semibold">
                {plan.badge}
              </div>
              <div className="flex items-center gap-3">
                <plan.icon size={18} className="text-white" />
                <div>
                  <p className="text-white font-bold text-sm">{plan.label}</p>
                  <p className="text-white/70 text-xs">{plan.description}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-white font-black text-lg">{plan.price}</span>
                  <span className="text-white/60 text-xs">{plan.period}</span>
                </div>
              </div>
              {loading === plan.key && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-white/25 mt-4">
          Paiement sécurisé Stripe · Annulable à tout moment
        </p>
      </div>
    </div>
  );
}
