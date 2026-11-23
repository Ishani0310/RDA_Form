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
  Printer,
  Scale,
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

const ATTENDANCE_OPTIONS = [
  { value: "Yes", label: "Yes (Participating)" },
  { value: "No", label: "No (Non-Attendee)" },
];

const CATEGORY_OPTIONS = [
  { value: "Contractor", label: "Contractor" },
  { value: "Supplier", label: "Supplier" },
  { value: "Government Officer", label: "Government Officer" },
  { value: "Non-Attendee", label: "Non-Attendee" },
];

const STATUSES = [
  { value: "Pending_Review", label: "Pending Review" },
  { value: "Verified", label: "Verified & Approved" },
  { value: "Draft", label: "Draft Filing" },
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
  const [selectedAttendance, setSelectedAttendance] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
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
      if (selectedAttendance) params.set("attendance", selectedAttendance);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedStatus) params.set("status", selectedStatus);

      const res = await fetch(`/api/contractors?${params.toString()}`);
      const result = await res.json();

      if (res.ok && result.success) {
        setContractors(result.data || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        setError(result.message || "Failed to query registry records.");
      }
    } catch {
      setError("Network communication failure. Could not reach registry service.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedAttendance, selectedCategory, selectedStatus]);

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

  const handleDownloadProfile = (c: ContractorItem) => {
    const escapeHtml = (str: string | number | null | undefined): string => {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const q = c.questionnaireData || {};
    const willParticipate =
      c.willParticipate ||
      q.willParticipate ||
      (c.primarySpeciality === "Non-Attendee" ? "No" : "Yes");
    const isNonAttendee = willParticipate === "No" || c.primarySpeciality === "Non-Attendee";

    const category =
      c.participantCategory ||
      q.participantCategory ||
      (isNonAttendee
        ? "Non-Attendee"
        : c.primarySpeciality === "Government Stakeholder"
        ? "Government Officer"
        : "");

    const isGovOfficer = category === "Government Officer";
    const isSupplier = category === "Supplier";
    const isContractor =
      category === "Contractor" ||
      (!isGovOfficer &&
        !isSupplier &&
        !isNonAttendee &&
        Boolean(q.cidaGrade || c.cidaGrade));

    const p1 = q.participant1 || (c.contactOfficer?.name ? {
      fullName: c.contactOfficer.name,
      designation: c.contactOfficer.designation,
      mobileNumber: c.contactOfficer.phone,
      emailAddress: c.contactOfficer.email,
    } : null);
    const hasP1 = Boolean(p1 && p1.fullName && p1.fullName !== "Authorized Representative" && p1.fullName !== "Not Designated");

    const p2 = q.participant2;
    const hasP2 = Boolean(p2 && p2.fullName && p2.fullName.trim());

    const supplierDetails = q.supplierDetails || {};
    const specialties =
      q.areasOfSpecialty ||
      (c.primarySpeciality &&
      c.primarySpeciality !== "General Civil Engineering" &&
      c.primarySpeciality !== "Government Stakeholder" &&
      c.primarySpeciality !== "Non-Attendee"
        ? [c.primarySpeciality]
        : []);
    const ongoingContractsList = Array.isArray(q.ongoingContracts)
      ? q.ongoingContracts.filter((oc: any) => oc && (oc.contractName || oc.projectName))
      : [];

    const regNumber = q.ictadRegistrationNumber || c.registrationNumber;
    const hasReg = Boolean(
      regNumber &&
        !regNumber.startsWith("DFT-") &&
        !regNumber.startsWith("REG-") &&
        regNumber !== "Not Registered" &&
        regNumber !== "PENDING"
    );
    const cidaGrade = q.cidaGrade || c.cidaGrade;
    const hasCida = Boolean(isContractor && cidaGrade && cidaGrade !== "Pending" && cidaGrade !== "Not Registered");
    const brNumber = c.businessRegistrationNumber;
    const hasBr = Boolean(brNumber && brNumber !== "PENDING-BR" && brNumber !== "N/A" && brNumber !== "Not Provided");

    const primaryPhone = q.contactNumber || c.contactOfficer?.phone;
    const hasPhone = Boolean(primaryPhone && primaryPhone !== "+94 11 000 0000" && primaryPhone !== "N/A" && primaryPhone !== "Not Provided");
    const primaryEmail = q.email || c.contactOfficer?.email;
    const hasEmail = Boolean(primaryEmail && primaryEmail !== "contact@contractor.lk" && primaryEmail !== "contact@rda.gov.lk" && primaryEmail !== "N/A" && primaryEmail !== "Not Provided");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>RDA Official Record - ${escapeHtml(q.organizationName || c.businessName)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #fff; font-size: 9pt; line-height: 1.45; }
    .print-bar { background: #0b1f3a; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
    .print-btn { background: #d97706; color: white; border: none; padding: 7px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; }
    .close-btn { background: rgba(255,255,255,0.2); color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
    .doc-container { padding: 15px 20px; max-width: 800px; margin: 0 auto; }
    .header-table { width: 100%; border-bottom: 2px solid #0b1f3a; padding-bottom: 8px; margin-bottom: 12px; }
    .gov-title { font-size: 13pt; font-weight: 800; color: #0b1f3a; text-transform: uppercase; }
    .gov-sub { font-size: 8pt; color: #64748b; margin-top: 2px; }
    .doc-title { font-size: 11pt; font-weight: 700; color: #7B1113; margin-top: 4px; }
    .meta-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .field-label { font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
    .field-value { font-size: 9pt; font-weight: 600; color: #0f172a; }
    .section-card { border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 12px; overflow: hidden; }
    .section-head { background: #0b1f3a; color: white; padding: 5px 10px; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; }
    .section-body { padding: 10px 12px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 8pt; font-weight: 700; }
    .badge-yes { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-no { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; }
    .tag { display: inline-block; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 8pt; font-weight: 600; margin: 2px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 8.5pt; }
    table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
    table.data-table th { background: #f1f5f9; font-weight: 700; color: #334155; }
    .footer-stamp { border-top: 1px dashed #cbd5e1; margin-top: 15px; padding-top: 8px; font-size: 7.5pt; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="no-print print-bar">
    <div>
      <strong style="font-size: 13px;">Official Record: ${escapeHtml(q.organizationName || c.businessName)}</strong>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="close-btn" onclick="window.close()">Close</button>
    </div>
  </div>

  <div class="doc-container">
    <table class="header-table">
      <tr>
        <td style="vertical-align: top;">
          <div class="gov-title">Road Development Authority (RDA) - Sri Lanka</div>
          <div class="gov-sub">Ministry of Transport &amp; Highways &bull; Central Stakeholder &amp; Contractor Directory</div>
          <div class="doc-title">Official Registry Record &bull; ${escapeHtml(q.organizationName || c.businessName)}</div>
        </td>
      </tr>
    </table>

    <div class="meta-box">
      <div>
        <div class="field-label">Workshop Attendance</div>
        <div class="field-value">${isNonAttendee ? '<span class="badge badge-no">No (Declined)</span>' : '<span class="badge badge-yes">Yes (Participating)</span>'}</div>
      </div>
      <div>
        <div class="field-label">Category</div>
        <div class="field-value font-bold" style="color: #0b1f3a;">${escapeHtml(category || "General")}</div>
      </div>
      <div>
        <div class="field-label">Review Status</div>
        <div class="field-value">${escapeHtml(c.status.replace("_", " "))}</div>
      </div>
      <div>
        <div class="field-label">Record Date</div>
        <div class="field-value">${c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : "Recorded"}</div>
      </div>
    </div>

    <!-- 1. Entity Information -->
    <div class="section-card">
      <div class="section-head">1. Entity &amp; Official Contact Information</div>
      <div class="section-body">
        <div class="grid-2">
          <div>
            <div class="field-label">Organization / Firm Name</div>
            <div class="field-value font-bold">${escapeHtml(q.organizationName || c.businessName)}</div>
          </div>
          ${hasReg ? `
          <div>
            <div class="field-label">Registration / ICTAD No</div>
            <div class="field-value font-mono">${escapeHtml(regNumber)}</div>
          </div>
          ` : ""}
          ${hasBr ? `
          <div>
            <div class="field-label">Business Registration (BR) No</div>
            <div class="field-value font-mono">${escapeHtml(brNumber)}</div>
          </div>
          ` : ""}
          ${hasCida ? `
          <div>
            <div class="field-label">CIDA Classification</div>
            <div class="field-value font-bold" style="color: #0b1f3a;">Grade ${escapeHtml(cidaGrade)}</div>
          </div>
          ` : ""}
          ${hasPhone ? `
          <div>
            <div class="field-label">Official Contact Phone</div>
            <div class="field-value font-mono">${escapeHtml(primaryPhone)}</div>
          </div>
          ` : ""}
          ${hasEmail ? `
          <div>
            <div class="field-label">Official Electronic Mail</div>
            <div class="field-value font-mono">${escapeHtml(primaryEmail)}</div>
          </div>
          ` : ""}
        </div>
      </div>
    </div>

    ${isNonAttendee ? `
    <div class="section-card">
      <div class="section-head">2. Workshop Attendance Status</div>
      <div class="section-body">
        <p style="margin: 0; color: #64748b; font-size: 8.5pt;">The organization has recorded a non-attendance filing for the workshop on 07 December 2026. Official organizational and contact details are logged in the Central Registry directory.</p>
      </div>
    </div>
    ` : ""}

    <!-- Government Officer Attendees -->
    ${isGovOfficer && (hasP1 || hasP2) ? `
    <div class="section-card">
      <div class="section-head">2. Nominated Government Attendees</div>
      <div class="section-body">
        <div class="grid-2">
          ${hasP1 ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Official Representative (Participant 1)</div>
            <div class="field-value">${escapeHtml(p1.fullName)}</div>
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              ${p1.designation ? `Designation: <strong>${escapeHtml(p1.designation)}</strong> &bull; ` : ""}
              ${p1.mobileNumber ? `Phone: <strong>${escapeHtml(p1.mobileNumber)}</strong>` : ""}
              ${p1.emailAddress ? ` &bull; Email: <strong>${escapeHtml(p1.emailAddress)}</strong>` : ""}
            </div>
          </div>
          ` : ""}
          ${hasP2 ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Second Officer (Participant 2)</div>
            <div class="field-value">${escapeHtml(p2.fullName)}</div>
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              ${p2.designation ? `Designation: <strong>${escapeHtml(p2.designation)}</strong> &bull; ` : ""}
              ${p2.mobileNumber ? `Phone: <strong>${escapeHtml(p2.mobileNumber)}</strong>` : ""}
              ${p2.emailAddress ? ` &bull; Email: <strong>${escapeHtml(p2.emailAddress)}</strong>` : ""}
            </div>
          </div>
          ` : ""}
        </div>
      </div>
    </div>
    ` : ""}

    <!-- Supplier Details -->
    ${isSupplier ? `
    <div class="section-card">
      <div class="section-head">2. Supplier Production &amp; Material Capacity</div>
      <div class="section-body">
        <div class="grid-2">
          ${supplierDetails.companyName ? `
          <div>
            <div class="field-label">Company Name</div>
            <div class="field-value font-bold">${escapeHtml(supplierDetails.companyName)}</div>
          </div>
          ` : ""}
          ${supplierDetails.province || supplierDetails.district ? `
          <div>
            <div class="field-label">Province &amp; District</div>
            <div class="field-value">${escapeHtml([supplierDetails.province, supplierDetails.district ? `${supplierDetails.district} District` : null].filter(Boolean).join(" • "))}</div>
          </div>
          ` : ""}
          ${supplierDetails.locationAddress ? `
          <div style="grid-column: span 2;">
            <div class="field-label">Physical Location Address</div>
            <div class="field-value">${escapeHtml(supplierDetails.locationAddress)}</div>
          </div>
          ` : ""}
        </div>
        ${supplierDetails.materialsSupplied && supplierDetails.materialsSupplied.length > 0 ? `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          <div class="field-label">Supplied Materials:</div>
          <div>
            ${supplierDetails.materialsSupplied.map((m: string) => `<span class="tag">${escapeHtml(m === "Other" && supplierDetails.materialsOther ? `Other (${supplierDetails.materialsOther})` : m)}</span>`).join("")}
          </div>
        </div>
        ` : ""}
      </div>
    </div>

    ${hasP1 || hasP2 ? `
    <div class="section-card">
      <div class="section-head">3. Supplier Representatives</div>
      <div class="section-body">
        <div class="grid-2">
          ${hasP1 ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Representative (Participant 1)</div>
            <div class="field-value">${escapeHtml(p1.fullName)}</div>
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              ${p1.designation ? `Designation: <strong>${escapeHtml(p1.designation)}</strong> &bull; ` : ""}
              ${p1.mobileNumber ? `Phone: <strong>${escapeHtml(p1.mobileNumber)}</strong>` : ""}
              ${p1.emailAddress ? ` &bull; Email: <strong>${escapeHtml(p1.emailAddress)}</strong>` : ""}
            </div>
          </div>
          ` : ""}
          ${hasP2 ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Representative (Participant 2)</div>
            <div class="field-value">${escapeHtml(p2.fullName)}</div>
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              ${p2.designation ? `Designation: <strong>${escapeHtml(p2.designation)}</strong> &bull; ` : ""}
              ${p2.mobileNumber ? `Phone: <strong>${escapeHtml(p2.mobileNumber)}</strong>` : ""}
              ${p2.emailAddress ? ` &bull; Email: <strong>${escapeHtml(p2.emailAddress)}</strong>` : ""}
            </div>
          </div>
          ` : ""}
        </div>
      </div>
    </div>
    ` : ""}
    ` : ""}

    <!-- Contractor Details -->
    ${isContractor ? `
    ${specialties.length > 0 || q.generalExperience || q.hasOngoingContracts ? `
    <div class="section-card">
      <div class="section-head">2. Contractor Capacity &amp; Experience</div>
      <div class="section-body">
        <div class="grid-2">
          ${q.generalExperience ? `
          <div>
            <div class="field-label">General Construction Experience</div>
            <div class="field-value font-bold">${escapeHtml(q.generalExperience)}</div>
          </div>
          ` : ""}
          ${q.hasRdaOrIcdpExperience ? `
          <div>
            <div class="field-label">RDA / ICDP Experience</div>
            <div class="field-value font-bold">${escapeHtml(q.hasRdaOrIcdpExperience === "Yes" ? `Yes (${q.rdaIcdpExperienceType || "RDA/ICDP"}${q.rdaIcdpProjectDetails ? ` - ${q.rdaIcdpProjectDetails}` : ""})` : "No")}</div>
          </div>
          ` : ""}
          ${q.hasOngoingContracts ? `
          <div>
            <div class="field-label">Ongoing RDA Contracts</div>
            <div class="field-value">${escapeHtml(q.hasOngoingContracts)}</div>
          </div>
          ` : ""}
        </div>
        ${specialties.length > 0 ? `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          <div class="field-label">Areas of Technical Specialty:</div>
          <div>
            ${specialties.map((s: string) => `<span class="tag">${escapeHtml(s)}</span>`).join("")}
          </div>
        </div>
        ` : ""}
      </div>
    </div>
    ` : ""}

    ${ongoingContractsList.length > 0 ? `
    <div class="section-card">
      <div class="section-head">3. Ongoing Contracts</div>
      <div class="section-body">
        ${q.totalOutstandingValueLkrMillion !== undefined && q.totalOutstandingValueLkrMillion !== null ? `
        <div style="margin-bottom: 8px; font-weight: bold; font-size: 9pt;">
          Total Value of Outstanding Works: LKR ${Number(q.totalOutstandingValueLkrMillion).toLocaleString()} Million
        </div>
        ` : ""}
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Project / Contract Name</th>
              <th>Value</th>
              <th>Client / Employer</th>
              <th>Target Completion</th>
            </tr>
          </thead>
          <tbody>
            ${ongoingContractsList.map((oc: any, idx: number) => `
            <tr>
              <td>${idx + 1}</td>
              <td style="font-weight: 600;">
                ${escapeHtml(oc.contractName || oc.projectName)}
                ${oc.contractNo ? `<br/><small style="color: #64748b;">Contract No: ${escapeHtml(oc.contractNo)}</small>` : ""}
              </td>
              <td>${oc.contractAmount ? `LKR ${Number(oc.contractAmount).toLocaleString()}` : (oc.contractValueLkrMillion ? `LKR ${escapeHtml(oc.contractValueLkrMillion)}M` : "—")}</td>
              <td>${escapeHtml(oc.employerName || oc.clientEmployer || "—")}</td>
              <td>${escapeHtml(oc.completionDate || oc.expectedCompletionDate || "—")}</td>
            </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
    ` : ""}

    ${(() => {
      const histRecords = Array.isArray(q.historicalLitigationRecords) && q.historicalLitigationRecords.length > 0
        ? q.historicalLitigationRecords.filter((r: any) => r && r.litigationType && r.litigationType !== "None")
        : q.historicalLitigationType && q.historicalLitigationType !== "None"
        ? [{
            litigationType: q.historicalLitigationType,
            contractIdentification: q.historicalContractIdentification,
            employerName: q.historicalEmployerName,
            reason: q.historicalReason,
            matterDispute: q.historicalMatterDispute,
          }]
        : [];

      if (histRecords.length === 0) return "";

      return `
    <div class="section-card">
      <div class="section-head">Historical Contract Non-Performance &amp; Litigation (${histRecords.length} Record${histRecords.length > 1 ? "s" : ""})</div>
      <div class="section-body">
        ${histRecords.map((r: any, idx: number) => `
        <div style="${idx > 0 ? 'margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;' : ''}">
          <div style="font-weight: bold; font-size: 8.5pt; color: #b91c1c; margin-bottom: 4px;">Record #${idx + 1}: ${escapeHtml(r.litigationType)}</div>
          <div class="grid-2">
            <div>
              <div class="field-label">Contract Identification</div>
              <div class="field-value">${escapeHtml(r.contractIdentification || "—")}</div>
            </div>
            <div>
              <div class="field-label">Name of Employer</div>
              <div class="field-value">${escapeHtml(r.employerName || "—")}</div>
            </div>
            <div style="grid-column: span 2;">
              <div class="field-label">Reason</div>
              <div class="field-value">${escapeHtml(r.reason || "—")}</div>
            </div>
            ${r.matterDispute ? `
            <div style="grid-column: span 2;">
              <div class="field-label">Matter in Dispute</div>
              <div class="field-value">${escapeHtml(r.matterDispute)}</div>
            </div>
            ` : ""}
          </div>
        </div>
        `).join("")}
      </div>
    </div>
      `;
    })()}

    ${hasP1 || hasP2 ? `
    <div class="section-card">
      <div class="section-head">4. Authorized Contractor Representatives</div>
      <div class="section-body">
        <div class="grid-2">
          ${hasP1 ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Primary Representative (Participant 1)</div>
            <div class="field-value">${escapeHtml(p1.fullName)}</div>
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              ${p1.designation ? `Designation: <strong>${escapeHtml(p1.designation)}</strong> &bull; ` : ""}
              ${p1.mobileNumber ? `Phone: <strong>${escapeHtml(p1.mobileNumber)}</strong>` : ""}
              ${p1.emailAddress ? ` &bull; Email: <strong>${escapeHtml(p1.emailAddress)}</strong>` : ""}
            </div>
          </div>
          ` : ""}
          ${hasP2 ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Second Representative (Participant 2)</div>
            <div class="field-value">${escapeHtml(p2.fullName)}</div>
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              ${p2.designation ? `Designation: <strong>${escapeHtml(p2.designation)}</strong> &bull; ` : ""}
              ${p2.mobileNumber ? `Phone: <strong>${escapeHtml(p2.mobileNumber)}</strong>` : ""}
              ${p2.emailAddress ? ` &bull; Email: <strong>${escapeHtml(p2.emailAddress)}</strong>` : ""}
            </div>
          </div>
          ` : ""}
        </div>
      </div>
    </div>
    ` : ""}
    ` : ""}

    <div class="footer-stamp">
      <span>Database Node: Sri Lanka National Central Registry &bull; RDA ICDP</span>
      <span>Printed / Exported: ${new Date().toLocaleString("en-GB")}</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
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
            Centralized directory of registered organizations, contractors, suppliers, and participants for Road Development Authority initiatives.
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
            placeholder="Search by organization name, contact number, or email..."
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
          {/* Participation Filter */}
          <select
            value={selectedAttendance}
            onChange={(e) => {
              setSelectedAttendance(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">All Participation</option>
            {ATTENDANCE_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">All Categories</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
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

          {(selectedAttendance || selectedCategory || selectedStatus || search) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAttendance("");
                setSelectedCategory("");
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

      {/* Directory Table or Clean Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
            <p className="text-xs font-semibold text-slate-600">Querying live database records...</p>
          </div>
        ) : contractors.length === 0 ? (
          <div className="py-20 px-6 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
            <div className="p-3 bg-blue-50 text-blue-900 rounded-2xl">
              <Inbox className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">No Records Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {debouncedSearch || selectedAttendance || selectedCategory || selectedStatus
                  ? "No records matched your specific search filters. Try clearing filters to view all entries."
                  : "There are currently no records in the national database. Incoming registrations and official intakes will populate here."}
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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadProfile(selectedContractor)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-all"
                    title="Download Official Record / Print PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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
                          {cidaGrade === "Other" && (q.cidaGradeOther || selectedContractor.cidaGrade === "Other")
                            ? `Other (${q.cidaGradeOther || "Specified"})`
                            : `Grade ${cidaGrade}`}
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
                      {q.hasRdaOrIcdpExperience && (
                        <div>
                          <span className="text-slate-500 font-medium">RDA / ICDP Experience:</span>
                          <p className="font-bold text-slate-900 mt-0.5">
                            {q.hasRdaOrIcdpExperience === "Yes"
                              ? `Yes (${q.rdaIcdpExperienceType || "RDA/ICDP"}${q.rdaIcdpProjectDetails ? ` - ${q.rdaIcdpProjectDetails}` : ""})`
                              : "No"}
                          </p>
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
                          {specialties.map((s: string) => {
                            if (s === "Other" && q.specialtyOther) {
                              const others = q.specialtyOther
                                .split(",")
                                .map((item: string) => item.trim())
                                .filter(Boolean);
                              return others.length > 0 ? (
                                others.map((oth: string, oIdx: number) => {
                                  const grade = q.specialtyGrades?.[oth];
                                  return (
                                    <span
                                      key={`oth-${oIdx}`}
                                      className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-semibold"
                                    >
                                      Other: {oth} {grade ? `• Grade ${grade}` : ""}
                                    </span>
                                  );
                                })
                              ) : (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-semibold"
                                >
                                  Other
                                </span>
                              );
                            }
                            const spGrade = q.specialtyGrades?.[s];
                            return (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-semibold"
                              >
                                {s} {spGrade ? `• Grade ${spGrade}` : ""}
                              </span>
                            );
                          })}
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
                            <div>
                              <span className="font-bold text-slate-900">Project {idx + 1}: {oc.contractName || oc.projectName}</span>
                              {oc.contractNo && (
                                <span className="ml-2 text-[10px] bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded">
                                  No: {oc.contractNo}
                                </span>
                              )}
                            </div>
                            {(oc.contractAmount || oc.contractValueLkrMillion) && (
                              <span className="font-mono font-bold text-slate-800">
                                {oc.contractAmount ? `LKR ${Number(oc.contractAmount).toLocaleString()}` : `LKR ${oc.contractValueLkrMillion}M`}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-3">
                            {(oc.employerName || oc.clientEmployer) && <span>Employer: {oc.employerName || oc.clientEmployer}</span>}
                            {(oc.completionDate || oc.expectedCompletionDate) && <span>Completion: {oc.completionDate || oc.expectedCompletionDate}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* HISTORICAL LITIGATION */}
                {isContractor && (() => {
                  const histRecords = Array.isArray(q.historicalLitigationRecords) && q.historicalLitigationRecords.length > 0
                    ? q.historicalLitigationRecords.filter((r: any) => r && r.litigationType && r.litigationType !== "None")
                    : q.historicalLitigationType && q.historicalLitigationType !== "None"
                    ? [{
                        litigationType: q.historicalLitigationType,
                        contractIdentification: q.historicalContractIdentification,
                        employerName: q.historicalEmployerName,
                        reason: q.historicalReason,
                        matterDispute: q.historicalMatterDispute,
                      }]
                    : [];

                  if (histRecords.length === 0) return null;

                  return (
                    <div className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-3">
                      <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-red-200/60">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-red-700" />
                          <span>Historical Contract Non-Performance &amp; Litigation</span>
                        </span>
                        <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                          {histRecords.length} {histRecords.length === 1 ? "Record" : "Records"}
                        </span>
                      </h4>
                      <div className="space-y-3">
                        {histRecords.map((r: any, i: number) => (
                          <div key={i} className="p-3 bg-white rounded-lg border border-red-100 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-1 text-xs">
                              <span className="font-bold text-slate-900">Record #{i + 1}</span>
                              <span className="font-bold text-red-700">{r.litigationType}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
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
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDownloadProfile(selectedContractor)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Print PDF Record</span>
                </button>

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
