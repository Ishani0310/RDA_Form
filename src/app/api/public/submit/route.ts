import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { submitFinalDeclaration, saveOrUpdateDraft, isValidTokenFormat } from "@/lib/draft-service";
import { sendRegistrationConfirmationEmail } from "@/lib/email-service";

/**
 * POST /api/public/submit
 * Finalize contractor annual filing.
 * - Supports instant submission in a single roundtrip.
 * - Enforces single submission (revokes resume token immediately).
 * - Transitions statuses to Submitted and Pending_Review.
 * - Assigns permanent RDA-ICDP-YYYY-XXXXX submission reference.
 * - Dispatches official confirmation email asynchronously in background.
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
    let token = (tokenFromHeader || tokenFromBody).trim();
    const customConfirmationEmail = (body.confirmationEmail || "").trim();
    const latestQData = body.questionnaireData || body.data;

    // If no existing token is provided, initialize the draft directly in the same request
    if (!token && latestQData) {
      const effectiveBusinessName = (
        body.businessName ||
        body.organizationName ||
        latestQData.organizationName ||
        latestQData.supplierDetails?.companyName ||
        "Registered Organization"
      ).trim();

      const draftResult = await saveOrUpdateDraft(
        {
          businessName: effectiveBusinessName,
          questionnaireData: latestQData,
          registrationNumber: body.registrationNumber || latestQData.ictadRegistrationNumber,
          cidaGrade: body.cidaGrade || latestQData.cidaGrade,
          province: body.province || latestQData.supplierDetails?.province || "Western Province",
          district: body.district || latestQData.supplierDetails?.district,
          contactOfficer: body.contactOfficer || {
            name: latestQData.participant1?.fullName || "Authorized Representative",
            phone: latestQData.participant1?.mobileNumber || latestQData.contactNumber || "+94 11 000 0000",
            email: latestQData.participant1?.email || latestQData.email || "contact@rda.gov.lk",
          },
        },
        undefined,
        clientIp
      );
      token = draftResult.token;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Valid resume token or complete questionnaire data is required to submit." },
        { status: 400 }
      );
    }

    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { success: false, message: "Malformed token. Submission must be authenticated by a valid 64-character token." },
        { status: 400 }
      );
    }

    // Finalize submission in database with latest questionnaire inputs
    let result;
    try {
      result = await submitFinalDeclaration(token, clientIp, latestQData);
    } catch (submitErr: any) {
      if (submitErr?.message?.includes("not found") && latestQData) {
        const effectiveBusinessName = (
          body.businessName ||
          body.organizationName ||
          latestQData.organizationName ||
          latestQData.supplierDetails?.companyName ||
          "Registered Organization"
        ).trim();

        const draftResult = await saveOrUpdateDraft(
          {
            businessName: effectiveBusinessName,
            questionnaireData: latestQData,
            registrationNumber: body.registrationNumber || latestQData.ictadRegistrationNumber,
            cidaGrade: body.cidaGrade || latestQData.cidaGrade,
            province: body.province || latestQData.supplierDetails?.province || "Western Province",
            district: body.district || latestQData.supplierDetails?.district,
            contactOfficer: body.contactOfficer || {
              name: latestQData.participant1?.fullName || "Authorized Representative",
              phone: latestQData.participant1?.mobileNumber || latestQData.contactNumber || "+94 11 000 0000",
              email: latestQData.participant1?.email || latestQData.email || "contact@rda.gov.lk",
            },
          },
          undefined,
          clientIp
        );
        result = await submitFinalDeclaration(draftResult.token, clientIp, latestQData);
      } else {
        throw submitErr;
      }
    }

    // Determine destination email for official confirmation receipt
    const targetEmail =
      customConfirmationEmail ||
      result.questionnaireData?.email ||
      result.contactOfficer?.email ||
      result.questionnaireData?.participant1?.email;

    // Dispatch confirmation email asynchronously in background (fire-and-forget)
    // This removes 3 to 5 seconds of SMTP network latency from the user's submit response time!
    if (targetEmail) {
      sendRegistrationConfirmationEmail({
        to: targetEmail,
        reference: result.submissionReference,
        businessName: result.businessName,
        willParticipate: result.questionnaireData?.willParticipate || "Yes",
        participant1Name: result.questionnaireData?.participant1?.fullName || result.contactOfficer?.name,
        participant1Designation: result.questionnaireData?.participant1?.designation || result.contactOfficer?.designation,
        workshopDate: "07 December 2026",
        workshopTime: "9:00 AM",
        submittedAt: result.submittedAt,
      }).catch((emailErr) => {
        console.error("Non-blocking error dispatching confirmation email:", emailErr);
      });
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
        emailStatus: targetEmail ? "dispatched" : "not_provided",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to finalize contractor submission.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
