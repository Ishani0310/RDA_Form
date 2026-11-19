import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats } from "@/models/Questionnaire";
import { recordActivityLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/forms/:code/duplicate
 * Duplicates an entire form into a new independent form.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    // Find the latest version of the source form
    const sourceForm = await Questionnaire.findOne({ code }).sort({ versionNumber: -1 });
    if (!sourceForm) {
      return NextResponse.json({ success: false, message: `Source form "${code}" not found.` }, { status: 404 });
    }

    const targetTitle = (body.title || `${sourceForm.title} (Copy)`).trim();
    const targetCode = (body.code || `${sourceForm.code}_COPY_${Date.now().toString(36).slice(-4)}`).toUpperCase().trim();
    const targetSlug = (body.slug || `${sourceForm.slug || code.toLowerCase()}-copy-${Date.now().toString(36).slice(-4)}`).toLowerCase().trim();
    const targetCategory = (body.category || sourceForm.category || "General").trim();

    // Ensure uniqueness
    const codeExists = await Questionnaire.findOne({ code: targetCode });
    if (codeExists) {
      return NextResponse.json({ success: false, message: `Form ID "${targetCode}" already exists.` }, { status: 400 });
    }
    const slugExists = await Questionnaire.findOne({ slug: targetSlug });
    if (slugExists) {
      return NextResponse.json({ success: false, message: `URL Slug "${targetSlug}" already exists.` }, { status: 400 });
    }

    // Deep clone sections with regenerated IDs to prevent cross-form references
    const idMap = new Map<string, string>();

    // First map all question IDs
    (sourceForm.sections || []).forEach((sec) => {
      (sec.questions || []).forEach((q) => {
        idMap.set(q.id, `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);
      });
    });

    const clonedSections = (sourceForm.sections || []).map((sec, sIdx) => ({
      id: `sec_${Date.now().toString(36)}_${sIdx}`,
      code: sec.code,
      title: sec.title,
      description: sec.description,
      displayOrder: sec.displayOrder,
      isCollapsed: Boolean(sec.isCollapsed),
      questions: (sec.questions || []).map((q) => {
        const newQId = idMap.get(q.id) || `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        let conditionalLogic = undefined;
        if (q.conditionalLogic?.enabled) {
          const remappedDepId = idMap.get(q.conditionalLogic.dependsOnQuestionId) || q.conditionalLogic.dependsOnQuestionId;
          conditionalLogic = {
            ...q.conditionalLogic,
            dependsOnQuestionId: remappedDepId,
          };
        }
        return {
          ...q,
          id: newQId,
          conditionalLogic,
        };
      }),
    }));

    const stats = computeQuestionnaireStats(clonedSections);

    const duplicatedForm = await Questionnaire.create({
      title: targetTitle,
      code: targetCode,
      slug: targetSlug,
      category: targetCategory,
      description: body.description || sourceForm.description || "",
      instructions: body.instructions || sourceForm.instructions || "",
      isDefault: false,
      version: "1.0",
      versionNumber: 1,
      status: "DRAFT",
      isPublished: false,
      isLocked: false,
      lockReason: "",
      createdBy: session.userId && !session.userId.startsWith("DEMO-") ? session.userId : undefined,
      sections: clonedSections,
      stats,
      metadata: {
        duplicatedFromCode: sourceForm.code,
        duplicatedFromVersion: sourceForm.version,
        duplicatedAt: new Date().toISOString(),
      },
    });

    await recordActivityLog({
      action: "FORM_DUPLICATED",
      session,
      targetType: "System",
      targetId: targetCode,
      description: `Duplicated form "${sourceForm.title}" [${code}] into new form "${targetTitle}" [${targetCode}].`,
    });

    return NextResponse.json({
      success: true,
      message: `Form duplicated successfully as "${targetTitle}" [${targetCode}].`,
      form: {
        formId: targetCode,
        code: targetCode,
        title: targetTitle,
        slug: targetSlug,
        publicUrl: `/register/${targetSlug}`,
        status: "DRAFT",
      },
      questionnaire: duplicatedForm,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to duplicate form.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
