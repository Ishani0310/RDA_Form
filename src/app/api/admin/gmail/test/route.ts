import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { sendRegistrationConfirmationEmail } from "@/lib/email-service";

/**
 * POST /api/admin/gmail/test
 * Sends a live verification test confirmation email to verify integration.
 * - Restricted to authenticated RDA Officers.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const recipient = (body.to || body.recipient || "").trim();

    if (!recipient || !recipient.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid recipient email address." },
        { status: 400 }
      );
    }

    const testRef = `RDA-TEST-${Date.now().toString().slice(-5)}`;
    const officerName = session.fullName || "Test Officer";

    const result = await sendRegistrationConfirmationEmail({
      to: recipient,
      reference: testRef,
      businessName: "RDA Test Participant Ltd",
      willParticipate: "Yes",
      participant1Name: officerName,
      participant1Designation: "Quality Assurance Engineer",
      workshopDate: "07 December 2026",
      workshopTime: "8:30 AM",
      submittedAt: new Date(),
      questionnaireData: {
        organizationName: "RDA Test Participant Ltd",
        contactNumber: "+94 11 286 5766",
        email: recipient,
        willParticipate: "Yes",
        participantCategory: "Contractor",
        participant1: {
          fullName: officerName,
          designation: "Quality Assurance Engineer",
          mobileNumber: "+94 77 123 4567",
          email: recipient,
        },
        ictadRegistrationNumber: "CIDA/RDA/TEST/2026",
        cidaGrade: "C1",
        areasOfSpecialty: ["Highway", "Bridges"],
        specialtyGrades: {
          Highway: "C1",
          Bridges: "C2",
        },
        generalExperience: "More than 10 and up to 20 years",
        hasRdaOrIcdpExperience: "Yes",
        rdaIcdpExperienceType: "Both",
        rdaIcdpProjectDetails: "Central Expressway & ICDP Rural Connectivity",
        mattersForDiscussion: "Test of Gmail API integration with RDA ICDP Registration Portal.",
      },
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Failed to send test email.",
          provider: result.provider,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email successfully dispatched to ${recipient}!`,
      provider: result.provider,
      messageId: result.messageId,
      sentTo: result.sentTo,
      reference: testRef,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Internal server error" }, { status: 500 });
  }
}
