import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Contractor } from "@/models/Contractor";
import { Submission } from "@/models/Submission";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/contractors/[id]
 * Retrieve comprehensive contractor profile, technical grading, and questionnaire readiness status.
 * 
 * RBAC: Accessible to any authenticated RDA Officer.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Official RDA officer authentication required." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate MongoDB ObjectId format
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid contractor record identifier format." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const contractor = await Contractor.findById(id).select("-__v").lean();

    if (!contractor) {
      return NextResponse.json(
        { success: false, message: "Contractor record not found in the national registry." },
        { status: 404 }
      );
    }

    const submission = await Submission.findOne({ contractor: contractor._id })
      .select("questionnaireData")
      .lean();

    const q = (submission?.questionnaireData as any) || {};
    const willParticipateRaw =
      q.willParticipate ||
      ((contractor.metadata as any)?.willParticipate as string) ||
      (contractor.primarySpeciality === "Non-Attendee" ? "No" : "Yes");

    const participantCategory =
      q.participantCategory ||
      (willParticipateRaw === "No"
        ? "Non-Attendee"
        : contractor.primarySpeciality === "Non-Attendee"
        ? "Non-Attendee"
        : contractor.primarySpeciality === "Government Stakeholder"
        ? "Government Officer"
        : "");

    return NextResponse.json({
      success: true,
      contractor: {
        id: contractor._id.toString(),
        registrationNumber: q.ictadRegistrationNumber || contractor.registrationNumber,
        businessName: q.organizationName || contractor.businessName,
        businessRegistrationNumber:
          contractor.businessRegistrationNumber &&
          contractor.businessRegistrationNumber !== "PENDING-BR" &&
          contractor.businessRegistrationNumber !== "N/A"
            ? contractor.businessRegistrationNumber
            : "",
        cidaGrade: q.cidaGrade || contractor.cidaGrade || "",
        primarySpeciality: contractor.primarySpeciality || "",
        province:
          q.supplierDetails?.province ||
          (contractor.province && contractor.province !== "Western Province" ? contractor.province : ""),
        district:
          q.supplierDetails?.district ||
          (contractor.district && contractor.district !== "Unassigned" && contractor.district !== "Unassigned District"
            ? contractor.district
            : ""),
        contactOfficer: {
          name:
            q.participant1?.fullName ||
            (contractor.contactOfficer?.name &&
            contractor.contactOfficer.name !== "Authorized Representative" &&
            contractor.contactOfficer.name !== "Not Designated"
              ? contractor.contactOfficer.name
              : ""),
          designation:
            q.participant1?.designation ||
            (contractor.contactOfficer?.designation &&
            contractor.contactOfficer.designation !== "Authorized Officer" &&
            contractor.contactOfficer.designation !== "Authorized Representative"
              ? contractor.contactOfficer.designation
              : ""),
          phone:
            q.contactNumber ||
            q.participant1?.mobileNumber ||
            (contractor.contactOfficer?.phone &&
            contractor.contactOfficer.phone !== "+94 11 000 0000" &&
            contractor.contactOfficer.phone !== "N/A"
              ? contractor.contactOfficer.phone
              : ""),
          email:
            q.email ||
            q.participant1?.emailAddress ||
            (contractor.contactOfficer?.email &&
            contractor.contactOfficer.email !== "contact@contractor.lk" &&
            contractor.contactOfficer.email !== "contact@rda.gov.lk" &&
            contractor.contactOfficer.email !== "N/A"
              ? contractor.contactOfficer.email
              : ""),
        },
        willParticipate: willParticipateRaw === "No" ? "No" : "Yes",
        participantCategory,
        questionnaireData: q,
        status: contractor.status,
        metadata: contractor.metadata || {},
        isDemoRecord: contractor.isDemoRecord,
        createdAt: contractor.createdAt ? contractor.createdAt.toISOString() : null,
        updatedAt: contractor.updatedAt ? contractor.updatedAt.toISOString() : null,
        // Questionnaire framework readiness container (waiting for official ministerial gazette)
        questionnaireArchitecture: {
          status: "AWAITING_RDA_COMMITTEE_RATIFICATION",
          version: "1.0.0-pending-gazette",
          isLocked: true,
          notice: "Contractor questionnaire parameters are under active review by the RDA Planning Directorate.",
        },
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: "Internal server error while retrieving contractor profile." },
      { status: 500 }
    );
  }
}
