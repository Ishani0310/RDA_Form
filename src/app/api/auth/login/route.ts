import { NextRequest, NextResponse } from "next/server";
import { authenticateOfficer } from "@/lib/auth-service";
import { signSessionToken, getSessionCookieOptions } from "@/lib/auth";
import { recordActivityLog } from "@/lib/audit";
import { createNotification } from "@/lib/notification-service";

export async function POST(request: NextRequest) {
  let attemptedEmail = "";
  try {
    const body = await request.json();
    const { email, password } = body;
    attemptedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid official email address." },
        { status: 400 }
      );
    }

    // Authenticate officer via service
    const officer = await authenticateOfficer(email, password);

    // Sign stateless JWT session token
    const token = await signSessionToken({
      userId: officer.userId,
      email: officer.email,
      fullName: officer.fullName,
      designation: officer.designation,
      role: officer.role,
      assignedProvince: officer.assignedProvince,
      rdaStaffId: officer.rdaStaffId,
      isDemoSession: officer.isDemoSession,
    });

    const cookieOptions = getSessionCookieOptions();

    // Record audit event
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    await recordActivityLog({
      action: "OFFICER_LOGIN_SUCCESS",
      session: {
        userId: officer.userId,
        email: officer.email,
        fullName: officer.fullName,
        designation: officer.designation,
        role: officer.role,
        assignedProvince: officer.assignedProvince,
        rdaStaffId: officer.rdaStaffId,
        isDemoSession: officer.isDemoSession,
      },
      targetType: "User",
      targetId: officer.userId,
      description: `Official officer signed in: ${officer.email} (${officer.role})`,
      ipAddress: clientIp,
      province: officer.assignedProvince,
    });

    // Real-time system alert for admin login
    createNotification({
      type: "LOGIN",
      title: "Officer Logged In",
      message: `${officer.fullName} (${officer.role.replace("_", " ")}) authenticated successfully`,
      metadata: {
        userId: officer.userId,
        email: officer.email,
        fullName: officer.fullName,
        role: officer.role,
        ipAddress: clientIp,
      },
    }).catch(() => {});

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      officer,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: cookieOptions.name,
      value: token,
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error: unknown) {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    if (attemptedEmail) {
      await recordActivityLog({
        action: "OFFICER_LOGIN_FAILED",
        performerName: attemptedEmail,
        performerRole: "UNKNOWN",
        targetType: "User",
        targetId: attemptedEmail,
        description: `Failed login attempt for officer identifier: ${attemptedEmail}`,
        ipAddress: clientIp,
      });
    }

    const message =
      error instanceof Error ? error.message : "An unexpected authentication error occurred.";
    return NextResponse.json(
      { success: false, message },
      { status: 401 }
    );
  }
}
