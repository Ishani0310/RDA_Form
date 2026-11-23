/**
 * Road Development Authority (RDA) - Sri Lanka
 * Inclusive Connectivity and Development Project (ICDP)
 * Early Market Engagement Workshop Questionnaire Types
 * Authoritative source: Official RDA Google Form
 */

export type WorkshopAttendanceChoice = "Yes" | "No";

export type ParticipantCategory = "Contractor" | "Supplier" | "Government Officer";

export interface WorkshopParticipant {
  fullName: string;
  mobileNumber: string;
  email?: string;
  designation: string;
}

// -----------------------------------------------------------------------------
// SRI LANKA PROVINCES & DISTRICTS (Dependent Dropdown Data)
// -----------------------------------------------------------------------------
export const SRI_LANKA_PROVINCES = [
  "Western Province",
  "Central Province",
  "Southern Province",
  "Northern Province",
  "Eastern Province",
  "North Western Province",
  "North Central Province",
  "Uva Province",
  "Sabaragamuwa Province",
] as const;

export type SriLankaProvince = (typeof SRI_LANKA_PROVINCES)[number];

export const PROVINCE_DISTRICT_MAP: Record<SriLankaProvince, string[]> = {
  "Western Province": ["Colombo", "Gampaha", "Kalutara"],
  "Central Province": ["Kandy", "Matale", "Nuwara Eliya"],
  "Southern Province": ["Galle", "Matara", "Hambantota"],
  "Northern Province": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
  "Eastern Province": ["Trincomalee", "Batticaloa", "Ampara"],
  "North Western Province": ["Kurunegala", "Puttalam"],
  "North Central Province": ["Anuradhapura", "Polonnaruwa"],
  "Uva Province": ["Badulla", "Monaragala"],
  "Sabaragamuwa Province": ["Ratnapura", "Kegalle"],
};

// -----------------------------------------------------------------------------
// SUPPLIER TYPES
// -----------------------------------------------------------------------------
export const SUPPLIER_MATERIALS = [
  "Bitumen / Asphalt",
  "Sand",
  "Cement",
  "Aggregates",
  "Steel",
  "Other",
] as const;

export type SupplierMaterial = (typeof SUPPLIER_MATERIALS)[number];

export interface MaterialCapacityItem {
  quantity: string | number | null;
  unit: string;
}

export interface SupplierDetails {
  materialsSupplied: string[];
  materialsOther?: string;
  companyName: string;
  supplyCapacities: Record<string, MaterialCapacityItem>;
  locationAddress: string;
  province: string;
  district: string;
}

// -----------------------------------------------------------------------------
// CONTRACTOR TYPES
// -----------------------------------------------------------------------------
export type AreaOfSpecialty =
  | "Highway"
  | "Bridges"
  | "Soil Nailing & Stabilization"
  | "Geotechnical, Soil Nailing & Stabilization"
  | "Other";

export type CidaGradeOption =
  | "CS2"
  | "CS1"
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "C5"
  | "C6"
  | "C7"
  | "C8"
  | "C9"
  | "SP1"
  | "SP2"
  | "SP3"
  | "SP4"
  | "SP5"
  | "Not registered with CIDA"
  | "Other";

export type GeneralExperienceOption =
  | "Less than 5 years"
  | "5 to 10 years"
  | "More than 10 and up to 20 years"
  | "More than 20 and up to 30 years"
  | "More than 30 years";

export type OngoingContractsChoice = "Yes" | "No";

export interface OngoingWorkContract {
  contractIndex: number; // 1, 2, 3...
  contractName: string; // Name of contract
  contractNo?: string; // Contract No
  employerName?: string; // Employer's Name
  contractAmount: number | string | null; // Value of outstanding work (LKR) as at 1st December
  currency: string; // e.g. "LKR", "USD", etc.
  currencyOther?: string;
  completionDate: string | null; // Estimated completion date
}

export type SimilarWorkContractType =
  | "Highway"
  | "Bridges"
  | "Geotechnical, Soil Nailing & Stabilization"
  | "Other";

