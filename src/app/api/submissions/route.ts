import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Submission } from "@/models/Submission";
import { Contractor } from "@/models/Contractor";
import "@/models/User";

/**
 * GET /api/submissions
 * Review console for incoming contractor questionnaire submissions and filings.
 * Supports filtering by Category, Workshop Attendance, Status, Province, and Global Search.
 * 
 * RBAC: Accessible to any authenticated RDA Officer.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Official RDA officer authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const province = (searchParams.get("province") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const attendance = (searchParams.get("attendance") || "").trim();
    const ref = (searchParams.get("ref") || "").trim();
    const formFilter = (searchParams.get("formId") || searchParams.get("form") || "").trim();

    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
    const limit = Math.min(100, Math.max(1, isNaN(limitParam) ? 10 : limitParam));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query: Record<string, unknown> = {};

    // Specific Form Filter
    if (formFilter && formFilter !== "ALL") {
      query.$or = [{ formId: formFilter }, { formSlug: formFilter }];
    }

    // Provincial Director / Engineer scoping
    if (session.role === "PROVINCIAL_DIRECTOR") {
      query.provincialOffice = session.assignedProvince;
    } else if (province && province !== "All Provincial Offices") {
      query.provincialOffice = province;
    }

    // Direct reference match
    if (ref) {
      query.submissionReference = ref;
    }

    // Category filter (Contractor, Supplier, Government Officer)
    if (category && category !== "All Categories") {
      query["questionnaireData.participantCategory"] = category;
    }

    // Workshop Attendance filter (Yes, No)
    if (attendance && attendance !== "All Attendance") {
      query["questionnaireData.willParticipate"] = attendance;
    }

    // Status filter
    if (status && status !== "All Statuses") {
      const lower = status.toLowerCase();
      if (lower === "submitted") {
        query.status = { $in: ["Submitted", "Under_Review", "Verified", "Action_Required", "Rejected"] };
      } else if (lower === "draft") {
        query.status = "Draft";
      } else if (lower === "under_review") {
        query.status = "Under_Review";
      } else if (lower === "approved" || lower === "verified") {
        query.status = "Verified";
      } else if (lower === "rejected" || lower === "action_required") {
        query.status = { $in: ["Rejected", "Action_Required"] };
      } else {
        query.status = status;
      }
    }

    // Global Search: Organization Name, ICTAD Reg No, Contact Number, Email
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingContractors = await Contractor.find({
        $or: [
          { businessName: { $regex: escaped, $options: "i" } },
          { registrationNumber: { $regex: escaped, $options: "i" } },
          { "contactOfficer.phone": { $regex: escaped, $options: "i" } },
          { "contactOfficer.email": { $regex: escaped, $options: "i" } },
          { "contactOfficer.name": { $regex: escaped, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const matchingContractorIds = matchingContractors.map((c) => c._id);

      query.$or = [
        { submissionReference: { $regex: escaped, $options: "i" } },
        { provincialOffice: { $regex: escaped, $options: "i" } },
        { "questionnaireData.organizationName": { $regex: escaped, $options: "i" } },
        { "questionnaireData.supplierDetails.companyName": { $regex: escaped, $options: "i" } },
        { "questionnaireData.ictadRegistrationNumber": { $regex: escaped, $options: "i" } },
        { "questionnaireData.contactNumber": { $regex: escaped, $options: "i" } },
        { "questionnaireData.email": { $regex: escaped, $options: "i" } },
        { "questionnaireData.participant1.fullName": { $regex: escaped, $options: "i" } },
        { "questionnaireData.participant1.mobileNumber": { $regex: escaped, $options: "i" } },
        ...(matchingContractorIds.length > 0 ? [{ contractor: { $in: matchingContractorIds } }] : []),
      ];
    }

    const totalCount = await Submission.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const submissions = await Submission.find(query)
      .populate("contractor", "businessName registrationNumber cidaGrade province")
      .populate("reviewedBy", "fullName designation")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = submissions.map((s: any) => ({
      id: s._id.toString(),
      ref: s.submissionReference,
      contractor: s.contractor?.businessName || s.questionnaireData?.organizationName || "Unknown Entity",
      regNo: s.contractor?.registrationNumber || "N/A",
      grade: s.contractor?.cidaGrade || "Pending",
      submissionType: s.submissionType || "Annual_Capacity_Declaration",
      provincialOffice: s.provincialOffice,
      status: s.status,
      schemaVersion: s.schemaVersion,
      formId: s.formId || "RDA-ICDP-CONTRACTOR-Q",
      formSlug: s.formSlug || "contractor",
      questionnaireId: s.questionnaireId?.toString(),
      questionnaireVersion: s.questionnaireVersion || s.schemaVersion,
      questionnaireData: s.questionnaireData || null,
      submittedAt: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "Pending",
      reviewedBy: s.reviewedBy?.fullName || "Awaiting Review",
      reviewNotes: s.reviewNotes || null,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to query contractor submissions.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
