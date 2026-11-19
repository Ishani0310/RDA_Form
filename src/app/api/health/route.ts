import { NextResponse } from "next/server";
import { getConnectionState } from "@/lib/mongodb";

export async function GET() {
  const { status, readyState } = getConnectionState();

  return NextResponse.json({
    status: "ok",
    system: "RDA Contractor Data Collection System",
    organization: "Road Development Authority, Sri Lanka",
    version: "0.1.0",
    database: {
      configured: Boolean(process.env.MONGODB_URI),
      status,
      readyState,
    },
    questionnaireStatus: "LOCKED_PENDING_RDA_COMMITTEE_RATIFICATION",
    timestamp: new Date().toISOString(),
  });
}
