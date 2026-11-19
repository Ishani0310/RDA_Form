import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats } from "@/models/Questionnaire";
import { validateQuestionnaireSchema } from "@/lib/questionnaire-schema-validator";
import { recordActivityLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/questionnaires/:id/publish
 * Publishes the draft questionnaire as the official active version.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "PROVINCIAL_DIRECTOR") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Admin or Provincial Director privileges required to publish official questionnaires." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const draft = await Questionnaire.findById(id);
    if (!draft) {
      return NextResponse.json({ success: false, message: "Questionnaire not found." }, { status: 404 });
    }

    if (draft.isLocked && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Questionnaire is locked by RDA policy. Publication is disabled." },
        { status: 403 }
      );
    }

    // 1. Deep Schema Validation
    const report = validateQuestionnaireSchema(draft.sections);
    if (!report.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot publish questionnaire. ${report.errors.length} validation errors must be resolved.`,
          errors: report.errors,
          warnings: report.warnings,
        },
        { status: 400 }
      );
    }

    // 2. Archive previously published version
    const previousPublished = await Questionnaire.findOne({
      code: draft.code,
      status: "PUBLISHED",
      _id: { $ne: draft._id },
    });

    if (previousPublished) {
      previousPublished.status = "ARCHIVED";
      previousPublished.isPublished = false;
      await previousPublished.save();
    }

    // 3. Mark current draft as PUBLISHED
    draft.status = "PUBLISHED";
    draft.isPublished = true;
    draft.publishedAt = new Date();
    draft.publishedBy =
      session.userId && !session.userId.startsWith("DEMO-") ? (session.userId as any) : undefined;
    draft.stats = computeQuestionnaireStats(draft.sections);

    await draft.save();

    // 4. Record Audit Log
    await recordActivityLog({
      action: "FORM_PUBLISHED",
      session,
      targetType: "System",
      targetId: draft._id.toString(),
      description: `Officially published Questionnaire Version ${draft.version} (${draft.stats.totalQuestions} questions across ${draft.stats.totalSections} sections).`,
      metadata: {
        version: draft.version,
        sectionsCount: draft.stats.totalSections,
        questionsCount: draft.stats.totalQuestions,
        previousVersionArchived: previousPublished?.version || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Questionnaire Version ${draft.version} officially published successfully.`,
      questionnaire: draft,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish questionnaire.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
