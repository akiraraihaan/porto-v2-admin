import { createHmac, timingSafeEqual } from "crypto";
import type { AstroCookies } from "astro";

const SESSION_COOKIE = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 2; // 2 hours

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production" || process.env.CF_WORKERS) {
      throw new Error("SESSION_SECRET is required in production");
    }
    console.warn("[session] SESSION_SECRET not set — using insecure dev fallback");
    return "dev-secret-change-me";
  }
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [userId, signature] = token.split(".");
  if (!userId || !signature) return null;
  const expected = sign(userId);
  const actual = Buffer.from(signature);
  const expectBuf = Buffer.from(expected);
  if (actual.length !== expectBuf.length) return null;
  return timingSafeEqual(actual, expectBuf) ? userId : null;
}

export function getAuthUser(cookies: AstroCookies): string | null {
  const token = cookies.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

const sessionCookieOptionsBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

export function buildSessionCookieOptions(secure: boolean) {
  return { ...sessionCookieOptionsBase, secure };
}

export function buildSessionDeleteOptions(secure: boolean) {
  return { ...sessionCookieOptionsBase, secure, maxAge: 0 };
}
