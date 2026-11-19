import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats } from "@/models/Questionnaire";
import { DEFAULT_QUESTIONNAIRE_CODE } from "@/lib/questionnaire-seed";
import { recordActivityLog } from "@/lib/audit";

/**
 * GET /api/questionnaires
 * List all questionnaires and revisions (can filter by ?code=...).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.trim();

    await connectToDatabase();
    const query = code ? { code } : {};

    const questionnaires = await Questionnaire.find(query)
      .sort({ updatedAt: -1 })
      .select("title code slug category version versionNumber status isPublished isLocked stats publishedAt updatedAt")
      .lean();

    return NextResponse.json({ success: true, questionnaires });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to list questionnaires.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/questionnaires
 * Create a working draft for a specified form code (branches from active/latest version).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "PROVINCIAL_DIRECTOR") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Admin or Provincial Director privileges required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const targetCode = (body.code || body.formId || DEFAULT_QUESTIONNAIRE_CODE).trim();

    await connectToDatabase();

    // Check if an unfinalized draft already exists for this form
    const existingDraft = await Questionnaire.findOne({
      code: targetCode,
      status: "DRAFT",
    });

    if (existingDraft) {
      return NextResponse.json({
        success: true,
        message: `An active working draft already exists for ${targetCode}.`,
        questionnaire: existingDraft,
        isNew: false,
      });
    }

    // Find the latest version of this form to branch from
    const latestVersion = await Questionnaire.findOne({
      code: targetCode,
    }).sort({ versionNumber: -1 });

    const newVersionNumber = (latestVersion?.versionNumber || 1) + 1;
    const newVersionLabel = `1.${newVersionNumber - 1}`;

    const sections = latestVersion?.sections || [];
    const stats = computeQuestionnaireStats(sections);

    const newDraft = await Questionnaire.create({
      title: latestVersion?.title || body.title || "New Questionnaire",
      code: targetCode,
      slug: latestVersion?.slug || body.slug || targetCode.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: latestVersion?.category || body.category || "General",
      instructions: latestVersion?.instructions || body.instructions || "",
      isDefault: latestVersion?.isDefault || false,
      description: latestVersion?.description || body.description || "",
      version: newVersionLabel,
      versionNumber: newVersionNumber,
      status: "DRAFT",
      isPublished: false,
      isLocked: false,
      lockReason: "",
      createdBy: session.userId && !session.userId.startsWith("DEMO-") ? session.userId : undefined,
      sections,
      stats,
      metadata: {
        branchedFromVersion: latestVersion?.version || "1.0",
        branchedAt: new Date().toISOString(),
      },
    });

    await recordActivityLog({
      action: "FORM_DRAFT_CREATED",
      session,
      targetType: "System",
      targetId: newDraft._id.toString(),
      description: `Created revision draft Version ${newVersionLabel} for ${targetCode}.`,
      metadata: {
        formCode: targetCode,
        version: newVersionLabel,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Revision draft Version ${newVersionLabel} created successfully for ${targetCode}.`,
      questionnaire: newDraft,
      isNew: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create draft.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
