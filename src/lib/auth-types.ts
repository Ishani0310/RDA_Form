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
    fullName: "Eng. K. Bandara",
    designation: "Chief Engineer (Planning & Procurement)",
    assignedProvince: "All Provinces (National HQ)",
    rdaStaffId: "RDA/HQ/DIR/014",
    passwordDescription: "RdaDemo@2026",
  },
  {
    email: "director.wp@rda.gov.lk",
    role: "PROVINCIAL_DIRECTOR",
    fullName: "Eng. M. Wickramaratne",
    designation: "Provincial Director (Western)",
    assignedProvince: "Western Province",
    rdaStaffId: "RDA/WP/DIR/003",
    passwordDescription: "RdaDemo@2026",
  },
  {
    email: "engineer.kandy@rda.gov.lk",
    role: "EXECUTIVE_ENGINEER",
    fullName: "Eng. S. Ekanayake",
    designation: "Executive Engineer (Highway Works)",
    assignedProvince: "Central Province",
    rdaStaffId: "RDA/CP/ENG/022",
    passwordDescription: "RdaDemo@2026",
  },
  {
    email: "inspector.galle@rda.gov.lk",
    role: "INSPECTION_OFFICER",
    fullName: "Mr. R. Mendis",
    designation: "Site Inspection & Quality Officer",
    assignedProvince: "Southern Province",
    rdaStaffId: "RDA/SP/INS/105",
    passwordDescription: "RdaDemo@2026",
  },
  {
    email: "auditor@rda.gov.lk",
    role: "AUDITOR",
    fullName: "Mrs. N. Gunasekara",
    designation: "Chief Internal Auditor",
    assignedProvince: "All Provinces (National HQ)",
    rdaStaffId: "RDA/HQ/AUD/008",
    passwordDescription: "RdaDemo@2026",
  },
];

export const DEMO_PASSWORD = "RdaDemo@2026";
