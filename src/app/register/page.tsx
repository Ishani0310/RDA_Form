"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
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
  Save,
  Plus,
  RotateCcw,
  History,
  X,
  Trash2,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Eye,
  ArrowUpDown,
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

export interface BrowserSavedDraft {
  token: string;
  reference: string;
  organizationName: string;
  category?: string;
  lastSavedAt: string;
}

const STORAGE_KEY = "rda_icdp_saved_drafts";
const CLIENT_ID_KEY = "rda_browser_client_id";

function getOrCreateBrowserClientId(): string {
  if (typeof window === "undefined") return "";
  try {
    let clientId = localStorage.getItem(CLIENT_ID_KEY);
    if (!clientId) {
      clientId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `cid_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
      localStorage.setItem(CLIENT_ID_KEY, clientId);
    }
    return clientId;
  } catch {
    return "";
  }
}

function getBrowserSavedDrafts(): BrowserSavedDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBrowserDraft(draft: BrowserSavedDraft) {
  if (typeof window === "undefined") return;
  try {
    const existing = getBrowserSavedDrafts().filter(
      (d) => d.token !== draft.token && d.reference !== draft.reference
    );
    existing.unshift(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 10)));
  } catch {}
}

function removeBrowserDraft(tokenOrRef: string) {
  if (typeof window === "undefined") return;
  try {
    const remaining = getBrowserSavedDrafts().filter(
      (d) => d.token !== tokenOrRef && d.reference !== tokenOrRef
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch {}
}

function createInitialFormData(): OfficialQuestionnaireData {
  return {
    organizationName: "",
    contactNumber: "",
    email: "",
    willParticipate: "",
    participantCategory: "",
    participant1: { fullName: "", mobileNumber: "", email: "", designation: "" },
    participant2: { fullName: "", mobileNumber: "", email: "", designation: "" },
    supplierDetails: createEmptySupplierDetails(),
    ictadRegistrationNumber: "",
    areasOfSpecialty: [],
    specialtyOther: "",
    specialtyGrades: {},
    specialtyGradesOther: {},
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
    mattersForDiscussionList: [""],
  };
}

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

  // Draft session credentials & identifiers
  const [currentDraftToken, setCurrentDraftToken] = useState<string>(tokenFromUrl);
  const [currentReference, setCurrentReference] = useState<string>("");
  const [savedDraftsList, setSavedDraftsList] = useState<BrowserSavedDraft[]>([]);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);

  // Auto-Save Indicator State: "idle" | "saving" | "saved" | "error"
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Concurrency & Debounce refs
  const isSavingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastSavedJsonRef = useRef<string>("");

  const [showWorkshopInfo, setShowWorkshopInfo] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Questionnaire Form State
  const [formData, setFormData] = useState<OfficialQuestionnaireData>(createInitialFormData);
  const [specialtyOtherList, setSpecialtyOtherList] = useState<string[]>([""]);
  const [supplierMaterialsOtherList, setSupplierMaterialsOtherList] = useState<string[]>([""]);
  const [cidaGradeOtherList, setCidaGradeOtherList] = useState<string[]>([""]);

  // Unique ICTAD Registration Number State
  const [regNumberError, setRegNumberError] = useState<string | null>(null);
  const [isCheckingRegNumber, setIsCheckingRegNumber] = useState(false);
  const [regNumberAvailable, setRegNumberAvailable] = useState(false);

  // Multi-item helper: parse comma-separated string into list of items
  const parseOtherSpecialties = (str?: string): string[] => {
    if (!str || !str.trim()) return [""];
    const items = str.split(",").map((s) => s.trim()).filter(Boolean);
    return items.length > 0 ? items : [""];
  };

  const checkRegNumberUniqueness = async (regNo?: string) => {
    const trimmed = regNo?.trim();
    if (!trimmed) {
      setRegNumberError(null);
      setRegNumberAvailable(false);
      setIsCheckingRegNumber(false);
      return;
    }

    setIsCheckingRegNumber(true);

    try {
      const url = `/api/public/check-reg-number?regNumber=${encodeURIComponent(trimmed)}&token=${encodeURIComponent(currentDraftToken || "")}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.available) {
        setRegNumberError(data.message || `ICTAD registration number "${trimmed}" is already registered.`);
        setRegNumberAvailable(false);
      } else {
        setRegNumberError(null);
        setRegNumberAvailable(true);
      }
    } catch {
      // Ignore network errors on background validation
    } finally {
      setIsCheckingRegNumber(false);
    }
  };

  // Debounced uniqueness check as user types
  useEffect(() => {
    if (formData.participantCategory !== "Contractor") return;
    const val = formData.ictadRegistrationNumber?.trim();
    if (!val) {
      setRegNumberError(null);
      setRegNumberAvailable(false);
      return;
    }

    const timer = setTimeout(() => {
      checkRegNumberUniqueness(val);
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.ictadRegistrationNumber, formData.participantCategory, currentDraftToken]);

  // Sync contractor specialty other list when formData.specialtyOther changes from outside
  useEffect(() => {
    if (formData.specialtyOther && formData.specialtyOther.trim()) {
      const parsed = parseOtherSpecialties(formData.specialtyOther);
      const currentCombined = specialtyOtherList.map((s) => s.trim()).filter(Boolean).join(", ");
      const newCombined = parsed.join(", ");
      if (currentCombined !== newCombined) {
        setSpecialtyOtherList(parsed);
      }
    }
  }, [formData.specialtyOther]);

  // Sync supplier materials other list when formData.supplierDetails?.materialsOther changes
  useEffect(() => {
    if (formData.supplierDetails?.materialsOther && formData.supplierDetails.materialsOther.trim()) {
      const parsed = parseOtherSpecialties(formData.supplierDetails.materialsOther);
      const currentCombined = supplierMaterialsOtherList.map((s) => s.trim()).filter(Boolean).join(", ");
      const newCombined = parsed.join(", ");
      if (currentCombined !== newCombined) {
        setSupplierMaterialsOtherList(parsed);
      }
    }
  }, [formData.supplierDetails?.materialsOther]);

  // Sync contractor CIDA grade other list when formData.cidaGradeOther changes
  useEffect(() => {
    if (formData.cidaGradeOther && formData.cidaGradeOther.trim()) {
      const parsed = parseOtherSpecialties(formData.cidaGradeOther);
      const currentCombined = cidaGradeOtherList.map((s) => s.trim()).filter(Boolean).join(", ");
      const newCombined = parsed.join(", ");
      if (currentCombined !== newCombined) {
        setCidaGradeOtherList(parsed);
      }
    }
  }, [formData.cidaGradeOther]);

  const handleUpdateSpecialtyOther = (index: number, value: string) => {
    setSpecialtyOtherList((prev) => {
      const updated = [...prev];
      updated[index] = value;
      const combined = updated
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
      setFormData((f) => ({ ...f, specialtyOther: combined }));
      return updated;
    });
  };

  const handleAddSpecialtyOther = () => {
    const currentSpecs = formData.areasOfSpecialty || [];
    const hasOther = currentSpecs.includes("Other");

    setSpecialtyOtherList((prev) => [...prev, ""]);

    if (!hasOther) {
      setFormData((f) => ({
        ...f,
        areasOfSpecialty: [...(f.areasOfSpecialty || []), "Other"],
      }));
    }
  };

  const handleRemoveSpecialtyOther = (index: number) => {
    setSpecialtyOtherList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const finalList = updated.length > 0 ? updated : [""];
      const combined = finalList
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");
      setFormData((f) => ({ ...f, specialtyOther: combined }));
      return finalList;
    });
  };

  const handleUpdateSupplierMaterialOther = (index: number, value: string) => {
    setSupplierMaterialsOtherList((prev) => {
      const updated = [...prev];
      updated[index] = value;
      const combined = updated.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({
        ...f,
        supplierDetails: {
          ...(f.supplierDetails || createEmptySupplierDetails()),
          materialsOther: combined,
        },
      }));
      return updated;
    });
  };

  const handleAddSupplierMaterialOther = () => {
    const currentMats = formData.supplierDetails?.materialsSupplied || [];
    if (!currentMats.includes("Other")) {
      handleSupplierMaterialToggle("Other");
    }
    setSupplierMaterialsOtherList((prev) => [...prev, ""]);
  };

  const handleRemoveSupplierMaterialOther = (index: number) => {
    setSupplierMaterialsOtherList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const finalList = updated.length > 0 ? updated : [""];
      const combined = finalList.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({
        ...f,
        supplierDetails: {
          ...(f.supplierDetails || createEmptySupplierDetails()),
          materialsOther: combined,
        },
      }));
      return finalList;
    });
  };

  const handleUpdateCidaGradeOther = (index: number, value: string) => {
    setCidaGradeOtherList((prev) => {
      const updated = [...prev];
      updated[index] = value;
      const combined = updated.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({ ...f, cidaGradeOther: combined }));
      return updated;
    });
  };

  const handleAddCidaGradeOther = () => {
    if (formData.cidaGrade !== "Other") {
      setFormData((f) => ({ ...f, cidaGrade: "Other" }));
    }
    setCidaGradeOtherList((prev) => [...prev, ""]);
  };

  const handleRemoveCidaGradeOther = (index: number) => {
    setCidaGradeOtherList((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const finalList = updated.length > 0 ? updated : [""];
      const combined = finalList.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({ ...f, cidaGradeOther: combined }));
      return finalList;
    });
  };

  // UI States
  const [loading, setLoading] = useState(false);
  const [formAlert, setFormAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    reference: string;
    businessName: string;
    submittedAt: string;
    provincialOffice: string;
  } | null>(null);
  const [publishedQuestionnaire, setPublishedQuestionnaire] = useState<any>(null);

  // Check saved drafts on mount
  useEffect(() => {
    getOrCreateBrowserClientId();
    const stored = getBrowserSavedDrafts();
    setSavedDraftsList(stored);

    if (tokenFromUrl) {
      loadDraft(tokenFromUrl);
    } else if (stored.length > 0) {
      setShowRecoveryPrompt(true);
    }
  }, [tokenFromUrl]);

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

  const ongoingTotalOutstanding = useMemo(() => {
    const contracts = formData.ongoingContracts || [];
    return contracts.reduce((acc, c) => {
      const val = Number(c.contractAmount);
      return acc + (!isNaN(val) && val > 0 ? val : 0);
    }, 0);
  }, [formData.ongoingContracts]);

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
        "participant1.email",
        "participant1.designation",
        "participant2.fullName",
        "participant2.mobileNumber",
        "participant2.email",
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

  const loadDraft = async (token: string, silent = false) => {
    const clean = token.trim();
    if (!clean) return;
    setLoading(true);
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

        const restoredData: OfficialQuestionnaireData = {
          organizationName: q.organizationName || c.businessName || "",
          contactNumber: q.contactNumber || c.contactOfficer?.phone || "",
          email: q.email || c.contactOfficer?.email || "",
          willParticipate: q.willParticipate || "",
          participantCategory: q.participantCategory || "",
          participant1: q.participant1 || {
            fullName: c.contactOfficer?.name || "",
            mobileNumber: c.contactOfficer?.phone || "",
            email: c.contactOfficer?.email || "",
            designation: c.contactOfficer?.designation || "",
          },
          participant2: q.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" },
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
          ongoingContracts:
            Array.isArray(q.ongoingContracts) && q.ongoingContracts.length > 0
              ? q.ongoingContracts
              : createEmptyOngoingWorks(),
          generalExperience: q.generalExperience || "",
          similarWorks:
            Array.isArray(q.similarWorks) && q.similarWorks.length > 0
              ? q.similarWorks
              : createEmptySimilarWorks(),
          mattersForDiscussion: q.mattersForDiscussion || "",
          mattersForDiscussionList:
            Array.isArray(q.mattersForDiscussionList) && q.mattersForDiscussionList.length > 0
              ? q.mattersForDiscussionList
              : q.mattersForDiscussion
              ? q.mattersForDiscussion
                  .split(/\r?\n/)
                  .map((s: string) => s.replace(/^\d+[\.\)]\s*/, "").trim())
                  .filter(Boolean)
              : [""],
        };

        isInitialLoadRef.current = true;
        lastSavedJsonRef.current = JSON.stringify(restoredData);
        setFormData(restoredData);
        setSpecialtyOtherList(parseOtherSpecialties(restoredData.specialtyOther));
        setSupplierMaterialsOtherList(parseOtherSpecialties(restoredData.supplierDetails?.materialsOther));
        setCidaGradeOtherList(parseOtherSpecialties(restoredData.cidaGradeOther));
        setCurrentDraftToken(clean);

        const ref = data.draft.submissionReference || data.draft.reference || "";
        setCurrentReference(ref);
        setShowRecoveryPrompt(false);
        setAutoSaveStatus("saved");
        setLastSavedTime(new Date(data.draft.updatedAt || data.draft.createdAt || Date.now()));

        if (!silent) {
          setFormAlert({
            type: "success",
            message: `Previous registration draft restored successfully (${ref || "Draft Reference Active"}). All entered details have been recovered.`,
          });
        }
      } else {
        setFormAlert({
          type: "error",
          message: data.message || "Could not recover draft from server session. Starting fresh registration.",
        });
        removeBrowserDraft(clean);
        setSavedDraftsList(getBrowserSavedDrafts());
        setShowRecoveryPrompt(false);
      }
    } catch {
      setFormAlert({
        type: "error",
        message: "Network error loading saved draft session. Please check your internet connection.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 500);
    }
  };

  const performDraftSave = async (isAutoSave = false): Promise<boolean> => {
    const orgName = (formData.organizationName || formData.supplierDetails?.companyName || "").trim();
    if (!orgName) {
      if (!isAutoSave) {
        setFormAlert({
          type: "error",
          message: "Organization / Company name is required to save registration progress.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return false;
    }

    if (isSavingRef.current) return false;
    isSavingRef.current = true;
    setAutoSaveStatus("saving");
    if (!isAutoSave) {
      setLoading(true);
      setFormAlert(null);
    }

    try {
      const payload: Record<string, unknown> = {
        questionnaireData: formData,
        businessName: orgName,
        registrationNumber: formData.ictadRegistrationNumber?.trim() || undefined,
        cidaGrade: formData.cidaGrade?.trim() || undefined,
        province: formData.supplierDetails?.province?.trim() || "Western Province",
        district: formData.supplierDetails?.district?.trim() || undefined,
        contactOfficer: {
          name: formData.participant1?.fullName?.trim() || "Authorized Representative",
          phone: formData.participant1?.mobileNumber?.trim() || formData.contactNumber?.trim() || "+94 11 000 0000",
          email: formData.participant1?.email?.trim() || formData.email?.trim() || "contact@rda.gov.lk",
        },
      };

      if (currentDraftToken) {
        payload.resumeToken = currentDraftToken;
      }

      const res = await fetch("/api/public/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        const assignedRef =
          data.submissionReference ||
          data.data?.submission?.submissionReference ||
          currentReference;

        setCurrentDraftToken(data.token);
        if (assignedRef) setCurrentReference(assignedRef);

        const draftEntry: BrowserSavedDraft = {
          token: data.token,
          reference: assignedRef || "RDA-DRAFT",
          organizationName: orgName,
          category:
            formData.participantCategory ||
            (formData.willParticipate === "No" ? "Non-Attendee" : "General"),
          lastSavedAt: new Date().toISOString(),
        };
        saveBrowserDraft(draftEntry);
        setSavedDraftsList(getBrowserSavedDrafts());

        lastSavedJsonRef.current = JSON.stringify(formData);
        setAutoSaveStatus("saved");
        setLastSavedTime(new Date());

        if (!isAutoSave) {
          setFormAlert({
            type: "success",
            message: `Draft successfully saved! Permanent Reference: ${
              assignedRef || "Assigned"
            }. You can close this browser anytime and continue when you return.`,
          });
        }
        return true;
      } else {
        setAutoSaveStatus("error");
        if (!isAutoSave) {
          setFormAlert({
            type: "error",
            message: data.message || "Failed to save draft progress.",
          });
        }
        return false;
      }
    } catch {
      setAutoSaveStatus("error");
      if (!isAutoSave) {
        setFormAlert({
          type: "error",
          message: "Network error occurred while saving draft progress.",
        });
      }
      return false;
    } finally {
      isSavingRef.current = false;
      if (!isAutoSave) setLoading(false);
    }
  };

  // Debounced Auto-Save on questionnaire changes
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      lastSavedJsonRef.current = JSON.stringify(formData);
      return;
    }

    const orgName = (formData.organizationName || formData.supplierDetails?.companyName || "").trim();
    if (!orgName) return;

    const currentJson = JSON.stringify(formData);
    if (currentJson === lastSavedJsonRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setAutoSaveStatus("saving");
    debounceTimerRef.current = setTimeout(() => {
      performDraftSave(true);
    }, 2000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [formData]);

  const handleStartNewRegistration = () => {
    const orgName = (formData.organizationName || formData.supplierDetails?.companyName || "").trim();
    if (orgName && currentDraftToken) {
      saveBrowserDraft({
        token: currentDraftToken,
        reference: currentReference || "RDA-DRAFT",
        organizationName: orgName,
        category:
          formData.participantCategory ||
          (formData.willParticipate === "No" ? "Non-Attendee" : "General"),
        lastSavedAt: new Date().toISOString(),
      });
    }

    isInitialLoadRef.current = true;
    setFormData(createInitialFormData());
    setSpecialtyOtherList([""]);
    setSupplierMaterialsOtherList([""]);
    setCidaGradeOtherList([""]);
    setCurrentDraftToken("");
    setCurrentReference("");
    setAutoSaveStatus("idle");
    setLastSavedTime(null);
    setShowRecoveryPrompt(false);
    setFormAlert({
      type: "success",
      message: "Started a separate new registration. Any previous drafts remain safely stored in this browser.",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 500);
  };

  const handleInitiateReview = () => {
    setFormAlert(null);

    const orgName = formData.organizationName.trim() || formData.supplierDetails?.companyName?.trim();
    if (!orgName) {
      setFormAlert({
        type: "error",
        message: "Name of your Organization / Company / Institution is required to review and submit.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!formData.willParticipate) {
      setFormAlert({
        type: "error",
        message: "Please indicate whether you will be participating in the workshop on 07 December 2026.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (formData.willParticipate === "Yes" && !formData.participantCategory) {
      setFormAlert({
        type: "error",
        message: "Please select your Participant Category.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Dynamic questionnaire validation according to published questionnaire
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
              return;
            }
          }
        }
      }
    }

    // Section 4: Validate unique ICTAD Registration Number for Contractors
    if (formData.participantCategory === "Contractor") {
      const reg = formData.ictadRegistrationNumber?.trim();
      if (!reg) {
        setFormAlert({
          type: "error",
          message: "Section 4: ICTAD registration number is required.",
        });
        const elem = document.getElementById("ictad-reg-number-input");
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (regNumberError) {
        setFormAlert({
          type: "error",
          message: `Section 4: ${regNumberError}`,
        });
        const elem = document.getElementById("ictad-reg-number-input");
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // Section 10: Validate descending order for Similar Works (higher value to lower value)
    if (formData.participantCategory === "Contractor") {
      const works = formData.similarWorks || [];
      const firstWork = works[0];
      if (firstWork && firstWork.contractName && firstWork.contractName.trim().toUpperCase() !== "N/A") {
        let prevValidAmt: number | null = null;
        let prevValidIdx = 0;
        for (let i = 0; i < works.length; i++) {
          const w = works[i];
          if (w && w.contractName && w.contractName.trim().toUpperCase() !== "N/A" && w.contractAmount !== null && w.contractAmount !== undefined && w.contractAmount !== "") {
            const curAmt = Number(w.contractAmount);
            if (!isNaN(curAmt)) {
              if (prevValidAmt !== null && curAmt > prevValidAmt) {
                setFormAlert({
                  type: "error",
                  message: `Section 10: Contract #${i + 1} amount (LKR ${curAmt.toLocaleString()}) cannot exceed Contract #${prevValidIdx + 1} amount (LKR ${prevValidAmt.toLocaleString()}). Contracts must be entered in descending order from highest to lowest value. Please click "Sort by Highest Value First" or adjust the values.`,
                });
                const elem = document.getElementById("section-10-container");
                if (elem) elem.scrollIntoView({ behavior: "smooth" });
                return;
              }
              prevValidAmt = curAmt;
              prevValidIdx = i;
            }
          }
        }
      }
    }

    // Form is valid: open Review Area
    setShowReviewModal(true);
  };

  const handleSubmitFinal = async () => {
    setLoading(true);
    setFormAlert(null);

    try {
      const orgName = formData.organizationName.trim() || formData.supplierDetails?.companyName?.trim();
      if (!orgName) {
        setFormAlert({
          type: "error",
          message: "Name of your Organization / Company / Institution is required to submit.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setLoading(false);
        return;
      }

      if (!formData.willParticipate) {
        setFormAlert({
          type: "error",
          message: "Please indicate whether you will be participating in the workshop on 07 December 2026.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setLoading(false);
        return;
      }

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

      // Section 4: Validate unique ICTAD Registration Number for Contractors
    if (formData.participantCategory === "Contractor") {
      const reg = formData.ictadRegistrationNumber?.trim();
      if (!reg) {
        setFormAlert({
          type: "error",
          message: "Section 4: ICTAD registration number is required.",
        });
        const elem = document.getElementById("ictad-reg-number-input");
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (regNumberError) {
        setFormAlert({
          type: "error",
          message: `Section 4: ${regNumberError}`,
        });
        const elem = document.getElementById("ictad-reg-number-input");
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // Section 10: Validate descending order for Similar Works (higher value to lower value)
      if (formData.participantCategory === "Contractor") {
        const works = formData.similarWorks || [];
        const firstWork = works[0];
        if (firstWork && firstWork.contractName && firstWork.contractName.trim().toUpperCase() !== "N/A") {
          let prevValidAmt: number | null = null;
          let prevValidIdx = 0;
          for (let i = 0; i < works.length; i++) {
            const w = works[i];
            if (w && w.contractName && w.contractName.trim().toUpperCase() !== "N/A" && w.contractAmount !== null && w.contractAmount !== undefined && w.contractAmount !== "") {
              const curAmt = Number(w.contractAmount);
              if (!isNaN(curAmt)) {
                if (prevValidAmt !== null && curAmt > prevValidAmt) {
                  setFormAlert({
                    type: "error",
                    message: `Section 10: Contract #${i + 1} amount (LKR ${curAmt.toLocaleString()}) cannot exceed Contract #${prevValidIdx + 1} amount (LKR ${prevValidAmt.toLocaleString()}). Contracts must be entered in descending order from highest to lowest value. Please click "Sort by Highest Value First" or adjust the values.`,
                  });
                  const elem = document.getElementById("section-10-container");
                  if (elem) elem.scrollIntoView({ behavior: "smooth" });
                  setLoading(false);
                  setShowReviewModal(false);
                  return;
                }
                prevValidAmt = curAmt;
                prevValidIdx = i;
              }
            }
          }
        }
      }

      // Step 1: Save draft to sync latest questionnaire state and obtain token
      const savePayload: Record<string, unknown> = {
        questionnaireData: formData,
        businessName: orgName || "Registered Entity",
        registrationNumber: formData.ictadRegistrationNumber?.trim() || undefined,
        cidaGrade: formData.cidaGrade?.trim() || undefined,
        province: formData.supplierDetails?.province?.trim() || (formData as any).province?.trim() || undefined,
        district: formData.supplierDetails?.district?.trim() || (formData as any).district?.trim() || undefined,
        contactOfficer: {
          name: formData.participant1?.fullName?.trim() || orgName || "Authorized Representative",
          phone: formData.participant1?.mobileNumber?.trim() || formData.contactNumber?.trim() || undefined,
          email: formData.participant1?.email?.trim() || formData.email?.trim() || undefined,
        },
      };
      if (currentDraftToken) savePayload.resumeToken = currentDraftToken;

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

      // Step 2: Finalize declaration (transitions DRAFT -> SUBMITTED and permanently revokes token)
      const subRes = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeToken: tokenToSubmit }),
      });
      const subData = await subRes.json();

      if (subRes.ok && subData.success && subData.submission) {
        // Purge submitted draft from browser recovery storage
        removeBrowserDraft(tokenToSubmit);
        if (currentReference) removeBrowserDraft(currentReference);
        if (subData.submission.reference) removeBrowserDraft(subData.submission.reference);
        setSavedDraftsList(getBrowserSavedDrafts());

        setShowReviewModal(false);
        setSubmissionSuccess(subData.submission);
        setCurrentDraftToken("");
        setCurrentReference("");
        setAutoSaveStatus("idle");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setFormAlert({
          type: "error",
          message: subData.message || "Submission rejected. Please check all required fields.",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      setFormAlert({
        type: "error",
        message: err instanceof Error ? err.message : "Network error during submission.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Contractor Specialities & CIDA Gradings
  const handleSpecialtyChange = (spec: AreaOfSpecialty) => {
    const current = formData.areasOfSpecialty || [];
    if (current.includes(spec)) {
      if (spec === "Other") {
        setSpecialtyOtherList([""]);
      }
      const updatedSpecs = current.filter((s) => s !== spec);
      const updatedGrades = { ...(formData.specialtyGrades || {}) };
      delete updatedGrades[spec];
      const updatedOtherGrades = { ...(formData.specialtyGradesOther || {}) };
      delete updatedOtherGrades[spec];

      const summary = Object.entries(updatedGrades)
        .filter(([_, g]) => Boolean(g))
        .map(([s, g]) => `${s}: ${g}`)
        .join(", ");

      setFormData({
        ...formData,
        areasOfSpecialty: updatedSpecs,
        specialtyOther: spec === "Other" ? "" : formData.specialtyOther,
        specialtyGrades: updatedGrades,
        specialtyGradesOther: updatedOtherGrades,
        cidaGrade: summary,
      });
    } else {
      if (spec === "Other") {
        setSpecialtyOtherList(
          formData.specialtyOther ? parseOtherSpecialties(formData.specialtyOther) : [""]
        );
      }
      setFormData({
        ...formData,
        areasOfSpecialty: [...current, spec],
      });
    }
  };

  const handleSpecialtyGradeChange = (spec: string, grade: string) => {
    const updatedGrades = {
      ...(formData.specialtyGrades || {}),
      [spec]: grade,
    };
    if (!grade) {
      delete updatedGrades[spec];
    }
    const summary = Object.entries(updatedGrades)
      .filter(([_, g]) => Boolean(g))
      .map(([s, g]) => `${s}: ${g}`)
      .join(", ");

    setFormData({
      ...formData,
      specialtyGrades: updatedGrades,
      cidaGrade: summary || (grade as any),
    });
  };

  const handleSpecialtyGradeOtherChange = (spec: string, otherGrade: string) => {
    const updatedOther = {
      ...(formData.specialtyGradesOther || {}),
      [spec]: otherGrade,
    };
    setFormData({
      ...formData,
      specialtyGradesOther: updatedOther,
    });
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

    // Automatically calculate total value across all ongoing contracts
    const calculatedSum = list.reduce((sum, item) => {
      const n = Number(item.contractAmount);
      return sum + (!isNaN(n) && n > 0 ? n : 0);
    }, 0);

    setFormData({
      ...formData,
      ongoingContracts: list,
      totalOutstandingValueLkrMillion: calculatedSum > 0 ? calculatedSum : null,
    });
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

  const handleAddOngoingContract = () => {
    const list = [...(formData.ongoingContracts || createEmptyOngoingWorks())];
    list.push({
      contractIndex: list.length + 1,
      contractName: "",
      contractNo: "",
      employerName: "",
      contractAmount: null,
      currency: "LKR",
      completionDate: null,
    });
    setFormData({ ...formData, ongoingContracts: list });
  };

  const handleRemoveOngoingContract = (index: number) => {
    const current = formData.ongoingContracts || createEmptyOngoingWorks();
    if (current.length <= 1) {
      handleOngoingContractChange(0, "contractName", "");
      handleOngoingContractChange(0, "contractNo", "");
      handleOngoingContractChange(0, "employerName", "");
      handleOngoingContractChange(0, "contractAmount", null);
      handleOngoingContractChange(0, "currency", "LKR");
      handleOngoingContractChange(0, "completionDate", null);
      return;
    }
    const filtered = current.filter((_, i) => i !== index).map((c, i) => ({
      ...c,
      contractIndex: i + 1,
    }));
    const calculatedSum = filtered.reduce((sum, item) => {
      const n = Number(item.contractAmount);
      return sum + (!isNaN(n) && n > 0 ? n : 0);
    }, 0);
    setFormData({
      ...formData,
      ongoingContracts: filtered,
      totalOutstandingValueLkrMillion: calculatedSum > 0 ? calculatedSum : null,
    });
  };

  const handleAddSimilarWork = () => {
    const list = [...(formData.similarWorks || createEmptySimilarWorks())];
    list.push({
      contractIndex: list.length + 1,
      contractType: "",
      contractName: "",
      contractAmount: null,
      startDate: null,
      completionDate: null,
      completionStatus: "",
    });
    setFormData({ ...formData, similarWorks: list });
  };

  const handleRemoveSimilarWork = (index: number) => {
    const current = formData.similarWorks || createEmptySimilarWorks();
    if (current.length <= 1) {
      handleContractChange(0, "contractName", "");
      handleContractChange(0, "contractType", "");
      handleContractChange(0, "contractAmount", null);
      handleContractChange(0, "startDate", null);
      handleContractChange(0, "completionDate", null);
      handleContractChange(0, "completionStatus", "");
      return;
    }
    const filtered = current.filter((_, i) => i !== index).map((c, i) => ({
      ...c,
      contractIndex: i + 1,
    }));
    setFormData({ ...formData, similarWorks: filtered });
  };

  const handleSortSimilarWorksDescending = () => {
    const list = [...(formData.similarWorks || createEmptySimilarWorks())];
    list.sort((a, b) => {
      const aVal = Number(a.contractAmount) || 0;
      const bVal = Number(b.contractAmount) || 0;
      return bVal - aVal;
    });
    const reindexed = list.map((c, i) => ({
      ...c,
      contractIndex: i + 1,
    }));
    setFormData({ ...formData, similarWorks: reindexed });
  };

  // Handlers for Section 11: Matters for Discussion (One by One)
  const handleMatterChange = (index: number, value: string) => {
    const list = [...(formData.mattersForDiscussionList || [""])];
    list[index] = value;
    const combined = list
      .map((m) => m.trim())
      .filter(Boolean)
      .map((m, idx) => `${idx + 1}. ${m}`)
      .join("\n\n");

    setFormData({
      ...formData,
      mattersForDiscussionList: list,
      mattersForDiscussion: combined,
    });
  };

  const handleAddMatter = () => {
    const list = [...(formData.mattersForDiscussionList || [""])];
    list.push("");
    setFormData({
      ...formData,
      mattersForDiscussionList: list,
    });
  };

  const handleRemoveMatter = (index: number) => {
    const list = [...(formData.mattersForDiscussionList || [""])];
    if (list.length <= 1) {
      setFormData({
        ...formData,
        mattersForDiscussionList: [""],
        mattersForDiscussion: "",
      });
      return;
    }
    const filtered = list.filter((_, i) => i !== index);
    const combined = filtered
      .map((m) => m.trim())
      .filter(Boolean)
      .map((m, idx) => `${idx + 1}. ${m}`)
      .join("\n\n");

    setFormData({
      ...formData,
      mattersForDiscussionList: filtered,
      mattersForDiscussion: combined,
    });
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
                setSpecialtyOtherList([""]);
                setSupplierMaterialsOtherList([""]);
                setCidaGradeOtherList([""]);
                setFormData({
                  organizationName: "",
                  contactNumber: "",
                  email: "",
                  willParticipate: "",
                  participantCategory: "",
                  participant1: { fullName: "", mobileNumber: "", email: "", designation: "" },
                  participant2: { fullName: "", mobileNumber: "", email: "", designation: "" },
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
                  mattersForDiscussionList: [""],
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
      <div className="bg-gradient-to-br from-[#07162c] via-[#0b1f3a] to-[#0f294d] text-white p-4 sm:p-7 lg:p-8 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Mobile Layout (< sm / < 640px) */}
          <div className="sm:hidden space-y-2">
            {/* 1. Top: Single line Road Development Authority • Sri Lanka */}
            <div className="w-full">
              <span className="text-[10px] min-[360px]:text-[11px] min-[400px]:text-[11.5px] tracking-wider font-bold text-amber-400 uppercase block whitespace-nowrap">
                Road Development Authority &bull; Sri Lanka
              </span>
            </div>

            {/* 2. Heading 1: Early Market Engagement Workshop (Single unbroken line) */}
            <div className="w-full">
              <h1 className="text-[13.5px] min-[360px]:text-[15px] min-[390px]:text-[16.5px] min-[430px]:text-lg font-black tracking-tight text-white leading-snug whitespace-nowrap">
                Early Market Engagement Workshop
              </h1>
            </div>

            {/* 3. Subtitle: Organized by Inclusive Connectivity and Development Project (ICDP) */}
            <p className="text-[11px] min-[360px]:text-xs text-slate-300 font-medium leading-relaxed">
              Organized by Inclusive Connectivity and Development Project (ICDP)
            </p>

            {/* 4. Bottom Row: 07 December 2026 and logo (closer to the subtitle) */}
            <div className="pt-0.5 flex items-start justify-between gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] min-[360px]:text-xs font-semibold text-amber-300 shadow-sm shrink-0 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>07 December 2026</span>
              </div>

              {/* Ministry & RDA Official Logos on mobile bottom-right */}
              <div className="bg-white rounded-xl px-2.5 py-1.5 shadow-md border border-white/40 shrink-0 flex flex-col items-center gap-1 max-w-[145px]">
                <img
                  src="/ministry-logo.png"
                  alt="Ministry of Transport, Highways and Urban Development"
                  className="h-4.5 w-auto object-contain"
                />
                <div className="w-full border-t border-slate-200" />
                <img
                  src="/rda-logo.png"
                  alt="Road Development Authority Sri Lanka"
                  className="h-5.5 w-auto object-contain"
                />
              </div>
            </div>
          </div>

          {/* Tablet & Desktop Layout (>= sm / >= 640px) */}
          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-6 lg:gap-8">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] lg:text-xs tracking-widest font-bold text-amber-400 uppercase">
                  Road Development Authority &bull; Sri Lanka
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-[25px] lg:text-[28px] xl:text-[30px] font-black tracking-tight text-white leading-tight whitespace-nowrap">
                Early Market Engagement Workshop
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Organized by Inclusive Connectivity and Development Project (ICDP)
              </p>
              <div className="pt-1 flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300 shadow-sm">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>07 December 2026</span>
                </div>
              </div>
            </div>

            {/* Official Ministry & RDA Logos on Tablet & Desktop */}
            <div className="shrink-0 flex items-center">
              <div className="bg-white rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 lg:px-4.5 lg:py-3 shadow-lg border border-white/40 flex flex-col items-center gap-1.5 max-w-[200px] sm:max-w-[220px] lg:max-w-[240px]">
                <img
                  src="/ministry-logo.png"
                  alt="Ministry of Transport, Highways and Urban Development"
                  className="h-5.5 sm:h-6.5 lg:h-7.5 w-auto object-contain"
                />
                <div className="w-full border-t border-slate-200" />
                <img
                  src="/rda-logo.png"
                  alt="Road Development Authority Sri Lanka"
                  className="h-6.5 sm:h-7.5 lg:h-8.5 w-auto object-contain"
                />
              </div>
            </div>
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
                      href="mailto:amindunil@gmail.com"
                      className="text-blue-900 underline hover:text-blue-700 font-medium"
                    >
                      amindunil@gmail.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Browser Draft Recovery Screen */}
      {showRecoveryPrompt && savedDraftsList.length > 0 ? (
        <div className="bg-white rounded-2xl border-2 border-blue-900/20 shadow-xl p-5 sm:p-7 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-blue-900" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold tracking-widest text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                Browser Smart Draft Recovery
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Resume Previous Incomplete Registration?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                An incomplete registration session was detected in this browser. You can continue from your exact saved progress or start a separate new registration.
              </p>
            </div>
          </div>

          {/* List of Incomplete Drafts in this browser */}
          <div className="space-y-3">
            {savedDraftsList.map((d, index) => (
              <div
                key={d.token || index}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {d.organizationName || "Untitled Registration"}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {d.reference}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                    <span>Category: <strong>{d.category || "General"}</strong></span>
                    <span>&bull;</span>
                    <span>Last Saved: {new Date(d.lastSavedAt).toLocaleString("en-GB")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadDraft(d.token)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Continue Previous Registration</span>
                  </button>
                  {savedDraftsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        removeBrowserDraft(d.token);
                        setSavedDraftsList(getBrowserSavedDrafts());
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Discard this draft from browser"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Option B: Start New Registration */}
          <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleStartNewRegistration}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Start New Registration</span>
              </button>
              {(formData.organizationName || currentDraftToken) && (
                <button
                  type="button"
                  onClick={() => setShowRecoveryPrompt(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all"
                >
                  <span>Return to Form</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center sm:text-right">
              Starting a new registration will not overwrite previous drafts.
            </p>
          </div>

          {/* Browser Recovery Note */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Browser Storage Notice:</strong> If you are using Private/Incognito browsing, or if browser cache was cleared, previously saved drafts cannot be automatically recovered. For assistance, contact the ICDP Helpdesk at <strong>070 697 0408</strong>.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Live Auto-Save Status Bar and Quick Controls */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Auto-save status */}
        <div className="flex items-center gap-2.5">
          {autoSaveStatus === "saving" ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" />
              <span>Saving draft progress...</span>
            </div>
          ) : autoSaveStatus === "saved" ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Saved {currentReference ? `&bull; Ref: ${currentReference}` : ""}
                {lastSavedTime
                  ? ` (${lastSavedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
                  : ""}
              </span>
            </div>
          ) : autoSaveStatus === "error" ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Save failed. Check connection.</span>
              <button
                type="button"
                onClick={() => performDraftSave(false)}
                className="underline hover:text-rose-900 ml-1 text-xs"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {currentReference ? `Draft Ref: ${currentReference}` : "Auto-saving active (saves while you fill)"}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {/* Manual Save as Draft button */}
          <button
            type="button"
            onClick={() => performDraftSave(false)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all"
            title="Explicitly save form draft now"
          >
            <Save className="w-3.5 h-3.5 text-blue-900" />
            <span>Save as Draft</span>
          </button>

          {/* If other saved drafts exist in browser, allow switching */}
          {savedDraftsList.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRecoveryPrompt(!showRecoveryPrompt)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all"
              title="View all drafts saved in this browser"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>Saved Drafts ({savedDraftsList.length})</span>
            </button>
          )}

          {/* Start New Registration button */}
          <button
            type="button"
            onClick={handleStartNewRegistration}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs shadow-sm transition-all"
            title="Start a separate blank registration"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ New</span>
          </button>
        </div>
      </div>

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

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => performDraftSave(false)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all min-h-[44px]"
                      >
                        <Save className="w-3.5 h-3.5 text-blue-900" />
                        <span>Save as Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleInitiateReview}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60 min-h-[44px]"
                      >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                        <span>Review &amp; Submit Response</span>
                      </button>
                    </div>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                    mobileNumber: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. 0771234567"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={formData.participant1?.email || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                    email: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. sunil@example.com"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                            <input
                              type="text"
                              value={formData.participant2?.fullName || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant2: {
                                    ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                                    ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                    mobileNumber: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. 0719876543"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                            <input
                              type="email"
                              value={formData.participant2?.email || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant2: {
                                    ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                    email: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. attendee2@example.com"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                                    ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                    mobileNumber: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. 0779876543"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={formData.participant1?.email || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  participant1: {
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                    email: e.target.value,
                                  },
                                })
                              }
                              placeholder="e.g. supplier@example.com"
                              className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                                    ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                  Specify Other Supplied Material(s)
                                </label>
                                <span className="text-[11px] text-slate-500">
                                  Add one or more material types
                                </span>
                              </div>

                              <div className="space-y-2">
                                {supplierMaterialsOtherList.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) => handleUpdateSupplierMaterialOther(idx, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddSupplierMaterialOther();
                                        }
                                      }}
                                      placeholder={
                                        idx === 0
                                          ? "If Other, please specify your material type..."
                                          : `Additional material #${idx + 1}`
                                      }
                                      className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-800"
                                    />
                                    {supplierMaterialsOtherList.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSupplierMaterialOther(idx)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                        title="Remove this material"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                              <div>
                                <button
                                  type="button"
                                  onClick={handleAddSupplierMaterialOther}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-sm transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Add another material</span>
                                </button>
                              </div>
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                                      ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                                      ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                      mobileNumber: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. 0771234567"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                              <input
                                type="email"
                                required
                                value={formData.participant1?.email || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant1: {
                                      ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                      email: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. sunil@example.com"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                                      ...(formData.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                              <input
                                type="text"
                                value={formData.participant2?.fullName || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant2: {
                                      ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                                      ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                      mobileNumber: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. 0719876543"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                              <input
                                type="email"
                                value={formData.participant2?.email || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    participant2: {
                                      ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
                                      email: e.target.value,
                                    },
                                  })
                                }
                                placeholder="e.g. attendee2@example.com"
                                className="w-full p-2 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
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
                                      ...(formData.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
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
                          <div className="flex items-center justify-between mb-1">
                            <label className="block font-semibold text-slate-700">
                              ICTAD registration number *
                            </label>
                            {isCheckingRegNumber && (
                              <span className="text-[10px] text-blue-700 font-medium flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 animate-spin text-blue-700" />
                                Checking uniqueness...
                              </span>
                            )}
                            {!isCheckingRegNumber && regNumberAvailable && formData.ictadRegistrationNumber?.trim() && !regNumberError && (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Registration number is unique
                              </span>
                            )}
                          </div>
                          <input
                            id="ictad-reg-number-input"
                            type="text"
                            required
                            value={formData.ictadRegistrationNumber}
                            onChange={(e) => {
                              setFormData({ ...formData, ictadRegistrationNumber: e.target.value });
                              if (regNumberError) setRegNumberError(null);
                              setRegNumberAvailable(false);
                            }}
                            onBlur={() => checkRegNumberUniqueness(formData.ictadRegistrationNumber || "")}
                            placeholder="e.g. CIDA/12450"
                            className={`w-full p-2.5 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                              regNumberError
                                ? "border-2 border-rose-500 bg-rose-50/50 focus:ring-rose-500 text-rose-950 font-bold"
                                : regNumberAvailable && formData.ictadRegistrationNumber?.trim()
                                ? "border border-emerald-500 bg-emerald-50/20 focus:ring-emerald-600"
                                : "border border-slate-300 bg-slate-50 focus:bg-white focus:ring-blue-800"
                            }`}
                          />
                          {regNumberError && (
                            <div className="flex items-start gap-1.5 p-2 mt-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <span className="font-medium">{regNumberError}</span>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1 font-sans">
                            Each contractor organization must provide a unique CIDA / ICTAD registration number. Duplicate registration numbers are strictly prohibited.
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <label className="block font-semibold text-slate-800 text-xs">
                                Areas of specialty &amp; CIDA grading * (Select all that apply)
                              </label>
                              <p className="text-[11px] text-slate-500">
                                Select one or more specialty areas and choose the corresponding CIDA grading under each.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddSpecialtyOther}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-lg transition-colors shrink-0"
                              title="Click to add custom specialty"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Other Specialty</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {SPECIALTY_OPTIONS.filter((s) => s !== "Other").map((spec) => {
                              const isChecked = (formData.areasOfSpecialty || []).includes(spec);
                              return (
                                <div
                                  key={spec}
                                  className={`p-3.5 rounded-xl border transition-all ${
                                    isChecked
                                      ? "bg-blue-50/70 border-2 border-blue-800 shadow-sm"
                                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleSpecialtyChange(spec)}
                                        className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800"
                                      />
                                      <span className="font-semibold text-slate-900 text-xs">{spec}</span>
                                    </label>
                                    {isChecked && (
                                      <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                                        Selected
                                      </span>
                                    )}
                                  </div>

                                  {/* CIDA grading under this specialty area */}
                                  {isChecked && (
                                    <div className="mt-2.5 pt-2.5 border-t border-blue-200/80 space-y-1.5">
                                      <label className="block text-[11px] font-bold text-slate-700">
                                        CIDA Grading for {spec} *
                                      </label>
                                      <select
                                        required
                                        value={formData.specialtyGrades?.[spec] || ""}
                                        onChange={(e) => handleSpecialtyGradeChange(spec, e.target.value)}
                                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-800 shadow-sm"
                                      >
                                        <option value="">— Select CIDA Grading for {spec} —</option>
                                        {CIDA_GRADES.map((g) => (
                                          <option key={g} value={g}>
                                            {g}
                                          </option>
                                        ))}
                                      </select>
                                      {formData.specialtyGrades?.[spec] === "Other" && (
                                        <input
                                          type="text"
                                          value={formData.specialtyGradesOther?.[spec] || ""}
                                          onChange={(e) => handleSpecialtyGradeOtherChange(spec, e.target.value)}
                                          placeholder={`Specify custom CIDA grading for ${spec}...`}
                                          className="w-full p-1.5 bg-amber-50/60 border border-amber-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-800 mt-1"
                                        />
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Other Specialty Card */}
                            {(() => {
                              const isOtherChecked = (formData.areasOfSpecialty || []).includes("Other");
                              return (
                                <div
                                  className={`p-3.5 rounded-xl border transition-all sm:col-span-2 ${
                                    isOtherChecked
                                      ? "bg-blue-50/70 border-2 border-blue-800 shadow-sm"
                                      : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isOtherChecked}
                                        onChange={() => handleSpecialtyChange("Other")}
                                        className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800"
                                      />
                                      <span className="font-semibold text-slate-900 text-xs">Other Specialty Area(s)</span>
                                    </label>
                                    {isOtherChecked && (
                                      <span className="text-[10px] text-blue-800 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                                        {specialtyOtherList.filter((s) => s.trim()).length} Specified
                                      </span>
                                    )}
                                  </div>

                                  {/* Under Other specialty: show specialty inputs with their CIDA grading selectors */}
                                  {isOtherChecked && (
                                    <div className="mt-3 pt-3 border-t border-blue-200/80 space-y-3">
                                      <span className="text-[11px] font-bold text-slate-700 block">
                                        Specify Other Specialty &amp; Select CIDA Grading for Each:
                                      </span>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {specialtyOtherList.map((item, idx) => {
                                          const itemKey = item.trim() || `Other_${idx + 1}`;
                                          return (
                                            <div
                                              key={idx}
                                              className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-sm"
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-bold text-blue-900">
                                                  Other Specialty #{idx + 1}
                                                </span>
                                                {specialtyOtherList.length > 1 && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveSpecialtyOther(idx)}
                                                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                                    title="Remove specialty"
                                                  >
                                                    <X className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>

                                              <div>
                                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                                  Specialty Name *
                                                </label>
                                                <input
                                                  type="text"
                                                  value={item}
                                                  onChange={(e) => handleUpdateSpecialtyOther(idx, e.target.value)}
                                                  placeholder={
                                                    idx === 0
                                                      ? "e.g. Drainage, Piling, Water Supply"
                                                      : `Specialty #${idx + 1}`
                                                  }
                                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                                />
                                              </div>

                                              <div>
                                                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                                                  CIDA Grading {item.trim() ? `for ${item.trim()}` : ""} *
                                                </label>
                                                <select
                                                  value={formData.specialtyGrades?.[itemKey] || ""}
                                                  onChange={(e) => handleSpecialtyGradeChange(itemKey, e.target.value)}
                                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                                >
                                                  <option value="">— Select CIDA Grading —</option>
                                                  {CIDA_GRADES.map((g) => (
                                                    <option key={g} value={g}>
                                                      {g}
                                                    </option>
                                                  ))}
                                                </select>
                                                {formData.specialtyGrades?.[itemKey] === "Other" && (
                                                  <input
                                                    type="text"
                                                    value={formData.specialtyGradesOther?.[itemKey] || ""}
                                                    onChange={(e) => handleSpecialtyGradeOtherChange(itemKey, e.target.value)}
                                                    placeholder="Specify custom grading..."
                                                    className="w-full p-1.5 bg-amber-50/60 border border-amber-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-800 mt-1"
                                                  />
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      <div className="pt-1 flex items-center justify-between">
                                        <button
                                          type="button"
                                          onClick={handleAddSpecialtyOther}
                                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>+ Add Another Other Specialty</span>
                                        </button>
                                        <span className="text-[11px] text-slate-400 italic">
                                          Press Enter to add another specialty
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
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
                          Section 7: Current Work Commitments
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
                              <div className="flex items-center justify-between mb-1">
                                <label className="block font-semibold text-slate-700">
                                  Total value of outstanding works as at 1 December 2026 (Total Amount in LKR) *
                                </label>
                                {ongoingTotalOutstanding > 0 && (
                                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-bold">
                                    ✓ Auto-calculated from table below
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 mb-2">
                                Please enter the total value of works that remain to be completed under all your ongoing contracts as at 1 December 2026 in full LKR. (Calculates automatically as you enter amounts in the table below).
                              </p>
                              <div className="flex items-center gap-3">
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
                                  className="w-full sm:w-72 p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono font-bold"
                                />
                                {formData.totalOutstandingValueLkrMillion !== null &&
                                  formData.totalOutstandingValueLkrMillion !== undefined && (
                                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100/70 px-2.5 py-1.5 rounded-lg border border-blue-200">
                                      = LKR {Number(formData.totalOutstandingValueLkrMillion).toLocaleString()}
                                    </span>
                                  )}
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wide">
                                  Key Ongoing Contracts (Optional)
                                </span>
                                <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                                  {(formData.ongoingContracts || []).filter((c) => c.contractName).length} of{" "}
                                  {(formData.ongoingContracts || []).length} Specified
                                </span>
                              </div>

                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table className="w-full min-w-[980px] text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                                      <th className="p-3 w-12 text-center">No</th>
                                      <th className="p-3 min-w-[200px]">Name of contract</th>
                                      <th className="p-3 w-40">Contract No</th>
                                      <th className="p-3 min-w-[180px]">Employer's Name</th>
                                      <th className="p-3 w-56">Value of outstanding work(LKR) as at 1st December</th>
                                      <th className="p-3 w-44">Estimated completion date</th>
                                      <th className="p-3 w-14 text-center">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200/80">
                                    {(formData.ongoingContracts || createEmptyOngoingWorks()).map((contract, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="p-3 text-center font-bold text-blue-900 bg-slate-50/50 align-top pt-4">
                                          #{idx + 1}
                                        </td>
                                        <td className="p-3 align-top">
                                          <input
                                            type="text"
                                            value={contract.contractName || ""}
                                            onChange={(e) => handleOngoingContractChange(idx, "contractName", e.target.value)}
                                            placeholder="Name of contract"
                                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                          />
                                        </td>
                                        <td className="p-3 align-top">
                                          <input
                                            type="text"
                                            value={contract.contractNo || ""}
                                            onChange={(e) => handleOngoingContractChange(idx, "contractNo", e.target.value)}
                                            placeholder="Contract No"
                                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                                          />
                                        </td>
                                        <td className="p-3 align-top">
                                          <input
                                            type="text"
                                            value={contract.employerName || ""}
                                            onChange={(e) => handleOngoingContractChange(idx, "employerName", e.target.value)}
                                            placeholder="Employer's Name"
                                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                          />
                                        </td>
                                        <td className="p-3 align-top space-y-1">
                                          <input
                                            type="number"
                                            value={contract.contractAmount ?? ""}
                                            onChange={(e) => handleOngoingContractChange(idx, "contractAmount", e.target.value)}
                                            placeholder="Amount in LKR"
                                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                                          />
                                          {contract.contractAmount !== null && contract.contractAmount !== undefined && contract.contractAmount !== "" && (
                                            <span className="text-[10px] font-mono text-slate-600 block">
                                              = LKR {Number(contract.contractAmount).toLocaleString()}
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-3 align-top">
                                          <input
                                            type="date"
                                            value={contract.completionDate || ""}
                                            onChange={(e) => handleOngoingContractChange(idx, "completionDate", e.target.value)}
                                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                          />
                                        </td>
                                        <td className="p-3 text-center align-top pt-4">
                                          {(formData.ongoingContracts || []).length > 1 && (
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveOngoingContract(idx)}
                                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                              title="Remove contract row"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-blue-50/80 border-t-2 border-blue-200 text-xs font-bold">
                                      <td colSpan={4} className="p-3 text-right text-blue-950 font-bold uppercase tracking-wider">
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                                            AUTO-CALCULATED
                                          </span>
                                          <span>Total Value of Outstanding Work:</span>
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <div className="p-2 bg-white border-2 border-blue-600 rounded-lg text-blue-950 font-mono font-bold text-sm shadow-sm">
                                          LKR {ongoingTotalOutstanding.toLocaleString()}
                                        </div>
                                      </td>
                                      <td colSpan={2} className="p-3 text-slate-500 text-[11px] font-normal italic">
                                        Sum of all ongoing contracts as at 1st Dec
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={handleAddOngoingContract}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>+ Add Ongoing Contract</span>
                                </button>
                                <span className="text-[10px] text-slate-400 italic">
                                  You can add additional ongoing contracts as needed
                                </span>
                              </div>
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
                          Section 9: Experience
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
                    <div id="section-10-container" className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-900" />
                          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                            Section 10: Similar Work Experience
                          </h2>
                        </div>
                      </div>

                      <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="leading-relaxed space-y-1">
                          <p>
                            <strong>Official Instruction:</strong> Please provide details of the highest-value contracts your organization has completed within the last five years (December 2021 to November 2026) that are similar in nature to the proposed works.
                          </p>
                          <p className="font-semibold text-amber-950">
                            ⚠️ <strong>Required Order: Higher Value to Lower Value (Descending)</strong> — Contract #1 must be your largest contract by amount. Subsequent contracts must be equal or lower in value. If entered out of order, you can use the <strong>"Sort by Highest Value First"</strong> button below.
                          </p>
                          <p className="text-[11px] text-amber-800">
                            For firms without relevant experience, please enter <strong>N/A</strong> in the Contract Name field and leave the other fields blank.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                          <table className="w-full min-w-[960px] text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                                <th className="p-3 w-12 text-center">#</th>
                                <th className="p-3 min-w-[200px]">Contract Name / Project</th>
                                <th className="p-3 w-48">Contract Type</th>
                                <th className="p-3 w-48">
                                  <div className="flex flex-col">
                                    <span>Amount (LKR) *</span>
                                    <span className="text-[9px] text-amber-700 font-bold normal-case tracking-normal">
                                      (Higher to Lower ↓)
                                    </span>
                                  </div>
                                </th>
                                <th className="p-3 w-52">Duration (Start - Completion)</th>
                                <th className="p-3 w-48">Completion Status</th>
                                <th className="p-3 w-14 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80">
                              {(formData.similarWorks || createEmptySimilarWorks()).map((contract, idx) => {
                                const isNA = Boolean(contract.contractName && contract.contractName.trim().toUpperCase() === "N/A");
                                const currentAmount = Number(contract.contractAmount);
                                const hasValidAmount = !isNA && !isNaN(currentAmount) && contract.contractAmount !== null && contract.contractAmount !== undefined && contract.contractAmount !== "";

                                // Check if current contract amount violates descending order compared to previous contract with amount
                                let prevAmount: number | null = null;
                                let prevContractNum: number | null = null;
                                if (hasValidAmount && idx > 0) {
                                  const allList = formData.similarWorks || [];
                                  for (let p = idx - 1; p >= 0; p--) {
                                    const prevC = allList[p];
                                    if (prevC && prevC.contractName && prevC.contractName.trim().toUpperCase() !== "N/A" && prevC.contractAmount !== null && prevC.contractAmount !== undefined && prevC.contractAmount !== "") {
                                      const pVal = Number(prevC.contractAmount);
                                      if (!isNaN(pVal)) {
                                        prevAmount = pVal;
                                        prevContractNum = p + 1;
                                        break;
                                      }
                                    }
                                  }
                                }
                                const isOrderViolation = prevAmount !== null && currentAmount > prevAmount;

                                return (
                                  <tr
                                    key={idx}
                                    className={`hover:bg-slate-50/70 transition-colors ${
                                      isNA ? "bg-slate-50/40 opacity-70" : isOrderViolation ? "bg-rose-50/30" : ""
                                    }`}
                                  >
                                    <td className="p-3 text-center font-bold text-blue-900 bg-slate-50/50 align-top pt-4">
                                      #{idx + 1}
                                    </td>
                                    <td className="p-3 align-top space-y-1">
                                      <input
                                        type="text"
                                        value={contract.contractName || ""}
                                        onChange={(e) => handleContractChange(idx, "contractName", e.target.value)}
                                        placeholder={idx === 0 ? "Project Title or enter N/A *" : "Project Title"}
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                                      />
                                      {isNA && (
                                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold inline-block">
                                          Marked N/A
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 align-top space-y-1">
                                      <select
                                        disabled={isNA}
                                        value={contract.contractType || ""}
                                        onChange={(e) => handleContractChange(idx, "contractType", e.target.value)}
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium disabled:opacity-50"
                                      >
                                        <option value="">— Select Type —</option>
                                        {CONTRACT_TYPE_OPTIONS.map((t) => (
                                          <option key={t} value={t}>
                                            {t}
                                          </option>
                                        ))}
                                      </select>
                                      {contract.contractType === "Other" && (
                                        <input
                                          type="text"
                                          disabled={isNA}
                                          value={(contract as any).contractTypeOther || ""}
                                          onChange={(e) => handleContractChange(idx, "contractTypeOther", e.target.value)}
                                          placeholder="Specify contract type..."
                                          className="w-full p-1.5 bg-amber-50/60 border border-amber-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-800 disabled:opacity-50"
                                        />
                                      )}
                                    </td>
                                    <td className="p-3 align-top space-y-1">
                                      <input
                                        type="number"
                                        disabled={isNA}
                                        value={contract.contractAmount ?? ""}
                                        onChange={(e) => handleContractChange(idx, "contractAmount", e.target.value)}
                                        placeholder="Amount in LKR"
                                        className={`w-full p-2 bg-slate-50 border rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 font-mono disabled:opacity-50 ${
                                          isOrderViolation
                                            ? "border-rose-400 bg-rose-50/60 focus:ring-rose-500 text-rose-900"
                                            : "border-slate-300 focus:ring-blue-800"
                                        }`}
                                      />
                                      {!isNA && contract.contractAmount !== null && contract.contractAmount !== undefined && contract.contractAmount !== "" && (
                                        <span className="text-[10px] font-mono text-slate-600 block">
                                          = LKR {Number(contract.contractAmount).toLocaleString()}
                                        </span>
                                      )}
                                      {isOrderViolation && (
                                        <div className="flex items-start gap-1 p-1.5 mt-1 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] leading-tight font-sans">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                                          <span>
                                            Must be &le; Contract #{prevContractNum} (LKR {prevAmount!.toLocaleString()}). Please enter higher value to lower value.
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3 align-top">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-400 w-9 shrink-0 font-medium">Start:</span>
                                          <input
                                            type="date"
                                            disabled={isNA}
                                            value={contract.startDate || ""}
                                            onChange={(e) => handleContractChange(idx, "startDate", e.target.value)}
                                            className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] text-slate-400 w-9 shrink-0 font-medium">End:</span>
                                          <input
                                            type="date"
                                            disabled={isNA}
                                            value={contract.completionDate || ""}
                                            onChange={(e) => handleContractChange(idx, "completionDate", e.target.value)}
                                            className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                                          />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3 align-top">
                                      <select
                                        disabled={isNA}
                                        value={contract.completionStatus || ""}
                                        onChange={(e) => handleContractChange(idx, "completionStatus", e.target.value)}
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium disabled:opacity-50"
                                      >
                                        <option value="">— Select Status —</option>
                                        {COMPLETION_STATUS_OPTIONS.map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-3 text-center align-top pt-4">
                                      {(formData.similarWorks || []).length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSimilarWork(idx)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                          title="Remove contract row"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleAddSimilarWork}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              <span>+ Add Similar Work Contract</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleSortSimilarWorksDescending}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-blue-900 rounded-lg shadow-sm transition-all"
                              title="Automatically reorder contracts from highest value to lowest value"
                            >
                              <ArrowUpDown className="w-4 h-4 text-blue-900" />
                              <span>Sort by Highest Value First</span>
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Enter contracts in descending order (highest value first)
                          </span>
                        </div>
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

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700">
                        Do you have any specific matters, concerns or suggestions that you would like to be discussed during the Early Market Engagement Workshop? (Optional)
                      </label>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                        Please add each matter, concern, or suggestion separately below. Participants are encouraged to share topics relating to market conditions, technical requirements, procurement arrangements, implementation challenges, or other issues relevant to ICDP activities.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {(formData.mattersForDiscussionList && formData.mattersForDiscussionList.length > 0
                        ? formData.mattersForDiscussionList
                        : [""]
                      ).map((matter, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors focus-within:bg-white focus-within:border-blue-700 focus-within:ring-2 focus-within:ring-blue-800/10 shadow-sm"
                        >
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-900 text-white font-bold text-xs shrink-0 shadow-sm mt-0.5">
                            #{idx + 1}
                          </div>

                          <div className="flex-1 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Matter / Suggestion #{idx + 1}
                            </label>
                            <textarea
                              rows={2}
                              value={matter}
                              onChange={(e) => handleMatterChange(idx, e.target.value)}
                              placeholder={`Enter specific matter, concern, or suggestion #${idx + 1}...`}
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-800 placeholder:text-slate-400"
                            />
                          </div>

                          <div className="pt-6 shrink-0">
                            {(formData.mattersForDiscussionList || [""]).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMatter(idx)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove this matter"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleAddMatter}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Another Matter / Suggestion</span>
                      </button>
                      <span className="text-[10px] text-slate-400 italic">
                        You can add multiple separate discussion matters as needed
                      </span>
                    </div>

                    {getDynamicQuestionsForSection("SEC-11")
                      .concat(getDynamicQuestionsForSection("sec-matters-discussion"))
                      .map(renderDynamicQuestionField)}
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
                    onClick={() => performDraftSave(false)}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 sm:py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all min-h-[44px]"
                  >
                    {loading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" />
                    ) : (
                      <Save className="w-3.5 h-3.5 text-blue-900" />
                    )}
                    <span>
                      {currentReference ? `Save Draft (${currentReference})` : "Save as Draft"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInitiateReview}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-900/20 transition-all min-h-[44px]"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Validating Form...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 text-amber-400" />
                        <span>Review &amp; Submit Questionnaire Response</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    )}

    {/* ========================================================================= */}
    {/* OFFICIAL REGISTRATION REVIEW & CONFIRMATION MODAL                         */}
    {/* ========================================================================= */}
    {showReviewModal && (
      <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="bg-[#0b1f3a] text-white px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between shrink-0 border-b border-white/10">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-wider font-bold text-amber-400 uppercase">
                  RDA Sri Lanka &bull; Verification Area
                </span>
                <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-400/30">
                  PRE-SUBMISSION REVIEW
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5 truncate">
                Review All Registration Details
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Close and Return to Form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1 bg-slate-50/60 text-xs text-slate-800">
            {/* Review Guidance Alert */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
              <div className="text-blue-950 space-y-0.5 leading-relaxed">
                <span className="font-bold block text-xs sm:text-sm">Please verify your details below</span>
                <p className="text-[11px] text-blue-900/90">
                  Carefully review all information entered across every section. If any details are incorrect, click <strong>&quot;Modify / Edit Details&quot;</strong> to return to the form and edit. Once verified, click <strong>&quot;Confirm &amp; Submit Directly&quot;</strong> to complete your official filing to the Road Development Authority.
                </p>
              </div>
            </div>

            {/* Section 1: Basic Information & Attendance */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-blue-900" />
                <span>Section 1: Basic Information &amp; Workshop Attendance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <span className="text-slate-500 font-medium text-[11px] block">Organization / Company Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{formData.organizationName || formData.supplierDetails?.companyName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium text-[11px] block">Workshop Attendance:</span>
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    formData.willParticipate === "Yes" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {formData.willParticipate === "Yes" ? "Yes — Will Attend (07 Dec 2026)" : "No — Unable to Attend"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium text-[11px] block">Official Contact Number:</span>
                  <span className="font-semibold text-slate-800 font-mono">{formData.contactNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium text-[11px] block">Official Email Address:</span>
                  <span className="font-semibold text-slate-800 font-mono">{formData.email || "N/A"}</span>
                </div>
                {formData.willParticipate === "Yes" && (
                  <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium text-[11px] block">Participant Category:</span>
                    <span className="font-bold text-blue-950 text-xs">
                      {formData.participantCategory || "N/A"}
                    </span>
                  </div>
                )}
                {formData.willParticipate === "No" && (
                  <div className="sm:col-span-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium text-[11px] block">Status:</span>
                    <span className="text-slate-600 text-xs italic">Declination of attendance recorded.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Official Representatives */}
            {formData.willParticipate === "Yes" && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                  <Users className="w-3.5 h-3.5 text-blue-900" />
                  <span>Designated Workshop Representatives</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Participant 1 */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-900 uppercase">Primary Representative (Participant 1)</span>
                    <p className="font-bold text-slate-900 text-sm">{formData.participant1?.fullName || "N/A"}</p>
                    <p className="text-slate-600 font-medium">{formData.participant1?.designation || "N/A"}</p>
                    <div className="pt-1 text-[11px] text-slate-500 font-mono space-y-0.5">
                      <div>Phone: {formData.participant1?.mobileNumber || "N/A"}</div>
                      <div>Email: {formData.participant1?.email || "N/A"}</div>
                    </div>
                  </div>
                  {/* Participant 2 */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Second Representative (Participant 2)</span>
                    {formData.participant2?.fullName?.trim() ? (
                      <>
                        <p className="font-bold text-slate-900 text-sm">{formData.participant2.fullName}</p>
                        <p className="text-slate-600 font-medium">{formData.participant2.designation || "N/A"}</p>
                        <div className="pt-1 text-[11px] text-slate-500 font-mono space-y-0.5">
                          <div>Phone: {formData.participant2.mobileNumber || "N/A"}</div>
                          {formData.participant2.email && <div>Email: {formData.participant2.email}</div>}
                        </div>
                      </>
                    ) : (
                      <p className="text-slate-400 italic text-xs pt-1">No second representative designated.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CONTRACTOR SPECIFIC SECTIONS */}
            {formData.willParticipate === "Yes" && formData.participantCategory === "Contractor" && (
              <>
                {/* Section 4: Contractor Specialties & CIDA Grades */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                    <span>Section 4: Contractor Details &amp; CIDA Grading</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium text-[11px] block">ICTAD / CIDA Registration Number:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{formData.ictadRegistrationNumber || "N/A"}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-slate-500 font-medium text-[11px] block">Selected Technical Specialties &amp; Assigned CIDA Grades:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(formData.areasOfSpecialty || []).filter((s) => s !== "Other").map((spec) => {
                        const grade = formData.specialtyGrades?.[spec];
                        const gradeLabel = grade === "Other" && formData.specialtyGradesOther?.[spec]
                          ? `Other (${formData.specialtyGradesOther[spec]})`
                          : grade || "Not selected";
                        return (
                          <div key={spec} className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{spec}</span>
                            <span className="text-xs font-black text-blue-900 bg-white px-2 py-0.5 rounded shadow-xs border border-blue-100">
                              Grade: {gradeLabel}
                            </span>
                          </div>
                        );
                      })}

                      {(formData.areasOfSpecialty || []).includes("Other") && (
                        specialtyOtherList.filter((s) => s.trim()).map((oth, oIdx) => {
                          const itemKey = oth.trim() || `Other_${oIdx + 1}`;
                          const grade = formData.specialtyGrades?.[itemKey] || formData.specialtyGrades?.[oth];
                          const gradeLabel = grade === "Other" && (formData.specialtyGradesOther?.[itemKey] || formData.specialtyGradesOther?.[oth])
                            ? `Other (${formData.specialtyGradesOther?.[itemKey] || formData.specialtyGradesOther?.[oth]})`
                            : grade || "Not selected";
                          return (
                            <div key={`oth-rev-${oIdx}`} className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">Other: {oth}</span>
                              <span className="text-xs font-black text-amber-900 bg-white px-2 py-0.5 rounded shadow-xs border border-amber-100">
                                Grade: {gradeLabel}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 5 & 6: Financial Statements & Loan Commitments */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-blue-900" />
                    <span>Section 5: Financial Capability (5-Year Consolidated Statements)</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 min-w-[140px]">Financial Indicator (LKR)</th>
                          {FINANCIAL_YEARS.map((y) => (
                            <th key={y} className="p-2 text-right">{y}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { key: "totalAssets" as const, label: "Total Assets" },
                          { key: "totalLiabilities" as const, label: "Total Liabilities" },
                          { key: "totalEquity" as const, label: "Total Equity / Net Worth", isReadOnly: true },
                          { key: "currentAssets" as const, label: "Current Assets" },
                          { key: "currentLiabilities" as const, label: "Current Liabilities" },
                          { key: "workingCapital" as const, label: "Working Capital", isReadOnly: true },
                          { key: "totalRevenue" as const, label: "Total Revenue / Turnover" },
                          { key: "profitBeforeTax" as const, label: "Profit Before Tax" },
                        ].map((row) => (
                          <tr key={row.key} className={row.isReadOnly ? "bg-slate-50/80 font-bold" : ""}>
                            <td className="p-2 text-slate-700">{row.label}</td>
                            {FINANCIAL_YEARS.map((y) => {
                              const val = formData.financialStatements?.[y]?.[row.key];
                              return (
                                <td key={y} className="p-2 text-right font-mono text-slate-800">
                                  {val !== null && val !== undefined ? Number(val).toLocaleString("en-US") : "—"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Loan Repayments */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="font-semibold text-slate-700">Total Loan Repayments Due (01 Dec 2026 – 01 Dec 2028):</span>
                    <span className="font-bold text-blue-900 font-mono text-xs">
                      {formData.loanCommitments?.twoYearRepaymentsDue2026To2028 !== null && formData.loanCommitments?.twoYearRepaymentsDue2026To2028 !== undefined
                        ? `${Number(formData.loanCommitments.twoYearRepaymentsDue2026To2028).toLocaleString("en-US")} LKR`
                        : "0 LKR"}
                    </span>
                  </div>
                </div>

                {/* Section 7: Current Work Commitments */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-blue-900" />
                    <span>Section 7: Current Work Commitments</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500 font-medium text-[11px] block">Currently Has Ongoing Contracts:</span>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                        formData.hasOngoingContracts === "Yes" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"
                      }`}>
                        {formData.hasOngoingContracts || "No"}
                      </span>
                    </div>
                    {formData.hasOngoingContracts === "Yes" && (
                      <div className="text-left sm:text-right">
                        <span className="text-slate-500 font-medium text-[11px] block">Total Outstanding Value:</span>
                        <span className="font-black text-blue-900 font-mono text-sm">
                          {formData.totalOutstandingValueLkrMillion !== null && formData.totalOutstandingValueLkrMillion !== undefined
                            ? `${Number(formData.totalOutstandingValueLkrMillion).toLocaleString("en-US")} LKR`
                            : "0 LKR"}
                        </span>
                      </div>
                    )}
                  </div>

                  {formData.hasOngoingContracts === "Yes" && (formData.ongoingContracts || []).some((c) => c && c.contractName) && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 mt-2">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2 w-10">#</th>
                            <th className="p-2">Name of Contract</th>
                            <th className="p-2">Contract No</th>
                            <th className="p-2">Employer&apos;s Name</th>
                            <th className="p-2 text-right">Value (LKR)</th>
                            <th className="p-2">Est. Completion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {(formData.ongoingContracts || []).filter((c) => c && (c.contractName || c.contractNo)).map((c, i) => (
                            <tr key={i}>
                              <td className="p-2 font-bold text-slate-500">{i + 1}</td>
                              <td className="p-2 font-bold text-slate-900">{c.contractName || "—"}</td>
                              <td className="p-2 font-mono">{c.contractNo || "—"}</td>
                              <td className="p-2">{c.employerName || "—"}</td>
                              <td className="p-2 text-right font-mono font-bold text-blue-900">
                                {c.contractAmount !== null && c.contractAmount !== undefined ? Number(c.contractAmount).toLocaleString("en-US") : "—"}
                              </td>
                              <td className="p-2">{c.completionDate || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 9: Experience */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-blue-900" />
                    <span>Section 9: Experience</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium text-[11px] block">General Construction Experience:</span>
                    <span className="font-bold text-slate-900 text-xs">{formData.generalExperience || "N/A"}</span>
                  </div>
                </div>

                {/* Section 10: Similar Work Experience */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-blue-900" />
                    <span>Section 10: Similar Work Experience (Highest Value Contracts)</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2 w-10">#</th>
                          <th className="p-2">Contract Name</th>
                          <th className="p-2">Type</th>
                          <th className="p-2 text-right">Amount (LKR) (Highest to Lowest)</th>
                          <th className="p-2">Start Date</th>
                          <th className="p-2">Completion Date</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {(formData.similarWorks || []).map((w, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-slate-500">{i + 1}</td>
                            <td className="p-2 font-bold text-slate-900">{w.contractName || "—"}</td>
                            <td className="p-2">{w.contractType || "—"}</td>
                            <td className="p-2 text-right font-mono font-bold text-blue-900">
                              {w.contractAmount !== null && w.contractAmount !== undefined ? Number(w.contractAmount).toLocaleString("en-US") : "—"}
                            </td>
                            <td className="p-2">{w.startDate || "—"}</td>
                            <td className="p-2">{w.completionDate || "—"}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                                {w.completionStatus || "—"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* SUPPLIER SPECIFIC SECTION */}
            {formData.willParticipate === "Yes" && formData.participantCategory === "Supplier" && formData.supplierDetails && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-purple-950 uppercase tracking-wide text-[11px]">
                  <Truck className="w-3.5 h-3.5 text-purple-900" />
                  <span>Material Supplier Capacity &amp; Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 font-medium text-[11px] block">Company Name:</span>
                    <span className="font-bold text-slate-900 text-xs">{formData.supplierDetails.companyName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium text-[11px] block">Province &amp; District:</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {[formData.supplierDetails.province, formData.supplierDetails.district].filter(Boolean).join(" • ") || "N/A"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 font-medium text-[11px] block">Plant / Production Facility Location:</span>
                    <span className="text-slate-800 text-xs">{formData.supplierDetails.locationAddress || "N/A"}</span>
                  </div>
                </div>

                {formData.supplierDetails.materialsSupplied && formData.supplierDetails.materialsSupplied.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-slate-500 font-medium text-[11px] block">Supplied Materials &amp; Annual Capacity:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formData.supplierDetails.materialsSupplied.map((mat) => {
                        const cap = formData.supplierDetails?.supplyCapacities?.[mat];
                        return (
                          <div key={mat} className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{mat}</span>
                            <span className="font-bold text-purple-950 font-mono text-xs">
                              {cap?.quantity ? `${cap.quantity} ${cap.unit}` : "Capacity not specified"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 11: Matters for Discussion */}
            {formData.willParticipate === "Yes" && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-blue-950 uppercase tracking-wide text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-900" />
                  <span>Section 11: Matters for Discussion at the Workshop</span>
                </div>
                {(() => {
                  const matters = (formData.mattersForDiscussionList || [])
                    .map((m) => m.trim())
                    .filter(Boolean);
                  if (matters.length === 0 && !formData.mattersForDiscussion?.trim()) {
                    return (
                      <p className="text-slate-500 italic font-medium leading-relaxed text-xs">
                        No specific matters or concerns submitted.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2 pt-0.5">
                      {matters.length > 0 ? (
                        matters.map((m, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                          >
                            <span className="font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded text-[10px] shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="text-slate-800 leading-relaxed font-medium">
                              {m}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-line text-xs">
                          {formData.mattersForDiscussion}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Attestation & Declaration */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-950 uppercase text-[11px]">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Authorized Representative Declaration</span>
              </div>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                I hereby confirm that all information provided in this questionnaire filing is true, accurate, and complete to the best of my knowledge, and submitted on behalf of the registered organization for the Road Development Authority Inclusive Connectivity and Development Project (ICDP).
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:px-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-colors min-h-[42px]"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Modify / Edit Details</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-colors min-h-[42px]"
                title="Print Review Sheet"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Review</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitFinal}
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-900/20 transition-all disabled:opacity-60 min-h-[42px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Registration...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Confirm &amp; Submit Directly</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
