"use client";
import { useState } from "react";
import { X, Zap, Infinity, Star, Lock } from "lucide-react";
import type { PlanKey } from "@/lib/stripe";

const PLANS_UI = [
  {
    key: "monthly" as PlanKey,
    label: "Mensuel",
    price: "€4.99",
    period: "/mois",
    description: "Accès illimité 30 jours",
    icon: Zap,
    badge: "Populaire",
    color: "from-[#c8907a] to-[#9d6552]",
  },
  {
    key: "lifetime" as PlanKey,
    label: "À Vie",
    price: "€24.99",
    period: " une fois",
    description: "Accès permanent + customs",
    icon: Infinity,
    badge: "Meilleur deal",
    color: "from-[#a06a88] to-[#6d3d5a]",
  },
];

export default function PaywallModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<PlanKey | null>(null);

  async function checkout(plan: PlanKey) {
    setLoading(plan);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    setLoading(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 modal-bg" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-3xl p-6 fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/50 hover:text-white transition">
          <X size={15} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#c8907a]/15 border border-[#c8907a]/30 flex items-center justify-center mx-auto mb-3">
            <Lock size={20} className="text-[#c8907a]" />
          </div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>
            Accès illimité
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Galerie complète · HD · Nouvelles photos chaque jour
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {["Illimité", "Haute Def", "Exclusif"].map((f) => (
            <div key={f} className="bg-white/5 rounded-xl p-2 text-center">
              <Star size={12} className="text-[#c8907a] mx-auto mb-1" />
              <p className="text-xs text-white/70">{f}</p>
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="flex flex-col gap-3">
          {PLANS_UI.map((plan) => (
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
