import { Resend } from "resend";
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
  questionnaireData?: Record<string, any>;
}

export interface SendEmailResult {
  success: boolean;
  provider: "resend" | "smtp" | "simulated";
  messageId?: string;
  sentTo?: string;
  intendedRecipient?: string;
  simulated?: boolean;
  error?: string;
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(val: any): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  return isNaN(num) ? String(val) : num.toLocaleString();
}

/**
 * Initialize Resend client using process.env.RESEND_API_KEY
 */
function getResendClient(): Resend | null {
  const apiKey = (process.env.RESEND_API_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (apiKey) {
    return new Resend(apiKey);
  }
  return null;
}

/**
 * Configure SMTP transporter fallback using environment variables.
 */
function createEmailTransporter() {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || "").trim().replace(/^["']|["']$/g, "");
  let pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").trim().replace(/^["']|["']$/g, "");

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

  return null;
}

export async function sendRegistrationConfirmationEmail(
  params: RegistrationEmailParams
): Promise<SendEmailResult> {
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
    questionnaireData = {},
  } = params;

  if (!to || !to.trim()) {
    return {
      success: false,
      provider: "resend",
      error: "Recipient email address is required.",
    };
  }

  const q = questionnaireData || {};
  const isAttending = (q.willParticipate || willParticipate) === "Yes";
  const category = q.participantCategory || "";
  const effectiveOrgName = q.organizationName || businessName || "Valued Registrant";
  const contactPhone = q.contactNumber || q.participant1?.mobileNumber || "—";
  const contactEmail = q.email || to.trim();

  const formattedDate =
    typeof submittedAt === "string"
      ? new Date(submittedAt).toLocaleString("en-GB")
      : submittedAt.toLocaleString("en-GB");

  // Configurable sender: default to onboarding@resend.dev for initial free testing,
  // but respects RESEND_FROM / EMAIL_FROM when an official RDA domain is configured later.
  const configuredFrom = (process.env.RESEND_FROM || process.env.EMAIL_FROM || "").trim().replace(/^["']|["']$/g, "");
  const defaultResendFrom = "Road Development Authority <onboarding@resend.dev>";
  const fromAddress = configuredFrom || defaultResendFrom;

  // Resend Free Tier Test Restriction:
  // When sending from onboarding@resend.dev, Resend strictly allows delivering ONLY to the
  // email address associated with the Resend account.
  const isResendDevSender = fromAddress.toLowerCase().includes("resend.dev");
  const resendAccountEmail = (
    process.env.RESEND_TEST_RECIPIENT ||
    process.env.RESEND_ACCOUNT_EMAIL ||
    process.env.SMTP_USER ||
    "edutrack0310@gmail.com"
  ).trim();

  // If using resend.dev test domain, route to the verified account owner email so Resend accepts it
  const actualRecipient = isResendDevSender ? resendAccountEmail : to.trim();
  const isRoutedToTestAccount = isResendDevSender && actualRecipient.toLowerCase() !== to.trim().toLowerCase();

  const subject = isRoutedToTestAccount
    ? `Official Registration Confirmation: ${reference} - Early Market Engagement Workshop [Test Mode - For: ${to.trim()}]`
    : `Official Registration Confirmation: ${reference} - Early Market Engagement Workshop`;

  // ---------------------------------------------------------------------------
  // 1. BUILD PLAIN TEXT CONTENT (Including All Filled Details)
  // ---------------------------------------------------------------------------
  let textDetails = `
Road Development Authority (RDA) - Sri Lanka
Ministry of Transport, Highways and Urban Development
Inclusive Connectivity and Development Project (ICDP)

=======================================================
REGISTRATION CONFIRMATION & OFFICIAL ACKNOWLEDGMENT RECEIPT
=======================================================

${
  isRoutedToTestAccount
    ? `[RESEND TEST MODE NOTICE]\nThis test email is delivered to Resend account (${actualRecipient}) because onboarding@resend.dev is active.\nIntended registrant email entered in form: ${to.trim()}\n=======================================================\n\n`
    : ""
}Dear ${effectiveOrgName},

Thank you for completing and submitting your registration for the Early Market Engagement Workshop.
Below is the full official record of all details submitted under your application.

SUMMARY OF SUBMISSION:
-------------------------------------------------------
• Permanent Reference Number: ${reference}
• Entity / Organization: ${effectiveOrgName}
• Workshop Participation Status: ${isAttending ? "Confirmed (Participating)" : "Declined (Non-Attendee)"}
• Workshop Date: ${workshopDate}
• Workshop Time: ${workshopTime}
• Venue: Road Development Authority / ICDP, Colombo, Sri Lanka
• Submission Timestamp: ${formattedDate}

-------------------------------------------------------
SECTION 1: BASIC INFORMATION
-------------------------------------------------------
• Organization / Company Name: ${effectiveOrgName}
• Official Contact Number: ${contactPhone}
• Official Contact Email: ${contactEmail}
• Workshop Attendance Choice: ${isAttending ? "Yes" : "No"}
`;

  if (isAttending) {
    textDetails += `• Participant Category: ${category || "—"}\n`;

    // Participants
    if (q.participant1?.fullName) {
      textDetails += `\n-------------------------------------------------------
NOMINATED REPRESENTATIVE (PARTICIPANT 1):
-------------------------------------------------------
• Full Name: ${q.participant1.fullName}
• Designation: ${q.participant1.designation || "—"}
• Mobile Number: ${q.participant1.mobileNumber || "—"}
• Email: ${q.participant1.email || "—"}
`;
    }

    if (q.participant2?.fullName) {
      textDetails += `\n-------------------------------------------------------
NOMINATED REPRESENTATIVE (PARTICIPANT 2 - OPTIONAL):
-------------------------------------------------------
• Full Name: ${q.participant2.fullName}
• Designation: ${q.participant2.designation || "—"}
• Mobile Number: ${q.participant2.mobileNumber || "—"}
• Email: ${q.participant2.email || "—"}
`;
    }

    // Supplier Details
    if (category === "Supplier" && q.supplierDetails) {
      const sup = q.supplierDetails;
      textDetails += `\n-------------------------------------------------------
SUPPLIER PROFILE & PRODUCTION CAPACITY:
-------------------------------------------------------
• Supplier Company: ${sup.companyName || effectiveOrgName}
• Province & District: ${[sup.province, sup.district].filter(Boolean).join(", ") || "—"}
• Location Address: ${sup.locationAddress || "—"}
• Materials Supplied: ${(sup.materialsSupplied || []).map((m: string) => m === "Other" && sup.materialsOther ? `Other (${sup.materialsOther})` : m).join(", ") || "—"}
`;

      if (sup.supplyCapacities && Object.keys(sup.supplyCapacities).length > 0) {
        textDetails += `\nDeclared Supply / Production Capacities:\n`;
        for (const [mat, cap] of Object.entries(sup.supplyCapacities as Record<string, any>)) {
          if (cap && (cap.quantity !== null && cap.quantity !== undefined && cap.quantity !== "")) {
            textDetails += `  • ${mat}: ${cap.quantity} ${cap.unit || "MT per year"}\n`;
          }
        }
      }
    }

    // Contractor Details
    if (category === "Contractor") {
      textDetails += `\n-------------------------------------------------------
CONTRACTOR QUALIFICATIONS & TECHNICAL SPECIALTY:
-------------------------------------------------------
• ICTAD / CIDA Registration Number: ${q.ictadRegistrationNumber || "—"}
• Overall CIDA Grade: ${q.cidaGrade === "Other" && q.cidaGradeOther ? `Other (${q.cidaGradeOther})` : (q.cidaGrade || "—")}
• General Experience: ${q.generalExperience || "—"}
`;

      if (q.areasOfSpecialty && q.areasOfSpecialty.length > 0) {
        textDetails += `• Areas of Specialty & Assigned Grades:\n`;
        for (const spec of q.areasOfSpecialty) {
          if (spec === "Other" && q.specialtyOther) {
            const others = String(q.specialtyOther).split(",").map((s) => s.trim()).filter(Boolean);
            for (const oth of others) {
              const gr = q.specialtyGrades?.[oth];
              textDetails += `    - ${oth} ${gr ? `(Grade: ${gr})` : ""}\n`;
            }
          } else {
            const gr = q.specialtyGrades?.[spec];
            textDetails += `    - ${spec} ${gr ? `(Grade: ${gr})` : ""}\n`;
          }
        }
      }

      // Ongoing Works
      if (q.hasOngoingContracts === "Yes") {
        textDetails += `\n-------------------------------------------------------
ONGOING WORKS & OUTSTANDING COMMITMENTS:
-------------------------------------------------------
• Total Outstanding Value (as at 01 Dec 2026): LKR ${formatNumber(q.totalOutstandingValueLkrMillion)}
`;
        if (q.ongoingContracts && q.ongoingContracts.length > 0) {
          const activeContracts = q.ongoingContracts.filter((c: any) => c && c.contractName && c.contractName.trim());
          if (activeContracts.length > 0) {
            textDetails += `Ongoing Contracts Breakdown:\n`;
            activeContracts.forEach((c: any, idx: number) => {
              textDetails += `  ${idx + 1}. ${c.contractName}${c.contractNo ? ` (Ref: ${c.contractNo})` : ""}\n`;
              if (c.employerName) textDetails += `     Employer: ${c.employerName}\n`;
              if (c.contractAmount) textDetails += `     Outstanding: ${c.currency || "LKR"} ${formatNumber(c.contractAmount)}\n`;
              if (c.completionDate) textDetails += `     Exp. Completion: ${c.completionDate}\n`;
            });
          }
        }
      }

      // Similar Works
      if (q.similarWorks && q.similarWorks.length > 0) {
        const activeSimilar = q.similarWorks.filter((w: any) => w && w.contractName && w.contractName.trim() && w.contractName.trim().toUpperCase() !== "N/A");
        if (activeSimilar.length > 0) {
          textDetails += `\n-------------------------------------------------------
PRIOR SIMILAR WORK EXPERIENCE:
-------------------------------------------------------
`;
          activeSimilar.forEach((w: any, idx: number) => {
            textDetails += `  ${idx + 1}. ${w.contractName} [${w.contractType || "Similar Work"}]\n`;
            if (w.contractAmount) textDetails += `     Value: LKR ${formatNumber(w.contractAmount)}\n`;
            if (w.completionStatus) textDetails += `     Status: ${w.completionStatus}\n`;
            if (w.startDate || w.completionDate) textDetails += `     Period: ${w.startDate || "—"} to ${w.completionDate || "—"}\n`;
          });
        }
      }

      // Financials
      if (q.financialStatements) {
        const hasFinData = Object.values(q.financialStatements).some((y: any) => y && (y.totalRevenue !== null || y.totalAssets !== null));
        if (hasFinData) {
          textDetails += `\n-------------------------------------------------------
FINANCIAL PERFORMANCE SCHEDULE (5 FINANCIAL YEARS):
-------------------------------------------------------
`;
          for (const [yr, f] of Object.entries(q.financialStatements as Record<string, any>)) {
            if (f) {
              textDetails += `• FY ${yr}: Revenue: LKR ${formatNumber(f.totalRevenue)} | PBT: LKR ${formatNumber(f.profitBeforeTax)} | Net Worth: LKR ${formatNumber(f.totalEquity)} | Working Capital: LKR ${formatNumber(f.workingCapital)}\n`;
            }
          }
        }
      }

      if (q.loanCommitments?.twoYearRepaymentsDue2026To2028 !== null && q.loanCommitments?.twoYearRepaymentsDue2026To2028 !== undefined) {
        textDetails += `• 2-Year Loan Commitments Due (2026–2028): LKR ${formatNumber(q.loanCommitments.twoYearRepaymentsDue2026To2028)}\n`;
      }
    }

    // Matters for Discussion
    if (q.mattersForDiscussion && q.mattersForDiscussion.trim()) {
      textDetails += `\n-------------------------------------------------------
MATTERS / TOPICS PROPOSED FOR DISCUSSION:
-------------------------------------------------------
"${q.mattersForDiscussion.trim()}"
`;
    }
  } else {
    textDetails += `\nNote: Entity indicated non-attendance for the workshop on 07 December 2026. Basic filing recorded.\n`;
  }

  textDetails += `
-------------------------------------------------------
WORKSHOP INQUIRIES & OFFICIAL CONTACTS:
-------------------------------------------------------
• Project Inquiries: wbicdpbid@gmail.com
• General Telephone: 011 286 5766
• Officer in Charge: Mr. Indunil Madhusanka
  Mobile: 071 286 3433
  Email: amindunil@gmail.com

Please retain this permanent reference number (${reference}) for all correspondence and gate verification.

Road Development Authority (RDA) - Sri Lanka
Inclusive Connectivity and Development Project (ICDP)
  `.trim();

  // ---------------------------------------------------------------------------
  // 2. BUILD MODERN HTML EMAIL CONTENT (Structured Cards & Detailed Tables)
  // ---------------------------------------------------------------------------
  let htmlSections = "";

  // Section 1: Basic Information Card
  htmlSections += `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        1. Basic Entity Information
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tbody>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; width: 42%; font-weight: 600;">Organization / Company:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${escapeHtml(effectiveOrgName)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Official Contact Number:</td>
            <td style="padding: 7px 0; color: #0f172a; font-family: monospace;">${escapeHtml(contactPhone)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Official Email Address:</td>
            <td style="padding: 7px 0; color: #0f172a; font-family: monospace;">${escapeHtml(contactEmail)}</td>
          </tr>
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Workshop Attendance:</td>
            <td style="padding: 7px 0; font-weight: 700; color: ${isAttending ? "#059669" : "#dc2626"};">
              ${isAttending ? "Yes (Participating on 07 Dec 2026)" : "No (Declined)"}
            </td>
          </tr>
          ${
            category
              ? `<tr>
            <td style="padding: 7px 0; color: #64748b; font-weight: 600;">Participant Category:</td>
            <td style="padding: 7px 0; color: #1e3a8a; font-weight: 800;">${escapeHtml(category)}</td>
          </tr>`
              : ""
          }
        </tbody>
      </table>
    </div>
  `;

  // Section 2: Nominated Attendees (if attending)
  if (isAttending && (q.participant1?.fullName || q.participant2?.fullName)) {
    htmlSections += `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          2. Nominated Workshop Attendees
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tbody>
            ${
              q.participant1?.fullName
                ? `
            <tr style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <td style="padding: 10px 12px;">
                <span style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; display: block; margin-bottom: 2px;">Participant 1 (Primary Representative)</span>
                <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(q.participant1.fullName)}</strong>
                <div style="color: #475569; font-size: 11px; margin-top: 2px;">
                  ${escapeHtml(q.participant1.designation || "Authorized Officer")} &bull; <span style="font-family: monospace;">${escapeHtml(q.participant1.mobileNumber || "—")}</span>
                  ${q.participant1.email ? ` &bull; <span style="font-family: monospace;">${escapeHtml(q.participant1.email)}</span>` : ""}
                </div>
              </td>
            </tr>`
                : ""
            }
            ${
              q.participant2?.fullName
                ? `
            <tr><td style="height: 8px;"></td></tr>
            <tr style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <td style="padding: 10px 12px;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Participant 2 (Secondary Representative)</span>
                <strong style="font-size: 13px; color: #0f172a;">${escapeHtml(q.participant2.fullName)}</strong>
                <div style="color: #475569; font-size: 11px; margin-top: 2px;">
                  ${escapeHtml(q.participant2.designation || "Authorized Officer")} &bull; <span style="font-family: monospace;">${escapeHtml(q.participant2.mobileNumber || "—")}</span>
                  ${q.participant2.email ? ` &bull; <span style="font-family: monospace;">${escapeHtml(q.participant2.email)}</span>` : ""}
                </div>
              </td>
            </tr>`
                : ""
            }
          </tbody>
        </table>
      </div>
    `;
  }

  // Section 3: Supplier Production & Capacities
  if (isAttending && category === "Supplier" && q.supplierDetails) {
    const sup = q.supplierDetails;
    const supMaterials = (sup.materialsSupplied || []).map((m: string) =>
      m === "Other" && sup.materialsOther ? `Other (${sup.materialsOther})` : m
    );

    htmlSections += `
      <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #581c87; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e9d5ff; padding-bottom: 8px;">
          3. Supplier Profile & Production Capacity
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px;">
          <tbody>
            <tr style="border-bottom: 1px solid #f3e8ff;">
              <td style="padding: 6px 0; color: #6b21a8; font-weight: 600; width: 42%;">Supplier Entity:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${escapeHtml(sup.companyName || effectiveOrgName)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3e8ff;">
              <td style="padding: 6px 0; color: #6b21a8; font-weight: 600;">Province & District:</td>
              <td style="padding: 6px 0; color: #0f172a;">${escapeHtml([sup.province, sup.district].filter(Boolean).join(" • ") || "—")}</td>
            </tr>
            ${
              sup.locationAddress
                ? `
            <tr style="border-bottom: 1px solid #f3e8ff;">
              <td style="padding: 6px 0; color: #6b21a8; font-weight: 600;">Location / Plant Address:</td>
              <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(sup.locationAddress)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding: 6px 0; color: #6b21a8; font-weight: 600;">Supplied Materials:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(supMaterials.join(", ") || "—")}</td>
            </tr>
          </tbody>
        </table>
    `;

    if (sup.supplyCapacities && Object.keys(sup.supplyCapacities).length > 0) {
      htmlSections += `
        <span style="display: block; font-size: 11px; font-weight: 800; color: #6b21a8; text-transform: uppercase; margin: 10px 0 6px 0;">
          Declared Annual Production / Supply Capacities
        </span>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e9d5ff;">
          <thead>
            <tr style="background-color: #f3e8ff; color: #581c87; text-align: left;">
              <th style="padding: 8px 10px; font-weight: 700;">Material</th>
              <th style="padding: 8px 10px; font-weight: 700;">Annual Capacity</th>
              <th style="padding: 8px 10px; font-weight: 700;">Unit</th>
            </tr>
          </thead>
          <tbody>
      `;
      for (const [mat, cap] of Object.entries(sup.supplyCapacities as Record<string, any>)) {
        if (cap && (cap.quantity !== null && cap.quantity !== undefined && cap.quantity !== "")) {
          htmlSections += `
            <tr style="border-top: 1px solid #f3e8ff;">
              <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">${escapeHtml(mat)}</td>
              <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #581c87;">${escapeHtml(cap.quantity)}</td>
              <td style="padding: 8px 10px; color: #64748b;">${escapeHtml(cap.unit || "MT / Year")}</td>
            </tr>
          `;
        }
      }
      htmlSections += `
          </tbody>
        </table>
      `;
    }

    htmlSections += `</div>`;
  }

  // Section 4: Contractor Qualifications & Technical Grading
  if (isAttending && category === "Contractor") {
    htmlSections += `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          3. Contractor Grading & Technical Qualifications
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px;">
          <tbody>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 42%;">ICTAD / CIDA Registration No:</td>
              <td style="padding: 6px 0; font-family: monospace; font-weight: 800; color: #1e3a8a;">${escapeHtml(q.ictadRegistrationNumber || "—")}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Overall CIDA Grade:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${escapeHtml(q.cidaGrade === "Other" && q.cidaGradeOther ? `Other (${q.cidaGradeOther})` : (q.cidaGrade || "—"))}</td>
            </tr>
            <tr style="border-bottom: 1px solid #edf2f7;">
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">General Experience:</td>
              <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(q.generalExperience || "—")}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Has Ongoing Contracts:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${escapeHtml(q.hasOngoingContracts || "No")}</td>
            </tr>
          </tbody>
        </table>
    `;

    // Specialties badge list
    if (q.areasOfSpecialty && q.areasOfSpecialty.length > 0) {
      htmlSections += `
        <span style="display: block; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin: 8px 0 6px 0;">
          Areas of Specialty &amp; Grades:
        </span>
        <div style="margin-bottom: 6px;">
      `;
      for (const spec of q.areasOfSpecialty) {
        if (spec === "Other" && q.specialtyOther) {
          const others = String(q.specialtyOther).split(",").map((s) => s.trim()).filter(Boolean);
          for (const oth of others) {
            const gr = q.specialtyGrades?.[oth];
            htmlSections += `<span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin: 2px 4px 2px 0;">${escapeHtml(oth)}${gr ? ` &bull; Grade ${escapeHtml(gr)}` : ""}</span>`;
          }
        } else {
          const gr = q.specialtyGrades?.[spec];
          htmlSections += `<span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 6px; margin: 2px 4px 2px 0;">${escapeHtml(spec)}${gr ? ` &bull; Grade ${escapeHtml(gr)}` : ""}</span>`;
        }
      }
      htmlSections += `</div>`;
    }

    htmlSections += `</div>`;

    // Ongoing Works
    if (q.hasOngoingContracts === "Yes") {
      htmlSections += `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
            4. Ongoing Works & Outstanding Commitments
          </h3>
          <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between;">
            <span style="font-size: 12px; color: #1e40af; font-weight: 600;">Total Value of Outstanding Works (as at 01 Dec 2026):</span>
            <strong style="font-size: 13px; font-family: monospace; color: #1e3a8a;">LKR ${formatNumber(q.totalOutstandingValueLkrMillion)}</strong>
          </div>
      `;

      if (q.ongoingContracts && q.ongoingContracts.length > 0) {
        const activeContracts = q.ongoingContracts.filter((c: any) => c && c.contractName && c.contractName.trim());
        if (activeContracts.length > 0) {
          htmlSections += `
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #334155; text-align: left;">
                  <th style="padding: 8px 10px;">Contract</th>
                  <th style="padding: 8px 10px;">Employer</th>
                  <th style="padding: 8px 10px;">Outstanding Amount</th>
                  <th style="padding: 8px 10px;">Exp. Completion</th>
                </tr>
              </thead>
              <tbody>
          `;
          activeContracts.forEach((c: any) => {
            htmlSections += `
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">
                  ${escapeHtml(c.contractName)}
                  ${c.contractNo ? `<span style="color: #64748b; font-family: monospace; display: block; font-size: 10px;">Ref: ${escapeHtml(c.contractNo)}</span>` : ""}
                </td>
                <td style="padding: 8px 10px; color: #475569;">${escapeHtml(c.employerName || "—")}</td>
                <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #0f172a;">${escapeHtml(c.currency || "LKR")} ${formatNumber(c.contractAmount)}</td>
                <td style="padding: 8px 10px; color: #64748b;">${escapeHtml(c.completionDate || "—")}</td>
              </tr>
            `;
          });
          htmlSections += `
              </tbody>
            </table>
          `;
        }
      }

      htmlSections += `</div>`;
    }

    // Similar Works
    if (q.similarWorks && q.similarWorks.length > 0) {
      const activeSimilar = q.similarWorks.filter((w: any) => w && w.contractName && w.contractName.trim() && w.contractName.trim().toUpperCase() !== "N/A");
      if (activeSimilar.length > 0) {
        htmlSections += `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              5. Prior Similar Work Experience
            </h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #334155; text-align: left;">
                  <th style="padding: 8px 10px;">Contract Name &amp; Type</th>
                  <th style="padding: 8px 10px;">Amount</th>
                  <th style="padding: 8px 10px;">Completion Status</th>
                </tr>
              </thead>
              <tbody>
        `;
        activeSimilar.forEach((w: any) => {
          htmlSections += `
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 8px 10px;">
                <strong style="color: #0f172a;">${escapeHtml(w.contractName)}</strong>
                <span style="color: #64748b; display: block; font-size: 10px;">${escapeHtml(w.contractType || "Similar Works")}</span>
              </td>
              <td style="padding: 8px 10px; font-family: monospace; font-weight: 700; color: #0f172a;">LKR ${formatNumber(w.contractAmount)}</td>
              <td style="padding: 8px 10px; color: #059669; font-weight: 600;">${escapeHtml(w.completionStatus || "Completed")}</td>
            </tr>
          `;
        });
        htmlSections += `
              </tbody>
            </table>
          </div>
        `;
      }
    }

    // Financial Schedule
    if (q.financialStatements) {
      const hasFinData = Object.values(q.financialStatements).some((y: any) => y && (y.totalRevenue !== null || y.totalAssets !== null));
      if (hasFinData) {
        htmlSections += `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
              6. Financial Performance Schedule (Past 5 Financial Years)
            </h3>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                <thead>
                  <tr style="background-color: #f1f5f9; color: #334155; text-align: right;">
                    <th style="padding: 7px 8px; text-align: left;">Financial Year</th>
                    <th style="padding: 7px 8px;">Revenue (LKR)</th>
                    <th style="padding: 7px 8px;">PBT (LKR)</th>
                    <th style="padding: 7px 8px;">Total Assets</th>
                    <th style="padding: 7px 8px;">Total Liab.</th>
                    <th style="padding: 7px 8px;">Net Worth</th>
                    <th style="padding: 7px 8px;">Working Cap.</th>
                  </tr>
                </thead>
                <tbody>
        `;
        for (const [yr, f] of Object.entries(q.financialStatements as Record<string, any>)) {
          if (f) {
            htmlSections += `
              <tr style="border-top: 1px solid #e2e8f0; text-align: right; font-family: monospace;">
                <td style="padding: 6px 8px; text-align: left; font-family: sans-serif; font-weight: 700; color: #1e3a8a;">${escapeHtml(yr)}</td>
                <td style="padding: 6px 8px; color: #0f172a;">${formatNumber(f.totalRevenue)}</td>
                <td style="padding: 6px 8px; color: ${f.profitBeforeTax < 0 ? "#dc2626" : "#0f172a"};">${formatNumber(f.profitBeforeTax)}</td>
                <td style="padding: 6px 8px; color: #0f172a;">${formatNumber(f.totalAssets)}</td>
                <td style="padding: 6px 8px; color: #0f172a;">${formatNumber(f.totalLiabilities)}</td>
                <td style="padding: 6px 8px; color: #0f172a;">${formatNumber(f.totalEquity)}</td>
                <td style="padding: 6px 8px; color: #0f172a;">${formatNumber(f.workingCapital)}</td>
              </tr>
            `;
          }
        }
        htmlSections += `
                </tbody>
              </table>
            </div>
        `;

        if (q.loanCommitments?.twoYearRepaymentsDue2026To2028 !== null && q.loanCommitments?.twoYearRepaymentsDue2026To2028 !== undefined) {
          htmlSections += `
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px 12px; margin-top: 10px; font-size: 11px;">
              <span style="color: #1e40af; font-weight: 600;">Two-Year Loan Repayments Due (01 Dec 2026 – 01 Dec 2028):</span>
              <strong style="color: #1e3a8a; font-family: monospace; float: right;">LKR ${formatNumber(q.loanCommitments.twoYearRepaymentsDue2026To2028)}</strong>
            </div>
          `;
        }

        htmlSections += `</div>`;
      }
    }
  }

  // Matters for Discussion
  if (isAttending && q.mattersForDiscussion && q.mattersForDiscussion.trim()) {
    htmlSections += `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #0b1f3a; text-transform: uppercase; letter-spacing: 0.5px;">
          Matters / Topics Proposed for Discussion
        </h3>
        <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #334155; font-style: italic; line-height: 1.6;">
          &ldquo;${escapeHtml(q.mattersForDiscussion.trim())}&rdquo;
        </div>
      </div>
    `;
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RDA Registration Confirmation: ${escapeHtml(reference)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
    
    <!-- Header Banner -->
    <div style="background-color: #0b192c; background: linear-gradient(135deg, #07162c 0%, #0b1f3a 50%, #1e3a8a 100%); padding: 26px 24px; text-align: left; border-left: 6px solid #16a34a;">
      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">
        ROAD DEVELOPMENT AUTHORITY • SRI LANKA
      </p>
      <h1 style="margin: 6px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800; line-height: 1.3;">
        Early Market Engagement Workshop
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #4ade80;">
        Organized by Inclusive Connectivity and Development Project (ICDP)
      </p>
    </div>

    <!-- Main Container -->
    <div style="padding: 24px 24px 16px 24px;">
      
      ${
        isRoutedToTestAccount
          ? `
      <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 14px; margin-bottom: 18px; font-size: 12px; color: #92400e;">
        <strong>Resend Test Mode (onboarding@resend.dev):</strong> This confirmation email was routed to the verified Resend account (<strong>${escapeHtml(actualRecipient)}</strong>).<br>
        <span style="font-size: 11px; color: #b45309;">Registrant email entered during submission: <strong>${escapeHtml(to.trim())}</strong></span>
      </div>`
          : ""
      }

      <!-- Thank You Banner -->
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 4px 0; color: #065f46; font-size: 15px; font-weight: 800;">
          ✓ Registration Successfully Received &amp; Recorded
        </h2>
        <p style="margin: 0; color: #047857; font-size: 12.5px; line-height: 1.5;">
          Thank you, <strong>${escapeHtml(effectiveOrgName)}</strong>. Your registration for the Early Market Engagement Workshop has been successfully recorded in the Road Development Authority repository.
        </p>
      </div>

      <!-- Permanent Reference Box -->
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
          Permanent Registration Reference Number
        </span>
        <span style="font-family: monospace; font-size: 23px; font-weight: 800; color: #1e3a8a; letter-spacing: 1px; display: inline-block;">
          ${escapeHtml(reference)}
        </span>
      </div>

      <!-- Workshop Schedule Quick Info -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; width: 40%; font-weight: 600;">Workshop Schedule:</td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 700;">${workshopDate} at ${workshopTime}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Venue:</td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">Road Development Authority / ICDP, Colombo, Sri Lanka</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Attendance Status:</td>
            <td style="padding: 10px 14px; color: ${isAttending ? "#059669" : "#dc2626"}; font-weight: 800;">
              ${isAttending ? "Confirmed Attendee" : "Declined (Non-Attendee)"}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #64748b; font-weight: 600;">Filing Timestamp:</td>
            <td style="padding: 10px 14px; color: #0f172a;">${formattedDate}</td>
          </tr>
        </tbody>
      </table>

      <!-- Dynamic Sections: All Filled Details -->
      ${htmlSections}

      <!-- Official Contacts & Inquiries Card -->
      <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 12px; font-weight: 800; text-transform: uppercase;">
          Official Workshop Contacts &amp; Inquiries
        </h4>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #334155;">
          <strong>Project Inquiries Email:</strong> <a href="mailto:wbicdpbid@gmail.com" style="color: #2563eb; text-decoration: none;">wbicdpbid@gmail.com</a>
        </p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #334155;">
          <strong>General Telephone:</strong> 011 286 5766
        </p>
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #334155;">
          <strong>Mr. Indunil Madhusanka:</strong> 071 286 3433 (<a href="mailto:amindunil@gmail.com" style="color: #2563eb; text-decoration: none;">amindunil@gmail.com</a>)
        </p>
      </div>

      <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin: 0; text-align: center;">
        Please present your reference number (<strong>${escapeHtml(reference)}</strong>) upon arrival at the workshop registration desk.
      </p>

    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
      Road Development Authority • Inclusive Connectivity and Development Project (ICDP)<br>
      Ministry of Transport, Highways and Urban Development • Sri Lanka
    </div>

  </div>
</body>
</html>
  `.trim();

  // ---------------------------------------------------------------------------
  // 3. ATTEMPT DISPATCH VIA OFFICIAL RESEND SDK (PRIMARY)
  // ---------------------------------------------------------------------------
  const resend = getResendClient();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: actualRecipient,
        subject,
        text: textDetails,
        html: htmlContent,
      });

      if (error) {
        console.error(`[EmailService - Resend] Resend API rejected message to ${actualRecipient}:`, error);
        return {
          success: false,
          provider: "resend",
          error: error.message || "Resend API rejected message",
          simulated: false,
          sentTo: actualRecipient,
          intendedRecipient: to.trim(),
        };
      }

      console.log(`[EmailService - Resend] Confirmation email accepted by Resend! Message ID: ${data?.id} -> ${actualRecipient}`);
      return {
        success: true,
        provider: "resend",
        messageId: data?.id,
        sentTo: actualRecipient,
        intendedRecipient: to.trim(),
        simulated: false,
      };
    } catch (resendErr: any) {
      console.error(`[EmailService - Resend] Network or SDK exception dispatching to ${actualRecipient}:`, resendErr);
      return {
        success: false,
        provider: "resend",
        error: resendErr?.message || "Resend connection error",
        simulated: false,
        sentTo: actualRecipient,
        intendedRecipient: to.trim(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 4. ATTEMPT DISPATCH VIA SMTP TRANSPORTER (SECONDARY FALLBACK)
  // ---------------------------------------------------------------------------
  const transporter = createEmailTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: actualRecipient,
        subject,
        text: textDetails,
        html: htmlContent,
      });

      console.log(`[EmailService - SMTP] Confirmation email sent successfully to ${actualRecipient}. MessageId: ${info.messageId}`);
      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId,
        sentTo: actualRecipient,
        intendedRecipient: to.trim(),
        simulated: false,
      };
    } catch (smtpErr: any) {
      console.error(`[EmailService - SMTP] Failed to send email via SMTP to ${actualRecipient}:`, smtpErr);
      return {
        success: false,
        provider: "smtp",
        error: smtpErr?.message || "SMTP send failed",
        simulated: false,
        sentTo: actualRecipient,
        intendedRecipient: to.trim(),
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 5. LOCAL SIMULATED FALLBACK (When no Resend key or SMTP configured)
  // ---------------------------------------------------------------------------
  console.log(`[EmailService - Simulated] Confirmation email generated for ${to}:`);
  console.log(`  Reference: ${reference}`);
  console.log(`  Recipient: ${actualRecipient}`);
  return {
    success: true,
    provider: "simulated",
    messageId: `sim-${Date.now()}`,
    sentTo: actualRecipient,
    intendedRecipient: to.trim(),
    simulated: true,
  };
}
