"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileCheck2,
  Filter,
  Search,
  Download,
  Inbox,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Clock,
  Shield,
  X,
  Users,
  Briefcase,
  Truck,
  Landmark,
  UserX,
  CheckCircle2,
  CheckCheck,
  Printer,
  FileText,
  Scale,
  Pencil,
  Trash2,
  Save,
  AlertOctagon,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { DynamicFormRenderer } from "@/components/dynamic-form/DynamicFormRenderer";
import { generateSubmissionHtml } from "@/lib/submission-html";

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
  viewedAt?: string | null;
  viewedByName?: string | null;
  schemaVersion?: string;
  questionnaireData?: any;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string | null;
  reviewedBy: string;
  reviewNotes: string | null;
  editRequested?: boolean;
  editRequestReason?: string | null;
  editRequestedAt?: string | null;
}

interface SubmissionsCounts {
  all: number;
  submitted: number;
  draft: number;
  unseen?: number;
  seen?: number;
  editRequested?: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

const PROVINCES = [
  "All Provincial Offices",
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

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "All Statuses" },
  { label: "Submitted (New)", value: "submitted" },
  { label: "Under Review", value: "under_review" },
  { label: "Approved / Verified", value: "approved" },
  { label: "Rejected / Action Required", value: "rejected" },
  { label: "Draft", value: "draft" },
];

const CATEGORY_OPTIONS = [
  "All Categories",
  "Contractor",
  "Supplier",
  "Government Officer",
];

