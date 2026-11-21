import { google } from "googleapis";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { SystemSetting } from "@/models/SystemSetting";

export interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  senderEmail: string;
  source: "env" | "database";
}

/**
 * Resolves the absolute application public base URL.
 * Strictly prevents internal container addresses (e.g. localhost:8080, 0.0.0.0, 127.0.0.1:8080) from leaking in production.
 */
export function getAppBaseUrl(request?: NextRequest | string): string {
  // 1. Explicitly configured public application URL (highest priority)
  const envAppUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    ""
  ).trim();
  if (envAppUrl && !envAppUrl.includes("localhost:8080") && !envAppUrl.includes("127.0.0.1:8080")) {
    return envAppUrl.replace(/\/+$/, "");
  }

  // 2. Derive origin from GOOGLE_REDIRECT_URI if set
  const envRedirectUri = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (envRedirectUri && !envRedirectUri.includes("localhost:8080") && !envRedirectUri.includes("127.0.0.1:8080")) {
    try {
      const parsed = new URL(envRedirectUri);
      return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, "");
    } catch {
      // ignore parse failure
    }
  }

  // 3. Railway-provided public domain environment variables
  const railwayDomain = (process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || "").trim();
  if (railwayDomain && !railwayDomain.includes("localhost:8080")) {
    const cleanDomain = railwayDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return `https://${cleanDomain}`;
  }

  // 4. Extract from incoming NextRequest headers (behind Railway / edge reverse proxies)
  if (request && typeof request !== "string") {
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

    if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }

    const hostHeader = request.headers.get("host")?.trim();
    if (hostHeader && !hostHeader.includes("localhost") && !hostHeader.includes("127.0.0.1")) {
      return `${forwardedProto}://${hostHeader}`.replace(/\/+$/, "");
    }

    const origin = request.nextUrl?.origin;
    if (origin && !origin.includes("localhost:8080") && !origin.includes("127.0.0.1:8080")) {
      if (process.env.NODE_ENV !== "production" || (!origin.includes("localhost") && !origin.includes("127.0.0.1"))) {
        return origin.replace(/\/+$/, "");
      }
    }
  } else if (typeof request === "string" && request.startsWith("http")) {
    try {
      const parsed = new URL(request);
      if (!parsed.host.includes("localhost:8080") && !parsed.host.includes("127.0.0.1:8080")) {
        if (process.env.NODE_ENV !== "production" || (!parsed.host.includes("localhost") && !parsed.host.includes("127.0.0.1"))) {
          return `${parsed.protocol}//${parsed.host}`.replace(/\/+$/, "");
        }
      }
    } catch {
      // ignore
    }
  }

  // 5. Production Railway fallback (guarantees official production domain is used rather than container port 8080)
  if (process.env.NODE_ENV === "production") {
    return "https://rdaform-production.up.railway.app";
  }

  // 6. Local development fallback
  return "http://localhost:3000";
}

/**
 * Derives the active Google OAuth2 redirect URI based on environment or request
 */
export function getGoogleRedirectUri(request?: NextRequest | string): string {
  const envUri = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (envUri && !envUri.includes("localhost:8080")) {
    return envUri;
  }

  const baseUrl = getAppBaseUrl(request);
  return `${baseUrl}/api/admin/gmail/callback`;
}

/**
 * Returns an unauthenticated or partially configured OAuth2 client
 */
export function getGoogleOAuthClient(request?: NextRequest | string) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const redirectUri = getGoogleRedirectUri(request);

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Retrieves valid Gmail credentials from environment variables (first priority)
 * or MongoDB SystemSetting collection (second priority).
 */
