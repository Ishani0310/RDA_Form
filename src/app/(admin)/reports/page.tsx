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

export default function ReportsPage() {
  // Filter States
  const [attendance, setAttendance] = useState<string>("All Attendance");
  const [category, setCategory] = useState<string>("All Categories");
  const [province, setProvince] = useState<string>("All 9 Provinces (National Level)");
  const [cidaGrade, setCidaGrade] = useState<string>("All Grades (CS1 to Specialist)");
  const [status, setStatus] = useState<string>("All Statuses");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");

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

  // Fetch Submissions Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: "1",
        limit: "5000", // Fetch up to 5000 for comprehensive analytics
      });

      if (attendance !== "All Attendance") params.append("attendance", attendance);
      if (category !== "All Categories") params.append("category", category);
      if (province !== "All 9 Provinces (National Level)") params.append("province", province);
      if (cidaGrade !== "All Grades (CS1 to Specialist)") params.append("cidaGrade", cidaGrade);
      if (status !== "All Statuses") params.append("status", status);
      if (search.trim()) params.append("search", search.trim());
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
  }, [attendance, category, province, cidaGrade, status, search, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset all filters
  const handleResetFilters = () => {
    setAttendance("All Attendance");
    setCategory("All Categories");
    setProvince("All 9 Provinces (National Level)");
    setCidaGrade("All Grades (CS1 to Specialist)");
    setStatus("All Statuses");
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setSearch("");
  };

  // Analytical Metrics Computations
  const analytics = useMemo(() => {
    const total = submissions.length;
    let willAttendCount = 0;
    let willNotAttendCount = 0;
    let contractorsCount = 0;
    let suppliersCount = 0;
    let govOfficersCount = 0;

    const provinceMap: Record<string, number> = {};
    const gradeMap: Record<string, number> = {};

    submissions.forEach((s) => {
      const q = s.questionnaireData || {};
      const willAttend = q.willParticipate === "Yes";
      const willNotAttend = q.willParticipate === "No";

      if (willAttend) willAttendCount++;
      else if (willNotAttend) willNotAttendCount++;

      const cat = q.participantCategory || s.category;
      if (cat === "Contractor") contractorsCount++;
      else if (cat === "Supplier") suppliersCount++;
      else if (cat === "Government Officer") govOfficersCount++;

      // Province stats
      const prov = s.provincialOffice || q.supplierDetails?.province || "Unspecified";
      provinceMap[prov] = (provinceMap[prov] || 0) + 1;

      // Grade stats
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
  }, [submissions]);

  // CSV Report Generator
  const handleExportCSV = (overrideAttendance?: string, reportTitleOverride?: string) => {
    try {
      setIsExporting(true);

      const dataset = overrideAttendance
        ? submissions.filter((s) => s.questionnaireData?.willParticipate === overrideAttendance)
        : submissions;

      if (!dataset || dataset.length === 0) {
        alert("No records match the selected export criteria.");
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
          ? s.submittedAt
            ? new Date(s.submittedAt).toLocaleDateString("en-GB")
            : s.createdAt
            ? new Date(s.createdAt).toLocaleDateString("en-GB")
            : "Submitted"
          : "Draft";

        return [
          s.ref,
          s.contractor,
          q.participantCategory || s.category || "General",
          q.willParticipate === "Yes" ? "Attending (Yes)" : q.willParticipate === "No" ? "Not Attending (No)" : "Unspecified",
          s.status,
          s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "",
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
          q.supplierDetails?.district || "",
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

  // Print Official Report View
  const handlePrintReport = () => {
    window.print();
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
          <span>Attendance Filter: <strong>{attendance}</strong></span>
          <span>Category: <strong>{category}</strong></span>
          <span>Province: <strong>{province}</strong></span>
          <span>Total Records: <strong>{analytics.total}</strong></span>
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
            disabled={isExporting || submissions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 disabled:opacity-50 rounded-xl shadow-sm transition-all"
          >
            {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export Report (Excel/CSV)</span>
          </button>
          <button
            type="button"
            onClick={handlePrintReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-sm transition-all"
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
            Total Filings
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              {analytics.total}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Matching</span>
          </div>
        </div>

        {/* Will Participate */}
        <div
          onClick={() => setAttendance("Yes")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            attendance === "Yes"
              ? "bg-emerald-100/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-emerald-50/60 border-emerald-200 hover:border-emerald-400"
          }`}
          title="Click to filter by attendees"
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
          onClick={() => setAttendance("No")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            attendance === "No"
              ? "bg-amber-100/70 border-amber-500 shadow-md ring-2 ring-amber-500/20"
              : "bg-amber-50/60 border-amber-200 hover:border-amber-400"
          }`}
          title="Click to filter by non-attendees"
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
          onClick={() => setCategory("Contractor")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            category === "Contractor"
              ? "bg-blue-100/70 border-blue-500 shadow-md ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:border-blue-300"
          }`}
          title="Click to filter contractors"
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
          onClick={() => setCategory("Supplier")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            category === "Supplier"
              ? "bg-purple-100/70 border-purple-500 shadow-md ring-2 ring-purple-500/20"
              : "bg-white border-slate-200 hover:border-purple-300"
          }`}
          title="Click to filter suppliers"
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
          onClick={() => setCategory("Government Officer")}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
            category === "Government Officer"
              ? "bg-emerald-100/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:border-emerald-300"
          }`}
          title="Click to filter public officers"
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

      {/* Report Parameter Configuration (Interactive Filters) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-900" />
            <span>Report Parameter Configuration &amp; Filters</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-900 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-bold text-blue-900">
              {analytics.total} Records Found
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Workshop Attendance Filter */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Workshop Participation (07 Dec)
            </label>
            <select
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 ${
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1 border-t border-slate-100 text-xs">
          {/* Reporting Period Quick Preset */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              <span>Reporting Date Preset</span>
            </label>
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
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
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Search by Text Keyword */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-900" />
              <span>Search Entity / Ref</span>
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Ref, or Email..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-900 placeholder:text-slate-400"
            />
          </div>
        </div>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-all"
            >
              <span>Filter Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV("Yes", "RDA_Workshop_Confirmed_Attendees")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-all"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all"
            >
              <span>Filter Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV("No", "RDA_Workshop_Non_Attendees_Directory")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm transition-all"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
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
                {analytics.total} Entities
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
              className="p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => handleExportCSV()}
              disabled={isExporting || submissions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
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
              className="text-xs font-bold underline hover:text-rose-800"
            >
              Retry Loading
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No submission records match the current filters.</p>
            <p className="text-xs text-slate-500">Try adjusting your date range, workshop participation, or category filter.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all mt-2"
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
                  <th className="p-3">Province</th>
                  <th className="p-3">Submission Date</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((s) => {
                  const q = s.questionnaireData || {};
                  const willAttend = q.willParticipate === "Yes";
                  const willNotAttend = q.willParticipate === "No";
                  const isSubmitted = s.status === "Submitted" || s.status === "Under_Review" || s.status === "Verified";
                  const contactPerson = q.participant1?.fullName || "Representative";
                  const contactPhone = q.participant1?.mobileNumber || q.contactNumber || "—";
                  const contactEmail = q.participant1?.email || q.email || "—";

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
                            className="p-1 text-slate-400 hover:text-blue-900 rounded"
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

                      {/* Province */}
                      <td className="p-3 whitespace-nowrap text-slate-600">
                        {s.provincialOffice || q.supplierDetails?.province || "—"}
                      </td>

                      {/* Date */}
                      <td className="p-3 whitespace-nowrap text-slate-600">
                        {s.submittedAt
                          ? new Date(s.submittedAt).toLocaleDateString("en-GB")
                          : s.createdAt
                          ? new Date(s.createdAt).toLocaleDateString("en-GB")
                          : "—"}
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
