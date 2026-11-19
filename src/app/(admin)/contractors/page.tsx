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
  Briefcase,
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
  willParticipate?: "Yes" | "No" | string;
  participantCategory?: string;
  questionnaireData?: Record<string, any>;
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
                    <th className="px-5 py-3">Organization / Company / Institution Name</th>
                    <th className="px-5 py-3">Contact Number</th>
                    <th className="px-5 py-3">Email Address</th>
                    <th className="px-5 py-3 text-center">Participate or Not</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contractors.map((c) => {
                    const isParticipating =
                      c.willParticipate === "Yes" ||
                      (c.willParticipate !== "No" && c.primarySpeciality !== "Non-Attendee");

                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedContractor(c);
                          setProfileModalOpen(true);
                        }}
                        className="hover:bg-slate-50/75 transition-colors cursor-pointer group"
                      >
                        {/* 1. Organization / Company / Institution Name */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors text-sm">
                            {c.businessName}
                          </div>
                          {c.registrationNumber &&
                            !c.registrationNumber.startsWith("DFT-") &&
                            !c.registrationNumber.startsWith("REG-") &&
                            c.registrationNumber !== "Not Registered" && (
                              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                Reg: {c.registrationNumber}
                              </div>
                            )}
                        </td>

                        {/* 2. Contact Number */}
                        <td className="px-5 py-3.5 text-slate-700">
                          {c.contactOfficer?.phone &&
                          c.contactOfficer.phone !== "+94 11 000 0000" &&
                          c.contactOfficer.phone !== "N/A" ? (
                            <span className="font-mono text-slate-800 font-medium text-xs">
                              {c.contactOfficer.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 3. Email Address */}
                        <td className="px-5 py-3.5 text-slate-700">
                          {c.contactOfficer?.email &&
                          c.contactOfficer.email !== "contact@contractor.lk" &&
                          c.contactOfficer.email !== "contact@rda.gov.lk" &&
                          c.contactOfficer.email !== "N/A" ? (
                            <span className="font-mono text-slate-600 text-xs">
                              {c.contactOfficer.email}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* 4. Participate or Not */}
                        <td className="px-5 py-3.5 text-center">
                          {isParticipating ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              No
                            </span>
                          )}
                        </td>

                        {/* 5. Actions (View Details) */}
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContractor(c);
                              setProfileModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all shadow-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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

      {/* Contractor / Registered Entity Profile Slide-Over / Modal */}
      {profileModalOpen && selectedContractor && (() => {
        const q = selectedContractor.questionnaireData || {};
        const willParticipate =
          selectedContractor.willParticipate ||
          q.willParticipate ||
          (selectedContractor.primarySpeciality === "Non-Attendee" ? "No" : "Yes");
        const isNonAttendee = willParticipate === "No" || selectedContractor.primarySpeciality === "Non-Attendee";

        const category =
          selectedContractor.participantCategory ||
          q.participantCategory ||
          (isNonAttendee
            ? "Non-Attendee"
            : selectedContractor.primarySpeciality === "Government Stakeholder"
            ? "Government Officer"
            : "");

        const isGovOfficer = category === "Government Officer";
        const isSupplier = category === "Supplier";
        const isContractor =
          category === "Contractor" ||
          (!isGovOfficer &&
            !isSupplier &&
            !isNonAttendee &&
            Boolean(q.cidaGrade || selectedContractor.cidaGrade || (q.areasOfSpecialty && q.areasOfSpecialty.length)));

        // Registration details
        const regNumber = q.ictadRegistrationNumber || selectedContractor.registrationNumber;
        const hasReg = Boolean(
          regNumber &&
            !regNumber.startsWith("DFT-") &&
            !regNumber.startsWith("REG-") &&
            regNumber !== "Not Registered" &&
            regNumber !== "PENDING"
        );

        const cidaGrade = q.cidaGrade || selectedContractor.cidaGrade;
        const hasCida = Boolean(
          isContractor &&
            cidaGrade &&
            cidaGrade !== "Pending" &&
            cidaGrade !== "Not Registered" &&
            cidaGrade !== "Not registered with CIDA"
        );

        const brNumber = selectedContractor.businessRegistrationNumber;
        const hasBr = Boolean(
          brNumber &&
            brNumber !== "PENDING-BR" &&
            brNumber !== "N/A" &&
            brNumber !== "Not Provided"
        );

        // Primary general contact details
        const primaryPhone = q.contactNumber || selectedContractor.contactOfficer?.phone;
        const hasPrimaryPhone = Boolean(
          primaryPhone &&
            primaryPhone !== "+94 11 000 0000" &&
            primaryPhone !== "N/A" &&
            primaryPhone !== "Not Provided"
        );

        const primaryEmail = q.email || selectedContractor.contactOfficer?.email;
        const hasPrimaryEmail = Boolean(
          primaryEmail &&
            primaryEmail !== "contact@contractor.lk" &&
            primaryEmail !== "contact@rda.gov.lk" &&
            primaryEmail !== "N/A" &&
            primaryEmail !== "Not Provided"
        );

        // Attendees (Participant 1 and Participant 2)
        const p1 = q.participant1 || (selectedContractor.contactOfficer?.name ? {
          fullName: selectedContractor.contactOfficer.name,
          designation: selectedContractor.contactOfficer.designation,
          mobileNumber: selectedContractor.contactOfficer.phone,
          emailAddress: selectedContractor.contactOfficer.email,
        } : null);
        const hasP1 = Boolean(p1 && p1.fullName && p1.fullName !== "Authorized Representative" && p1.fullName !== "Not Designated");

        const p2 = q.participant2;
        const hasP2 = Boolean(p2 && p2.fullName && p2.fullName.trim());

        // Supplier specific fields
        const supplierDetails = q.supplierDetails || {};
        const hasSupplierDetails = Boolean(
          isSupplier && (
            supplierDetails.companyName ||
            supplierDetails.locationAddress ||
            supplierDetails.province ||
            supplierDetails.district ||
            (supplierDetails.materialsSupplied && supplierDetails.materialsSupplied.length > 0)
          )
        );

        // Contractor specific fields
        const specialties =
          q.areasOfSpecialty ||
          (selectedContractor.primarySpeciality &&
          selectedContractor.primarySpeciality !== "General Civil Engineering" &&
          selectedContractor.primarySpeciality !== "Government Stakeholder" &&
          selectedContractor.primarySpeciality !== "Non-Attendee"
            ? [selectedContractor.primarySpeciality]
            : []);
        const hasSpecialties = Array.isArray(specialties) && specialties.length > 0;
        const hasExperience = Boolean(q.generalExperience && q.generalExperience !== "N/A");
        const hasOngoingContracts = q.hasOngoingContracts === "Yes";
        const ongoingContractsList = Array.isArray(q.ongoingContracts)
          ? q.ongoingContracts.filter((oc: any) => oc && (oc.contractName || oc.projectName))
          : [];

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
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight leading-tight">
                        {q.organizationName || selectedContractor.businessName}
                      </h3>
                      {category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {category}
                        </span>
                      )}
                    </div>
                    {hasReg && (
                      <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                        Registration: {regNumber}
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
                {/* Top Status & Attendance Bar */}
                <div className="flex flex-wrap gap-3">
                  {/* Workshop Attendance */}
                  <div className="flex-1 min-w-[160px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Workshop Attendance
                    </span>
                    <div className="mt-1">
                      {isNonAttendee ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          No (Declined 07 Dec 2026)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Yes (Participating on 07 Dec 2026)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Pill */}
                  {!isNonAttendee && category && (
                    <div className="flex-1 min-w-[140px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Participant Category
                      </span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {category}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Registry Review Status */}
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

                  {/* CIDA Classification (Contractors only, if registered) */}
                  {hasCida && (
                    <div className="flex-1 min-w-[140px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        CIDA Classification
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-base font-black text-blue-950">
                          Grade {cidaGrade}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Business Registration (if filled) */}
                  {hasBr && (
                    <div className="flex-1 min-w-[140px] p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Business Registration
                      </span>
                      <div className="mt-1 font-mono font-bold text-slate-800">
                        {brNumber}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Organization Contact (if filled) */}
                {(hasPrimaryPhone || hasPrimaryEmail) && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Phone className="w-3.5 h-3.5 text-blue-900" />
                      <span>Official Contact Details</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {hasPrimaryPhone && (
                        <div>
                          <span className="text-slate-500 font-medium">Contact Number:</span>
                          <p className="font-mono font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{primaryPhone}</span>
                          </p>
                        </div>
                      )}
                      {hasPrimaryEmail && (
                        <div>
                          <span className="text-slate-500 font-medium">Electronic Mail:</span>
                          <p className="font-mono font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{primaryEmail}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* NON-ATTENDEE NOTICE (if willParticipate === "No") */}
                {isNonAttendee && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                    <p className="font-bold text-xs text-slate-800">Non-Attendee Registration Record</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      The entity indicated that they will not be participating in the workshop on 07 December 2026. Only verified organizational contact information is recorded in the central directory.
                    </p>
                  </div>
                )}

                {/* GOVERNMENT OFFICER ATTENDEES */}
                {isGovOfficer && (hasP1 || hasP2) && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <User className="w-3.5 h-3.5 text-blue-900" />
                      <span>Registered Government Attendees</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hasP1 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                            Official Representative (Participant 1)
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p1.fullName}</p>
                          {p1.designation && (
                            <p className="text-slate-600 text-xs font-medium">{p1.designation}</p>
                          )}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p1.mobileNumber && <div>Phone: {p1.mobileNumber}</div>}
                            {p1.emailAddress && <div>Email: {p1.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                      {hasP2 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                            Second Officer (Participant 2)
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p2.fullName}</p>
                          {p2.designation && (
                            <p className="text-slate-600 text-xs font-medium">{p2.designation}</p>
                          )}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p2.mobileNumber && <div>Phone: {p2.mobileNumber}</div>}
                            {p2.emailAddress && <div>Email: {p2.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUPPLIER DETAILS */}
                {isSupplier && hasSupplierDetails && (
                  <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                    <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-purple-200/60">
                      <Building2 className="w-3.5 h-3.5 text-purple-800" />
                      <span>Supplier Production &amp; Material Capacity</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {supplierDetails.companyName && (
                        <div>
                          <span className="text-slate-500 font-medium">Company Name:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{supplierDetails.companyName}</p>
                        </div>
                      )}
                      {(supplierDetails.province || supplierDetails.district) && (
                        <div>
                          <span className="text-slate-500 font-medium">Province &amp; District:</span>
                          <p className="font-bold text-slate-900 mt-0.5">
                            {[supplierDetails.province, supplierDetails.district ? `${supplierDetails.district} District` : null].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      )}
                      {supplierDetails.locationAddress && (
                        <div className="sm:col-span-2">
                          <span className="text-slate-500 font-medium">Physical Location / Address:</span>
                          <p className="font-medium text-slate-800 mt-0.5">{supplierDetails.locationAddress}</p>
                        </div>
                      )}
                    </div>

                    {supplierDetails.materialsSupplied && supplierDetails.materialsSupplied.length > 0 && (
                      <div className="pt-2 border-t border-purple-200/60">
                        <span className="text-slate-500 font-medium text-[11px]">Supplied Materials:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {supplierDetails.materialsSupplied.map((m: string) => (
                            <span key={m} className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[11px] font-semibold">
                              {m === "Other" && supplierDetails.materialsOther
                                ? `Other (${supplierDetails.materialsOther})`
                                : m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUPPLIER REPRESENTATIVES */}
                {isSupplier && (hasP1 || hasP2) && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <User className="w-3.5 h-3.5 text-blue-900" />
                      <span>Supplier Representative(s)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hasP1 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wide">
                            Representative (Participant 1)
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p1.fullName}</p>
                          {p1.designation && <p className="text-slate-600 text-xs font-medium">{p1.designation}</p>}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p1.mobileNumber && <div>Phone: {p1.mobileNumber}</div>}
                            {p1.emailAddress && <div>Email: {p1.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                      {hasP2 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                            Second Representative (Participant 2)
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p2.fullName}</p>
                          {p2.designation && <p className="text-slate-600 text-xs font-medium">{p2.designation}</p>}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p2.mobileNumber && <div>Phone: {p2.mobileNumber}</div>}
                            {p2.emailAddress && <div>Email: {p2.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CONTRACTOR CAPACITY & SPECIALTIES */}
                {isContractor && (hasSpecialties || hasExperience || q.hasOngoingContracts) && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                      <span>Contractor Capacity &amp; Experience</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hasExperience && (
                        <div>
                          <span className="text-slate-500 font-medium">General Construction Experience:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{q.generalExperience}</p>
                        </div>
                      )}
                      {q.hasOngoingContracts && (
                        <div>
                          <span className="text-slate-500 font-medium">Ongoing RDA Contracts:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{q.hasOngoingContracts}</p>
                        </div>
                      )}
                    </div>

                    {hasSpecialties && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-500 font-medium text-[11px]">Areas of Technical Specialty:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {specialties.map((s: string) => (
                            <span key={s} className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-semibold">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CONTRACTOR ONGOING WORKS */}
                {isContractor && hasOngoingContracts && ongoingContractsList.length > 0 && (
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-blue-200/60">
                      <Briefcase className="w-3.5 h-3.5 text-blue-900" />
                      <span>Ongoing Works &amp; Outstanding Commitments</span>
                    </h4>

                    {q.totalOutstandingValueLkrMillion !== undefined && q.totalOutstandingValueLkrMillion !== null && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">Total Value of Outstanding Works:</span>
                        <span className="font-mono font-bold text-blue-950">
                          LKR {Number(q.totalOutstandingValueLkrMillion).toLocaleString()} Million
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5 pt-1">
                      {ongoingContractsList.map((oc: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-900">Project {idx + 1}: {oc.contractName || oc.projectName}</span>
                            {oc.contractValueLkrMillion && (
                              <span className="font-mono font-bold text-slate-800">
                                LKR {oc.contractValueLkrMillion}M
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                            {oc.clientEmployer && <span>Client: {oc.clientEmployer}</span>}
                            {oc.expectedCompletionDate && <span>Completion: {oc.expectedCompletionDate}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONTRACTOR REPRESENTATIVES */}
                {isContractor && (hasP1 || hasP2) && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <User className="w-3.5 h-3.5 text-blue-900" />
                      <span>Authorized Contractor Representative(s)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hasP1 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                            Primary Representative (Participant 1)
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p1.fullName}</p>
                          {p1.designation && <p className="text-slate-600 text-xs font-medium">{p1.designation}</p>}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p1.mobileNumber && <div>Phone: {p1.mobileNumber}</div>}
                            {p1.emailAddress && <div>Email: {p1.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                      {hasP2 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                            Second Representative (Participant 2)
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p2.fullName}</p>
                          {p2.designation && <p className="text-slate-600 text-xs font-medium">{p2.designation}</p>}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p2.mobileNumber && <div>Phone: {p2.mobileNumber}</div>}
                            {p2.emailAddress && <div>Email: {p2.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* GENERAL ATTENDEES FALLBACK (if category unselected but attendee) */}
                {!isNonAttendee && !isGovOfficer && !isSupplier && !isContractor && (hasP1 || hasP2) && (
                  <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <User className="w-3.5 h-3.5 text-blue-900" />
                      <span>Registered Attendees</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {hasP1 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                            Participant 1
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p1.fullName}</p>
                          {p1.designation && <p className="text-slate-600 text-xs font-medium">{p1.designation}</p>}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p1.mobileNumber && <div>Phone: {p1.mobileNumber}</div>}
                            {p1.emailAddress && <div>Email: {p1.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                      {hasP2 && (
                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                            Participant 2
                          </span>
                          <p className="font-bold text-slate-900 text-sm">{p2.fullName}</p>
                          {p2.designation && <p className="text-slate-600 text-xs font-medium">{p2.designation}</p>}
                          <div className="pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                            {p2.mobileNumber && <div>Phone: {p2.mobileNumber}</div>}
                            {p2.emailAddress && <div>Email: {p2.emailAddress}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dynamic Questionnaire Notice (Only for Contractors) */}
                {isContractor && (
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
