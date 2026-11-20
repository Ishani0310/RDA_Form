import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import {
  saveOrUpdateDraft,
  getDraftByToken,
  isValidTokenFormat,
} from "@/lib/draft-service";

/**
 * GET /api/public/draft
 * Retrieve an existing draft session securely using the high-entropy resume token.
 * 
 * Token delivery options:
 * - Header: X-Resume-Token: <token>
 * - Query parameter: ?token=<token>
 */
export async function GET(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`draft-get-${clientIp}`, 100, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded. Please wait a few seconds before retrying." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tokenFromHeader = request.headers.get("x-resume-token") || "";
    const tokenFromQuery = searchParams.get("token") || "";
    const token = (tokenFromHeader || tokenFromQuery).trim();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Resume token is required to load a saved registration draft." },
        { status: 400 }
      );
    }

    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { success: false, message: "Malformed resume token format. Must be a 64-character hexadecimal key." },
        { status: 400 }
      );
    }

    const draft = await getDraftByToken(token);

    return NextResponse.json({
      success: true,
      draft,
      data: draft,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve draft session.";
    return NextResponse.json({ success: false, message }, { status: 404 });
  }
}

/**
 * POST /api/public/draft
 * Save progress or initialize a new draft session.
 * Returns a high-entropy plain-text resume token (never stored in plain-text on the server).
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`draft-post-${clientIp}`, 120, 60000);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Rate limit exceeded. Please wait a minute before making further updates." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const tokenFromHeader = request.headers.get("x-resume-token") || "";
    const activeToken = (body.resumeToken || body.token || tokenFromHeader || "").trim();

    const questionnaireData = body.questionnaireData || body.data;
    const businessName = body.businessName || body.organizationName;

    const {
      registrationNumber,
      businessRegistrationNumber,
      cidaGrade,
      primarySpeciality,
      province,
      district,
    } = body;

    // Contact officer normalization (handles nested object or flat fields)
    let contactOfficer = body.contactOfficer || body.primaryContact;
    if (!contactOfficer) {
      const email = body.contactEmail || body.email;
      const phone = body.contactPhone || body.phone;
      const name = body.contactName || body.representativeName || "Authorized Representative";
      if (email || phone) {
        contactOfficer = { name, email, phone };
      }
    }

    // If new draft (no token), validate mandatory initial fields
    const effectiveBusinessName = (businessName || questionnaireData?.organizationName || "").trim();
    const effectiveRegNo = (registrationNumber || questionnaireData?.ictadRegistrationNumber || (effectiveBusinessName ? `DFT-${Date.now().toString().slice(-6)}` : "")).trim();
    const effectiveProvince = (province || "Western Province").trim();

    if (!activeToken) {
      if (!effectiveBusinessName) {
        return NextResponse.json(
          {
            success: false,
            message: "Organization / Company name is required to save draft progress.",
          },
          { status: 400 }
        );
      }
    }

    const result = await saveOrUpdateDraft(
      {
        registrationNumber: effectiveRegNo ? String(effectiveRegNo).trim() : undefined,
        businessName: effectiveBusinessName ? String(effectiveBusinessName).trim() : undefined,
        businessRegistrationNumber: businessRegistrationNumber ? String(businessRegistrationNumber).trim() : undefined,
        cidaGrade: cidaGrade || questionnaireData?.cidaGrade ? String(cidaGrade || questionnaireData?.cidaGrade).trim() : undefined,
        primarySpeciality: primarySpeciality ? String(primarySpeciality).trim() : undefined,
        province: effectiveProvince,
        district: district ? String(district).trim() : undefined,
        formId: body.formId || questionnaireData?.formId || undefined,
        formSlug: body.formSlug || questionnaireData?.formSlug || undefined,
        contactOfficer: contactOfficer
          ? {
              name: String(contactOfficer.name || "Authorized Representative").trim(),
              designation: contactOfficer.designation ? String(contactOfficer.designation).trim() : undefined,
              phone: String(contactOfficer.phone || "+94 11 000 0000").trim(),
              email: String(contactOfficer.email || "contact@contractor.lk").trim().toLowerCase(),
            }
          : undefined,
        questionnaireData: typeof questionnaireData === "object" && questionnaireData !== null ? questionnaireData : undefined,
      },
      activeToken || undefined,
      clientIp
    );

    return NextResponse.json({
      success: true,
      message: result.isNew
        ? "Draft initialized successfully. Please store your secure resume token to continue anytime."
        : "Draft progress updated successfully.",
      token: result.token,
      submissionReference: result.submissionReference,
      expiresAt: result.expiresAt,
      isNew: result.isNew,
      data: {
        contractor: result.contractor,
        submission: result.submission,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save draft progress.";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
