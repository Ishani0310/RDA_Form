import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  OfficerSessionPayload,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "./session";

export * from "./session";

/**
 * Retrieve the current officer session from Next.js server cookies
 */
export async function getCurrentOfficerSession(): Promise<OfficerSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  return await verifySessionToken(sessionCookie.value);
}

/**
 * Password Hashing with Bcrypt (Salt rounds = 12)
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 12);
}

/**
 * Secure password verification
 */
export async function verifyPassword(
  plainText: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainText, hashedPassword);
}
