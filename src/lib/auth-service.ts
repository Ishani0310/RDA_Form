import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/auth";
import {
  OfficerRole,
  DEV_DEMO_OFFICERS,
  DEMO_PASSWORD,
} from "./auth-types";

export { DEV_DEMO_OFFICERS, DEMO_PASSWORD };

/**
 * Authentication Service for RDA Officers
 * 
 * Database Readiness & Security:
 * - Automatically utilizes the existing Mongoose User model when MONGODB_URI is available
 * - Provides development-only mock credentials for the 5 officer roles while MongoDB Atlas is unconnected
 * - Clearly flags any mock authentication with isDemoSession: true
 * - Strictly disables mock authentication if ALLOW_DEMO_AUTH is explicitly set to 'false'
 */

export interface AuthenticatedOfficer {
  userId: string;
  email: string;
  fullName: string;
  designation: string;
  role: OfficerRole;
  assignedProvince: string;
  rdaStaffId: string;
  isDemoSession: boolean;
}

export async function authenticateOfficer(
  emailInput: string,
  passwordInput: string
): Promise<AuthenticatedOfficer> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  // 1. Live Database Authentication Flow (when MongoDB Atlas is provisioned)
  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const user = await User.findOne({ email });

      if (user && user.isActive) {
        const isMatch = await verifyPassword(password, user.passwordHash);
        if (isMatch) {
          // Update last login timestamp safely
          user.lastLogin = new Date();
          await user.save().catch(() => {});

          return {
            userId: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            designation: user.designation || "RDA Officer",
            role: user.role as OfficerRole,
            assignedProvince: user.assignedProvince,
            rdaStaffId: user.rdaStaffId || "RDA/OFFICER",
            isDemoSession: Boolean(user.isDemoRecord),
          };
        }
      }
      throw new Error("Invalid official credentials. Please verify your email and password.");
    } catch (err: unknown) {
      // In live production with database, do not fallback to mock credentials
      if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_AUTH !== "true") {
        throw new Error(
          err instanceof Error ? err.message : "Authentication service temporarily unavailable."
        );
      }
    }
  }

  // 2. Development Mock Authentication Flow (Prototype testing while Atlas is unconnected)
  if (process.env.ALLOW_DEMO_AUTH === "false") {
    throw new Error(
      "Production authentication requires an active MongoDB database connection. Mock credentials are disabled."
    );
  }

  const demoMatch = DEV_DEMO_OFFICERS.find(
    (off) => off.email.toLowerCase() === email
  );

  if (demoMatch && password === DEMO_PASSWORD) {
    return {
      userId: `DEMO-USR-${demoMatch.role.toLowerCase()}`,
      email: demoMatch.email,
      fullName: demoMatch.fullName,
      designation: demoMatch.designation,
      role: demoMatch.role,
      assignedProvince: demoMatch.assignedProvince,
      rdaStaffId: demoMatch.rdaStaffId,
      isDemoSession: true,
    };
  }

  throw new Error(
    "Invalid official credentials. In Development Demo Mode, use one of the listed RDA officer demo accounts with password 'RdaDemo@2026'."
  );
}
