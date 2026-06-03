import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export const PLANS = {
  monthly: {
    label: "Accès Mensuel",
    price: 499,
    currency: "eur",
    description: "30 jours d'accès illimité",
    badge: "Populaire",
  },
  lifetime: {
    label: "Accès à Vie",
    price: 2499,
    currency: "eur",
    description: "Accès permanent + demandes customs",
    badge: "Meilleur deal",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
