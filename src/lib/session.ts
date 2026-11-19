import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import {
  OfficerRole,
  OfficerSessionPayload,
  SESSION_COOKIE_NAME,
} from "./auth-types";

export * from "./auth-types";

const SESSION_EXPIRATION_SECONDS = 8 * 60 * 60; // 8 hours (standard RDA shift)

// Secret key derivation (min 32 bytes for HS256)
export function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "rda-sri-lanka-gov-sec-auth-token-key-2026-fallback-dev";
  return new TextEncoder().encode(secret);
}

/**
 * Sign a new JWT session token for an authenticated officer
 */
export async function signSessionToken(
  payload: Omit<OfficerSessionPayload, "iat" | "exp" | "nbf">
): Promise<string> {
  const secret = getAuthSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Verify and decode an incoming JWT session token (Edge & Node compatible)
 */
export async function verifySessionToken(
  token: string
): Promise<OfficerSessionPayload | null> {
  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as OfficerSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Standard HTTP-only cookie configuration for Next.js
 */
export function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_EXPIRATION_SECONDS,
  };
}
