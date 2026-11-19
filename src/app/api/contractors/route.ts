import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Contractor, IContractor } from "@/models/Contractor";
import { Submission } from "@/models/Submission";
import { recordActivityLog } from "@/lib/audit";

// Whitelisted CIDA grades from gazetted standards
const VALID_CIDA_GRADES = [
  "CS1",
  "CS2",
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
  "Specialist",
  "Pending",
];

// 9 Administrative Provinces of Sri Lanka
const VALID_PROVINCES = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province",
];

// Valid contractor review statuses
const VALID_STATUSES = [
  "Draft",
  "Pending_Review",
  "Verified",
  "Action_Required",
  "Suspended",
];

/**
 * GET /api/contractors
 * Query the centralized contractor registry with search, multi-factor filtering, and pagination.
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

    // 1. Sanitize and validate pagination parameters
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
    const limit = Math.min(100, Math.max(1, isNaN(limitParam) ? 10 : limitParam));
    const skip = (page - 1) * limit;

    // 2. Sanitize and validate filter parameters
    const search = (searchParams.get("search") || "").trim();
    const province = searchParams.get("province") || "";
    const grade = searchParams.get("grade") || "";
    const status = searchParams.get("status") || "";

    // 3. Connect to Database
    await connectToDatabase();

    // 4. Build Filter Query with Strict Whitelist
    const query: Record<string, unknown> = {};

    if (province && VALID_PROVINCES.includes(province)) {
      query.province = province;
    }

    if (grade && VALID_CIDA_GRADES.includes(grade)) {
      query.cidaGrade = grade;
    }

    if (status && VALID_STATUSES.includes(status)) {
      query.status = status;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { businessName: { $regex: escapedSearch, $options: "i" } },
        { registrationNumber: { $regex: escapedSearch, $options: "i" } },
        { businessRegistrationNumber: { $regex: escapedSearch, $options: "i" } },
        { primarySpeciality: { $regex: escapedSearch, $options: "i" } },
        { district: { $regex: escapedSearch, $options: "i" } },
        { "contactOfficer.name": { $regex: escapedSearch, $options: "i" } },
        { "contactOfficer.email": { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // 5. Execute Count & Paginated Fetch
    const totalCount = await Contractor.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    const contractors = await Contractor.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const contractorIds = contractors.map((c) => c._id);
    const submissions = await Submission.find({ contractor: { $in: contractorIds } })
      .select("contractor questionnaireData")
      .lean();

    const subMap = new Map<string, any>();
    for (const s of submissions) {
      if (s.contractor) {
        subMap.set(s.contractor.toString(), s.questionnaireData || {});
      }
    }

    const formattedContractors = contractors.map((c) => {
      const q = subMap.get(c._id.toString()) || {};
      const willParticipateRaw =
        q.willParticipate ||
        ((c.metadata as any)?.willParticipate as string) ||
        (c.primarySpeciality === "Non-Attendee" ? "No" : "Yes");

      const participantCategory =
        q.participantCategory ||
        (willParticipateRaw === "No"
          ? "Non-Attendee"
          : c.primarySpeciality === "Non-Attendee"
          ? "Non-Attendee"
          : c.primarySpeciality === "Government Stakeholder"
          ? "Government Officer"
          : "");

      return {
        id: c._id.toString(),
        registrationNumber: q.ictadRegistrationNumber || c.registrationNumber,
        businessName: q.organizationName || c.businessName,
        businessRegistrationNumber:
          c.businessRegistrationNumber &&
          c.businessRegistrationNumber !== "PENDING-BR" &&
          c.businessRegistrationNumber !== "N/A"
            ? c.businessRegistrationNumber
            : "",
        cidaGrade: q.cidaGrade || c.cidaGrade || "",
        primarySpeciality: c.primarySpeciality || "",
        province:
          q.supplierDetails?.province ||
          (c.province && c.province !== "Western Province" ? c.province : ""),
        district:
          q.supplierDetails?.district ||
          (c.district && c.district !== "Unassigned" && c.district !== "Unassigned District"
            ? c.district
            : ""),
        contactOfficer: {
          name:
            q.participant1?.fullName ||
            (c.contactOfficer?.name &&
            c.contactOfficer.name !== "Authorized Representative" &&
            c.contactOfficer.name !== "Not Designated"
              ? c.contactOfficer.name
              : ""),
          designation:
            q.participant1?.designation ||
            (c.contactOfficer?.designation &&
            c.contactOfficer.designation !== "Authorized Officer" &&
            c.contactOfficer.designation !== "Authorized Representative"
              ? c.contactOfficer.designation
              : ""),
          phone:
            q.contactNumber ||
            q.participant1?.mobileNumber ||
            (c.contactOfficer?.phone &&
            c.contactOfficer.phone !== "+94 11 000 0000" &&
            c.contactOfficer.phone !== "N/A"
              ? c.contactOfficer.phone
              : ""),
          email:
            q.email ||
            q.participant1?.emailAddress ||
            (c.contactOfficer?.email &&
            c.contactOfficer.email !== "contact@contractor.lk" &&
            c.contactOfficer.email !== "contact@rda.gov.lk" &&
            c.contactOfficer.email !== "N/A"
              ? c.contactOfficer.email
              : ""),
        },
        willParticipate: willParticipateRaw === "No" ? "No" : "Yes",
        participantCategory,
        questionnaireData: q,
        status: c.status,
        isDemoRecord: c.isDemoRecord,
        createdAt: c.createdAt ? c.createdAt.toISOString() : null,
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedContractors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
      filtersApplied: {
        search: search || null,
        province: query.province || null,
        grade: query.cidaGrade || null,
        status: query.status || null,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to query contractor registry.";
    return NextResponse.json(
      { success: false, message: "Internal registry service error. Please try again later." },
      { status: 500 }
    );
  }
}
