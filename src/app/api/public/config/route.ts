import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

/**
 * GET /api/public/config
 * Returns common RDA public portal configuration and the permanent one-common QR code.
 * 
 * Business Rule:
 * All contractors use ONE common QR code pointing to the permanent registration portal.
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 60, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const slug = (searchParams.get("slug") || searchParams.get("form") || "").trim();

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const permanentRegistrationUrl = slug ? `${baseUrl}/register/${slug}` : `${baseUrl}/register`;

    // Generate high-resolution official QR Code Data URL
    const qrDataUrl = await QRCode.toDataURL(permanentRegistrationUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400,
      color: {
        dark: "#0b1f3a", // RDA Navy
        light: "#ffffff",
      },
    });

    const qrSvg = await QRCode.toString(permanentRegistrationUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#0b1f3a",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      system: "RDA Contractor Data Collection System",
      organization: "Road Development Authority, Sri Lanka",
      registrationUrl: permanentRegistrationUrl,
      qrCodeDataUrl: qrDataUrl,
      qrCodeSvg: qrSvg,
      portal: {
        system: "RDA Contractor Data Collection System",
        organization: "Road Development Authority, Sri Lanka",
        ministry: "Ministry of Transport and Highways",
        permanentRegistrationUrl,
        commonQrCode: {
          dataUrl: qrDataUrl,
          svg: qrSvg,
          targetUrl: permanentRegistrationUrl,
          type: "PERMANENT_COMMON_INTAKE_QR",
          description: "Official common QR portal destination for all contractors nationwide",
        },
        questionnaireStatus: "AWAITING_MINISTERIAL_GAZETTE",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load public portal configuration.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
