import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire } from "@/models/Questionnaire";
import { recordActivityLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/forms/:code/unpublish
 * Unpublishes a currently active published form.
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
    await connectToDatabase();

    const published = await Questionnaire.findOne({ code, status: "PUBLISHED" });
    if (!published) {
      return NextResponse.json(
        { success: false, message: `Form "${code}" does not currently have an active published version.` },
        { status: 400 }
      );
    }

    published.status = "ARCHIVED";
    published.isPublished = false;
    await published.save();

    await recordActivityLog({
      action: "FORM_UNPUBLISHED",
      session,
      targetType: "System",
      targetId: code,
      description: `Unpublished Form "${published.title}" [${code}] Version ${published.version}. Public registration disabled.`,
    });

    return NextResponse.json({
      success: true,
      message: `Form "${published.title}" [${code}] has been unpublished successfully.`,
      status: "UNPUBLISHED",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to unpublish form.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
