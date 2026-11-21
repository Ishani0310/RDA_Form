import nodemailer from "nodemailer";

export interface RegistrationEmailParams {
  to: string;
  reference: string;
  businessName: string;
  willParticipate: string;
  participant1Name?: string;
  participant1Designation?: string;
  workshopDate?: string;
  workshopTime?: string;
  submittedAt?: string | Date;
}

/**
 * Configure SMTP transporter using environment variables or a safe fallback.
 * Supported env vars:
 * SMTP_HOST (e.g., smtp.gmail.com)
 * SMTP_PORT (e.g., 587 or 465)
 * SMTP_SECURE (e.g., true for 465, false for 587)
 * SMTP_USER
 * SMTP_PASS
 * SMTP_FROM (e.g., "RDA ICDP <wbicdpbid@gmail.com>")
 */
function createEmailTransporter() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim().replace(/^["']|["']$/g, "");
  let pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim().replace(/^["']|["']$/g, "");
  
  // Google App Passwords are 16 letters, often displayed and copied with spaces (e.g. "xxxx xxxx xxxx xxxx")
  // Spaces must be stripped so Google SMTP authentication succeeds.
  if (user.toLowerCase().endsWith("@gmail.com") || process.env.SMTP_HOST === "smtp.gmail.com") {
    pass = pass.replace(/\s+/g, "");
  }

  const host = (process.env.SMTP_HOST || (user.toLowerCase().endsWith("@gmail.com") ? "smtp.gmail.com" : "")).trim();
  const port = parseInt(process.env.SMTP_PORT || (host === "smtp.gmail.com" ? "465" : "587"), 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (user && pass) {
    if (user.toLowerCase().endsWith("@gmail.com") || host === "smtp.gmail.com") {
      return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });
    }

    if (host) {
      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }
  }

  // Fallback: If SMTP credentials are not yet configured in .env.local, log safely in dev
  return null;
}

export async function sendRegistrationConfirmationEmail(
  params: RegistrationEmailParams
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const {
    to,
    reference,
    businessName,
    willParticipate,
    participant1Name,
    participant1Designation,
    workshopDate = "07 December 2026",
    workshopTime = "9:00 AM",
    submittedAt = new Date(),
  } = params;

  if (!to || !to.trim()) {
    return { success: false, error: "Recipient email address is required." };
  }

  const formattedDate =
    typeof submittedAt === "string"
      ? new Date(submittedAt).toLocaleString("en-GB")
      : submittedAt.toLocaleString("en-GB");

  const isAttending = willParticipate === "Yes";
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim().replace(/^["']|["']$/g, "");
  const defaultFrom = user ? `"RDA ICDP Project" <${user}>` : '"RDA ICDP Project" <wbicdpbid@gmail.com>';
  const fromAddress = process.env.SMTP_FROM || defaultFrom;

  const subject = `Official Registration Confirmation: ${reference} - Early Market Engagement Workshop`;

  const textContent = `
Road Development Authority (RDA) - Sri Lanka
Ministry of Transport, Highways and Urban Development
Inclusive Connectivity and Development Project (ICDP)

=======================================================
REGISTRATION CONFIRMATION & ACKNOWLEDGMENT RECEIPT
=======================================================

Dear ${businessName || "Registrant"},

Thank you for submitting your official registration questionnaire response for the Early Market Engagement Workshop.

YOUR REGISTRATION DETAILS:
-------------------------------------------------------
• Permanent Reference Number: ${reference}
• Organization / Company: ${businessName}
• Workshop Participation Status: ${isAttending ? "Confirmed (Attending)" : "Declined (Non-Attendee)"}
• Workshop Date: ${workshopDate}
• Workshop Time: ${workshopTime}
• Venue: Road Development Authority / ICDP, Colombo, Sri Lanka
${
  isAttending && participant1Name
    ? `• Nominated Representative: ${participant1Name}${participant1Designation ? ` (${participant1Designation})` : ""}\n`
    : ""
}• Submission Timestamp: ${formattedDate}

-------------------------------------------------------
WORKSHOP INQUIRIES & CONTACTS:
• Organized by: Inclusive Connectivity and Development Project (ICDP)
• Project Inquiries Email: wbicdpbid@gmail.com
• General Telephone: 011 286 5766
• Officer in Charge: Mr. Indunil Madhusanka
  Mobile: 071 286 3433
  Email: amindunil@gmail.com

Please retain this permanent reference number (${reference}) for all future communications and gate entry verification.

Road Development Authority (RDA)
Inclusive Connectivity and Development Project (ICDP)
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RDA Registration Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    
    <!-- Header Banner -->
    <div style="background-color: #0f172a; background: linear-gradient(135deg, #0b192c 0%, #1e3a8a 100%); padding: 28px 24px; text-align: left; border-left: 6px solid #16a34a;">
      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">
        ROAD DEVELOPMENT AUTHORITY • SRI LANKA
      </p>
      <h1 style="margin: 6px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800;">
        Early Market Engagement Workshop
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #16a34a;">
        Organized by Inclusive Connectivity and Development Project (ICDP)
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 24px 24px 16px 24px;">
      
      <!-- Thank You Message -->
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 6px 0; color: #065f46; font-size: 16px; font-weight: 700;">
          ✓ Registration Successfully Received
        </h2>
        <p style="margin: 0; color: #047857; font-size: 13px; line-height: 1.5;">
          Thank you for submitting your questionnaire response, <strong>${businessName || "Valued Stakeholder"}</strong>. Your official registration has been recorded with the Road Development Authority.
        </p>
      </div>

      <!-- Reference Box -->
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
          Permanent Registration Reference Number
        </span>
        <span style="font-family: monospace; font-size: 22px; font-weight: 800; color: #1e3a8a; letter-spacing: 1px; display: inline-block;">
          ${reference}
        </span>
      </div>

      <!-- Workshop Details Table -->
      <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
        Workshop Schedule & Information
      </h3>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; width: 40%; font-weight: 600;">Workshop Date:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${workshopDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Workshop Time:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${workshopTime}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Participation Status:</td>
            <td style="padding: 8px 0; color: ${isAttending ? "#059669" : "#dc2626"}; font-weight: 700;">
              ${isAttending ? "Confirmed Attendee" : "Declination of Attendance Recorded"}
            </td>
          </tr>
          ${
            isAttending && participant1Name
              ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Nominated Officer:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">
              ${participant1Name}${participant1Designation ? ` (${participant1Designation})` : ""}
            </td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Recorded Timestamp:</td>
            <td style="padding: 8px 0; color: #0f172a;">${formattedDate}</td>
          </tr>
        </tbody>
      </table>

      <!-- Contact & Inquiries Card -->
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 6px 0; color: #0f172a; font-size: 12px; font-weight: 700; text-transform: uppercase;">
          Official Contact & Inquiries
        </h4>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #334155;">
          <strong>Project Inquiries:</strong> <a href="mailto:wbicdpbid@gmail.com" style="color: #2563eb; text-decoration: none;">wbicdpbid@gmail.com</a>
        </p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #334155;">
          <strong>General Number:</strong> 011 286 5766
        </p>
        <p style="margin: 0; font-size: 12px; color: #334155;">
          <strong>Mr. Indunil Madhusanka:</strong> 071 286 3433 (<a href="mailto:amindunil@gmail.com" style="color: #2563eb; text-decoration: none;">amindunil@gmail.com</a>)
        </p>
      </div>

      <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin: 0;">
        Please keep this email and reference number for gate clearance and verification on the day of the workshop.
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
      Road Development Authority • Inclusive Connectivity and Development Project (ICDP)<br>
      Ministry of Transport, Highways and Urban Development • Sri Lanka
    </div>

  </div>
</body>
</html>
  `.trim();

  const transporter = createEmailTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: to.trim(),
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[EmailService] Confirmation email sent successfully to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error(`[EmailService] Failed to send email via SMTP to ${to}:`, err);
      // Return simulated success with logged details so user submission is never blocked
      return {
        success: true,
        simulated: true,
        error: err instanceof Error ? err.message : "SMTP send failed",
      };
    }
  } else {
    // Simulated delivery (SMTP not configured in local environment)
    console.log(`[EmailService - Simulated] Official confirmation email generated for ${to}:`);
    console.log(`  Reference: ${reference}`);
    console.log(`  Workshop: ${workshopDate} at ${workshopTime}`);
    console.log(`  Recipient: ${to}`);
    return { success: true, simulated: true };
  }
}
