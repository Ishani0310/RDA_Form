import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Questionnaire } from "@/models/Questionnaire";
import { recordActivityLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/questionnaires/:id/lock
 * Toggles the official RDA policy lock on the questionnaire.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Super Administrator privileges required to alter RDA Policy Lock." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    await connectToDatabase();

    const questionnaire = await Questionnaire.findById(id);
    if (!questionnaire) {
      return NextResponse.json({ success: false, message: "Questionnaire not found." }, { status: 404 });
    }

    const newLockState = body.isLocked !== undefined ? Boolean(body.isLocked) : !questionnaire.isLocked;
    const lockReason = body.lockReason || (newLockState ? "Editing Disabled by RDA Policy" : "");

    questionnaire.isLocked = newLockState;
    questionnaire.lockReason = lockReason;
    await questionnaire.save();

    await recordActivityLog({
      action: newLockState ? "FORM_POLICY_LOCKED" : "FORM_POLICY_UNLOCKED",
      session,
      targetType: "System",
      targetId: questionnaire._id.toString(),
      description: newLockState
        ? `Applied official RDA Policy Lock: "${lockReason}"`
        : `Removed official RDA Policy Lock on Questionnaire Version ${questionnaire.version}.`,
    });

    return NextResponse.json({
      success: true,
      message: newLockState ? "Questionnaire policy lock enabled." : "Questionnaire policy lock removed.",
      isLocked: questionnaire.isLocked,
      lockReason: questionnaire.lockReason,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to toggle policy lock.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
