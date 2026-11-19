import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Contractor } from "@/models/Contractor";

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

    return NextResponse.json({
      success: true,
      contractor: {
        id: contractor._id.toString(),
        registrationNumber: contractor.registrationNumber,
        businessName: contractor.businessName,
        businessRegistrationNumber: contractor.businessRegistrationNumber || "N/A",
        cidaGrade: contractor.cidaGrade,
        primarySpeciality: contractor.primarySpeciality || "General Civil Engineering",
        province: contractor.province,
        district: contractor.district || "Unassigned",
        contactOfficer: {
          name: contractor.contactOfficer?.name || "Not Designated",
          designation: contractor.contactOfficer?.designation || "Authorized Representative",
          phone: contractor.contactOfficer?.phone || "N/A",
          email: contractor.contactOfficer?.email || "N/A",
        },
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
