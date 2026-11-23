import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/warmup
 * Lightweight background pre-warm probe to initialize the MongoDB Atlas
 * connection pool when the registration page mounts.
 */
export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ ok: true, timestamp: Date.now() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to pre-warm connection";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
