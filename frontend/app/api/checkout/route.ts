import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

export async function POST(req: NextRequest) {
  const { plan } = await req.json() as { plan: PlanKey };
  const p = PLANS[plan];
  if (!p) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: p.currency,
        unit_amount: p.price,
        product_data: { name: p.label, description: p.description },
      },
      quantity: 1,
    }],
    metadata: { plan },
    success_url: `${APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/?cancelled=1`,
    payment_intent_data: { metadata: { plan } },
  });

  return NextResponse.json({ url: session.url });
}
