import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { recordActivityLog } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/officers/[id]
 * Update officer account status, assignment, or credentials.
 * RBAC: Restricted to SUPER_ADMIN and PROVINCIAL_DIRECTOR (scoped).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Active officer session required." },
        { status: 401 }
      );
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "PROVINCIAL_DIRECTOR") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Insufficient administrative privileges." },
        { status: 403 }
      );
    }

    const { id: targetId } = await params;

    if (!targetId) {
      return NextResponse.json(
        { success: false, message: "Target officer ID is required." },
        { status: 400 }
      );
    }

    // Check self-deactivation before DB query
    const body = await request.json();
    const { isActive, designation, phone, assignedProvince, newPassword } = body;

    if (typeof isActive === "boolean" && !isActive && targetId === session.userId) {
      return NextResponse.json(
        { success: false, message: "Security violation: You cannot deactivate your own active session account." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const targetUser = await User.findById(targetId).catch(() => null);

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "Officer account not found." },
        { status: 404 }
      );
    }

    // RBAC: Provincial Directors can only modify field officers within their own province
    if (session.role === "PROVINCIAL_DIRECTOR") {
      if (
        targetUser.role === "SUPER_ADMIN" ||
        targetUser.role === "PROVINCIAL_DIRECTOR" ||
        targetUser.assignedProvince !== session.assignedProvince
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Provincial Directors can only manage field officers within their assigned province.",
          },
          { status: 403 }
        );
      }
    }

    const changes: string[] = [];

    // 1. Account Activation / Deactivation Protection
    if (typeof isActive === "boolean" && isActive !== targetUser.isActive) {
      // Self-deactivation prevention
      if (targetUser._id.toString() === session.userId && !isActive) {
        return NextResponse.json(
          { success: false, message: "Security violation: You cannot deactivate your own active session account." },
          { status: 400 }
        );
      }

      // Sole Super Administrator protection
      if (targetUser.role === "SUPER_ADMIN" && !isActive) {
        const activeSuperAdmins = await User.countDocuments({
          role: "SUPER_ADMIN",
          isActive: true,
        });

        if (activeSuperAdmins <= 1) {
          return NextResponse.json(
            {
              success: false,
              message: "Cannot deactivate the sole active Super Administrator on this system.",
            },
            { status: 400 }
          );
        }
      }

      targetUser.isActive = isActive;
      changes.push(`status -> ${isActive ? "Active" : "Suspended"}`);
    }

    // 2. Designation update
    if (typeof designation === "string" && designation.trim()) {
      targetUser.designation = designation.trim();
      changes.push(`designation -> ${designation.trim()}`);
    }

    // 3. Phone update
    if (typeof phone === "string") {
      targetUser.phone = phone.trim();
      changes.push("phone updated");
    }

    // 4. Province reassignment (Super Admin only)
    if (assignedProvince && session.role === "SUPER_ADMIN") {
      targetUser.assignedProvince = String(assignedProvince).trim();
      changes.push(`assignedProvince -> ${targetUser.assignedProvince}`);
    }

    // 5. Password Reset (Super Admin or Provincial Director for their field staff)
    if (newPassword) {
      const cleanPass = String(newPassword);
      if (cleanPass.length < 10) {
        return NextResponse.json(
          { success: false, message: "Password must be at least 10 characters long." },
          { status: 400 }
        );
      }
      targetUser.passwordHash = await hashPassword(cleanPass);
      changes.push("password reset");
    }

    if (changes.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid update fields provided." },
        { status: 400 }
      );
    }

    await targetUser.save();

    // 6. Record tamper-evident audit trail
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    await recordActivityLog({
      action: "OFFICER_ACCOUNT_UPDATED",
      session,
      targetType: "User",
      targetId: targetUser._id.toString(),
      description: `Updated officer ${targetUser.email} (${changes.join(", ")})`,
      ipAddress: clientIp,
      province: session.assignedProvince,
      metadata: {
        targetEmail: targetUser.email,
        targetRole: targetUser.role,
        appliedChanges: changes,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Officer account updated successfully (${changes.join(", ")}).`,
      officer: {
        id: targetUser._id.toString(),
        email: targetUser.email,
        fullName: targetUser.fullName,
        designation: targetUser.designation,
        role: targetUser.role,
        assignedProvince: targetUser.assignedProvince,
        rdaStaffId: targetUser.rdaStaffId || "N/A",
        phone: targetUser.phone || "N/A",
        isActive: targetUser.isActive,
        updatedAt: targetUser.updatedAt?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update officer account.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
