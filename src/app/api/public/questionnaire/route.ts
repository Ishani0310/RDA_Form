import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire } from "@/models/Questionnaire";
import { seedDefaultQuestionnaire, DEFAULT_QUESTIONNAIRE_CODE } from "@/lib/questionnaire-seed";

/**
 * GET /api/public/questionnaire
 * Returns the currently active PUBLISHED questionnaire schema for the public registration portal.
 * Supports query parameters:
 *  - ?form=<formId|slug>
 *  - ?slug=<slug>
 * Defaults to the baseline RDA Contractor Registration Form if omitted.
 */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const formParam = (searchParams.get("form") || searchParams.get("slug") || "").trim();

    let published = null;

    if (formParam) {
      published = await Questionnaire.findOne({
        $or: [
          { code: formParam },
          { slug: formParam },
          { code: formParam.toUpperCase() },
          { slug: formParam.toLowerCase() },
        ],
        status: "PUBLISHED",
      }).lean();

      if (!published) {
        return NextResponse.json(
          {
            success: false,
            message: `No active published registration form found matching "${formParam}". Please verify your link.`,
          },
          { status: 404 }
        );
      }
    } else {
      // Default baseline contractor form
      published = await Questionnaire.findOne({
        code: DEFAULT_QUESTIONNAIRE_CODE,
        status: "PUBLISHED",
      }).lean();

      if (!published) {
        const seeded = await seedDefaultQuestionnaire();
        published = seeded.toObject ? seeded.toObject() : seeded;
      }
    }

    return NextResponse.json({
      success: true,
      questionnaire: published,
      form: {
        id: published._id,
        code: published.code,
        slug: published.slug || "contractor",
        title: published.title,
        description: published.description,
        instructions: published.instructions || "",
        category: published.category || "General",
        version: published.version,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load published questionnaire.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
