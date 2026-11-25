"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  PieChart,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Printer,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  Briefcase,
  Truck,
  Landmark,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileText,
  Copy,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  UserX,
  SlidersHorizontal,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Factory,
  HardHat,
  Scale,
} from "lucide-react";
import Link from "next/link";

interface FormattedSubmission {
  id: string;
  ref: string;
  contractor: string;
  regNo: string;
  grade: string;
  submissionType: string;
  provincialOffice: string;
  status: string;
  category?: string;
  isViewed?: boolean;
  questionnaireData?: any;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string | null;
  reviewedBy?: string;
}

interface CustomRule {
  id: string;
  field: string;
  operator: "contains" | "not_contains" | "equals" | "is_not_empty" | "is_empty";
  value: string;
}

const PROVINCES = [
  "All 9 Provinces (National Level)",
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

const DISTRICTS = [
  "All Districts",
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];

const CIDA_GRADES = [
  "All Grades (CS1 to Specialist)",
  "CS2",
  "CS1",
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
  "SP1",
  "SP2",
  "SP3",
  "SP4",
  "SP5",
  "Not registered with CIDA",
];

const CATEGORIES = [
  { label: "All Categories", value: "All Categories" },
  { label: "Civil Contractor", value: "Contractor" },
  { label: "Material Supplier", value: "Supplier" },
  { label: "Government Officer", value: "Government Officer" },
];

const ATTENDANCE_OPTIONS = [
  { label: "All Workshop Responses", value: "All Attendance" },
  { label: "Will Participate (Attending - Yes)", value: "Yes" },
  { label: "Will Not Participate (Non-Attendee - No)", value: "No" },
];

const SPECIALTIES = [
  "All Specialties",
  "Highway",
  "Bridges",
  "Soil Nailing & Stabilization",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "All Experience Levels",
  "Less than 5 years",
  "5 to 10 years",
  "More than 10 and up to 20 years",
  "More than 20 and up to 30 years",
  "More than 30 years",
];

const SUPPLIER_MATERIALS = [
  "All Materials",
  "Bitumen & Asphalt",
  "Aggregates & Quarry Products",
  "Cement & Concrete",
  "Steel & Rebar",
  "Precast Concrete Units",
  "Soil, Sand & Earth",
  "Bitumen Emulsion",
  "Geotextiles & Geosynthetics",
];

const LITIGATION_OPTIONS = [
  "All Legal Records",
  "Clean Record (None)",
  "Has Non-Performing Contract",
  "Has Pending Litigation",
  "Has Past Litigation History",
];

const OUTSTANDING_VALUE_OPTIONS = [
  { label: "Any Outstanding Works", value: "all" },
  { label: "None / Zero Outstanding Works", value: "zero" },
  { label: "Under LKR 50 Million", value: "<50" },
  { label: "LKR 50M – 200 Million", value: "50-200" },
  { label: "LKR 200M – 500 Million", value: "200-500" },
  { label: "Over LKR 500 Million", value: ">500" },
  { label: "Over LKR 1 Billion", value: ">1000" },
];

const CUSTOM_FILTER_FIELDS = [
  { label: "Organization / Firm Name", key: "organizationName" },
  { label: "ICTAD / CIDA Registration No", key: "ictadRegistrationNumber" },
  { label: "Representative / Contact Person Name", key: "contactPerson" },
  { label: "Designation / Position", key: "designation" },
  { label: "Mobile / Phone Number", key: "phone" },
  { label: "Official Email Address", key: "email" },
  { label: "Operating District", key: "district" },
  { label: "Preferable District", key: "preferableDistricts" },
  { label: "Area of Specialty", key: "specialty" },
  { label: "Supplier Company Name", key: "supplierCompany" },
  { label: "Supplier Location Address", key: "supplierAddress" },
  { label: "Supplier Materials Supplied", key: "supplierMaterials" },
  { label: "RDA / ICDP Project Details", key: "rdaDetails" },
  { label: "Ongoing Contract Name / Employer", key: "ongoingContractName" },
  { label: "Similar Work Name", key: "similarWorkName" },
  { label: "Discussion Matters / Concerns", key: "mattersForDiscussion" },
  { label: "Litigation Dispute Details / Reason", key: "litigationDetails" },
];

function formatDisplayDate(val: any): string {
  if (!val) return "—";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "—") return "—";
    // Check if already in DD/MM/YYYY or YYYY-MM-DD
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return trimmed;
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-GB");
    return trimmed;
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toLocaleDateString("en-GB");
  }
  return "—";
}

