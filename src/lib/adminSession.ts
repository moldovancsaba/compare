import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "cs_admin";

function getSecret(): string {
  const fromSession = process.env.ADMIN_SESSION_SECRET?.trim();
  const fromAdmin = process.env.ADMIN_PASSWORD?.trim();
  return fromSession || fromAdmin || "";
}

export function signAdminSession(): string {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_PASSWORD or ADMIN_SESSION_SECRET must be set");
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const nonce = randomBytes(8).toString("hex");
  const payload = Buffer.from(JSON.stringify({ exp, nonce })).toString("base64url");
  const mac = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

export function verifyAdminSession(token: string | undefined): boolean {
  const secret = getSecret();
  if (!token || !secret) return false;
  const i = token.lastIndexOf(".");
  if (i === -1) return false;
  const payload = token.slice(0, i);
  const mac = token.slice(i + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  try {
    if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  } catch {
    return false;
  }
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function readAdminCookie(): Promise<boolean> {
  const jar = await cookies();
  return verifyAdminSession(jar.get(COOKIE)?.value);
}

export async function setAdminCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, maxAge: 0, path: "/" });
}

export { COOKIE as ADMIN_COOKIE_NAME };
