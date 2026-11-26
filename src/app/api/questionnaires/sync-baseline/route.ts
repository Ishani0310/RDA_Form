import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats } from "@/models/Questionnaire";
import { getBaselineOfficialSections, DEFAULT_QUESTIONNAIRE_CODE } from "@/lib/questionnaire-seed";
import { recordActivityLog } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/questionnaires/sync-baseline
 * Synchronizes the working form schema in MongoDB with the latest official baseline form
 * including all recent field additions, map picker, peak production rates, and annual capacity layout.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. RDA Officer authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const sections = getBaselineOfficialSections();
    const stats = computeQuestionnaireStats(sections);

    // Update published or draft baseline questionnaire
    let questionnaire = await Questionnaire.findOne({
      code: DEFAULT_QUESTIONNAIRE_CODE,
      status: { $in: ["DRAFT", "PUBLISHED"] },
    }).sort({ updatedAt: -1 });

    if (questionnaire) {
      questionnaire.sections = sections;
      questionnaire.stats = stats;
      questionnaire.updatedAt = new Date();
      await questionnaire.save();
    } else {
      questionnaire = await Questionnaire.create({
        title: "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire",
        code: DEFAULT_QUESTIONNAIRE_CODE,
        slug: "contractor",
        category: "Contractor",
        isDefault: true,
        instructions: "Please complete all mandatory sections before submitting your annual declaration.",
        description:
          "Official institutional questionnaire for collecting contractor, supplier, and government stakeholder capacity declarations under the Inclusive Connectivity and Development Project (ICDP).",
        version: "1.0",
        versionNumber: 1,
        status: "PUBLISHED",
        isPublished: true,
        isLocked: false,
        publishedAt: new Date(),
        sections,
        stats,
        metadata: {
          authoritativeSource: "Road Development Authority - Ministry of Transport and Highways",
          syncedAt: new Date().toISOString(),
          framework: "ICDP-Stage1",
        },
      });
    }

    await recordActivityLog({
      action: "SCHEMA_UPDATE",
      session,
      targetType: "System",
      targetId: questionnaire._id.toString(),
      description: "Synchronized form builder schema with latest official registration form baseline.",
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Form schema successfully synchronized with the latest official registration form baseline.",
        questionnaire,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync baseline questionnaire.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
