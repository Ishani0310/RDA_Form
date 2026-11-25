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
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download as Excel
            </button>

            {/* Download as PDF */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Download as PDF
            </button>
          </div>
        </div>

        {/* ONLY Participating and Not Participating Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. PARTICIPATING CARD */}
          <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-8 rounded-3xl border-2 border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <UserCheck className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3.5 py-1.5 rounded-full border border-emerald-200">
                  {metrics.partPct}% Attending
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mt-5 group-hover:text-emerald-700 transition-colors">
                Participating
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Entities and representatives who confirmed they will attend the ICDP workshop.
              </p>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-5xl font-black text-emerald-950 font-mono tracking-tight">
                  {metrics.participatingCount}
                </span>
                <span className="text-xs text-emerald-700 font-extrabold uppercase tracking-wider">
                  Confirmed Attendees
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-100 space-y-4">
              <Link
                href="/reports/participating"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                <span>View Participating Directory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Sub-Category Selection */}
              <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 flex items-center justify-around text-xs font-medium text-slate-600">
                <Link
                  href="/reports/participating/contractors"
                  className="text-blue-700 hover:underline font-bold"
                >
                  Contractors ({metrics.partContractors})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/participating/suppliers"
                  className="text-purple-700 hover:underline font-bold"
                >
                  Suppliers ({metrics.partSuppliers})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/participating/officers"
                  className="text-emerald-700 hover:underline font-bold"
                >
                  Officers ({metrics.partOfficers})
                </Link>
              </div>
            </div>
          </div>

          {/* 2. NOT PARTICIPATING CARD */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-8 rounded-3xl border-2 border-amber-200 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                  <UserX className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3.5 py-1.5 rounded-full border border-amber-200">
                  {metrics.notPartPct}% Declined
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mt-5 group-hover:text-amber-700 transition-colors">
                Not Participating
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Entities unable to attend the workshop in person (Profile &amp; capacities recorded).
              </p>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="text-5xl font-black text-amber-950 font-mono tracking-tight">
                  {metrics.notParticipatingCount}
                </span>
                <span className="text-xs text-amber-700 font-extrabold uppercase tracking-wider">
                  Non-Attendees
                </span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-amber-100 space-y-4">
              <Link
                href="/reports/not-participating"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md transition-all"
              >
                <span>View Not Participating Directory</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Sub-Category Selection */}
              <div className="bg-white/90 p-3 rounded-xl border border-amber-100 flex items-center justify-around text-xs font-medium text-slate-600">
                <Link
                  href="/reports/not-participating/contractors"
                  className="text-blue-700 hover:underline font-bold"
                >
                  Contractors ({metrics.notPartContractors})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/not-participating/suppliers"
                  className="text-purple-700 hover:underline font-bold"
                >
                  Suppliers ({metrics.notPartSuppliers})
                </Link>
                <span className="text-slate-300 font-bold">&bull;</span>
                <Link
                  href="/reports/not-participating/officers"
                  className="text-emerald-700 hover:underline font-bold"
                >
                  Officers ({metrics.notPartOfficers})
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Split Bars */}
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
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Workshop Participation
                </span>
                <span className="text-slate-500 font-mono">
                  {metrics.participatingCount} Attending ({metrics.partPct}%) &bull;{" "}
                  {metrics.notParticipatingCount} Not Attending ({metrics.notPartPct}%)
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex">
                <div
                  style={{ width: `${metrics.partPct}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Participating: ${metrics.participatingCount} (${metrics.partPct}%)`}
                />
                <div
                  style={{ width: `${metrics.notPartPct}%` }}
                  className="bg-amber-500 h-full transition-all"
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
              <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex">
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
                  className="bg-purple-600 h-full transition-all"
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
                  className="bg-teal-600 h-full transition-all"
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
