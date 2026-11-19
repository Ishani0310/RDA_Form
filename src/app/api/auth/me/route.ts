import { NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentOfficerSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, officer: null },
      { status: 200 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    officer: {
      userId: session.userId,
      email: session.email,
      fullName: session.fullName,
      designation: session.designation,
      role: session.role,
      assignedProvince: session.assignedProvince,
      rdaStaffId: session.rdaStaffId,
      isDemoSession: session.isDemoSession,
    },
  });
}