export type SimilarWorkCompletionStatus =
  | "Substantially completed"
  | "Fully completed (Performance Certificate issued)";

export interface SimilarWorkContract {
  contractIndex: number; // 1, 2, 3
  contractType: SimilarWorkContractType | "";
  contractTypeOther?: string;
  contractName: string; // or "N/A"
  contractAmount: number | null | string;
  startDate: string | null;
  completionDate: string | null;
  completionStatus: SimilarWorkCompletionStatus | "";
}

// -----------------------------------------------------------------------------
// FINANCIAL PERFORMANCE (40 Fields across 5 FYs)
// -----------------------------------------------------------------------------
export interface FinancialYearIndicators {
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  workingCapital: number | null;
  totalRevenue: number | null;
  profitBeforeTax: number | null; // Supports negative values
}

export const FINANCIAL_YEARS = [
  "2020/2021",
  "2021/2022",
  "2022/2023",
  "2023/2024",
  "2024/2025",
] as const;

export type FinancialYearKey = (typeof FINANCIAL_YEARS)[number];

export type FiveYearFinancialStatements = Record<FinancialYearKey, FinancialYearIndicators>;

export interface LoanCommitments {
  twoYearRepaymentsDue2026To2028: number | null;
}

// -----------------------------------------------------------------------------
// ROOT OFFICIAL QUESTIONNAIRE DATA CONTAINER
// -----------------------------------------------------------------------------
export interface OfficialQuestionnaireData {
  [key: string]: unknown;

  // SECTION 1: Basic Information
  organizationName: string;
  contactNumber: string;
  email: string;
  willParticipate: WorkshopAttendanceChoice | "";

  // SECTION 2: Participant Category (If willParticipate === "Yes")
  participantCategory?: ParticipantCategory | "";

  // SECTION 3: Participant Details (Category-specific)
  // For Contractor & Government Officer: Participant 1 (Required) & Participant 2 (Optional)
  // For Supplier: Participant 1 only (Required)
  participant1?: WorkshopParticipant;
  participant2?: WorkshopParticipant;

  // SECTION 4: Supplier Details (If participantCategory === "Supplier")
  supplierDetails?: SupplierDetails;

  // SECTION 4: Contractor Details (If participantCategory === "Contractor")
  ictadRegistrationNumber?: string;
  areasOfSpecialty?: AreaOfSpecialty[];
  specialtyOther?: string;
  specialtyGrades?: Record<string, string>; // CIDA grading per specialty area
  specialtyGradesOther?: Record<string, string>; // Custom CIDA grading when grade is 'Other'
  cidaGrade?: CidaGradeOption | string;
  cidaGradeOther?: string;

  // SECTION 5 & 6: Financial Capability & Loan Commitments (Contractors)
  financialStatements?: FiveYearFinancialStatements;
  loanCommitments?: LoanCommitments;

  // SECTION 7 & 8: Current Work Commitments & Ongoing Works (Contractors)
  hasOngoingContracts?: OngoingContractsChoice | "";
  totalOutstandingValueLkrMillion?: number | string | null;
  ongoingContracts?: OngoingWorkContract[];

  // SECTION 9: General Experience (Contractors)
  generalExperience?: GeneralExperienceOption | "";
  hasRdaOrIcdpExperience?: "Yes" | "No" | "";
  rdaIcdpExperienceType?: "RDA" | "ICDP" | "Both" | "None" | string;
  rdaIcdpProjectDetails?: string;

  // SECTION 10: Similar Work Experience (Contractors)
  similarWorks?: SimilarWorkContract[];
  historicalLitigationType?:
    | "None"
    | "Non performing contract"
    | "Pending litigation"
    | "Litigation history past"
    | "";
  historicalContractIdentification?: string;
  historicalEmployerName?: string;
  historicalReason?: string;
  historicalMatterDispute?: string;

