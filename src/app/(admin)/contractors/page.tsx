"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Search,
  Filter,
  Plus,
  Download,
  Inbox,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Calendar,
  Lock,
  Award,
  FileText,
} from "lucide-react";

interface ContractorItem {
  id: string;
  registrationNumber: string;
  businessName: string;
  businessRegistrationNumber: string;
  cidaGrade: string;
  primarySpeciality: string;
  province: string;
  district: string;
  contactOfficer: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
  status: "Draft" | "Pending_Review" | "Verified" | "Action_Required" | "Suspended";
  createdAt: string | null;
  updatedAt: string | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

const CIDA_GRADES = [
  "CS1",
  "CS2",
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
  "Specialist",
  "Pending",
];

const PROVINCES = [
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

const STATUSES = [
  { value: "Draft", label: "Draft Filing" },
  { value: "Pending_Review", label: "Pending Review" },
  { value: "Verified", label: "Verified & Approved" },
  { value: "Action_Required", label: "Action Required" },
  { value: "Suspended", label: "Suspended" },
];

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<ContractorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  // Modal Profile View
  const [selectedContractor, setSelectedContractor] = useState<ContractorItem | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchContractors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (selectedGrade) params.set("grade", selectedGrade);
      if (selectedProvince) params.set("province", selectedProvince);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/contractors?${params.toString()}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setContractors(result.data || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        setError(result.message || "Failed to query contractor registry.");
      }
    } catch {
      setError("Network communication failure. Could not reach contractor registry service.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedGrade, selectedProvince, selectedStatus]);

  useEffect(() => {
    fetchContractors();
  }, [fetchContractors]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Verified":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Pending_Review":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Action_Required":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Suspended":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "Draft":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getGradeBadge = (grade: string) => {
    if (grade === "CS1" || grade === "CS2" || grade === "C1") {
      return "bg-amber-100 text-amber-900 border-amber-300 font-extrabold";
    }
    if (grade === "C2" || grade === "C3" || grade === "C4") {
      return "bg-blue-100 text-blue-900 border-blue-300 font-bold";
    }
    return "bg-slate-100 text-slate-800 border-slate-300 font-semibold";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Contractor Registry
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Centralized registry of engineering contractors evaluated under CIDA classifications for Road Development Authority projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchContractors()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
            title="Refresh database feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              alert("Export functionality: Will export the filtered contractor registry once official report parameters are requested.");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Registry</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchContractors()}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by firm name, CIDA reg, or contact..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">All CIDA Grades</option>
            {CIDA_GRADES.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>

          <select
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">All 9 Provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {(selectedGrade || selectedProvince || selectedStatus || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedGrade("");
                setSelectedProvince("");
                setSelectedStatus("");
                setSearch("");
                setPage(1);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shrink-0"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Contractors Table or Clean Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Querying live MongoDB contractor registry...</p>
          </div>
        ) : contractors.length === 0 ? (
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <Inbox className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Contractor Records Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {debouncedSearch || selectedGrade || selectedProvince || selectedStatus
                  ? "No contractors matched your specific search filters. Try clearing filters to view all entries."
                  : "There are currently no contractor records in the national database. Incoming registrations and official intakes will populate here."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Contractor / Firm Name</th>
                    <th className="px-5 py-3">CIDA Reg &amp; Grade</th>
                    <th className="px-5 py-3">Primary Speciality</th>
                    <th className="px-5 py-3">Jurisdiction (Province/District)</th>
                    <th className="px-5 py-3">Contact Officer</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contractors.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedContractor(c);
                        setProfileModalOpen(true);
                      }}
                      className="hover:bg-slate-50/75 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                          {c.businessName}
                        </div>
                        {c.businessRegistrationNumber && c.businessRegistrationNumber !== "PENDING-BR" && c.businessRegistrationNumber !== "N/A" && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            BR: {c.businessRegistrationNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.registrationNumber && !c.registrationNumber.startsWith("DFT-") && !c.registrationNumber.startsWith("REG-") ? (
                          <>
                            <div className="font-mono font-medium text-slate-700">{c.registrationNumber}</div>
                            {c.cidaGrade && c.cidaGrade !== "Pending" && (
                              <span
                                className={`mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${getGradeBadge(
                                  c.cidaGrade
                                )}`}
                              >
                                Grade {c.cidaGrade}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 font-medium text-xs">Not Registered</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {c.primarySpeciality === "Non-Attendee" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            Non-Attendee
                          </span>
                        ) : c.primarySpeciality && c.primarySpeciality !== "General Civil Engineering" ? (
                          c.primarySpeciality
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {c.district && c.district !== "Unassigned" && c.district !== "Unassigned District" ? (
                          <>
                            <div className="font-semibold text-slate-800">{c.province}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{c.district} District</div>
                          </>
                        ) : c.province && c.province !== "Western Province" ? (
                          <div className="font-semibold text-slate-800">{c.province}</div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {c.contactOfficer?.name && c.contactOfficer.name !== "Authorized Representative" && c.contactOfficer.name !== "Not Designated" && (
                          <div className="font-medium text-slate-900">{c.contactOfficer.name}</div>
                        )}
                        {c.contactOfficer?.phone && c.contactOfficer.phone !== "+94 11 000 0000" && c.contactOfficer.phone !== "N/A" && (
                          <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                            {c.contactOfficer.phone}
                          </div>
                        )}
                        {c.contactOfficer?.email && c.contactOfficer.email !== "contact@contractor.lk" && c.contactOfficer.email !== "contact@rda.gov.lk" && c.contactOfficer.email !== "N/A" && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {c.contactOfficer.email}
                          </div>
                        )}
                        {!c.contactOfficer?.name && !c.contactOfficer?.phone && !c.contactOfficer?.email && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedContractor(c);
                            setProfileModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Showing{" "}
                <strong className="text-slate-800">
                  {pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-slate-800">
                  {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                </strong>{" "}
                of <strong className="text-slate-800">{pagination.totalCount}</strong> contractors
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-2 font-semibold text-slate-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage || loading}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contractor Profile Slide-Over / Modal */}
      {profileModalOpen && selectedContractor && (() => {
        const hasCida = Boolean(
          selectedContractor.cidaGrade &&
          selectedContractor.cidaGrade !== "Pending" &&
          selectedContractor.cidaGrade !== "Not Registered" &&
          selectedContractor.cidaGrade !== "Not registered with CIDA"
        );
        const hasBr = Boolean(
          selectedContractor.businessRegistrationNumber &&
          selectedContractor.businessRegistrationNumber !== "PENDING-BR" &&
          selectedContractor.businessRegistrationNumber !== "N/A" &&
          selectedContractor.businessRegistrationNumber !== "Not Provided"
        );
        const hasReg = Boolean(
          selectedContractor.registrationNumber &&
          !selectedContractor.registrationNumber.startsWith("DFT-") &&
          !selectedContractor.registrationNumber.startsWith("REG-") &&
          selectedContractor.registrationNumber !== "Not Registered" &&
          selectedContractor.registrationNumber !== "PENDING"
        );
        const isNonAttendee = selectedContractor.primarySpeciality === "Non-Attendee";

        const hasDistrict = Boolean(
          selectedContractor.district &&
          selectedContractor.district !== "Unassigned" &&
          selectedContractor.district !== "Unassigned District" &&
          selectedContractor.district !== "Not Specified"
        );
        const hasSpeciality = Boolean(
          selectedContractor.primarySpeciality &&
          selectedContractor.primarySpeciality !== "Non-Attendee" &&
          selectedContractor.primarySpeciality !== "General Civil Engineering" &&
          selectedContractor.primarySpeciality !== "Not Specified"
        );
        const hasProvince = Boolean(
          selectedContractor.province &&
          selectedContractor.province !== "Not Specified" &&
          (!isNonAttendee || hasDistrict)
        );
        const showJurisdiction = hasProvince || hasDistrict || hasSpeciality;

        const hasOfficerName = Boolean(
          selectedContractor.contactOfficer?.name &&
          selectedContractor.contactOfficer.name !== "Authorized Representative" &&
          selectedContractor.contactOfficer.name !== "Not Designated" &&
          selectedContractor.contactOfficer.name !== "Not Specified"
        );
        const hasDesignation = Boolean(
          selectedContractor.contactOfficer?.designation &&
          selectedContractor.contactOfficer.designation !== "Authorized Officer" &&
          selectedContractor.contactOfficer.designation !== "Authorized Representative" &&
          selectedContractor.contactOfficer.designation !== "Not Specified"
        );
        const hasPhone = Boolean(
          selectedContractor.contactOfficer?.phone &&
          selectedContractor.contactOfficer.phone !== "+94 11 000 0000" &&
          selectedContractor.contactOfficer.phone !== "N/A" &&
          selectedContractor.contactOfficer.phone !== "Not Provided"
        );
        const hasEmail = Boolean(
          selectedContractor.contactOfficer?.email &&
          selectedContractor.contactOfficer.email !== "contact@contractor.lk" &&
          selectedContractor.contactOfficer.email !== "contact@rda.gov.lk" &&
          selectedContractor.contactOfficer.email !== "N/A" &&
          selectedContractor.contactOfficer.email !== "Not Provided"
        );
        const showContact = hasOfficerName || hasDesignation || hasPhone || hasEmail;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
              {/* Header */}
              <div className="px-6 py-5 bg-[#0b1f3a] text-white flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight leading-tight">
                      {selectedContractor.businessName}
                    </h3>
                    {hasReg && (
                      <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                        Registration: {selectedContractor.registrationNumber}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 text-xs">
                {/* Status and Grade Bar */}
                <div className="flex flex-wrap gap-3">
                  {hasCida && (
                    <div className="flex-1 min-w-[140px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        CIDA Classification
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-base font-black text-blue-950">
                          Grade {selectedContractor.cidaGrade}
                        </span>
                      </div>
                    </div>
                  )}

                  {isNonAttendee && (
                    <div className="flex-1 min-w-[160px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Workshop Attendance
                      </span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Non-Attendee (Declined)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-[140px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Registry Review Status
                    </span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                          selectedContractor.status
                        )}`}
                      >
                        {selectedContractor.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {hasBr && (
                    <div className="flex-1 min-w-[140px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Business Registration
                      </span>
                      <div className="mt-1 font-mono font-bold text-slate-800">
                        {selectedContractor.businessRegistrationNumber}
                      </div>
                    </div>
                  )}
                </div>

                {/* Geographic and Technical Jurisdiction (Only if filled) */}
                {showJurisdiction && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-blue-900" />
                      <span>Jurisdiction &amp; Engineering Scope</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {hasProvince && (
                        <div>
                          <span className="text-slate-500 font-medium">Administrative Province:</span>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {selectedContractor.province}
                          </p>
                        </div>
                      )}
                      {hasDistrict && (
                        <div>
                          <span className="text-slate-500 font-medium">District Station:</span>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {selectedContractor.district} District
                          </p>
                        </div>
                      )}
                      {hasSpeciality && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 font-medium">Primary Technical Speciality:</span>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {selectedContractor.primarySpeciality}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Details (Only filled fields) */}
                {showContact && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <User className="w-3.5 h-3.5 text-blue-900" />
                      <span>{hasOfficerName || hasDesignation ? "Authorized Contact Representative" : "Contact Details"}</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {hasOfficerName && (
                        <div>
                          <span className="text-slate-500 font-medium">Officer Name:</span>
                          <p className="font-bold text-slate-800 mt-0.5">
                            {selectedContractor.contactOfficer.name}
                          </p>
                        </div>
                      )}
                      {hasDesignation && (
                        <div>
                          <span className="text-slate-500 font-medium">Designation:</span>
                          <p className="font-semibold text-slate-800 mt-0.5">
                            {selectedContractor.contactOfficer.designation}
                          </p>
                        </div>
                      )}
                      {hasPhone && (
                        <div>
                          <span className="text-slate-500 font-medium">Official Contact Number:</span>
                          <p className="font-mono text-slate-800 mt-0.5 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{selectedContractor.contactOfficer.phone}</span>
                          </p>
                        </div>
                      )}
                      {hasEmail && (
                        <div>
                          <span className="text-slate-500 font-medium">Official Electronic Mail:</span>
                          <p className="font-mono text-slate-800 mt-0.5 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{selectedContractor.contactOfficer.email}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dynamic Questionnaire Architecture Notice (Only for Contractors) */}
                {!isNonAttendee && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Questionnaire Criteria Status: Locked Pending Ministerial Gazette</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      As per instructions from the Road Development Authority Directorate of Planning &amp; Procurement, official questionnaire parameters are awaiting committee ratification. Dynamic questionnaire filings will integrate directly under this contractor record once officially gazetted.
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-2 text-[10px] text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-t border-slate-100">
                  <span>
                    Registered in System:{" "}
                    {selectedContractor.createdAt
                      ? new Date(selectedContractor.createdAt).toLocaleDateString("en-GB")
                      : "Recorded"}
                  </span>
                  <span>Database Node: Sri Lanka National Central Registry</span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
