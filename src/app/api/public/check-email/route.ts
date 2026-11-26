import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Submission, DraftToken } from "@/models";
import { hashResumeToken, isValidTokenFormat } from "@/lib/draft-service";

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * GET /api/public/check-email?email=...&token=...
 * Validates that an organization's email address has not already been used for an official submission.
 * Enforces one submission per email address.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    const token = (searchParams.get("token") || "").trim();
    const formSlug = (searchParams.get("slug") || searchParams.get("formId") || "").trim();

    if (!email) {
      return NextResponse.json(
        { available: true, message: "No email provided." },
        { status: 200 }
      );
    }

    await connectToDatabase();

    // Identify current session's submission if valid token provided (allow resuming own draft)
    let currentSubmissionId: any = null;

    if (token && isValidTokenFormat(token)) {
      const tokenHash = hashResumeToken(token);
      const draftDoc = await DraftToken.findOne({ tokenHash });
      if (draftDoc) {
        currentSubmissionId = draftDoc.submission;
      }
    }

    const query: Record<string, unknown> = {
      status: { $in: ["Submitted", "Under_Review", "Verified", "Pending_Review"] },
      $or: [
        { "questionnaireData.email": { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
        { "questionnaireData.participant1.email": { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
        { "questionnaireData._emailSentTo": { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
      ],
    };

    if (formSlug) {
      const isSupplier = formSlug.toLowerCase() === "supplier" || formSlug.toUpperCase() === "RDA-SUPPLIER-Q";
      if (isSupplier) {
        query.formId = "RDA-SUPPLIER-Q";
      } else {
        query.formId = { $ne: "RDA-SUPPLIER-Q" };
      }
    }

    if (currentSubmissionId) {
      query._id = { $ne: currentSubmissionId };
    }

    const existingSubmission = await Submission.findOne(query).select("submissionReference businessName").lean();

    if (existingSubmission) {
      const ref = (existingSubmission as any).submissionReference || "existing record";
      return NextResponse.json({
        available: false,
        message: `This email address "${email}" has already been used for an official submission (${ref}). Each organization may only submit once per email address.`,
      });
    }

    return NextResponse.json({
      available: true,
      message: `Email "${email}" is available.`,
    });
  } catch (error: unknown) {
    console.error("Error checking email uniqueness:", error);
    return NextResponse.json(
      { available: true, message: "Could not verify email uniqueness at this moment." },
      { status: 200 }
    );
  }
}
