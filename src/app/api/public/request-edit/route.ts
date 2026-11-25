import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import { requestEditPermission } from "@/lib/draft-service";

/**
 * POST /api/public/request-edit
 * Allows a contractor whose form was submitted to request edit permission from the RDA Administrator.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`request-edit-${clientIp}`, 30, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded. Please wait a moment before retrying." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reference = (body.reference || body.ref || body.token || "").trim();
    const reason = (body.reason || "").trim();

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Submission reference number or resume token is required." },
        { status: 400 }
      );
    }

    const result = await requestEditPermission(reference, reason);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process edit request.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
