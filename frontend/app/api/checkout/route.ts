import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002";

const PLANS: Record<string, { label: string; price: number; currency: string; description: string; mode: "payment" | "subscription" }> = {
  monthly: {
    label: "Arcane Feet Premium — Mensuel",
    price: 499,
    currency: "eur",
    description: "Accès illimité 30 jours · renouvellement auto",
    mode: "subscription",
  },
  annual: {
    label: "Arcane Feet Premium — Annuel",
    price: 2999,
    currency: "eur",
    description: "Accès illimité 12 mois · économise €29.89",
    mode: "subscription",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json() as { plan: string };
    const p = PLANS[plan];
    if (!p) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

    const stripe = getStripe();

    const priceId = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_ID`];

    let session;
    if (priceId) {
      session = await stripe.checkout.sessions.create({
        mode: p.mode,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { plan },
        success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/?cancelled=1`,
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: p.mode === "subscription" ? "subscription" : "payment",
        line_items: [{
          price_data: {
            currency: p.currency,
            unit_amount: p.price,
            product_data: { name: p.label, description: p.description },
            ...(p.mode === "subscription" ? { recurring: { interval: plan === "annual" ? "year" : "month" } } : {}),
          },
          quantity: 1,
        }],
        metadata: { plan },
        success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_URL}/?cancelled=1`,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
