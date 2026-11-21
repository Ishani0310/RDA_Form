import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCurrentOfficerSession } from "@/lib/auth";
import {
  getGoogleOAuthClient,
  getAppBaseUrl,
  saveStoredGmailCredentials,
  getStoredGmailCredentials,
} from "@/lib/gmail-oauth";
import { recordActivityLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limiter";

/**
 * GET /api/admin/gmail/callback
 * Handles the Google OAuth 2.0 authorization code redirect.
 * - Validates CSRF state against HTTP-only cookie.
 * - Exchanges authorization code for tokens (specifically refresh_token).
 * - Identifies authorized Gmail address.
 * - Stores credentials securely in MongoDB for non-blocking email dispatch.
 * - Verifies storage before redirecting to prevent false "Connected" statuses.
 * - Strictly guarantees redirects to production domain (never internal container ports like localhost:8080).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = getAppBaseUrl(request);
  const settingsUrl = new URL("/settings", baseUrl);
  settingsUrl.searchParams.set("tab", "email");

  const cookieState = request.cookies.get("gmail_oauth_state")?.value;

  // Clear the state cookie on any outcome
  const response = (destUrl: URL) => {
    const res = NextResponse.redirect(destUrl);
    res.cookies.set("gmail_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  };

  if (error) {
    console.warn("[GmailCallback] Google OAuth returned error:", error);
    settingsUrl.searchParams.set("error", error === "access_denied" ? "consent_denied" : error);
    return response(settingsUrl);
  }

  // CSRF validation
  if (!state || !cookieState || state !== cookieState) {
    console.error("[GmailCallback] State validation failed. Possible CSRF attempt.");
    settingsUrl.searchParams.set("error", "csrf_validation_failed");
    return response(settingsUrl);
  }

  if (!code) {
    settingsUrl.searchParams.set("error", "missing_authorization_code");
    return response(settingsUrl);
  }

  try {
    const oauth2Client = getGoogleOAuthClient(request);

    // Exchange authorization code for OAuth tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens || !tokens.access_token) {
      throw new Error("token_exchange_empty_response");
    }

    oauth2Client.setCredentials(tokens);

    // Retrieve sender email address
    let senderEmail = (process.env.GOOGLE_SENDER_EMAIL || "").trim();
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) {
        senderEmail = userInfo.data.email;
      }
    } catch (infoErr) {
      console.warn("[GmailCallback] Could not fetch userinfo profile:", infoErr);
    }

    if (!senderEmail) {
      senderEmail = "wbicdpbid@gmail.com";
    }

    const session = await getCurrentOfficerSession();
    const performerName = session?.fullName || "RDA Officer";

    // Handle refresh token
    let storedRefreshToken = tokens.refresh_token;

    if (!storedRefreshToken) {
      // Check if we already have an existing refresh token in MongoDB or environment
      const existing = await getStoredGmailCredentials();
      if (existing && existing.refreshToken) {
        storedRefreshToken = existing.refreshToken;
        console.log("[GmailCallback] Preserving existing refresh token for re-authorized session.");
      } else {
        console.error("[GmailCallback] No refresh token returned by Google and none exists in storage.");
        settingsUrl.searchParams.set("error", "missing_refresh_token_reauth_required");
        return response(settingsUrl);
      }
    }

    // Persist refresh token securely in MongoDB
    await saveStoredGmailCredentials(
      {
        refreshToken: storedRefreshToken,
        senderEmail,
        expiryDate: tokens.expiry_date,
        scope: tokens.scope,
      },
      performerName
    );

    // VERIFY STORAGE: Ensure the credentials can actually be read back from the database
    const verifyStorage = await getStoredGmailCredentials();
    if (!verifyStorage || !verifyStorage.refreshToken) {
      console.error("[GmailCallback] Token storage verification failed: could not retrieve token from MongoDB.");
      settingsUrl.searchParams.set("error", "database_storage_verification_failed");
      return response(settingsUrl);
    }

    // Record tamper-evident audit event
    await recordActivityLog({
      action: "GMAIL_OAUTH_CONNECTED",
      performerName,
      performerRole: session?.role || "SUPER_ADMIN",
      targetType: "System",
      targetId: "GMAIL_OAUTH_CONFIG",
      description: `Gmail API authorized and verified successfully for account ${senderEmail}`,
      ipAddress: getClientIp(request),
      metadata: {
        senderEmail,
        credentialSource: verifyStorage.source,
        hasRefreshToken: true,
        scope: tokens.scope,
      },
    });

    console.log(`[GmailCallback] Gmail API successfully connected and verified as ${senderEmail}`);

    // Set success query params ONLY after token exchange and DB verification succeed
    settingsUrl.searchParams.set("status", "connected");
    settingsUrl.searchParams.set("sender", senderEmail);
    return response(settingsUrl);
  } catch (err: any) {
    console.error("[GmailCallback] Exception during token exchange:", err);
    settingsUrl.searchParams.set("error", err?.message || "token_exchange_failed");
    return response(settingsUrl);
  }
}
