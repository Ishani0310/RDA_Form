import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { Submission } from "@/models/Submission";
import { ActivityLog } from "@/models/ActivityLog";

/**
 * GET /api/notifications
 * Retrieves real-time alerts and activity notifications for the administrative console.
 */
export async function GET() {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Officer authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Check count; if empty, seed recent notifications from existing submissions & logs
    const existingCount = await Notification.countDocuments();
    if (existingCount === 0) {
      // Find latest submitted submissions
      const latestSubs = await Submission.find({ status: { $in: ["Submitted", "Verified", "Under_Review"] } })
        .sort({ submittedAt: -1, createdAt: -1 })
        .limit(5)
        .populate("contractor")
        .lean();

      for (const s of latestSubs) {
        const contractorName = (s.contractor as any)?.businessName || (s.questionnaireData as any)?.organizationName || "Contractor";
        await Notification.create({
          type: "SUBMISSION",
          title: "Registration Submission Received",
          message: `${contractorName} submitted their official registration (${s.submissionReference})`,
          reference: s.submissionReference,
          link: `/submissions?ref=${encodeURIComponent(s.submissionReference)}`,
          createdAt: s.submittedAt || s.createdAt || new Date(),
          isRead: false,
        }).catch(() => {});
      }

      // Find latest draft submissions
      const latestDrafts = await Submission.find({ status: "Draft" })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(3)
        .populate("contractor")
        .lean();

      for (const d of latestDrafts) {
        const contractorName = (d.contractor as any)?.businessName || (d.questionnaireData as any)?.organizationName || "Participant";
        await Notification.create({
          type: "DRAFT",
          title: "Registration Form Started",
          message: `${contractorName} started filling registration form (${d.submissionReference})`,
          reference: d.submissionReference,
          link: `/submissions?ref=${encodeURIComponent(d.submissionReference)}`,
          createdAt: d.updatedAt || d.createdAt || new Date(),
          isRead: false,
        }).catch(() => {});
      }

      // Add current officer session notice
      await Notification.create({
        type: "LOGIN",
        title: "Officer Session Active",
        message: `${session.fullName} (${session.role.replace("_", " ")}) authenticated successfully`,
        createdAt: new Date(),
        isRead: false,
      }).catch(() => {});
    }

    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ isRead: false });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load notifications.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Marks notifications as read.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Officer authentication required." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      await Notification.updateOne({ _id: id }, { $set: { isRead: true } });
    } else {
      await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
    }

    return NextResponse.json({
      success: true,
      message: "Notifications updated successfully.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update notifications.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
