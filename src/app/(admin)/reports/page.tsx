"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  UserCheck,
  UserX,
  Building2,
  Truck,
  Landmark,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  TrendingUp,
  Users,
  ShieldCheck,
  PieChart,
  HardHat,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  ref: string;
  contractor: string;
  regNo: string;
  grade: string;
  submissionType: string;
  provincialOffice: string;
  status: string;
  category?: string;
  formId?: string;
  formSlug?: string;
  questionnaireData?: any;
  createdAt?: string;
  submittedAt?: string | null;
}

function formatDisplayDate(val: any): string {
  if (!val) return "—";
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "—") return "—";
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

export default function ReportsHubPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions?page=1&limit=5000&status=submitted");
      if (!res.ok) throw new Error("Failed to load records");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSubmissions(json.data);
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Clean official submissions (exclude test/draft records)
  const cleanSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (s.ref?.startsWith("DFT-") || s.status === "Draft") return false;
      const q = s.questionnaireData || {};
      const orgName = (s.contractor || q.organizationName || "").toLowerCase();
      if (orgName.includes("testing") || orgName.includes("dummy")) return false;
      // Only exclude submissions from the new standalone supplier form (RDA-SUPPLIER-Q)
      if (s.formId === "RDA-SUPPLIER-Q") return false;
      return true;
    });
  }, [submissions]);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = cleanSubmissions.length;
    let participatingCount = 0;
    let notParticipatingCount = 0;

    let totalContractors = 0;
    let partContractors = 0;
    let notPartContractors = 0;

    let totalSuppliers = 0;
    let partSuppliers = 0;
    let notPartSuppliers = 0;

    let totalOfficers = 0;
    let partOfficers = 0;
    let notPartOfficers = 0;

    cleanSubmissions.forEach((s) => {
      const q = s.questionnaireData || {};
      const cat = (q.participantCategory || s.category || "").toLowerCase();
      const isPart = q.willParticipate === "Yes";
      const isNotPart = q.willParticipate === "No";

      if (isPart) participatingCount++;
      if (isNotPart) notParticipatingCount++;

      if (cat.includes("contractor")) {
        totalContractors++;
        if (isPart) partContractors++;
        if (isNotPart) notPartContractors++;
      } else if (cat.includes("supplier")) {
        totalSuppliers++;
        if (isPart) partSuppliers++;
        if (isNotPart) notPartSuppliers++;
      } else if (cat.includes("officer") || cat.includes("gov")) {
        totalOfficers++;
        if (isPart) partOfficers++;
        if (isNotPart) notPartOfficers++;
      }
    });

    const partPct = total > 0 ? Math.round((participatingCount / total) * 100) : 0;
    const notPartPct = total > 0 ? Math.round((notParticipatingCount / total) * 100) : 0;

    return {
      total,
      participatingCount,
      notParticipatingCount,
      partPct,
      notPartPct,
      totalContractors,
      partContractors,
      notPartContractors,
      totalSuppliers,
      partSuppliers,
      notPartSuppliers,
      totalOfficers,
      partOfficers,
      notPartOfficers,
    };
  }, [cleanSubmissions]);

  // Download Entire Analytics Dataset as Excel (.csv with UTF-8 BOM)
  const handleDownloadExcel = () => {
    if (cleanSubmissions.length === 0) {
      alert("No official records available to export.");
      return;
    }

    const headers = [
      "Reference Number",
      "Organization / Firm Name",
      "Category",
      "Workshop Attendance",
      "CIDA Classification / Grade",
      "Contact Person",
      "Contact Phone",
      "Official Email",
      "District",
      "Province",
      "Submission Date",
      "Status",
    ];

    const rows = cleanSubmissions.map((s) => {
      const q = s.questionnaireData || {};
      const org = s.contractor || q.organizationName || q.supplierDetails?.companyName || "—";
      const cat = q.participantCategory || s.category || "General";
      const attend =
        q.willParticipate === "Yes"
          ? "Participating (Yes)"
          : q.willParticipate === "No"
          ? "Not Participating (No)"
          : "Unspecified";
      const grade = q.cidaGrade || s.grade || "—";
      const contactPerson =
        q.participant1?.name ||
        q.representativeName ||
        q.supplierDetails?.repName ||
        q.officerDetails?.officerName ||
        "—";
      const phone =
        q.contactNumber ||
        q.participant1?.mobile ||
        q.supplierDetails?.phone ||
        q.officerDetails?.contactNumber ||
        "—";
      const email =
        q.email ||
        q.participant1?.email ||
        q.supplierDetails?.email ||
        q.officerDetails?.officialEmail ||
        "—";
      const district = q.district || q.operatingDistrict || "—";
      const province = s.provincialOffice || q.province || "—";
      const date = formatDisplayDate(s.submittedAt || s.createdAt);

      return [
        s.ref || "",
        org,
        cat,
        attend,
        grade,
        contactPerson,
        phone,
        email,
        district,
        province,
        date,
        s.status || "Submitted",
      ].map((val) => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RDA_Master_Submissions_Report_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print:block mb-6 p-4 border-b-2 border-slate-900">
        <h1 className="text-xl font-bold uppercase text-slate-900">
          Democratic Socialist Republic of Sri Lanka
        </h1>
        <h2 className="text-lg font-bold text-blue-900">Road Development Authority (RDA)</h2>
        <p className="text-xs text-slate-600">
          ICDP Capacity Building Workshop &bull; Master Intelligence &amp; Analytics Summary
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Analytics &amp; Reports
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select a category below to explore details, contact information, and download reports as Excel or PDF.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              Refresh
            </button>

            {/* Download as Excel */}
            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download as Excel
            </button>

            {/* Download as PDF */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Download as PDF
            </button>
          </div>
        </div>

        {/* Unified RDA Brand Colors: Participating and Not Participating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. PARTICIPATING CARD */}
          <div className="bg-white p-7 rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  {metrics.partPct}% Attending
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                Participating
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Entities and representatives who confirmed they will attend the ICDP workshop.
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {metrics.participatingCount}
                </span>
                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                  Confirmed Attendees
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <Link
                href="/reports/participating"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <span>View Participating Directory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Sub-Category Selection */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-around text-xs font-medium text-slate-600">
                <Link
                  href="/reports/participating/contractors"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                >
                  Contractors ({metrics.partContractors})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/participating/suppliers"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                >
                  Suppliers ({metrics.partSuppliers})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/participating/officers"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                >
                  Officers ({metrics.partOfficers})
                </Link>
              </div>
            </div>
          </div>

          {/* 2. NOT PARTICIPATING CARD */}
          <div className="bg-white p-7 rounded-2xl border-2 border-slate-200 hover:border-slate-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-sm">
                  <UserX className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {metrics.notPartPct}% Declined
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-4 group-hover:text-slate-700 transition-colors">
                Not Participating
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Entities unable to attend the workshop in person (Profile &amp; capacities recorded).
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {metrics.notParticipatingCount}
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Non-Attendees
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
              <Link
                href="/reports/not-participating"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <span>View Not Participating Directory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Sub-Category Selection */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-around text-xs font-medium text-slate-600">
                <Link
                  href="/reports/not-participating/contractors"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                >
                  Contractors ({metrics.notPartContractors})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/not-participating/suppliers"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                >
                  Suppliers ({metrics.notPartSuppliers})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/not-participating/officers"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                >
                  Officers ({metrics.notPartOfficers})
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Split Bars (Unified RDA Theme) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-900" />
            Participation &amp; Stakeholder Breakdown Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workshop Attendance Distribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Workshop Participation
                </span>
                <span className="text-slate-500 font-mono">
                  {metrics.participatingCount} Attending ({metrics.partPct}%) &bull;{" "}
                  {metrics.notParticipatingCount} Not Attending ({metrics.notPartPct}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${metrics.partPct}%` }}
                  className="bg-blue-600 h-full transition-all"
                  title={`Participating: ${metrics.participatingCount} (${metrics.partPct}%)`}
                />
                <div
                  style={{ width: `${metrics.notPartPct}%` }}
                  className="bg-slate-300 h-full transition-all"
                  title={`Not Participating: ${metrics.notParticipatingCount} (${metrics.notPartPct}%)`}
                />
              </div>
            </div>

            {/* Stakeholder Category Distribution */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-900" />
                  Category Composition
                </span>
                <span className="text-slate-500 font-mono">
                  {metrics.totalContractors} Contractors &bull; {metrics.totalSuppliers} Suppliers &bull;{" "}
                  {metrics.totalOfficers} Officers
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      metrics.total > 0
                        ? Math.round((metrics.totalContractors / metrics.total) * 100)
                        : 0
                    }%`,
                  }}
                  className="bg-blue-600 h-full transition-all"
                  title={`Contractors: ${metrics.totalContractors}`}
                />
                <div
                  style={{
                    width: `${
                      metrics.total > 0
                        ? Math.round((metrics.totalSuppliers / metrics.total) * 100)
                        : 0
                    }%`,
                  }}
                  className="bg-blue-400 h-full transition-all"
                  title={`Suppliers: ${metrics.totalSuppliers}`}
                />
                <div
                  style={{
                    width: `${
                      metrics.total > 0
                        ? Math.round((metrics.totalOfficers / metrics.total) * 100)
                        : 0
                    }%`,
                  }}
                  className="bg-slate-400 h-full transition-all"
                  title={`Officers: ${metrics.totalOfficers}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