export async function getStoredGmailCredentials(): Promise<GmailCredentials | null> {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const redirectUri = getGoogleRedirectUri();

  if (!clientId || !clientSecret) {
    return null;
  }

  // 1. Check environment variables (e.g. Railway production configuration)
  const envRefreshToken = (process.env.GOOGLE_REFRESH_TOKEN || "").trim();
  const envSenderEmail = (process.env.GOOGLE_SENDER_EMAIL || "").trim();

  if (envRefreshToken) {
    return {
      clientId,
      clientSecret,
      redirectUri,
      refreshToken: envRefreshToken,
      senderEmail: envSenderEmail || "wbicdpbid@gmail.com",
      source: "env",
    };
  }

  // 2. Check MongoDB persistent storage
  try {
    await connectToDatabase();
    const setting = await SystemSetting.findOne({ key: "GMAIL_OAUTH_CONFIG" }).lean();
    if (setting && (setting as any).value?.refreshToken) {
      const val = (setting as any).value;
      return {
        clientId,
        clientSecret,
        redirectUri,
        refreshToken: String(val.refreshToken).trim(),
        senderEmail: String(val.senderEmail || envSenderEmail || "wbicdpbid@gmail.com").trim(),
        source: "database",
      };
    }
  } catch (err) {
    console.error("[GmailOAuth] Failed to query stored Gmail credentials from MongoDB:", err);
  }

  return null;
}

/**
 * Persists newly granted Gmail refresh token & sender email into MongoDB
 */
export async function saveStoredGmailCredentials(
  data: {
    refreshToken: string;
    senderEmail?: string;
    expiryDate?: number | null;
    scope?: string;
  },
  updatedBy: string = "Admin"
): Promise<void> {
  await connectToDatabase();
  await SystemSetting.findOneAndUpdate(
    { key: "GMAIL_OAUTH_CONFIG" },
    {
      $set: {
        key: "GMAIL_OAUTH_CONFIG",
        value: {
          refreshToken: data.refreshToken.trim(),
          senderEmail: (data.senderEmail || "").trim(),
          expiryDate: data.expiryDate || null,
          scope: data.scope || null,
          connectedAt: new Date().toISOString(),
        },
        description: "Google OAuth 2.0 authorized Gmail API refresh token for RDA ICDP notifications",
        updatedBy,
      },
    },
    { upsert: true, new: true }
  );
}

/**
 * Revokes and deletes stored credentials from MongoDB
 */
export async function clearStoredGmailCredentials(updatedBy: string = "Admin"): Promise<void> {
  await connectToDatabase();
  await SystemSetting.deleteOne({ key: "GMAIL_OAUTH_CONFIG" });
}

/**
 * Creates an RFC 2822 / RFC 2047 compliant multipart/alternative MIME message
 * and returns it base64url-encoded for the Gmail API.
 */
export function createRawEmailMessage(params: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): string {
  const boundary = `__rda_boundary_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}__`;

  // RFC 2047 Base64 Subject Encoding to preserve UTF-8 characters cleanly
  const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject, "utf-8").toString("base64")}?=`;

  const lines = [
    `From: ${params.from}`,
    `To: ${params.to.trim()}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    params.text,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    params.html,
    ``,
    `--${boundary}--`,
  ];

  const rawMessage = lines.join("\r\n");

  // Gmail API requires URL-safe Base64 without padding (=)
  return Buffer.from(rawMessage, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Dispatches an email via the authorized Gmail API
 */
export async function sendEmailViaGmailApi(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  customFrom?: string;
}): Promise<{
  success: boolean;
  messageId?: string;
  provider: "gmail";
  sentTo: string;
  error?: string;
}> {
  const creds = await getStoredGmailCredentials();

  if (!creds || !creds.refreshToken) {
    return {
      success: false,
      provider: "gmail",
      sentTo: params.to,
      error: "Gmail API is not authorized. Missing OAuth Client ID, Secret, or Refresh Token.",
    };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      creds.clientId,
      creds.clientSecret,
      creds.redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: creds.refreshToken,
    });

    const senderEmail = creds.senderEmail || "wbicdpbid@gmail.com";
    const fromHeader = params.customFrom || `"Road Development Authority (ICDP)" <${senderEmail}>`;

    const raw = createRawEmailMessage({
      to: params.to,
      from: fromHeader,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw },
    });

    const messageId = response.data.id || undefined;
    console.log(`[GmailService] Confirmation email sent via Gmail API to ${params.to}. MessageId: ${messageId}`);

    return {
      success: true,
      messageId,
      provider: "gmail",
      sentTo: params.to,
    };
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "Failed to transmit email via Gmail API";
    console.error(`[GmailService] Gmail API dispatch failed for ${params.to}:`, errorMsg);

    return {
      success: false,
      provider: "gmail",
      sentTo: params.to,
      error: errorMsg,
    };
  }
}
