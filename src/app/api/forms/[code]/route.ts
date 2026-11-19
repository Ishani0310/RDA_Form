import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire, computeQuestionnaireStats } from "@/models/Questionnaire";
import { Submission } from "@/models/Submission";
import { recordActivityLog } from "@/lib/audit";
import { DEFAULT_QUESTIONNAIRE_CODE } from "@/lib/questionnaire-seed";

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/forms/:code
 * Fetch complete form metadata, active versions, and submission metrics.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { code } = await params;
    await connectToDatabase();

    const versions = await Questionnaire.find({ code }).sort({ versionNumber: -1 }).lean();
    if (!versions || versions.length === 0) {
      return NextResponse.json({ success: false, message: `Form "${code}" not found.` }, { status: 404 });
    }

    const published = versions.find((v) => v.status === "PUBLISHED" && v.isPublished);
    const draft = versions.find((v) => v.status === "DRAFT");
    const latest = published || draft || versions[0];

    const slug = latest.slug || code.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const submissionsCount = await Submission.countDocuments({
      $or: [{ formId: code }, { formSlug: slug }],
    });

    return NextResponse.json({
      success: true,
      form: {
        formId: code,
        code,
        title: latest.title,
        description: latest.description || "",
        instructions: latest.instructions || "",
        category: latest.category || "General",
        slug,
        isDefault: Boolean(latest.isDefault || code === DEFAULT_QUESTIONNAIRE_CODE),
        isLocked: Boolean(latest.isLocked),
        publishedVersion: published?.version,
        draftVersion: draft?.version,
        submissionsCount,
        publicUrl: `/register/${slug}`,
        versions: versions.map((v) => ({
          id: v._id,
          version: v.version,
          versionNumber: v.versionNumber,
          status: v.status,
          isPublished: v.isPublished,
          publishedAt: v.publishedAt,
          updatedAt: v.updatedAt,
          stats: v.stats,
        })),
      },
      activeQuestionnaire: draft || published || latest,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load form details.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PUT /api/forms/:code
 * Update form settings (title, description, instructions, category, slug).
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

    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const title = (body.title || "").trim();
    const rawSlug = (body.slug || "").trim();
    const category = (body.category || "General").trim();
    const description = (body.description || "").trim();
    const instructions = (body.instructions || "").trim();

    if (!title) {
      return NextResponse.json({ success: false, message: "Form title cannot be empty." }, { status: 400 });
    }

    const slug = (rawSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-")).toLowerCase().replace(/^-|-$/g, "");

    await connectToDatabase();

    // Check if new slug collides with another form family
    const existingSlug = await Questionnaire.findOne({ slug, code: { $ne: code } });
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: `The URL slug "${slug}" is already in use by another form.` },
        { status: 400 }
      );
    }

    // Update all versions belonging to this form family to synchronize metadata
    await Questionnaire.updateMany(
      { code },
      {
        $set: {
          title,
          slug,
          category,
          description,
          instructions,
          updatedBy: session.userId && !session.userId.startsWith("DEMO-") ? session.userId : undefined,
        },
      }
    );

    await recordActivityLog({
      action: "FORM_SETTINGS_UPDATED",
      session,
      targetType: "System",
      targetId: code,
      description: `Updated form settings for "${title}" [${code}] (Slug: "/register/${slug}").`,
    });

    return NextResponse.json({
      success: true,
      message: `Form settings for "${title}" updated successfully.`,
      slug,
      publicUrl: `/register/${slug}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update form settings.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * DELETE /api/forms/:code
 * Delete or safely archive a form.
 * - Protects baseline contractor form.
 * - If submissions exist: safely archives all versions to protect historical data.
 * - If 0 submissions: removes the form documents completely.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Administrator privileges required to delete forms." },
        { status: 403 }
      );
    }

    const { code } = await params;

    // Baseline protection
    if (code === DEFAULT_QUESTIONNAIRE_CODE) {
      return NextResponse.json(
        { success: false, message: "The baseline RDA Contractor Registration Form is protected and cannot be deleted." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const forms = await Questionnaire.find({ code });
    if (!forms.length) {
      return NextResponse.json({ success: false, message: `Form "${code}" not found.` }, { status: 404 });
    }

    const slug = forms[0].slug || code.toLowerCase();
    const submissionsCount = await Submission.countDocuments({
      $or: [{ formId: code }, { formSlug: slug }],
    });

    if (submissionsCount > 0) {
      // Safe Archival
      await Questionnaire.updateMany(
        { code },
        {
          $set: {
            status: "ARCHIVED",
            isPublished: false,
          },
        }
      );

      await recordActivityLog({
        action: "FORM_ARCHIVED",
        session,
        targetType: "System",
        targetId: code,
        description: `Archived form "${forms[0].title}" [${code}] safely (${submissionsCount} submissions preserved).`,
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: `Form [${code}] has ${submissionsCount} historical submissions. It was safely archived and unpublished without data loss.`,
      });
    }

    // Zero submissions: safe permanent purge
    await Questionnaire.deleteMany({ code });

    await recordActivityLog({
      action: "FORM_DELETED",
      session,
      targetType: "System",
      targetId: code,
      description: `Permanently removed form [${code}] (0 submissions).`,
    });

    return NextResponse.json({
      success: true,
      archived: false,
      message: `Form [${code}] was deleted successfully.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete form.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
