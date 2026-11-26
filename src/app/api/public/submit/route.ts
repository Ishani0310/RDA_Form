import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import {
  submitFinalDeclaration,
  submitDirectDeclaration,
  isValidTokenFormat,
} from "@/lib/draft-service";
import { sendRegistrationConfirmationEmail } from "@/lib/email-service";
import { connectToDatabase } from "@/lib/mongodb";
import { Submission } from "@/models/Submission";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/submit?reference=RDA-ICDP-2026-XXXXX
 * Checks the real-time status of email delivery and filing confirmation.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = (searchParams.get("reference") || searchParams.get("ref") || "").trim();

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Submission reference query parameter is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const submission = await Submission.findOne({ submissionReference: reference });

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission reference not found." },
        { status: 404 }
      );
    }

    const qData = (submission.questionnaireData as Record<string, any>) || {};

    return NextResponse.json({
      success: true,
      reference: submission.submissionReference,
      status: submission.status,
      emailStatus: qData._emailStatus || "pending",
      emailSentTo: qData._emailSentTo || null,
      emailProvider: qData._emailProvider || null,
      emailMessageId: qData._emailMessageId || null,
      emailError: qData._emailError || null,
      emailDispatchedAt: qData._emailDispatchedAt || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve submission status.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/public/submit
 * Finalize contractor annual filing.
 * - Supports instant submission in a single roundtrip.
 * - Enforces single submission (revokes resume token immediately).
 * - Transitions statuses to Submitted and Pending_Review.
 * - Assigns permanent RDA-ICDP-YYYY-XXXXX submission reference.
 * - Dispatches official confirmation email via Resend API.
 * - Never blocks database persistence on email transmission.
 * - Accurately reports email delivery status.
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

    const buildDirectPayload = () => {
      const effectiveBusinessName = (
        body.businessName ||
        body.organizationName ||
        latestQData?.organizationName ||
        latestQData?.supplierDetails?.companyName ||
        "Registered Organization"
      ).trim();

      return {
        businessName: effectiveBusinessName,
        questionnaireData: latestQData,
        registrationNumber: body.registrationNumber || latestQData?.ictadRegistrationNumber,
        cidaGrade: body.cidaGrade || latestQData?.cidaGrade,
        province: body.province || latestQData?.supplierDetails?.province || "Western Province",
        district: body.district || latestQData?.supplierDetails?.district,
        formId: body.formId || latestQData?.formId,
        formSlug: body.formSlug || latestQData?.formSlug || body.slug,
        contactOfficer: body.contactOfficer || {
          name: latestQData?.participant1?.fullName || "Authorized Representative",
          phone: latestQData?.participant1?.mobileNumber || latestQData?.contactNumber || "+94 11 000 0000",
          email: latestQData?.participant1?.email || latestQData?.email || "contact@rda.gov.lk",
        },
      };
    };

    let result;
    if (token && isValidTokenFormat(token)) {
      try {
        result = await submitFinalDeclaration(token, clientIp, latestQData);
      } catch (submitErr: any) {
        if (latestQData && (submitErr?.message?.includes("not found") || submitErr?.message?.includes("expired"))) {
          result = await submitDirectDeclaration(buildDirectPayload(), clientIp);
        } else {
          throw submitErr;
        }
      }
    } else if (latestQData) {
      // Direct instant submission in a single database pass (sub-300ms)
      result = await submitDirectDeclaration(buildDirectPayload(), clientIp);
    } else {
      return NextResponse.json(
        { success: false, message: "Valid resume token or complete questionnaire data is required to submit." },
        { status: 400 }
      );
    }

    // Determine destination email for official confirmation receipt
    const targetEmail =
      customConfirmationEmail ||
      result.questionnaireData?.email ||
      result.contactOfficer?.email ||
      result.questionnaireData?.participant1?.email;

    let emailStatus: "not_provided" | "pending" | "sent" | "failed" = targetEmail ? "pending" : "not_provided";
    let emailSentTo: string | null = targetEmail || null;
    let emailMessageId: string | null = null;
    let emailError: string | null = null;
    let emailProvider: string | null = null;

    if (targetEmail) {
      // Completely decouple email delivery onto the next event loop turn via setImmediate
      // Flushes the HTTP response socket to the applicant in <250ms while email transmits asynchronously
      setImmediate(() => {
        sendRegistrationConfirmationEmail({
          to: targetEmail,
          reference: result.submissionReference,
          businessName: result.businessName,
          willParticipate: result.questionnaireData?.willParticipate || "Yes",
          participant1Name: result.questionnaireData?.participant1?.fullName || result.contactOfficer?.name,
          participant1Designation: result.questionnaireData?.participant1?.designation || result.contactOfficer?.designation,
          workshopDate: "07 December 2026",
          workshopTime: "8:30 AM",
          submittedAt: result.submittedAt,
          questionnaireData: result.questionnaireData || latestQData,
        })
          .then(async (emailRes) => {
            const status = emailRes.success ? "sent" : "failed";
            try {
              await connectToDatabase();
              await Submission.updateOne(
                { submissionReference: result.submissionReference },
                {
                  $set: {
                    "questionnaireData._emailStatus": status,
                    "questionnaireData._emailProvider": emailRes.provider,
                    "questionnaireData._emailMessageId": emailRes.messageId || null,
                    "questionnaireData._emailSentTo": emailRes.sentTo || targetEmail,
                    "questionnaireData._emailError": emailRes.error || null,
                    "questionnaireData._emailDispatchedAt": new Date().toISOString(),
                  },
                }
              );
            } catch (dbErr) {
              console.error("Non-blocking error persisting email status to MongoDB:", dbErr);
            }
          })
          .catch(async (emailErr) => {
            console.error("Non-blocking error dispatching confirmation email:", emailErr);
            try {
              await connectToDatabase();
              await Submission.updateOne(
                { submissionReference: result.submissionReference },
                {
                  $set: {
                    "questionnaireData._emailStatus": "failed",
                    "questionnaireData._emailError": emailErr?.message || "Email dispatch failed",
                  },
                }
              );
            } catch { }
          });
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
        emailStatus,
        emailSentTo,
        emailMessageId,
        emailError,
        emailProvider,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to finalize contractor submission.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
