import type { JWTPayload } from "jose";

export type OfficerRole =
  | "SUPER_ADMIN"
  | "PROVINCIAL_DIRECTOR"
  | "EXECUTIVE_ENGINEER"
  | "INSPECTION_OFFICER"
  | "AUDITOR";

export interface OfficerSessionPayload extends JWTPayload {
  userId: string;
  email: string;
  fullName: string;
  designation: string;
  role: OfficerRole;
  assignedProvince: string;
  rdaStaffId: string;
  isDemoSession: boolean;
}

export const SESSION_COOKIE_NAME = "rda_officer_session";

export interface DemoOfficerCredential {
  email: string;
  role: OfficerRole;
  fullName: string;
  designation: string;
  assignedProvince: string;
  rdaStaffId: string;
  passwordDescription: string;
}

export const DEV_DEMO_OFFICERS: DemoOfficerCredential[] = [
  {
    email: "superadmin@rda.gov.lk",
    role: "SUPER_ADMIN",
    fullName: "Engineer MR Indunil Madhusanka",
    designation: "Chief Engineer (Planning & Procurement)",
    assignedProvince: "All Provinces (National HQ)",
    rdaStaffId: "RDA/HQ/DIR/014",
    passwordDescription: "RdaDemo@2026",
  },
];

export const DEMO_PASSWORD = "RdaDemo@2026";
