"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Truck,
  Landmark,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Printer,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  HardHat,
  AlertCircle,
  FileText,
} from "lucide-react";

export interface FormattedRecord {
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

interface ReportDirectoryViewProps {
  title: string;
  subtitle: string;
  attendanceFilter: "Yes" | "No" | "all";
  categoryFilter: "Contractor" | "Supplier" | "Government Officer" | "all";
  parentPath?: string;
  parentLabel?: string;
  currentPath: string;
  activeTabKey: "all" | "contractors" | "suppliers" | "officers";
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

export default function ReportDirectoryView({
  title,
  subtitle,
  attendanceFilter,
  categoryFilter,
  parentPath = "/reports",
  parentLabel = "Analytics & Reports",
  currentPath,
  activeTabKey,
}: ReportDirectoryViewProps) {
  const [submissions, setSubmissions] = useState<FormattedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("All Districts");
  const [datePreset, setDatePreset] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
      console.error("Error fetching report data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Overall attendance base filter (Yes vs No vs All)
  const attendanceBaseRecords = useMemo(() => {
    return submissions.filter((s) => {
      // Exclude fake/test entries and internal draft tokens
      if (s.ref?.startsWith("DFT-") || s.status === "Draft") return false;
      const q = s.questionnaireData || {};
      const orgName = (s.contractor || q.organizationName || "").toLowerCase();
      if (orgName.includes("testing") || orgName.includes("dummy")) return false;

      if (attendanceFilter === "Yes" && q.willParticipate !== "Yes") return false;
      if (attendanceFilter === "No" && q.willParticipate !== "No") return false;

      return true;
    });
  }, [submissions, attendanceFilter]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    let all = 0;
    let contractors = 0;
    let suppliers = 0;
    let officers = 0;

    attendanceBaseRecords.forEach((s) => {
      const q = s.questionnaireData || {};
      const cat = (q.participantCategory || s.category || "").toLowerCase();
      all++;
      if (cat.includes("contractor")) contractors++;
      else if (cat.includes("supplier")) suppliers++;
      else if (cat.includes("officer") || cat.includes("gov")) officers++;
    });

    return { all, contractors, suppliers, officers };
  }, [attendanceBaseRecords]);

  // Filtered dataset according to category, search, district, date
  const filteredRecords = useMemo(() => {
    return attendanceBaseRecords.filter((s) => {
      const q = s.questionnaireData || {};
      const cat = (q.participantCategory || s.category || "").toLowerCase();

      // Category check
      if (categoryFilter === "Contractor" && !cat.includes("contractor")) return false;
      if (categoryFilter === "Supplier" && !cat.includes("supplier")) return false;
      if (categoryFilter === "Government Officer" && !cat.includes("officer") && !cat.includes("gov")) return false;

      // District check
      if (districtFilter !== "All Districts") {
        const itemDist = (q.district || q.operatingDistrict || "").toLowerCase();
        if (!itemDist.includes(districtFilter.toLowerCase())) return false;
      }

      // Date check
      const recordDateStr = s.submittedAt || s.createdAt;
      if (recordDateStr) {
        const rDate = new Date(recordDateStr);
        if (!isNaN(rDate.getTime())) {
          if (startDate) {
            const sD = new Date(startDate);
            sD.setHours(0, 0, 0, 0);
            if (rDate < sD) return false;
          }
          if (endDate) {
            const eD = new Date(endDate);
            eD.setHours(23, 59, 59, 999);
            if (rDate > eD) return false;
          }
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const org = (s.contractor || q.organizationName || q.supplierDetails?.companyName || "").toLowerCase();
        const contactName = (
          q.participant1?.name ||
          q.representativeName ||
          q.supplierDetails?.repName ||
          q.officerDetails?.officerName ||
          ""
        ).toLowerCase();
        const phone = (
          q.contactNumber ||
          q.participant1?.mobile ||
          q.supplierDetails?.phone ||
          q.officerDetails?.contactNumber ||
          ""
        ).toLowerCase();
        const email = (
          q.email ||
          q.participant1?.email ||
          q.supplierDetails?.email ||
          q.officerDetails?.officialEmail ||
          ""
        ).toLowerCase();
        const ref = (s.ref || "").toLowerCase();
        const reg = (s.regNo || "").toLowerCase();
        const dist = (q.district || "").toLowerCase();

        const match =
          org.includes(term) ||
          contactName.includes(term) ||
          phone.includes(term) ||
          email.includes(term) ||
          ref.includes(term) ||
          reg.includes(term) ||
          dist.includes(term);

        if (!match) return false;
      }

      return true;
    });
  }, [attendanceBaseRecords, categoryFilter, districtFilter, startDate, endDate, searchTerm]);

  // Handle Preset Dates
  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "7days") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "30days") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(first.toISOString().split("T")[0]);
      setEndDate(now.toISOString().split("T")[0]);
    }
  };

  // Export to Excel / CSV with BOM
  const handleDownloadExcel = () => {
    if (filteredRecords.length === 0) {
      alert("No records to export matching current filters.");
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

    const rows = filteredRecords.map((s) => {
      const q = s.questionnaireData || {};
      const org = s.contractor || q.organizationName || q.supplierDetails?.companyName || "—";
      const cat = q.participantCategory || s.category || "General";
      const attend = q.willParticipate === "Yes" ? "Participating (Yes)" : q.willParticipate === "No" ? "Not Participating (No)" : "Unspecified";
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
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    a.href = url;
    a.download = `RDA_Report_${sanitizedTitle}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download / Print as PDF
  const handleDownloadPDF = () => {
    window.print();
  };

  // Base navigation prefix for sub-routes
  const routePrefix = attendanceFilter === "Yes"
    ? "/reports/participating"
    : attendanceFilter === "No"
    ? "/reports/not-participating"
    : "/reports";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Printable Letterhead (Shown only when printing / saving as PDF) */}
      <div className="hidden print:block mb-6 p-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-wide uppercase">
              Democratic Socialist Republic of Sri Lanka
            </h1>
            <h2 className="text-lg font-bold text-blue-900">Road Development Authority (RDA)</h2>
            <p className="text-xs text-slate-600">
              Inclusive Connectivity & Development Project (ICDP) | Official Registry & Analytics Report
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>Report Date: {new Date().toLocaleDateString("en-GB")}</p>
            <p>Classification: OFFICIAL / CONFIDENTIAL</p>
          </div>
        </div>
        <div className="mt-3 py-1 px-2 bg-slate-100 border text-xs font-semibold text-slate-800">
          REPORT: {title.toUpperCase()} ({filteredRecords.length} Official Records Listed)
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link
              href={parentPath}
              className="flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {parentLabel}
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">{title}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              Refresh
            </button>

            {/* Download as Excel */}
            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download as Excel
            </button>

            {/* Download as PDF */}
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Download as PDF
            </button>
          </div>
        </div>

        {/* Page Title & Subtitle Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm bg-blue-600">
                  {attendanceFilter === "Yes" ? (
                    <UserCheck className="w-6 h-6" />
                  ) : attendanceFilter === "No" ? (
                    <UserX className="w-6 h-6" />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
                </div>
              </div>
            </div>

            {/* Status Summary Pill */}
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200/80">
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Total Matches
                </span>
                <span className="text-xl font-extrabold text-slate-900">{filteredRecords.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simple Clean Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm mb-5 print:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by organization name, contact person, phone, email, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
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

        {/* Records Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                  <th className="p-3">#</th>
                  <th className="p-3">Organization / Firm Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Contact Officer & Phone</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">District / Province</th>
                  <th className="p-3">Classification / Grade</th>
                  <th className="p-3">Workshop Attendance</th>
                  <th className="p-3">Submission Date</th>
                  <th className="p-3 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                      Loading verified records...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No matching records found.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your search query, category, or date range.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((s, idx) => {
                    const q = s.questionnaireData || {};
                    const orgName = s.contractor || q.organizationName || q.supplierDetails?.companyName || "—";
                    const cat = q.participantCategory || s.category || "General";
                    const contactName =
                      q.participant1?.name ||
                      q.representativeName ||
                      q.contactOfficer?.name ||
                      q.supplierDetails?.repName ||
                      q.officerDetails?.officerName ||
                      (cat.toLowerCase().includes("supplier") ? "Supplier Contact" : "Authorized Representative");
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
                    const grade = q.cidaGrade || s.grade || "—";
                    const isAttending = q.willParticipate === "Yes";
                    const subDate = formatDisplayDate(s.submittedAt || s.createdAt);

                    return (
                      <tr key={s.id || idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div>{orgName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{s.ref}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cat.toLowerCase().includes("contractor")
                                ? "bg-blue-100 text-blue-800"
                                : cat.toLowerCase().includes("supplier")
                                ? "bg-purple-100 text-purple-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {cat}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{contactName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {phone}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-700 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]" title={email}>
                              {email}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{district}</div>
                          <div className="text-[10px] text-slate-400">{province}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {grade}
                          </span>
                        </td>
                        <td className="p-3">
                          {isAttending ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                              <UserCheck className="w-3 h-3 text-blue-600" />
                              Attending (Yes)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                              <UserX className="w-3 h-3 text-slate-600" />
                              Declined (No)
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-600 font-medium">{subDate}</td>
                        <td className="p-3 text-right whitespace-nowrap print:hidden">
                          <Link
                            href={`/submissions?ref=${encodeURIComponent(s.ref)}`}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs hover:underline"
                          >
                            View
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Signatory Block (Visible only on print/PDF) */}
        <div className="hidden print:block mt-12 pt-8 border-t border-slate-300">
          <div className="grid grid-cols-3 gap-8 text-center text-xs text-slate-700">
            <div>
              <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold">Prepared By</p>
              <p className="text-[10px] text-slate-500">Data Management Officer</p>
            </div>
            <div>
              <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold">Verified By</p>
              <p className="text-[10px] text-slate-500">Project Engineer / ICDP</p>
            </div>
            <div>
              <div className="h-14 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold">Approved By</p>
              <p className="text-[10px] text-slate-500">Project Director / Chief Engineer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
