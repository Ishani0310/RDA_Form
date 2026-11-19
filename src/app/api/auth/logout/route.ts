import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getCurrentOfficerSession } from "@/lib/auth";
import { recordActivityLog } from "@/lib/audit";

export async function POST() {
  const session = await getCurrentOfficerSession();

  if (session) {
    await recordActivityLog({
      action: "OFFICER_LOGOUT",
      session,
      targetType: "User",
      targetId: session.userId,
      description: `Official officer signed out: ${session.email} (${session.role})`,
      province: session.assignedProvince,
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Officer session terminated successfully.",
  });

  // Expire the session cookie immediately
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
