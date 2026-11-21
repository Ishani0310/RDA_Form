import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentOfficerSession } from "@/lib/auth";
import { getGoogleOAuthClient } from "@/lib/gmail-oauth";

/**
 * GET /api/admin/gmail/auth
 * Initiates the Google OAuth 2.0 authorization code flow.
 * - Requires active RDA Officer / Administrator session.
 * - Protects against CSRF with cryptographically signed state token.
 * - Requests offline access with explicit consent to acquire a refresh token.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/settings?tab=email");
      return NextResponse.redirect(loginUrl);
    }

    const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

    if (!clientId || !clientSecret) {
      const settingsUrl = new URL("/settings", request.url);
      settingsUrl.searchParams.set("error", "missing_google_client_credentials");
      return NextResponse.redirect(settingsUrl);
    }

    const requestOrigin = request.nextUrl.origin;
    const oauth2Client = getGoogleOAuthClient(requestOrigin);

    // Cryptographically secure state parameter to defend against CSRF attacks
    const stateToken = crypto.randomBytes(32).toString("hex");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Force consent so Google guarantees issuing a refresh token
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state: stateToken,
    });

    const response = NextResponse.redirect(authUrl);

    // Store state in an HTTP-only secure cookie for validation in the callback
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("gmail_oauth_state", stateToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error("[GmailAuth] Initiation error:", error);
    const settingsUrl = new URL("/settings", request.url);
    settingsUrl.searchParams.set("error", "oauth_initiation_failed");
    return NextResponse.redirect(settingsUrl);
  }
}
