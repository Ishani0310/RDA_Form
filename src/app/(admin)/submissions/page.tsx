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
  Printer,
  FileText,
} from "lucide-react";

interface FormattedSubmission {
  id: string;
  ref: string;
  contractor: string;
  regNo: string;
  grade: string;
  submissionType: string;
  provincialOffice: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  schemaVersion?: string;
  questionnaireData?: any;
  submittedAt: string;
  reviewedBy: string;
  reviewNotes: string | null;
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
            <td>${escapeHtml(oc.contractName)}</td>
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
            <div class="field-value" style="font-weight: 800; color: #1e3a8a;">${escapeHtml(q.cidaGrade || sub.grade || "N/A")}</div>
          </div>
          <div>
            <div class="field-label">General Civil Construction Experience</div>
            <div class="field-value">${escapeHtml(q.generalExperience || "N/A")}</div>
          </div>
        </div>
        ${q.areasOfSpecialty && q.areasOfSpecialty.length > 0 ? `
        <div style="margin-top: 6px;">
          <div class="field-label">Registered Technical Specialties:</div>
          <div style="margin-top: 2px;">
            ${q.areasOfSpecialty.map((sp: string) => `<span class="badge">${escapeHtml(sp)}</span>`).join("")}
          </div>
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
      if (initialRef) params.append("ref", initialRef);

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

        // Auto-select modal if ref was requested
        if (initialRef && Array.isArray(data.data)) {
          const match = data.data.find((s: FormattedSubmission) => s.ref === initialRef);
          if (match) setSelectedSub(match);
        }
      } else {
        throw new Error(data.message || "Failed to load submissions");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [page, search, status, province, category, attendance, initialRef]);

  useEffect(() => {
    fetchSubmissions();
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

  const handleExportAllCsv = () => {
    if (!submissions || submissions.length === 0) {
      alert("No submission records available to export.");
      return;
    }

    const headers = [
      "Reference Number",
      "Organization Name",
      "Category",
      "Attendance (07 Dec 2026)",
      "Registration / ICTAD No",
      "CIDA Grade",
      "Provincial Office",
      "District",
      "Contact Phone",
      "Email",
      "Participant 1 Name",
      "Participant 1 Designation",
      "Participant 1 Phone",
      "Participant 2 Name",
      "Participant 2 Designation",
      "Status",
      "Submitted Date",
    ];

    const rows = submissions.map((s) => {
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
        (q.participantCategory === "Supplier" ? s.provincialOffice : "");
      const dist = q.supplierDetails?.district || (q.district && q.district !== "Unassigned District" ? q.district : "");
      return [
        s.ref,
        s.contractor,
        q.participantCategory || "General",
        q.willParticipate || "",
        reg,
        q.cidaGrade || (s.grade && s.grade !== "Pending" && s.grade !== "N/A" ? s.grade : ""),
        prov,
        dist,
        q.contactNumber || "",
        q.email || "",
        q.participant1?.fullName || "",
        q.participant1?.designation || "",
        q.participant1?.mobileNumber || "",
        q.participant2?.fullName || "",
        q.participant2?.designation || "",
        s.status,
        s.submittedAt,
      ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`);
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RDA_Submissions_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (s: string) => {
    switch (s?.toLowerCase()) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Submitted
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Under Review
          </span>
        );
      case "verified":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Verified
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Draft Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
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
            disabled={loading || submissions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
            title="Export all filtered submissions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Submissions (CSV)</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Filings</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{pagination.totalCount}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Island-wide records</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Queue</p>
          <h3 className="text-2xl font-black text-blue-900 mt-1">
            {submissions.filter((s) => s.status === "submitted" || s.status === "under_review").length}
          </h3>
          <span className="text-[11px] text-blue-600 font-medium">Pending engineer review</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verified Filings</p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {submissions.filter((s) => s.status === "approved").length}
          </h3>
          <span className="text-[11px] text-emerald-600 font-medium">Cleared for tenders</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filter Results</p>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{submissions.length}</h3>
          <span className="text-[11px] text-slate-500 font-medium">Showing on page {pagination.page}</span>
        </div>
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
                  <th className="px-5 py-3">Reference No</th>
                  <th className="px-5 py-3">Organization / Firm</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Attendance</th>
                  <th className="px-5 py-3">Provincial Office</th>
                  <th className="px-5 py-3">Filed At</th>
                  <th className="px-5 py-3">Review Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-950">{s.ref}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{s.contractor}</p>
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
                    <td className="px-5 py-3.5">{getCategoryBadge(s)}</td>
                    <td className="px-5 py-3.5">
                      {s.questionnaireData?.willParticipate === "No" ? (
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                          <UserX className="w-3.5 h-3.5" /> No (Declined)
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Yes ({s.questionnaireData?.participant2?.fullName?.trim() ? "2 Attendees" : "1 Attendee"})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">
                      {(() => {
                        const supProv = s.questionnaireData?.supplierDetails?.province;
                        const conProv = s.questionnaireData?.province;
                        const realProv =
                          supProv ||
                          (conProv && conProv !== "Western Province" ? conProv : null) ||
                          (s.questionnaireData?.participantCategory === "Supplier" ? s.provincialOffice : null);
                        if (realProv) {
                          return <span className="font-semibold text-slate-800">{realProv}</span>;
                        }
                        return <span className="text-slate-400">—</span>;
                      })()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{s.submittedAt}</td>
                    <td className="px-5 py-3.5">{getStatusBadge(s.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedSub(s)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                          title="Inspect Submission Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
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
                            <p className="font-bold text-slate-800">{selectedSub.questionnaireData.cidaGrade}</p>
                          </div>
                        )}
                        {selectedSub.questionnaireData.generalExperience && (
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold">Experience</span>
                            <p className="font-semibold text-slate-800">{selectedSub.questionnaireData.generalExperience}</p>
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
                            {selectedSub.questionnaireData.areasOfSpecialty.map((s: string) => (
                              <span key={s} className="px-2 py-0.5 rounded bg-blue-100/80 text-blue-900 text-[11px] font-medium">
                                {s}
                              </span>
                            ))}
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
                                <div key={idx} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-bold text-slate-900">Contract {idx + 1}: </span>
                                    <span>{oc.contractName}</span>
                                  </div>
                                  <div className="text-right">
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
                {selectedSub.questionnaireData.mattersForDiscussion && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                    <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                      Matters for Discussion (07 Dec 2026 Agenda)
                    </span>
                    <p className="text-slate-700 italic bg-white p-3 rounded border border-slate-200/80 leading-relaxed">
                      &ldquo;{selectedSub.questionnaireData.mattersForDiscussion}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-slate-500 text-center text-xs">
                No questionnaire payload attached to this legacy submission reference.
              </div>
            )}

            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
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
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all min-h-[38px]"
              >
                Close Inspection
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
