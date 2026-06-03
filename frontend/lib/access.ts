import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.ACCESS_SECRET ?? "arcane-feet-secret-2026");

export type AccessPayload = {
  type: "monthly" | "lifetime";
  exp?: number;
};

export async function createAccessToken(type: "monthly" | "lifetime"): Promise<string> {
  const exp = type === "monthly" ? Math.floor(Date.now() / 1000) + 30 * 24 * 3600 : undefined;
  const jwt = await new SignJWT({ type })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp ?? "100y")
    .sign(SECRET);
  return jwt;
}

export async function verifyAccessToken(token: string): Promise<AccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as AccessPayload;
  } catch {
    return null;
  }
}

export const FREE_LIMIT = 6;
