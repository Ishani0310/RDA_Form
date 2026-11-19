"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ArrowRight,
  FileText,
  KeyRound,
  RefreshCw,
  Clock,
  Sparkles,
  Users,
  Briefcase,
  Layers,
  HelpCircle,
  Calendar,
  Truck,
  Info,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { evaluateConditionalRule } from "@/components/dynamic-form/DynamicFormRenderer";
import {
  OfficialQuestionnaireData,
  FINANCIAL_YEARS,
  FinancialYearKey,
  FinancialYearIndicators,
  createEmptyFinancialIndicators,
  createEmptyFiveYearStatements,
  createEmptySimilarWorks,
  createEmptyOngoingWorks,
  createEmptySupplierDetails,
  calculateTotalEquity,
  calculateWorkingCapital,
  SimilarWorkContract,
  OngoingWorkContract,
  SupplierDetails,
  CidaGradeOption,
  AreaOfSpecialty,
  GeneralExperienceOption,
  SimilarWorkContractType,
  SimilarWorkCompletionStatus,
  SUPPLIER_MATERIALS,
  SRI_LANKA_PROVINCES,
  PROVINCE_DISTRICT_MAP,
  SriLankaProvince,
} from "@/lib/questionnaire-types";

const CIDA_GRADES: CidaGradeOption[] = [
  "CS2",
  "CS1",
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
  "SP1",
  "SP2",
  "SP3",
  "SP4",
  "SP5",
  "Not registered with CIDA",
  "Other",
];

const SPECIALTY_OPTIONS: AreaOfSpecialty[] = [
  "Highway",
  "Bridges",
  "Soil Nailing & Stabilization",
  "Other",
];

const GENERAL_EXP_OPTIONS: GeneralExperienceOption[] = [
  "Less than 5 years",
  "5 to 10 years",
  "More than 10 and up to 20 years",
  "More than 20 and up to 30 years",
  "More than 30 years",
];

const CONTRACT_TYPE_OPTIONS: SimilarWorkContractType[] = [
  "Highway",
  "Bridges",
  "Geotechnical, Soil Nailing & Stabilization",
  "Other",
];

const COMPLETION_STATUS_OPTIONS: SimilarWorkCompletionStatus[] = [
  "Substantially completed",
  "Fully completed (Performance Certificate issued)",
];

const CURRENCY_OPTIONS = ["LKR", "USD", "EUR", "JPY", "GBP", "Other"];

function RegisterForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  // Tab: "form" or "resume"
  const [activeTab, setActiveTab] = useState<"form" | "resume">("form");
  const [resumeTokenInput, setResumeTokenInput] = useState(tokenFromUrl);
  const [activeResumeToken, setActiveResumeToken] = useState(tokenFromUrl);
  const [showWorkshopInfo, setShowWorkshopInfo] = useState(false);

  // Questionnaire Form State
  const [formData, setFormData] = useState<OfficialQuestionnaireData>({
    organizationName: "",
    contactNumber: "",
    email: "",
    willParticipate: "",
    participantCategory: "",
    participant1: { fullName: "", mobileNumber: "", designation: "" },
    participant2: { fullName: "", mobileNumber: "", designation: "" },
    supplierDetails: createEmptySupplierDetails(),
    ictadRegistrationNumber: "",
    areasOfSpecialty: [],
    specialtyOther: "",
    cidaGrade: "",
    cidaGradeOther: "",
    financialStatements: createEmptyFiveYearStatements(),
    loanCommitments: { twoYearRepaymentsDue2026To2028: null },
    hasOngoingContracts: "",
    totalOutstandingValueLkrMillion: null,
    ongoingContracts: createEmptyOngoingWorks(),
    generalExperience: "",
    similarWorks: createEmptySimilarWorks(),
    mattersForDiscussion: "",
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [formAlert, setFormAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [resumeAlert, setResumeAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    reference: string;
    businessName: string;
    submittedAt: string;
    provincialOffice: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishedQuestionnaire, setPublishedQuestionnaire] = useState<any>(null);

  // Load active published questionnaire schema
  useEffect(() => {
    fetch("/api/public/questionnaire")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.questionnaire) {
          setPublishedQuestionnaire(d.questionnaire);
        }
      })
      .catch(() => {});
  }, []);

  const BASELINE_QUESTION_IDS = useMemo(
    () =>
      new Set([
        "organizationName",
        "contactNumber",
        "email",
        "willParticipate",
        "participantCategory",
        "participant1.fullName",
        "participant1.mobileNumber",
        "participant1.designation",
        "participant2.fullName",
        "participant2.mobileNumber",
        "participant2.designation",
        "supplierDetails.companyName",
        "supplierDetails.materialsSupplied",
        "supplierDetails.locationAddress",
        "supplierDetails.province",
        "supplierDetails.district",
        "ictadRegistrationNumber",
        "areasOfSpecialty",
        "cidaGrade",
        "financialStatements",
        "loanCommitments.twoYearRepaymentsDue2026To2028",
        "hasOngoingContracts",
        "totalOutstandingValueLkrMillion",
        "ongoingContracts",
        "generalExperience",
        "similarWorks",
        "mattersForDiscussion",
      ]),
    []
  );

  const getDynamicQuestionsForSection = (sectionCode: string) => {
    if (!publishedQuestionnaire?.sections) return [];
    const sec = publishedQuestionnaire.sections.find(
      (s: any) => s.code === sectionCode || s.id === sectionCode
    );
    if (!sec || !sec.questions) return [];
    return sec.questions.filter(
      (q: any) => !BASELINE_QUESTION_IDS.has(q.id) && !BASELINE_QUESTION_IDS.has(q.code)
    );
  };

  const getAdditionalDynamicSections = () => {
    if (!publishedQuestionnaire?.sections) return [];
    const baselineSectionCodes = new Set([
      "SEC-01",
      "SEC-02",
      "SEC-03",
      "SEC-04",
      "SEC-05",
      "SEC-06",
      "SEC-07",
      "SEC-08",
      "SEC-09",
      "SEC-10",
      "SEC-11",
      "sec-basic-info",
      "sec-participant-category",
      "sec-participants",
      "sec-supplier-details",
      "sec-contractor-details",
      "sec-financial-capability",
      "sec-work-commitments",
      "sec-ongoing-works",
      "sec-general-experience",
      "sec-similar-works",
      "sec-matters-discussion",
    ]);
    return publishedQuestionnaire.sections.filter(
      (s: any) => !baselineSectionCodes.has(s.code) && !baselineSectionCodes.has(s.id)
    );
  };

  const renderDynamicQuestionField = (q: any) => {
    if (!evaluateConditionalRule(q.conditionalLogic, formData as any)) return null;

    const val = (formData as any)[q.id] ?? (formData as any)[q.code] ?? "";
    const setVal = (newVal: any) => {
      setFormData((prev: any) => ({
        ...prev,
        [q.id]: newVal,
      }));
    };

    return (
      <div key={q.id} className="space-y-1.5 pt-2">
        <label className="block font-semibold text-slate-700">
          <span className="text-blue-900 font-mono text-xs mr-1 font-bold">[{q.code}]</span>
          <span>{q.text}</span>
          {q.isRequired && <span className="text-rose-500 font-bold ml-1">*</span>}
        </label>
        {q.description && <p className="text-xs text-slate-500">{q.description}</p>}

        {q.fieldType === "long_text" ? (
          <textarea
            rows={3}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={q.placeholder || ""}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
          />
        ) : q.fieldType === "dropdown" ? (
          <select
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
          >
            <option value="">-- Select an option --</option>
            {(q.options || []).map((opt: any) => (
              <option key={opt.id || opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : q.fieldType === "radio" ? (
          <div className="space-y-2">
            {(q.options || []).map((opt: any) => (
              <label
                key={opt.id || opt.value}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`dyn-rad-${q.id}`}
                  value={opt.value}
                  checked={val === opt.value}
                  onChange={() => setVal(opt.value)}
                  className="w-4 h-4 text-blue-900"
                />
                <span className="text-xs text-slate-800 font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        ) : q.fieldType === "yes_no" ? (
          <div className="flex gap-3">
            {["Yes", "No"].map((c) => (
              <label
                key={c}
                className="flex items-center gap-2 px-4 py-2 bg-slate-50 border rounded-lg cursor-pointer"
              >
                <input
                  type="radio"
                  name={`dyn-yn-${q.id}`}
                  value={c}
                  checked={val === c}
                  onChange={() => setVal(c)}
                  className="w-4 h-4 text-blue-900"
                />
                <span className="text-xs font-semibold">{c}</span>
              </label>
            ))}
          </div>
        ) : (
          <input
            type={
              q.fieldType === "email"
                ? "email"
                : q.fieldType === "url"
                ? "url"
                : q.fieldType === "telephone"
                ? "tel"
                : q.fieldType === "integer" ||
                  q.fieldType === "decimal" ||
                  q.fieldType === "currency"
                ? "number"
                : q.fieldType === "date"
                ? "date"
                : "text"
            }
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={q.placeholder || ""}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
          />
        )}
        {q.helpText && <p className="text-[11px] text-slate-400">{q.helpText}</p>}
      </div>
    );
  };

  const handleTabChange = (tab: "form" | "resume") => {
    setActiveTab(tab);
    setFormAlert(null);
    setResumeAlert(null);
  };

  // Auto-load draft if token in URL
  useEffect(() => {
    if (tokenFromUrl) {
      loadDraft(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const loadDraft = async (token: string) => {
    const clean = token.trim();
    if (!clean) return;
    setLoading(true);
    setResumeAlert(null);
    setFormAlert(null);
    try {
      const res = await fetch(`/api/public/draft?token=${clean}`);
      const data = await res.json();
      if (res.ok && data.success && data.draft) {
        const q = data.draft.questionnaireData || {};
        const c = data.draft.contractor || {};

        const rawFinancials = q.financialStatements || createEmptyFiveYearStatements();
        const restoredFinancials = { ...rawFinancials };
        for (const yrKey of FINANCIAL_YEARS) {
          const yr = { ...(restoredFinancials[yrKey] || createEmptyFinancialIndicators()) };
          const calcEquity = calculateTotalEquity(yr.totalAssets, yr.totalLiabilities);
          const calcWorkingCap = calculateWorkingCapital(yr.currentAssets, yr.currentLiabilities);
          yr.totalEquity = calcEquity !== null ? calcEquity : yr.totalEquity;
          yr.workingCapital = calcWorkingCap !== null ? calcWorkingCap : yr.workingCapital;
          restoredFinancials[yrKey] = yr;
        }

        setFormData({
          organizationName: q.organizationName || c.businessName || "",
          contactNumber: q.contactNumber || c.contactOfficer?.phone || "",
          email: q.email || c.contactOfficer?.email || "",
          willParticipate: q.willParticipate || "",
          participantCategory: q.participantCategory || "",
          participant1: q.participant1 || {
            fullName: c.contactOfficer?.name || "",
            mobileNumber: c.contactOfficer?.phone || "",
            designation: c.contactOfficer?.designation || "",
          },
          participant2: q.participant2 || { fullName: "", mobileNumber: "", designation: "" },
          supplierDetails: q.supplierDetails || createEmptySupplierDetails(),
          ictadRegistrationNumber: q.ictadRegistrationNumber || c.registrationNumber || "",
          areasOfSpecialty: Array.isArray(q.areasOfSpecialty) ? q.areasOfSpecialty : [],
          specialtyOther: q.specialtyOther || "",
          cidaGrade: q.cidaGrade || c.cidaGrade || "",
          cidaGradeOther: q.cidaGradeOther || "",
          financialStatements: restoredFinancials,
          loanCommitments: q.loanCommitments || { twoYearRepaymentsDue2026To2028: null },
          hasOngoingContracts: q.hasOngoingContracts || "",
          totalOutstandingValueLkrMillion: q.totalOutstandingValueLkrMillion ?? null,
          ongoingContracts: Array.isArray(q.ongoingContracts) && q.ongoingContracts.length > 0 ? q.ongoingContracts : createEmptyOngoingWorks(),
          generalExperience: q.generalExperience || "",
          similarWorks: Array.isArray(q.similarWorks) && q.similarWorks.length > 0 ? q.similarWorks : createEmptySimilarWorks(),
          mattersForDiscussion: q.mattersForDiscussion || "",
        });

        setActiveResumeToken(clean);
        setResumeAlert(null);
        setActiveTab("form");
        setFormAlert({
          type: "success",
          message: `Saved draft restored successfully (${data.draft.submissionReference}). Expires: ${new Date(
            data.draft.expiresAt
          ).toLocaleDateString("en-GB")}.`,
        });
      } else {
        setResumeAlert({ type: "error", message: data.message || "Failed to restore draft from resume token." });
      }
    } catch {
      setResumeAlert({ type: "error", message: "Network error loading saved draft session." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const orgName = formData.organizationName.trim() || formData.supplierDetails?.companyName?.trim();
    if (!orgName) {
      setFormAlert({ type: "error", message: "Organization / Company name is required to save draft progress." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setFormAlert(null);

    try {
      const payload: Record<string, unknown> = {
        questionnaireData: formData,
        businessName: orgName,
        registrationNumber: formData.ictadRegistrationNumber || undefined,
        cidaGrade: formData.cidaGrade || undefined,
        province: formData.supplierDetails?.province || "Western Province",
        district: formData.supplierDetails?.district || undefined,
        contactOfficer: {
          name: formData.participant1?.fullName || "Authorized Representative",
          phone: formData.contactNumber || "+94 11 000 0000",
          email: formData.email || "contact@rda.gov.lk",
        },
      };

      if (activeResumeToken) {
        payload.resumeToken = activeResumeToken;
      }

      const res = await fetch("/api/public/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        setGeneratedToken(data.token);
        setActiveResumeToken(data.token);
        setFormAlert({
          type: "success",
          message: data.isNew
            ? "New draft saved! Please copy your 64-character resume token below to resume anytime."
            : "Draft progress updated successfully.",
        });
      } else {
        setFormAlert({ type: "error", message: data.message || "Failed to save draft progress." });
      }
    } catch {
      setFormAlert({ type: "error", message: "Network error occurred while saving draft." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    setLoading(true);
    setFormAlert(null);

    try {
      const orgName = formData.organizationName.trim() || formData.supplierDetails?.companyName?.trim();

      // Enforce dynamic questions validation according to active published questionnaire
      if (publishedQuestionnaire?.sections) {
        for (const sec of publishedQuestionnaire.sections) {
          for (const q of sec.questions) {
            if (
              q.isRequired &&
              !BASELINE_QUESTION_IDS.has(q.id) &&
              evaluateConditionalRule(q.conditionalLogic, formData as any)
            ) {
              const val = (formData as any)[q.id] ?? (formData as any)[q.code];
              if (
                val === undefined ||
                val === null ||
                val === "" ||
                (Array.isArray(val) && val.length === 0)
              ) {
                setFormAlert({
                  type: "error",
                  message: `${q.text} is required.`,
                });
                window.scrollTo({ top: 0, behavior: "smooth" });
                setLoading(false);
                return;
              }
            }
          }
        }
      }
      const savePayload: Record<string, unknown> = {
        questionnaireData: formData,
        businessName: orgName || "Registered Entity",
        registrationNumber: formData.ictadRegistrationNumber || undefined,
        cidaGrade: formData.cidaGrade || undefined,
        province: formData.supplierDetails?.province || "Western Province",
        district: formData.supplierDetails?.district || undefined,
        contactOfficer: {
          name: formData.participant1?.fullName || "Authorized Representative",
          phone: formData.contactNumber || "+94 11 000 0000",
          email: formData.email || "contact@rda.gov.lk",
        },
      };
      if (activeResumeToken) savePayload.resumeToken = activeResumeToken;

      const saveRes = await fetch("/api/public/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });
      const saveData = await saveRes.json();

      if (!saveRes.ok || !saveData.success || !saveData.token) {
        throw new Error(saveData.message || "Failed to sync latest questionnaire inputs.");
      }

      const tokenToSubmit = saveData.token;

      // Finalize submission
      const subRes = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeToken: tokenToSubmit }),
      });
      const subData = await subRes.json();

      if (subRes.ok && subData.success && subData.submission) {
        setSubmissionSuccess(subData.submission);
        setActiveResumeToken("");
        setGeneratedToken(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setFormAlert({ type: "error", message: subData.message || "Submission rejected. Please check all required fields." });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      setFormAlert({ type: "error", message: err instanceof Error ? err.message : "Network error during submission." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Contractor Specialities
  const handleSpecialtyChange = (spec: AreaOfSpecialty) => {
    const current = formData.areasOfSpecialty || [];
    if (current.includes(spec)) {
      setFormData({
        ...formData,
        areasOfSpecialty: current.filter((s) => s !== spec),
        specialtyOther: spec === "Other" ? "" : formData.specialtyOther,
      });
    } else {
      setFormData({
        ...formData,
        areasOfSpecialty: [...current, spec],
      });
    }
  };

  // Handlers for Supplier Materials & Capacity
  const handleSupplierMaterialToggle = (mat: string) => {
    const current = formData.supplierDetails?.materialsSupplied || [];
    const caps = { ...(formData.supplierDetails?.supplyCapacities || {}) };

    if (current.includes(mat)) {
      const filtered = current.filter((m) => m !== mat);
      delete caps[mat];
      setFormData({
        ...formData,
        supplierDetails: {
          ...(formData.supplierDetails || createEmptySupplierDetails()),
          materialsSupplied: filtered,
          materialsOther: mat === "Other" ? "" : formData.supplierDetails?.materialsOther,
          supplyCapacities: caps,
        },
      });
    } else {
      caps[mat] = caps[mat] || { quantity: "", unit: "MT per year" };
      setFormData({
        ...formData,
        supplierDetails: {
          ...(formData.supplierDetails || createEmptySupplierDetails()),
          materialsSupplied: [...current, mat],
          supplyCapacities: caps,
        },
      });
    }
  };

  const handleSupplierCapacityChange = (
    mat: string,
    field: "quantity" | "unit",
    value: string
  ) => {
    const currentCaps = { ...(formData.supplierDetails?.supplyCapacities || {}) };
    const item = currentCaps[mat] || { quantity: "", unit: "MT per year" };
    currentCaps[mat] = {
      ...item,
      [field]: value,
    };

    setFormData({
      ...formData,
      supplierDetails: {
        ...(formData.supplierDetails || createEmptySupplierDetails()),
        supplyCapacities: currentCaps,
      },
    });
  };

  // Financial Matrix Change Handler
  const handleFinancialChange = (
    year: FinancialYearKey,
    key: keyof FinancialYearIndicators,
    value: string
  ) => {
    // Read-only calculated fields cannot be manually modified
    if (key === "totalEquity" || key === "workingCapital") {
      return;
    }

    const stmts = { ...(formData.financialStatements || createEmptyFiveYearStatements()) };
    const yr = { ...(stmts[year] || createEmptyFinancialIndicators()) };
    if (value === "") {
      yr[key] = null;
    } else {
      const parsed = Number(value);
      yr[key] = isNaN(parsed) ? null : parsed;
    }

    // Automatically calculate Total Equity whenever Total Assets or Total Liabilities change
    if (key === "totalAssets" || key === "totalLiabilities") {
      yr.totalEquity = calculateTotalEquity(yr.totalAssets, yr.totalLiabilities);
    }

    // Automatically calculate Working Capital whenever Current Assets or Current Liabilities change
    if (key === "currentAssets" || key === "currentLiabilities") {
      yr.workingCapital = calculateWorkingCapital(yr.currentAssets, yr.currentLiabilities);
    }

    stmts[year] = yr;
    setFormData({ ...formData, financialStatements: stmts });
  };

  // Ongoing Contracts Change Handler
  const handleOngoingContractChange = (
    index: number,
    field: keyof OngoingWorkContract,
    value: any
  ) => {
    const list = [...(formData.ongoingContracts || createEmptyOngoingWorks())];
    let parsedValue = value;
    if (field === "contractAmount") {
      if (value === "" || value === null || value === undefined) {
        parsedValue = null;
      } else {
        const parsed = Number(value);
        parsedValue = isNaN(parsed) ? null : parsed;
      }
    }
    list[index] = {
      ...(list[index] || {
        contractIndex: index + 1,
        contractName: "",
        contractAmount: null,
        currency: "LKR",
        completionDate: null,
      }),
      [field]: parsedValue,
    };
    setFormData({ ...formData, ongoingContracts: list });
  };

  // Similar Works Change Handler
  const handleContractChange = (
    index: number,
    field: keyof SimilarWorkContract,
    value: any
  ) => {
    const list = [...(formData.similarWorks || createEmptySimilarWorks())];
    let parsedValue = value;
    if (field === "contractAmount") {
      if (value === "" || value === null || value === undefined) {
        parsedValue = null;
      } else {
        const parsed = Number(value);
        parsedValue = isNaN(parsed) ? null : parsed;
      }
    }
    list[index] = {
      ...(list[index] || {
        contractIndex: index + 1,
        contractType: "",
        contractName: "",
        contractAmount: null,
        startDate: null,
        completionDate: null,
        completionStatus: "",
      }),
      [field]: parsedValue,
    };
    setFormData({ ...formData, similarWorks: list });
  };

  const copyTokenLink = () => {
    if (!generatedToken) return;
    const url = `${window.location.origin}/register?token=${generatedToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Official receipt screen upon completed submission
  if (submissionSuccess) {
    return (
      <div className="max-w-xl mx-auto my-8 sm:my-12 px-4 sm:px-0">
        <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase">
              Official Filing Confirmed
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 tracking-tight">
              Submission Received Successfully
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Your data has been formally recorded in the Road Development Authority repository for the Early Market Engagement Workshop under the Inclusive Connectivity and Development Project (ICDP).
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-sans">Submission Reference:</span>
              <span className="font-bold text-blue-900">{submissionSuccess.reference}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-sans">Organization / Entity:</span>
              <span className="font-bold text-slate-800">{submissionSuccess.businessName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-sans">Workshop Date:</span>
              <span className="text-slate-700 font-bold">07 December 2026</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Recorded Timestamp:</span>
              <span className="text-slate-700">
                {new Date(submissionSuccess.submittedAt).toLocaleString("en-GB")}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.print()}
              className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
            >
              Print Submission Receipt
            </button>
            <button
              onClick={() => {
                setSubmissionSuccess(null);
                setFormData({
                  organizationName: "",
                  contactNumber: "",
                  email: "",
                  willParticipate: "",
                  participantCategory: "",
                  participant1: { fullName: "", mobileNumber: "", designation: "" },
                  participant2: { fullName: "", mobileNumber: "", designation: "" },
                  supplierDetails: createEmptySupplierDetails(),
                  ictadRegistrationNumber: "",
                  areasOfSpecialty: [],
                  specialtyOther: "",
                  cidaGrade: "",
                  cidaGradeOther: "",
                  financialStatements: createEmptyFiveYearStatements(),
                  loanCommitments: { twoYearRepaymentsDue2026To2028: null },
                  hasOngoingContracts: "",
                  totalOutstandingValueLkrMillion: null,
                  ongoingContracts: createEmptyOngoingWorks(),
                  generalExperience: "",
                  similarWorks: createEmptySimilarWorks(),
                  mattersForDiscussion: "",
                });
              }}
              className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 sm:my-10 lg:my-12 px-3 sm:px-4 lg:px-6 space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-[#0b1f3a] text-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0b1f3a] rounded-[10px] flex items-center justify-center text-amber-400 font-black text-xs tracking-wider">
                RDA
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-widest font-bold text-amber-400 uppercase">
                  Road Development Authority &bull; Sri Lanka
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                  ICDP OFFICIAL PORTAL
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight mt-0.5 leading-snug">
                Inclusive Connectivity and Development Project (ICDP)
              </h1>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Early Market Engagement Workshop &bull; 07 December 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-colors"
            >
              <span>Officer Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Official Workshop Information & Inquiries Accordion Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowWorkshopInfo(!showWorkshopInfo)}
          className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-900 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                About the Workshop &amp; Registration Instructions
              </span>
              <span className="text-[11px] text-slate-500">
                Date: 07 Dec 2026 &bull; Time: 9.00 AM &bull; Deadline: 05 Dec 2026 &bull; Click to {showWorkshopInfo ? "hide" : "view"} official details
              </span>
            </div>
          </div>
          {showWorkshopInfo ? (
            <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          )}
        </button>

        {showWorkshopInfo && (
          <div className="p-4 sm:p-6 space-y-4 border-t border-slate-200 bg-white leading-relaxed text-slate-700">
            {/* Provisional Date Check Alert */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">Notice Regarding Workshop Date Schedule</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  The workshop date specified for registration and planning is <strong>07 December 2026 (9.00 AM)</strong>. An earlier internal draft cited 30 November 2026; in accordance with official project instructions, 07 December 2026 is published provisionally for all stakeholder registration arrangements.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                  Workshop Overview
                </h3>
                <p>
                  The Road Development Authority (RDA) under the Inclusive Connectivity and Development Project (ICDP) is conducting an Early Market Engagement Workshop to engage prospective contractors, materials suppliers, and institutional stakeholders in the development and procurement framework.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                  Key Milestones &amp; Contacts
                </h3>
                <div className="space-y-1.5 text-[11px]">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    <strong>Workshop Date:</strong> 07 December 2026 at 9.00 AM
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-700" />
                    <strong>Registration Deadline:</strong> 05 December 2026
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-700" />
                    <strong>Inquiry Contact:</strong> 070 697 0408 (Thilina Tharinda)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-700" />
                    <strong>Registration Email:</strong>{" "}
                    <a
                      href="mailto:senehassenehas64@gmail.com"
                      className="text-blue-900 underline hover:text-blue-700 font-medium"
                    >
                      senehassenehas64@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Questionnaire Form vs Resume Saved Draft */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-t-xl px-2 sm:px-4 pt-2 gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => handleTabChange("form")}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 min-h-[44px] ${
            activeTab === "form"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span>Questionnaire Form</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("resume")}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 min-h-[44px] ${
            activeTab === "resume"
              ? "border-blue-900 text-blue-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          <span>Resume Saved Draft</span>
          {activeResumeToken && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          )}
        </button>
      </div>

      {/* TAB 1: FORM */}
      {activeTab === "form" && (
        <div className="space-y-6">
          {formAlert && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                formAlert.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              {formAlert.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-semibold">{formAlert.message}</span>
            </div>
          )}

          {/* Generated Token Banner */}
          {generatedToken && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Your Private Resume Key (Keep Safe)
                </span>
                <button
                  type="button"
                  onClick={copyTokenLink}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:text-blue-700 bg-white px-2 py-1 rounded border border-blue-200"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied Link!" : "Copy Resume Link"}
                </button>
              </div>
              <code className="block p-2.5 bg-white rounded border border-blue-200 font-mono text-xs text-blue-950 select-all break-all">
                {generatedToken}
              </code>
              <p className="text-[11px] text-blue-800">
                You can bookmark or copy this key. It allows you to return to this questionnaire anytime within 30 days.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8">
            {/* SECTION 1: BASIC INFORMATION */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Building2 className="w-4 h-4 text-blue-900" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Section 1: Basic Information
                </h2>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Name of your Organization / Company / Institution *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="e.g. State Engineering Corporation / ABC Constructions Ltd"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Contact number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="e.g. 0112123456 / 0771234567"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. info@company.lk"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    Will you be participating in the workshop on 07 December 2026? *
                  </label>
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    <label className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2">
                      <input
                        type="radio"
                        name="willParticipate"
                        value="Yes"
                        checked={formData.willParticipate === "Yes"}
                        onChange={() => setFormData({ ...formData, willParticipate: "Yes" })}
                        className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                      />
                      <span className="font-medium text-slate-800">Yes</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2">
                      <input
                        type="radio"
                        name="willParticipate"
                        value="No"
                        checked={formData.willParticipate === "No"}
                        onChange={() => setFormData({ ...formData, willParticipate: "No" })}
                        className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                      />
                      <span className="font-medium text-slate-800">No</span>
                    </label>
                  </div>
                </div>

                {/* EARLY SUBMISSION PATH IF WILL NOT PARTICIPATE */}
                {formData.willParticipate === "No" && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="text-slate-600 leading-relaxed">
                      Thank you. Since you are not participating in the workshop on 07 December 2026, you may proceed to submit your basic organizational record immediately.
                    </p>

                    {formAlert && (
                      <div
                        className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                          formAlert.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-rose-50 border-rose-200 text-rose-900"
                        }`}
                      >
                        {formAlert.type === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <span className="leading-relaxed font-semibold">{formAlert.message}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSubmitFinal}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-md transition-all disabled:opacity-60 min-h-[44px]"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                      <span>Submit Response Directly</span>
                    </button>
                  </div>
                )}

                {/* Dynamic Questions configured for Section 1 */}
                {getDynamicQuestionsForSection("SEC-01").map(renderDynamicQuestionField)}
              </div>
            </div>

            {/* IF PARTICIPATING === "YES" */}
            {formData.willParticipate === "Yes" && (
              <>
                {/* SECTION 2: PARTICIPANT CATEGORY */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Users className="w-4 h-4 text-blue-900" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Section 2: Participant Category
                    </h2>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-2">
                        Which category do you represent? *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        {(["Contractor", "Supplier", "Government Officer"] as const).map((cat) => (
                          <label
                            key={cat}
                            className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all min-h-[44px] ${
                              formData.participantCategory === cat
                                ? "bg-blue-50/80 border-blue-900 text-blue-950 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="radio"
                              name="participantCategory"
                              value={cat}
                              checked={formData.participantCategory === cat}
                              onChange={() => setFormData({ ...formData, participantCategory: cat })}
                              className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                            />
                            <span>{cat}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* BRANCH A: GOVERNMENT OFFICER PARTICIPANT DETAILS (SECTION 3A) */}
                {/* ------------------------------------------------------------- */}
                {formData.participantCategory === "Government Officer" && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Users className="w-4 h-4 text-blue-900" />
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        Section 3A: Government Officer Participant Details
                      </h2>
                    </div>

                    <div className="space-y-4 text-xs">
                      {/* Participant 1 (Required) */}
                      <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                        <span className="text-[11px] font-bold text-blue-900 uppercase">
                          Participant 1 (Required)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.participant1?.fullName || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                    fullName: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. Eng. Sunil Perera"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                            <input
                              type="tel"
                              required
                              value={formData.participant1?.mobileNumber || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                    mobileNumber: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. 0771234567"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                            <input
                              type="text"
                              required
                              value={formData.participant1?.designation || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                    designation: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. Executive Engineer"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Participant 2 (Optional) */}
                      <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                        <span className="text-[11px] font-bold text-slate-600 uppercase">
                          Participant 2 (Optional)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                            <input
                              type="text"
                              value={formData.participant2?.fullName || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant2: {
                                    ...(formData.participant2 || { fullName: "", mobileNumber: "", designation: "" }),
                                    fullName: e.target.value,
                                  },
                                })
                              }
                              placeholder="Second attendee name"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                            <input
                              type="tel"
                              value={formData.participant2?.mobileNumber || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant2: {
                                    ...(formData.participant2 || { fullName: "", mobileNumber: "", designation: "" }),
                                    mobileNumber: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. 0719876543"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                            <input
                              type="text"
                              value={formData.participant2?.designation || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant2: {
                                    ...(formData.participant2 || { fullName: "", mobileNumber: "", designation: "" }),
                                    designation: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. Assistant Director"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* BRANCH B: SUPPLIER PARTICIPANT & SUPPLIER DETAILS (SECTIONS 3B & 4) */}
                {/* ------------------------------------------------------------- */}
                {formData.participantCategory === "Supplier" && (
                  <>
                    {/* SECTION 3B: PARTICIPANT DETAILS (SUPPLIER - ONLY 1 REP) */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Users className="w-4 h-4 text-blue-900" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          Section 3B: Supplier Representative Details
                        </h2>
                      </div>

                      <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 text-xs">
                        <span className="text-[11px] font-bold text-blue-900 uppercase">
                          Representative Details (Required)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.participant1?.fullName || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                    fullName: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. K. L. Wickramasinghe"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                            <input
                              type="tel"
                              required
                              value={formData.participant1?.mobileNumber || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                    mobileNumber: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. 0779876543"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                            <input
                              type="text"
                              required
                              value={formData.participant1?.designation || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                    designation: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. Sales Director / General Manager"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: SUPPLIER DETAILS */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Truck className="w-4 h-4 text-blue-900" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          Section 4: Supplier Details
                        </h2>
                      </div>

                      <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-950">
                        <p className="leading-relaxed">
                          Please provide details of the materials you supply and your production/supply capacity.
                        </p>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Material Selection */}
                        <div>
                          <label className="block font-semibold text-slate-700 mb-2">
                            Please select the material(s) you supply * (Multiple selection allowed)
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {SUPPLIER_MATERIALS.map((mat) => {
                              const isChecked = (formData.supplierDetails?.materialsSupplied || []).includes(mat);
                              return (
                                <label
                                  key={mat}
                                  className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                                    isChecked
                                      ? "bg-blue-50/80 border-blue-800 text-blue-950 font-semibold"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleSupplierMaterialToggle(mat)}
                                    className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800"
                                  />
                                  <span>{mat}</span>
                                </label>
                              );
                            })}
                          </div>
                          {(formData.supplierDetails?.materialsSupplied || []).includes("Other") && (
                            <div className="mt-2.5">
                              <input
                                type="text"
                                value={formData.supplierDetails?.materialsOther || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    supplierDetails: {
                                      ...(formData.supplierDetails || createEmptySupplierDetails()),
                                      materialsOther: e.target.value,
                                    },
                                  })
                                }
                                placeholder="If Other, please specify your material type..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                              />
                            </div>
                          )}
                        </div>

                        {/* Company Name */}
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Company Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.supplierDetails?.companyName || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                supplierDetails: {
                                  ...(formData.supplierDetails || createEmptySupplierDetails()),
                                  companyName: e.target.value,
                                },
                              })
                            }
                            placeholder="e.g. Lanka Ready-Mix & Asphalt Products (Pvt) Ltd"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                          />
                        </div>

                        {/* Annual Supply Capacity Per Selected Material */}
                        {(formData.supplierDetails?.materialsSupplied || []).length > 0 && (
                          <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <div>
                              <span className="font-bold text-slate-900 uppercase text-[11px] block">
                                Annual Supply Capacity *
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Specify production or supply capacity and unit for each selected material (e.g., Cement: 50,000 MT per year; Sand: 20,000 cubic meters per year).
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {(formData.supplierDetails?.materialsSupplied || []).map((mat) => {
                                const cap = formData.supplierDetails?.supplyCapacities?.[mat] || {
                                  quantity: "",
                                  unit: "MT per year",
                                };
                                const displayName = mat === "Other" && formData.supplierDetails?.materialsOther ? `Other (${formData.supplierDetails.materialsOther})` : mat;

                                return (
                                  <div
                                    key={mat}
                                    className="p-3 bg-white border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                  >
                                    <span className="font-semibold text-blue-950 sm:w-1/3">
                                      {displayName}
                                    </span>
                                    <div className="flex items-center gap-2 sm:w-2/3">
                                      <input
                                        type="text"
                                        value={cap.quantity !== null && cap.quantity !== undefined ? cap.quantity : ""}
                                        onChange={(e) => handleSupplierCapacityChange(mat, "quantity", e.target.value)}
                                        placeholder="Quantity (e.g. 50,000)"
                                        className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                                      />
                                      <input
                                        type="text"
                                        value={cap.unit || ""}
                                        onChange={(e) => handleSupplierCapacityChange(mat, "unit", e.target.value)}
                                        placeholder="Unit (e.g. MT / cu.m / year)"
                                        className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Location Address */}
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Location Address *
                          </label>
                          <textarea
                            rows={2}
                            required
                            value={formData.supplierDetails?.locationAddress || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                supplierDetails: {
                                  ...(formData.supplierDetails || createEmptySupplierDetails()),
                                  locationAddress: e.target.value,
                                },
                              })
                            }
                            placeholder="Physical address of manufacturing plant, quarry, or central distribution warehouse..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                          />
                        </div>

                        {/* Province & District (Dependent Dropdown) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              Province *
                            </label>
                            <select
                              required
                              value={formData.supplierDetails?.province || ""}
                              onChange={(e) => {
                                const newProv = e.target.value;
                                setFormData({
                                  ...formData,
                                  supplierDetails: {
                                    ...(formData.supplierDetails || createEmptySupplierDetails()),
                                    province: newProv,
                                    district: "", // reset district when province changes
                                  },
                                });
                              }}
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                            >
                              <option value="">— Select Province —</option>
                              {SRI_LANKA_PROVINCES.map((prov) => (
                                <option key={prov} value={prov}>
                                  {prov}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              District *
                            </label>
                            <select
                              required
                              disabled={!formData.supplierDetails?.province}
                              value={formData.supplierDetails?.district || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  supplierDetails: {
                                    ...(formData.supplierDetails || createEmptySupplierDetails()),
                                    district: e.target.value,
                                  },
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium disabled:opacity-50"
                            >
                              <option value="">— Select District —</option>
                              {formData.supplierDetails?.province &&
                                (PROVINCE_DISTRICT_MAP[formData.supplierDetails.province as SriLankaProvince] || []).map(
                                  (dist) => (
                                    <option key={dist} value={dist}>
                                      {dist}
                                    </option>
                                  )
                                )}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ------------------------------------------------------------- */}
                {/* BRANCH C: CONTRACTOR SPECIFIC FLOW (SECTIONS 3C THROUGH 10)   */}
                {/* ------------------------------------------------------------- */}
                {formData.participantCategory === "Contractor" && (
                  <>
                    {/* SECTION 3C: PARTICIPANT DETAILS (CONTRACTOR) */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Users className="w-4 h-4 text-blue-900" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          Section 3C: Contractor Representative Details
                        </h2>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Participant 1 (Required) */}
                        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                          <span className="text-[11px] font-bold text-blue-900 uppercase">
                            Participant 1 (Required)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                              <input
                                type="text"
                                required
                                value={formData.participant1?.fullName || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant1: {
                                      ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                      fullName: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. Eng. Sunil Perera"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                              <input
                                type="tel"
                                required
                                value={formData.participant1?.mobileNumber || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant1: {
                                      ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                      mobileNumber: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. 0771234567"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                              <input
                                type="text"
                                required
                                value={formData.participant1?.designation || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant1: {
                                      ...(formData.participant1 || { fullName: "", mobileNumber: "", designation: "" }),
                                      designation: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. Managing Director"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Participant 2 (Optional) */}
                        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            Participant 2 (Optional)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                              <input
                                type="text"
                                value={formData.participant2?.fullName || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant2: {
                                      ...(formData.participant2 || { fullName: "", mobileNumber: "", designation: "" }),
                                      fullName: e.target.value,
                                    },
                                  })
                                }
                                placeholder="Second attendee name"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                              <input
                                type="tel"
                                value={formData.participant2?.mobileNumber || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant2: {
                                      ...(formData.participant2 || { fullName: "", mobileNumber: "", designation: "" }),
                                      mobileNumber: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. 0719876543"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                              <input
                                type="text"
                                value={formData.participant2?.designation || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant2: {
                                      ...(formData.participant2 || { fullName: "", mobileNumber: "", designation: "" }),
                                      designation: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. Chief Engineer"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: CONTRACTOR DETAILS */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Briefcase className="w-4 h-4 text-blue-900" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          Section 4: Contractor Details
                        </h2>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            ICTAD registration number *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.ictadRegistrationNumber}
                            onChange={(e) =>
                              setFormData({ ...formData, ictadRegistrationNumber: e.target.value })
                            }
                            placeholder="e.g. CIDA/12450"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-2">
                            Areas of specialty * (Select all that apply)
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {SPECIALTY_OPTIONS.map((spec) => (
                              <label
                                key={spec}
                                className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100"
                              >
                                <input
                                  type="checkbox"
                                  checked={(formData.areasOfSpecialty || []).includes(spec)}
                                  onChange={() => handleSpecialtyChange(spec)}
                                  className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800"
                                />
                                <span className="font-medium text-slate-800">{spec}</span>
                              </label>
                            ))}
                          </div>
                          {(formData.areasOfSpecialty || []).includes("Other") && (
                            <div className="mt-2.5">
                              <input
                                type="text"
                                value={formData.specialtyOther || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, specialtyOther: e.target.value })
                                }
                                placeholder="If Other, please specify your area of specialty"
                                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            CIDA grading *
                          </label>
                          <select
                            value={formData.cidaGrade}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cidaGrade: e.target.value as CidaGradeOption,
                                cidaGradeOther: e.target.value !== "Other" ? "" : formData.cidaGradeOther,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                          >
                            <option value="">— Select CIDA Grading —</option>
                            {CIDA_GRADES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                          {formData.cidaGrade === "Other" && (
                            <div className="mt-2.5">
                              <input
                                type="text"
                                value={formData.cidaGradeOther || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, cidaGradeOther: e.target.value })
                                }
                                placeholder="If Other, please specify your CIDA grading"
                                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                              />
                            </div>
                          )}
                        </div>

                        {/* Dynamic Questions configured for Section 5 (Contractor Details) */}
                        {getDynamicQuestionsForSection("SEC-05").map(renderDynamicQuestionField)}
                      </div>
                    </div>

                    {/* SECTION 5: FINANCIAL CAPABILITY & SECTION 6: LOAN COMMITMENTS */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-900" />
                          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                            Section 5: Financial Capability &amp; Section 6: Loan Commitments
                          </h2>
                        </div>
                      </div>

                      <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-950">
                        <p className="leading-relaxed">
                          <strong>Official Instruction:</strong> All financial amounts must be entered as the <strong>full total amount in Sri Lankan Rupees (LKR)</strong>.
                          For example, for <strong>1 Lakh (LKR 100,000)</strong> enter <strong>100000</strong> (not 1 or 1 Lakh); for <strong>10 Million</strong> enter <strong>10000000</strong>.
                          You may enter <strong>0</strong> or leave blank if information is unrecorded. <em>Profit Before Tax may be negative if incurring a loss.</em>
                        </p>
                      </div>

                      {/* CONSOLIDATED FINANCIAL TABLE (8 INDICATORS + 1 LOAN COMMITMENTS ROW) */}
                      <p className="text-[11px] text-slate-400 text-right italic sm:hidden mb-1">
                        ← Scroll to see all years →
                      </p>
                      <div className="border border-slate-200 rounded-xl bg-white shadow-sm">
                        <div className="overflow-x-auto rounded-xl" style={{ WebkitOverflowScrolling: "touch" }}>
                          <table className="w-full min-w-[700px] text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700">
                                <th className="py-3 px-3 text-left font-bold w-[230px]">
                                  Financial Indicator (Total Amount in LKR)
                                </th>
                                {FINANCIAL_YEARS.map((year) => (
                                  <th key={year} className="py-3 px-2 text-center font-bold text-blue-950 w-[110px]">
                                    {year}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70">
                              {[
                                { key: "totalAssets" as const, label: "Total Assets" },
                                { key: "totalLiabilities" as const, label: "Total Liabilities" },
                                {
                                  key: "totalEquity" as const,
                                  label: "Total Equity",
                                  hint: "Auto: Total Assets − Liabilities",
                                  readOnly: true,
                                },
                                { key: "currentAssets" as const, label: "Current Assets" },
                                { key: "currentLiabilities" as const, label: "Current Liabilities" },
                                {
                                  key: "workingCapital" as const,
                                  label: "Working Capital",
                                  hint: "Auto: Current Assets − Liabilities",
                                  readOnly: true,
                                },
                                { key: "totalRevenue" as const, label: "Total Revenue" },
                                {
                                  key: "profitBeforeTax" as const,
                                  label: "Profit Before Tax",
                                  hint: "May be negative",
                                },
                              ].map(({ key, label, hint, readOnly }) => (
                                <tr
                                  key={key}
                                  className={
                                    readOnly
                                      ? "bg-slate-50/80 hover:bg-slate-100/70 transition-colors"
                                      : "hover:bg-slate-50/60 transition-colors"
                                  }
                                >
                                  <td className="py-2 px-3 text-slate-800 font-medium">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={readOnly ? "font-semibold text-blue-950" : ""}>{label}</span>
                                      {hint && (
                                        <span
                                          className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                                            readOnly
                                              ? "text-blue-700 bg-blue-50 border border-blue-200/60"
                                              : "text-amber-700 bg-amber-50 border border-amber-200/60"
                                          }`}
                                        >
                                          {hint}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  {FINANCIAL_YEARS.map((year) => {
                                    const yrData =
                                      (formData.financialStatements && formData.financialStatements[year]) ||
                                      createEmptyFinancialIndicators();
                                    const val = yrData[key];
                                    const isNegative = val !== null && val !== undefined && val < 0;

                                    return (
                                      <td key={year} className="py-1.5 px-2">
                                        <input
                                          type={readOnly ? "text" : "number"}
                                          readOnly={readOnly}
                                          tabIndex={readOnly ? -1 : 0}
                                          value={val !== null && val !== undefined ? val : ""}
                                          onChange={(e) => !readOnly && handleFinancialChange(year, key, e.target.value)}
                                          className={`w-full p-2 border rounded font-mono text-xs text-right transition-colors ${
                                            readOnly
                                              ? `bg-slate-100/90 border-slate-300 font-semibold cursor-not-allowed select-none ${
                                                  isNegative ? "text-rose-600 font-bold" : "text-slate-800"
                                                }`
                                              : `bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 ${
                                                  isNegative ? "text-rose-600 font-bold" : ""
                                                }`
                                          }`}
                                        />
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}

                              {/* SECTION 6: ROW 9 - TOTAL LOAN REPAYMENTS DUE */}
                              <tr className="bg-blue-50/40 border-t-2 border-slate-300">
                                <td className="py-3 px-3 text-slate-900 align-middle">
                                  <div>
                                    <span className="font-bold text-blue-950 block">
                                      Total Loan Repayments Due (01 Dec 2026 – 01 Dec 2028)
                                    </span>
                                    <span className="text-[11px] font-normal text-slate-500 block leading-tight mt-0.5">
                                      Total loan repayments due within the next two years. Enter full total amount in LKR (e.g. for 1 Lakh enter 100000, not 1 Lakh. Enter 0 if none).
                                    </span>
                                  </div>
                                </td>
                                <td colSpan={5} className="py-2.5 px-3">
                                  <div className="relative">
                                    <input
                                      type="number"
                                      value={formData.loanCommitments?.twoYearRepaymentsDue2026To2028 ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value.trim();
                                        const num = val === "" ? null : Number(val);
                                        setFormData({
                                          ...formData,
                                          loanCommitments: {
                                            twoYearRepaymentsDue2026To2028: val === "" ? null : isNaN(num as number) ? null : num,
                                          },
                                        });
                                      }}
                                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono text-xs"
                                    />
                                    {formData.loanCommitments?.twoYearRepaymentsDue2026To2028 !== null &&
                                      formData.loanCommitments?.twoYearRepaymentsDue2026To2028 !== undefined && (
                                        <span className="text-[11px] font-mono font-semibold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded inline-block mt-1">
                                          = LKR {Number(formData.loanCommitments.twoYearRepaymentsDue2026To2028).toLocaleString()}
                                        </span>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 7: CURRENT WORK COMMITMENTS */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Layers className="w-4 h-4 text-blue-900" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          Section 7: Evaluation Criteria – Current Work Commitments
                        </h2>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-2">
                            Does your company currently have ongoing contracts? *
                          </label>
                          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                            <label className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2">
                              <input
                                type="radio"
                                name="hasOngoingContracts"
                                value="Yes"
                                checked={formData.hasOngoingContracts === "Yes"}
                                onChange={() => setFormData({ ...formData, hasOngoingContracts: "Yes" })}
                                className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                              />
                              <span className="font-medium text-slate-800">Yes</span>
                            </label>
                            <label className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2">
                              <input
                                type="radio"
                                name="hasOngoingContracts"
                                value="No"
                                checked={formData.hasOngoingContracts === "No"}
                                onChange={() => setFormData({ ...formData, hasOngoingContracts: "No" })}
                                className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                              />
                              <span className="font-medium text-slate-800">No</span>
                            </label>
                          </div>
                        </div>

                        {/* SECTION 8: ONGOING WORKS (Only if hasOngoingContracts === "Yes") */}
                        {formData.hasOngoingContracts === "Yes" && (
                          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4">
                            <span className="text-[11px] font-bold text-blue-900 uppercase block">
                              Section 8: Ongoing Works Details
                            </span>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                Total value of outstanding works as at 1 December 2026 (Total Amount in LKR) *
                              </label>
                              <p className="text-[11px] text-slate-500 mb-2">
                                Please enter the total value of works that remain to be completed under all your ongoing contracts as at 1 December 2026 in full LKR. Enter total amount (e.g. for 1 Lakh enter <strong>100000</strong>, not 1 Lakh; for 10 Million enter <strong>10000000</strong>. If you have no outstanding works, please enter 0).
                              </p>
                              <input
                                type="number"
                                required
                                value={formData.totalOutstandingValueLkrMillion ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value.trim();
                                  setFormData({
                                    ...formData,
                                    totalOutstandingValueLkrMillion: val === "" ? null : Number(val),
                                  });
                                }}
                                className="w-full sm:w-72 p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                              />
                              {formData.totalOutstandingValueLkrMillion !== null &&
                                formData.totalOutstandingValueLkrMillion !== undefined && (
                                  <span className="text-[11px] font-mono font-semibold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded block mt-1 w-fit">
                                    = LKR {Number(formData.totalOutstandingValueLkrMillion).toLocaleString()}
                                  </span>
                                )}
                            </div>

                            <div className="space-y-3 pt-2">
                              <span className="font-bold text-slate-800 text-[11px] block">
                                Key Ongoing Contracts (Up to 3 Contracts - Optional)
                              </span>
                              {[0, 1, 2].map((idx) => {
                                const contract = (formData.ongoingContracts || createEmptyOngoingWorks())[idx] || {
                                  contractIndex: idx + 1,
                                  contractName: "",
                                  contractAmount: null,
                                  currency: "LKR",
                                  completionDate: null,
                                };

                                return (
                                  <div
                                    key={idx}
                                    className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-2.5"
                                  >
                                    <span className="font-semibold text-blue-900 text-[11px]">
                                      Ongoing Contract {idx + 1}
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                          Contract Name
                                        </label>
                                        <input
                                          type="text"
                                          value={contract.contractName || ""}
                                          onChange={(e) => handleOngoingContractChange(idx, "contractName", e.target.value)}
                                          placeholder="Project Title"
                                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                        />
                                      </div>

                                      <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                          Contract Amount &amp; Currency (Total Amount in LKR)
                                        </label>
                                        <p className="text-[10px] text-slate-500 mb-1">
                                          Enter total amount (e.g. for 1 Lakh enter 100000, not 1 Lakh)
                                        </p>
                                        <div className="flex gap-1.5">
                                          <input
                                            type="number"
                                            value={contract.contractAmount ?? ""}
                                            onChange={(e) => handleOngoingContractChange(idx, "contractAmount", e.target.value)}
                                            className="w-2/3 p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                                          />
                                          <select
                                            value={contract.currency || "LKR"}
                                            onChange={(e) => handleOngoingContractChange(idx, "currency", e.target.value)}
                                            className="w-1/3 p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none font-bold"
                                          >
                                            {CURRENCY_OPTIONS.map((cur) => (
                                              <option key={cur} value={cur}>
                                                {cur}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        {contract.contractAmount !== null && contract.contractAmount !== undefined && contract.contractAmount !== "" && (
                                          <span className="text-[10px] font-mono text-slate-600 block mt-1">
                                            = {contract.currency || "LKR"} {Number(contract.contractAmount).toLocaleString()}
                                          </span>
                                        )}
                                      </div>

                                      <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                          Anticipated Completion Date
                                        </label>
                                        <input
                                          type="date"
                                          value={contract.completionDate || ""}
                                          onChange={(e) => handleOngoingContractChange(idx, "completionDate", e.target.value)}
                                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 9: GENERAL EXPERIENCE */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Briefcase className="w-4 h-4 text-blue-900" />
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          Section 9: Evaluation Criteria – Experience
                        </h2>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            How many years of general experience does your company have in the construction industry? *
                          </label>
                          <select
                            value={formData.generalExperience}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                generalExperience: e.target.value as GeneralExperienceOption,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                          >
                            <option value="">— Select General Construction Experience —</option>
                            {GENERAL_EXP_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 10: SIMILAR WORK EXPERIENCE */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-900" />
                          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                            Section 10: Evaluation Criteria – Similar Work Experience
                          </h2>
                        </div>
                      </div>

                      <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>Official Instruction:</strong> Please provide details of the highest-value contracts your organization has completed within the last five years (December 2021 to November 2026) that are similar in nature to the proposed works. For firms without relevant experience, please enter <strong>N/A</strong> in the Contract Name field and leave the other fields blank.
                        </p>
                      </div>

                      <div className="space-y-6 text-xs">
                        {[0, 1, 2].map((idx) => {
                          const contract = (formData.similarWorks || createEmptySimilarWorks())[idx] || {
                            contractIndex: idx + 1,
                            contractType: "",
                            contractName: "",
                            contractAmount: null,
                            startDate: null,
                            completionDate: null,
                            completionStatus: "",
                          };
                          const isNA = Boolean(contract.contractName && contract.contractName.trim().toUpperCase() === "N/A");

                          return (
                            <div
                              key={idx}
                              className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3"
                            >
                              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                                <span className="font-bold text-blue-900">
                                  Contract {idx + 1} {idx === 0 ? "(Required or N/A)" : "(Optional)"}
                                </span>
                                {isNA && (
                                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                                    Marked N/A
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-semibold text-slate-700 mb-1">
                                    Contract name {idx === 0 ? "*" : ""}
                                  </label>
                                  <input
                                    type="text"
                                    value={contract.contractName || ""}
                                    onChange={(e) => handleContractChange(idx, "contractName", e.target.value)}
                                    placeholder={idx === 0 ? "Project Title or enter N/A" : "Project Title"}
                                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 mb-1">
                                    Contract type
                                  </label>
                                  <select
                                    disabled={isNA}
                                    value={contract.contractType || ""}
                                    onChange={(e) => handleContractChange(idx, "contractType", e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                                  >
                                    <option value="">— Select Contract Type —</option>
                                    {CONTRACT_TYPE_OPTIONS.map((t) => (
                                      <option key={t} value={t}>
                                        {t}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 mb-1">
                                    Contract amount (Total Amount in LKR)
                                  </label>
                                  <p className="text-[10px] text-slate-500 mb-1">
                                    Enter full total amount in LKR (e.g. for 1 Lakh enter 100000, not 1 Lakh)
                                  </p>
                                  <input
                                    type="number"
                                    disabled={isNA}
                                    value={contract.contractAmount ?? ""}
                                    onChange={(e) => handleContractChange(idx, "contractAmount", e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono disabled:opacity-50"
                                  />
                                  {!isNA && contract.contractAmount !== null && contract.contractAmount !== undefined && contract.contractAmount !== "" && (
                                    <span className="text-[10px] font-mono text-slate-600 block mt-1">
                                      = LKR {Number(contract.contractAmount).toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 mb-1">
                                    Completion Status
                                  </label>
                                  <select
                                    disabled={isNA}
                                    value={contract.completionStatus || ""}
                                    onChange={(e) => handleContractChange(idx, "completionStatus", e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                                  >
                                    <option value="">— Select Completion Status —</option>
                                    {COMPLETION_STATUS_OPTIONS.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 mb-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    disabled={isNA}
                                    value={contract.startDate || ""}
                                    onChange={(e) => handleContractChange(idx, "startDate", e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-slate-700 mb-1">
                                    Completion date
                                  </label>
                                  <input
                                    type="date"
                                    disabled={isNA}
                                    value={contract.completionDate || ""}
                                    onChange={(e) => handleContractChange(idx, "completionDate", e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* ------------------------------------------------------------- */}
                {/* SECTION 11: MATTERS FOR DISCUSSION (ALL PARTICIPATING ATTENDEES) */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-blue-900" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Section 11: Matters for Discussion
                    </h2>
                  </div>

                  <div className="space-y-2 text-xs">
                    <label className="block font-semibold text-slate-700">
                      Do you have any specific matters, concerns or suggestions that you would like to be discussed during the Early Market Engagement Workshop? (Optional)
                    </label>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Participants are encouraged to share any matters relating to market conditions, technical requirements, procurement arrangements, implementation challenges or other issues relevant to the anticipated ICDP activities.
                    </p>
                    <textarea
                      rows={4}
                      value={formData.mattersForDiscussion || ""}
                      onChange={(e) => setFormData({ ...formData, mattersForDiscussion: e.target.value })}
                      placeholder="Share key topics, challenges, supply issues, or suggestions for the agenda on 07 December 2026..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                    />
                    {getDynamicQuestionsForSection("SEC-11").concat(getDynamicQuestionsForSection("sec-matters-discussion")).map(renderDynamicQuestionField)}
                  </div>
                </div>

                {/* Additional Dynamic Sections added via Form Builder */}
                {getAdditionalDynamicSections().map((sec: any) => (
                  <div key={sec.id} className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Building2 className="w-4 h-4 text-blue-900" />
                      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                        {sec.title}
                      </h2>
                    </div>
                    {sec.description && <p className="text-xs text-slate-500">{sec.description}</p>}
                    <div className="space-y-4 text-xs">
                      {sec.questions.map(renderDynamicQuestionField)}
                    </div>
                  </div>
                ))}

                {/* Alert Banner (Bottom of Form) */}
                {formAlert && (
                  <div
                    className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                      formAlert.type === "success"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}
                  >
                    {formAlert.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed font-semibold">{formAlert.message}</span>
                  </div>
                )}

                {/* ACTION BAR */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all min-h-[44px]"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5 text-blue-900" />}
                    <span>Save Progress &amp; Get Resume Token</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitFinal}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-900/20 transition-all min-h-[44px]"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Response...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        <span>Submit Official Questionnaire Response</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RESUME DRAFT */}
      {activeTab === "resume" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <KeyRound className="w-5 h-5 text-blue-900" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Resume an Existing Saved Registration Draft
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your private 64-character hexadecimal resume key to restore your previously saved declaration.
              </p>
            </div>
          </div>

          {resumeAlert && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                resumeAlert.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              {resumeAlert.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-semibold">{resumeAlert.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Private Resume Token (64 Hexadecimal Characters) *
            </label>
            <div className="relative">
              <input
                type="text"
                value={resumeTokenInput}
                onChange={(e) => setResumeTokenInput(e.target.value)}
                placeholder="Paste your 64-character resume token..."
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Note: Resume keys remain valid for 30 days from initial creation. Submitting a final declaration revokes the key permanently to prevent duplicate filings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadDraft(resumeTokenInput)}
            disabled={loading || !resumeTokenInput.trim()}
            className="inline-flex items-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-60 min-h-[44px]"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5 text-amber-400" />}
            <span>Load Draft &amp; Continue Registration</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
            <span className="text-xs font-semibold text-slate-600">Loading RDA Public Portal...</span>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <RegisterForm />
      </div>
    </Suspense>
  );
}
