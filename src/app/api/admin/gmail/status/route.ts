import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { getStoredGmailCredentials, clearStoredGmailCredentials, getGoogleRedirectUri } from "@/lib/gmail-oauth";
import { recordActivityLog } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limiter";

/**
 * GET /api/admin/gmail/status
 * Returns current Gmail API OAuth connection status for administrative oversight.
 * Never exposes client secrets or raw refresh tokens.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const creds = await getStoredGmailCredentials();
    const configuredProvider = (process.env.EMAIL_PROVIDER || "").toLowerCase().trim();
    const hasResend = Boolean((process.env.RESEND_API_KEY || "").trim());
    const hasSmtp = Boolean((process.env.SMTP_USER || "").trim() && (process.env.SMTP_PASS || "").trim());

    let effectiveProvider: "gmail" | "resend" | "smtp" | "simulated" = "simulated";
    if (configuredProvider === "gmail" || configuredProvider === "resend" || configuredProvider === "smtp") {
      effectiveProvider = configuredProvider as any;
    } else if (creds && creds.refreshToken) {
      effectiveProvider = "gmail";
    } else if (hasResend) {
      effectiveProvider = "resend";
    } else if (hasSmtp) {
      effectiveProvider = "smtp";
    }

    return NextResponse.json({
      success: true,
      activeProvider: effectiveProvider,
      configuredProvider: configuredProvider || "auto-detect",
      gmail: {
        isConfigured: Boolean(creds && creds.refreshToken),
        senderEmail: creds?.senderEmail || process.env.GOOGLE_SENDER_EMAIL || null,
        credentialSource: creds?.source || null,
        hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
        hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        redirectUri: getGoogleRedirectUri(request),
      },
      resend: {
        isConfigured: hasResend,
        sender: process.env.RESEND_FROM || "onboarding@resend.dev",
      },
      smtp: {
        isConfigured: hasSmtp,
        sender: process.env.SMTP_USER || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/gmail/status
 * Disconnects the Gmail OAuth authorization in MongoDB.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const performerName = session.fullName || "RDA Officer";
    await clearStoredGmailCredentials(performerName);

    await recordActivityLog({
      action: "GMAIL_OAUTH_DISCONNECTED",
      performerName,
      performerRole: session.role,
      targetType: "System",
      targetId: "GMAIL_OAUTH_CONFIG",
      description: "Gmail API authorization tokens cleared by administrator.",
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      message: "Gmail API connection successfully removed from persistent database.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