export default function ReportsPage() {
  // Primary Filter States (Defaults to official submitted records only)
  const [attendance, setAttendance] = useState<string>("All Attendance");
  const [category, setCategory] = useState<string>("All Categories");
  const [province, setProvince] = useState<string>("All 9 Provinces (National Level)");
  const [cidaGrade, setCidaGrade] = useState<string>("All Grades (CS1 to Specialist)");
  const [status, setStatus] = useState<string>("submitted");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Secondary Detailed Field Filter States
  const [district, setDistrict] = useState<string>("All Districts");
  const [specialty, setSpecialty] = useState<string>("All Specialties");
  const [experience, setExperience] = useState<string>("All Experience Levels");
  const [rdaExp, setRdaExp] = useState<string>("all");
  const [ongoingContracts, setOngoingContracts] = useState<string>("all");
  const [outstandingValue, setOutstandingValue] = useState<string>("all");
  const [hasAsphaltPlant, setHasAsphaltPlant] = useState<string>("all");
  const [hasConcretePlant, setHasConcretePlant] = useState<string>("all");
  const [hasAbcPlant, setHasAbcPlant] = useState<string>("all");
  const [supplierMaterial, setSupplierMaterial] = useState<string>("All Materials");
  const [litigation, setLitigation] = useState<string>("All Legal Records");
  const [preferableDistrict, setPreferableDistrict] = useState<string>("All Preferred Districts");

  // Dynamic Rule-Based Field Filters
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Data & Execution States
  const [submissions, setSubmissions] = useState<FormattedSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Handle Date Preset Changes
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    }
  };

  // Add a dynamic rule
  const handleAddCustomRule = () => {
    setCustomRules((prev) => [
      ...prev,
      {
        id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        field: "organizationName",
        operator: "contains",
        value: "",
      },
    ]);
    setShowAdvancedFilters(true);
  };

  const handleUpdateCustomRule = (id: string, updates: Partial<CustomRule>) => {
    setCustomRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleRemoveCustomRule = (id: string) => {
    setCustomRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Fetch Submissions Data from Server
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        limit: "5000", // Full dataset fetch for responsive in-memory multi-field filtering
      });

      if (attendance !== "All Attendance") params.append("attendance", attendance);
      if (category !== "All Categories") params.append("category", category);
      if (province !== "All 9 Provinces (National Level)") params.append("province", province);
      if (cidaGrade !== "All Grades (CS1 to Specialist)") params.append("cidaGrade", cidaGrade);
      if (status !== "All Statuses") params.append("status", status);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load data (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSubmissions(data.data);
      } else {
        setSubmissions([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading report data.");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [attendance, category, province, cidaGrade, status, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset all filters
  const handleResetFilters = () => {
    setAttendance("All Attendance");
    setCategory("All Categories");
    setProvince("All 9 Provinces (National Level)");
    setCidaGrade("All Grades (CS1 to Specialist)");
    setStatus("submitted");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
    setDistrict("All Districts");
    setSpecialty("All Specialties");
    setExperience("All Experience Levels");
    setRdaExp("all");
    setOngoingContracts("all");
    setOutstandingValue("all");
    setHasAsphaltPlant("all");
    setHasConcretePlant("all");
    setHasAbcPlant("all");
    setSupplierMaterial("All Materials");
    setLitigation("All Legal Records");
    setPreferableDistrict("All Preferred Districts");
    setCustomRules([]);
  };

  // Compute Count of Active Advanced Filters
  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (district !== "All Districts") count++;
    if (specialty !== "All Specialties") count++;
    if (experience !== "All Experience Levels") count++;
    if (rdaExp !== "all") count++;
    if (ongoingContracts !== "all") count++;
    if (outstandingValue !== "all") count++;
    if (hasAsphaltPlant !== "all") count++;
    if (hasConcretePlant !== "all") count++;
    if (hasAbcPlant !== "all") count++;
    if (supplierMaterial !== "All Materials") count++;
    if (litigation !== "All Legal Records") count++;
    if (preferableDistrict !== "All Preferred Districts") count++;
    count += customRules.length;
    return count;
  }, [
    district,
    specialty,
    experience,
    rdaExp,
    ongoingContracts,
    outstandingValue,
    hasAsphaltPlant,
    hasConcretePlant,
    hasAbcPlant,
    supplierMaterial,
    litigation,
    preferableDistrict,
    customRules,
  ]);

  // Comprehensive Multi-Field Client-Side Filter Evaluation
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = s.questionnaireData || {};

      // Exclude fake/dummy test entries and unsubmitted draft tokens from official reporting
      if (s.ref?.startsWith("DFT-") || s.status === "Draft") {
        if (status !== "All Statuses" && status !== "draft") return false;
      }
      const entityName = (s.contractor || q.organizationName || "").toLowerCase();
      if (entityName.includes("testing") || entityName.includes("dummy")) {
        return false;
      }

      // 1. Attendance Filter
      if (attendance !== "All Attendance") {
        if (q.willParticipate !== attendance) return false;
      }

      // 2. Category Filter
      if (category !== "All Categories") {
        const cat = q.participantCategory || s.category;
        if (cat !== category) return false;
      }

      // 3. Province Filter
      if (province !== "All 9 Provinces (National Level)") {
        const prov = s.provincialOffice || q.supplierDetails?.province;
        if (prov !== province) return false;
      }

      // 4. CIDA Grade Filter
      if (cidaGrade !== "All Grades (CS1 to Specialist)") {
        const g = q.cidaGrade || s.grade;
        if (g !== cidaGrade) return false;
      }

      // 5. Status Filter
      if (status !== "All Statuses") {
        if (status === "submitted" && s.status === "Draft") return false;
        if (status === "draft" && s.status !== "Draft") return false;
      }

      // 6. District Filter
      if (district !== "All Districts") {
        const dist = q.district || q.supplierDetails?.district;
        if (dist !== district) return false;
      }

      // 7. Area of Specialty Filter
      if (specialty !== "All Specialties") {
        const spec = q.specialty || "";
        if (!spec.toLowerCase().includes(specialty.toLowerCase())) return false;
      }

      // 8. General Experience Filter
      if (experience !== "All Experience Levels") {
        if (q.generalExperience !== experience) return false;
      }

      // 9. Past RDA / ICDP Experience Filter
      if (rdaExp !== "all") {
        if (rdaExp === "yes" && q.hasRdaOrIcdpExperience !== "Yes") return false;
        if (rdaExp === "no" && q.hasRdaOrIcdpExperience !== "No") return false;
      }

      // 10. Has Ongoing Contracts Filter
      if (ongoingContracts !== "all") {
        if (ongoingContracts === "yes" && q.hasOngoingContracts !== "Yes") return false;
        if (ongoingContracts === "no" && q.hasOngoingContracts !== "No") return false;
      }

      // 11. Outstanding Works Value Filter
      if (outstandingValue !== "all") {
        const val = Number(q.totalOutstandingValueLkrMillion) || 0;
        if (outstandingValue === "zero" && val > 0) return false;
        if (outstandingValue === "<50" && (val === 0 || val >= 50)) return false;
        if (outstandingValue === "50-200" && (val < 50 || val > 200)) return false;
        if (outstandingValue === "200-500" && (val < 200 || val > 500)) return false;
        if (outstandingValue === ">500" && val <= 500) return false;
        if (outstandingValue === ">1000" && val <= 1000) return false;
      }

      // 12. Plant Availability Filters (Asphalt, Concrete, ABC)
      if (hasAsphaltPlant !== "all") {
        const asp = Number(q.peakProductionRates?.asphaltConcrete || q.peakProductionRates?.asp) || 0;
        if (hasAsphaltPlant === "yes" && asp <= 0) return false;
        if (hasAsphaltPlant === "no" && asp > 0) return false;
      }
      if (hasConcretePlant !== "all") {
        const conc = Number(q.peakProductionRates?.concrete) || 0;
        if (hasConcretePlant === "yes" && conc <= 0) return false;
        if (hasConcretePlant === "no" && conc > 0) return false;
      }
      if (hasAbcPlant !== "all") {
        const abc = Number(q.peakProductionRates?.abc) || 0;
        if (hasAbcPlant === "yes" && abc <= 0) return false;
        if (hasAbcPlant === "no" && abc > 0) return false;
      }

      // 13. Supplier Materials Supplied Filter
      if (supplierMaterial !== "All Materials") {
        const mats = Array.isArray(q.supplierDetails?.materialsSupplied)
          ? q.supplierDetails.materialsSupplied
          : [];
        const matchesMat = mats.some((m: string) =>
          m.toLowerCase().includes(supplierMaterial.toLowerCase())
        );
        if (!matchesMat) return false;
      }

      // 14. Historical Litigation Filter
      if (litigation !== "All Legal Records") {
        const litType = (q.historicalLitigationType || "None").trim().toLowerCase();
        if (litigation === "Clean Record (None)" && litType !== "none" && litType !== "") return false;
        if (litigation === "Has Non-Performing Contract" && !litType.includes("non performing")) return false;
        if (litigation === "Has Pending Litigation" && !litType.includes("pending")) return false;
        if (litigation === "Has Past Litigation History" && !litType.includes("past")) return false;
      }

      // 15. Preferable Operating District Filter
      if (preferableDistrict !== "All Preferred Districts") {
        const prefList = Array.isArray(q.preferableDistricts) ? q.preferableDistricts : [];
        if (!prefList.includes(preferableDistrict)) return false;
      }

      // 16. Multi-Field Global Search
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchSearch =
          s.ref?.toLowerCase().includes(term) ||
          s.contractor?.toLowerCase().includes(term) ||
          q.organizationName?.toLowerCase().includes(term) ||
          q.ictadRegistrationNumber?.toLowerCase().includes(term) ||
          q.contactNumber?.toLowerCase().includes(term) ||
          q.email?.toLowerCase().includes(term) ||
          q.participant1?.fullName?.toLowerCase().includes(term) ||
          q.participant1?.mobileNumber?.toLowerCase().includes(term) ||
          q.participant1?.email?.toLowerCase().includes(term) ||
          q.supplierDetails?.companyName?.toLowerCase().includes(term) ||
          q.mattersForDiscussion?.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      // 17. Custom Field Query Rules (User-defined field/operator pairs)
      for (const rule of customRules) {
        if (!rule.field || (!rule.value && rule.operator !== "is_not_empty" && rule.operator !== "is_empty")) {
          continue;
        }

        let targetValue = "";
        switch (rule.field) {
          case "organizationName":
            targetValue = q.organizationName || s.contractor || "";
            break;
          case "ictadRegistrationNumber":
            targetValue = q.ictadRegistrationNumber || s.regNo || "";
            break;
          case "contactPerson":
            targetValue = q.participant1?.fullName || "";
            break;
          case "designation":
            targetValue = q.participant1?.designation || "";
            break;
          case "phone":
            targetValue = q.participant1?.mobileNumber || q.contactNumber || "";
            break;
          case "email":
            targetValue = q.participant1?.email || q.email || "";
            break;
          case "district":
            targetValue = q.district || q.supplierDetails?.district || "";
            break;
          case "preferableDistricts":
            targetValue = Array.isArray(q.preferableDistricts) ? q.preferableDistricts.join(", ") : "";
            break;
          case "specialty":
            targetValue = q.specialty || "";
            break;
          case "supplierCompany":
            targetValue = q.supplierDetails?.companyName || "";
            break;
          case "supplierAddress":
            targetValue = q.supplierDetails?.locationAddress || "";
            break;
          case "supplierMaterials":
            targetValue = Array.isArray(q.supplierDetails?.materialsSupplied)
              ? q.supplierDetails.materialsSupplied.join(", ")
              : "";
            break;
          case "rdaDetails":
            targetValue = `${q.rdaIcdpExperienceType || ""} ${q.rdaIcdpProjectDetails || ""}`;
            break;
          case "ongoingContractName":
            targetValue = (q.ongoingContracts || [])
              .map((c: any) => `${c.contractName} ${c.employerName}`)
              .join("; ");
            break;
          case "similarWorkName":
            targetValue = (q.similarWorks || [])
              .map((c: any) => `${c.contractName} ${c.contractType}`)
              .join("; ");
            break;
          case "mattersForDiscussion":
            targetValue = q.mattersForDiscussion || "";
            break;
          case "litigationDetails":
            targetValue = `${q.historicalLitigationType || ""} ${q.historicalContractIdentification || ""} ${q.historicalEmployerName || ""} ${q.historicalReason || ""}`;
            break;
        }

        const valLower = targetValue.toLowerCase();
        const ruleValLower = rule.value.toLowerCase().trim();

        if (rule.operator === "contains" && !valLower.includes(ruleValLower)) return false;
        if (rule.operator === "not_contains" && valLower.includes(ruleValLower)) return false;
        if (rule.operator === "equals" && valLower !== ruleValLower) return false;
        if (rule.operator === "is_not_empty" && !valLower.trim()) return false;
        if (rule.operator === "is_empty" && valLower.trim()) return false;
      }

      return true;
    });
  }, [
    submissions,
    attendance,
    category,
    province,
    cidaGrade,
    status,
    district,
    specialty,
    experience,
    rdaExp,
    ongoingContracts,
    outstandingValue,
    hasAsphaltPlant,
    hasConcretePlant,
    hasAbcPlant,
    supplierMaterial,
    litigation,
    preferableDistrict,
    search,
    customRules,
  ]);

  // Analytical Metrics Computations on Filtered Submissions
  const analytics = useMemo(() => {
    const total = filteredSubmissions.length;
    let willAttendCount = 0;
    let willNotAttendCount = 0;
    let contractorsCount = 0;
    let suppliersCount = 0;
    let govOfficersCount = 0;

    const provinceMap: Record<string, number> = {};
    const gradeMap: Record<string, number> = {};

    filteredSubmissions.forEach((s) => {
      const q = s.questionnaireData || {};
      const willAttend = q.willParticipate === "Yes";
      const willNotAttend = q.willParticipate === "No";

      if (willAttend) willAttendCount++;
      else if (willNotAttend) willNotAttendCount++;

      const cat = q.participantCategory || s.category;
      if (cat === "Contractor") contractorsCount++;
      else if (cat === "Supplier") suppliersCount++;
      else if (cat === "Government Officer") govOfficersCount++;

      const prov = s.provincialOffice || q.supplierDetails?.province || "Unspecified";
      provinceMap[prov] = (provinceMap[prov] || 0) + 1;

      const g = q.cidaGrade || s.grade;
      if (g && g !== "Pending" && g !== "N/A") {
        gradeMap[g] = (gradeMap[g] || 0) + 1;
      }
    });

    return {
      total,
      willAttendCount,
      willAttendPct: total > 0 ? Math.round((willAttendCount / total) * 100) : 0,
      willNotAttendCount,
      willNotAttendPct: total > 0 ? Math.round((willNotAttendCount / total) * 100) : 0,
      contractorsCount,
      contractorsPct: total > 0 ? Math.round((contractorsCount / total) * 100) : 0,
      suppliersCount,
      suppliersPct: total > 0 ? Math.round((suppliersCount / total) * 100) : 0,
      govOfficersCount,
      govOfficersPct: total > 0 ? Math.round((govOfficersCount / total) * 100) : 0,
      provinceMap,
      gradeMap,
    };
  }, [filteredSubmissions]);

  // CSV Report Generator with UTF-8 BOM
  const handleExportCSV = (overrideAttendance?: string, reportTitleOverride?: string) => {
    try {
      setIsExporting(true);

      const dataset = overrideAttendance
        ? filteredSubmissions.filter((s) => s.questionnaireData?.willParticipate === overrideAttendance)
        : filteredSubmissions;

      if (!dataset || dataset.length === 0) {
        alert("No records match the current filter criteria to export.");
        return;
      }

      const headers = [
        "Reference Number",
        "Organization / Firm Name",
        "Category",
        "Workshop Attendance (07 Dec 2026)",
        "Filing Status",
        "Created Date",
        "Submission Date",
        "Official Contact Number",
        "Official Email Address",
        "Participant 1: Full Name",
        "Participant 1: Designation",
        "Participant 1: Mobile",
        "Participant 1: Email",
        "Participant 2: Full Name",
        "Participant 2: Designation",
        "Participant 2: Mobile",
        "Participant 2: Email",
        "ICTAD / CIDA Registration No",
        "CIDA Grade",
        "Specialty",
        "Provincial Office",
        "District",
        "Supplier: Company Name",
        "Supplier: Materials",
        "Total Outstanding Works Value (LKR Million)",
        "Has Ongoing Contracts",
        "General Construction Experience",
        "Past RDA/ICDP Experience",
        "Peak Asphalt (SQM/12mo)",
        "Peak Concrete (Cum/12mo)",
        "Peak ABC (Cum/12mo)",
        "Forecasted Turnover 2027 (LKR Million)",
        "Historical Litigation",
        "Discussion Matters / Concerns",
      ];

      const rows = dataset.map((s) => {
        const q = s.questionnaireData || {};
        const isSubmitted = s.status === "Submitted" || s.status === "Under_Review" || s.status === "Verified";
        const subDate = isSubmitted
          ? formatDisplayDate(s.submittedAt || s.createdAt)
          : "Draft";

        return [
          s.ref,
          s.contractor,
          q.participantCategory || s.category || "General",
          q.willParticipate === "Yes" ? "Attending (Yes)" : q.willParticipate === "No" ? "Not Attending (No)" : "Unspecified",
          s.status,
          formatDisplayDate(s.createdAt),
          subDate,
          q.contactNumber || "",
          q.email || "",
          q.participant1?.fullName || "",
          q.participant1?.designation || "",
          q.participant1?.mobileNumber || "",
          q.participant1?.email || "",
          q.participant2?.fullName || "",
          q.participant2?.designation || "",
          q.participant2?.mobileNumber || "",
          q.participant2?.email || "",
          q.ictadRegistrationNumber || (s.regNo !== "N/A" ? s.regNo : ""),
          q.cidaGrade || (s.grade !== "Pending" ? s.grade : ""),
          q.specialty || "",
          s.provincialOffice || q.supplierDetails?.province || "",
          q.supplierDetails?.district || q.district || "",
          q.supplierDetails?.companyName || "",
          Array.isArray(q.supplierDetails?.materialsSupplied)
            ? q.supplierDetails.materialsSupplied.join("; ")
            : "",
          q.totalOutstandingValueLkrMillion ?? "",
          q.hasOngoingContracts || "",
          q.generalExperience || "",
          q.hasRdaOrIcdpExperience || "",
          q.peakProductionRates?.asphaltConcrete ?? "",
          q.peakProductionRates?.concrete ?? "",
          q.peakProductionRates?.abc ?? "",
          q.forecastedCapacity2027 ?? "",
          q.historicalLitigationType || "None",
          q.mattersForDiscussion || "",
        ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`);
      });

      const csvContent =
        "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      let filename = `RDA_Analytical_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      if (overrideAttendance === "Yes" || attendance === "Yes") {
        filename = `RDA_Workshop_Attendees_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (overrideAttendance === "No" || attendance === "No") {
        filename = `RDA_Workshop_Non_Attendees_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (reportTitleOverride) {
        filename = `${reportTitleOverride}_${new Date().toISOString().slice(0, 10)}.csv`;
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert("Failed to export report: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 print:p-0 print:space-y-3">
      {/* Official Print Header (Only visible on print/PDF generation) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              Road Development Authority &bull; Sri Lanka
            </h1>
            <h2 className="text-xs font-bold text-slate-700">
              Contractor Data Collection System &bull; Chief Engineer Office
            </h2>
            <p className="text-[10px] text-slate-500">
              Official Analytical Insights &amp; Stakeholder Intelligence Report
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-600">
            <div>Generated: {new Date().toLocaleString("en-GB")}</div>
            <div>Reference: RDA-ICDP-ANALYTICS-2026</div>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-300 text-[10px] flex items-center justify-between text-slate-600">
          <span>Attendance: <strong>{attendance}</strong></span>
          <span>Category: <strong>{category}</strong></span>
          <span>Province: <strong>{province}</strong></span>
          <span>Matching Records: <strong>{analytics.total}</strong></span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Reports &amp; Analytical Insights
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official RDA intelligence reporting on contractor availability, workshop participation, infrastructure capabilities, and regional resource distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleExportCSV()}
            disabled={isExporting || filteredSubmissions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export Report (Excel/CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* High-Level Analytical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Filings */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3 text-blue-900" />
            Matching Filings
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {analytics.total}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Filtered</span>
          </div>
        </div>

        {/* Will Participate */}
        <div
          onClick={() => setAttendance(attendance === "Yes" ? "All Attendance" : "Yes")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            attendance === "Yes"
              ? "bg-emerald-100/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-emerald-50/60 border-emerald-200 hover:border-emerald-400"
          }`}
          title="Click to toggle attendee filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              Will Attend
            </span>
            <span className="text-[10px] font-extrabold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
              {analytics.willAttendPct}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-900 font-mono">
              {analytics.willAttendCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">Confirmed</span>
          </div>
        </div>

        {/* Won't Participate */}
        <div
          onClick={() => setAttendance(attendance === "No" ? "All Attendance" : "No")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            attendance === "No"
              ? "bg-amber-100/70 border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-amber-50/60 border-amber-200 hover:border-amber-400"
          }`}
          title="Click to toggle non-attendee filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
              <UserX className="w-3.5 h-3.5 text-amber-700" />
              Won&apos;t Attend
            </span>
            <span className="text-[10px] font-extrabold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded">
              {analytics.willNotAttendPct}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-amber-900 font-mono">
              {analytics.willNotAttendCount}
            </span>
            <span className="text-[10px] text-amber-700 font-bold">Profiles Only</span>
          </div>
        </div>

        {/* Contractors */}
        <div
          onClick={() => setCategory(category === "Contractor" ? "All Categories" : "Contractor")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            category === "Contractor"
              ? "bg-blue-100/70 border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-blue-300"
          }`}
          title="Click to toggle contractors filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-blue-900" />
              Contractors
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {analytics.contractorsPct}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-blue-950 font-mono">
              {analytics.contractorsCount}
            </span>
            <span className="text-[10px] text-slate-400">Civil Works</span>
          </div>
        </div>

        {/* Suppliers */}
        <div
          onClick={() => setCategory(category === "Supplier" ? "All Categories" : "Supplier")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            category === "Supplier"
              ? "bg-purple-100/70 border-purple-500 shadow-md ring-2 ring-purple-500/20"
              : "bg-white border-slate-200 hover:border-purple-300"
          }`}
          title="Click to toggle suppliers filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-purple-700" />
              Suppliers
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {analytics.suppliersPct}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-purple-950 font-mono">
              {analytics.suppliersCount}
            </span>
            <span className="text-[10px] text-slate-400">Materials</span>
          </div>
        </div>

        {/* Public Officers */}
        <div
          onClick={() => setCategory(category === "Government Officer" ? "All Categories" : "Government Officer")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            category === "Government Officer"
              ? "bg-emerald-100/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-emerald-300"
          }`}
          title="Click to toggle public officers filter"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-emerald-700" />
              Officers
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              {analytics.govOfficersPct}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono">
              {analytics.govOfficersCount}
            </span>
            <span className="text-[10px] text-slate-400">Institutional</span>
          </div>
        </div>
      </div>

      {/* Visual Progress Split Bars (Attendance & Categories) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        {/* Attendance Visual Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Workshop Participation Distribution (07 Dec 2026)
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {analytics.willAttendCount} Attending / {analytics.willNotAttendCount} Non-Attendees
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              style={{ width: `${analytics.willAttendPct}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Will Attend: ${analytics.willAttendCount} (${analytics.willAttendPct}%)`}
            />
            <div
              style={{ width: `${analytics.willNotAttendPct}%` }}
              className="bg-amber-400 h-full transition-all"
              title={`Won't Attend: ${analytics.willNotAttendCount} (${analytics.willNotAttendPct}%)`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <strong>{analytics.willAttendPct}%</strong> Confirmed Attendance ({analytics.willAttendCount})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <strong>{analytics.willNotAttendPct}%</strong> Non-Attendance Profiles ({analytics.willNotAttendCount})
            </span>
          </div>
        </div>

        {/* Category Split Visual Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-800 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-blue-900" />
              Stakeholder Category Split
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {analytics.contractorsCount} Contractors / {analytics.suppliersCount} Suppliers
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              style={{ width: `${analytics.contractorsPct}%` }}
              className="bg-blue-900 h-full transition-all"
              title={`Contractors: ${analytics.contractorsCount} (${analytics.contractorsPct}%)`}
            />
            <div
              style={{ width: `${analytics.suppliersPct}%` }}
              className="bg-purple-600 h-full transition-all"
              title={`Suppliers: ${analytics.suppliersCount} (${analytics.suppliersPct}%)`}
            />
            <div
              style={{ width: `${analytics.govOfficersPct}%` }}
              className="bg-emerald-600 h-full transition-all"
              title={`Government Officers: ${analytics.govOfficersCount} (${analytics.govOfficersPct}%)`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-900 inline-block" />
              Contractors ({analytics.contractorsPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
              Suppliers ({analytics.suppliersPct}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              Officers ({analytics.govOfficersPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Parameters Configuration Container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        {/* Top Header of Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">
              Report Parameter Configuration
            </h3>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200">
              {analytics.total} of {submissions.length} Records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                showAdvancedFilters || activeAdvancedFilterCount > 0
                  ? "bg-blue-900 text-white border-blue-900 shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter by Any Field</span>
              {activeAdvancedFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {activeAdvancedFilterCount}
                </span>
              )}
              {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-900 transition-colors p-1.5 cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Primary Row: Attendance, Category, Province, CIDA Grade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Workshop Attendance Filter */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Workshop Participation (07 Dec)
            </label>
            <select
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 cursor-pointer ${
                attendance === "Yes"
                  ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 font-bold focus:ring-emerald-500"
                  : attendance === "No"
                  ? "bg-amber-50/70 border-amber-400 text-amber-950 font-bold focus:ring-amber-500"
                  : "bg-slate-50 border-slate-300 text-slate-800 focus:ring-blue-900"
              }`}
            >
              {ATTENDANCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Participant Category */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Participant Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Target Directorate / Province */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Target Directorate (Province)
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* CIDA Classification */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              CIDA Classification (Grade)
            </label>
            <select
              value={cidaGrade}
              onChange={(e) => setCidaGrade(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              {CIDA_GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter & Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Reporting Period Quick Preset */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              <span>Reporting Date Preset</span>
            </label>
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            >
              <option value="all">All Available Records</option>
              <option value="today">Today Only</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="thisMonth">This Calendar Month</option>
            </select>
          </div>

          {/* Start Date Picker */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            />
          </div>

          {/* End Date Picker */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
            />
          </div>

          {/* Universal Multi-Field Search */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-900" />
              <span>Global Keyword Search</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, Ref, Email, Phone, Project..."
                className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 placeholder:text-slate-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* EXPANDABLE MULTI-FIELD ADVANCED FILTER PANEL */}
        {showAdvancedFilters && (
          <div className="pt-4 border-t-2 border-dashed border-blue-200/80 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" />
                <span>Filter by Specific Questionnaire Fields</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Combine any parameters below to refine your report
              </span>
            </div>

            {/* Row 1: District, Specialty, Experience, Preferable District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Operating District */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-900" />
                  <span>Operating District</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area of Specialty */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <HardHat className="w-3 h-3 text-blue-900" />
                  <span>Area of Specialty</span>
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* General Construction Experience */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-900" />
                  <span>General Experience</span>
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preferable Operating District */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  <span>Preferred District (Interests)</span>
                </label>
                <select
                  value={preferableDistrict}
                  onChange={(e) => setPreferableDistrict(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  <option value="All Preferred Districts">All Preferred Districts</option>
                  {DISTRICTS.filter((d) => d !== "All Districts").map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Outstanding Value, Ongoing Contracts, RDA Experience, Litigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Outstanding Works Value */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Outstanding Works Value (LKR)
                </label>
                <select
                  value={outstandingValue}
                  onChange={(e) => setOutstandingValue(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  {OUTSTANDING_VALUE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ongoing Contracts Choice */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Has Ongoing Contracts
                </label>
                <select
                  value={ongoingContracts}
                  onChange={(e) => setOngoingContracts(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  <option value="all">All (Both Yes &amp; No)</option>
                  <option value="yes">Has Active Contracts (Yes)</option>
                  <option value="no">No Active Contracts (No)</option>
                </select>
              </div>

              {/* Past RDA / ICDP Experience */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Past RDA / ICDP Experience
                </label>
                <select
                  value={rdaExp}
                  onChange={(e) => setRdaExp(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  <option value="all">All (Both Yes &amp; No)</option>
                  <option value="yes">Has RDA Experience (Yes)</option>
                  <option value="no">No RDA Experience (No)</option>
                </select>
              </div>

              {/* Historical Litigation */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Scale className="w-3 h-3 text-rose-700" />
                  <span>Litigation &amp; Disputes</span>
                </label>
                <select
                  value={litigation}
                  onChange={(e) => setLitigation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  {LITIGATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Machinery Plants & Supplier Materials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Asphalt Plant */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Factory className="w-3 h-3 text-blue-900" />
                  <span>Asphalt Concrete Plant</span>
                </label>
                <select
                  value={hasAsphaltPlant}
                  onChange={(e) => setHasAsphaltPlant(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  <option value="all">Any Status</option>
                  <option value="yes">Has Asphalt Production (&gt; 0)</option>
                  <option value="no">No Asphalt Plant</option>
                </select>
              </div>

              {/* Ready-Mix Concrete Plant */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Factory className="w-3 h-3 text-blue-900" />
                  <span>Ready-Mix Concrete Plant</span>
                </label>
                <select
                  value={hasConcretePlant}
                  onChange={(e) => setHasConcretePlant(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  <option value="all">Any Status</option>
                  <option value="yes">Has Concrete Production (&gt; 0)</option>
                  <option value="no">No Concrete Plant</option>
                </select>
              </div>

              {/* Aggregate Base Course (ABC) Plant */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Factory className="w-3 h-3 text-blue-900" />
                  <span>ABC Base Course Plant</span>
                </label>
                <select
                  value={hasAbcPlant}
                  onChange={(e) => setHasAbcPlant(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  <option value="all">Any Status</option>
                  <option value="yes">Has ABC Production (&gt; 0)</option>
                  <option value="no">No ABC Plant</option>
                </select>
              </div>

              {/* Supplier Materials Supplied */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-purple-700" />
                  <span>Supplier Materials</span>
                </label>
                <select
                  value={supplierMaterial}
                  onChange={(e) => setSupplierMaterial(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
                >
                  {SUPPLIER_MATERIALS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DYNAMIC CUSTOM QUERY RULE BUILDER */}
            <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-900" />
                  <span>Custom Dynamic Field Queries ({customRules.length})</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddCustomRule}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Field Filter</span>
                </button>
              </div>

              {customRules.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">
                  Need to filter by a specific text field or property not listed above? Click &ldquo;Add Custom Field Filter&rdquo; to build custom query rules.
                </p>
              ) : (
                <div className="space-y-2">
                  {customRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="w-full sm:w-1/3">
                        <select
                          value={rule.field}
                          onChange={(e) => handleUpdateCustomRule(rule.id, { field: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                        >
                          {CUSTOM_FILTER_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-1/4">
                        <select
                          value={rule.operator}
                          onChange={(e) => handleUpdateCustomRule(rule.id, { operator: e.target.value as any })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                        >
                          <option value="contains">Contains</option>
                          <option value="not_contains">Does not contain</option>
                          <option value="equals">Equals exactly</option>
                          <option value="is_not_empty">Is not empty</option>
                          <option value="is_empty">Is empty</option>
                        </select>
                      </div>

                      {rule.operator !== "is_not_empty" && rule.operator !== "is_empty" && (
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => handleUpdateCustomRule(rule.id, { value: e.target.value })}
                            placeholder="Type filter value..."
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-medium placeholder:text-slate-400"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveCustomRule(rule.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete this rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ACTIVE FILTER PILLS / BADGES */}
        {(attendance !== "All Attendance" ||
          category !== "All Categories" ||
          province !== "All 9 Provinces (National Level)" ||
          cidaGrade !== "All Grades (CS1 to Specialist)" ||
          district !== "All Districts" ||
          specialty !== "All Specialties" ||
          experience !== "All Experience Levels" ||
          rdaExp !== "all" ||
          ongoingContracts !== "all" ||
          outstandingValue !== "all" ||
          hasAsphaltPlant !== "all" ||
          hasConcretePlant !== "all" ||
          hasAbcPlant !== "all" ||
          supplierMaterial !== "All Materials" ||
          litigation !== "All Legal Records" ||
          preferableDistrict !== "All Preferred Districts" ||
          search.trim() !== "" ||
          customRules.length > 0) && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Active:</span>

            {attendance !== "All Attendance" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold">
                Attendance: {attendance === "Yes" ? "Will Attend" : "Non-Attendee"}
                <button type="button" onClick={() => setAttendance("All Attendance")} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            )}

            {category !== "All Categories" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold">
                Category: {category}
                <button type="button" onClick={() => setCategory("All Categories")} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            )}

            {province !== "All 9 Provinces (National Level)" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold">
                Province: {province}
                <button type="button" onClick={() => setProvince("All 9 Provinces (National Level)")} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            )}

            {district !== "All Districts" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold">
                District: {district}
                <button type="button" onClick={() => setDistrict("All Districts")} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            )}

            {cidaGrade !== "All Grades (CS1 to Specialist)" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold">
                Grade: {cidaGrade}
                <button type="button" onClick={() => setCidaGrade("All Grades (CS1 to Specialist)")} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            )}

            {specialty !== "All Specialties" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[11px] font-bold">
                Specialty: {specialty}
                <button type="button" onClick={() => setSpecialty("All Specialties")} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            )}

            {search.trim() !== "" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold">
                Search: &ldquo;{search}&rdquo;
                <button type="button" onClick={() => setSearch("")} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            )}

            {customRules.map((rule) => (
              <span key={rule.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold">
                {rule.field} {rule.operator} {rule.value}
                <button type="button" onClick={() => handleRemoveCustomRule(rule.id)} className="hover:text-rose-600 ml-0.5">✕</button>
              </span>
            ))}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-rose-600 hover:underline ml-auto cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Pre-Configured Quick Report Action Cards (REP-01 to REP-04) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        {/* REP-01: Confirmed Attendees Report */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-5 rounded-2xl border-2 border-emerald-300 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase">
                REP-01 &bull; Workshop Attendees
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                {analytics.willAttendCount} Confirmed Attendees
              </span>
            </div>
            <h4 className="text-base font-extrabold text-slate-900">
              Workshop Confirmed Attendees Report
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official roster of all organizations attending the workshop on <strong>07 December 2026</strong>. Includes nominated representative officer names, designations, direct mobile numbers, and emails for registration accreditation.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAttendance("Yes");
                window.scrollTo({ top: 600, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-all cursor-pointer"
            >
              <span>Filter Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV("Yes", "RDA_Workshop_Confirmed_Attendees")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Attendees (CSV)</span>
            </button>
          </div>
        </div>

        {/* REP-02: Non-Attendees Profile Directory */}
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-slate-50 p-5 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col justify-between hover:border-amber-500 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase">
                REP-02 &bull; Non-Attendees
              </span>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                {analytics.willNotAttendCount} Non-Attendance Filings
              </span>
            </div>
            <h4 className="text-base font-extrabold text-slate-900">
              Non-Attendees Organizational Directory
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Entities that declared non-attendance for the workshop on <strong>07 December 2026</strong>. Captures baseline organizational profiles, official company emails, and primary contacts recorded for RDA contractor archives.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAttendance("No");
                window.scrollTo({ top: 600, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all cursor-pointer"
            >
              <span>Filter Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV("No", "RDA_Workshop_Non_Attendees_Directory")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Directory (CSV)</span>
            </button>
          </div>
        </div>

        {/* REP-03: Date-Filtered Submissions Report */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                REP-03 &bull; Date Range Audit
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {startDate && endDate ? `${startDate} to ${endDate}` : "All Recorded Dates"}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Date-Filtered Submissions Activity Report
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chronological log of submissions received within the configured date range. Tracks registration turnaround, filing timestamps, and verification status across provincial offices.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">
              Matches active date filters ({analytics.total} records)
            </span>
            <button
              type="button"
              onClick={() => handleExportCSV(undefined, `RDA_Date_Activity_Report_${startDate || "All"}_${endDate || "All"}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Date Log (CSV)</span>
            </button>
          </div>
        </div>

        {/* REP-04: Full Master Contractor & Capacity Matrix */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                REP-04 &bull; Master Matrix
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Comprehensive 50+ Fields
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Provincial Contractor Capacity &amp; Grade Matrix
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full questionnaire dataset containing CIDA classifications, 5-year financial statements, peak production rates (Asphalt, Concrete, ABC), machinery availability, and ongoing road commitments.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">
              National dataset &bull; All 9 Provinces
            </span>
            <button
              type="button"
              onClick={() => handleExportCSV(undefined, "RDA_Master_Contractor_Capacity_Matrix")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Dataset (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Data Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-900" />
              <span>Filtered Records Preview</span>
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200">
                {analytics.total} of {submissions.length} Entities
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live matching records according to the selected parameters above.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => handleExportCSV()}
              disabled={isExporting || filteredSubmissions.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered CSV</span>
            </button>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-900 mx-auto" />
            <p className="text-xs font-semibold">Loading analytical report data from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 space-y-2">
            <p className="text-sm font-bold">Failed to load data: {error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="text-xs font-bold underline hover:text-rose-800 cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No submission records match the current filters.</p>
            <p className="text-xs text-slate-500">Try adjusting your date range, workshop participation, district, or custom query rules.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all mt-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          /* Submissions Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="p-3 pl-4">Reference No</th>
                  <th className="p-3">Organization / Firm</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Workshop Attendance</th>
                  <th className="p-3">CIDA Grade</th>
                  <th className="p-3">Primary Contact</th>
                  <th className="p-3">Province &amp; District</th>
                  <th className="p-3">Submission Date</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSubmissions.map((s) => {
                  const q = s.questionnaireData || {};
                  const willAttend = q.willParticipate === "Yes";
                  const willNotAttend = q.willParticipate === "No";
                  const contactPerson = q.participant1?.fullName || "Representative";
                  const contactPhone = q.participant1?.mobileNumber || q.contactNumber || "—";
                  const contactEmail = q.participant1?.email || q.email || "—";
                  const displayDistrict = q.district || q.supplierDetails?.district || "";

                  return (
                    <tr key={s.id || s.ref} className="hover:bg-slate-50/70 transition-colors">
                      {/* Ref */}
                      <td className="p-3 pl-4 font-mono font-bold text-blue-950 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{s.ref}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof navigator !== "undefined" && navigator.clipboard) {
                                navigator.clipboard.writeText(s.ref);
                                setCopiedRef(s.ref);
                                setTimeout(() => setCopiedRef(null), 2000);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-blue-900 rounded cursor-pointer"
                            title="Copy reference"
                          >
                            {copiedRef === s.ref ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Entity Name */}
                      <td className="p-3 font-bold text-slate-900">
                        <div className="max-w-[200px] truncate" title={s.contractor}>
                          {s.contractor}
                        </div>
                        {q.ictadRegistrationNumber && (
                          <div className="text-[10px] font-mono text-slate-500 font-normal">
                            ICTAD: {q.ictadRegistrationNumber}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                            q.participantCategory === "Contractor"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : q.participantCategory === "Supplier"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : q.participantCategory === "Government Officer"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {q.participantCategory || s.category || "General"}
                        </span>
                      </td>

                      {/* Attendance */}
                      <td className="p-3 whitespace-nowrap">
                        {willAttend ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Attending (Yes)</span>
                          </span>
                        ) : willNotAttend ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <XCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Non-Attendee (No)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* CIDA Grade */}
                      <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {q.cidaGrade || (s.grade !== "Pending" ? s.grade : "—")}
                      </td>

                      {/* Primary Contact */}
                      <td className="p-3">
                        <div className="text-slate-900 font-semibold">{contactPerson}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{contactPhone}</span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[120px]">{contactEmail}</span>
                        </div>
                      </td>

                      {/* Province & District */}
                      <td className="p-3 whitespace-nowrap text-slate-600">
                        <div>{s.provincialOffice || q.supplierDetails?.province || "—"}</div>
                        {displayDistrict && (
                          <div className="text-[10px] text-slate-400 font-medium">
                            District: {displayDistrict}
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3 whitespace-nowrap text-slate-600 font-medium">
                        {formatDisplayDate(s.submittedAt || s.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="p-3 pr-4 text-right whitespace-nowrap">
                        <Link
                          href={`/submissions?ref=${encodeURIComponent(s.ref)}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-900 hover:text-white bg-blue-50 hover:bg-blue-900 border border-blue-200 rounded-lg transition-all"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
