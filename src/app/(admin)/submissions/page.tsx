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
} from "lucide-react";
import { DynamicFormRenderer } from "@/components/dynamic-form/DynamicFormRenderer";

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
}

interface SubmissionsCounts {
  all: number;
  submitted: number;
  draft: number;
  unseen?: number;
  seen?: number;
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

function generateSubmissionHtml(sub: FormattedSubmission): string {
  const q = sub.questionnaireData || {};
  const isContractor = q.participantCategory === "Contractor";
  const isSupplier = q.participantCategory === "Supplier";
  const isGovOfficer = q.participantCategory === "Government Officer";
  const willAttend = q.willParticipate === "Yes";

  const rawReg =
    q.ictadRegistrationNumber ||
    (sub.regNo &&
    !sub.regNo.startsWith("DFT-") &&
    !sub.regNo.startsWith("REG-") &&
    sub.regNo !== "N/A" &&
    sub.regNo !== "Not Registered"
      ? sub.regNo
      : null);

  const realProv =
    q.supplierDetails?.province ||
    (q.province && q.province !== "Western Province" ? q.province : null) ||
    (q.participantCategory === "Supplier" ? sub.provincialOffice : null);

  const realDist =
    q.supplierDetails?.district ||
    (q.district && q.district !== "Unassigned District" ? q.district : null);

  const provDistStr = [realProv, realDist].filter(Boolean).join(" • ");
  const contactStr = [q.contactNumber, q.email].filter(Boolean).join(" • ");

  // Financial statements rows if present
  let financialRows = "";
  if (q.financialStatements) {
    for (const [yr, vals] of Object.entries<any>(q.financialStatements)) {
      const ta = vals?.totalAssets !== null && vals?.totalAssets !== undefined ? Number(vals.totalAssets).toLocaleString() : "—";
      const tl = vals?.totalLiabilities !== null && vals?.totalLiabilities !== undefined ? Number(vals.totalLiabilities).toLocaleString() : "—";
      const te = vals?.totalEquity !== null && vals?.totalEquity !== undefined ? Number(vals.totalEquity).toLocaleString() : "—";
      const ca = vals?.currentAssets !== null && vals?.currentAssets !== undefined ? Number(vals.currentAssets).toLocaleString() : "—";
      const cl = vals?.currentLiabilities !== null && vals?.currentLiabilities !== undefined ? Number(vals.currentLiabilities).toLocaleString() : "—";
      const wc = vals?.workingCapital !== null && vals?.workingCapital !== undefined ? Number(vals.workingCapital).toLocaleString() : "—";
      const rev = vals?.totalRevenue !== null && vals?.totalRevenue !== undefined ? Number(vals.totalRevenue).toLocaleString() : "—";
      const pbt = vals?.profitBeforeTax !== null && vals?.profitBeforeTax !== undefined ? Number(vals.profitBeforeTax).toLocaleString() : "—";
      
      financialRows += `
        <tr>
          <td style="font-weight: bold; background: #f8fafc;">${escapeHtml(yr)}</td>
          <td>${ta}</td>
          <td>${tl}</td>
          <td style="font-weight: bold;">${te}</td>
          <td>${ca}</td>
          <td>${cl}</td>
          <td style="font-weight: bold;">${wc}</td>
          <td>${rev}</td>
          <td>${pbt}</td>
        </tr>
      `;
    }
  }

  // Similar works rows
  let similarWorksRows = "";
  if (Array.isArray(q.similarWorks)) {
    q.similarWorks.forEach((cw: any, idx: number) => {
      if (cw && cw.contractName) {
        similarWorksRows += `
          <tr>
            <td style="font-weight: bold;">Contract ${idx + 1}</td>
            <td>${escapeHtml(cw.contractName)}</td>
            <td>${escapeHtml(cw.contractType || "N/A")}</td>
            <td>${cw.contractAmount ? "LKR " + Number(cw.contractAmount).toLocaleString() : "—"}</td>
            <td>${escapeHtml(cw.completionStatus || "N/A")}</td>
          </tr>
        `;
      }
    });
  }

  // Ongoing contracts rows
  let ongoingWorksRows = "";
  if (Array.isArray(q.ongoingContracts)) {
    q.ongoingContracts.forEach((oc: any, idx: number) => {
      if (oc && oc.contractName) {
        ongoingWorksRows += `
          <tr>
            <td style="font-weight: bold;">Contract ${idx + 1}</td>
            <td>
              <strong>${escapeHtml(oc.contractName)}</strong>
              ${oc.contractNo ? `<br/><small style="color: #64748b;">Contract No: ${escapeHtml(oc.contractNo)}</small>` : ""}
              ${oc.employerName ? `<br/><small style="color: #64748b;">Employer: ${escapeHtml(oc.employerName)}</small>` : ""}
            </td>
            <td>${escapeHtml(oc.currency || "LKR")} ${oc.contractAmount ? Number(oc.contractAmount).toLocaleString() : "—"}</td>
            <td>${escapeHtml(oc.completionDate || "N/A")}</td>
          </tr>
        `;
      }
    });
  }

  // Supplier capacities rows
  let supplierCapacitiesRows = "";
  if (q.supplierDetails?.supplyCapacities) {
    for (const [mat, cap] of Object.entries<any>(q.supplierDetails.supplyCapacities)) {
      supplierCapacitiesRows += `
        <tr>
          <td style="font-weight: bold;">${escapeHtml(mat)}</td>
          <td style="font-weight: bold; color: #7B1113;">${cap?.quantity !== null && cap?.quantity !== undefined && cap?.quantity !== "" ? escapeHtml(cap.quantity) : "—"}</td>
          <td>${escapeHtml(cap?.unit || "MT per year")}</td>
        </tr>
      `;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>RDA_Submission_${escapeHtml(sub.ref.replace(/[\/\\:]/g, "_"))}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10pt;
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .print-bar {
      position: sticky;
      top: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .print-btn {
      background: #7B1113;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .print-btn:hover {
      background: #991b1b;
    }
    .close-btn {
      background: #334155;
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .doc-container {
      max-width: 820px;
      margin: 0 auto;
      padding: 8px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2.5px solid #7B1113;
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .gov-title {
      font-size: 13pt;
      font-weight: 900;
      color: #7B1113;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .gov-sub {
      font-size: 8.5pt;
      color: #475569;
      font-weight: 600;
      margin: 2px 0 0 0;
    }
    .doc-title {
      font-size: 11pt;
      font-weight: 800;
      color: #1e293b;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .ref-badge {
      font-size: 12pt;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }
    .section-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .section-head {
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
      padding: 5px 10px;
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .section-body {
      padding: 8px 10px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .field-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .field-value {
      font-size: 9pt;
      font-weight: 600;
      color: #0f172a;
    }
    .table-data {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 8pt;
    }
    .table-data th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
      text-align: left;
      font-weight: 700;
      color: #334155;
    }
    .table-data td {
      border: 1px solid #cbd5e1;
      padding: 4px 6px;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
      background: #f1f5f9;
      margin-right: 4px;
      margin-bottom: 2px;
    }
    .sign-section {
      margin-top: 18px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      page-break-inside: avoid;
    }
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 8px;
    }
    .sign-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 10px;
      min-height: 85px;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        padding: 0;
      }
      .doc-container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print print-bar">
    <div>
      <strong style="font-size: 14px;">Official Filing: ${escapeHtml(sub.ref)}</strong>
      <span style="font-size: 12px; opacity: 0.8; margin-left: 10px;">${escapeHtml(sub.contractor)}</span>
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
          <div class="gov-sub">Ministry of Transport and Highways &bull; Inclusive Connectivity and Development Project (ICDP)</div>
          <div class="doc-title">Early Market Engagement Workshop Filing Record</div>
          <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">Official Registry Document &bull; Schedule Event Date: 07 December 2026</div>
        </td>
      </tr>
    </table>

    <div class="meta-box">
      <div>
        <div class="field-label">Submission Reference</div>
        <div class="ref-badge">${escapeHtml(sub.ref)}</div>
      </div>
      <div>
        <div class="field-label">Filed At</div>
        <div class="field-value">${escapeHtml(sub.submittedAt)}</div>
      </div>
      <div>
        <div class="field-label">Provincial Jurisdiction</div>
        <div class="field-value">${escapeHtml(realProv || "—")}</div>
      </div>
      <div>
        <div class="field-label">Review Status</div>
        <div class="status-badge">${escapeHtml(sub.status)}</div>
      </div>
    </div>

    <!-- Organization Profile -->
    <div class="section-card">
      <div class="section-head">1. Entity Profile &amp; General Information</div>
      <div class="section-body">
        <div class="grid-3">
          <div>
            <div class="field-label">Organization / Firm Name</div>
            <div class="field-value">${escapeHtml(sub.contractor)}</div>
          </div>
          <div>
            <div class="field-label">Business / ICTAD Reg No</div>
            <div class="field-value font-mono">${escapeHtml(rawReg || "—")}</div>
          </div>
          <div>
            <div class="field-label">Stakeholder Category</div>
            <div class="field-value" style="color: #7B1113; font-weight: bold;">${escapeHtml(q.participantCategory || "General")}</div>
          </div>
          <div>
            <div class="field-label">Workshop Attendance (07 Dec 2026)</div>
            <div class="field-value" style="font-weight: bold;">${escapeHtml(q.willParticipate || "—")}</div>
          </div>
          <div>
            <div class="field-label">Province &amp; District</div>
            <div class="field-value">${escapeHtml(provDistStr || "—")}</div>
          </div>
          <div>
            <div class="field-label">Official Contact Number &amp; Email</div>
            <div class="field-value">${escapeHtml(contactStr || "—")}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendees -->
    ${willAttend ? `
    <div class="section-card">
      <div class="section-head">2. Nominated Workshop Attendees (Max 2 Representatives)</div>
      <div class="section-body">
        <div class="grid-2">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Participant 1 (Primary Delegate)</div>
            <div class="field-value">${escapeHtml(q.participant1?.fullName || "N/A")}</div>
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              Designation: <strong>${escapeHtml(q.participant1?.designation || "N/A")}</strong> &bull; Mobile: <strong>${escapeHtml(q.participant1?.mobileNumber || "N/A")}</strong>
            </div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 8px;">
            <div class="field-label">Participant 2 (Secondary Delegate)</div>
            <div class="field-value">${escapeHtml(q.participant2?.fullName || "None Nominated")}</div>
            ${q.participant2?.fullName ? `
            <div style="font-size: 8pt; color: #475569; margin-top: 2px;">
              Designation: <strong>${escapeHtml(q.participant2?.designation || "N/A")}</strong> &bull; Mobile: <strong>${escapeHtml(q.participant2?.mobileNumber || "N/A")}</strong>
            </div>
            ` : ""}
          </div>
        </div>
      </div>
    </div>
    ` : `
    <div class="section-card">
      <div class="section-head">2. Workshop Attendance Status</div>
      <div class="section-body">
        <p style="margin: 0; color: #64748b; font-size: 8.5pt;">The organization has recorded a non-attendance filing for the 07 December 2026 session. Baseline profile recorded for RDA contractor archives.</p>
      </div>
    </div>
    `}

    <!-- Contractor Details -->
    ${isContractor ? `
    <div class="section-card">
      <div class="section-head">3. Contractor Capacity, Grading &amp; Experience</div>
      <div class="section-body">
        <div class="grid-3">
          <div>
            <div class="field-label">ICTAD / CIDA Registration</div>
            <div class="field-value font-mono">${escapeHtml(q.ictadRegistrationNumber || "N/A")}</div>
          </div>
          <div>
            <div class="field-label">CIDA Grade Classification</div>
            <div class="field-value" style="font-weight: 800; color: #1e3a8a;">${escapeHtml(q.cidaGrade === "Other" && q.cidaGradeOther ? `Other (${q.cidaGradeOther})` : (q.cidaGrade || sub.grade || "N/A"))}</div>
          </div>
          <div>
            <div class="field-label">General Civil Construction Experience</div>
            <div class="field-value">${escapeHtml(q.generalExperience || "N/A")}</div>
          </div>
          <div>
            <div class="field-label">RDA / ICDP Experience</div>
            <div class="field-value">${escapeHtml(q.hasRdaOrIcdpExperience === "Yes" ? `Yes (${q.rdaIcdpExperienceType || "RDA/ICDP"}${q.rdaIcdpProjectDetails ? ` - ${q.rdaIcdpProjectDetails}` : ""})` : (q.hasRdaOrIcdpExperience === "No" ? "No" : "N/A"))}</div>
          </div>
        </div>
        ${q.areasOfSpecialty && q.areasOfSpecialty.length > 0 ? `
        <div style="margin-top: 6px;">
          <div class="field-label">Registered Technical Specialties:</div>
          <div style="margin-top: 2px;">
            ${q.areasOfSpecialty.map((sp: string) => {
              if (sp === "Other" && q.specialtyOther) {
                const others = q.specialtyOther.split(",").map((item: string) => item.trim()).filter(Boolean);
                return others.length > 0
                  ? others.map((oth: string) => {
                      const grade = q.specialtyGrades?.[oth] || q.specialtyGrades?.[`Other_${oth}`] || "";
                      const gradeSuffix = grade ? ` (Grade: ${escapeHtml(grade === "Other" && q.specialtyGradesOther?.[oth] ? q.specialtyGradesOther[oth] : grade)})` : "";
                      return `<span class="badge">Other: ${escapeHtml(oth)}${gradeSuffix}</span>`;
                    }).join("")
                  : `<span class="badge">Other</span>`;
              }
              const spGrade = q.specialtyGrades?.[sp] || "";
              const spGradeSuffix = spGrade ? ` (Grade: ${escapeHtml(spGrade === "Other" && q.specialtyGradesOther?.[sp] ? q.specialtyGradesOther[sp] : spGrade)})` : "";
              return `<span class="badge">${escapeHtml(sp)}${spGradeSuffix}</span>`;
            }).join("")}
          </div>
        </div>
        ` : ""}
        ${q.peakProductionRates && (q.peakProductionRates.asp !== null || q.peakProductionRates.concrete !== null || q.peakProductionRates.abc !== null) ? `
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
          <div class="field-label">Peak Production Rate (12 Months within Last 10 Years):</div>
          <table class="table-data" style="margin-top: 4px;">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                <th style="text-align: right;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Asp (Asphalt Concrete)</td>
                <td>SQM</td>
                <td style="text-align: right; font-weight: bold;">${q.peakProductionRates.asp !== null && q.peakProductionRates.asp !== undefined ? Number(q.peakProductionRates.asp).toLocaleString() : "—"}</td>
              </tr>
              <tr>
                <td>Concrete</td>
                <td>Cum</td>
                <td style="text-align: right; font-weight: bold;">${q.peakProductionRates.concrete !== null && q.peakProductionRates.concrete !== undefined ? Number(q.peakProductionRates.concrete).toLocaleString() : "—"}</td>
              </tr>
              <tr>
                <td>ABC (Aggregate Base Course)</td>
                <td>Cum</td>
                <td style="text-align: right; font-weight: bold;">${q.peakProductionRates.abc !== null && q.peakProductionRates.abc !== undefined ? Number(q.peakProductionRates.abc).toLocaleString() : "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ""}
      </div>
    </div>

    ${ongoingWorksRows ? `
    <div class="section-card">
      <div class="section-head">4. Ongoing Works &amp; Outstanding Commitments</div>
      <div class="section-body">
        <div style="margin-bottom: 4px; font-size: 8.5pt;">
          Total Outstanding Value (as at 01 Dec 2026): <strong>${q.totalOutstandingValueLkrMillion !== null && q.totalOutstandingValueLkrMillion !== undefined ? "LKR " + Number(q.totalOutstandingValueLkrMillion).toLocaleString() : "LKR 0"}</strong>
        </div>
        <table class="table-data">
          <thead>
            <tr>
              <th style="width: 15%;">Contract #</th>
              <th>Contract Name / Description</th>
              <th style="width: 25%;">Value</th>
              <th style="width: 20%;">Exp. Completion</th>
            </tr>
          </thead>
          <tbody>
            ${ongoingWorksRows}
          </tbody>
        </table>
      </div>
    </div>
    ` : ""}

    ${similarWorksRows ? `
    <div class="section-card">
      <div class="section-head">5. Prior Similar Construction Experience</div>
      <div class="section-body">
        <table class="table-data">
          <thead>
            <tr>
              <th style="width: 15%;">Item</th>
              <th>Contract Description</th>
              <th style="width: 20%;">Type</th>
              <th style="width: 20%;">Value</th>
              <th style="width: 15%;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${similarWorksRows}
          </tbody>
        </table>
      </div>
    </div>
    ` : ""}

    ${q.forecastedCapacity2027 || q.forecastedRuralRoadKmPerYear || q.forecastedNationalProvincialKmPerYear || (Array.isArray(q.preferableDistricts) && q.preferableDistricts.length > 0) ? `
    <div class="section-card">
      <div class="section-head">6. Annual Capacity Forecast (2027) &amp; Operational Preferences</div>
      <div class="section-body">
        <div class="grid-3">
          ${q.forecastedCapacity2027 ? `
          <div>
            <div class="field-label">Forecasted 2027 Turnover:</div>
            <div class="field-value" style="font-weight: bold; color: #065f46;">LKR ${Number(q.forecastedCapacity2027).toLocaleString()} Million</div>
          </div>
          ` : ""}
          ${q.forecastedRuralRoadKmPerYear ? `
          <div>
            <div class="field-label">Rural Roads Capacity:</div>
            <div class="field-value" style="font-weight: bold; color: #065f46;">${escapeHtml(q.forecastedRuralRoadKmPerYear)} Km/Year</div>
          </div>
          ` : ""}
          ${q.forecastedNationalProvincialKmPerYear ? `
          <div>
            <div class="field-label">National / Provincial Roads:</div>
            <div class="field-value" style="font-weight: bold; color: #065f46;">${escapeHtml(q.forecastedNationalProvincialKmPerYear)} Km/Year</div>
          </div>
          ` : ""}
        </div>
        ${Array.isArray(q.preferableDistricts) && q.preferableDistricts.length > 0 ? `
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
          <div class="field-label">Preferable Operating Districts:</div>
          <div style="margin-top: 2px;">
            ${q.preferableDistricts.map((d: string) => `<span class="badge" style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">📍 ${escapeHtml(d)}</span>`).join("")}
          </div>
        </div>
        ` : ""}
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
              <div class="field-label">Contract Identification:</div>
              <div class="field-value">${escapeHtml(r.contractIdentification || "—")}</div>
            </div>
            <div>
              <div class="field-label">Name of Employer:</div>
              <div class="field-value">${escapeHtml(r.employerName || "—")}</div>
            </div>
            <div style="grid-column: span 2;">
              <div class="field-label">Reason:</div>
              <div class="field-value">${escapeHtml(r.reason || "—")}</div>
            </div>
            ${r.matterDispute ? `
            <div style="grid-column: span 2;">
              <div class="field-label">Matter in Dispute:</div>
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

    ${financialRows ? `
    <div class="section-card">
      <div class="section-head">6. Financial Performance Statements (5 Financial Years Schedule)</div>
      <div class="section-body">
        <table class="table-data font-mono">
          <thead>
            <tr>
              <th>FY</th>
              <th>Total Assets</th>
              <th>Total Liab.</th>
              <th>Net Equity</th>
              <th>Curr. Assets</th>
              <th>Curr. Liab.</th>
              <th>Working Cap.</th>
              <th>Revenue</th>
              <th>PBT</th>
            </tr>
          </thead>
          <tbody>
            ${financialRows}
          </tbody>
        </table>
        ${q.loanCommitments?.twoYearRepaymentsDue2026To2028 !== undefined ? `
        <div style="margin-top: 6px; font-size: 8pt; color: #334155;">
          Declared Loan Repayments Due (01 Dec 2026 – 01 Dec 2028): <strong>LKR ${Number(q.loanCommitments.twoYearRepaymentsDue2026To2028).toLocaleString()}</strong>
        </div>
        ` : ""}
      </div>
    </div>
    ` : ""}
    ` : ""}

    <!-- Supplier Details -->
    ${isSupplier ? `
    <div class="section-card">
      <div class="section-head">3. Supplier Plant, Materials &amp; Production Capacity</div>
      <div class="section-body">
        <div class="grid-2">
          <div>
            <div class="field-label">Supplier Plant / Company Name</div>
            <div class="field-value">${escapeHtml(q.supplierDetails?.companyName || sub.contractor)}</div>
          </div>
          <div>
            <div class="field-label">Plant Location &amp; Address</div>
            <div class="field-value">${escapeHtml([q.supplierDetails?.locationAddress, [q.supplierDetails?.province, q.supplierDetails?.district].filter(Boolean).join(", ")].filter(Boolean).join(" — ") || "—")}</div>
          </div>
        </div>
        ${q.supplierDetails?.materialsSupplied ? `
        <div style="margin-top: 6px;">
          <div class="field-label">Materials Supplied:</div>
          <div style="margin-top: 2px;">
            ${q.supplierDetails.materialsSupplied.map((m: string) => `<span class="badge" style="background: #f3e8ff; color: #581c87;">${escapeHtml(m)}</span>`).join("")}
          </div>
        </div>
        ` : ""}
        ${supplierCapacitiesRows ? `
        <table class="table-data" style="margin-top: 8px;">
          <thead>
            <tr>
              <th>Material</th>
              <th>Annual Production Capacity</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            ${supplierCapacitiesRows}
          </tbody>
        </table>
        ` : ""}
      </div>
    </div>
    ` : ""}

    <!-- Government Officer Details -->
    ${isGovOfficer ? `
    <div class="section-card">
      <div class="section-head">3. Government Officer Details</div>
      <div class="section-body">
        <div class="grid-2">
          <div>
            <div class="field-label">Ministry / Department</div>
            <div class="field-value">${escapeHtml(q.governmentOfficer?.ministry || "N/A")} &bull; ${escapeHtml(q.governmentOfficer?.department || "N/A")}</div>
          </div>
          <div>
            <div class="field-label">Official Designation &amp; Assigned District</div>
            <div class="field-value">${escapeHtml(q.governmentOfficer?.designation || "N/A")} (${escapeHtml(q.governmentOfficer?.district || "N/A")})</div>
          </div>
        </div>
      </div>
    </div>
    ` : ""}

    <!-- Matters for Discussion -->
    ${q.mattersForDiscussion ? `
    <div class="section-card">
      <div class="section-head">Agenda Input: Matters for Discussion (07 Dec 2026)</div>
      <div class="section-body">
        <div style="font-size: 8.5pt; color: #334155; font-style: italic; background: #f8fafc; padding: 6px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">
          &ldquo;${escapeHtml(q.mattersForDiscussion)}&rdquo;
        </div>
      </div>
    </div>
    ` : ""}

    <!-- Sign-off & Verification -->
    <div class="sign-section">
      <div class="sign-grid">
        <div class="sign-box">
          <div class="field-label">Entity Declaration &amp; Submission</div>
          <div style="font-size: 8pt; color: #475569; margin-top: 4px;">
            Certified and submitted by authorized signatory:<br>
            <strong>${escapeHtml(q.certifiedBy || q.participant1?.fullName || sub.contractor)}</strong><br>
            Date of Statutory Filing: ${escapeHtml(q.certificationDate || sub.submittedAt)}
          </div>
        </div>
        <div class="sign-box">
          <div class="field-label">RDA Inspection &amp; Verification Seal</div>
          <div style="font-size: 8pt; color: #475569; margin-top: 4px;">
            Reviewing Officer: <strong>${escapeHtml(sub.reviewedBy || "Awaiting Review")}</strong><br>
            Designation / Directorate: Road Development Authority<br>
            Verification Status: <strong>${escapeHtml(sub.status.toUpperCase())}</strong>
          </div>
        </div>
      </div>
    </div>

    <div style="margin-top: 14px; text-align: center; font-size: 7.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px;">
      Road Development Authority &bull; Inclusive Connectivity and Development Project (ICDP) &bull; Official Digital Record generated on ${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString()}
    </div>
  </div>
</body>
</html>`;
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

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
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
                    <td className="px-4 py-3.5">{getStatusBadge(s.status)}</td>
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
                        {s.status === "Draft" && (
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
                {selectedSub.status === "Draft" && (
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

      {/* Edit Submission Modal (Full Schema-Driven Dynamic Form) */}
      {subToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-5xl max-h-[94vh] bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 flex flex-col my-auto overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Edit Official Submission: <span className="font-mono text-blue-950">{subToEdit.ref}</span>
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        editFormData.participantCategory === "Supplier"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : editFormData.participantCategory === "Government Officer"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-blue-100 text-blue-900 border border-blue-200"
                      }`}
                    >
                      {editFormData.participantCategory || "Contractor"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Full interactive questionnaire editor • Category changes automatically adjust sections and technical capabilities
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubToEdit(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6 flex-1 text-xs">
              {editAlert && (
                <div
                  className={`p-4 rounded-xl border text-xs font-semibold ${
                    editAlert.type === "success"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}
                >
                  {editAlert.message}
                </div>
              )}

              {/* Administrative Controls Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-blue-200/80 bg-blue-50/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-900" />
                    <span className="font-bold text-blue-950 uppercase text-[11px] tracking-wide">
                      Administrative Control &amp; Official Review Settings
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                    Internal RDA Management
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Official Review / Filing Status
                    </label>
                    <select
                      value={editFormData.status || "Submitted"}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-semibold text-xs"
                    >
                      <option value="Submitted">Submitted (Pending Review)</option>
                      <option value="Under_Review">Under Review</option>
                      <option value="Verified">Verified / Approved</option>
                      <option value="Action_Required">Action Required (Needs Correction)</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Draft">Draft (Incomplete)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Assigned Provincial Office
                    </label>
                    <select
                      value={editFormData.provincialOffice || "Western Province"}
                      onChange={(e) => setEditFormData({ ...editFormData, provincialOffice: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 font-semibold text-xs"
                    >
                      <option value="Western Province">Western Province</option>
                      <option value="Central Province">Central Province</option>
                      <option value="Southern Province">Southern Province</option>
                      <option value="Northern Province">Northern Province</option>
                      <option value="Eastern Province">Eastern Province</option>
                      <option value="North Western Province">North Western Province</option>
                      <option value="North Central Province">North Central Province</option>
                      <option value="Uva Province">Uva Province</option>
                      <option value="Sabaragamuwa Province">Sabaragamuwa Province</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Administrative Review Observations &amp; Internal Notes
                    </label>
                    <textarea
                      rows={2}
                      value={editFormData.reviewNotes || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, reviewNotes: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs"
                      placeholder="Add administrative review observations, field audit remarks, or verification notes..."
                    />
                  </div>

                  {editFormData.status === "Draft" && (
                    <div className="sm:col-span-2 p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-amber-900">Contractor Form Resumption Link:</span>
                          <span className="font-mono text-xs px-2 py-0.5 bg-white border border-amber-300 rounded font-bold text-blue-950">
                            /register?ref={subToEdit.ref}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          Because this submission is saved in <strong>Draft</strong> status, the contractor can use this link to access and edit their live registration form.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${window.location.origin}/register?ref=${encodeURIComponent(subToEdit.ref)}`;
                            navigator.clipboard.writeText(url);
                            alert(`Resumption link copied to clipboard:\n${url}`);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Copy Edit Link
                        </button>
                        <a
                          href={`/register?ref=${encodeURIComponent(subToEdit.ref)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          Open Form &rarr;
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-blue-200/60 flex items-start gap-2.5 text-[11px] text-blue-900">
                  <FileCheck2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Interactive Category Switching:</strong> Changing the Participant Category below (Section 2) dynamically converts this submission between <strong>Contractor</strong> (CIDA grading, financial turnover matrix, ongoing contracts, similar works, peak production rates) and <strong>Supplier</strong> (material types, supply capacities, and factory/quarry GPS map coordinates).
                  </span>
                </div>
              </div>

              {/* Full Dynamic Questionnaire Form */}
              {isLoadingSchema && !questionnaireSchema ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-2xl border border-slate-200">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-900" />
                  <span className="text-sm font-semibold text-slate-700">Loading Full Form Questionnaire Schema...</span>
                </div>
              ) : questionnaireSchema ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs">
                  <DynamicFormRenderer
                    questionnaire={questionnaireSchema}
                    values={editFormData}
                    onChange={handleFieldChange}
                    disabled={false}
                    previewMode={false}
                  />
                </div>
              ) : (
                <div className="p-8 text-center text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
                  <p className="font-bold text-sm">Failed to load official questionnaire schema.</p>
                  <p className="text-xs text-rose-600 mt-1">Please check your network connection and retry.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoadingSchema(true);
                      fetch("/api/public/questionnaire")
                        .then((r) => r.json())
                        .then((d) => {
                          if (d.success && d.questionnaire) setQuestionnaireSchema(d.questionnaire);
                        })
                        .finally(() => setIsLoadingSchema(false));
                    }}
                    className="mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
                  >
                    Retry Loading Form
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-end gap-3 rounded-b-2xl shrink-0">
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setSubToEdit(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md transition-all disabled:opacity-60"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
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
