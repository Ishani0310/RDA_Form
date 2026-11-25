import { NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { DEV_DEMO_OFFICERS } from "@/lib/auth-types";

export async function GET() {
  const session = await getCurrentOfficerSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, officer: null },
      { status: 200 }
    );
  }

  // Ensure latest updated officer profile name is reflected immediately
  const demoMatch = DEV_DEMO_OFFICERS.find(
    (d) => d.email.toLowerCase() === session.email.toLowerCase()
  );
  const effectiveName = demoMatch ? demoMatch.fullName : session.fullName;

  return NextResponse.json({
    authenticated: true,
    officer: {
      userId: session.userId,
      email: session.email,
      fullName: effectiveName,
      designation: session.designation,
      role: session.role,
      assignedProvince: session.assignedProvince,
      rdaStaffId: session.rdaStaffId,
      isDemoSession: session.isDemoSession,
    },
  });
}
