import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { session_id } = await req.json();
  if (!session_id) return NextResponse.json({ valid: false });

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.json({ valid: false });
    }
    const plan = session.metadata?.plan ?? "monthly";
    return NextResponse.json({ valid: true, plan });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
