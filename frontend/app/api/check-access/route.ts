import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/access";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ valid: false });
  const payload = await verifyAccessToken(token);
  return NextResponse.json({ valid: !!payload, payload });
}
