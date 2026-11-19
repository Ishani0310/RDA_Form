import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { User, IUser } from "@/models/User";
import { recordActivityLog } from "@/lib/audit";
import { OfficerRole, DEV_DEMO_OFFICERS } from "@/lib/auth-types";

// Valid officer roles in Road Development Authority
const VALID_ROLES: OfficerRole[] = [
  "SUPER_ADMIN",
  "PROVINCIAL_DIRECTOR",
  "EXECUTIVE_ENGINEER",
  "INSPECTION_OFFICER",
  "AUDITOR",
];

const VALID_PROVINCES = [
  "All Provinces (National HQ)",
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

/**
 * GET /api/officers
 * List administrative officers with search, role, and province filtering.
 * RBAC: Restricted to SUPER_ADMIN and PROVINCIAL_DIRECTOR.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Active officer session required." },
        { status: 401 }
      );
    }

    // RBAC: Only Super Administrators and Provincial Directors can view officer records
    if (session.role !== "SUPER_ADMIN" && session.role !== "PROVINCIAL_DIRECTOR") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Insufficient administrative privileges." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const roleFilter = searchParams.get("role") || "";
    const provinceFilter = searchParams.get("province") || "";

    // Live Database Flow
    if (process.env.MONGODB_URI) {
      await connectToDatabase();

      // Query Builder
      const query: Record<string, unknown> = {};

      // Provincial Director scoping: Restricted to their assigned province
      if (session.role === "PROVINCIAL_DIRECTOR") {
        query.assignedProvince = session.assignedProvince;
      } else if (provinceFilter && provinceFilter !== "All Provinces") {
        query.assignedProvince = provinceFilter;
      }

      if (roleFilter && VALID_ROLES.includes(roleFilter as OfficerRole)) {
        query.role = roleFilter;
      }

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { rdaStaffId: { $regex: search, $options: "i" } },
          { designation: { $regex: search, $options: "i" } },
        ];
      }

      const officers = await User.find(query)
        .select("-passwordHash")
        .sort({ createdAt: -1 })
        .lean();

      // If database has records, return live database results
      if (officers.length > 0 || !session.isDemoSession) {
        return NextResponse.json({
          success: true,
          count: officers.length,
          officers: officers.map((u) => ({
            id: u._id.toString(),
            email: u.email,
            fullName: u.fullName,
            designation: u.designation || "RDA Officer",
            role: u.role,
            assignedProvince: u.assignedProvince,
            rdaStaffId: u.rdaStaffId || "N/A",
            phone: u.phone || "N/A",
            isActive: u.isActive,
            lastLogin: u.lastLogin ? u.lastLogin.toISOString() : null,
            createdAt: u.createdAt ? u.createdAt.toISOString() : null,
          })),
        });
      }
    }

    // Development fallback if in demo session and database empty
    const filteredDemo = DEV_DEMO_OFFICERS.filter((o) => {
      if (session.role === "PROVINCIAL_DIRECTOR" && o.assignedProvince !== session.assignedProvince) {
        return false;
      }
      if (roleFilter && o.role !== roleFilter) return false;
      if (provinceFilter && provinceFilter !== "All Provinces" && o.assignedProvince !== provinceFilter) {
        return false;
      }
      if (search) {
        const term = search.toLowerCase();
        return (
          o.fullName.toLowerCase().includes(term) ||
          o.email.toLowerCase().includes(term) ||
          o.rdaStaffId.toLowerCase().includes(term)
        );
      }
      return true;
    }).map((o) => ({
      id: `DEMO-USR-${o.role.toLowerCase()}`,
      email: o.email,
      fullName: o.fullName,
      designation: o.designation,
      role: o.role,
      assignedProvince: o.assignedProvince,
      rdaStaffId: o.rdaStaffId,
      phone: "+94 11 2862799",
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: filteredDemo.length,
      officers: filteredDemo,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve officer directory.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * POST /api/officers
 * Provision a new official officer account.
 * RBAC: Restricted to SUPER_ADMIN and PROVINCIAL_DIRECTOR (scoped).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Active officer session required." },
        { status: 401 }
      );
    }

    if (session.role !== "SUPER_ADMIN" && session.role !== "PROVINCIAL_DIRECTOR") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Insufficient administrative privileges." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password, fullName, designation, role, assignedProvince, rdaStaffId, phone } = body;

    // 1. Mandatory input validation
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, message: "Full Name, Official Email, Password, and Role are mandatory." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid official email address format." },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role as OfficerRole)) {
      return NextResponse.json(
        { success: false, message: `Invalid officer role. Permitted: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Password complexity check (minimum 10 chars, uppercase, lowercase, number, symbol)
    const cleanPassword = String(password);
    if (cleanPassword.length < 10) {
      return NextResponse.json(
        { success: false, message: "Officer password must be at least 10 characters long." },
        { status: 400 }
      );
    }

    const hasUpper = /[A-Z]/.test(cleanPassword);
    const hasLower = /[a-z]/.test(cleanPassword);
    const hasDigit = /[0-9]/.test(cleanPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(cleanPassword);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain uppercase letters, lowercase letters, numbers, and symbols.",
        },
        { status: 400 }
      );
    }

    // 2. Granular RBAC Permissions Check
    let targetProvince = String(assignedProvince || "").trim();

    if (session.role === "PROVINCIAL_DIRECTOR") {
      // Provincial Directors can only create field officers within their assigned province
      if (role === "SUPER_ADMIN" || role === "PROVINCIAL_DIRECTOR") {
        return NextResponse.json(
          {
            success: false,
            message: "Provincial Directors can only provision Executive Engineers or Site Inspection Officers.",
          },
          { status: 403 }
        );
      }
      // Force province to match Provincial Director's province
      targetProvince = session.assignedProvince;
    } else {
      // Super Admin: Validate province
      if (!targetProvince) {
        targetProvince = "All Provinces (National HQ)";
      }
    }

    // 3. Connect to Database & Check Uniqueness
    await connectToDatabase();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An officer account with this email address already exists." },
        { status: 409 }
      );
    }

    // 4. Hash password with bcrypt
    const passwordHash = await hashPassword(cleanPassword);

    // 5. Create user record
    const newOfficer = await User.create({
      email: cleanEmail,
      passwordHash,
      fullName: String(fullName).trim(),
      designation: designation ? String(designation).trim() : "RDA Officer",
      role,
      assignedProvince: targetProvince,
      rdaStaffId: rdaStaffId ? String(rdaStaffId).trim() : `RDA/OFF/${Date.now().toString().slice(-4)}`,
      phone: phone ? String(phone).trim() : undefined,
      isActive: true,
      isDemoRecord: false,
    });

    // 6. Record tamper-evident audit log
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    await recordActivityLog({
      action: "OFFICER_ACCOUNT_PROVISIONED",
      session,
      targetType: "User",
      targetId: newOfficer._id.toString(),
      description: `Provisioned officer account ${newOfficer.email} (${newOfficer.role}) in ${newOfficer.assignedProvince}`,
      ipAddress: clientIp,
      province: session.assignedProvince,
      metadata: {
        provisionedByStaffId: session.rdaStaffId,
        newOfficerStaffId: newOfficer.rdaStaffId,
        role: newOfficer.role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Officer account provisioned successfully.",
        officer: {
          id: newOfficer._id.toString(),
          email: newOfficer.email,
          fullName: newOfficer.fullName,
          designation: newOfficer.designation,
          role: newOfficer.role,
          assignedProvince: newOfficer.assignedProvince,
          rdaStaffId: newOfficer.rdaStaffId,
          phone: newOfficer.phone || "N/A",
          isActive: newOfficer.isActive,
          createdAt: newOfficer.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to provision officer account.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
