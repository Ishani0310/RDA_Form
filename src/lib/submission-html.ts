export interface FormattedSubmissionForHtml {
  id: string;
  ref: string;
  contractor: string;
  regNo?: string;
  grade?: string;
  submissionType?: string;
  provincialOffice?: string;
  status: string;
  category?: string;
  schemaVersion?: string;
  questionnaireData?: any;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string | null;
  reviewedBy?: string;
  reviewNotes?: string | null;
  editRequested?: boolean;
  editRequestReason?: string | null;
  editRequestedAt?: string | null;
}

export function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateSubmissionHtml(sub: FormattedSubmissionForHtml): string {
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

