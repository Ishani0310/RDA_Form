import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats, IFormSummary } from "@/models/Questionnaire";
import { Submission } from "@/models/Submission";
import { recordActivityLog } from "@/lib/audit";
import {
  DEFAULT_QUESTIONNAIRE_CODE,
} from "@/lib/questionnaire-seed";

/**
 * GET /api/forms
 * Centralized Form Management Hub: Returns summary list of all distinct forms.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch only active questionnaires (exclude deleted/archived) sorted by code and versionNumber
    const allQuestionnaires = await Questionnaire.find({ status: { $ne: "ARCHIVED" } }).sort({ code: 1, versionNumber: -1 }).lean();

    // Group by unique code (Form ID)
    const formsMap = new Map<string, typeof allQuestionnaires>();
    allQuestionnaires.forEach((q) => {
      const list = formsMap.get(q.code) || [];
      list.push(q);
      formsMap.set(q.code, list);
    });

    const formSummaries: IFormSummary[] = [];

    for (const [code, versions] of formsMap.entries()) {
      const published = versions.find((v) => v.status === "PUBLISHED" && v.isPublished);
      const draft = versions.find((v) => v.status === "DRAFT");
      const latest = published || draft || versions[0];

      const slug = latest.slug || (latest.isDefault ? "contractor" : code.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      const category = latest.category || "General";

      // Count submissions belonging to this form
      const submissionsCount = await Submission.countDocuments({
        $or: [{ formId: code }, { formSlug: slug }],
      });

      let overallStatus: "PUBLISHED" | "DRAFT" | "UNPUBLISHED" | "ARCHIVED" = "DRAFT";
      if (published) {
        overallStatus = "PUBLISHED";
      } else if (draft) {
        overallStatus = "DRAFT";
      } else if (versions.some((v) => v.status === "ARCHIVED")) {
        overallStatus = "UNPUBLISHED";
      }

      formSummaries.push({
        formId: code,
        code,
        title: latest.title,
        description: latest.description || "",
        instructions: latest.instructions || "",
        category,
        slug,
        status: overallStatus,
        publishedVersion: published?.version,
        draftVersion: draft?.version,
        isLocked: Boolean(latest.isLocked),
        isDefault: Boolean(latest.isDefault || code === DEFAULT_QUESTIONNAIRE_CODE),
        stats: latest.stats || computeQuestionnaireStats(latest.sections),
        submissionsCount,
        publicUrl: (code === DEFAULT_QUESTIONNAIRE_CODE) ? "/register" : `/register/${slug}`,
        publishedAt: published?.publishedAt,
        updatedAt: latest.updatedAt,
        totalVersions: versions.length,
      });
    }

    return NextResponse.json({
      success: true,
      forms: formSummaries,
      totalForms: formSummaries.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load forms.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/forms
 * Create a new form (Blank Template or Duplicate from an existing form).
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const title = (body.title || "").trim();
    const rawCode = (body.code || body.formId || "").trim();
    const rawSlug = (body.slug || "").trim();
    const category = (body.category || "General").trim();
    const description = (body.description || "").trim();
    const instructions = (body.instructions || "").trim();
    const templateType = body.templateType || "blank"; // "blank" | "duplicate"
    const sourceFormCode = body.sourceFormCode;

    if (!title) {
      return NextResponse.json({ success: false, message: "Form title is required." }, { status: 400 });
    }

    // Normalize Form ID & slug
    const code = (rawCode || `RDA-FORM-${Date.now().toString(36).toUpperCase()}`).toUpperCase();
    const slug = (rawSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-")).toLowerCase().replace(/^-|-$/g, "");

    await connectToDatabase();

    // Check if code or slug already in use by another active form
    const existingWithCode = await Questionnaire.findOne({ code });
    if (existingWithCode) {
      return NextResponse.json(
        { success: false, message: `A form with Form ID "${code}" already exists. Please choose a unique Form ID.` },
        { status: 400 }
      );
    }

    const existingWithSlug = await Questionnaire.findOne({ slug });
    if (existingWithSlug) {
      return NextResponse.json(
        { success: false, message: `The URL slug "${slug}" is already assigned to another form. Please choose a unique slug.` },
        { status: 400 }
      );
    }

    // Start fresh: New form must have its own separate questions (not existing questions from Form 1)
    const initialSections = [
      {
        id: `sec_${Date.now().toString(36)}`,
        code: "SEC-01",
        title: "1. General Information",
        description: "Configure separate questions for this section.",
        displayOrder: 1,
        questions: [], // Clean slate with 0 existing questions
      },
    ];

    const stats = computeQuestionnaireStats(initialSections);

    const newQuestionnaire = await Questionnaire.create({
      title,
      code,
      slug,
      category,
      description,
      instructions,
      isDefault: false,
      version: "1.0",
      versionNumber: 1,
      status: "DRAFT",
      isPublished: false,
      isLocked: false,
      lockReason: "",
      createdBy: session.userId && !session.userId.startsWith("DEMO-") ? session.userId : undefined,
      sections: initialSections,
      stats,
      metadata: {
        templateType,
        sourceFormCode: templateType === "duplicate" ? sourceFormCode : null,
        createdAt: new Date().toISOString(),
      },
    });

    await recordActivityLog({
      action: "FORM_CREATED",
      session,
      targetType: "System",
      targetId: newQuestionnaire._id.toString(),
      description: `Created new form "${title}" [${code}] with URL slug "/register/${slug}".`,
      metadata: {
        formId: code,
        slug,
        category,
        templateType,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Form "${title}" created successfully as Draft Version 1.0.`,
      form: {
        formId: code,
        code,
        title,
        slug,
        category,
        publicUrl: (code === DEFAULT_QUESTIONNAIRE_CODE) ? "/register" : `/register/${slug}`,
        status: "DRAFT",
      },
      questionnaire: newQuestionnaire,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create form.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
