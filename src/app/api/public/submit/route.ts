import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { submitFinalDeclaration, saveOrUpdateDraft, isValidTokenFormat } from "@/lib/draft-service";
import { sendRegistrationConfirmationEmail, SendEmailResult } from "@/lib/email-service";
import { connectToDatabase } from "@/lib/mongodb";
import { Submission } from "@/models/Submission";

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

    let emailStatus: "not_provided" | "pending" | "sent" | "failed" = targetEmail ? "pending" : "not_provided";
    let emailSentTo: string | null = targetEmail || null;
    let emailMessageId: string | null = null;
    let emailError: string | null = null;
    let emailProvider: string | null = null;

    if (targetEmail) {
      // Execute email delivery via Resend SDK asynchronously
      const emailPromise = sendRegistrationConfirmationEmail({
        to: targetEmail,
        reference: result.submissionReference,
        businessName: result.businessName,
        willParticipate: result.questionnaireData?.willParticipate || "Yes",
        participant1Name: result.questionnaireData?.participant1?.fullName || result.contactOfficer?.name,
        participant1Designation: result.questionnaireData?.participant1?.designation || result.contactOfficer?.designation,
        workshopDate: "07 December 2026",
        workshopTime: "9:00 AM",
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
          return emailRes;
        })
        .catch(async (emailErr): Promise<SendEmailResult> => {
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
          } catch {}
          return {
            success: false,
            provider: "resend",
            sentTo: targetEmail,
            error: emailErr?.message || "Email dispatch failed",
          };
        });

      // Quick-resolve without blocking: wait up to 1200ms so fast Resend API responses
      // return the verified "sent" status immediately in turn 1 without waiting on slow networks.
      const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
        setTimeout(() => resolve({ timeout: true }), 1200)
      );

      const raceResult = await Promise.race([emailPromise, timeoutPromise]);
      if (!("timeout" in raceResult)) {
        emailStatus = raceResult.success ? "sent" : "failed";
        emailSentTo = raceResult.sentTo || targetEmail;
        emailMessageId = raceResult.messageId || null;
        emailError = raceResult.error || null;
        emailProvider = raceResult.provider;
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