const ATTENDANCE_OPTIONS = [
  { label: "All Attendance", value: "All Attendance" },
  { label: "Attending (Yes)", value: "Yes" },
  { label: "Non-Attendee (No)", value: "No" },
];

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function SubmissionsContent() {
  const searchParams = useSearchParams();

  // Initial filter values from URL query parameters
  const initialCategory = searchParams.get("category") || "All Categories";
  const initialAttendance = searchParams.get("attendance") || "All Attendance";
  const initialStatus = searchParams.get("status") || "All Statuses";
  const initialSearch = searchParams.get("search") || "";
  const initialRef = searchParams.get("ref") || "";

  const [submissions, setSubmissions] = useState<FormattedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [province, setProvince] = useState("All Provincial Offices");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
  });

  // Selected for quick detail modal
  const [selectedSub, setSelectedSub] = useState<FormattedSubmission | null>(null);
  const [hasAutoOpenedRef, setHasAutoOpenedRef] = useState(false);
  const [counts, setCounts] = useState<SubmissionsCounts>({ all: 0, submitted: 0, draft: 0, unseen: 0, seen: 0 });

  // Delete confirmation modal state
  const [subToDelete, setSubToDelete] = useState<FormattedSubmission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Edit submission modal state
  const [subToEdit, setSubToEdit] = useState<FormattedSubmission | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [editAlert, setEditAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [questionnaireSchema, setQuestionnaireSchema] = useState<any>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);

  // Preload official published questionnaire schema for full form editing
  useEffect(() => {
    setIsLoadingSchema(true);
    fetch("/api/public/questionnaire")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.questionnaire) {
          setQuestionnaireSchema(d.questionnaire);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingSchema(false);
      });
  }, []);

  const handleRequestDelete = (sub: FormattedSubmission) => {
    setSubToDelete(sub);
    setDeleteAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!subToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteAlert(null);
      const res = await fetch("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: subToDelete.id, ref: subToDelete.ref }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions((prev) => prev.filter((s) => s.id !== subToDelete.id));
        if (selectedSub?.id === subToDelete.id) setSelectedSub(null);
        setSubToDelete(null);
        fetchSubmissions();
      } else {
        setDeleteAlert({ type: "error", message: data.message || "Failed to delete submission record." });
      }
    } catch {
      setDeleteAlert({ type: "error", message: "Network error occurred while deleting submission." });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (sub: FormattedSubmission) => {
    const q = sub.questionnaireData || {};
    setSubToEdit(sub);
    setEditAlert(null);

    // If schema not loaded yet, fetch it immediately
    if (!questionnaireSchema) {
      setIsLoadingSchema(true);
      fetch("/api/public/questionnaire")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.questionnaire) setQuestionnaireSchema(d.questionnaire);
        })
        .catch(() => {})
        .finally(() => setIsLoadingSchema(false));
    }

    const sup = q.supplierDetails || {};
    const supCompany = sup.companyName || (sub.category === "Supplier" ? sub.contractor : "");
    const orgName = q.organizationName || (sub.category !== "Supplier" ? sub.contractor : "");
    const p1 = q.participant1 || {};
    const p2 = q.participant2 || {};

    const initialData: Record<string, any> = {
      ...q,
      // Status & routing
      status: sub.status || "Submitted",
      provincialOffice: sub.provincialOffice || q.province || sup.province || "Western Province",
      willParticipate: q.willParticipate || "Yes",
      participantCategory: q.participantCategory || (sub.category === "Supplier" ? "Supplier" : "Contractor"),
      reviewNotes: sub.reviewNotes || "",

      // General
      organizationName: orgName || supCompany || "",
      contactNumber: q.contactNumber || "",
      email: q.email || "",

      // Participant 1 (nested and dot-notated)
      participant1: {
        fullName: p1.fullName || "",
        designation: p1.designation || "",
        mobileNumber: p1.mobileNumber || "",
        email: p1.email || "",
      },
      "participant1.fullName": p1.fullName || "",
      "participant1.designation": p1.designation || "",
      "participant1.mobileNumber": p1.mobileNumber || "",
      "participant1.email": p1.email || "",

      // Participant 2 (nested and dot-notated)
      participant2: {
        fullName: p2.fullName || "",
        designation: p2.designation || "",
        mobileNumber: p2.mobileNumber || "",
        email: p2.email || "",
      },
      "participant2.fullName": p2.fullName || "",
      "participant2.designation": p2.designation || "",
      "participant2.mobileNumber": p2.mobileNumber || "",
      "participant2.email": p2.email || "",

      // Supplier Details (nested and dot-notated)
      supplierDetails: {
        companyName: supCompany || orgName || "",
        materialsSupplied: Array.isArray(sup.materialsSupplied) ? sup.materialsSupplied : [],
        materialsOther: sup.materialsOther || "",
        locationAddress: sup.locationAddress || "",
        province: sup.province || sub.provincialOffice || "",
        district: sup.district || "",
        latitude: sup.latitude || "",
        longitude: sup.longitude || "",
        supplyCapacities: sup.supplyCapacities || {},
      },
      "supplierDetails.companyName": supCompany || orgName || "",
      "supplierDetails.materialsSupplied": Array.isArray(sup.materialsSupplied) ? sup.materialsSupplied : [],
      "supplierDetails.materialsOther": sup.materialsOther || "",
      "supplierDetails.locationAddress": sup.locationAddress || "",
      "supplierDetails.province": sup.province || sub.provincialOffice || "",
      "supplierDetails.district": sup.district || "",
      "supplierDetails.latitude": sup.latitude || "",
      "supplierDetails.longitude": sup.longitude || "",
      "supplierDetails.supplyCapacities": sup.supplyCapacities || {},

      // Contractor technical / financial / capacity
      ictadRegistrationNumber: q.ictadRegistrationNumber || (sub.regNo !== "N/A" && !sub.regNo.startsWith("DFT-") ? sub.regNo : ""),
      cidaGrade: q.cidaGrade || (sub.grade !== "Pending" && sub.grade !== "N/A" ? sub.grade : ""),
      areasOfSpecialty: Array.isArray(q.areasOfSpecialty) ? q.areasOfSpecialty : [],
      specialtyGrades: q.specialtyGrades || {},
      financialStatements: q.financialStatements || {},
      loanCommitments: q.loanCommitments || {},
      "loanCommitments.twoYearRepaymentsDue2026To2028": q.loanCommitments?.twoYearRepaymentsDue2026To2028 ?? "",
      hasOngoingContracts: q.hasOngoingContracts || (Array.isArray(q.ongoingContracts) && q.ongoingContracts.length > 0 ? "Yes" : "No"),
      totalOutstandingValueLkrMillion: q.totalOutstandingValueLkrMillion ?? "",
      ongoingContracts: Array.isArray(q.ongoingContracts) ? q.ongoingContracts : [],
      generalExperience: q.generalExperience || "",
      hasRdaOrIcdpExperience: q.hasRdaOrIcdpExperience || "No",
      rdaIcdpExperienceType: q.rdaIcdpExperienceType || "",
      rdaIcdpProjectDetails: q.rdaIcdpProjectDetails || "",
      peakProductionRates: q.peakProductionRates || {},
      similarWorks: Array.isArray(q.similarWorks) ? q.similarWorks : [],
      forecastedCapacity2027: q.forecastedCapacity2027 || "",
      forecastedRuralRoadKmPerYear: q.forecastedRuralRoadKmPerYear || "",
      forecastedNationalProvincialKmPerYear: q.forecastedNationalProvincialKmPerYear || "",
      preferableDistricts: Array.isArray(q.preferableDistricts) ? q.preferableDistricts : [],
      mattersForDiscussion: q.mattersForDiscussion || "",
    };

    setEditFormData(initialData);
  };

  const handleFieldChange = (fieldId: string, val: any) => {
    setEditFormData((prev) => {
      const updated: Record<string, any> = { ...prev, [fieldId]: val };

      // Participant 1 dot-notated sync
      if (fieldId.startsWith("participant1.")) {
        const key = fieldId.replace("participant1.", "");
        updated.participant1 = { ...(updated.participant1 || {}), [key]: val };
      }
      // Participant 2 dot-notated sync
      else if (fieldId.startsWith("participant2.")) {
        const key = fieldId.replace("participant2.", "");
        updated.participant2 = { ...(updated.participant2 || {}), [key]: val };
      }
      // Supplier Details dot-notated sync
      else if (fieldId.startsWith("supplierDetails.")) {
        const key = fieldId.replace("supplierDetails.", "");
        updated.supplierDetails = { ...(updated.supplierDetails || {}), [key]: val };
        if (key === "province" && val) {
          updated.provincialOffice = val;
        }
        if (key === "companyName" && updated.participantCategory === "Supplier") {
          updated.organizationName = val;
        }
      }
      // Loan commitments dot-notated sync
      else if (fieldId.startsWith("loanCommitments.")) {
        const key = fieldId.replace("loanCommitments.", "");
        updated.loanCommitments = { ...(updated.loanCommitments || {}), [key]: val };
      }

      // Participant Category Switching (Contractor <-> Supplier <-> Government Officer)
      if (fieldId === "participantCategory") {
        if (val === "Supplier") {
          const sup = { ...(updated.supplierDetails || {}) };
          if (!sup.companyName && updated.organizationName) {
            sup.companyName = updated.organizationName;
            updated["supplierDetails.companyName"] = updated.organizationName;
          }
          if (!sup.province && updated.provincialOffice) {
            sup.province = updated.provincialOffice;
            updated["supplierDetails.province"] = updated.provincialOffice;
          }
          updated.supplierDetails = sup;
        } else if (val === "Contractor") {
          if (!updated.organizationName && updated.supplierDetails?.companyName) {
            updated.organizationName = updated.supplierDetails.companyName;
          }
          if (!updated.provincialOffice && updated.supplierDetails?.province) {
            updated.provincialOffice = updated.supplierDetails.province;
          }
        }
      }

      // Organization Name Sync
      if (fieldId === "organizationName") {
        if (updated.participantCategory === "Supplier") {
          updated.supplierDetails = { ...(updated.supplierDetails || {}), companyName: val };
          updated["supplierDetails.companyName"] = val;
        }
      }

      return updated;
    });
  };

  const handleSaveEdit = async () => {
    if (!subToEdit || !editFormData) return;
    try {
      setIsSavingEdit(true);
      setEditAlert(null);

      // Assemble full clean questionnaireData
      const qDataToSave: Record<string, any> = {
        ...(subToEdit.questionnaireData || {}),
        ...editFormData,
      };

      // Ensure structured objects are synced
      qDataToSave.participant1 = {
        fullName: editFormData["participant1.fullName"] ?? editFormData.participant1?.fullName ?? "",
        designation: editFormData["participant1.designation"] ?? editFormData.participant1?.designation ?? "",
        mobileNumber: editFormData["participant1.mobileNumber"] ?? editFormData.participant1?.mobileNumber ?? "",
        email: editFormData["participant1.email"] ?? editFormData.participant1?.email ?? "",
      };

      qDataToSave.participant2 = {
        fullName: editFormData["participant2.fullName"] ?? editFormData.participant2?.fullName ?? "",
        designation: editFormData["participant2.designation"] ?? editFormData.participant2?.designation ?? "",
        mobileNumber: editFormData["participant2.mobileNumber"] ?? editFormData.participant2?.mobileNumber ?? "",
        email: editFormData["participant2.email"] ?? editFormData.participant2?.email ?? "",
      };

      const supDetails = {
        ...(editFormData.supplierDetails || {}),
        companyName: editFormData["supplierDetails.companyName"] ?? editFormData.supplierDetails?.companyName ?? editFormData.organizationName ?? "",
        materialsSupplied: editFormData["supplierDetails.materialsSupplied"] ?? editFormData.supplierDetails?.materialsSupplied ?? [],
        materialsOther: editFormData["supplierDetails.materialsOther"] ?? editFormData.supplierDetails?.materialsOther ?? "",
        locationAddress: editFormData["supplierDetails.locationAddress"] ?? editFormData.supplierDetails?.locationAddress ?? "",
        province: editFormData["supplierDetails.province"] ?? editFormData.supplierDetails?.province ?? editFormData.provincialOffice ?? "",
        district: editFormData["supplierDetails.district"] ?? editFormData.supplierDetails?.district ?? "",
        latitude: editFormData["supplierDetails.latitude"] ?? editFormData.supplierDetails?.latitude ?? "",
        longitude: editFormData["supplierDetails.longitude"] ?? editFormData.supplierDetails?.longitude ?? "",
        supplyCapacities: editFormData["supplierDetails.supplyCapacities"] ?? editFormData.supplierDetails?.supplyCapacities ?? {},
      };
      qDataToSave.supplierDetails = supDetails;

      const effectiveOrgName =
        editFormData.participantCategory === "Supplier" && supDetails.companyName
          ? supDetails.companyName
          : (editFormData.organizationName || subToEdit.contractor);

      const effectiveProvince =
        editFormData.provincialOffice || supDetails.province || subToEdit.provincialOffice;

      const res = await fetch("/api/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: subToEdit.id,
          ref: subToEdit.ref,
          updates: {
            status: editFormData.status || subToEdit.status,
            provincialOffice: effectiveProvince,
            reviewNotes: editFormData.reviewNotes || "",
            organizationName: effectiveOrgName,
            contactNumber: editFormData.contactNumber,
            email: editFormData.email,
            willParticipate: editFormData.willParticipate,
            participantCategory: editFormData.participantCategory,
            participant1: qDataToSave.participant1,
            participant2: qDataToSave.participant2,
            supplierDetails: supDetails,
            ictadRegistrationNumber: editFormData.ictadRegistrationNumber,
            cidaGrade: editFormData.cidaGrade,
            generalExperience: editFormData.generalExperience,
            hasRdaOrIcdpExperience: editFormData.hasRdaOrIcdpExperience,
            rdaIcdpExperienceType: editFormData.rdaIcdpExperienceType,
            forecastedCapacity2027: editFormData.forecastedCapacity2027,
            forecastedRuralRoadKmPerYear: editFormData.forecastedRuralRoadKmPerYear,
            forecastedNationalProvincialKmPerYear: editFormData.forecastedNationalProvincialKmPerYear,
            preferableDistricts: editFormData.preferableDistricts,
            mattersForDiscussion: editFormData.mattersForDiscussion,
            questionnaireData: qDataToSave,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditAlert({ type: "success", message: "Submission updated successfully!" });
        // Update local state immediately
        setSubmissions((prev) =>
          prev.map((s) => {
            if (s.id !== subToEdit.id) return s;
            const updatedQ = {
              ...(s.questionnaireData || {}),
              ...qDataToSave,
            };
            return {
              ...s,
              contractor: effectiveOrgName,
              category: editFormData.participantCategory || s.category,
              status: editFormData.status || s.status,
              provincialOffice: effectiveProvince,
              regNo: editFormData.ictadRegistrationNumber || s.regNo,
              grade: editFormData.cidaGrade || s.grade,
              questionnaireData: updatedQ,
            };
          })
        );
        if (selectedSub?.id === subToEdit.id) {
          setSelectedSub((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              contractor: effectiveOrgName,
              category: editFormData.participantCategory || prev.category,
              status: editFormData.status || prev.status,
              provincialOffice: effectiveProvince,
              regNo: editFormData.ictadRegistrationNumber || prev.regNo,
              grade: editFormData.cidaGrade || prev.grade,
              questionnaireData: {
                ...(prev.questionnaireData || {}),
                ...qDataToSave,
              },
            };
          });
        }
        setTimeout(() => {
          setSubToEdit(null);
          fetchSubmissions();
        }, 600);
      } else {
        setEditAlert({ type: "error", message: data.message || "Failed to save submission edits." });
      }
    } catch {
      setEditAlert({ type: "error", message: "Network error occurred while saving edits." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleSeen = async (submissionId: string, markSeen: boolean) => {
    try {
      const res = await fetch("/api/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submissionId, isViewed: markSeen }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submissionId
              ? {
                  ...s,
                  isViewed: markSeen,
                  viewedAt: data.data.viewedAt,
                  viewedByName: data.data.viewedByName,
                }
              : s
          )
        );
        setSelectedSub((prev) =>
          prev && prev.id === submissionId
            ? {
                ...prev,
                isViewed: markSeen,
                viewedAt: data.data.viewedAt,
                viewedByName: data.data.viewedByName,
              }
            : prev
        );
        setCounts((prev) => ({
          ...prev,
          unseen: Math.max(0, (prev.unseen || 0) + (markSeen ? -1 : 1)),
          seen: Math.max(0, (prev.seen || 0) + (markSeen ? 1 : -1)),
        }));
      }
    } catch (err) {
      console.error("Failed to update seen status:", err);
    }
  };

  const [isRevertingToDraft, setIsRevertingToDraft] = useState(false);

  const handlePutAsDraft = async (sub: FormattedSubmission) => {
    const confirmMessage = sub.editRequested
      ? `Contractor has requested edit permission for ${sub.ref} (${sub.contractor}).\n\nReason: "${sub.editRequestReason || "Not specified"}"\n\nDo you want to grant edit permission and revert this filing to Draft? The contractor will be able to edit and resubmit their form.`
      : `Revert registration ${sub.ref} (${sub.contractor}) to Draft? This will allow the contractor to access and edit their form.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsRevertingToDraft(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sub.id,
          ref: sub.ref,
          updates: {
            status: "Draft",
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? {
                  ...s,
                  status: "Draft",
                  editRequested: false,
                  editRequestReason: null,
                  editRequestedAt: null,
                }
              : s
          )
        );
        if (selectedSub && selectedSub.id === sub.id) {
          setSelectedSub((prev) =>
            prev
              ? {
                  ...prev,
                  status: "Draft",
                  editRequested: false,
                  editRequestReason: null,
                  editRequestedAt: null,
                }
              : null
          );
        }
        setCounts((prev) => ({
          ...prev,
          draft: (prev.draft || 0) + 1,
          submitted: Math.max(0, (prev.submitted || 0) - 1),
          editRequested: Math.max(0, (prev.editRequested || 0) - (sub.editRequested ? 1 : 0)),
        }));
        fetchSubmissions();
        alert(`Success: Registration ${sub.ref} is now set as Draft. The contractor can now edit and resubmit their form.`);
      } else {
        alert(data.message || "Failed to put submission as Draft.");
      }
    } catch {
      alert("Network error occurred while reverting submission to Draft.");
    } finally {
      setIsRevertingToDraft(false);
    }
  };

  const handleInspect = (sub: FormattedSubmission) => {
    setSelectedSub(sub);
    if (!sub.isViewed) {
      handleToggleSeen(sub.id, true);
    }
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        excludeForm: "supplier",
      });
      if (search.trim()) params.append("search", search.trim());
      if (status !== "All Statuses") params.append("status", status);
      if (province !== "All Provincial Offices") params.append("province", province);
      if (category !== "All Categories") params.append("category", category);
      if (attendance !== "All Attendance") params.append("attendance", attendance);
      if (reviewFilter !== "all") params.append("viewStatus", reviewFilter);

      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required to view submissions.");
        }
        throw new Error(`Failed to load submissions (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data || []);
        if (data.pagination) setPagination(data.pagination);
        if (data.counts) setCounts(data.counts);

        // Auto-select modal once if ref was requested in URL without filtering the table
        if (initialRef && !hasAutoOpenedRef) {
          const match = Array.isArray(data.data)
            ? data.data.find(
                (s: FormattedSubmission) =>
                  s.ref?.toLowerCase() === initialRef.toLowerCase() ||
                  s.id === initialRef ||
                  s.regNo?.toLowerCase() === initialRef.toLowerCase()
              )
            : null;

          if (match) {
            setSelectedSub(match);
            setHasAutoOpenedRef(true);
            if (!match.isViewed) {
              handleToggleSeen(match.id, true);
            }
          } else {
            // If requested ref is on a different page, fetch specifically for the detail modal
            fetch(`/api/submissions?ref=${encodeURIComponent(initialRef)}`)
              .then((r) => r.json())
              .then((d) => {
                if (d.success && Array.isArray(d.data) && d.data.length > 0) {
                  setSelectedSub(d.data[0]);
                  setHasAutoOpenedRef(true);
                }
              })
              .catch(() => {});
          }
        }
      } else {
        throw new Error(data.message || "Failed to load submissions");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, province, category, attendance, reviewFilter, initialRef, hasAutoOpenedRef]);

  useEffect(() => {
    fetchSubmissions();

    // 15s auto-polling to ensure newly submitted submissions appear automatically
    const pollInterval = setInterval(() => {
      fetchSubmissions();
    }, 15000);

    // Refresh immediately when officer switches back to this tab
    const handleFocus = () => {
      fetchSubmissions();
    };
    window.addEventListener("focus", handleFocus);

    // Refresh immediately when embedded form signals an update
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "RDA_SUBMISSION_UPDATED") {
        fetchSubmissions();
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("message", handleMessage);
    };
  }, [fetchSubmissions]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  };

  const handlePrintPdf = (sub: FormattedSubmission) => {
    // Use Blob URL to open the document in a fully independent tab.
    // This avoids the parent window freezing/blocking when the print dialog opens.
    const html = generateSubmissionHtml(sub);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const tab = window.open(url, "_blank");
    if (!tab) {
      alert("Please allow pop-ups in your browser to view or print the submission document.");
      URL.revokeObjectURL(url);
      return;
    }
    // Revoke the blob URL after a delay to free memory once the tab has loaded
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleDownloadJson = (sub: FormattedSubmission) => {
    const jsonContent = JSON.stringify(sub, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sub.ref.replace(/[\/\\:]/g, "_")}_filing.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAllCsv = async () => {
    try {
      setIsExporting(true);

      // Build query to fetch all matching records (up to 5000) using current filters
      const params = new URLSearchParams({
        page: "1",
        limit: "5000",
        excludeForm: "supplier",
      });
      if (search.trim()) params.append("search", search.trim());
      if (status !== "All Statuses") params.append("status", status);
      if (province !== "All Provincial Offices") params.append("province", province);
      if (category !== "All Categories") params.append("category", category);
      if (attendance !== "All Attendance") params.append("attendance", attendance);
      if (reviewFilter !== "all") params.append("viewStatus", reviewFilter);

      let dataToExport = submissions;
      try {
        const res = await fetch(`/api/submissions?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            dataToExport = json.data;
          }
        }
      } catch {
        // Fallback to local state if network fetch fails
      }

      if (!dataToExport || dataToExport.length === 0) {
        alert("No submission records available to export.");
        return;
      }

      const headers = [
        // Filing & Administrative Identification
        "Reference Number",
        "Organization / Entity Name",
        "Category",
        "Filing Status",
        "Review Status",
        "Reviewed By",
        "Created Date",
        "Last Updated Date",
        "Filing Submitted Date",

        // Section 1: Basic Information
        "Official Contact Number",
        "Official Email Address",
        "Workshop Attendance (07 Dec 2026)",

        // Section 3: Nominated Representatives
        "Participant 1: Full Name",
        "Participant 1: Designation",
        "Participant 1: Mobile Number",
        "Participant 1: Email",
        "Participant 2: Full Name",
        "Participant 2: Designation",
        "Participant 2: Mobile Number",
        "Participant 2: Email",

        // Section 4 (Contractor): Accreditation
        "Contractor: ICTAD / CIDA Registration No",
        "Contractor: CIDA Grading",
        "Contractor: Areas of Specialty",
        "Provincial Office",
        "District",

        // Section 4 (Supplier): Materials & Capacity
        "Supplier: Company Name",
        "Supplier: Materials Supplied",
        "Supplier: Location Address",
        "Supplier: Province",
        "Supplier: District",
        "Supplier: GPS Latitude",
        "Supplier: GPS Longitude",
        "Supplier: Supply Capacities",

        // Section 5: Financial Capability (5-Year Statements)
        "Financials 2024/25: Total Revenue (LKR)",
        "Financials 2024/25: Profit Before Tax (LKR)",
        "Financials 2024/25: Working Capital (LKR)",
        "Financials 2024/25: Total Assets (LKR)",
        "Financials 2024/25: Total Liabilities (LKR)",
        "Financials 2024/25: Total Equity (LKR)",
        "Financials 2023/24: Total Revenue (LKR)",
        "Financials 2023/24: Profit Before Tax (LKR)",
        "Financials 2022/23: Total Revenue (LKR)",
        "Financials 2022/23: Profit Before Tax (LKR)",
        "Financials 2021/22: Total Revenue (LKR)",
        "Financials 2021/22: Profit Before Tax (LKR)",
        "Financials 2020/21: Total Revenue (LKR)",
        "Financials 2020/21: Profit Before Tax (LKR)",

        // Section 6: Loan Commitments
        "Loan Commitments: 2-Year Repayments Due 2026-2028 (LKR)",

        // Section 7 & 8: Work Commitments & Ongoing Works
        "Has Ongoing Contracts",
        "Total Outstanding Works Value (LKR Million)",
        "Ongoing Contract 1 (Name | Value | Due Date | Employer)",
        "Ongoing Contract 2 (Name | Value | Due Date | Employer)",
        "Ongoing Contract 3 (Name | Value | Due Date | Employer)",

        // Section 9: Experience & Peak Production Rates
        "General Construction Experience",
        "Past RDA or ICDP Experience",
        "RDA / ICDP Engagement Entity",
        "RDA / ICDP Project Details",
        "Peak Production: Asphalt Concrete (SQM/12mo)",
        "Peak Production: Concrete (Cum/12mo)",
        "Peak Production: Aggregate Base Course ABC (Cum/12mo)",

        // Section 10: Similar Work Experience & Future Forecast
        "Similar Contract 1 (Name | Value | Status | Type)",
        "Similar Contract 2 (Name | Value | Status | Type)",
        "Similar Contract 3 (Name | Value | Status | Type)",
        "Forecasted Annual Turnover 2027 (LKR Million)",
        "Forecasted Rural Road Length (Km/Year)",
        "Forecasted National / Provincial Road Length (Km/Year)",
        "Preferable Operating Districts",

        // Section 10 Part C: Contract Non-Performance & Litigation
        "Historical Litigation / Non-Performance Type",
        "Litigation: Contract Identification",
        "Litigation: Employer Name",
        "Litigation: Reason for Dispute / Non-Performance",
        "Litigation: Matter in Dispute",

        // Section 11: Matters for Discussion
        "Matters, Concerns & Suggestions for Discussion",
      ];

      const rows = dataToExport.map((s) => {
        const q = s.questionnaireData || {};
        const reg =
          q.ictadRegistrationNumber ||
          (s.regNo &&
          !s.regNo.startsWith("DFT-") &&
          !s.regNo.startsWith("REG-") &&
          s.regNo !== "N/A" &&
          s.regNo !== "Not Registered"
            ? s.regNo
            : "");
        const prov =
          q.supplierDetails?.province ||
          (q.province && q.province !== "Western Province" ? q.province : "") ||
          (q.participantCategory === "Supplier" ? s.provincialOffice : "") ||
          s.provincialOffice ||
          "";
        const dist =
          q.supplierDetails?.district ||
          (q.district && q.district !== "Unassigned District" ? q.district : "") ||
          "";

        // Specialty
        const specialty = Array.isArray(q.areasOfSpecialty)
          ? q.areasOfSpecialty.join("; ")
          : (q.areasOfSpecialty || "");

        // Materials supplied
        const materials = Array.isArray(q.supplierDetails?.materialsSupplied)
          ? q.supplierDetails.materialsSupplied.join("; ")
          : (q.supplierDetails?.materialsSupplied || "");

        // Supply capacities
        const capacities = q.supplierDetails?.supplyCapacities
          ? Object.entries(q.supplierDetails.supplyCapacities)
              .map(([mat, val]: any) => `${mat}: ${val?.quantity || ""} ${val?.unit || ""}`)
              .join("; ")
          : "";

        // Preferable districts
        const prefDistricts = Array.isArray(q.preferableDistricts)
          ? q.preferableDistricts.join("; ")
          : (q.preferableDistricts || "");

        // Ongoing contracts format helper
        const formatContract = (c: any) =>
          c && c.contractName
            ? `${c.contractName}${c.contractAmount ? ` | LKR ${Number(c.contractAmount).toLocaleString()}` : ""}${c.completionDate ? ` | Due: ${c.completionDate}` : ""}${c.employerName ? ` | Employer: ${c.employerName}` : ""}`
            : "";

        // Similar contracts format helper
        const formatSimilar = (c: any) =>
          c && c.contractName
            ? `${c.contractName}${c.contractAmount ? ` | LKR ${Number(c.contractAmount).toLocaleString()}` : ""}${c.completionStatus ? ` | Status: ${c.completionStatus}` : ""}${c.contractType ? ` | Type: ${c.contractType}` : ""}`
            : "";

        // Peak production rates
        const peakAsphalt = q.peakProductionRates?.asphaltConcrete ?? "";
        const peakConcrete = q.peakProductionRates?.concrete ?? "";
        const peakAbc = q.peakProductionRates?.abc ?? "";

        // Financials (2020/21 - 2024/25)
        const fin24 = q.financialStatements?.["2024/25"] || {};
        const fin23 = q.financialStatements?.["2023/24"] || {};
        const fin22 = q.financialStatements?.["2022/23"] || {};
        const fin21 = q.financialStatements?.["2021/22"] || {};
        const fin20 = q.financialStatements?.["2020/21"] || {};

        return [
          s.ref,
          s.contractor,
          q.participantCategory || "General",
          s.status,
          s.isViewed ? "Seen / Checked" : "Unseen",
          s.viewedByName || "",
          s.createdAt || "",
          s.updatedAt || "",
          s.submittedAt || "",

          q.contactNumber || "",
          q.email || "",
          q.willParticipate || "",

          q.participant1?.fullName || "",
          q.participant1?.designation || "",
          q.participant1?.mobileNumber || "",
          q.participant1?.email || "",
          q.participant2?.fullName || "",
          q.participant2?.designation || "",
          q.participant2?.mobileNumber || "",
          q.participant2?.email || "",

          reg,
          q.cidaGrade || (s.grade && s.grade !== "Pending" && s.grade !== "N/A" ? s.grade : ""),
          specialty,
          prov,
          dist,

          q.supplierDetails?.companyName || "",
          materials,
          q.supplierDetails?.locationAddress || "",
          q.supplierDetails?.province || "",
          q.supplierDetails?.district || "",
          q.supplierDetails?.latitude ?? "",
          q.supplierDetails?.longitude ?? "",
          capacities,

          fin24.totalRevenue ?? "",
          fin24.profitBeforeTax ?? "",
          fin24.workingCapital ?? "",
          fin24.totalAssets ?? "",
          fin24.totalLiabilities ?? "",
          fin24.totalEquity ?? "",

          fin23.totalRevenue ?? "",
          fin23.profitBeforeTax ?? "",
          fin22.totalRevenue ?? "",
          fin22.profitBeforeTax ?? "",
          fin21.totalRevenue ?? "",
          fin21.profitBeforeTax ?? "",
          fin20.totalRevenue ?? "",
          fin20.profitBeforeTax ?? "",

          q.loanCommitments?.twoYearRepaymentsDue2026To2028 ?? "",

          q.hasOngoingContracts || "",
          q.totalOutstandingValueLkrMillion ?? "",
          formatContract(q.ongoingContracts?.[0]),
          formatContract(q.ongoingContracts?.[1]),
          formatContract(q.ongoingContracts?.[2]),

          q.generalExperience || "",
          q.hasRdaOrIcdpExperience || "",
          q.rdaIcdpExperienceType || "",
          q.rdaIcdpProjectDetails || "",
          peakAsphalt,
          peakConcrete,
          peakAbc,

          formatSimilar(q.similarWorks?.[0]),
          formatSimilar(q.similarWorks?.[1]),
          formatSimilar(q.similarWorks?.[2]),
          q.forecastedCapacity2027 ?? "",
          q.forecastedRuralRoadKmPerYear ?? "",
          q.forecastedNationalProvincialKmPerYear ?? "",
          prefDistricts,

          q.historicalLitigationType || "None",
          q.historicalContractIdentification || "",
          q.historicalEmployerName || "",
          q.historicalReason || "",
          q.historicalMatterDispute || "",

          q.mattersForDiscussion || "",
        ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`);
      });

      const csvContent =
        "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `RDA_Submissions_All_Fields_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      alert("Failed to export submissions: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s?.toLowerCase()) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            SUBMITTED
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            Under Review
          </span>
        );
      case "verified":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Verified
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            DRAFT (Incomplete)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            {s || "Action Required"}
          </span>
        );
    }
  };

  const getCategoryBadge = (sub: FormattedSubmission) => {
    const q = sub.questionnaireData || {};
    const cat = q.participantCategory;
    const willAttend = q.willParticipate;

    if (willAttend === "No") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <UserX className="w-3 h-3 text-slate-500" />
          Non-Attendee
        </span>
      );
    }

    if (cat === "Contractor") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-200/60">
          <Briefcase className="w-3 h-3 text-blue-700" />
          Contractor
        </span>
      );
    }

    if (cat === "Supplier") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-200/60">
          <Truck className="w-3 h-3 text-purple-700" />
          Supplier
        </span>
      );
    }

    if (cat === "Government Officer") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200/60">
          <Landmark className="w-3 h-3 text-emerald-700" />
          Gov Officer
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
        General
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Contractor Data Submissions
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review and verification console for incoming contractor questionnaire responses and filings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchSubmissions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-900" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportAllCsv}
            disabled={loading || isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            title="Export all submissions with all form fields to Excel (CSV)"
          >
            {isExporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>{isExporting ? "Exporting All Fields..." : "Export to Excel (CSV)"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Registrations</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{counts.all}</h3>
          <span className="text-[11px] text-slate-500 font-medium">All recorded entities</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Submitted Filings</p>
          <h3 className="text-2xl font-black text-blue-900 mt-1">{counts.submitted}</h3>
          <span className="text-[11px] text-blue-600 font-medium">Completed registrations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-300 bg-amber-50/30 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Unseen (Not Checked)</p>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          </div>
          <h3 className="text-2xl font-black text-amber-700 mt-1">{counts.unseen ?? 0}</h3>
          <span className="text-[11px] text-amber-800 font-medium">Still didn't see by admin</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Seen & Checked</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">{counts.seen ?? 0}</h3>
          <span className="text-[11px] text-emerald-700 font-medium">Verified by officer</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Saved Drafts</p>
          <h3 className="text-2xl font-black text-slate-700 mt-1">{counts.draft}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Incomplete registrations</span>
        </div>
      </div>

      {/* Primary Lifecycle & Review Views: All, Unseen (New), Seen (Checked), Submitted, Drafts */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setStatus("All Statuses");
            setReviewFilter("all");
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            status === "All Statuses" && reviewFilter === "all"
              ? "bg-blue-950 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <span>All Registrations</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            status === "All Statuses" && reviewFilter === "all" ? "bg-blue-800 text-blue-100" : "bg-slate-200 text-slate-700"
          }`}>
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setReviewFilter(reviewFilter === "unseen" ? "all" : "unseen");
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            reviewFilter === "unseen"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
          }`}
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Unseen / Not Checked</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            reviewFilter === "unseen" ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-900"
          }`}>
            {counts.unseen ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setReviewFilter(reviewFilter === "seen" ? "all" : "seen");
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            reviewFilter === "seen"
              ? "bg-emerald-700 text-white shadow-sm"
              : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Seen / Checked</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            reviewFilter === "seen" ? "bg-emerald-800 text-white" : "bg-emerald-200 text-emerald-900"
          }`}>
            {counts.seen ?? 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatus("submitted");
            setReviewFilter("all");
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            status === "submitted" && reviewFilter === "all"
              ? "bg-blue-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Submitted</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            status === "submitted" && reviewFilter === "all" ? "bg-blue-800 text-blue-100" : "bg-slate-200 text-slate-700"
          }`}>
            {counts.submitted}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatus("draft");
            setReviewFilter("all");
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            status === "draft"
              ? "bg-amber-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>Drafts</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            status === "draft" ? "bg-amber-800 text-amber-100" : "bg-slate-200 text-slate-700"
          }`}>
            {counts.draft}
          </span>
        </button>

        {Boolean(counts.editRequested) && (
          <button
            type="button"
            onClick={() => {
              setStatus("edit_requested");
              setReviewFilter("all");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              status === "edit_requested"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Edit Requested</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              status === "edit_requested" ? "bg-amber-800 text-amber-100" : "bg-amber-200 text-amber-950 font-black"
            }`}>
              {counts.editRequested}
            </span>
          </button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by submission ref or office..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent transition-all"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <select
            value={reviewFilter}
            onChange={(e) => {
              setReviewFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="all">All Reviews (Seen & Unseen)</option>
            <option value="unseen">Unseen / Not Checked Only</option>
            <option value="seen">Seen / Checked Only</option>
          </select>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={attendance}
            onChange={(e) => {
              setAttendance(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            {ATTENDANCE_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("All Statuses");
              setCategory("All Categories");
              setAttendance("All Attendance");
              setProvince("All Provincial Offices");
              setReviewFilter("all");
              setPage(1);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all shrink-0"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Submissions Table / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
            <span className="text-xs font-medium text-slate-500">Querying submission records...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <Inbox className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Submissions Recorded</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Contractor questionnaire submissions and declaration filings will appear here as they are received for provincial engineer review.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Reference No</th>
                  <th className="px-4 py-3">Organization / Firm</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Review Status</th>
                  <th className="px-4 py-3">Registration Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3">Final Submission</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    className={`transition-colors ${
                      s.isViewed
                        ? "hover:bg-slate-50/75"
                        : "bg-amber-50/25 hover:bg-amber-50/50 border-l-4 border-l-amber-500 font-medium"
                    }`}
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-blue-950">
                      <div className="flex items-center gap-2">
                        {!s.isViewed && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping" title="Unseen submission" />
                        )}
                        <span>{s.ref}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{s.contractor}</p>
                        {!s.isViewed && (
                          <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-500 text-white tracking-wide">
                            NEW
                          </span>
                        )}
                      </div>
                      {(() => {
                        const ictad = s.questionnaireData?.ictadRegistrationNumber;
                        const hasRealReg =
                          s.regNo &&
                          !s.regNo.startsWith("DFT-") &&
                          !s.regNo.startsWith("REG-") &&
                          s.regNo !== "N/A" &&
                          s.regNo !== "Not Registered";
                        if (ictad) return <p className="text-[11px] text-slate-500 font-mono mt-0.5">ICTAD: {ictad}</p>;
                        if (hasRealReg) return <p className="text-[11px] text-slate-500 font-mono mt-0.5">Reg: {s.regNo}</p>;
                        return null;
                      })()}
                    </td>
                    <td className="px-4 py-3.5">{getCategoryBadge(s)}</td>
                    <td className="px-4 py-3.5">
                      {s.isViewed ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Seen / Checked</span>
                          </span>
                          {s.viewedByName && (
                            <span className="text-[10px] text-slate-500 mt-0.5">by {s.viewedByName}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                            <span>Unseen</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleSeen(s.id, true)}
                            className="text-[10px] text-blue-700 hover:text-blue-900 font-bold hover:underline"
                            title="Mark as Seen"
                          >
                            Mark Seen
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {getStatusBadge(s.status)}
                      {s.editRequested && (
                        <div className="mt-1">
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                            title={`Contractor requested edit: ${s.editRequestReason || "Amendments needed"}`}
                          >
                            ⚠️ Edit Requested
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{s.createdAt || "—"}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{s.updatedAt || s.createdAt || "—"}</td>
                    <td className="px-4 py-3.5">
                      {s.submittedAt ? (
                        <span className="font-bold text-emerald-800 font-mono text-[11px]">{s.submittedAt}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 font-semibold">
                          <Clock className="w-3 h-3 text-amber-500" /> Draft (Pending)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspect(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                          title="Inspect Submission Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200/60 transition-all"
                          title="Edit Submission Data"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintPdf(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200/60 transition-all"
                          title="Download Official PDF / Print"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>PDF</span>
                        </button>
                        {s.status !== "Draft" ? (
                          <button
                            type="button"
                            onClick={() => handlePutAsDraft(s)}
                            disabled={isRevertingToDraft}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg border transition-all ${
                              s.editRequested
                                ? "text-amber-950 bg-amber-200 hover:bg-amber-300 border-amber-400 shadow-2xs font-extrabold"
                                : "text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300"
                            }`}
                            title={
                              s.editRequested
                                ? `Contractor requested edit: "${s.editRequestReason || "Amendments required"}". Click to approve & put as draft.`
                                : "Revert this submission to Draft so contractor can edit their responses"
                            }
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                            <span>Put as Draft</span>
                          </button>
                        ) : (
                          <a
                            href={`/register?ref=${encodeURIComponent(s.ref)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200/60 transition-all"
                            title="Open / Resume Contractor Form"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-700" />
                            <span>Form</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(s)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200/60 transition-all"
                          title="Delete Submission Record"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span className="sr-only sm:not-sr-only">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && submissions.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Showing {submissions.length} of {pagination.totalCount} records (Page {pagination.page} of{" "}
              {pagination.totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Inspection Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
                  RDA Stakeholder Questionnaire Filing
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedSub.ref}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintPdf(selectedSub)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
                  title="Download Official PDF / Print"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Review Status Alert Banner */}
            {selectedSub.isViewed ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      Submission Checked & Seen
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Seen by <strong>{selectedSub.viewedByName || "RDA Officer"}</strong>{" "}
                      {selectedSub.viewedAt ? `on ${selectedSub.viewedAt}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSeen(selectedSub.id, false)}
                  className="px-3 py-1 text-xs font-bold text-emerald-900 bg-white hover:bg-emerald-100 rounded-lg border border-emerald-300 transition-colors shadow-2xs self-start sm:self-auto"
                >
                  Mark as Unread
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse shadow-xs">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      New Submission — Still Didn't See
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      This registration has not been verified or checked by an RDA officer yet.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSeen(selectedSub.id, true)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
                >
                  Mark as Seen
                </button>
              </div>
            )}

            {/* Contractor Edit Permission Request Banner & Put as Draft Action */}
            {selectedSub.editRequested ? (
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-amber-950 text-xs sm:text-sm">
                      Contractor Requested Edit Permission
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 uppercase">
                      Action Needed
                    </span>
                  </div>
                  {selectedSub.editRequestReason && (
                    <p className="text-xs text-amber-900 bg-white/80 p-2.5 rounded-lg border border-amber-200 font-mono mt-1">
                      <strong>Reason:</strong> {selectedSub.editRequestReason}
                    </p>
                  )}
                  {selectedSub.editRequestedAt && (
                    <p className="text-[11px] text-amber-800">
                      Requested Date: <strong>{selectedSub.editRequestedAt}</strong>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handlePutAsDraft(selectedSub)}
                  disabled={isRevertingToDraft}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all shrink-0 min-h-[40px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Grant Access &amp; Put as Draft</span>
                </button>
              </div>
            ) : selectedSub.status !== "Draft" ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">
                  Allow contractor to edit? Setting to Draft reactivates their form so they can update details.
                </span>
                <button
                  type="button"
                  onClick={() => handlePutAsDraft(selectedSub)}
                  disabled={isRevertingToDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Put as Draft</span>
                </button>
              </div>
            ) : null}

            {/* Basic Info Bar */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-slate-900 text-sm">{selectedSub.contractor}</p>
                {(() => {
                  const ictad = selectedSub.questionnaireData?.ictadRegistrationNumber;
                  const hasRealReg =
                    selectedSub.regNo &&
                    !selectedSub.regNo.startsWith("DFT-") &&
                    !selectedSub.regNo.startsWith("REG-") &&
                    selectedSub.regNo !== "N/A" &&
                    selectedSub.regNo !== "Not Registered";
                  const hasGrade =
                    selectedSub.grade &&
                    selectedSub.grade !== "Pending" &&
                    selectedSub.grade !== "N/A";
                  if (!ictad && !hasRealReg && !hasGrade) return null;
                  return (
                    <p className="text-slate-500 font-mono mt-0.5">
                      {ictad ? `ICTAD: ${ictad}` : hasRealReg ? `Reg No: ${selectedSub.regNo}` : ""}
                      {(ictad || hasRealReg) && hasGrade ? " • " : ""}
                      {hasGrade ? `CIDA Grade: ${selectedSub.grade}` : ""}
                    </p>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Status:</span>
                {getStatusBadge(selectedSub.status)}
              </div>
            </div>

            {/* Registration Lifecycle & Audit Trail */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide block">
                Registration Lifecycle &amp; Audit Trail
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Reference Number</span>
                  <p className="font-bold font-mono text-blue-950 text-xs">{selectedSub.ref}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Registration Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedSub.status)}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Created Date</span>
                  <p className="font-mono text-slate-800 text-[11px]">{selectedSub.createdAt || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Final Submission Date</span>
                  <p className="font-mono text-[11px]">
                    {selectedSub.submittedAt ? (
                      <span className="font-bold text-emerald-700">{selectedSub.submittedAt}</span>
                    ) : (
                      <span className="text-amber-700 font-medium italic">Not Submitted (Draft)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Questionnaire Content */}
            {selectedSub.questionnaireData ? (
              <div className="space-y-4 text-xs">
                {/* Workshop Attendance & Category */}
                <div className="p-3.5 rounded-xl border border-blue-200/60 bg-blue-50/50 space-y-2">
                  <span className="font-bold text-blue-950 uppercase text-[11px] tracking-wide">
                    Workshop Attendance &amp; Category
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Attending 07 Dec 2026</span>
                      <p className="font-bold text-slate-800">
                        {selectedSub.questionnaireData.willParticipate === "No"
                          ? "No (Declined)"
                          : "Yes (Participating)"}
                      </p>
                    </div>
                    {selectedSub.questionnaireData.participantCategory && (
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Category</span>
                        <p className="font-bold text-blue-900">
                          {selectedSub.questionnaireData.participantCategory}
                        </p>
                      </div>
                    )}
                    {selectedSub.questionnaireData.contactNumber && (
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Primary Contact</span>
                        <p className="font-mono text-slate-800">
                          {selectedSub.questionnaireData.contactNumber}
                        </p>
                      </div>
                    )}
                    {selectedSub.questionnaireData.email && (
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Official Email</span>
                        <p className="font-mono text-slate-800">
                          {selectedSub.questionnaireData.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* NON-ATTENDEE NOTICE */}
                {selectedSub.questionnaireData.willParticipate === "No" && (
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 space-y-1">
                    <p className="font-bold text-xs">Non-Attendee Registration Record</p>
                    <p className="text-[11px] text-slate-500">
                      The entity indicated that they will not be participating in the workshop on 07 December 2026. Basic organizational and contact information was recorded directly.
                    </p>
                  </div>
                )}

                {/* Attendees (Government Officer or Contractor) */}
                {selectedSub.questionnaireData.willParticipate === "Yes" &&
                  selectedSub.questionnaireData.participantCategory !== "Supplier" &&
                  selectedSub.questionnaireData.participant1?.fullName && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                      Registered Attendees
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                        <span className="text-[10px] font-bold text-blue-900 uppercase">Participant 1</span>
                        <p className="font-bold text-slate-900">{selectedSub.questionnaireData.participant1.fullName}</p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          {selectedSub.questionnaireData.participant1.designation} &bull; {selectedSub.questionnaireData.participant1.mobileNumber}
                        </p>
                      </div>
                      {selectedSub.questionnaireData.participant2?.fullName && (
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                          <span className="text-[10px] font-bold text-slate-700 uppercase">Participant 2 (Optional)</span>
                          <p className="font-bold text-slate-900">{selectedSub.questionnaireData.participant2.fullName}</p>
                          <p className="text-slate-500 font-mono text-[11px]">
                            {selectedSub.questionnaireData.participant2.designation} &bull; {selectedSub.questionnaireData.participant2.mobileNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUPPLIER DETAILS */}
                {selectedSub.questionnaireData.willParticipate === "Yes" &&
                  selectedSub.questionnaireData.participantCategory === "Supplier" && (
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                    <span className="font-bold text-purple-950 uppercase text-[11px] tracking-wide block">
                      Supplier Production &amp; Material Capacity
                    </span>

                    {/* Single Representative */}
                    {selectedSub.questionnaireData.participant1?.fullName && (
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-purple-900 uppercase">Supplier Representative</span>
                        <p className="font-bold text-slate-900">{selectedSub.questionnaireData.participant1.fullName}</p>
                        <p className="text-slate-500 font-mono text-[11px]">
                          {selectedSub.questionnaireData.participant1.designation} &bull; {selectedSub.questionnaireData.participant1.mobileNumber}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Company Name</span>
                        <p className="font-bold text-slate-900">
                          {selectedSub.questionnaireData.supplierDetails?.companyName || selectedSub.contractor}
                        </p>
                      </div>
                      {(selectedSub.questionnaireData.supplierDetails?.province ||
                        selectedSub.questionnaireData.supplierDetails?.district ||
                        selectedSub.questionnaireData.supplierDetails?.locationAddress) && (
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Location &amp; Province</span>
                          <p className="font-medium text-slate-800">
                            {[
                              selectedSub.questionnaireData.supplierDetails?.province,
                              selectedSub.questionnaireData.supplierDetails?.district,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                          {selectedSub.questionnaireData.supplierDetails?.locationAddress && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {selectedSub.questionnaireData.supplierDetails.locationAddress}
                            </p>
                          )}
                          {(selectedSub.questionnaireData.supplierDetails?.latitude || selectedSub.questionnaireData.supplierDetails?.longitude) && (
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-purple-900 font-mono">
                              <span>📍 GPS: {selectedSub.questionnaireData.supplierDetails.latitude}, {selectedSub.questionnaireData.supplierDetails.longitude}</span>
                              <a
                                href={`https://www.google.com/maps?q=${selectedSub.questionnaireData.supplierDetails.latitude},${selectedSub.questionnaireData.supplierDetails.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline font-sans text-[10px] ml-1 hover:text-blue-800"
                              >
                                View on Map ↗
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Materials Supplied */}
                    {selectedSub.questionnaireData.supplierDetails?.materialsSupplied && (
                      <div className="pt-2 border-t border-purple-200/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold">Supplied Materials:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedSub.questionnaireData.supplierDetails.materialsSupplied.map((m: string) => (
                            <span key={m} className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 text-[11px] font-semibold">
                              {m === "Other" && selectedSub.questionnaireData.supplierDetails?.materialsOther
                                ? `Other (${selectedSub.questionnaireData.supplierDetails.materialsOther})`
                                : m}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capacities Table */}
                    {selectedSub.questionnaireData.supplierDetails?.supplyCapacities &&
                      Object.keys(selectedSub.questionnaireData.supplierDetails.supplyCapacities).length > 0 && (
                      <div className="pt-2 border-t border-purple-200/60">
                        <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">
                          Declared Supply / Production Capacities:
                        </span>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                              <tr>
                                <th className="p-2">Material</th>
                                <th className="p-2">Annual Capacity Quantity</th>
                                <th className="p-2">Unit</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {Object.entries(selectedSub.questionnaireData.supplierDetails.supplyCapacities).map(
                                ([mat, cap]: [string, any]) => (
                                  <tr key={mat}>
                                    <td className="p-2 font-medium text-slate-900">{mat}</td>
                                    <td className="p-2 font-mono font-bold text-purple-950">
                                      {cap?.quantity !== null && cap?.quantity !== undefined && cap?.quantity !== ""
                                        ? cap.quantity
                                        : "—"}
                                    </td>
                                    <td className="p-2 text-slate-600">{cap?.unit || "MT per year"}</td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Contractor Details */}
                {selectedSub.questionnaireData.participantCategory === "Contractor" && (
                  <>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                        Contractor Capacity &amp; Experience
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        {selectedSub.questionnaireData.ictadRegistrationNumber && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">ICTAD Reg No</span>
                            <p className="font-bold font-mono text-slate-800">{selectedSub.questionnaireData.ictadRegistrationNumber}</p>
                          </div>
                        )}
                        {selectedSub.questionnaireData.cidaGrade && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">CIDA Grade</span>
                            <p className="font-bold text-slate-800">
                              {selectedSub.questionnaireData.cidaGrade === "Other" && selectedSub.questionnaireData.cidaGradeOther
                                ? `Other (${selectedSub.questionnaireData.cidaGradeOther})`
                                : selectedSub.questionnaireData.cidaGrade}
                            </p>
                          </div>
                        )}
                        {selectedSub.questionnaireData.generalExperience && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">General Experience</span>
                            <p className="font-semibold text-slate-800">{selectedSub.questionnaireData.generalExperience}</p>
                          </div>
                        )}
                        {selectedSub.questionnaireData.hasRdaOrIcdpExperience && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">RDA / ICDP Experience</span>
                            <p className="font-semibold text-slate-800">
                              {selectedSub.questionnaireData.hasRdaOrIcdpExperience === "Yes"
                                ? `Yes (${selectedSub.questionnaireData.rdaIcdpExperienceType || "RDA/ICDP"}${selectedSub.questionnaireData.rdaIcdpProjectDetails ? ` - ${selectedSub.questionnaireData.rdaIcdpProjectDetails}` : ""})`
                                : "No"}
                            </p>
                          </div>
                        )}
                        {selectedSub.questionnaireData.hasOngoingContracts && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">Ongoing Contracts</span>
                            <p className="font-semibold text-slate-800">{selectedSub.questionnaireData.hasOngoingContracts}</p>
                          </div>
                        )}
                      </div>
                      {selectedSub.questionnaireData.areasOfSpecialty && (
                        <div className="pt-2">
                          <span className="text-slate-500 text-[10px] uppercase font-bold">Specialties:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedSub.questionnaireData.areasOfSpecialty.map((s: string) => {
                              if (s === "Other" && selectedSub.questionnaireData.specialtyOther) {
                                const others = selectedSub.questionnaireData.specialtyOther
                                  .split(",")
                                  .map((item: string) => item.trim())
                                  .filter(Boolean);
                                return others.length > 0 ? (
                                  others.map((oth: string, oIdx: number) => {
                                    const grade = selectedSub.questionnaireData?.specialtyGrades?.[oth];
                                    return (
                                      <span
                                        key={`oth-${oIdx}`}
                                        className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-medium"
                                      >
                                        Other: {oth} {grade ? `• Grade: ${grade}` : ""}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span
                                    key={s}
                                    className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-medium"
                                  >
                                    Other
                                  </span>
                                );
                              }
                              const spGrade = selectedSub.questionnaireData?.specialtyGrades?.[s];
                              return (
                                <span key={s} className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-medium">
                                  {s} {spGrade ? `• Grade: ${spGrade}` : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Peak Production Rates */}
                      {selectedSub.questionnaireData.peakProductionRates && (
                        selectedSub.questionnaireData.peakProductionRates.asp !== null ||
                        selectedSub.questionnaireData.peakProductionRates.concrete !== null ||
                        selectedSub.questionnaireData.peakProductionRates.abc !== null
                      ) && (
                        <div className="pt-2.5 border-t border-slate-200/80 space-y-1.5">
                          <span className="text-slate-500 text-[10px] uppercase font-bold block">
                            Peak Production Rate (12 Months within Last 10 Years):
                          </span>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-medium block">Asp (SQM)</span>
                              <span className="font-bold text-slate-900 font-mono text-xs">
                                {selectedSub.questionnaireData.peakProductionRates.asp !== null && selectedSub.questionnaireData.peakProductionRates.asp !== undefined
                                  ? Number(selectedSub.questionnaireData.peakProductionRates.asp).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-medium block">Concrete (Cum)</span>
                              <span className="font-bold text-slate-900 font-mono text-xs">
                                {selectedSub.questionnaireData.peakProductionRates.concrete !== null && selectedSub.questionnaireData.peakProductionRates.concrete !== undefined
                                  ? Number(selectedSub.questionnaireData.peakProductionRates.concrete).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-medium block">ABC (Cum)</span>
                              <span className="font-bold text-slate-900 font-mono text-xs">
                                {selectedSub.questionnaireData.peakProductionRates.abc !== null && selectedSub.questionnaireData.peakProductionRates.abc !== undefined
                                  ? Number(selectedSub.questionnaireData.peakProductionRates.abc).toLocaleString()
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ongoing Works (If hasOngoingContracts === "Yes") */}
                    {selectedSub.questionnaireData.hasOngoingContracts === "Yes" && (
                      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                        <span className="font-bold text-blue-950 uppercase text-[11px] tracking-wide block">
                          Ongoing Works &amp; Outstanding Commitments
                        </span>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-medium">Total Value of Outstanding Works (as at 01 Dec 2026):</span>
                          <span className="font-mono font-bold text-blue-950">
                            {selectedSub.questionnaireData.totalOutstandingValueLkrMillion !== null &&
                            selectedSub.questionnaireData.totalOutstandingValueLkrMillion !== undefined
                              ? `LKR ${Number(selectedSub.questionnaireData.totalOutstandingValueLkrMillion).toLocaleString()}`
                              : "LKR 0"}
                          </span>
                        </div>

                        {selectedSub.questionnaireData.ongoingContracts && (
                          <div className="space-y-1.5 pt-1">
                            {selectedSub.questionnaireData.ongoingContracts.map((oc: any, idx: number) => {
                              if (!oc || !oc.contractName) return null;
                              return (
                                <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900">Contract {idx + 1}: </span>
                                    <span className="font-semibold text-slate-800">{oc.contractName}</span>
                                    {oc.contractNo && (
                                      <span className="ml-2 text-[10px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded">
                                        No: {oc.contractNo}
                                      </span>
                                    )}
                                    {oc.employerName && (
                                      <p className="text-[11px] text-slate-500 mt-0.5">Employer: {oc.employerName}</p>
                                    )}
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-bold text-slate-800">
                                      {oc.currency || "LKR"} {oc.contractAmount !== null ? Number(oc.contractAmount).toLocaleString() : "—"}
                                    </span>
                                    {oc.completionDate && (
                                      <p className="text-[10px] text-slate-500">Exp. Completion: {oc.completionDate}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Similar Works Contracts */}
                    {selectedSub.questionnaireData.similarWorks && (
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                          Prior Similar Works (Contracts 1, 2, 3)
                        </span>
                        <div className="space-y-2 pt-1">
                          {selectedSub.questionnaireData.similarWorks.map((cw: any, idx: number) => {
                            if (!cw || !cw.contractName || cw.contractName.trim().toUpperCase() === "N/A" || !cw.contractName.trim()) return null;
                            return (
                              <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div>
                                  <span className="font-bold text-blue-950">Contract {idx + 1}: </span>
                                  <span className="font-medium text-slate-800">{cw.contractName}</span>
                                  {cw.contractType && (
                                    <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                      {cw.contractType}
                                    </span>
                                  )}
                                </div>
                                {cw.contractAmount ? (
                                  <div className="text-right shrink-0">
                                    <span className="font-mono font-bold text-slate-900">LKR {Number(cw.contractAmount).toLocaleString()}</span>
                                    {cw.completionStatus && <p className="text-[10px] text-slate-500">{cw.completionStatus}</p>}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Forecasted Annual Capacity & Preferable Districts (Section 10 Part B) */}
                    {(selectedSub.questionnaireData.forecastedCapacity2027 ||
                      selectedSub.questionnaireData.forecastedRuralRoadKmPerYear ||
                      selectedSub.questionnaireData.forecastedNationalProvincialKmPerYear ||
                      (Array.isArray(selectedSub.questionnaireData.preferableDistricts) &&
                        selectedSub.questionnaireData.preferableDistricts.length > 0)) && (
                      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                        <span className="font-bold text-emerald-950 uppercase text-[11px] tracking-wide block">
                          Annual Capacity Forecast (2027) &amp; Operational Preferences
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          {selectedSub.questionnaireData.forecastedCapacity2027 && (
                            <div className="p-2.5 bg-white rounded-lg border border-emerald-200/80">
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">Forecasted 2027 Turnover</span>
                              <span className="font-mono font-bold text-emerald-900 text-xs">
                                LKR {Number(selectedSub.questionnaireData.forecastedCapacity2027).toLocaleString()} Million
                              </span>
                            </div>
                          )}
                          {selectedSub.questionnaireData.forecastedRuralRoadKmPerYear && (
                            <div className="p-2.5 bg-white rounded-lg border border-emerald-200/80">
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">Rural Roads Capacity</span>
                              <span className="font-mono font-bold text-emerald-900 text-xs">
                                {selectedSub.questionnaireData.forecastedRuralRoadKmPerYear} Km/Year
                              </span>
                            </div>
                          )}
                          {selectedSub.questionnaireData.forecastedNationalProvincialKmPerYear && (
                            <div className="p-2.5 bg-white rounded-lg border border-emerald-200/80">
                              <span className="text-[10px] text-slate-500 font-bold uppercase block">National / Provincial Roads</span>
                              <span className="font-mono font-bold text-emerald-900 text-xs">
                                {selectedSub.questionnaireData.forecastedNationalProvincialKmPerYear} Km/Year
                              </span>
                            </div>
                          )}
                        </div>
                        {Array.isArray(selectedSub.questionnaireData.preferableDistricts) &&
                          selectedSub.questionnaireData.preferableDistricts.length > 0 && (
                          <div className="pt-2 border-t border-emerald-200/60">
                            <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">
                              Preferable Operating Districts:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedSub.questionnaireData.preferableDistricts.map((dist: string) => (
                                <span
                                  key={dist}
                                  className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[11px] font-semibold"
                                >
                                  📍 {dist}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Historical Litigation & Non-Performance */}
                    {(() => {
                      const histRecords = Array.isArray(selectedSub.questionnaireData.historicalLitigationRecords) && selectedSub.questionnaireData.historicalLitigationRecords.length > 0
                        ? selectedSub.questionnaireData.historicalLitigationRecords.filter((r: any) => r && r.litigationType && r.litigationType !== "None")
                        : selectedSub.questionnaireData.historicalLitigationType && selectedSub.questionnaireData.historicalLitigationType !== "None"
                        ? [{
                            litigationType: selectedSub.questionnaireData.historicalLitigationType,
                            contractIdentification: selectedSub.questionnaireData.historicalContractIdentification,
                            employerName: selectedSub.questionnaireData.historicalEmployerName,
                            reason: selectedSub.questionnaireData.historicalReason,
                            matterDispute: selectedSub.questionnaireData.historicalMatterDispute,
                          }]
                        : [];

                      if (histRecords.length === 0) return null;

                      return (
                        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/30 space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-red-200/60">
                            <span className="font-bold text-red-950 uppercase text-[11px] tracking-wide flex items-center gap-1.5">
                              <Scale className="w-3.5 h-3.5 text-red-700" />
                              Historical Contract Non-Performance &amp; Litigation
                            </span>
                            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              {histRecords.length} {histRecords.length === 1 ? "Record" : "Records"}
                            </span>
                          </div>
                          <div className="space-y-2.5">
                            {histRecords.map((r: any, i: number) => (
                              <div key={i} className="p-2.5 bg-white rounded-lg border border-red-100 space-y-2 text-xs">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                  <span className="font-bold text-slate-900">Record #{i + 1}</span>
                                  <span className="font-bold text-red-700">{r.litigationType}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-slate-500 font-medium block">Contract Identification:</span>
                                    <span className="font-semibold text-slate-900">{r.contractIdentification || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 font-medium block">Name of Employer:</span>
                                    <span className="font-semibold text-slate-900">{r.employerName || "—"}</span>
                                  </div>
                                  <div className="sm:col-span-2">
                                    <span className="text-slate-500 font-medium block">Reason:</span>
                                    <span className="font-medium text-slate-900 whitespace-pre-wrap">{r.reason || "—"}</span>
                                  </div>
                                  {r.matterDispute && (
                                    <div className="sm:col-span-2">
                                      <span className="text-slate-500 font-medium block">Matter in Dispute:</span>
                                      <span className="font-medium text-slate-900 whitespace-pre-wrap">{r.matterDispute}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Financial Statements (Past 5 FYs - 40 Fields) */}
                    {selectedSub.questionnaireData.financialStatements && (
                      <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                          Financial Performance Schedule (5 Financial Years)
                        </span>
                        <div className="overflow-x-auto rounded-lg" style={{WebkitOverflowScrolling: 'touch'}}>
                        <p className="text-[10px] text-slate-400 italic text-right sm:hidden mb-1">← Scroll →</p>
                        <table className="w-full min-w-[640px] text-left text-[11px] border-collapse mt-1">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="py-1.5 px-2">Financial Year</th>
                              <th className="py-1.5 px-2">Total Assets</th>
                              <th className="py-1.5 px-2">Total Liabilities</th>
                              <th className="py-1.5 px-2">Total Equity</th>
                              <th className="py-1.5 px-2">Current Assets</th>
                              <th className="py-1.5 px-2">Current Liab.</th>
                              <th className="py-1.5 px-2">Working Cap.</th>
                              <th className="py-1.5 px-2">Revenue</th>
                              <th className="py-1.5 px-2">PBT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {Object.entries(selectedSub.questionnaireData.financialStatements).map(([yr, vals]: [string, any]) => (
                              <tr key={yr} className="hover:bg-slate-100/60">
                                <td className="py-1 px-2 font-bold font-sans text-blue-950">{yr}</td>
                                <td className="py-1 px-2">{vals?.totalAssets !== null ? Number(vals.totalAssets).toLocaleString() : "—"}</td>
                                <td className="py-1 px-2">{vals?.totalLiabilities !== null ? Number(vals.totalLiabilities).toLocaleString() : "—"}</td>
                                <td className={`py-1 px-2 ${vals?.totalEquity !== null && Number(vals.totalEquity) < 0 ? "text-rose-600 font-bold" : ""}`}>
                                  {vals?.totalEquity !== null && vals?.totalEquity !== undefined ? Number(vals.totalEquity).toLocaleString() : "—"}
                                </td>
                                <td className="py-1 px-2">{vals?.currentAssets !== null && vals?.currentAssets !== undefined ? Number(vals.currentAssets).toLocaleString() : "—"}</td>
                                <td className="py-1 px-2">{vals?.currentLiabilities !== null && vals?.currentLiabilities !== undefined ? Number(vals.currentLiabilities).toLocaleString() : "—"}</td>
                                <td className={`py-1 px-2 ${vals?.workingCapital !== null && Number(vals.workingCapital) < 0 ? "text-rose-600 font-bold" : ""}`}>
                                  {vals?.workingCapital !== null && vals?.workingCapital !== undefined ? Number(vals.workingCapital).toLocaleString() : "—"}
                                </td>
                                <td className="py-1 px-2">{vals?.totalRevenue !== null ? Number(vals.totalRevenue).toLocaleString() : "—"}</td>
                                <td className={`py-1 px-2 ${vals?.profitBeforeTax < 0 ? "text-rose-600 font-bold" : ""}`}>
                                  {vals?.profitBeforeTax !== null ? Number(vals.profitBeforeTax).toLocaleString() : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        </div>

                        {selectedSub.questionnaireData.loanCommitments && (
                          <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-200 flex justify-between items-center text-xs mt-2">
                            <div>
                              <span className="font-bold text-blue-950 block">Total Loan Repayments Due (01 Dec 2026 – 01 Dec 2028):</span>
                              <span className="text-[10px] text-slate-500">Repayments due within next 2 years</span>
                            </div>
                            <span className="font-mono font-bold text-blue-900 text-sm">
                              {selectedSub.questionnaireData.loanCommitments.twoYearRepaymentsDue2026To2028 !== null &&
                              selectedSub.questionnaireData.loanCommitments.twoYearRepaymentsDue2026To2028 !== undefined
                                ? `LKR ${Number(selectedSub.questionnaireData.loanCommitments.twoYearRepaymentsDue2026To2028).toLocaleString()}`
                                : "LKR 0 (None)"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Matters for Discussion */}
                {(selectedSub.questionnaireData.mattersForDiscussion ||
                  (Array.isArray(selectedSub.questionnaireData.mattersForDiscussionList) &&
                    selectedSub.questionnaireData.mattersForDiscussionList.some((s: string) => s && s.trim()))) && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                      Matters for Discussion (07 Dec 2026 Agenda)
                    </span>
                    {Array.isArray(selectedSub.questionnaireData.mattersForDiscussionList) &&
                    selectedSub.questionnaireData.mattersForDiscussionList.filter((s: string) => s && s.trim()).length > 0 ? (
                      <ol className="list-decimal list-inside space-y-1 text-slate-700 bg-white p-3 rounded border border-slate-200/80 leading-relaxed font-sans">
                        {selectedSub.questionnaireData.mattersForDiscussionList
                          .filter((s: string) => s && s.trim())
                          .map((item: string, idx: number) => (
                            <li key={idx} className="pl-1">{item}</li>
                          ))}
                      </ol>
                    ) : (
                      <p className="text-slate-700 italic bg-white p-3 rounded border border-slate-200/80 leading-relaxed">
                        &ldquo;{selectedSub.questionnaireData.mattersForDiscussion}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-center text-xs">
                No questionnaire payload attached to this legacy submission reference.
              </div>
            )}

            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintPdf(selectedSub)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download Official PDF / Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedSub)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-all"
                >
                  <Pencil className="w-4 h-4 text-amber-700" />
                  <span>Edit Record</span>
                </button>
                {selectedSub.status !== "Draft" ? (
                  <button
                    type="button"
                    onClick={() => handlePutAsDraft(selectedSub)}
                    disabled={isRevertingToDraft}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border transition-all ${
                      selectedSub.editRequested
                        ? "text-amber-950 bg-amber-200 hover:bg-amber-300 border-amber-400 font-extrabold"
                        : "text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300"
                    }`}
                    title="Revert to Draft so contractor can edit"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-700" />
                    <span>Put as Draft</span>
                  </button>
                ) : (
                  <a
                    href={`/register?ref=${encodeURIComponent(selectedSub.ref)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-900 bg-purple-100 hover:bg-purple-200 rounded-lg border border-purple-300 transition-all"
                    title="Open live form for contractor editing"
                  >
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span>Open Contractor Form &rarr;</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRequestDelete(selectedSub)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg border border-rose-300 transition-all"
                >
                  <Trash2 className="w-4 h-4 text-rose-700" />
                  <span>Delete Record</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all min-h-[38px]"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Always asks permission before delete) */}
      {subToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
                  <p className="text-xs text-slate-500">Permission required before deleting submission data</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Reference:</span>
                  <span className="font-mono font-bold text-blue-950">{subToDelete.ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Organization:</span>
                  <span className="font-bold text-slate-800">{subToDelete.contractor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="font-medium text-slate-700">{subToDelete.status}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete this registration record? All submitted questionnaire answers, candidate details, and audit history will be permanently deleted from the database. <strong>This action cannot be undone.</strong>
              </p>

              {deleteAlert && (
                <div className="p-2.5 rounded-lg text-xs bg-rose-50 border border-rose-200 text-rose-700">
                  {deleteAlert.message}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setSubToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Record...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Submission Modal (Public Form 1 Live Editor) */}
      {subToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-hidden animate-fadeIn">
          <div className="relative w-full max-w-6xl h-[95vh] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <Pencil className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      Edit Official Submission: <span className="font-mono text-blue-900">{subToEdit.ref}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-900">
                      {subToEdit.contractor || "Contractor"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      Public Form 1
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Live Public Form 1 editor &bull; All changes save directly to the official contractor registry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/register?ref=${encodeURIComponent(subToEdit.ref)}&admin=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-all shadow-2xs"
                  title="Open Public Form 1 in full new browser tab"
                >
                  <span className="hidden sm:inline">Open in Tab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubToEdit(null);
                    fetchSubmissions();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Close Form Editor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded Public Form 1 */}
            <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">
              <iframe
                src={`/register?ref=${encodeURIComponent(subToEdit.ref)}&admin=true&embed=true`}
                className="w-full h-full border-0"
                title={`Public Form 1 - ${subToEdit.ref}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
          <span className="text-xs font-medium text-slate-500">Loading Submissions Console...</span>
        </div>
      }
    >
      <SubmissionsContent />
    </Suspense>
  );
}
