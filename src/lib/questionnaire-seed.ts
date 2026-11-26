import {
  IQuestionnaire,
  IFormSection,
  IFormQuestion,
  Questionnaire,
  computeQuestionnaireStats,
} from "@/models/Questionnaire";
import { connectToDatabase } from "@/lib/mongodb";
import { SRI_LANKA_PROVINCES, PROVINCE_DISTRICT_MAP } from "./questionnaire-types";

export const DEFAULT_QUESTIONNAIRE_CODE = "RDA-ICDP-CONTRACTOR-Q";

export function getBaselineOfficialSections(): IFormSection[] {
  let qNum = 1;

  const sections: IFormSection[] = [
    // -----------------------------------------------------------------------
    // SECTION 1: Basic Information
    // -----------------------------------------------------------------------
    {
      id: "sec-basic-info",
      code: "SEC-01",
      title: "SECTION 1 – BASIC INFORMATION",
      description:
        "Primary organizational identification, registration contacts, and Early Market Engagement Workshop attendance declaration.",
      displayOrder: 1,
      questions: [
        {
          id: "organizationName",
          code: "Q01",
          number: qNum++,
          text: "Name of your Organization / Company / Institution",
          description: "Full registered business or corporate title.",
          helpText: "Enter the name exactly as registered under the Registrar of Companies or statutory charter.",
          placeholder: "e.g., Maga Engineering (Pvt) Ltd",
          fieldType: "short_text",
          displayOrder: 1,
          isRequired: true,
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "contactNumber",
          code: "Q02",
          number: qNum++,
          text: "Contact Number",
          description: "Active corporate telephone or mobile number.",
          helpText: "Include standard landline or Sri Lankan mobile format (e.g., +94 11 234 5678).",
          placeholder: "+94 11 000 0000",
          fieldType: "telephone",
          displayOrder: 2,
          isRequired: true,
          validation: { minLength: 9, maxLength: 25 },
        },
        {
          id: "email",
          code: "Q03",
          number: qNum++,
          text: "Email Address",
          description: "Corporate email for receiving official notices and draft resume tokens.",
          helpText: "Must be a valid and monitored email address.",
          placeholder: "contact@company.lk",
          fieldType: "email",
          displayOrder: 3,
          isRequired: true,
          validation: { minLength: 5, maxLength: 100 },
        },
        {
          id: "willParticipate",
          code: "Q04",
          number: qNum++,
          text: "Will you be participating in the workshop on 07 December 2026?",
          description: "Workshop scheduled for 07 December 2026 at Road Development Authority HQ.",
          fieldType: "radio",
          displayOrder: 4,
          isRequired: true,
          defaultValue: "Yes",
          options: [
            { id: "opt-part-yes", value: "Yes", label: "Yes", displayOrder: 1, isActive: true },
            { id: "opt-part-no", value: "No", label: "No", displayOrder: 2, isActive: true },
          ],
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 2: Participant Category
    // -----------------------------------------------------------------------
    {
      id: "sec-participant-category",
      code: "SEC-02",
      title: "SECTION 2 – PARTICIPANT CATEGORY",
      description: "Classify the institutional representation of your delegation.",
      displayOrder: 2,
      questions: [
        {
          id: "participantCategory",
          code: "Q05",
          number: qNum++,
          text: "Which category do you represent?",
          description: "Determines the specialized technical parameters required in subsequent sections.",
          fieldType: "radio",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "willParticipate",
            operator: "equals",
            value: "Yes",
          },
          options: [
            { id: "opt-cat-con", value: "Contractor", label: "Contractor", displayOrder: 1, isActive: true },
            { id: "opt-cat-sup", value: "Supplier", label: "Supplier", displayOrder: 2, isActive: true },
            { id: "opt-cat-gov", value: "Government Officer", label: "Government Officer", displayOrder: 3, isActive: true },
          ],
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 3: Authorized Representatives
    // -----------------------------------------------------------------------
    {
      id: "sec-participants",
      code: "SEC-03",
      title: "SECTION 3 – PARTICIPANT DETAILS",
      description: "Nominated delegates attending the workshop sessions on behalf of your organization.",
      displayOrder: 3,
      questions: [
        {
          id: "participant1.fullName",
          code: "Q06",
          number: qNum++,
          text: "Participant 1: Full Name",
          placeholder: "e.g., Eng. Sunil Perera",
          fieldType: "short_text",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "is_answered",
            value: true,
          },
        },
        {
          id: "participant1.mobileNumber",
          code: "Q07",
          number: qNum++,
          text: "Participant 1: Mobile Number",
          placeholder: "e.g., 0771234567",
          fieldType: "telephone",
          displayOrder: 2,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "is_answered",
            value: true,
          },
        },
        {
          id: "participant1.email",
          code: "Q07E",
          number: qNum++,
          text: "Participant 1: Email Address",
          placeholder: "e.g., sunil@example.com",
          fieldType: "email",
          displayOrder: 3,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "is_answered",
            value: true,
          },
        },
        {
          id: "participant1.designation",
          code: "Q08",
          number: qNum++,
          text: "Participant 1: Designation",
          placeholder: "e.g., Managing Director",
          fieldType: "short_text",
          displayOrder: 4,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "is_answered",
            value: true,
          },
        },
        {
          id: "participant2.fullName",
          code: "Q09",
          number: qNum++,
          text: "Participant 2: Full Name (Optional)",
          placeholder: "Second attendee name",
          fieldType: "short_text",
          displayOrder: 5,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "not_equals",
            value: "Supplier",
          },
        },
        {
          id: "participant2.mobileNumber",
          code: "Q10",
          number: qNum++,
          text: "Participant 2: Mobile Number (Optional)",
          placeholder: "e.g., 0719876543",
          fieldType: "telephone",
          displayOrder: 6,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "not_equals",
            value: "Supplier",
          },
        },
        {
          id: "participant2.email",
          code: "Q10E",
          number: qNum++,
          text: "Participant 2: Email Address (Optional)",
          placeholder: "e.g., attendee2@example.com",
          fieldType: "email",
          displayOrder: 7,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "not_equals",
            value: "Supplier",
          },
        },
        {
          id: "participant2.designation",
          code: "Q11",
          number: qNum++,
          text: "Participant 2: Designation (Optional)",
          placeholder: "e.g., Assistant Director",
          fieldType: "short_text",
          displayOrder: 8,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "not_equals",
            value: "Supplier",
          },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 4: Supplier Details
    // -----------------------------------------------------------------------
    {
      id: "sec-supplier-details",
      code: "SEC-04-SUP",
      title: "SECTION 4 – SUPPLIER DETAILS",
      description: "Please provide details of the materials you supply and your production/supply capacity.",
      displayOrder: 4,
      questions: [
        {
          id: "supplierDetails.companyName",
          code: "Q12",
          number: qNum++,
          text: "Company Name",
          placeholder: "Registered corporate name of manufacturing / supply entity",
          fieldType: "short_text",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Supplier",
          },
        },
        {
          id: "supplierDetails.materialsSupplied",
          code: "Q13",
          number: qNum++,
          text: "Please select the material(s) you supply.",
          description: "Multiple-selection checkboxes. If Other is selected, enter specification.",
          fieldType: "multi_select",
          displayOrder: 2,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Supplier",
          },
          options: [
            { id: "mat-bitumen", value: "Bitumen / Asphalt", label: "Bitumen / Asphalt", displayOrder: 1, isActive: true },
            { id: "mat-sand", value: "Sand", label: "Sand", displayOrder: 2, isActive: true },
            { id: "mat-cement", value: "Cement", label: "Cement", displayOrder: 3, isActive: true },
            { id: "mat-aggregates", value: "Aggregates", label: "Aggregates", displayOrder: 4, isActive: true },
            { id: "mat-steel", value: "Steel", label: "Steel", displayOrder: 5, isActive: true },
            { id: "mat-soil", value: "Soil", label: "Soil", displayOrder: 6, isActive: true },
            { id: "mat-other", value: "Other", label: "Other", displayOrder: 7, isActive: true },
          ],
        },
        {
          id: "supplierDetails.locationAddress",
          code: "Q14",
          number: qNum++,
          text: "Location Address",
          description: "Physical location of facility with interactive GPS map picker and coordinates",
          helpText: "Enter the physical address or pinpoint on the interactive map to set GPS coordinates.",
          placeholder: "Physical address of manufacturing plant, quarry, or central distribution warehouse...",
          fieldType: "long_text",
          displayOrder: 3,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Supplier",
          },
        },
        {
          id: "supplierDetails.province",
          code: "Q15",
          number: qNum++,
          text: "Province",
          fieldType: "dropdown",
          displayOrder: 4,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Supplier",
          },
          options: SRI_LANKA_PROVINCES.map((prov, i) => ({
            id: `prov-${i}`,
            value: prov,
            label: prov,
            displayOrder: i + 1,
            isActive: true,
          })),
        },
        {
          id: "supplierDetails.district",
          code: "Q16",
          number: qNum++,
          text: "District",
          placeholder: "Select district...",
          fieldType: "dropdown",
          displayOrder: 5,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Supplier",
          },
          options: Object.values(PROVINCE_DISTRICT_MAP).flat().map((dist, i) => ({
            id: `dist-${i}`,
            value: dist,
            label: dist,
            displayOrder: i + 1,
            isActive: true,
          })),
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 4: Contractor Details
    // -----------------------------------------------------------------------
    {
      id: "sec-contractor-details",
      code: "SEC-04-CON",
      title: "SECTION 4 – CONTRACTOR DETAILS",
      description: "Official registration with the Construction Industry Development Authority (CIDA/ICTAD).",
      displayOrder: 5,
      questions: [
        {
          id: "ictadRegistrationNumber",
          code: "Q17",
          number: qNum++,
          text: "ICTAD Registration Number",
          description: "Official accreditation reference. Must be unique for your organization.",
          placeholder: "e.g., CIDA/CON/001234",
          fieldType: "short_text",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
        {
          id: "areasOfSpecialty",
          code: "Q18",
          number: qNum++,
          text: "Areas of Specialty",
          fieldType: "multi_select",
          displayOrder: 2,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
          options: [
            { id: "spec-hwy", value: "Highway", label: "Highway", displayOrder: 1, isActive: true },
            { id: "spec-brg", value: "Bridges", label: "Bridges", displayOrder: 2, isActive: true },
            { id: "spec-soil", value: "Soil Nailing & Stabilization", label: "Soil Nailing & Stabilization", displayOrder: 3, isActive: true },
            { id: "spec-oth", value: "Other", label: "Other", displayOrder: 4, isActive: true },
          ],
        },
        {
          id: "cidaGrade",
          code: "Q19",
          number: qNum++,
          text: "CIDA Grading",
          fieldType: "dropdown",
          displayOrder: 3,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
          options: [
            "CS2", "CS1", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9",
            "SP1", "SP2", "SP3", "SP4", "SP5", "Not registered with CIDA", "Other"
          ].map((grade, i) => ({
            id: `cida-${i}`,
            value: grade,
            label: grade,
            displayOrder: i + 1,
            isActive: true,
          })),
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 5: Financial Capability
    // -----------------------------------------------------------------------
    {
      id: "sec-financial-capability",
      code: "SEC-05",
      title: "SECTION 5 – FINANCIAL CAPABILITY",
      description: "Consolidated five-year financial statements across eight statutory performance indicators.",
      displayOrder: 6,
      questions: [
        {
          id: "financialStatements",
          code: "Q20",
          number: qNum++,
          text: "Five-Year Financial Statements (2020/21 – 2024/25)",
          description: "Assets, liabilities, equity, working capital, revenue, and profit before tax in LKR.",
          fieldType: "complex_financial_table",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 6: Loan Commitments
    // -----------------------------------------------------------------------
    {
      id: "sec-loan-commitments",
      code: "SEC-06",
      title: "SECTION 6 – LOAN COMMITMENTS",
      description: "Total commercial debt servicing obligations due over the upcoming 24-month horizon in full LKR.",
      displayOrder: 7,
      questions: [
        {
          id: "loanCommitments.twoYearRepaymentsDue2026To2028",
          code: "Q21",
          number: qNum++,
          text: "Total Loan Repayments Due (01 Dec 2026 – 01 Dec 2028)",
          description: "Total loan repayments due within the next two years (1 December 2026 – 1 December 2028). Enter 0 or leave blank if none.",
          placeholder: "e.g., 25000000",
          fieldType: "currency",
          displayOrder: 1,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 7: Current Work Commitments
    // -----------------------------------------------------------------------
    {
      id: "sec-work-commitments",
      code: "SEC-07",
      title: "SECTION 7 – CURRENT WORK COMMITMENTS",
      description: "Ongoing public and private construction obligations to evaluate spare operational capacity.",
      displayOrder: 8,
      questions: [
        {
          id: "hasOngoingContracts",
          code: "Q22",
          number: qNum++,
          text: "Does your company currently have ongoing contracts?",
          fieldType: "radio",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
          options: [
            { id: "opt-ong-yes", value: "Yes", label: "Yes", displayOrder: 1, isActive: true },
            { id: "opt-ong-no", value: "No", label: "No", displayOrder: 2, isActive: true },
          ],
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 8: Ongoing Works
    // -----------------------------------------------------------------------
    {
      id: "sec-ongoing-works",
      code: "SEC-08",
      title: "SECTION 8 – ONGOING WORKS",
      description: "Total value of works that remain to be completed under all your ongoing contracts as at 1 December 2026, in LKR Million.",
      displayOrder: 9,
      questions: [
        {
          id: "totalOutstandingValueLkrMillion",
          code: "Q23",
          number: qNum++,
          text: "Total value of outstanding works as at 1 December 2026 (LKR Million)",
          description: "Please enter the total value of the works that remain to be completed under all your ongoing contracts as at 1 December 2026, in LKR Million. If you have no outstanding works, please enter 0.",
          placeholder: "e.g., 25.5",
          fieldType: "decimal",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "hasOngoingContracts",
            operator: "equals",
            value: "Yes",
          },
        },
        {
          id: "ongoingContracts",
          code: "Q24",
          number: qNum++,
          text: "Ongoing Contracts (Up to 3 Contracts)",
          description: "Contract Name, Contract Amount (supporting foreign currency), and Completion Date.",
          fieldType: "complex_table",
          displayOrder: 2,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "hasOngoingContracts",
            operator: "equals",
            value: "Yes",
          },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 9: Experience
    // -----------------------------------------------------------------------
    {
      id: "sec-general-experience",
      code: "SEC-09",
      title: "SECTION 9 – EXPERIENCE",
      description: "Track record in civil and highway engineering contracting in Sri Lanka.",
      displayOrder: 10,
      questions: [
        {
          id: "generalExperience",
          code: "Q25",
          number: qNum++,
          text: "How many years of general experience does your company have in the construction industry?",
          fieldType: "dropdown",
          displayOrder: 1,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
          options: [
            { id: "exp-1", value: "Less than 5 years", label: "Less than 5 years", displayOrder: 1, isActive: true },
            { id: "exp-2", value: "5 to 10 years", label: "5 to 10 years", displayOrder: 2, isActive: true },
            { id: "exp-3", value: "More than 10 and up to 20 years", label: "More than 10 and up to 20 years", displayOrder: 3, isActive: true },
            { id: "exp-4", value: "More than 20 and up to 30 years", label: "More than 20 and up to 30 years", displayOrder: 4, isActive: true },
            { id: "exp-5", value: "More than 30 years", label: "More than 30 years", displayOrder: 5, isActive: true },
          ],
        },
        {
          id: "hasRdaOrIcdpExperience",
          code: "Q25A",
          number: qNum++,
          text: "Already have or have worked in the past with RDA or with ICDP?",
          fieldType: "radio",
          displayOrder: 2,
          isRequired: true,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
          options: [
            { id: "rda-exp-yes", value: "Yes", label: "Yes", displayOrder: 1, isActive: true },
            { id: "rda-exp-no", value: "No", label: "No", displayOrder: 2, isActive: true },
          ],
        },
        {
          id: "rdaIcdpExperienceType",
          code: "Q25B",
          number: qNum++,
          text: "Please specify past or current engagement entity:",
          fieldType: "radio",
          displayOrder: 3,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "hasRdaOrIcdpExperience",
            operator: "equals",
            value: "Yes",
          },
          options: [
            { id: "entity-rda", value: "RDA", label: "Road Development Authority (RDA)", displayOrder: 1, isActive: true },
            { id: "entity-icdp", value: "ICDP", label: "Inclusive Connectivity & Development Project (ICDP)", displayOrder: 2, isActive: true },
            { id: "entity-both", value: "Both", label: "Both RDA & ICDP", displayOrder: 3, isActive: true },
          ],
        },
        {
          id: "rdaIcdpProjectDetails",
          code: "Q25C",
          number: qNum++,
          text: "Contract or project details with RDA / ICDP (Optional)",
          placeholder: "e.g., Contract Name, Contract Number, Year, or Province",
          fieldType: "short_text",
          displayOrder: 4,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "hasRdaOrIcdpExperience",
            operator: "equals",
            value: "Yes",
          },
        },
        {
          id: "peakProductionRates",
          code: "Q25D",
          number: qNum++,
          text: "Production rate within to consider 12 months with last 10 years",
          description: "Peak production rate achieved within any consecutive 12 months during the last 10 years for Asphalt Concrete (Binder / Wearing Course), Concrete (Structural & Pavement Concrete), and ABC (Aggregate Base Course).",
          helpText: "Peak production rate achieved within any consecutive 12 months during the last 10 years for Asphalt Concrete (Binder / Wearing Course in SQM), Concrete (Cum), and ABC (Cum).",
          fieldType: "complex_table",
          displayOrder: 5,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 10: Similar Work Experience
    // -----------------------------------------------------------------------
    {
      id: "sec-similar-works",
      code: "SEC-10",
      title: "SECTION 10 – SIMILAR WORK EXPERIENCE",
      description: "Please provide details of the highest-value contracts your organization has completed within the last five years (December 2021 to November 2026) that are similar in nature to the proposed works, entered in descending order from highest to lowest value.",
      displayOrder: 11,
      questions: [
        {
          id: "similarWorks",
          code: "Q26",
          number: qNum++,
          text: "Similar Work Contracts (Exactly 3 Contracts)",
          description: "Contract 1 required when experience exists (enter N/A in Contract Name if none). Subsequent contracts must be entered in descending order from highest value to lowest value.",
          fieldType: "complex_table",
          displayOrder: 1,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
        {
          id: "forecastedCapacity2027",
          code: "Q26A",
          number: qNum++,
          text: "Anticipated / Forecasted Annual Construction Turnover for Year 2027 (LKR Million)",
          description: "Estimate your organization's anticipated annual construction turnover for 2027 in LKR Million.",
          placeholder: "e.g., 250",
          fieldType: "decimal",
          displayOrder: 2,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
        {
          id: "forecastedRuralRoadKmPerYear",
          code: "Q26B",
          number: qNum++,
          text: "Rural Road Construction Forecasted (Rough Length Estimate in Km / Year)",
          description: "Anticipated rural road construction capability in Km/Year.",
          placeholder: "e.g., 25",
          fieldType: "decimal",
          displayOrder: 3,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
        {
          id: "forecastedNationalProvincialKmPerYear",
          code: "Q26C",
          number: qNum++,
          text: "National / Provincial Road Construction Forecasted (Rough Length Estimate in Km / Year)",
          description: "Anticipated national and provincial road construction capability in Km/Year.",
          placeholder: "e.g., 15",
          fieldType: "decimal",
          displayOrder: 4,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
        },
        {
          id: "preferableDistricts",
          code: "Q26D",
          number: qNum++,
          text: "Preferable Districts for Project Execution",
          description: "Select one or more districts in Sri Lanka where your organization prefers to undertake road construction works.",
          fieldType: "multi_select",
          displayOrder: 5,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
          options: Object.values(PROVINCE_DISTRICT_MAP).flat().map((dist, i) => ({
            id: `pref-dist-${i}`,
            value: dist,
            label: dist,
            displayOrder: i + 1,
            isActive: true,
          })),
        },
        {
          id: "historicalLitigationType",
          code: "Q26E",
          number: qNum++,
          text: "Historical Contract non performance, pending litigation and litigation history",
          fieldType: "dropdown",
          displayOrder: 6,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "participantCategory",
            operator: "equals",
            value: "Contractor",
          },
          options: [
            { id: "hist-none", value: "None", label: "None (No non-performance or litigation history)", displayOrder: 1, isActive: true },
            { id: "hist-non-perf", value: "Non performing contract", label: "Non performing contract", displayOrder: 2, isActive: true },
            { id: "hist-pending", value: "Pending litigation", label: "Pending litigation", displayOrder: 3, isActive: true },
            { id: "hist-past", value: "Litigation history past", label: "Litigation history past", displayOrder: 4, isActive: true },
          ],
        },
        {
          id: "historicalContractIdentification",
          code: "Q26F",
          number: qNum++,
          text: "Contract identification",
          placeholder: "e.g., Contract Name, Contract Number, Year, or Project reference",
          fieldType: "short_text",
          displayOrder: 7,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "historicalLitigationType",
            operator: "not_equals",
            value: "None",
          },
        },
        {
          id: "historicalEmployerName",
          code: "Q26G",
          number: qNum++,
          text: "Name of employer",
          placeholder: "e.g., Employer / Client Name, Ministry or Department",
          fieldType: "short_text",
          displayOrder: 8,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "historicalLitigationType",
            operator: "not_equals",
            value: "None",
          },
        },
        {
          id: "historicalReason",
          code: "Q26H",
          number: qNum++,
          text: "Reason for non performance / pending litigation / litigation history past",
          placeholder: "Explain the circumstances, background, or reasons...",
          fieldType: "long_text",
          displayOrder: 9,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "historicalLitigationType",
            operator: "not_equals",
            value: "None",
          },
        },
        {
          id: "historicalMatterDispute",
          code: "Q26I",
          number: qNum++,
          text: "Matter dispute",
          placeholder: "Specify the matter in dispute (e.g. claim amount, delay damages, arbitration)...",
          fieldType: "short_text",
          displayOrder: 10,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "historicalLitigationType",
            operator: "not_equals",
            value: "None",
          },
        },
      ],
    },

    // -----------------------------------------------------------------------
    // SECTION 11: Matters for Discussion
    // -----------------------------------------------------------------------
    {
      id: "sec-matters-discussion",
      code: "SEC-11",
      title: "SECTION 11 – MATTERS FOR DISCUSSION",
      description: "Suggestions, industry concerns, and topics to raise during the Early Market Engagement sessions.",
      displayOrder: 12,
      questions: [
        {
          id: "mattersForDiscussion",
          code: "Q27",
          number: qNum++,
          text: "Do you have any specific matters, concerns or suggestions that you would like to be discussed during the Early Market Engagement Workshop?",
          description: "Participants are encouraged to share any matters relating to market conditions, technical requirements, procurement arrangements, implementation challenges or other issues relevant to the anticipated ICDP activities.",
          placeholder: "Share key topics, challenges, supply issues, or suggestions for the agenda on 07 December 2026...",
          fieldType: "long_text",
          displayOrder: 1,
          isRequired: false,
          conditionalLogic: {
            enabled: true,
            dependsOnQuestionId: "willParticipate",
            operator: "equals",
            value: "Yes",
          },
        },
      ],
    },
  ];

  return sections;
}

/**
 * Initializes the baseline official questionnaire in MongoDB if not already seeded.
 * Guarantees that the existing questionnaire is permanently preserved as Version 1.0 (PUBLISHED).
 */
export async function seedDefaultQuestionnaire(): Promise<IQuestionnaire> {
  await connectToDatabase();

  let questionnaire = await Questionnaire.findOne({
    code: DEFAULT_QUESTIONNAIRE_CODE,
    status: "PUBLISHED",
  });

  if (questionnaire) {
    return questionnaire;
  }

  // Check if any questionnaire exists with this code
  questionnaire = await Questionnaire.findOne({ code: DEFAULT_QUESTIONNAIRE_CODE }).sort({ versionNumber: -1 });
  if (questionnaire) {
    // Ensure slug, category, and isDefault are populated on existing documents
    if (!questionnaire.slug || !questionnaire.category || !questionnaire.isDefault) {
      await Questionnaire.updateMany(
        { code: DEFAULT_QUESTIONNAIRE_CODE },
        {
          $set: {
            slug: "contractor",
            category: "Contractor",
            isDefault: true,
            instructions: "Please complete all mandatory sections before submitting your annual declaration.",
          },
        }
      );
    }
    return questionnaire;
  }

  // Build baseline sections
  const sections = getBaselineOfficialSections();
  const stats = computeQuestionnaireStats(sections);

  questionnaire = await Questionnaire.create({
    title: "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire",
    code: DEFAULT_QUESTIONNAIRE_CODE,
    slug: "contractor",
    category: "Contractor",
    isDefault: true,
    instructions: "Please complete all mandatory sections before submitting your annual declaration.",
    description:
      "Official institutional questionnaire for collecting contractor, supplier, and government stakeholder capacity declarations under the Inclusive Connectivity and Development Project (ICDP).",
    version: "1.0",
    versionNumber: 1,
    status: "PUBLISHED",
    isPublished: true,
    isLocked: false,
    lockReason: "",
    publishedAt: new Date(),
    sections,
    stats,
    metadata: {
      authoritativeSource: "Road Development Authority - Ministry of Transport and Highways",
      seededAt: new Date().toISOString(),
      framework: "ICDP-Stage1",
    },
  });

  return questionnaire;
}

export async function seedAdditionalBaselineForms(): Promise<void> {
  await connectToDatabase();

  // 1. Supplier Registry Form
  const existingSupplier = await Questionnaire.findOne({ code: "RDA-SUPPLIER-Q" });
  if (!existingSupplier) {
    const supplierSections: IFormSection[] = [
      {
        id: "sec_sup_1",
        code: "SEC-01",
        title: "1. Supplier Entity & Factory Identification",
        description: "Official registered details of the material or machinery manufacturing company.",
        displayOrder: 1,
        questions: [
          {
            id: "sup_q1",
            code: "SUP_01",
            number: 1,
            text: "Supplier Business Name (Pvt Ltd / Public / Partnership)",
            placeholder: "e.g., Tokyo Supermix Asphalt & Aggregates Ltd",
            fieldType: "short_text",
            isRequired: true,
            displayOrder: 1,
            validation: { minLength: 3, maxLength: 200 },
          },
          {
            id: "sup_q2",
            code: "SUP_02",
            number: 2,
            text: "Primary Plant Yard / Batching Plant Location",
            fieldType: "long_text",
            isRequired: true,
            displayOrder: 2,
          },
          {
            id: "sup_q3",
            code: "SUP_03",
            number: 3,
            text: "Operational Province of Plant Fleet",
            fieldType: "dropdown",
            isRequired: true,
            displayOrder: 3,
            options: SRI_LANKA_PROVINCES.map((p, i) => ({
              id: `prov_${i}`,
              value: p,
              label: p,
              displayOrder: i + 1,
              isActive: true,
            })),
          },
        ],
      },
      {
        id: "sec_sup_2",
        code: "SEC-02",
        title: "2. Materials Supplied & Annual Production Capacity",
        description: "Classification of supplied materials and production capacities.",
        displayOrder: 2,
        questions: [
          {
            id: "sup_q4",
            code: "SUP_04",
            number: 4,
            text: "Materials Supplied to RDA Highway Projects",
            fieldType: "multi_select",
            isRequired: true,
            displayOrder: 1,
            options: [
              { id: "mat_1", value: "Ready-Mix Concrete", label: "Ready-Mix Concrete", displayOrder: 1, isActive: true },
              { id: "mat_2", value: "Asphalt Premix", label: "Asphalt Premix", displayOrder: 2, isActive: true },
              { id: "mat_3", value: "Bitumen Emulsion", label: "Bitumen Emulsion", displayOrder: 3, isActive: true },
              { id: "mat_4", value: "Crushed Aggregates (ABC/Base)", label: "Crushed Aggregates (ABC/Base)", displayOrder: 4, isActive: true },
              { id: "mat_5", value: "Precast Concrete Elements", label: "Precast Concrete Elements", displayOrder: 5, isActive: true },
            ],
          },
          {
            id: "sup_q5",
            code: "SUP_05",
            number: 5,
            text: "Annual Aggregate Production Capacity (Metric Tons / Year)",
            fieldType: "decimal",
            isRequired: false,
            displayOrder: 2,
          },
        ],
      },
    ];

    await Questionnaire.create({
      title: "RDA Material & Plant Equipment Supplier Registry",
      code: "RDA-SUPPLIER-Q",
      slug: "supplier",
      category: "Supplier",
      isDefault: false,
      instructions: "Authorized supplier representatives must register plant yards, manufacturing capacities, and fleet availability.",
      description: "Annual institutional registration and plant verification questionnaire for crushed aggregates, asphalt premix, bitumen, concrete, and heavy machinery suppliers.",
      version: "1.0",
      versionNumber: 1,
      status: "PUBLISHED",
      isPublished: true,
      isLocked: false,
      publishedAt: new Date(),
      sections: supplierSections,
      stats: computeQuestionnaireStats(supplierSections),
    });
  }

  // 2. Workshop Delegate Questionnaire
  const existingWorkshop = await Questionnaire.findOne({ code: "RDA-WORKSHOP-Q" });
  if (!existingWorkshop) {
    const workshopSections: IFormSection[] = [
      {
        id: "sec_ws_1",
        code: "SEC-01",
        title: "1. Stakeholder Entity & Delegate Nomination",
        description: "Official representative registration for the Early Market Engagement Workshop.",
        displayOrder: 1,
        questions: [
          {
            id: "ws_q1",
            code: "WS_01",
            number: 1,
            text: "Participating Institution / Organization Name",
            fieldType: "short_text",
            isRequired: true,
            displayOrder: 1,
            validation: { minLength: 3, maxLength: 200 },
          },
          {
            id: "ws_q2",
            code: "WS_02",
            number: 2,
            text: "Nominated Delegate: Full Name",
            fieldType: "short_text",
            isRequired: true,
            displayOrder: 2,
          },
          {
            id: "ws_q3",
            code: "WS_03",
            number: 3,
            text: "Delegate Official Designation",
            fieldType: "short_text",
            isRequired: true,
            displayOrder: 3,
          },
          {
            id: "ws_q4",
            code: "WS_04",
            number: 4,
            text: "Delegate Mobile Number",
            fieldType: "telephone",
            isRequired: true,
            displayOrder: 4,
          },
        ],
      },
      {
        id: "sec_ws_2",
        code: "SEC-02",
        title: "2. Strategic Market Engagement Feedback",
        description: "Feedback and policy topics recommended for panel discussion at the RDA Headquarters.",
        displayOrder: 2,
        questions: [
          {
            id: "ws_q5",
            code: "WS_05",
            number: 5,
            text: "Primary Industry Challenge Faced in Major Road Delivery",
            fieldType: "radio",
            isRequired: true,
            displayOrder: 1,
            options: [
              { id: "c1", value: "Material Price Escalation & Price Indices", label: "Material Price Escalation & Price Indices", displayOrder: 1, isActive: true },
              { id: "c2", value: "Cash Flow & Bank Facility Constraints", label: "Cash Flow & Bank Facility Constraints", displayOrder: 2, isActive: true },
              { id: "c3", value: "Procurement Timelines & Evaluation Periods", label: "Procurement Timelines & Evaluation Periods", displayOrder: 3, isActive: true },
              { id: "c4", value: "Environmental & Right-of-Way Approvals", label: "Environmental & Right-of-Way Approvals", displayOrder: 4, isActive: true },
            ],
          },
          {
            id: "ws_q6",
            code: "WS_06",
            number: 6,
            text: "Topics or Policy Proposals Recommended for Workshop Discussion",
            fieldType: "long_text",
            isRequired: false,
            displayOrder: 2,
          },
        ],
      },
    ];

    await Questionnaire.create({
      title: "ICDP Early Market Engagement Workshop Delegate Questionnaire",
      code: "RDA-WORKSHOP-Q",
      slug: "workshop",
      category: "Workshop",
      isDefault: false,
      instructions: "Please register your technical delegates and submit strategic topics recommended for panel discussion with RDA Directors.",
      description: "Delegate registration and strategic discussion topic submission for the Early Market Engagement Workshop.",
      version: "1.0",
      versionNumber: 1,
      status: "PUBLISHED",
      isPublished: true,
      isLocked: false,
      publishedAt: new Date(),
      sections: workshopSections,
      stats: computeQuestionnaireStats(workshopSections),
    });
  }
}

export const SUPPLIER_QUESTIONNAIRE_CODE = "RDA-SUPPLIER-Q";

export function getSupplierSections(): IFormSection[] {
  return [
    {
      id: "sec-supplier-details",
      code: "SEC-01",
      title: "1. Supplier Organization & Contact Details",
      description: "Please enter verified commercial details for your materials supply organization. All fields are mandatory and email must be unique.",
      displayOrder: 1,
      questions: [
        {
          id: "organizationName",
          code: "Q01",
          number: 1,
          text: "Name of Supplier Organization / Company",
          description: "Official registered corporate or commercial trading name of the supplier.",
          placeholder: "e.g., Lanka Asphalt & Aggregates (Pvt) Ltd",
          fieldType: "short_text",
          displayOrder: 1,
          isRequired: true,
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "contactNumber",
          code: "Q02",
          number: 2,
          text: "Organization Contact Telephone / Mobile Number",
          description: "Active official telephone or mobile number for institutional correspondence.",
          placeholder: "+94 11 234 5678 / 077 123 4567",
          fieldType: "telephone",
          displayOrder: 2,
          isRequired: true,
          validation: { minLength: 9, maxLength: 20 },
        },
        {
          id: "email",
          code: "Q03",
          number: 3,
          text: "Official Organization Email Address",
          description: "Primary verified institutional email. Official registration confirmation and tracking reference will be dispatched to this address. Must be unique per supplier.",
          placeholder: "e.g., supplier@organization.lk",
          fieldType: "email",
          displayOrder: 3,
          isRequired: true,
          validation: { minLength: 5, maxLength: 100 },
        },
      ],
    },
  ];
}

export async function seedSupplierQuestionnaire(): Promise<IQuestionnaire> {
  await connectToDatabase();

  const existing = await Questionnaire.findOne({
    $or: [{ code: SUPPLIER_QUESTIONNAIRE_CODE }, { slug: "supplier" }],
  });

  if (existing) {
    return existing;
  }

  const supplierSections = getSupplierSections();
  const stats = computeQuestionnaireStats(supplierSections);

  const supplierForm = await Questionnaire.create({
    title: "RDA Supplier Registration & Capacity Questionnaire",
    code: SUPPLIER_QUESTIONNAIRE_CODE,
    slug: "supplier",
    category: "Supplier",
    isDefault: false,
    version: "1.0",
    versionNumber: 1,
    status: "PUBLISHED",
    isPublished: true,
    isLocked: false,
    publishedAt: new Date(),
    description: "Official institutional questionnaire for collecting materials supplier capacity, supply profiles, and business registration details under the Inclusive Connectivity and Development Project (ICDP).",
    instructions: "Please enter your verified supplier organization details, official telephone number, and primary email address. Each organization must submit using a unique email address.",
    sections: supplierSections,
    stats,
  });

  return supplierForm;
}
