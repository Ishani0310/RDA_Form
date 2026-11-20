/**
 * Road Development Authority (RDA) - Sri Lanka
 * Inclusive Connectivity and Development Project (ICDP)
 * Official Questionnaire Validator & Normalizer
 * Authoritative source: Official RDA Google Form
 */

import {
  OfficialQuestionnaireData,
  FINANCIAL_YEARS,
  FinancialYearKey,
  FiveYearFinancialStatements,
  SimilarWorkContract,
  OngoingWorkContract,
  SupplierDetails,
  createEmptySupplierDetails,
  calculateTotalEquity,
  calculateWorkingCapital,
} from "./questionnaire-types";

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateQuestionnaireSubmission(
  data: Partial<OfficialQuestionnaireData>
): ValidationResult {
  const errors: Record<string, string> = {};

  // =========================================================================
  // SECTION 1: BASIC INFORMATION
  // =========================================================================
  if (!data.organizationName || !data.organizationName.trim()) {
    errors.organizationName = "Name of your Organization / Company / Institution is required.";
  }

  if (!data.contactNumber || !data.contactNumber.trim()) {
    errors.contactNumber = "Contact number is required.";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Email address is required.";
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.email = "Please provide a valid email address.";
    }
  }

  if (!data.willParticipate || (data.willParticipate !== "Yes" && data.willParticipate !== "No")) {
    errors.willParticipate =
      "Please indicate whether you will be participating in the workshop on 07 December 2026.";
  }

  // If NOT participating in the workshop, immediate submission is valid
  if (data.willParticipate === "No") {
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // =========================================================================
  // SECTION 2: PARTICIPANT CATEGORY
  // =========================================================================
  if (
    !data.participantCategory ||
    !["Contractor", "Supplier", "Government Officer"].includes(data.participantCategory)
  ) {
    errors.participantCategory = "Please select the participant category you represent.";
    return {
      isValid: false,
      errors,
    };
  }

  // =========================================================================
  // SECTION 3: PARTICIPANT DETAILS
  // =========================================================================
  if (!data.participant1?.fullName?.trim()) {
    errors["participant1.fullName"] = "Participant Full Name is required.";
  }
  if (!data.participant1?.mobileNumber?.trim()) {
    errors["participant1.mobileNumber"] = "Participant Mobile Number is required.";
  }
  if (!data.participant1?.designation?.trim()) {
    errors["participant1.designation"] = "Participant Designation is required.";
  }

  // -------------------------------------------------------------------------
  // CATEGORY: GOVERNMENT OFFICER
  // -------------------------------------------------------------------------
  if (data.participantCategory === "Government Officer") {
    // Government officers only provide participant details and optional matters for discussion
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // -------------------------------------------------------------------------
  // CATEGORY: SUPPLIER (SECTION 4: SUPPLIER DETAILS)
  // -------------------------------------------------------------------------
  if (data.participantCategory === "Supplier") {
    const sup = data.supplierDetails || createEmptySupplierDetails();

    if (!sup.companyName || !sup.companyName.trim()) {
      errors["supplierDetails.companyName"] = "Company Name is required for suppliers.";
    }

    if (!sup.materialsSupplied || sup.materialsSupplied.length === 0) {
      errors["supplierDetails.materialsSupplied"] = "Please select at least one material you supply.";
    } else if (sup.materialsSupplied.includes("Other") && !sup.materialsOther?.trim()) {
      errors["supplierDetails.materialsOther"] = "Please specify the other material you supply.";
    }

    if (!sup.locationAddress || !sup.locationAddress.trim()) {
      errors["supplierDetails.locationAddress"] = "Location Address is required.";
    }

    if (!sup.province || !sup.province.trim()) {
      errors["supplierDetails.province"] = "Please select your Province.";
    }

    if (!sup.district || !sup.district.trim()) {
      errors["supplierDetails.district"] = "Please select your District.";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // =========================================================================
  // CATEGORY: CONTRACTOR (SECTIONS 4 - 10)
  // =========================================================================

  // Section 4: Contractor Details
  if (!data.ictadRegistrationNumber || !data.ictadRegistrationNumber.trim()) {
    errors.ictadRegistrationNumber = "ICTAD registration number is required for contractors.";
  }

  if (!data.areasOfSpecialty || data.areasOfSpecialty.length === 0) {
    errors.areasOfSpecialty = "Please select at least one area of specialty.";
  } else if (data.areasOfSpecialty.includes("Other") && !data.specialtyOther?.trim()) {
    errors.specialtyOther = "Please specify your other area of specialty.";
  }

  // Validate CIDA grading for each selected specialty area
  const specs = data.areasOfSpecialty || [];
  const specialtyGrades = data.specialtyGrades || {};
  for (const s of specs) {
    if (!specialtyGrades[s] || !specialtyGrades[s].trim()) {
      errors[`specialtyGrades.${s}`] = `Please select CIDA grading for ${s}.`;
    }
  }

  // Ensure cidaGrade is populated for backward compatibility with existing admin views
  if (!data.cidaGrade || !data.cidaGrade.trim()) {
    const gradeSummary = Object.entries(specialtyGrades)
      .filter(([_, g]) => Boolean(g))
      .map(([s, g]) => `${s}: ${g}`)
      .join(", ");
    if (gradeSummary) {
      data.cidaGrade = gradeSummary;
    } else if (specs.length > 0) {
      errors.cidaGrade = "Please select CIDA grading under each selected specialty area.";
    }
  }

  // Section 5 & 6: Financial Statements (40 Fields) & Loan Commitments
  // In accordance with official instructions, blank/0 is permitted if unavailable.
  // We strictly validate non-NaN numeric validity when entered.
  if (data.financialStatements) {
    for (const year of FINANCIAL_YEARS) {
      const yrData = data.financialStatements[year];
      if (yrData) {
        const keys = [
          "totalAssets",
          "totalLiabilities",
          "totalEquity",
          "currentAssets",
          "currentLiabilities",
          "workingCapital",
          "totalRevenue",
          "profitBeforeTax",
        ] as const;

        for (const k of keys) {
          const val = yrData[k] as unknown;
          if (val !== null && val !== undefined && val !== "") {
            const num = Number(val);
            if (isNaN(num)) {
              errors[`financialStatements.${year}.${k}`] = `Invalid numeric value for ${k} in FY ${year}.`;
            }
          }
        }
      }
    }
  }

  if (data.loanCommitments?.twoYearRepaymentsDue2026To2028 !== null &&
      data.loanCommitments?.twoYearRepaymentsDue2026To2028 !== undefined) {
    const loanVal = data.loanCommitments.twoYearRepaymentsDue2026To2028 as unknown;
    if (loanVal !== "" && isNaN(Number(loanVal))) {
      errors["loanCommitments.twoYearRepaymentsDue2026To2028"] = "Loan repayments must be a valid number.";
    }
  }

  // Section 7: Evaluation Criteria - Current Work Commitments
  if (
    !data.hasOngoingContracts ||
    (data.hasOngoingContracts !== "Yes" && data.hasOngoingContracts !== "No")
  ) {
    errors.hasOngoingContracts =
      "Please indicate whether your company currently has ongoing contracts.";
  }

  // Section 8: Ongoing Works (Required if hasOngoingContracts === "Yes")
  if (data.hasOngoingContracts === "Yes") {
    if (
      data.totalOutstandingValueLkrMillion === null ||
      data.totalOutstandingValueLkrMillion === undefined ||
      data.totalOutstandingValueLkrMillion === ""
    ) {
      errors.totalOutstandingValueLkrMillion =
        "Total value of outstanding works as at 1 December 2026 is required. (Enter full total amount in LKR, or 0 if none).";
    } else {
      const outNum = Number(data.totalOutstandingValueLkrMillion);
      if (isNaN(outNum)) {
        errors.totalOutstandingValueLkrMillion = "Total value of outstanding works must be a valid number.";
      }
    }
  }

  // Section 9: Evaluation Criteria - General Experience
  const validExp = [
    "Less than 5 years",
    "5 to 10 years",
    "More than 10 and up to 20 years",
    "More than 20 and up to 30 years",
    "More than 30 years",
  ];
  if (!data.generalExperience || !validExp.includes(data.generalExperience)) {
    errors.generalExperience = "Please select your general experience in the construction industry.";
  }

  // Section 10: Evaluation Criteria - Similar Work Experience (3 Contracts)
  const contracts = data.similarWorks || [];
  const c1 = contracts[0];

  if (!c1 || !c1.contractName || !c1.contractName.trim()) {
    errors["similarWorks.0.contractName"] =
      "Please provide Contract 1 name, or enter N/A if your firm has no similar work experience.";
  } else if (c1.contractName.trim().toUpperCase() !== "N/A") {
    if (!c1.contractType) {
      errors["similarWorks.0.contractType"] = "Contract 1: Contract type is required.";
    }
    if (c1.contractAmount === null || c1.contractAmount === undefined || c1.contractAmount === "") {
      errors["similarWorks.0.contractAmount"] = "Contract 1: Contract amount is required.";
    }
    if (!c1.startDate) {
      errors["similarWorks.0.startDate"] = "Contract 1: Start date is required.";
    }
    if (!c1.completionDate) {
      errors["similarWorks.0.completionDate"] = "Contract 1: Completion date is required.";
    }
    if (!c1.completionStatus) {
      errors["similarWorks.0.completionStatus"] = "Contract 1: Completion status is required.";
    }
  }

  // Contracts 2+: optional, validated only if non-empty and not N/A
  for (let i = 1; i < contracts.length; i++) {
    const c = contracts[i];
    if (c && c.contractName && c.contractName.trim() && c.contractName.trim().toUpperCase() !== "N/A") {
      if (!c.contractType) {
        errors[`similarWorks.${i}.contractType`] = `Contract ${i + 1}: Contract type is required.`;
      }
      if (c.contractAmount === null || c.contractAmount === undefined || c.contractAmount === "") {
        errors[`similarWorks.${i}.contractAmount`] = `Contract ${i + 1}: Contract amount is required.`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normalizes input payload: parses numbers, preserves nulls for blanks,
 * handles negative profitBeforeTax, supplier capacities, ongoing contracts,
 * and ensures consistent JSON format.
 */
export function normalizeQuestionnaireData(
  raw: Record<string, unknown>
): OfficialQuestionnaireData {
  const parseNumOrNull = (val: unknown): number | null => {
    if (val === null || val === undefined || val === "") return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  };

  // 1. Financial Statements
  const rawStatements = (raw.financialStatements as Record<string, any>) || {};
  const financialStatements: FiveYearFinancialStatements = {} as FiveYearFinancialStatements;

  for (const year of FINANCIAL_YEARS) {
    const yr = rawStatements[year] || {};
    const totAssets = parseNumOrNull(yr.totalAssets);
    const totLiab = parseNumOrNull(yr.totalLiabilities);
    const curAssets = parseNumOrNull(yr.currentAssets);
    const curLiab = parseNumOrNull(yr.currentLiabilities);

    const calcEquity = calculateTotalEquity(totAssets, totLiab);
    const calcWorkingCap = calculateWorkingCapital(curAssets, curLiab);

    financialStatements[year] = {
      totalAssets: totAssets,
      totalLiabilities: totLiab,
      totalEquity: calcEquity !== null ? calcEquity : parseNumOrNull(yr.totalEquity),
      currentAssets: curAssets,
      currentLiabilities: curLiab,
      workingCapital: calcWorkingCap !== null ? calcWorkingCap : parseNumOrNull(yr.workingCapital),
      totalRevenue: parseNumOrNull(yr.totalRevenue),
      profitBeforeTax: parseNumOrNull(yr.profitBeforeTax), // can be negative
    };
  }

  // 2. Similar Works
  const rawWorks = Array.isArray(raw.similarWorks) ? raw.similarWorks : [];
  const maxWorks = Math.max(rawWorks.length, 3);
  const similarWorks: SimilarWorkContract[] = Array.from({ length: maxWorks }, (_, i) => {
    const idx = i + 1;
    const item = rawWorks[i] || {};
    return {
      contractIndex: idx,
      contractType: item.contractType || "",
      contractTypeOther: item.contractTypeOther || undefined,
      contractName: item.contractName ? String(item.contractName).trim() : "",
      contractAmount: parseNumOrNull(item.contractAmount),
      startDate: item.startDate || null,
      completionDate: item.completionDate || null,
      completionStatus: item.completionStatus || "",
    };
  });

  // 3. Ongoing Works
  const rawOngoing = Array.isArray(raw.ongoingContracts) ? raw.ongoingContracts : [];
  const maxOngoing = Math.max(rawOngoing.length, 3);
  const ongoingContracts: OngoingWorkContract[] = Array.from({ length: maxOngoing }, (_, i) => {
    const idx = i + 1;
    const item = rawOngoing[i] || {};
    return {
      contractIndex: idx,
      contractName: item.contractName ? String(item.contractName).trim() : "",
      contractNo: item.contractNo ? String(item.contractNo).trim() : "",
      employerName: item.employerName ? String(item.employerName).trim() : "",
      contractAmount: parseNumOrNull(item.contractAmount),
      currency: String(item.currency || "LKR").trim().toUpperCase(),
      currencyOther: item.currencyOther || undefined,
      completionDate: item.completionDate || null,
    };
  });

  // 4. Participants
  const p1 = (raw.participant1 as Record<string, any>) || {};
  const p2 = (raw.participant2 as Record<string, any>) || {};

  // 5. Supplier Details
  const rawSup = (raw.supplierDetails as Record<string, any>) || {};
  const supplyCapacities: Record<string, { quantity: number | string | null; unit: string }> = {};
  if (rawSup.supplyCapacities && typeof rawSup.supplyCapacities === "object") {
    for (const [mat, cap] of Object.entries(rawSup.supplyCapacities as Record<string, any>)) {
      supplyCapacities[mat] = {
        quantity: cap?.quantity !== undefined && cap?.quantity !== null ? cap.quantity : null,
        unit: String(cap?.unit || "").trim(),
      };
    }
  }

  const supplierDetails: SupplierDetails = {
    materialsSupplied: Array.isArray(rawSup.materialsSupplied) ? rawSup.materialsSupplied : [],
    materialsOther: String(rawSup.materialsOther || "").trim(),
    companyName: String(rawSup.companyName || "").trim(),
    supplyCapacities,
    locationAddress: String(rawSup.locationAddress || "").trim(),
    province: String(rawSup.province || "").trim(),
    district: String(rawSup.district || "").trim(),
  };

  return {
    ...raw,
    organizationName: String(raw.organizationName || "").trim(),
    contactNumber: String(raw.contactNumber || "").trim(),
    email: String(raw.email || "").trim().toLowerCase(),
    willParticipate: (raw.willParticipate as any) || "",
    participantCategory: (raw.participantCategory as any) || "",
    participant1: {
      fullName: String(p1.fullName || "").trim(),
      mobileNumber: String(p1.mobileNumber || "").trim(),
      designation: String(p1.designation || "").trim(),
    },
    participant2: {
      fullName: String(p2.fullName || "").trim(),
      mobileNumber: String(p2.mobileNumber || "").trim(),
      designation: String(p2.designation || "").trim(),
    },
    supplierDetails,
    ictadRegistrationNumber: String(raw.ictadRegistrationNumber || "").trim(),
    areasOfSpecialty: Array.isArray(raw.areasOfSpecialty) ? raw.areasOfSpecialty : [],
    specialtyOther: String(raw.specialtyOther || "").trim(),
    specialtyGrades: typeof raw.specialtyGrades === "object" && raw.specialtyGrades !== null ? (raw.specialtyGrades as Record<string, string>) : {},
    specialtyGradesOther: typeof raw.specialtyGradesOther === "object" && raw.specialtyGradesOther !== null ? (raw.specialtyGradesOther as Record<string, string>) : {},
    cidaGrade: String(
      raw.cidaGrade ||
      (typeof raw.specialtyGrades === "object" && raw.specialtyGrades !== null
        ? Object.entries(raw.specialtyGrades)
            .filter(([_, g]) => Boolean(g))
            .map(([s, g]) => `${s}: ${g}`)
            .join(", ")
        : "")
    ).trim(),
    cidaGradeOther: String(raw.cidaGradeOther || "").trim(),
    financialStatements,
    loanCommitments: {
      twoYearRepaymentsDue2026To2028: parseNumOrNull(
        (raw.loanCommitments as Record<string, any>)?.twoYearRepaymentsDue2026To2028
      ),
    },
    hasOngoingContracts: (raw.hasOngoingContracts as any) || "",
    totalOutstandingValueLkrMillion: parseNumOrNull(raw.totalOutstandingValueLkrMillion),
    ongoingContracts,
    generalExperience: (raw.generalExperience as any) || "",
    similarWorks,
    mattersForDiscussion: String(raw.mattersForDiscussion || "").trim(),
  };
}
