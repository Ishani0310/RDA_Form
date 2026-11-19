import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats, IFormSection } from "@/models/Questionnaire";
import { validateQuestionnaireSchema } from "@/lib/questionnaire-schema-validator";
import { DEFAULT_QUESTIONNAIRE_CODE } from "@/lib/questionnaire-seed";
import { recordActivityLog } from "@/lib/audit";

/**
 * POST /api/questionnaires/import
 * Imports a questionnaire JSON schema and saves it as a working DRAFT.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "PROVINCIAL_DIRECTOR") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Admin or Provincial Director privileges required to import schemas." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
    }

    // Support both direct questionnaire object or wrapped in { questionnaire: ... }
    const schemaData = body.questionnaire || body;
    const sections: IFormSection[] = schemaData.sections || [];

    // Validate the imported schema
    const report = validateQuestionnaireSchema(sections);
    if (!report.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Schema validation failed on imported JSON.",
          errors: report.errors,
          warnings: report.warnings,
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if an unfinalized draft already exists; if so, replace it, otherwise create a new draft
    let draft = await Questionnaire.findOne({
      code: DEFAULT_QUESTIONNAIRE_CODE,
      status: "DRAFT",
    });

    const latest = await Questionnaire.findOne({
      code: DEFAULT_QUESTIONNAIRE_CODE,
    }).sort({ versionNumber: -1 });

    const newVersionNumber = (latest?.versionNumber || 1) + 1;
    const newVersionLabel = `1.${newVersionNumber - 1}`;
    const stats = computeQuestionnaireStats(sections);

    if (draft) {
      draft.title = schemaData.title || draft.title;
      draft.description = schemaData.description || draft.description;
      draft.sections = sections;
      draft.stats = stats;
      draft.metadata = {
        ...draft.metadata,
        importedAt: new Date().toISOString(),
        importedBy: session.fullName,
      };
      await draft.save();
    } else {
      draft = await Questionnaire.create({
        title: schemaData.title || "RDA Contractor Registration & Capacity Declaration Questionnaire",
        code: DEFAULT_QUESTIONNAIRE_CODE,
        description: schemaData.description || "",
        version: newVersionLabel,
        versionNumber: newVersionNumber,
        status: "DRAFT",
        isPublished: false,
        isLocked: false,
        createdBy: session.userId && !session.userId.startsWith("DEMO-") ? (session.userId as any) : undefined,
        sections,
        stats,
        metadata: {
          importedAt: new Date().toISOString(),
          importedBy: session.fullName,
        },
      });
    }

    await recordActivityLog({
      action: "FORM_SCHEMA_IMPORTED",
      session,
      targetType: "System",
      targetId: draft._id.toString(),
      description: `Imported questionnaire schema JSON with ${stats.totalQuestions} questions across ${stats.totalSections} sections. Saved as Draft Version ${draft.version}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Schema imported successfully as Draft Version ${draft.version}. Review and publish when ready.`,
      questionnaire: draft,
      warnings: report.warnings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to import questionnaire schema.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
