import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { submitFinalDeclaration, isValidTokenFormat } from "@/lib/draft-service";

/**
 * POST /api/public/submit
 * Finalize contractor annual filing.
 * - Enforces single submission (revokes resume token immediately).
 * - Transitions statuses to Submitted and Pending_Review.
 * - Assigns permanent RDA/SUB/YYYY/XXXXX submission reference.
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
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to finalize contractor submission.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
