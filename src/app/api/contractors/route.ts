import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Contractor, IContractor } from "@/models/Contractor";
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

    const formattedContractors = contractors.map((c) => ({
      id: c._id.toString(),
      registrationNumber: c.registrationNumber,
      businessName: c.businessName,
      businessRegistrationNumber: c.businessRegistrationNumber || "N/A",
      cidaGrade: c.cidaGrade,
      primarySpeciality: c.primarySpeciality || "General Civil Engineering",
      province: c.province,
      district: c.district || "Unassigned",
      contactOfficer: {
        name: c.contactOfficer?.name || "Not Designated",
        designation: c.contactOfficer?.designation || "Authorized Representative",
        phone: c.contactOfficer?.phone || "N/A",
        email: c.contactOfficer?.email || "N/A",
      },
      status: c.status,
      isDemoRecord: c.isDemoRecord,
      createdAt: c.createdAt ? c.createdAt.toISOString() : null,
      updatedAt: c.updatedAt ? c.updatedAt.toISOString() : null,
    }));

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
