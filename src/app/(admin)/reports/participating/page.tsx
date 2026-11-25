"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Truck,
  Landmark,
  UserCheck,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface SubmissionItem {
  id: string;
  ref: string;
  contractor: string;
  category?: string;
  questionnaireData?: any;
  createdAt?: string;
  submittedAt?: string | null;
  status?: string;
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

export default function ParticipatingHubPage() {
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

  // Clean participating submissions
  const participatingSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (s.ref?.startsWith("DFT-") || s.status === "Draft") return false;
      const q = s.questionnaireData || {};
      const orgName = (s.contractor || q.organizationName || "").toLowerCase();
      if (orgName.includes("testing") || orgName.includes("dummy")) return false;
      return q.willParticipate === "Yes";
    });
  }, [submissions]);

  // Counts by category
  const counts = useMemo(() => {
    let contractors = 0;
    let suppliers = 0;
    let officers = 0;

    participatingSubmissions.forEach((s) => {
      const q = s.questionnaireData || {};
      const cat = (q.participantCategory || s.category || "").toLowerCase();

      if (cat.includes("contractor")) contractors++;
      else if (cat.includes("supplier")) suppliers++;
      else if (cat.includes("officer") || cat.includes("gov")) officers++;
    });

    return {
      total: participatingSubmissions.length,
      contractors,
      suppliers,
      officers,
    };
  }, [participatingSubmissions]);

  // Download All Participating as Excel
  const handleDownloadExcel = () => {
    if (participatingSubmissions.length === 0) {
      alert("No participating records available to export.");
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
    ];

    const rows = participatingSubmissions.map((s) => {
      const q = s.questionnaireData || {};
      const org = s.contractor || q.organizationName || q.supplierDetails?.companyName || "—";
      const cat = q.participantCategory || s.category || "General";
      const grade = q.cidaGrade || "—";
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
      const province = q.province || "—";
      const date = formatDisplayDate(s.submittedAt || s.createdAt);

      return [
        s.ref || "",
        org,
        cat,
        "Participating (Yes)",
        grade,
        contactPerson,
        phone,
        email,
        district,
        province,
        date,
      ].map((val) => `"${String(val).replace(/"/g, '""')}"`);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RDA_Participating_Entities_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/reports"
              className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Analytics &amp; Reports
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">Participating</span>
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

        {/* Header Title */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Participating Entities
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Select a category below to view registered entities, contact details, and export reports.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Core Selection Cards: Contractors, Suppliers, Officers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* 1. CONTRACTORS */}
          <div className="bg-white p-7 rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Civil Works
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                Contractors
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Civil construction contractors confirmed to participate in the ICDP workshop.
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {counts.contractors}
                </span>
                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                  Confirmed Contractors
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <Link
                href="/reports/participating/contractors"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <span>View Contractors</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 2. SUPPLIERS */}
          <div className="bg-white p-7 rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Materials &amp; Plants
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                Suppliers
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Material, equipment, and asphalt/concrete plant suppliers confirmed to attend.
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {counts.suppliers}
                </span>
                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                  Confirmed Suppliers
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <Link
                href="/reports/participating/suppliers"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <span>View Suppliers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 3. OFFICERS */}
          <div className="bg-white p-7 rounded-2xl border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Landmark className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Government &amp; RDA
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                Officers
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provincial road engineers and government officers confirmed to attend.
              </p>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                  {counts.officers}
                </span>
                <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                  Confirmed Officers
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <Link
                href="/reports/participating/officers"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <span>View Officers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
