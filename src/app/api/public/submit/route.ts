import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { submitFinalDeclaration, isValidTokenFormat } from "@/lib/draft-service";
import { sendRegistrationConfirmationEmail } from "@/lib/email-service";

/**
 * POST /api/public/submit
 * Finalize contractor annual filing.
 * - Enforces single submission (revokes resume token immediately).
 * - Transitions statuses to Submitted and Pending_Review.
 * - Assigns permanent RDA-ICDP-YYYY-XXXXX submission reference.
 * - Sends official confirmation email to registrant with workshop schedule.
 * - Records audit event in ActivityLog.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`submit-${clientIp}`, 10, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many submission attempts. Please wait a minute." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const tokenFromHeader = request.headers.get("x-resume-token") || "";
    const tokenFromBody = body.resumeToken || body.token || "";
    const token = (tokenFromHeader || tokenFromBody).trim();
    const customConfirmationEmail = (body.confirmationEmail || "").trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Valid resume token is required to submit a finalized declaration." },
        { status: 400 }
      );
    }

    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { success: false, message: "Malformed token. Submission must be authenticated by a valid 64-character token." },
        { status: 400 }
      );
    }

    const result = await submitFinalDeclaration(token, clientIp);

    // Determine destination email for official confirmation receipt
    const targetEmail =
      customConfirmationEmail ||
      result.questionnaireData?.email ||
      result.contactOfficer?.email ||
      result.questionnaireData?.participant1?.email;

    let emailSent = false;
    let emailStatus = "not_provided";

    if (targetEmail) {
      try {
        const emailResult = await sendRegistrationConfirmationEmail({
          to: targetEmail,
          reference: result.submissionReference,
          businessName: result.businessName,
          willParticipate: result.questionnaireData?.willParticipate || "Yes",
          participant1Name: result.questionnaireData?.participant1?.fullName || result.contactOfficer?.name,
          participant1Designation: result.questionnaireData?.participant1?.designation || result.contactOfficer?.designation,
          workshopDate: "07 December 2026",
          workshopTime: "9:00 AM",
          submittedAt: result.submittedAt,
        });

        emailSent = emailResult.success;
        emailStatus = emailResult.simulated ? "simulated" : emailResult.success ? "sent" : "failed";
      } catch (emailErr) {
        console.error("Non-blocking error dispatching confirmation email:", emailErr);
        emailStatus = "failed";
      }
    }

    return NextResponse.json({
      success: true,
      message: "Contractor annual declaration submitted successfully to the Road Development Authority.",
      submissionReference: result.submissionReference,
      submission: {
        reference: result.submissionReference,
        businessName: result.businessName,
        submittedAt: result.submittedAt,
        provincialOffice: result.provincialOffice,
        status: "Submitted",
        confirmationEmailSentTo: targetEmail || null,
        emailStatus,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to finalize contractor submission.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
