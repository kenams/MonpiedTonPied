import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export const PLANS = {
  monthly: {
    label: "Mensuel",
    price: 499,
    currency: "eur",
    description: "30 jours · renouvellement auto",
    badge: "Populaire",
  },
  annual: {
    label: "Annuel",
    price: 1999,
    currency: "eur",
    description: "12 mois · économise €39.89",
    badge: "Meilleur deal",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
