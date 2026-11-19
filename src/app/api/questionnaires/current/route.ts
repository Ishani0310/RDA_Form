import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats } from "@/models/Questionnaire";
import { seedDefaultQuestionnaire, DEFAULT_QUESTIONNAIRE_CODE } from "@/lib/questionnaire-seed";

/**
 * GET /api/questionnaires/current
 * Loads the current working questionnaire for the Form Builder.
 * Supports query parameters:
 *  - ?form=<formId|slug>
 *  - ?code=<formId>
 * Priority:
 * 1. Active working DRAFT for the requested form
 * 2. Active PUBLISHED questionnaire for the requested form
 * 3. Auto-seeded baseline Version 1.0 (if default form and collection is empty)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. RDA Officer authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const requestedCode = (searchParams.get("form") || searchParams.get("code") || "").trim();
    const targetCode = requestedCode || DEFAULT_QUESTIONNAIRE_CODE;

    // First check for active draft
    let draft = await Questionnaire.findOne({
      $or: [{ code: targetCode }, { slug: targetCode }],
      status: "DRAFT",
    }).lean();

    // If no draft, fetch current published version
    let published = await Questionnaire.findOne({
      $or: [{ code: targetCode }, { slug: targetCode }],
      status: "PUBLISHED",
    }).lean();

    // If still not found and no specific code requested or default requested, seed default
    if (!draft && !published && (!requestedCode || requestedCode === DEFAULT_QUESTIONNAIRE_CODE)) {
      const seeded = await seedDefaultQuestionnaire();
      published = seeded.toObject ? seeded.toObject() : seeded;
    }

    const workingQuestionnaire = draft || published;

    if (!workingQuestionnaire) {
      return NextResponse.json(
        {
          success: false,
          message: `Form "${targetCode}" not found.`,
        },
        { status: 404 }
      );
    }

    // Determine role-based permissions
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isDirector = session.role === "PROVINCIAL_DIRECTOR";
    const canManage = isSuperAdmin || isDirector;

    // Status state
    let effectiveStatus: string = workingQuestionnaire?.status || "NO_FORM";
    if (workingQuestionnaire?.isLocked) {
      effectiveStatus = "SCHEMA_LOCKED";
    }

    return NextResponse.json({
      success: true,
      questionnaire: workingQuestionnaire,
      hasDraft: Boolean(draft),
      effectiveStatus,
      permissions: {
        canEdit: canManage && !workingQuestionnaire.isLocked,
        canPublish: canManage && !workingQuestionnaire.isLocked,
        canLock: isSuperAdmin,
        canImport: canManage && !workingQuestionnaire.isLocked,
        canExport: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load current questionnaire.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
