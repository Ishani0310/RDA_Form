import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Contractor, Submission, DraftToken } from "@/models";
import { hashResumeToken, isValidTokenFormat } from "@/lib/draft-service";

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

/**
 * GET /api/public/check-reg-number?regNumber=...&token=...
 * Validates that an ICTAD / CIDA registration number is strictly unique.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regNumber = (searchParams.get("regNumber") || "").trim();
    const token = (searchParams.get("token") || "").trim();

    if (!regNumber) {
      return NextResponse.json(
        { available: true, message: "No registration number provided." },
        { status: 200 }
      );
    }

    await connectToDatabase();

    const normalizedReg = regNumber.toUpperCase();

    // Identify current session's contractor and submission if valid token provided
    let currentContractorId: any = null;
    let currentSubmissionId: any = null;

    if (token && isValidTokenFormat(token)) {
      const tokenHash = hashResumeToken(token);
      const draftDoc = await DraftToken.findOne({ tokenHash });
      if (draftDoc) {
        currentContractorId = draftDoc.contractor;
        currentSubmissionId = draftDoc.submission;
      }
    }

    // 1. Check Contractor collection for duplicate registration number
    const contractorQuery: Record<string, unknown> = {
      registrationNumber: { $regex: new RegExp(`^${escapeRegex(normalizedReg)}$`, "i") },
    };
    if (currentContractorId) {
      contractorQuery._id = { $ne: currentContractorId };
    }

    const existingContractor = await Contractor.findOne(contractorQuery).lean();

    if (existingContractor) {
      return NextResponse.json({
        available: false,
        message: `ICTAD registration number "${regNumber}" is already registered in the system. Each contractor must enter a unique registration number.`,
      });
    }

    // 2. Check Submission collection for already finalized submissions with this registration number
    const submissionQuery: Record<string, unknown> = {
      "questionnaireData.ictadRegistrationNumber": {
        $regex: new RegExp(`^${escapeRegex(normalizedReg)}$`, "i"),
      },
      status: { $in: ["Submitted", "Under_Review", "Verified", "Pending_Review"] },
    };
    if (currentSubmissionId) {
      submissionQuery._id = { $ne: currentSubmissionId };
    }

    const existingSubmission = await Submission.findOne(submissionQuery).lean();

    if (existingSubmission) {
      return NextResponse.json({
        available: false,
        message: `ICTAD registration number "${regNumber}" has already been submitted under reference ${(existingSubmission as any).submissionReference}. Please enter a unique registration number.`,
      });
    }

    return NextResponse.json({
      available: true,
      message: `Registration number "${regNumber}" is available.`,
    });
  } catch (error: unknown) {
    console.error("Error checking registration number uniqueness:", error);
    return NextResponse.json(
      { available: true, message: "Could not verify uniqueness at this moment." },
      { status: 200 }
    );
  }
}
