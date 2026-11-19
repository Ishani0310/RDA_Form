import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats } from "@/models/Questionnaire";
import { recordActivityLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/questionnaires/:id
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    return NextResponse.json({ success: true, questionnaire });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load questionnaire.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PUT /api/questionnaires/:id
 * Saves draft changes to sections, questions, validations, and conditional logic.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "PROVINCIAL_DIRECTOR") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Admin or Provincial Director privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const questionnaire = await Questionnaire.findById(id);
    if (!questionnaire) {
      return NextResponse.json({ success: false, message: "Questionnaire not found." }, { status: 404 });
    }

    // Protect published versions from direct overwrite (Must edit as Draft!)
    if (questionnaire.status === "PUBLISHED" && questionnaire.isPublished) {
      return NextResponse.json(
        {
          success: false,
          message: "Published questionnaires are immutable to protect historical submission integrity. Please create a revision draft to edit.",
          requiresBranch: true,
        },
        { status: 400 }
      );
    }

    if (questionnaire.isLocked && session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Questionnaire editing is locked by official RDA policy." },
        { status: 403 }
      );
    }

    // Update fields
    if (body.title) questionnaire.title = body.title.trim();
    if (body.description !== undefined) questionnaire.description = body.description.trim();
    if (body.sections && Array.isArray(body.sections)) {
      questionnaire.sections = body.sections;
      questionnaire.stats = computeQuestionnaireStats(body.sections);
    }

    questionnaire.updatedBy =
      session.userId && !session.userId.startsWith("DEMO-") ? (session.userId as any) : undefined;

    await questionnaire.save();

    await recordActivityLog({
      action: "FORM_DRAFT_SAVED",
      session,
      targetType: "System",
      targetId: questionnaire._id.toString(),
      description: `Saved draft updates for Questionnaire Version ${questionnaire.version}.`,
      metadata: {
        sectionsCount: questionnaire.stats.totalSections,
        questionsCount: questionnaire.stats.totalQuestions,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Draft saved successfully.",
      questionnaire,
      lastSaved: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save draft.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * DELETE /api/questionnaires/:id
 * Delete draft (only drafts can be deleted; published and archived versions are protected).
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Administrator privileges required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectToDatabase();

    const questionnaire = await Questionnaire.findById(id);
    if (!questionnaire) {
      return NextResponse.json({ success: false, message: "Questionnaire not found." }, { status: 404 });
    }

    if (questionnaire.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, message: "Cannot delete published or archived questionnaire versions. Only unfinalized drafts can be discarded." },
        { status: 400 }
      );
    }

    await Questionnaire.findByIdAndDelete(id);

    await recordActivityLog({
      action: "FORM_DRAFT_DISCARDED",
      session,
      targetType: "System",
      targetId: id,
      description: `Discarded unfinalized Draft Version ${questionnaire.version}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Draft Version ${questionnaire.version} discarded successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to discard draft.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