  // SECTION 11: Matters for Discussion (All Attendees)
  mattersForDiscussion?: string;
  mattersForDiscussionList?: string[];
}

// -----------------------------------------------------------------------------
// HELPER FACTORIES
// -----------------------------------------------------------------------------
export function createEmptyFinancialIndicators(): FinancialYearIndicators {
  return {
    totalAssets: null,
    totalLiabilities: null,
    totalEquity: null,
    currentAssets: null,
    currentLiabilities: null,
    workingCapital: null,
    totalRevenue: null,
    profitBeforeTax: null,
  };
}

export function createEmptyFiveYearStatements(): FiveYearFinancialStatements {
  return {
    "2020/2021": createEmptyFinancialIndicators(),
    "2021/2022": createEmptyFinancialIndicators(),
    "2022/2023": createEmptyFinancialIndicators(),
    "2023/2024": createEmptyFinancialIndicators(),
    "2024/2025": createEmptyFinancialIndicators(),
  };
}

export function createEmptySimilarWorks(): SimilarWorkContract[] {
  return [
    {
      contractIndex: 1,
      contractType: "",
      contractName: "",
      contractAmount: null,
      startDate: null,
      completionDate: null,
      completionStatus: "",
    },
    {
      contractIndex: 2,
      contractType: "",
      contractName: "",
      contractAmount: null,
      startDate: null,
      completionDate: null,
      completionStatus: "",
    },
    {
      contractIndex: 3,
      contractType: "",
      contractName: "",
      contractAmount: null,
      startDate: null,
      completionDate: null,
      completionStatus: "",
    },
  ];
}

export function createEmptyOngoingWorks(): OngoingWorkContract[] {
  return [
    {
      contractIndex: 1,
      contractName: "",
      contractNo: "",
      employerName: "",
      contractAmount: null,
      currency: "LKR",
      completionDate: null,
    },
    {
      contractIndex: 2,
      contractName: "",
      contractNo: "",
      employerName: "",
      contractAmount: null,
      currency: "LKR",
      completionDate: null,
    },
    {
      contractIndex: 3,
      contractName: "",
      contractNo: "",
      employerName: "",
      contractAmount: null,
      currency: "LKR",
      completionDate: null,
    },
  ];
}

export function createEmptySupplierDetails(): SupplierDetails {
  return {
    materialsSupplied: [],
    materialsOther: "",
    companyName: "",
    supplyCapacities: {},
    locationAddress: "",
    province: "",
    district: "",
  };
}

/**
 * Calculates Total Equity = Total Assets - Total Liabilities.
 * Returns null if either value is null, undefined, or NaN.
 * Preserves exact numeric precision without floating point anomalies.
 */
export function calculateTotalEquity(
  totalAssets: number | null | undefined,
  totalLiabilities: number | null | undefined
): number | null {
  if (
    totalAssets === null ||
    totalAssets === undefined ||
    totalLiabilities === null ||
    totalLiabilities === undefined ||
    isNaN(Number(totalAssets)) ||
    isNaN(Number(totalLiabilities))
  ) {
    return null;
  }
  const diff = Number(totalAssets) - Number(totalLiabilities);
  return Number.isInteger(diff) ? diff : Math.round(diff * 1e6) / 1e6;
}

/**
 * Calculates Working Capital = Current Assets - Current Liabilities.
 * Returns null if either value is null, undefined, or NaN.
 * Preserves exact numeric precision without floating point anomalies.
 */
export function calculateWorkingCapital(
  currentAssets: number | null | undefined,
  currentLiabilities: number | null | undefined
): number | null {
  if (
    currentAssets === null ||
    currentAssets === undefined ||
    currentLiabilities === null ||
    currentLiabilities === undefined ||
    isNaN(Number(currentAssets)) ||
    isNaN(Number(currentLiabilities))
  ) {
    return null;
  }
  const diff = Number(currentAssets) - Number(currentLiabilities);
  return Number.isInteger(diff) ? diff : Math.round(diff * 1e6) / 1e6;
}

