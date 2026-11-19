import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire } from "@/models/Questionnaire";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/questionnaires/:id/versions
 * Returns the immutable version history of the questionnaire.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const current = await Questionnaire.findById(id).select("code");
    if (!current) {
      return NextResponse.json({ success: false, message: "Questionnaire not found." }, { status: 404 });
    }

    const versions = await Questionnaire.find({ code: current.code })
      .sort({ versionNumber: -1 })
      .select("title version versionNumber status isPublished isLocked stats publishedAt publishedBy createdBy updatedAt")
      .populate("publishedBy", "fullName email")
      .populate("createdBy", "fullName email")
      .lean();

    return NextResponse.json({ success: true, versions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load version history.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
