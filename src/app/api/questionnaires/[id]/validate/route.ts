import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire } from "@/models/Questionnaire";
import { validateQuestionnaireSchema } from "@/lib/questionnaire-schema-validator";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/questionnaires/:id/validate
 * Validates the questionnaire schema before publication.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const questionnaire = await Questionnaire.findById(id).lean();
    if (!questionnaire) {
      return NextResponse.json({ success: false, message: "Questionnaire not found." }, { status: 404 });
    }

    const report = validateQuestionnaireSchema(questionnaire.sections);

    return NextResponse.json({
      success: true,
      report,
      isValid: report.isValid,
      errorsCount: report.errors.length,
      warningsCount: report.warnings.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to validate questionnaire.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
