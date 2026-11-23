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
  Scale,
  Eye,
  ArrowUpDown,
  AlertCircle,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { evaluateConditionalRule } from "@/components/dynamic-form/DynamicFormRenderer";
import {
  validateQuestionnaireSubmission,
  isValidSriLankanPhone,
  isValidEmailAddress,
} from "@/lib/questionnaire-validator";
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
  } catch { }
}

function removeBrowserDraft(tokenOrRef: string) {
  if (typeof window === "undefined") return;
  try {
    const remaining = getBrowserSavedDrafts().filter(
      (d) => d.token !== tokenOrRef && d.reference !== tokenOrRef
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  } catch { }
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
    hasRdaOrIcdpExperience: "",
    rdaIcdpExperienceType: "",
    rdaIcdpProjectDetails: "",
    similarWorks: createEmptySimilarWorks(),
    historicalLitigationType: "",
    historicalContractIdentification: "",
    historicalEmployerName: "",
    historicalReason: "",
    historicalMatterDispute: "",
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

// Field navigation sequence matching physical questionnaire layout
const QUESTIONNAIRE_FIELD_ORDER = [
  "organizationName",
  "contactNumber",
  "email",
  "willParticipate",
  "participantCategory",
  // Section 3: Participants
  "participant1.fullName",
  "participant1.mobileNumber",
  "participant1.email",
  "participant1.designation",
  "participant2.fullName",
  "participant2.mobileNumber",
  "participant2.email",
  "participant2.designation",
  // Section 4: Supplier Details
  "supplierDetails.companyName",
  "supplierDetails.materialsSupplied",
  "supplierDetails.materialsOther",
  "supplierDetails.locationAddress",
  "supplierDetails.province",
  "supplierDetails.district",
  // Section 4: Contractor Details
  "ictadRegistrationNumber",
  "areasOfSpecialty",
  "specialtyOther",
  // Section 7 & 8: Work Commitments
  "hasOngoingContracts",
  "totalOutstandingValueLkrMillion",
  // Section 9: Experience
  "generalExperience",
  "hasRdaOrIcdpExperience",
  "rdaIcdpExperienceType",
  // Section 10: Similar Works
  "similarWorks.0.contractName",
  "similarWorks.0.contractType",
  "similarWorks.0.contractAmount",
  "similarWorks.0.startDate",
  "similarWorks.0.completionDate",
  "similarWorks.0.completionStatus",
  "similarWorks.1.contractType",
  "similarWorks.1.contractAmount",
  "similarWorks.2.contractType",
  "similarWorks.2.contractAmount",
  "similarWorks.descending",
  "historicalLitigationType",
  "historicalContractIdentification",
  "historicalEmployerName",
  "historicalReason",
  "historicalMatterDispute",
];

const getDomIdForField = (fieldKey: string): string => {
  if (fieldKey.startsWith("specialtyGrades.")) {
    const spec = fieldKey.replace("specialtyGrades.", "");
    return `input-specialtyGrades-${spec.replace(/[^a-zA-Z0-9]/g, "_")}`;
  }
  if (fieldKey.startsWith("dynamic.")) {
    return `input-dynamic-${fieldKey.replace("dynamic.", "")}`;
  }
  if (fieldKey === "similarWorks.descending") {
    return "section-10-container";
  }
  return `input-${fieldKey.replace(/\./g, "-")}`;
};

function mapServerErrorMessageToField(message: string): { key: string; message: string } | null {
  if (!message) return null;
  const clean = message.replace(/^Incomplete questionnaire:\s*/i, "").trim();

  if (/organization/i.test(clean)) return { key: "organizationName", message: clean };
  if (/contact (telephone|number)/i.test(clean)) return { key: "contactNumber", message: clean };
  if (/email/i.test(clean)) return { key: "email", message: clean };
  if (/participating in the workshop/i.test(clean)) return { key: "willParticipate", message: clean };
  if (/participant category/i.test(clean)) return { key: "participantCategory", message: clean };
  if (/participant.*full name/i.test(clean)) return { key: "participant1.fullName", message: clean };
  if (/participant.*mobile/i.test(clean)) return { key: "participant1.mobileNumber", message: clean };
  if (/participant.*designation/i.test(clean)) return { key: "participant1.designation", message: clean };
  if (/supplier.*company/i.test(clean)) return { key: "supplierDetails.companyName", message: clean };
  if (/material.*suppl/i.test(clean)) return { key: "supplierDetails.materialsSupplied", message: clean };
  if (/location address/i.test(clean)) return { key: "supplierDetails.locationAddress", message: clean };
  if (/province/i.test(clean)) return { key: "supplierDetails.province", message: clean };
  if (/district/i.test(clean)) return { key: "supplierDetails.district", message: clean };
  if (/ictad/i.test(clean) || /registration number/i.test(clean)) return { key: "ictadRegistrationNumber", message: clean };
  const cidaGradeMatch = clean.match(/CIDA grade for (.+?)\.?$/i);
  if (cidaGradeMatch) {
    const spec = cidaGradeMatch[1].trim();
    return { key: `specialtyGrades.${spec}`, message: clean };
  }
  if (/CIDA grade/i.test(clean)) return { key: "cidaGrade", message: clean };
  if (/area.*specialty/i.test(clean)) return { key: "areasOfSpecialty", message: clean };
  if (/general experience/i.test(clean)) return { key: "generalExperience", message: clean };
  if (/rda.*icdp|icdp.*rda|worked in the past/i.test(clean)) return { key: "hasRdaOrIcdpExperience", message: clean };
  if (/contract 1/i.test(clean) || /similar work/i.test(clean)) return { key: "similarWorks.0.contractName", message: clean };
  if (/descending order/i.test(clean) || /cannot exceed/i.test(clean)) return { key: "similarWorks.descending", message: clean };
  if (/contract identification/i.test(clean)) return { key: "historicalContractIdentification", message: clean };
  if (/name of employer|employer/i.test(clean)) return { key: "historicalEmployerName", message: clean };
  if (/reason for (non|pending|past|litigation)/i.test(clean)) return { key: "historicalReason", message: clean };
  if (/matter (in )?dispute/i.test(clean)) return { key: "historicalMatterDispute", message: clean };
  if (/non[- ]performing|pending litigation|litigation history/i.test(clean)) return { key: "historicalLitigationType", message: clean };

  return null;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  // Draft session credentials & identifiers
  const [currentDraftToken, setCurrentDraftToken] = useState<string>(tokenFromUrl);
  const [currentReference, setCurrentReference] = useState<string>("");
  const [savedDraftsList, setSavedDraftsList] = useState<BrowserSavedDraft[]>([]);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [hasCheckedDrafts, setHasCheckedDrafts] = useState(false);

  // Field-level validation state & Declaration consent
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [modalDeclarationError, setModalDeclarationError] = useState<string | null>(null);

  const clearFieldError = (fieldKey: string) => {
    setFieldErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });
  };

  const getNextErrorFieldKey = (errorsMap?: Record<string, string>): string | null => {
    const activeErrors = errorsMap || fieldErrors;
    const keys = Object.keys(activeErrors);
    if (keys.length === 0) return null;

    for (const key of QUESTIONNAIRE_FIELD_ORDER) {
      if (activeErrors[key]) return key;
    }
    for (const key of keys) {
      if (key.startsWith("specialtyGrades.")) return key;
    }
    for (const key of keys) {
      if (key.startsWith("dynamic.")) return key;
    }
    return keys[0] || null;
  };

  const scrollToAndFocusField = (fieldKey: string) => {
    if (typeof window === "undefined") return;
    const domId = getDomIdForField(fieldKey);
    let target = document.getElementById(domId);
    if (!target) {
      target =
        document.querySelector(`[name="${fieldKey}"]`) ||
        document.querySelector(`[data-field="${fieldKey}"]`) ||
        document.querySelector(`#${fieldKey}`);
    }

    if (target) {
      const rect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop - 120; // 120px offset to clear sticky headers

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: "smooth",
      });

      setTimeout(() => {
        const focusable = target!.matches("input, select, textarea, button, [tabindex]")
          ? (target as HTMLElement)
          : target!.querySelector<HTMLElement>("input:not([type='hidden']), select, textarea, button, [tabindex='0']");

        if (focusable) {
          focusable.focus({ preventScroll: true });
        }
      }, 350);
    }
  };

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

  const renderParticipantField = (
    partNum: 1 | 2,
    field: "fullName" | "mobileNumber" | "email" | "designation",
    label: string,
    placeholder: string,
    isRequired: boolean,
    type: "text" | "tel" | "email" = "text"
  ) => {
    const errorKey = `participant${partNum}.${field}`;
    const domId = `input-participant${partNum}-${field}`;
    const errorMsg = fieldErrors[errorKey];
    const participantObj = partNum === 1 ? formData.participant1 : formData.participant2;
    const value = participantObj?.[field] || "";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [`participant${partNum}`]: {
          ...(partNum === 1
            ? prev.participant1 || { fullName: "", mobileNumber: "", email: "", designation: "" }
            : prev.participant2 || { fullName: "", mobileNumber: "", email: "", designation: "" }),
          [field]: newVal,
        },
      }));
      if (fieldErrors[errorKey]) {
        clearFieldError(errorKey);
      }
    };

    return (
      <div key={domId}>
        <label htmlFor={domId} className="block font-semibold text-slate-700 mb-1">
          {label} {isRequired && <span className="text-rose-500">*</span>}
        </label>
        <input
          id={domId}
          type={type}
          required={isRequired}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          aria-invalid={Boolean(errorMsg)}
          aria-describedby={errorMsg ? `error-${errorKey}` : undefined}
          className={`w-full p-2.5 rounded-lg text-slate-900 text-xs focus:outline-none transition-all ${type === "tel" ? "font-mono" : ""
            } ${errorMsg
              ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
              : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
            }`}
        />
        {errorMsg && (
          <div
            id={`error-${errorKey}`}
            role="alert"
            className="flex items-start gap-1 mt-1 text-[11px] font-semibold text-rose-600 animate-fadeIn"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    );
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
    confirmationEmailSentTo?: string | null;
    emailStatus?: "not_provided" | "pending" | "sent" | "failed" | string;
    emailSentTo?: string | null;
    emailMessageId?: string | null;
    emailError?: string | null;
    emailProvider?: string | null;
  } | null>(null);
  const [confirmationEmail, setConfirmationEmail] = useState<string>("");
  const [confirmationEmailError, setConfirmationEmailError] = useState<string | null>(null);
  const [publishedQuestionnaire, setPublishedQuestionnaire] = useState<any>(null);

  // Poll for verified Resend email dispatch when status is pending
  useEffect(() => {
    if (!submissionSuccess || submissionSuccess.emailStatus !== "pending") return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 12) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await fetch(`/api/public/submit?reference=${encodeURIComponent(submissionSuccess.reference)}`);
        const data = await res.json();
        if (data.success && data.emailStatus && data.emailStatus !== "pending") {
          setSubmissionSuccess((prev) =>
            prev
              ? {
                  ...prev,
                  emailStatus: data.emailStatus,
                  emailSentTo: data.emailSentTo || prev.emailSentTo,
                  emailMessageId: data.emailMessageId || prev.emailMessageId,
                  emailError: data.emailError || prev.emailError,
                  emailProvider: data.emailProvider || prev.emailProvider,
                }
              : null
          );
          clearInterval(interval);
        }
      } catch {
        // silent retry
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [submissionSuccess?.reference, submissionSuccess?.emailStatus]);

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
    setHasCheckedDrafts(true);
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
      .catch(() => { });
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

    const errorKey = `dynamic.${q.id}`;
    const domId = `input-dynamic-${q.id}`;
    const errorMsg = fieldErrors[errorKey];

    const val = (formData as any)[q.id] ?? (formData as any)[q.code] ?? "";
    const setVal = (newVal: any) => {
      setFormData((prev: any) => ({
        ...prev,
        [q.id]: newVal,
      }));
      if (fieldErrors[errorKey]) {
        clearFieldError(errorKey);
      }
    };

    return (
      <div key={q.id} className="space-y-1.5 pt-2">
        <label htmlFor={domId} className="block font-semibold text-slate-700">
          <span className="text-blue-900 font-mono text-xs mr-1 font-bold">[{q.code}]</span>
          <span>{q.text}</span>
          {q.isRequired && <span className="text-rose-500 font-bold ml-1">*</span>}
        </label>
        {q.description && <p className="text-xs text-slate-500">{q.description}</p>}

        {q.fieldType === "long_text" ? (
          <textarea
            id={domId}
            rows={3}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={q.placeholder || ""}
            aria-invalid={Boolean(errorMsg)}
            aria-describedby={errorMsg ? `error-${errorKey}` : undefined}
            className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none transition-all ${errorMsg
              ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
              : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
              }`}
          />
        ) : q.fieldType === "dropdown" ? (
          <select
            id={domId}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            aria-invalid={Boolean(errorMsg)}
            aria-describedby={errorMsg ? `error-${errorKey}` : undefined}
            className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none transition-all ${errorMsg
              ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
              : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
              }`}
          >
            <option value="">-- Select an option --</option>
            {(q.options || []).map((opt: any) => (
              <option key={opt.id || opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : q.fieldType === "radio" ? (
          <div
            id={domId}
            className={`space-y-2 p-2 rounded-xl transition-all ${errorMsg ? "bg-rose-50/30 border-2 border-rose-500" : ""
              }`}
          >
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
          <div
            id={domId}
            className={`flex gap-3 p-1 rounded-xl transition-all ${errorMsg ? "bg-rose-50/30 border-2 border-rose-500" : ""
              }`}
          >
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
            id={domId}
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
            aria-invalid={Boolean(errorMsg)}
            aria-describedby={errorMsg ? `error-${errorKey}` : undefined}
            className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none transition-all font-mono ${errorMsg
              ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
              : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
              }`}
          />
        )}
        {errorMsg && (
          <div
            id={`error-${errorKey}`}
            role="alert"
            className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
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
          specialtyGrades: q.specialtyGrades || {},
          specialtyGradesOther: q.specialtyGradesOther || {},
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
          hasRdaOrIcdpExperience: q.hasRdaOrIcdpExperience || "",
          rdaIcdpExperienceType: q.rdaIcdpExperienceType || "",
          rdaIcdpProjectDetails: q.rdaIcdpProjectDetails || "",
          similarWorks:
            Array.isArray(q.similarWorks) && q.similarWorks.length > 0
              ? q.similarWorks
              : createEmptySimilarWorks(),
          historicalLitigationType: q.historicalLitigationType || "",
          historicalContractIdentification: q.historicalContractIdentification || "",
          historicalEmployerName: q.historicalEmployerName || "",
          historicalReason: q.historicalReason || "",
          historicalMatterDispute: q.historicalMatterDispute || "",
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
            message: `Draft successfully saved! Permanent Reference: ${assignedRef || "Assigned"
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
      setSavedDraftsList(getBrowserSavedDrafts());
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
    setConfirmationEmail("");
    setConfirmationEmailError(null);
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

  const validateForm = (): { isValid: boolean; errors: Record<string, string>; firstErrorKey?: string } => {
    // 1. Core authoritative schema validation
    const valResult = validateQuestionnaireSubmission(formData);
    const errors: Record<string, string> = { ...valResult.errors };

    // 2. Unique ICTAD Registration Number check for contractors
    if (formData.participantCategory === "Contractor") {
      const reg = formData.ictadRegistrationNumber?.trim();
      if (!reg) {
        errors.ictadRegistrationNumber = "ICTAD registration number is required for contractors (e.g., C-12345).";
      } else if (regNumberError) {
        errors.ictadRegistrationNumber = regNumberError;
      }
    }

    // 3. Dynamic questions validation according to active published questionnaire
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
              errors[`dynamic.${q.id}`] = `${q.text} is required. Please provide the requested information.`;
            }
          }
        }
      }
    }

    const errorKeys = Object.keys(errors);
    const isValid = errorKeys.length === 0;
    const firstErrorKey = isValid ? undefined : (getNextErrorFieldKey(errors) || errorKeys[0]);

    return { isValid, errors, firstErrorKey };
  };

  const handleInitiateReview = () => {
    setFormAlert(null);

    const { isValid, errors, firstErrorKey } = validateForm();
    if (!isValid) {
      setFieldErrors(errors);
      if (firstErrorKey) {
        scrollToAndFocusField(firstErrorKey);
      }
      return;
    }

    setFieldErrors({});
    if (!confirmationEmail.trim()) {
      setConfirmationEmail(formData.email?.trim() || formData.participant1?.email?.trim() || "");
    }
    setConfirmationEmailError(null);
    setShowReviewModal(true);
  };

  const handleSubmitFinal = async () => {
    setLoading(true);
    setFormAlert(null);
    setModalDeclarationError(null);
    setConfirmationEmailError(null);

    // Confirmation Email validation
    const trimmedConfirmEmail = confirmationEmail.trim();
    if (!trimmedConfirmEmail) {
      setConfirmationEmailError("Please enter an email address to receive your official registration confirmation receipt.");
      setLoading(false);
      const emailInput = document.getElementById("input-confirmation-email");
      if (emailInput) {
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (!isValidEmailAddress(trimmedConfirmEmail)) {
      setConfirmationEmailError("Please enter a valid email address (e.g., name@company.com).");
      setLoading(false);
      const emailInput = document.getElementById("input-confirmation-email");
      if (emailInput) {
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Declaration consent check
    if (!declarationAccepted) {
      setModalDeclarationError("Please review and accept the official declaration before submitting.");
      setLoading(false);
      const declInput = document.getElementById("input-declaration-consent");
      if (declInput) declInput.focus();
      return;
    }

    const { isValid, errors, firstErrorKey } = validateForm();
    if (!isValid) {
      setShowReviewModal(false);
      setFieldErrors(errors);
      setLoading(false);
      if (firstErrorKey) {
        setTimeout(() => {
          scrollToAndFocusField(firstErrorKey);
        }, 100);
      }
      return;
    }

    try {
      const orgName = formData.organizationName.trim() || formData.supplierDetails?.companyName?.trim();
      const tokenToSubmit = currentDraftToken?.trim() || undefined;

      // Direct single-roundtrip final submission (eliminates unnecessary draft roundtrip & async-dispatches email)
      const subRes = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeToken: tokenToSubmit,
          questionnaireData: formData,
          data: formData,
          businessName: orgName || "RDA Participant",
          organizationName: orgName || "RDA Participant",
          registrationNumber: formData.ictadRegistrationNumber?.trim() || undefined,
          cidaGrade: formData.cidaGrade?.trim() || undefined,
          province: formData.supplierDetails?.province?.trim() || "Western Province",
          district: formData.supplierDetails?.district?.trim() || undefined,
          contactOfficer: {
            name: formData.participant1?.fullName?.trim() || "Authorized Representative",
            phone: formData.participant1?.mobileNumber?.trim() || formData.contactNumber?.trim() || "+94 11 000 0000",
            email: formData.participant1?.email?.trim() || formData.email?.trim() || "contact@rda.gov.lk",
          },
          confirmationEmail: trimmedConfirmEmail,
        }),
      });
      const subData = await subRes.json();

      if (subRes.ok && subData.success && subData.submission) {
        // Purge submitted draft from browser recovery storage
        if (tokenToSubmit) removeBrowserDraft(tokenToSubmit);
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
        const errorMsg = subData.message || "Submission rejected. Please check all required fields.";
        const mapped = mapServerErrorMessageToField(errorMsg);
        if (mapped) {
          setShowReviewModal(false);
          setFieldErrors((prev) => ({ ...prev, [mapped.key]: mapped.message }));
          setTimeout(() => {
            scrollToAndFocusField(mapped.key);
          }, 100);
        } else {
          setFormAlert({
            type: "error",
            message: errorMsg,
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
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
    clearFieldError("areasOfSpecialty");
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
    clearFieldError(`specialtyGrades.${spec}`);
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
    clearFieldError("supplierDetails.materialsSupplied");
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
    clearFieldError(`similarWorks.${index}.${field}`);
    clearFieldError("similarWorks.descending");
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
    clearFieldError("similarWorks.descending");
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

          {submissionSuccess.confirmationEmailSentTo && (
            submissionSuccess.emailStatus === "sent" ? (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-left flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-blue-950 block">Official Confirmation Email Dispatched</span>
                  <p className="text-blue-900/90 text-[11px] leading-relaxed">
                    An official acknowledgment receipt with reference number <strong>{submissionSuccess.reference}</strong> and workshop details (<strong>07 December 2026 at 9:00 AM</strong>) was verified and dispatched to <strong className="font-mono text-blue-950">{submissionSuccess.emailSentTo || submissionSuccess.confirmationEmailSentTo}</strong>.
                  </p>
                </div>
              </div>
            ) : submissionSuccess.emailStatus === "failed" ? (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-left flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-amber-950 block">Confirmation Email Delivery Notice</span>
                  <p className="text-amber-900/90 text-[11px] leading-relaxed">
                    Your registration has been securely filed with reference <strong>{submissionSuccess.reference}</strong>. Automated email to <strong className="font-mono text-amber-950">{submissionSuccess.confirmationEmailSentTo}</strong> could not be delivered{submissionSuccess.emailError ? ` (${submissionSuccess.emailError})` : ""}. Please retain your reference number or print your receipt below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-left flex items-start gap-3">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-xs">
                  <span className="font-bold text-blue-950 block">Dispatching Confirmation Email...</span>
                  <p className="text-blue-900/90 text-[11px] leading-relaxed">
                    Transmitting acknowledgment receipt for <strong>{submissionSuccess.reference}</strong> to <strong className="font-mono text-blue-950">{submissionSuccess.confirmationEmailSentTo}</strong>.
                  </p>
                </div>
              </div>
            )
          )}

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5 font-mono">
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-sans">Submission Reference:</span>
              <span className="font-bold text-blue-900">{submissionSuccess.reference}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-sans">Organization / Entity:</span>
              <span className="font-bold text-slate-800">{submissionSuccess.businessName}</span>
            </div>
            {submissionSuccess.confirmationEmailSentTo && (
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-sans">Confirmation Sent To:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {submissionSuccess.emailSentTo || submissionSuccess.confirmationEmailSentTo}
                  {submissionSuccess.emailStatus === "sent" ? (
                    <span className="ml-1.5 text-[10px] text-emerald-700 font-sans font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Dispatched</span>
                  ) : submissionSuccess.emailStatus === "failed" ? (
                    <span className="ml-1.5 text-[10px] text-amber-700 font-sans font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Not Dispatched</span>
                  ) : (
                    <span className="ml-1.5 text-[10px] text-blue-700 font-sans font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">Sending...</span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-sans">Workshop Schedule:</span>
              <span className="text-slate-700 font-bold font-sans">07 December 2026 at 9:00 AM</span>
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
                setConfirmationEmail("");
                setConfirmationEmailError(null);
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
                  hasRdaOrIcdpExperience: "",
                  rdaIcdpExperienceType: "",
                  rdaIcdpProjectDetails: "",
                  similarWorks: createEmptySimilarWorks(),
                  historicalLitigationType: "",
                  historicalContractIdentification: "",
                  historicalEmployerName: "",
                  historicalReason: "",
                  historicalMatterDispute: "",
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
    <div className="w-full max-w-4xl mx-auto my-4 sm:my-8 lg:my-12 px-3 sm:px-4 lg:px-6 space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#07162c] via-[#0b1f3a] to-[#0f294d] text-white p-4 pl-3 sm:p-6 sm:pl-4 lg:p-7 lg:pl-4.5 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden">
        {/* Left Vibrant Green Accent Bar (Snug to letters) */}
        <div className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.25 bg-gradient-to-b from-emerald-400 via-green-400 to-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.65)] z-20" />

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

            {/* 3. Subtitle: Highlighted Organized by Inclusive Connectivity and Development Project (ICDP) */}
            <p className="text-[11.5px] min-[360px]:text-xs text-slate-200 leading-relaxed">
              <span className="text-slate-300 font-normal">Organized by </span>
              <span className="text-amber-300 font-bold tracking-wide">Inclusive Connectivity and Development Project (ICDP)</span>
            </p>

            {/* 4. Bottom Row: 07 December 2026 and logo (closer to the subtitle) */}
            <div className="pt-0.5 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 min-[360px]:px-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 text-[10px] min-[360px]:text-xs font-semibold text-amber-300 shadow-sm shrink-0">
                <Calendar className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 text-amber-400 shrink-0" />
                <span>07 December 2026</span>
              </div>

              {/* Ministry & RDA Official Logos on mobile bottom-right */}
              <div className="bg-white rounded-xl px-2 py-0.5 min-[380px]:py-1 shadow-md border border-white/40 shrink-0 flex flex-col items-center gap-0.5 max-w-[115px] min-[380px]:max-w-[130px]">
                <img
                  src="/ministry-logo.png"
                  alt="Ministry of Transport, Highways and Urban Development"
                  className="h-3 min-[380px]:h-3.5 w-auto object-contain"
                />
                <div className="w-full border-t border-slate-200" />
                <img
                  src="/rda-logo.png"
                  alt="Road Development Authority Sri Lanka"
                  className="h-4 min-[380px]:h-4.5 w-auto object-contain"
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
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                <span className="text-slate-300 font-normal">Organized by </span>
                <span className="text-amber-300 font-bold tracking-wide">Inclusive Connectivity and Development Project (ICDP)</span>
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
          className="w-full p-3.5 sm:p-4 flex items-start sm:items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-900 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <Info className="w-4 h-4 text-blue-900" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 block text-xs sm:text-sm leading-snug">
                About the Workshop &amp; Registration Instructions
              </span>
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 mt-1">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Calendar className="w-3 h-3 text-blue-900 shrink-0" />
                  <span>07 Dec 2026</span>
                  <span className="font-normal text-slate-500">(9.00 AM)</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                  <Clock className="w-3 h-3 text-rose-600 shrink-0" />
                  <span>Deadline: 05 Dec 2026</span>
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 sm:mt-0">
            <span className="hidden md:inline font-medium">{showWorkshopInfo ? "Hide Details" : "View Details"}</span>
            <div className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
              {showWorkshopInfo ? (
                <ChevronUp className="w-4 h-4 text-slate-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-700" />
              )}
            </div>
          </div>
        </button>

        {showWorkshopInfo && (
          <div className="p-3.5 sm:p-6 space-y-4 border-t border-slate-200 bg-white leading-relaxed text-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
              {/* Workshop Overview Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-900" />
                  <span>Workshop Overview</span>
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong className="font-bold text-blue-900">
                    Organized by Inclusive Connectivity and Development Project (ICDP)
                  </strong>
                  , Road Development Authority (RDA). This Early Market Engagement Workshop engages prospective contractors, materials suppliers, and institutional stakeholders in the development and procurement framework.
                </p>
              </div>

              {/* Key Milestones & Contacts Card */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-900" />
                  <span>Key Milestones &amp; Contacts</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-slate-800 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                      <strong>Date:</strong> 07 December 2026 (9.00 AM)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-700 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <strong>Deadline:</strong> 05 December 2026
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-slate-200/70 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="font-semibold text-slate-800">General:</span>
                      <a href="tel:0112865766" className="text-blue-900 font-bold hover:underline">
                        011 286 5766
                      </a>
                      <span className="text-slate-300">&bull;</span>
                      <span className="font-semibold text-slate-800">Inquiries:</span>
                      <a href="tel:0706970408" className="text-blue-900 font-bold hover:underline">
                        070 697 0408
                      </a>
                      <span className="text-slate-500 text-[11px]">(Thilina Tharinda)</span>
                    </div>

                    {/* Mr. Indunil Madhusanka Dedicated Contact Box */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1 my-1">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                        <Users className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                        <span>Mr. Indunil Madhusanka</span>
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs pl-5">
                        <a href="tel:0712863433" className="text-blue-900 hover:underline font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-700" />
                          <span>071 286 3433</span>
                        </a>
                        <span className="text-slate-300 hidden sm:inline">&bull;</span>
                        <a href="mailto:amindunil@gmail.com" className="text-blue-900 hover:underline font-medium flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-700" />
                          <span>amindunil@gmail.com</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span className="font-semibold text-slate-800">Official Registration Email:</span>
                      <a
                        href="mailto:wbicdpbid@gmail.com"
                        className="text-blue-900 font-bold hover:underline"
                      >
                        wbicdpbid@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conditional Flow: Draft Check & Recovery */}
      {!hasCheckedDrafts ? (
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200 p-8 flex flex-col items-center justify-center gap-3 text-slate-500 shadow-sm min-h-[140px]">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-900" />
          <span className="text-xs font-semibold text-slate-600">Checking for saved registration drafts...</span>
        </div>
      ) : showRecoveryPrompt && savedDraftsList.length > 0 ? (
        /* Scenario A: Previous Draft Exists - Show Draft Recovery, hide top start button and questionnaire */
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
          {/* Prominent Full-Width Start Registration CTA Button */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => {
                const target = document.getElementById("registration-form-start") || document.getElementById("section-1");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0b1f3a] via-[#12335f] to-[#0b1f3a] hover:from-[#0d2749] hover:to-[#0d2749] text-white font-extrabold text-xs sm:text-base shadow-lg hover:shadow-xl border border-white/15 flex items-center justify-center gap-2 sm:gap-2.5 transition-all group active:scale-[0.99] cursor-pointer min-h-[46px]"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
              <span>Start Registration</span>
              <span className="hidden min-[380px]:inline">&bull; Fill Questionnaire</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>
          </div>

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

          <div id="registration-form-start" className="space-y-6 scroll-mt-6">
            {/* Global Error Summary Banner when validation errors exist */}
            {Object.keys(fieldErrors).length > 0 && (
              <div
                role="alert"
                className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-xs sm:text-sm text-rose-900">
                      Validation Required ({Object.keys(fieldErrors).length} {Object.keys(fieldErrors).length === 1 ? "field needs" : "fields need"} attention)
                    </p>
                    <p className="text-xs text-rose-700 mt-0.5">
                      Please correct the highlighted inputs below before proceeding.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const firstKey = getNextErrorFieldKey();
                    if (firstKey) scrollToAndFocusField(firstKey);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <span>Jump to Next Error</span>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {formAlert && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${formAlert.type === "success"
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
                    <label htmlFor="input-organizationName" className="block font-semibold text-slate-700 mb-1">
                      Name of your Organization / Company / Institution *
                    </label>
                    <input
                      id="input-organizationName"
                      type="text"
                      required
                      value={formData.organizationName}
                      onChange={(e) => {
                        setFormData({ ...formData, organizationName: e.target.value });
                        if (fieldErrors.organizationName) clearFieldError("organizationName");
                      }}
                      placeholder="e.g. State Engineering Corporation / ABC Constructions Ltd"
                      aria-invalid={Boolean(fieldErrors.organizationName)}
                      aria-describedby={fieldErrors.organizationName ? "error-organizationName" : undefined}
                      className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none transition-all ${fieldErrors.organizationName
                        ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                        }`}
                    />
                    {fieldErrors.organizationName && (
                      <div id="error-organizationName" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <span>{fieldErrors.organizationName}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="input-contactNumber" className="block font-semibold text-slate-700 mb-1">
                        Contact number *
                      </label>
                      <input
                        id="input-contactNumber"
                        type="tel"
                        required
                        value={formData.contactNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, contactNumber: e.target.value });
                          if (fieldErrors.contactNumber) clearFieldError("contactNumber");
                        }}
                        placeholder="e.g. 0112123456 / 0771234567"
                        aria-invalid={Boolean(fieldErrors.contactNumber)}
                        aria-describedby={fieldErrors.contactNumber ? "error-contactNumber" : undefined}
                        className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none font-mono transition-all ${fieldErrors.contactNumber
                          ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                          }`}
                      />
                      {fieldErrors.contactNumber && (
                        <div id="error-contactNumber" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                          <span>{fieldErrors.contactNumber}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="input-email" className="block font-semibold text-slate-700 mb-1">
                        Email address *
                      </label>
                      <input
                        id="input-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (fieldErrors.email) clearFieldError("email");
                        }}
                        placeholder="e.g. info@company.lk"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? "error-email" : undefined}
                        className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none font-mono transition-all ${fieldErrors.email
                          ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                          : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                          }`}
                      />
                      {fieldErrors.email && (
                        <div id="error-email" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                          <span>{fieldErrors.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-2">
                      Will you be participating in the workshop on 07 December 2026? *
                    </label>
                    <div
                      id="input-willParticipate"
                      className={`flex items-center gap-4 sm:gap-6 flex-wrap p-2 rounded-xl transition-all ${fieldErrors.willParticipate ? "bg-rose-50/30 border-2 border-rose-500" : ""
                        }`}
                    >
                      <label className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2">
                        <input
                          type="radio"
                          name="willParticipate"
                          value="Yes"
                          checked={formData.willParticipate === "Yes"}
                          onChange={() => {
                            setFormData({ ...formData, willParticipate: "Yes" });
                            if (fieldErrors.willParticipate) clearFieldError("willParticipate");
                          }}
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
                          onChange={() => {
                            setFormData({ ...formData, willParticipate: "No" });
                            if (fieldErrors.willParticipate) clearFieldError("willParticipate");
                          }}
                          className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                        />
                        <span className="font-medium text-slate-800">No</span>
                      </label>
                    </div>
                    {fieldErrors.willParticipate && (
                      <div id="error-willParticipate" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <span>{fieldErrors.willParticipate}</span>
                      </div>
                    )}
                  </div>

                  {/* EARLY SUBMISSION PATH IF WILL NOT PARTICIPATE */}
                  {formData.willParticipate === "No" && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <p className="text-slate-600 leading-relaxed">
                        Thank you. Since you are not participating in the workshop on 07 December 2026, you may proceed to submit your basic organizational record immediately.
                      </p>

                      {formAlert && (
                        <div
                          className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${formAlert.type === "success"
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

                  {/* INITIAL PATH WHEN PARTICIPATION IS NOT YET SELECTED */}
                  {!formData.willParticipate && (
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => performDraftSave(false)}
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all min-h-[44px]"
                      >
                        <Save className="w-3.5 h-3.5 text-blue-900" />
                        <span>{currentReference ? `Save Draft (${currentReference})` : "Save as Draft"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleInitiateReview}
                        disabled={loading}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-60 min-h-[44px]"
                      >
                        {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                        <span>Review &amp; Submit Questionnaire Response</span>
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
                        <div
                          id="input-participantCategory"
                          className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-1.5 rounded-2xl transition-all ${fieldErrors.participantCategory ? "bg-rose-50/40 border-2 border-rose-500" : ""
                            }`}
                        >
                          {(["Contractor", "Supplier", "Government Officer"] as const).map((cat) => (
                            <label
                              key={cat}
                              className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all min-h-[44px] ${formData.participantCategory === cat
                                ? "bg-blue-50/80 border-blue-900 text-blue-950 font-bold"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                            >
                              <input
                                type="radio"
                                name="participantCategory"
                                value={cat}
                                checked={formData.participantCategory === cat}
                                onChange={() => {
                                  setFormData({ ...formData, participantCategory: cat });
                                  if (fieldErrors.participantCategory) clearFieldError("participantCategory");
                                }}
                                className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                              />
                              <span>{cat}</span>
                            </label>
                          ))}
                        </div>
                        {fieldErrors.participantCategory && (
                          <div id="error-participantCategory" role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                            <span>{fieldErrors.participantCategory}</span>
                          </div>
                        )}
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
                            {renderParticipantField(1, "fullName", "Full Name", "e.g. Eng. Sunil Perera", true)}
                            {renderParticipantField(1, "mobileNumber", "Mobile Number", "e.g. 0771234567", true, "tel")}
                            {renderParticipantField(1, "email", "Email Address", "e.g. sunil@example.com", true, "email")}
                            {renderParticipantField(1, "designation", "Designation", "e.g. Executive Engineer", true)}
                          </div>
                        </div>

                        {/* Participant 2 (Optional) */}
                        <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            Participant 2 (Optional)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {renderParticipantField(2, "fullName", "Full Name", "Second attendee name", false)}
                            {renderParticipantField(2, "mobileNumber", "Mobile Number", "e.g. 0719876543", false, "tel")}
                            {renderParticipantField(2, "email", "Email Address", "e.g. attendee2@example.com", false, "email")}
                            {renderParticipantField(2, "designation", "Designation", "e.g. Assistant Director", false)}
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
                            {renderParticipantField(1, "fullName", "Full Name", "e.g. K. L. Wickramasinghe", true)}
                            {renderParticipantField(1, "mobileNumber", "Mobile Number", "e.g. 0779876543", true, "tel")}
                            {renderParticipantField(1, "email", "Email Address", "e.g. supplier@example.com", true, "email")}
                            {renderParticipantField(1, "designation", "Designation", "e.g. Sales Director / General Manager", true)}
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
                          <div id="input-supplierDetails-materialsSupplied">
                            <label className="block font-semibold text-slate-700 mb-2">
                              Please select the material(s) you supply * (Multiple selection allowed)
                            </label>
                            <div
                              className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1.5 rounded-xl transition-all ${fieldErrors["supplierDetails.materialsSupplied"] ? "bg-rose-50/40 border-2 border-rose-500" : ""
                                }`}
                            >
                              {SUPPLIER_MATERIALS.map((mat) => {
                                const isChecked = (formData.supplierDetails?.materialsSupplied || []).includes(mat);
                                return (
                                  <label
                                    key={mat}
                                    className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${isChecked
                                      ? "bg-blue-50/80 border-blue-800 text-blue-950 font-semibold"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        handleSupplierMaterialToggle(mat);
                                        if (fieldErrors["supplierDetails.materialsSupplied"]) clearFieldError("supplierDetails.materialsSupplied");
                                      }}
                                      className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800"
                                    />
                                    <span>{mat}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {fieldErrors["supplierDetails.materialsSupplied"] && (
                              <div id="error-supplierDetails-materialsSupplied" role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors["supplierDetails.materialsSupplied"]}</span>
                              </div>
                            )}

                            {(formData.supplierDetails?.materialsSupplied || []).includes("Other") && (
                              <div id="input-supplierDetails-materialsOther" className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                                    Specify Other Supplied Material(s) *
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
                                        onChange={(e) => {
                                          handleUpdateSupplierMaterialOther(idx, e.target.value);
                                          if (fieldErrors["supplierDetails.materialsOther"]) clearFieldError("supplierDetails.materialsOther");
                                        }}
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
                                        className={`flex-1 p-2 bg-white rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 ${fieldErrors["supplierDetails.materialsOther"] && idx === 0
                                          ? "border-2 border-rose-500 focus:ring-rose-200"
                                          : "border border-slate-300 focus:ring-blue-800"
                                          }`}
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

                                {fieldErrors["supplierDetails.materialsOther"] && (
                                  <div id="error-supplierDetails-materialsOther" role="alert" className="flex items-start gap-1.5 mt-1 text-xs font-semibold text-rose-600 animate-fadeIn">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                    <span>{fieldErrors["supplierDetails.materialsOther"]}</span>
                                  </div>
                                )}

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
                            <label htmlFor="input-supplierDetails-companyName" className="block font-semibold text-slate-700 mb-1">
                              Company Name *
                            </label>
                            <input
                              id="input-supplierDetails-companyName"
                              type="text"
                              required
                              value={formData.supplierDetails?.companyName || ""}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  supplierDetails: {
                                    ...(formData.supplierDetails || createEmptySupplierDetails()),
                                    companyName: e.target.value,
                                  },
                                });
                                if (fieldErrors["supplierDetails.companyName"]) clearFieldError("supplierDetails.companyName");
                              }}
                              placeholder="e.g. Lanka Ready-Mix & Asphalt Products (Pvt) Ltd"
                              aria-invalid={Boolean(fieldErrors["supplierDetails.companyName"])}
                              aria-describedby={fieldErrors["supplierDetails.companyName"] ? "error-supplierDetails-companyName" : undefined}
                              className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none transition-all ${fieldErrors["supplierDetails.companyName"]
                                ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                }`}
                            />
                            {fieldErrors["supplierDetails.companyName"] && (
                              <div id="error-supplierDetails-companyName" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors["supplierDetails.companyName"]}</span>
                              </div>
                            )}
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
                            <label htmlFor="input-supplierDetails-locationAddress" className="block font-semibold text-slate-700 mb-1">
                              Location Address *
                            </label>
                            <textarea
                              id="input-supplierDetails-locationAddress"
                              rows={2}
                              required
                              value={formData.supplierDetails?.locationAddress || ""}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  supplierDetails: {
                                    ...(formData.supplierDetails || createEmptySupplierDetails()),
                                    locationAddress: e.target.value,
                                  },
                                });
                                if (fieldErrors["supplierDetails.locationAddress"]) clearFieldError("supplierDetails.locationAddress");
                              }}
                              placeholder="Physical address of manufacturing plant, quarry, or central distribution warehouse..."
                              aria-invalid={Boolean(fieldErrors["supplierDetails.locationAddress"])}
                              aria-describedby={fieldErrors["supplierDetails.locationAddress"] ? "error-supplierDetails-locationAddress" : undefined}
                              className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none transition-all ${fieldErrors["supplierDetails.locationAddress"]
                                ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                }`}
                            />
                            {fieldErrors["supplierDetails.locationAddress"] && (
                              <div id="error-supplierDetails-locationAddress" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors["supplierDetails.locationAddress"]}</span>
                              </div>
                            )}
                          </div>

                          {/* Province & District (Dependent Dropdown) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="input-supplierDetails-province" className="block font-semibold text-slate-700 mb-1">
                                Province *
                              </label>
                              <select
                                id="input-supplierDetails-province"
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
                                  if (fieldErrors["supplierDetails.province"]) clearFieldError("supplierDetails.province");
                                }}
                                aria-invalid={Boolean(fieldErrors["supplierDetails.province"])}
                                aria-describedby={fieldErrors["supplierDetails.province"] ? "error-supplierDetails-province" : undefined}
                                className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none font-medium transition-all ${fieldErrors["supplierDetails.province"]
                                  ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                  : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                  }`}
                              >
                                <option value="">— Select Province —</option>
                                {SRI_LANKA_PROVINCES.map((prov) => (
                                  <option key={prov} value={prov}>
                                    {prov}
                                  </option>
                                ))}
                              </select>
                              {fieldErrors["supplierDetails.province"] && (
                                <div id="error-supplierDetails-province" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                  <span>{fieldErrors["supplierDetails.province"]}</span>
                                </div>
                              )}
                            </div>

                            <div>
                              <label htmlFor="input-supplierDetails-district" className="block font-semibold text-slate-700 mb-1">
                                District *
                              </label>
                              <select
                                id="input-supplierDetails-district"
                                required
                                disabled={!formData.supplierDetails?.province}
                                value={formData.supplierDetails?.district || ""}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    supplierDetails: {
                                      ...(formData.supplierDetails || createEmptySupplierDetails()),
                                      district: e.target.value,
                                    },
                                  });
                                  if (fieldErrors["supplierDetails.district"]) clearFieldError("supplierDetails.district");
                                }}
                                aria-invalid={Boolean(fieldErrors["supplierDetails.district"])}
                                aria-describedby={fieldErrors["supplierDetails.district"] ? "error-supplierDetails-district" : undefined}
                                className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none font-medium disabled:opacity-50 transition-all ${fieldErrors["supplierDetails.district"]
                                  ? "bg-rose-50/30 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                  : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                  }`}
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
                              {fieldErrors["supplierDetails.district"] && (
                                <div id="error-supplierDetails-district" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                  <span>{fieldErrors["supplierDetails.district"]}</span>
                                </div>
                              )}
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
                              {renderParticipantField(1, "fullName", "Full Name", "e.g. Eng. Sunil Perera", true)}
                              {renderParticipantField(1, "mobileNumber", "Mobile Number", "e.g. 0771234567", true, "tel")}
                              {renderParticipantField(1, "email", "Email Address", "e.g. sunil@example.com", true, "email")}
                              {renderParticipantField(1, "designation", "Designation", "e.g. Managing Director", true)}
                            </div>
                          </div>

                          {/* Participant 2 (Optional) */}
                          <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                            <span className="text-[11px] font-bold text-slate-600 uppercase">
                              Participant 2 (Optional)
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                              {renderParticipantField(2, "fullName", "Full Name", "Second attendee name", false)}
                              {renderParticipantField(2, "mobileNumber", "Mobile Number", "e.g. 0719876543", false, "tel")}
                              {renderParticipantField(2, "email", "Email Address", "e.g. attendee2@example.com", false, "email")}
                              {renderParticipantField(2, "designation", "Designation", "e.g. Chief Engineer", false)}
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
                              <label htmlFor="input-ictadRegistrationNumber" className="block font-semibold text-slate-700">
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
                              id="input-ictadRegistrationNumber"
                              type="text"
                              required
                              value={formData.ictadRegistrationNumber}
                              onChange={(e) => {
                                setFormData({ ...formData, ictadRegistrationNumber: e.target.value });
                                if (regNumberError) setRegNumberError(null);
                                if (fieldErrors.ictadRegistrationNumber) clearFieldError("ictadRegistrationNumber");
                                setRegNumberAvailable(false);
                              }}
                              onBlur={() => checkRegNumberUniqueness(formData.ictadRegistrationNumber || "")}
                              placeholder="e.g. CIDA/12450"
                              aria-invalid={Boolean(regNumberError || fieldErrors.ictadRegistrationNumber)}
                              aria-describedby={
                                regNumberError
                                  ? "error-ictad-unique"
                                  : fieldErrors.ictadRegistrationNumber
                                    ? "error-ictadRegistrationNumber"
                                    : undefined
                              }
                              className={`w-full p-2.5 rounded-lg font-mono text-slate-900 focus:outline-none transition-all ${regNumberError || fieldErrors.ictadRegistrationNumber
                                ? "border-2 border-rose-500 bg-rose-50/50 focus:ring-2 focus:ring-rose-200 text-rose-950 font-bold"
                                : regNumberAvailable && formData.ictadRegistrationNumber?.trim()
                                  ? "border border-emerald-500 bg-emerald-50/20 focus:ring-emerald-600"
                                  : "border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                }`}
                            />
                            {regNumberError && (
                              <div id="error-ictad-unique" className="flex items-start gap-1.5 p-2 mt-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-sans">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <span className="font-medium">{regNumberError}</span>
                              </div>
                            )}
                            {!regNumberError && fieldErrors.ictadRegistrationNumber && (
                              <div id="error-ictadRegistrationNumber" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors.ictadRegistrationNumber}</span>
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

                            <div
                              id="input-areasOfSpecialty"
                              className={`p-1.5 rounded-2xl transition-all ${fieldErrors.areasOfSpecialty ? "bg-rose-50/40 border-2 border-rose-500" : ""
                                }`}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {SPECIALTY_OPTIONS.filter((s) => s !== "Other").map((spec) => {
                                  const isChecked = (formData.areasOfSpecialty || []).includes(spec);
                                  const gradeKey = `specialtyGrades.${spec}`;
                                  const hasGradeError = Boolean(fieldErrors[gradeKey]);
                                  return (
                                    <div
                                      key={spec}
                                      className={`p-3.5 rounded-xl border transition-all ${isChecked
                                        ? hasGradeError
                                          ? "bg-rose-50/40 border-2 border-rose-500 shadow-sm"
                                          : "bg-blue-50/70 border-2 border-blue-800 shadow-sm"
                                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {
                                              handleSpecialtyChange(spec);
                                              if (fieldErrors.areasOfSpecialty) clearFieldError("areasOfSpecialty");
                                            }}
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
                                          <label htmlFor={getDomIdForField(gradeKey)} className="block text-[11px] font-bold text-slate-700">
                                            CIDA Grading for {spec} *
                                          </label>
                                          <select
                                            id={getDomIdForField(gradeKey)}
                                            required
                                            value={formData.specialtyGrades?.[spec] || ""}
                                            onChange={(e) => {
                                              handleSpecialtyGradeChange(spec, e.target.value);
                                              if (fieldErrors[gradeKey]) clearFieldError(gradeKey);
                                            }}
                                            aria-invalid={hasGradeError}
                                            aria-describedby={hasGradeError ? `error-${getDomIdForField(gradeKey)}` : undefined}
                                            className={`w-full p-2 rounded-lg text-slate-900 text-xs font-semibold focus:outline-none transition-all ${hasGradeError
                                              ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                              : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800 shadow-sm"
                                              }`}
                                          >
                                            <option value="">— Select CIDA Grading for {spec} —</option>
                                            {CIDA_GRADES.map((g) => (
                                              <option key={g} value={g}>
                                                {g}
                                              </option>
                                            ))}
                                          </select>
                                          {hasGradeError && (
                                            <div id={`error-${getDomIdForField(gradeKey)}`} role="alert" className="flex items-start gap-1 mt-1 text-[11px] font-semibold text-rose-600 animate-fadeIn">
                                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                              <span>{fieldErrors[gradeKey]}</span>
                                            </div>
                                          )}
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
                                      id="input-specialtyOther"
                                      className={`p-3.5 rounded-xl border transition-all sm:col-span-2 ${isOtherChecked
                                        ? fieldErrors.specialtyOther
                                          ? "bg-rose-50/40 border-2 border-rose-500 shadow-sm"
                                          : "bg-blue-50/70 border-2 border-blue-800 shadow-sm"
                                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2.5 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isOtherChecked}
                                            onChange={() => {
                                              handleSpecialtyChange("Other");
                                              if (fieldErrors.areasOfSpecialty) clearFieldError("areasOfSpecialty");
                                              if (fieldErrors.specialtyOther) clearFieldError("specialtyOther");
                                            }}
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
                                                      onChange={(e) => {
                                                        handleUpdateSpecialtyOther(idx, e.target.value);
                                                        if (fieldErrors.specialtyOther) clearFieldError("specialtyOther");
                                                      }}
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

                                          {fieldErrors.specialtyOther && (
                                            <div id="error-specialtyOther" role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                              <span>{fieldErrors.specialtyOther}</span>
                                            </div>
                                          )}

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

                            {fieldErrors.areasOfSpecialty && (
                              <div id="error-areasOfSpecialty" role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors.areasOfSpecialty}</span>
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
                                            className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${readOnly
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
                                            className={`w-full p-2 border rounded font-mono text-xs text-right transition-colors ${readOnly
                                              ? `bg-slate-100/90 border-slate-300 font-semibold cursor-not-allowed select-none ${isNegative ? "text-rose-600 font-bold" : "text-slate-800"
                                              }`
                                              : `bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 ${isNegative ? "text-rose-600 font-bold" : ""
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
                            <div
                              id="input-hasOngoingContracts"
                              className={`flex items-center gap-4 sm:gap-6 flex-wrap p-2 rounded-xl transition-all ${fieldErrors.hasOngoingContracts ? "bg-rose-50/40 border-2 border-rose-500" : ""
                                }`}
                            >
                              <label className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2">
                                <input
                                  type="radio"
                                  name="hasOngoingContracts"
                                  value="Yes"
                                  checked={formData.hasOngoingContracts === "Yes"}
                                  onChange={() => {
                                    setFormData({ ...formData, hasOngoingContracts: "Yes" });
                                    if (fieldErrors.hasOngoingContracts) clearFieldError("hasOngoingContracts");
                                  }}
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
                                  onChange={() => {
                                    setFormData({ ...formData, hasOngoingContracts: "No" });
                                    if (fieldErrors.hasOngoingContracts) clearFieldError("hasOngoingContracts");
                                  }}
                                  className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                                />
                                <span className="font-medium text-slate-800">No</span>
                              </label>
                            </div>
                            {fieldErrors.hasOngoingContracts && (
                              <div id="error-hasOngoingContracts" role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors.hasOngoingContracts}</span>
                              </div>
                            )}
                          </div>

                          {/* SECTION 8: ONGOING WORKS (Only if hasOngoingContracts === "Yes") */}
                          {formData.hasOngoingContracts === "Yes" && (
                            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4">
                              <span className="text-[11px] font-bold text-blue-900 uppercase block">
                                Section 8: Ongoing Works Details
                              </span>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label htmlFor="input-totalOutstandingValueLkrMillion" className="block font-semibold text-slate-700">
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
                                    id="input-totalOutstandingValueLkrMillion"
                                    type="number"
                                    required
                                    value={formData.totalOutstandingValueLkrMillion ?? ""}
                                    onChange={(e) => {
                                      const val = e.target.value.trim();
                                      setFormData({
                                        ...formData,
                                        totalOutstandingValueLkrMillion: val === "" ? null : Number(val),
                                      });
                                      if (fieldErrors.totalOutstandingValueLkrMillion) clearFieldError("totalOutstandingValueLkrMillion");
                                    }}
                                    aria-invalid={Boolean(fieldErrors.totalOutstandingValueLkrMillion)}
                                    aria-describedby={fieldErrors.totalOutstandingValueLkrMillion ? "error-totalOutstandingValueLkrMillion" : undefined}
                                    className={`w-full sm:w-72 p-2.5 rounded-lg text-slate-900 focus:outline-none font-mono font-bold transition-all ${fieldErrors.totalOutstandingValueLkrMillion
                                      ? "bg-rose-50/40 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                      : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                      }`}
                                  />
                                  {formData.totalOutstandingValueLkrMillion !== null &&
                                    formData.totalOutstandingValueLkrMillion !== undefined && (
                                      <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100/70 px-2.5 py-1.5 rounded-lg border border-blue-200">
                                        = LKR {Number(formData.totalOutstandingValueLkrMillion).toLocaleString()}
                                      </span>
                                    )}
                                </div>
                                {fieldErrors.totalOutstandingValueLkrMillion && (
                                  <div id="error-totalOutstandingValueLkrMillion" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                    <span>{fieldErrors.totalOutstandingValueLkrMillion}</span>
                                  </div>
                                )}
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
                            <label htmlFor="input-generalExperience" className="block font-semibold text-slate-700 mb-1">
                              How many years of general experience does your company have in the construction industry? *
                            </label>
                            <select
                              id="input-generalExperience"
                              value={formData.generalExperience || ""}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  generalExperience: e.target.value as GeneralExperienceOption,
                                });
                                if (fieldErrors.generalExperience) clearFieldError("generalExperience");
                              }}
                              aria-invalid={Boolean(fieldErrors.generalExperience)}
                              aria-describedby={fieldErrors.generalExperience ? "error-generalExperience" : undefined}
                              className={`w-full p-2.5 rounded-lg text-slate-900 focus:outline-none font-medium transition-all ${fieldErrors.generalExperience
                                ? "bg-rose-50/40 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                }`}
                            >
                              <option value="">— Select General Construction Experience —</option>
                              {GENERAL_EXP_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                            {fieldErrors.generalExperience && (
                              <div id="error-generalExperience" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors.generalExperience}</span>
                              </div>
                            )}
                          </div>

                          {/* QUESTION: RDA or ICDP Experience */}
                          <div id="field-hasRdaOrIcdpExperience" className="space-y-2 pt-3 border-t border-slate-100">
                            <label className="block font-semibold text-slate-700">
                              Already have or have worked in the past with RDA or with ICDP? *
                            </label>

                            <div className="flex flex-wrap items-center gap-4 pt-0.5">
                              <label className="inline-flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="radio"
                                  name="hasRdaOrIcdpExperience"
                                  value="Yes"
                                  checked={formData.hasRdaOrIcdpExperience === "Yes"}
                                  onChange={() => {
                                    setFormData({
                                      ...formData,
                                      hasRdaOrIcdpExperience: "Yes",
                                      rdaIcdpExperienceType: formData.rdaIcdpExperienceType || "Both",
                                    });
                                    if (fieldErrors.hasRdaOrIcdpExperience) clearFieldError("hasRdaOrIcdpExperience");
                                  }}
                                  className="w-4 h-4 text-blue-900 border-slate-300 focus:ring-blue-800"
                                />
                                <span className="font-semibold text-slate-800 group-hover:text-blue-900">Yes</span>
                              </label>

                              <label className="inline-flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="radio"
                                  name="hasRdaOrIcdpExperience"
                                  value="No"
                                  checked={formData.hasRdaOrIcdpExperience === "No"}
                                  onChange={() => {
                                    setFormData({
                                      ...formData,
                                      hasRdaOrIcdpExperience: "No",
                                      rdaIcdpExperienceType: "",
                                      rdaIcdpProjectDetails: "",
                                    });
                                    if (fieldErrors.hasRdaOrIcdpExperience) clearFieldError("hasRdaOrIcdpExperience");
                                    if (fieldErrors.rdaIcdpExperienceType) clearFieldError("rdaIcdpExperienceType");
                                  }}
                                  className="w-4 h-4 text-blue-900 border-slate-300 focus:ring-blue-800"
                                />
                                <span className="font-semibold text-slate-800 group-hover:text-blue-900">No</span>
                              </label>
                            </div>

                            {fieldErrors.hasRdaOrIcdpExperience && (
                              <div id="error-hasRdaOrIcdpExperience" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                <span>{fieldErrors.hasRdaOrIcdpExperience}</span>
                              </div>
                            )}

                            {/* Entity Details when Yes */}
                            {formData.hasRdaOrIcdpExperience === "Yes" && (
                              <div className="p-3.5 mt-2 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-fadeIn">
                                <div>
                                  <label className="block font-semibold text-slate-700 mb-1.5">
                                    Please specify entity: *
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {[
                                      { id: "RDA", label: "Road Development Authority (RDA)" },
                                      { id: "ICDP", label: "Inclusive Connectivity & Development Project (ICDP)" },
                                      { id: "Both", label: "Both RDA & ICDP" },
                                    ].map((item) => (
                                      <label
                                        key={item.id}
                                        className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                                          formData.rdaIcdpExperienceType === item.id
                                            ? "bg-blue-50/90 border-blue-900 text-blue-950 font-bold shadow-sm"
                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                        }`}
                                      >
                                        <input
                                          type="radio"
                                          name="rdaIcdpExperienceType"
                                          value={item.id}
                                          checked={formData.rdaIcdpExperienceType === item.id}
                                          onChange={() => {
                                            setFormData({ ...formData, rdaIcdpExperienceType: item.id });
                                            if (fieldErrors.rdaIcdpExperienceType) clearFieldError("rdaIcdpExperienceType");
                                          }}
                                          className="w-3.5 h-3.5 text-blue-900 border-slate-300 focus:ring-blue-800"
                                        />
                                        <span className="text-[11px] leading-snug">{item.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                  {fieldErrors.rdaIcdpExperienceType && (
                                    <div id="error-rdaIcdpExperienceType" role="alert" className="flex items-start gap-1.5 mt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                                      <span>{fieldErrors.rdaIcdpExperienceType}</span>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <label htmlFor="input-rdaIcdpProjectDetails" className="block font-semibold text-slate-700 mb-1">
                                    Contract or project details with RDA / ICDP (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    id="input-rdaIcdpProjectDetails"
                                    value={formData.rdaIcdpProjectDetails || ""}
                                    onChange={(e) => setFormData({ ...formData, rdaIcdpProjectDetails: e.target.value })}
                                    placeholder="e.g., Contract Name, Contract Number, Year, or Province"
                                    className="w-full p-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 text-xs font-medium"
                                  />
                                </div>
                              </div>
                            )}
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

                        {fieldErrors["similarWorks.descending"] && (
                          <div id="error-similarWorks-descending" role="alert" className="p-3 bg-rose-50 border-2 border-rose-500 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 font-semibold animate-fadeIn">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <span>{fieldErrors["similarWorks.descending"]}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleSortSimilarWorksDescending();
                                clearFieldError("similarWorks.descending");
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-sm"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                              <span>Sort by Highest Value First</span>
                            </button>
                          </div>
                        )}

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

                                  const nameErr = fieldErrors[`similarWorks.${idx}.contractName`];
                                  const typeErr = fieldErrors[`similarWorks.${idx}.contractType`];
                                  const amtErr = fieldErrors[`similarWorks.${idx}.contractAmount`];
                                  const startErr = fieldErrors[`similarWorks.${idx}.startDate`];
                                  const endErr = fieldErrors[`similarWorks.${idx}.completionDate`];
                                  const statusErr = fieldErrors[`similarWorks.${idx}.completionStatus`];

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
                                      className={`hover:bg-slate-50/70 transition-colors ${isNA ? "bg-slate-50/40 opacity-70" : isOrderViolation || amtErr || nameErr ? "bg-rose-50/30" : ""
                                        }`}
                                    >
                                      <td className="p-3 text-center font-bold text-blue-900 bg-slate-50/50 align-top pt-4">
                                        #{idx + 1}
                                      </td>
                                      <td className="p-3 align-top space-y-1">
                                        <input
                                          id={`input-similarWorks-${idx}-contractName`}
                                          type="text"
                                          value={contract.contractName || ""}
                                          onChange={(e) => {
                                            handleContractChange(idx, "contractName", e.target.value);
                                            if (nameErr) clearFieldError(`similarWorks.${idx}.contractName`);
                                          }}
                                          placeholder={idx === 0 ? "Project Title or enter N/A *" : "Project Title"}
                                          aria-invalid={Boolean(nameErr)}
                                          className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${nameErr
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                            }`}
                                        />
                                        {nameErr && (
                                          <div role="alert" className="flex items-start gap-1 text-[11px] font-semibold text-rose-600 animate-fadeIn">
                                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-rose-500" />
                                            <span>{nameErr}</span>
                                          </div>
                                        )}
                                        {isNA && (
                                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold inline-block">
                                            Marked N/A
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 align-top space-y-1">
                                        <select
                                          id={`input-similarWorks-${idx}-contractType`}
                                          disabled={isNA}
                                          value={contract.contractType || ""}
                                          onChange={(e) => {
                                            handleContractChange(idx, "contractType", e.target.value);
                                            if (typeErr) clearFieldError(`similarWorks.${idx}.contractType`);
                                          }}
                                          aria-invalid={Boolean(typeErr)}
                                          className={`w-full p-2 rounded text-slate-900 focus:outline-none font-medium disabled:opacity-50 transition-all ${typeErr
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                            }`}
                                        >
                                          <option value="">— Select Type —</option>
                                          {CONTRACT_TYPE_OPTIONS.map((t) => (
                                            <option key={t} value={t}>
                                              {t}
                                            </option>
                                          ))}
                                        </select>
                                        {typeErr && (
                                          <div role="alert" className="flex items-start gap-1 text-[11px] font-semibold text-rose-600 animate-fadeIn">
                                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-rose-500" />
                                            <span>{typeErr}</span>
                                          </div>
                                        )}
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
                                          id={`input-similarWorks-${idx}-contractAmount`}
                                          type="number"
                                          disabled={isNA}
                                          value={contract.contractAmount ?? ""}
                                          onChange={(e) => {
                                            handleContractChange(idx, "contractAmount", e.target.value);
                                            if (amtErr) clearFieldError(`similarWorks.${idx}.contractAmount`);
                                          }}
                                          placeholder="Amount in LKR"
                                          aria-invalid={Boolean(amtErr || isOrderViolation)}
                                          className={`w-full p-2 border rounded text-slate-900 focus:outline-none focus:ring-2 font-mono disabled:opacity-50 transition-all ${amtErr || isOrderViolation
                                            ? "border-2 border-rose-500 bg-rose-50/60 focus:ring-rose-200 text-rose-900 font-bold"
                                            : "border-slate-300 bg-slate-50 focus:bg-white focus:ring-blue-800"
                                            }`}
                                        />
                                        {amtErr && (
                                          <div role="alert" className="flex items-start gap-1 text-[11px] font-semibold text-rose-600 animate-fadeIn">
                                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-rose-500" />
                                            <span>{amtErr}</span>
                                          </div>
                                        )}
                                        {!isNA && contract.contractAmount !== null && contract.contractAmount !== undefined && contract.contractAmount !== "" && (
                                          <span className="text-[10px] font-mono text-slate-600 block">
                                            = LKR {Number(contract.contractAmount).toLocaleString()}
                                          </span>
                                        )}
                                        {isOrderViolation && !amtErr && (
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
                                              id={`input-similarWorks-${idx}-startDate`}
                                              type="date"
                                              disabled={isNA}
                                              value={contract.startDate || ""}
                                              onChange={(e) => {
                                                handleContractChange(idx, "startDate", e.target.value);
                                                if (startErr) clearFieldError(`similarWorks.${idx}.startDate`);
                                              }}
                                              aria-invalid={Boolean(startErr)}
                                              className={`flex-1 p-1.5 rounded text-slate-900 text-[11px] focus:outline-none transition-all disabled:opacity-50 ${startErr
                                                ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                                : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                                }`}
                                            />
                                          </div>
                                          {startErr && (
                                            <div role="alert" className="flex items-start gap-1 text-[10px] font-semibold text-rose-600 animate-fadeIn">
                                              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-rose-500" />
                                              <span>{startErr}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400 w-9 shrink-0 font-medium">End:</span>
                                            <input
                                              id={`input-similarWorks-${idx}-completionDate`}
                                              type="date"
                                              disabled={isNA}
                                              value={contract.completionDate || ""}
                                              onChange={(e) => {
                                                handleContractChange(idx, "completionDate", e.target.value);
                                                if (endErr) clearFieldError(`similarWorks.${idx}.completionDate`);
                                              }}
                                              aria-invalid={Boolean(endErr)}
                                              className={`flex-1 p-1.5 rounded text-slate-900 text-[11px] focus:outline-none transition-all disabled:opacity-50 ${endErr
                                                ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                                : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                                }`}
                                            />
                                          </div>
                                          {endErr && (
                                            <div role="alert" className="flex items-start gap-1 text-[10px] font-semibold text-rose-600 animate-fadeIn">
                                              <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-rose-500" />
                                              <span>{endErr}</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-3 align-top">
                                        <select
                                          id={`input-similarWorks-${idx}-completionStatus`}
                                          disabled={isNA}
                                          value={contract.completionStatus || ""}
                                          onChange={(e) => {
                                            handleContractChange(idx, "completionStatus", e.target.value);
                                            if (statusErr) clearFieldError(`similarWorks.${idx}.completionStatus`);
                                          }}
                                          aria-invalid={Boolean(statusErr)}
                                          className={`w-full p-2 rounded text-slate-900 focus:outline-none font-medium disabled:opacity-50 transition-all ${statusErr
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-slate-50 border border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-800"
                                            }`}
                                        >
                                          <option value="">— Select Status —</option>
                                          {COMPLETION_STATUS_OPTIONS.map((s) => (
                                            <option key={s} value={s}>
                                              {s}
                                            </option>
                                          ))}
                                        </select>
                                        {statusErr && (
                                          <div role="alert" className="flex items-start gap-1 text-[11px] font-semibold text-rose-600 animate-fadeIn">
                                            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-rose-500" />
                                            <span>{statusErr}</span>
                                          </div>
                                        )}
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

                          {/* HISTORICAL CONTRACT NON-PERFORMANCE, PENDING LITIGATION AND LITIGATION HISTORY */}
                          <div id="section-historical-litigation" className="pt-6 mt-6 border-t border-slate-200/80 space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                              <Scale className="w-4 h-4 text-blue-900" />
                              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                Historical Contract Non-Performance, Pending Litigation and Litigation History
                              </h3>
                            </div>

                            <div className="space-y-3 text-xs">
                              <div>
                                <label htmlFor="select-historicalLitigationType" className="block font-semibold text-slate-700 mb-1">
                                  Historical Contract non performance, pending litigation and litigation history
                                </label>
                                <select
                                  id="select-historicalLitigationType"
                                  value={formData.historicalLitigationType || ""}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    setFormData((prev) => ({
                                      ...prev,
                                      historicalLitigationType: val,
                                      ...(val === "None" || val === "" ? {
                                        historicalContractIdentification: "",
                                        historicalEmployerName: "",
                                        historicalReason: "",
                                        historicalMatterDispute: "",
                                      } : {}),
                                    }));
                                    if (fieldErrors.historicalLitigationType) clearFieldError("historicalLitigationType");
                                    if (fieldErrors.historicalContractIdentification) clearFieldError("historicalContractIdentification");
                                    if (fieldErrors.historicalEmployerName) clearFieldError("historicalEmployerName");
                                    if (fieldErrors.historicalReason) clearFieldError("historicalReason");
                                    if (fieldErrors.historicalMatterDispute) clearFieldError("historicalMatterDispute");
                                  }}
                                  className="w-full p-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium transition-all"
                                >
                                  <option value="">— Select Category (or None if Not Applicable) —</option>
                                  <option value="None">None (No Non-Performance or Litigation History)</option>
                                  <option value="Non performing contract">Non performing contract</option>
                                  <option value="Pending litigation">Pending litigation</option>
                                  <option value="Litigation history past">Litigation history past</option>
                                </select>
                              </div>

                              {/* 1. NON-PERFORMING CONTRACT */}
                              {formData.historicalLitigationType === "Non performing contract" && (
                                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 animate-fadeIn">
                                  <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs pb-1 border-b border-amber-200/60">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Non-Performing Contract Details</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label htmlFor="input-hist-contractId" className="block font-semibold text-slate-700 mb-1">
                                        Contract identification *
                                      </label>
                                      <input
                                        id="input-hist-contractId"
                                        type="text"
                                        value={formData.historicalContractIdentification || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({ ...prev, historicalContractIdentification: e.target.value }));
                                          if (fieldErrors.historicalContractIdentification) clearFieldError("historicalContractIdentification");
                                        }}
                                        placeholder="Contract Name, Number, Year"
                                        className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                          fieldErrors.historicalContractIdentification
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                        }`}
                                      />
                                      {fieldErrors.historicalContractIdentification && (
                                        <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                          {fieldErrors.historicalContractIdentification}
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      <label htmlFor="input-hist-employer" className="block font-semibold text-slate-700 mb-1">
                                        Name of employer *
                                      </label>
                                      <input
                                        id="input-hist-employer"
                                        type="text"
                                        value={formData.historicalEmployerName || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({ ...prev, historicalEmployerName: e.target.value }));
                                          if (fieldErrors.historicalEmployerName) clearFieldError("historicalEmployerName");
                                        }}
                                        placeholder="Employer / Client Organization"
                                        className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                          fieldErrors.historicalEmployerName
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                        }`}
                                      />
                                      {fieldErrors.historicalEmployerName && (
                                        <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                          {fieldErrors.historicalEmployerName}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <label htmlFor="input-hist-reason" className="block font-semibold text-slate-700 mb-1">
                                      Reason for non performance *
                                    </label>
                                    <textarea
                                      id="input-hist-reason"
                                      rows={2}
                                      value={formData.historicalReason || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, historicalReason: e.target.value }));
                                        if (fieldErrors.historicalReason) clearFieldError("historicalReason");
                                      }}
                                      placeholder="Explain the principal reasons for non-performance..."
                                      className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                        fieldErrors.historicalReason
                                          ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                          : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                      }`}
                                    />
                                    {fieldErrors.historicalReason && (
                                      <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                        {fieldErrors.historicalReason}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 2. PENDING LITIGATION */}
                              {formData.historicalLitigationType === "Pending litigation" && (
                                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 animate-fadeIn">
                                  <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs pb-1 border-b border-amber-200/60">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Pending Litigation Details</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label htmlFor="input-hist-contractId" className="block font-semibold text-slate-700 mb-1">
                                        Contract identification *
                                      </label>
                                      <input
                                        id="input-hist-contractId"
                                        type="text"
                                        value={formData.historicalContractIdentification || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({ ...prev, historicalContractIdentification: e.target.value }));
                                          if (fieldErrors.historicalContractIdentification) clearFieldError("historicalContractIdentification");
                                        }}
                                        placeholder="Contract Name, Number, Year"
                                        className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                          fieldErrors.historicalContractIdentification
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                        }`}
                                      />
                                      {fieldErrors.historicalContractIdentification && (
                                        <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                          {fieldErrors.historicalContractIdentification}
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      <label htmlFor="input-hist-employer" className="block font-semibold text-slate-700 mb-1">
                                        Name of employer *
                                      </label>
                                      <input
                                        id="input-hist-employer"
                                        type="text"
                                        value={formData.historicalEmployerName || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({ ...prev, historicalEmployerName: e.target.value }));
                                          if (fieldErrors.historicalEmployerName) clearFieldError("historicalEmployerName");
                                        }}
                                        placeholder="Employer / Client Organization"
                                        className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                          fieldErrors.historicalEmployerName
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                        }`}
                                      />
                                      {fieldErrors.historicalEmployerName && (
                                        <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                          {fieldErrors.historicalEmployerName}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <label htmlFor="input-hist-reason" className="block font-semibold text-slate-700 mb-1">
                                      Reason for pending litigation *
                                    </label>
                                    <textarea
                                      id="input-hist-reason"
                                      rows={2}
                                      value={formData.historicalReason || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, historicalReason: e.target.value }));
                                        if (fieldErrors.historicalReason) clearFieldError("historicalReason");
                                      }}
                                      placeholder="Explain the circumstances and background leading to pending litigation..."
                                      className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                        fieldErrors.historicalReason
                                          ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                          : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                      }`}
                                    />
                                    {fieldErrors.historicalReason && (
                                      <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                        {fieldErrors.historicalReason}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <label htmlFor="input-hist-matterDispute" className="block font-semibold text-slate-700 mb-1">
                                      Matter dispute *
                                    </label>
                                    <input
                                      id="input-hist-matterDispute"
                                      type="text"
                                      value={formData.historicalMatterDispute || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, historicalMatterDispute: e.target.value }));
                                        if (fieldErrors.historicalMatterDispute) clearFieldError("historicalMatterDispute");
                                      }}
                                      placeholder="Specify the matter in dispute (e.g. claim amount, delay damages, arbitration)..."
                                      className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                        fieldErrors.historicalMatterDispute
                                          ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                          : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                      }`}
                                    />
                                    {fieldErrors.historicalMatterDispute && (
                                      <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                        {fieldErrors.historicalMatterDispute}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* 3. LITIGATION HISTORY PAST */}
                              {formData.historicalLitigationType === "Litigation history past" && (
                                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3 animate-fadeIn">
                                  <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs pb-1 border-b border-amber-200/60">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span>Litigation History Past Details</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label htmlFor="input-hist-contractId" className="block font-semibold text-slate-700 mb-1">
                                        Contract identification *
                                      </label>
                                      <input
                                        id="input-hist-contractId"
                                        type="text"
                                        value={formData.historicalContractIdentification || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({ ...prev, historicalContractIdentification: e.target.value }));
                                          if (fieldErrors.historicalContractIdentification) clearFieldError("historicalContractIdentification");
                                        }}
                                        placeholder="Contract Name, Number, Year"
                                        className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                          fieldErrors.historicalContractIdentification
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                        }`}
                                      />
                                      {fieldErrors.historicalContractIdentification && (
                                        <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                          {fieldErrors.historicalContractIdentification}
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      <label htmlFor="input-hist-employer" className="block font-semibold text-slate-700 mb-1">
                                        Name of employer *
                                      </label>
                                      <input
                                        id="input-hist-employer"
                                        type="text"
                                        value={formData.historicalEmployerName || ""}
                                        onChange={(e) => {
                                          setFormData((prev) => ({ ...prev, historicalEmployerName: e.target.value }));
                                          if (fieldErrors.historicalEmployerName) clearFieldError("historicalEmployerName");
                                        }}
                                        placeholder="Employer / Client Organization"
                                        className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                          fieldErrors.historicalEmployerName
                                            ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                            : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                        }`}
                                      />
                                      {fieldErrors.historicalEmployerName && (
                                        <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                          {fieldErrors.historicalEmployerName}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <label htmlFor="input-hist-reason" className="block font-semibold text-slate-700 mb-1">
                                      Reason for litigation history past *
                                    </label>
                                    <textarea
                                      id="input-hist-reason"
                                      rows={2}
                                      value={formData.historicalReason || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, historicalReason: e.target.value }));
                                        if (fieldErrors.historicalReason) clearFieldError("historicalReason");
                                      }}
                                      placeholder="Explain the background, reason, and final outcome..."
                                      className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                        fieldErrors.historicalReason
                                          ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                          : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                      }`}
                                    />
                                    {fieldErrors.historicalReason && (
                                      <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                        {fieldErrors.historicalReason}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <label htmlFor="input-hist-matterDispute" className="block font-semibold text-slate-700 mb-1">
                                      Matter dispute *
                                    </label>
                                    <input
                                      id="input-hist-matterDispute"
                                      type="text"
                                      value={formData.historicalMatterDispute || ""}
                                      onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, historicalMatterDispute: e.target.value }));
                                        if (fieldErrors.historicalMatterDispute) clearFieldError("historicalMatterDispute");
                                      }}
                                      placeholder="Specify the matter in dispute and final judgment/settlement details..."
                                      className={`w-full p-2 rounded text-slate-900 focus:outline-none transition-all ${
                                        fieldErrors.historicalMatterDispute
                                          ? "bg-rose-50 border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                                          : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                                      }`}
                                    />
                                    {fieldErrors.historicalMatterDispute && (
                                      <span className="text-[11px] font-semibold text-rose-600 block mt-1">
                                        {fieldErrors.historicalMatterDispute}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
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
                      className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${formAlert.type === "success"
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

                  {/* Validation Summary Bar (Bottom of Form) */}
                  {Object.keys(fieldErrors).length > 0 && (
                    <div
                      id="validation-summary-bottom"
                      role="alert"
                      className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900 shadow-md animate-fadeIn"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-sm text-rose-950">
                            {Object.keys(fieldErrors).length === 1
                              ? "1 required field requires your attention"
                              : `${Object.keys(fieldErrors).length} required fields require your attention`}
                          </p>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            Please correct the highlighted fields before submitting your official response.
                          </p>
                        </div>
                      </div>
                      {getNextErrorFieldKey() && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextKey = getNextErrorFieldKey();
                            if (nextKey) scrollToAndFocusField(nextKey);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition-colors shrink-0"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>Navigate to First Error</span>
                        </button>
                      )}
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
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${formData.willParticipate === "Yes" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
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
                        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${formData.hasOngoingContracts === "Yes" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"
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
                    <div>
                      <span className="text-slate-500 font-medium text-[11px] block">Past / Current Experience with RDA or ICDP:</span>
                      <span className="font-bold text-slate-900 text-xs">
                        {formData.hasRdaOrIcdpExperience === "Yes"
                          ? `Yes (${formData.rdaIcdpExperienceType || "RDA/ICDP"}${formData.rdaIcdpProjectDetails ? ` - ${formData.rdaIcdpProjectDetails}` : ""})`
                          : formData.hasRdaOrIcdpExperience === "No"
                          ? "No"
                          : "N/A"}
                      </span>
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

                    {/* Historical Litigation & Non-Performance */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-slate-500 font-semibold text-[11px] block uppercase tracking-wider">
                        Historical Contract Non-Performance &amp; Litigation:
                      </span>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800">
                          {formData.historicalLitigationType || "None"}
                        </span>
                        {formData.historicalLitigationType && formData.historicalLitigationType !== "None" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200">
                            <div>
                              <span className="text-slate-500 font-medium text-[11px] block">Contract Identification:</span>
                              <span className="font-semibold text-slate-900">{formData.historicalContractIdentification || "—"}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-medium text-[11px] block">Name of Employer:</span>
                              <span className="font-semibold text-slate-900">{formData.historicalEmployerName || "—"}</span>
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-slate-500 font-medium text-[11px] block">
                                {formData.historicalLitigationType === "Non performing contract"
                                  ? "Reason for Non-Performance:"
                                  : formData.historicalLitigationType === "Pending litigation"
                                  ? "Reason for Pending Litigation:"
                                  : "Reason for Litigation History Past:"}
                              </span>
                              <span className="font-medium text-slate-900 whitespace-pre-wrap">{formData.historicalReason || "—"}</span>
                            </div>
                            {formData.historicalMatterDispute && (
                              <div className="sm:col-span-2">
                                <span className="text-slate-500 font-medium text-[11px] block">Matter Dispute:</span>
                                <span className="font-medium text-slate-900 whitespace-pre-wrap">{formData.historicalMatterDispute}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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

              {/* Notification & Confirmation Email Address Card */}
              <div
                id="confirmation-email-card"
                className={`p-4 rounded-xl space-y-2 transition-all ${
                  confirmationEmailError
                    ? "bg-rose-50/80 border-2 border-rose-500 shadow-sm"
                    : "bg-blue-50/70 border border-blue-200"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px]">
                  <Mail className="w-4 h-4 text-blue-900 shrink-0" />
                  <span>Email Address for Official Confirmation Receipt *</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Your permanent registration reference number and workshop details (<strong>07 December 2026 at 9:00 AM</strong>) will be sent to this email address immediately upon submission.
                </p>
                <div className="pt-1">
                  <input
                    id="input-confirmation-email"
                    type="email"
                    value={confirmationEmail}
                    onChange={(e) => {
                      setConfirmationEmail(e.target.value);
                      if (confirmationEmailError) setConfirmationEmailError(null);
                    }}
                    placeholder="e.g. info@company.lk or representative@company.lk"
                    aria-invalid={Boolean(confirmationEmailError)}
                    aria-describedby={confirmationEmailError ? "error-confirmation-email" : undefined}
                    className={`w-full p-2.5 rounded-lg text-slate-900 text-xs font-mono focus:outline-none transition-all ${
                      confirmationEmailError
                        ? "bg-white border-2 border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : "bg-white border border-slate-300 focus:ring-2 focus:ring-blue-800"
                    }`}
                  />
                  {confirmationEmailError && (
                    <div
                      id="error-confirmation-email"
                      role="alert"
                      className="flex items-center gap-1.5 pt-1.5 text-xs font-semibold text-rose-600 animate-fadeIn"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{confirmationEmailError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attestation & Declaration */}
              <div
                id="declaration-container"
                className={`p-4 rounded-xl space-y-2.5 transition-all ${modalDeclarationError
                  ? "bg-rose-50 border-2 border-rose-500 shadow-sm"
                  : "bg-emerald-50/70 border border-emerald-300"
                  }`}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="input-declaration-consent"
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={(e) => {
                      setDeclarationAccepted(e.target.checked);
                      if (modalDeclarationError) setModalDeclarationError(null);
                    }}
                    className="w-4 h-4 mt-0.5 text-blue-900 rounded focus:ring-blue-800"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900 uppercase text-[11px]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Authorized Representative Declaration *</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      I hereby confirm that all information provided in this questionnaire filing is true, accurate, and complete to the best of my knowledge, and submitted on behalf of the registered organization for the Road Development Authority Inclusive Connectivity and Development Project (ICDP).
                    </p>
                  </div>
                </label>

                {modalDeclarationError && (
                  <div role="alert" className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-rose-600 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{modalDeclarationError}</span>
                  </div>
                )}
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
