import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire } from "@/models/Questionnaire";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/questionnaires/:id/export
 * Exports the complete questionnaire schema as structured JSON.
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

    const exportPayload = {
      system: "RDA Contractor Data Collection System",
      authoritativeSource: "Road Development Authority, Sri Lanka",
      exportedAt: new Date().toISOString(),
      questionnaire: {
        title: questionnaire.title,
        code: questionnaire.code,
        version: questionnaire.version,
        description: questionnaire.description,
        stats: questionnaire.stats,
        sections: questionnaire.sections,
      },
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${questionnaire.code}-v${questionnaire.version}-schema.json"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to export questionnaire schema.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
