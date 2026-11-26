"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  Phone,
  Mail,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Calendar,
  Building2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface SupplierSubmissionRecord {
  id: string;
  ref: string;
  contractor: string;
  regNo: string;
  grade: string;
  submissionType: string;
  provincialOffice: string;
  status: string;
  category?: string;
  supplierType?: string;
  formId?: string;
  formSlug?: string;
  questionnaireData?: {
    organizationName?: string;
    contactNumber?: string;
    email?: string;
    supplierType?: string;
    [key: string]: any;
  };
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
    if (!isNaN(d.getTime())) return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return trimmed;
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  return "—";
}

export default function SupplierSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SupplierSubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<SupplierSubmissionRecord | null>(null);

  // Fetch only supplier form submissions
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions?formId=RDA-SUPPLIER-Q&formFilter=RDA-SUPPLIER-Q&limit=5000&status=submitted");
      if (!res.ok) throw new Error("Failed to load supplier records");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSubmissions(json.data);
      }
    } catch (err) {
      console.error("Error fetching supplier submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Clean records (filter search)
  const filteredRecords = useMemo(() => {
    return submissions.filter((s) => {
      if (s.ref?.startsWith("DFT-") || s.status === "Draft") return false;
      // Strictly ONLY display Form 2 (RDA-SUPPLIER-Q) records - never Form 1
      if (s.formId !== "RDA-SUPPLIER-Q" && s.formSlug !== "supplier") return false;
      const q = s.questionnaireData || {};
      const orgName = (s.contractor || q.organizationName || "").toLowerCase();

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const phone = (q.contactNumber || "").toLowerCase();
        const email = (q.email || "").toLowerCase();
        const ref = (s.ref || "").toLowerCase();

        const match =
          orgName.includes(term) ||
          phone.includes(term) ||
          email.includes(term) ||
          ref.includes(term) ||
          (s.supplierType || q.supplierType || "").toLowerCase().includes(term);

        if (!match) return false;
      }

      return true;
    });
  }, [submissions, searchTerm]);

  // Download as Excel (.csv with UTF-8 BOM)
  const handleDownloadExcel = () => {
    if (filteredRecords.length === 0) {
      alert("No supplier records available to export.");
      return;
    }

    const headers = [
      "Filing Reference",
      "Organization / Company Name",
      "Supplier Type",
      "Contact Phone",
      "Official Email",
      "Submission Date",
      "Status",
    ];

    const rows = filteredRecords.map((s) => {
      const q = s.questionnaireData || {};
      const org = s.contractor || q.organizationName || "—";
      const supType = s.supplierType || q.supplierType || "Material";
      const phone = q.contactNumber || "—";
      const email = q.email || "—";
      const subDate = formatDisplayDate(s.submittedAt || s.createdAt);

      return [
        `"${s.ref.replace(/"/g, '""')}"`,
        `"${org.replace(/"/g, '""')}"`,
        `"${supType.replace(/"/g, '""')}"`,
        `"${phone.replace(/"/g, '""')}"`,
        `"${email.replace(/"/g, '""')}"`,
        `"${subDate}"`,
        `"${s.status || "Submitted"}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RDA_Supplier_Submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-xs bg-purple-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supplier Submissions</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                  FORM 2
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dedicated independent registry of organizations registered through the Supplier Details Questionnaire.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={fetchRecords}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Supplier Submissions
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {filteredRecords.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Recorded from Supplier Registration Portal
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Public Registration Portal
          </span>
          <Link
            href="/register/supplier"
            target="_blank"
            className="text-xs font-bold text-purple-700 hover:underline inline-flex items-center gap-1 mt-2"
          >
            <span>/register/supplier</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Active public registration route
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Registry Scope
          </span>
          <span className="text-xs font-bold text-slate-800 mt-2 block">
            Independent Supplier Directory
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Separated from Contractor Registry &amp; Analytics
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by organization name, contact phone, official email, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition-all text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <th className="p-3.5">#</th>
                <th className="p-3.5">Organization / Firm Name</th>
                <th className="p-3.5">Supplier Type</th>
                <th className="p-3.5">Filing Reference</th>
                <th className="p-3.5">Contact Phone</th>
                <th className="p-3.5">Official Email</th>
                <th className="p-3.5">Filing Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span>Loading verified supplier submissions...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 space-y-2">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">No supplier submissions found.</p>
                    <p className="text-xs text-slate-400">
                      Submissions filed via the Supplier form (/register/supplier) will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((s, idx) => {
                  const q = s.questionnaireData || {};
                  const orgName = s.contractor || q.organizationName || "—";
                  const supType = s.supplierType || q.supplierType || "Material";
                  const phone = q.contactNumber || "—";
                  const email = q.email || "—";
                  const subDate = formatDisplayDate(s.submittedAt || s.createdAt);

                  return (
                    <tr key={s.id || idx} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>{orgName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          supType === "Labour"
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : supType === "Equipment"
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                            : "bg-blue-50 text-blue-900 border-blue-300"
                        }`}>
                          {supType}
                        </span>
                        {supType === "Equipment" && q.equipmentList && q.equipmentList.length > 0 ? (
                          <div className="text-[10px] text-emerald-800 font-medium truncate max-w-[140px] mt-0.5" title={q.equipmentList.map((e: any) => e.name).join(", ")}>
                            {q.equipmentList.map((e: any) => e.name).join(", ")}
                          </div>
                        ) : supType === "Labour" && q.labourCategories && q.labourCategories.length > 0 ? (
                          <div className="text-[10px] text-amber-800 font-medium truncate max-w-[140px] mt-0.5" title={q.labourCategories.join(", ")}>
                            {q.labourCategories.join(", ")}
                          </div>
                        ) : q.materialsSupplied && q.materialsSupplied.length > 0 ? (
                          <div className="text-[10px] text-slate-500 font-medium truncate max-w-[140px] mt-0.5" title={q.materialsSupplied.join(", ")}>
                            {q.materialsSupplied.join(", ")}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-purple-950">
                        {s.ref}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{phone}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]" title={email}>
                            {email}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{subDate}</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Verified
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(s)}
                          className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-page Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Supplier Submission Filing
                </span>
                <span className="font-mono text-base font-black text-purple-950">
                  {selectedRecord.ref}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-4">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                  Organization / Company Name
                </span>
                <span className="text-base font-black text-purple-950 block mt-0.5">
                  {selectedRecord.contractor || selectedRecord.questionnaireData?.organizationName || "—"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Supplier Type
                  </span>
                  <span className="font-bold text-purple-900 block mt-1">
                    {selectedRecord.supplierType || selectedRecord.questionnaireData?.supplierType || "Material"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Contact Phone Number
                  </span>
                  <span className="font-bold text-slate-800 block mt-1">
                    {selectedRecord.questionnaireData?.contactNumber || "—"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Official Email
                  </span>
                  <span className="font-bold text-purple-900 block mt-1 break-all">
                    {selectedRecord.questionnaireData?.email || "—"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Filing Channel
                  </span>
                  <span className="font-semibold text-slate-700 block mt-1">
                    Supplier Registration (Form 2)
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Filing Timestamp
                  </span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {formatDisplayDate(selectedRecord.submittedAt || selectedRecord.createdAt)}
                  </span>
                </div>
                {selectedRecord.questionnaireData?.materialsSupplied &&
                  selectedRecord.questionnaireData.materialsSupplied.length > 0 && (
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Materials Supplied
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecord.questionnaireData.materialsSupplied.map((m: string) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRecord.questionnaireData?.labourCategories &&
                  selectedRecord.questionnaireData.labourCategories.length > 0 && (
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Labour Categories Supplied
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecord.questionnaireData.labourCategories.map((c: string) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRecord.questionnaireData?.equipmentList &&
                  selectedRecord.questionnaireData.equipmentList.length > 0 && (
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Equipment / Machinery Supplied
                    </span>
                    <div className="space-y-1.5">
                      {selectedRecord.questionnaireData.equipmentList.map((eq: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 bg-white border border-emerald-200 rounded-lg"
                        >
                          <span className="font-bold text-emerald-950">{eq.name}</span>
                          <div className="flex items-center gap-2 text-slate-600">
                            {eq.capacity && (
                              <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                                {eq.capacity}
                              </span>
                            )}
                            {eq.availableCity && (
                              <span className="font-semibold text-emerald-900">
                                {eq.availableCity}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
