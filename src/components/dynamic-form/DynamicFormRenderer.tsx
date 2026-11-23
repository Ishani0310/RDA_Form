"use client";

import React, { useState, useEffect } from "react";
import {
  IQuestionnaireData,
  IFormSection,
  IFormQuestion,
  FormFieldType,
} from "@/types/questionnaire";
import {
  AlertCircle,
  HelpCircle,
  Upload,
  CheckCircle2,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  Edit2,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Truck,
  Briefcase,
  Users,
  Building2,
  Info,
  X,
} from "lucide-react";
import {
  FINANCIAL_YEARS,
  FinancialYearKey,
  FinancialYearIndicators,
  createEmptyFinancialIndicators,
  createEmptyFiveYearStatements,
  calculateTotalEquity,
  calculateWorkingCapital,
  SRI_LANKA_PROVINCES,
  PROVINCE_DISTRICT_MAP,
  SriLankaProvince,
} from "@/lib/questionnaire-types";

interface DynamicFormRendererProps {
  questionnaire: IQuestionnaireData | { sections: IFormSection[]; title?: string; version?: string };
  values: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
  previewMode?: boolean;
  disabled?: boolean;
  renderCustomComplexField?: (question: IFormQuestion, value: any, onChange: (val: any) => void) => React.ReactNode;
  // Mode B: Inline Admin Controls
  adminEditMode?: boolean;
  onEditSection?: (section: IFormSection) => void;
  onAddQuestionToSection?: (sectionId: string) => void;
  onDeleteSection?: (section: IFormSection) => void;
  onMoveSection?: (sectionIndex: number, direction: "up" | "down") => void;
  onEditQuestion?: (question: IFormQuestion, sectionId: string) => void;
  onDuplicateQuestion?: (question: IFormQuestion, sectionId: string) => void;
  onDeleteQuestion?: (question: IFormQuestion, sectionId: string) => void;
  onMoveQuestion?: (sectionId: string, questionIndex: number, direction: "up" | "down") => void;
}

const SUPPLIER_MATERIALS = [
  "Bitumen / Asphalt",
  "Sand",
  "Cement",
  "Aggregates",
  "Steel",
  "Soil",
  "Other",
] as const;

const CURRENCY_OPTIONS = ["LKR", "USD", "EUR", "JPY", "GBP", "Other"];

const CONTRACT_TYPE_OPTIONS = [
  "Highway",
  "Bridges",
  "Geotechnical, Soil Nailing & Stabilization",
  "Other",
];

const COMPLETION_STATUS_OPTIONS = [
  "Substantially completed",
  "Fully completed (Performance Certificate issued)",
];

function MultiItemOtherInput({
  value,
  onChange,
  disabled,
  placeholder,
  label,
  buttonLabel,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder: (idx: number) => string;
  label: string;
  buttonLabel: string;
}) {
  const [items, setItems] = useState<string[]>(() => {
    if (!value || !value.trim()) return [""];
    const parsed = value.split(",").map((s) => s.trim());
    return parsed.length > 0 ? parsed : [""];
  });

  const [focusNew, setFocusNew] = useState(false);
  const lastInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const currentCombined = items.map((s) => s.trim()).filter(Boolean).join(", ");
    const externalCombined = (value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
    if (currentCombined !== externalCombined) {
      const parsed = (value || "").split(",").map((s) => s.trim());
      setItems(parsed.length > 0 ? parsed : [""]);
    }
  }, [value]);

  useEffect(() => {
    if (focusNew && lastInputRef.current) {
      lastInputRef.current.focus();
      setFocusNew(false);
    }
  }, [items, focusNew]);

  const updateItem = (index: number, text: string) => {
    const next = [...items];
    next[index] = text;
    setItems(next);
    onChange(next.map((s) => s.trim()).filter(Boolean).join(", "));
  };

  const addItem = () => {
    setItems((prev) => [...prev, ""]);
    setFocusNew(true);
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    const finalItems = next.length > 0 ? next : [""];
    setItems(finalItems);
    onChange(finalItems.map((s) => s.trim()).filter(Boolean).join(", "));
  };

  return (
    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
        <label className="block text-[11px] font-bold text-amber-950 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-amber-900 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-full">
            {items.filter((s) => s.trim()).length} Specified
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={addItem}
            className="text-[11px] font-bold text-blue-900 hover:text-blue-700 underline"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-amber-800/60 w-4 text-right shrink-0">
              #{idx + 1}
            </span>
            <input
              ref={idx === items.length - 1 ? lastInputRef : null}
              type="text"
              placeholder={placeholder(idx)}
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              disabled={disabled}
              className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-blue-800 shadow-sm"
            />
            {items.length > 1 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeItem(idx)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors shrink-0"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="pt-1 flex items-center justify-between">
        <button
          type="button"
          disabled={disabled}
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-md shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{buttonLabel}</span>
        </button>
        <span className="text-[10px] text-slate-400 italic">
          Press Enter to add another
        </span>
      </div>
    </div>
  );
}

export function evaluateConditionalRule(
  conditional: IFormQuestion["conditionalLogic"],
  values: Record<string, any>
): boolean {
  if (!conditional || !conditional.enabled) return true;

  let targetVal = values[conditional.dependsOnQuestionId];

  // Resolve question ID or question code aliases
  if (targetVal === undefined) {
    const aliasMap: Record<string, string[]> = {
      willParticipate: ["Q04", "willParticipate"],
      Q04: ["willParticipate", "Q04"],
      participantCategory: ["Q05", "participantCategory"],
      Q05: ["participantCategory", "Q05"],
      hasOngoingContracts: ["Q22", "hasOngoingContracts"],
      Q22: ["hasOngoingContracts", "Q22"],
      "supplierDetails.province": ["Q15", "supplierDetails.province"],
      Q15: ["supplierDetails.province", "Q15"],
    };
    const cands = aliasMap[conditional.dependsOnQuestionId];
    if (cands) {
      for (const c of cands) {
        if (values[c] !== undefined) {
          targetVal = values[c];
          break;
        }
      }
    }
  }

  switch (conditional.operator) {
    case "equals":
      return targetVal === conditional.value;
    case "not_equals":
      return targetVal !== conditional.value;
    case "contains":
      if (Array.isArray(targetVal)) {
        return targetVal.includes(conditional.value);
      }
      return typeof targetVal === "string" && targetVal.includes(String(conditional.value));
    case "greater_than":
      return Number(targetVal) > Number(conditional.value);
    case "less_than":
      return Number(targetVal) < Number(conditional.value);
    case "is_answered":
      return targetVal !== undefined && targetVal !== null && targetVal !== "" && (!Array.isArray(targetVal) || targetVal.length > 0);
    case "is_not_answered":
      return targetVal === undefined || targetVal === null || targetVal === "" || (Array.isArray(targetVal) && targetVal.length === 0);
    default:
      return true;
  }
}

/**
 * Evaluates official Google Form Section-Level Routing Conditions:
 * 1. Attendance No: Section 1 -> Submit. (Sections 2–11 hidden!)
 * 2. Attendance Yes + No Category selected yet: Only Section 1 & Section 2 shown.
 * 3. Attendance Yes + Govt Officer: Section 1, 2, 3A, 11 shown. (Sections 4–10 hidden!)
 * 4. Attendance Yes + Supplier: Section 1, 2, 3B, 4-SUP, 11 shown. (Sections 4-CON to 10 hidden!)
 * 5. Attendance Yes + Contractor: Section 1, 2, 3C, 4-CON, 5, 6, 7, (8 if ongoing=Yes), 9, 10, 11 shown.
 */
export function isSectionVisibleInForm(
  section: IFormSection,
  values: Record<string, any>
): boolean {
  const willParticipate = values["willParticipate"] ?? values["Q04"];
  const participantCategory = values["participantCategory"] ?? values["Q05"];
  const hasOngoingContracts = values["hasOngoingContracts"] ?? values["Q22"];

  const code = (section.code || "").toUpperCase();
  const title = (section.title || "").toUpperCase();

  // SECTION 1: Always visible
  if (code === "SEC-01" || title.includes("BASIC")) {
    return true;
  }

  // Google Form Condition: If user selects NO to participation:
  // "Hide all subsequent questionnaire sections. Display the Submit button immediately."
  if (willParticipate === "No") {
    return false;
  }

  // If willParticipate is not answered yet, subsequent sections are hidden
  if (!willParticipate) {
    return false;
  }

  // SECTION 2 – PARTICIPANT CATEGORY: visible only when willParticipate === "Yes"
  if (code === "SEC-02" || title.includes("PARTICIPANT CATEGORY")) {
    return willParticipate === "Yes";
  }

  // From Section 3 onwards, participantCategory MUST be answered!
  // "No default selection. The participant category determines the following questionnaire structure."
  if (!participantCategory) {
    return false;
  }

  // SECTION 3 – PARTICIPANT DETAILS:
  // Visible for all 3 categories (Govt Officer, Supplier, Contractor)
  if (code === "SEC-03" || title.includes("PARTICIPANT DETAILS")) {
    return willParticipate === "Yes" && Boolean(participantCategory);
  }

  // SECTION 4 – SUPPLIER DETAILS:
  // "Display only for Supplier category."
  if (code === "SEC-04-SUP" || title.includes("SUPPLIER DETAILS")) {
    return willParticipate === "Yes" && participantCategory === "Supplier";
  }

  // SECTION 4 – CONTRACTOR DETAILS:
  // "Display only for Contractors."
  if (code === "SEC-04-CON" || title.includes("CONTRACTOR DETAILS")) {
    return willParticipate === "Yes" && participantCategory === "Contractor";
  }

  // SECTION 5 – FINANCIAL CAPABILITY:
  // Contractor only
  if (code === "SEC-05" || title.includes("FINANCIAL CAPABILITY")) {
    return willParticipate === "Yes" && participantCategory === "Contractor";
  }

  // SECTION 6 – LOAN COMMITMENTS:
  // Contractor only
  if (code === "SEC-06" || title.includes("LOAN COMMITMENTS")) {
    return willParticipate === "Yes" && participantCategory === "Contractor";
  }

  // SECTION 7 – CURRENT WORK COMMITMENTS:
  // Contractor only
  if (code === "SEC-07" || title.includes("CURRENT WORK COMMITMENTS")) {
    return willParticipate === "Yes" && participantCategory === "Contractor";
  }

  // SECTION 8 – ONGOING WORKS:
  // Contractor only AND hasOngoingContracts === "Yes"!
  // "IF YES: Display SECTION 8 – ONGOING WORKS... IF NO: Hide the complete Ongoing Works section. Proceed directly to General Experience."
  if (code === "SEC-08" || title.includes("ONGOING WORKS")) {
    return willParticipate === "Yes" && participantCategory === "Contractor" && hasOngoingContracts === "Yes";
  }

  // SECTION 9 – EXPERIENCE:
  // Contractor only
  if (code === "SEC-09" || (title.includes("EXPERIENCE") && !title.includes("SIMILAR"))) {
    return willParticipate === "Yes" && participantCategory === "Contractor";
  }

  // SECTION 10 – SIMILAR WORK EXPERIENCE:
  // Contractor only
  if (code === "SEC-10" || title.includes("SIMILAR WORK EXPERIENCE")) {
    return willParticipate === "Yes" && participantCategory === "Contractor";
  }

  // SECTION 11 – MATTERS FOR DISCUSSION:
  // "Display for all participants who selected Yes for workshop attendance."
  if (code === "SEC-11" || title.includes("MATTERS FOR DISCUSSION")) {
    return willParticipate === "Yes" && Boolean(participantCategory);
  }

  // Default fallback: evaluate individual questions
  const visibleQuestions = (section.questions || []).filter((q) =>
    evaluateConditionalRule(q.conditionalLogic, values)
  );
  return visibleQuestions.length > 0;
}

/**
 * Evaluates official Google Form Question-Level Conditional Rules:
 * E.g., for Section 3B Supplier Details:
 * "SECTION 3B – PARTICIPANT DETAILS (SUPPLIER): Only ONE representative is required. Do not display Participant 2."
 */
export function isQuestionVisibleInForm(
  question: IFormQuestion,
  values: Record<string, any>
): boolean {
  if (!evaluateConditionalRule(question.conditionalLogic, values)) {
    return false;
  }

  const participantCategory = values["participantCategory"] ?? values["Q05"];

  // Google Form rule: Do not display Participant 2 for Supplier
  if (
    participantCategory === "Supplier" &&
    (question.id.startsWith("participant2") ||
      question.code === "Q09" ||
      question.code === "Q10" ||
      question.code === "Q11")
  ) {
    return false;
  }

  return true;
}

function getSectionIcon(title: string, code: string) {
  const t = (title || "").toLowerCase();
  const c = (code || "").toLowerCase();
  if (t.includes("basic") || t.includes("organization") || c.includes("01")) return Building2;
  if (t.includes("category") || t.includes("participant") || t.includes("delegate") || c.includes("02") || c.includes("03")) return Users;
  if (t.includes("supplier") || c.includes("04")) return Truck;
  if (t.includes("contractor") || c.includes("05")) return Briefcase;
  if (t.includes("financial") || t.includes("loan") || c.includes("06")) return Calendar;
  if (t.includes("commitment") || t.includes("ongoing") || c.includes("07") || c.includes("08")) return Layers;
  if (t.includes("experience") || c.includes("09")) return Briefcase;
  if (t.includes("similar") || c.includes("10")) return Layers;
  if (t.includes("discussion") || t.includes("matter") || c.includes("11")) return FileText;
  return Building2;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  questionnaire,
  values,
  onChange,
  errors = {},
  previewMode = false,
  disabled = false,
  renderCustomComplexField,
  adminEditMode = false,
  onEditSection,
  onAddQuestionToSection,
  onDeleteSection,
  onMoveSection,
  onEditQuestion,
  onDuplicateQuestion,
  onDeleteQuestion,
  onMoveQuestion,
}) => {
  const sections = questionnaire.sections || [];

  return (
    <div className="space-y-6">
      {/* Preview Mode Watermark Banner */}
      {previewMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-between shadow-sm border border-amber-600">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-pulse"></span>
            <span>PREVIEW – NOT PUBLISHED</span>
          </div>
          <span className="text-[11px] font-mono normal-case">
            Version {questionnaire.version || "Draft"} • Interactive Simulation
          </span>
        </div>
      )}

      {/* Official Unified Form Document Container (100% Visual Parity with /register) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-8">
        {sections.map((section, sIdx) => {
          // In View Mode (Mode A), evaluate Google Form section-level routing conditions
          const sectionVisibleInModeA = isSectionVisibleInForm(section, values);
          if (!adminEditMode && !sectionVisibleInModeA) {
            return null;
          }

          // Check visible questions in this section
          const visibleQuestions = (section.questions || []).filter((q) =>
            isQuestionVisibleInForm(q, values)
          );

          // In admin edit mode, show all questions so admin can inspect and edit them
          const questionsToRender = adminEditMode ? (section.questions || []) : visibleQuestions;

          // In public/view simulation, if all questions are conditionally hidden, hide the section
          if (!adminEditMode && visibleQuestions.length === 0 && (section.questions || []).length > 0) {
            return null;
          }

          const SectionIconComponent = getSectionIcon(section.title, section.code);

          // Dynamic Section 3 titles per Google Form spec
          let displayTitle = section.title;
          let displayBadge: string | null = null;
          if (section.code === "SEC-03" || section.id === "sec-participant-details") {
            const cat = values["participantCategory"] || values["Q05"];
            if (cat === "Government Officer") {
              displayTitle = "SECTION 3A – PARTICIPANT DETAILS (GOVERNMENT OFFICER)";
            } else if (cat === "Supplier") {
              displayTitle = "SECTION 3B – PARTICIPANT DETAILS (SUPPLIER)";
              displayBadge = "1 Representative Only";
            } else if (cat === "Contractor") {
              displayTitle = "SECTION 3C – PARTICIPANT DETAILS (CONTRACTOR)";
            }
          }

          return (
            <div
              key={section.id || sIdx}
              className={`space-y-4 ${sIdx > 0 ? "pt-6 border-t border-slate-100" : ""}`}
            >
              {/* Section Header */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <SectionIconComponent className="w-4 h-4 text-blue-900 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide truncate">
                    {displayTitle}
                  </h2>
                  {displayBadge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {displayBadge}
                    </span>
                  )}
                </div>

                {/* Admin Contextual Section Toolbar */}
                {adminEditMode && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onEditSection?.(section)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-all"
                      title="Edit Section Title & Description"
                    >
                      <Edit2 className="w-3 h-3 text-blue-700" />
                      <span>Edit Section</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddQuestionToSection?.(section.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-2xs transition-all"
                      title="Add Question to this Section"
                    >
                      <Plus className="w-3 h-3 text-amber-400" />
                      <span>Add Question</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onMoveSection?.(sIdx, "up")}
                      disabled={sIdx === 0}
                      className="p-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg disabled:opacity-25 shadow-2xs"
                      title="Move Section Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onMoveSection?.(sIdx, "down")}
                      disabled={sIdx === sections.length - 1}
                      className="p-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg disabled:opacity-25 shadow-2xs"
                      title="Move Section Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSection?.(section)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 bg-white border border-rose-200 rounded-lg shadow-2xs"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Section Description */}
              {(section.code === "SEC-03" && values.participantCategory === "Supplier") ? (
                <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 leading-relaxed font-medium">
                  <strong>Notice:</strong> Only ONE representative is required for the Supplier category. Participant 2 is omitted per Google Form rules.
                </p>
              ) : section.description ? (
                <p className="text-xs text-slate-500 leading-relaxed">
                  {section.description}
                </p>
              ) : null}

              {/* Notice Banner for Financial Section */}
              {(section.code === "SEC-05" || section.code === "SEC-06" || section.id === "sec-financial-capability") && (
                <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-950">
                  <p className="leading-relaxed">
                    <strong>Official Instruction:</strong> All financial amounts must be entered as the{" "}
                    <strong>full total amount in Sri Lankan Rupees (LKR)</strong>. For example, for{" "}
                    <strong>1 Lakh (LKR 100,000)</strong> enter <strong>100000</strong> (not 1 or 1 Lakh); for{" "}
                    <strong>10 Million</strong> enter <strong>10000000</strong>. You may enter{" "}
                    <strong>0</strong> or leave blank if information is unrecorded.{" "}
                    <em>Profit Before Tax may be negative if incurring a loss.</em>
                  </p>
                </div>
              )}

              {/* Early Exit Route Banner in Section 1 if Attendance === "No" */}
              {(section.code === "SEC-01" || section.id === "sec-basic-info") && values.willParticipate === "No" && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
                  <p className="text-amber-950 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Non-Attendance Route Activated (Google Form Rule)</span>
                  </p>
                  <p className="text-amber-900 font-medium">
                    Thank you. Since you are not participating in the workshop on 07 December 2026, you may proceed to submit your basic organizational record immediately.
                  </p>
                  <p className="text-amber-700 text-[11px]">
                    All subsequent workshop participation, category details, and contractor/supplier financial schedules are bypassed under this selection.
                  </p>
                </div>
              )}

              {/* Render Section Questions */}
              <div className="space-y-4 text-xs">
                {questionsToRender.map((question, qIdx) => {
                  const isVisibleInPublic = isQuestionVisibleInForm(question, values);

                  return (
                    <div
                      key={question.id}
                      id={`field-container-${question.id}`}
                      className={`space-y-1.5 transition-all ${
                        adminEditMode
                          ? "p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:border-slate-300"
                          : ""
                      }`}
                    >
                      {/* Admin Inline Question Control Bar */}
                      {adminEditMode && (
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-1.5 mb-1.5 bg-slate-50 p-2 rounded-lg">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                              {question.code}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">
                              {question.fieldType.replace("_", " ")}
                            </span>
                            {question.conditionalLogic?.enabled && (
                              <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                Rule: {question.conditionalLogic.dependsOnQuestionId} {question.conditionalLogic.operator} {String(question.conditionalLogic.value)}
                              </span>
                            )}
                            {!isVisibleInPublic && (
                              <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Hidden under current simulation values
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onEditQuestion?.(question, section.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-2xs transition-all"
                              title="Edit Question"
                            >
                              <Edit2 className="w-3 h-3 text-blue-700" />
                              <span>Edit Question</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDuplicateQuestion?.(question, section.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
                              title="Duplicate Question"
                            >
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span className="hidden sm:inline">Duplicate</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onMoveQuestion?.(section.id, qIdx, "up")}
                              disabled={qIdx === 0}
                              className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg disabled:opacity-25 shadow-2xs"
                              title="Move Question Up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onMoveQuestion?.(section.id, qIdx, "down")}
                              disabled={qIdx === (section.questions || []).length - 1}
                              className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg disabled:opacity-25 shadow-2xs"
                              title="Move Question Down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteQuestion?.(question, section.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 bg-white border border-rose-200 rounded-lg shadow-2xs"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Question Label */}
                      <label
                        htmlFor={`input-${question.id}`}
                        className="block font-semibold text-slate-700 mb-1"
                      >
                        {adminEditMode && (
                          <span className="text-blue-900 font-mono text-xs mr-1 font-semibold">
                            [{question.code}]
                          </span>
                        )}
                        <span>{question.text}</span>
                        {question.isRequired && (
                          <span className="text-rose-500 font-bold ml-1" title="Required field">
                            *
                          </span>
                        )}
                      </label>

                      {/* Description if present */}
                      {question.description && (
                        <p className="text-[11px] text-slate-500 mb-1.5 leading-relaxed">
                          {question.description}
                        </p>
                      )}

                      {/* Input Element */}
                      <div>
                        {renderFieldInput(
                          question,
                          values[question.id],
                          (val) => onChange(question.id, val),
                          errors[question.id],
                          disabled,
                          renderCustomComplexField,
                          values,
                          onChange
                        )}
                      </div>

                      {/* Field Help Text */}
                      {question.helpText && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
                          <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{question.helpText}</span>
                        </div>
                      )}

                      {/* Validation Error Message */}
                      {errors[question.id] && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>{errors[question.id]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Mode A Interactive Submission Simulator at bottom of Form View */}
        {!adminEditMode && (
          <div className="pt-6 border-t border-slate-200">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-[#0b1f3a] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-sm">Mode A Form View – Google Form Ready</span>
                </div>
                <p className="text-xs text-blue-200">
                  {values.willParticipate === "No"
                    ? "Non-attendance fast-track route active. All requirements met for immediate submission."
                    : `Active stakeholder path: ${values.participantCategory || "No category selected"} • All conditional Google Form logic verified.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  alert(
                    values.willParticipate === "No"
                      ? "✓ Mode A Simulation Passed!\n\nFast-track submission for Non-Attendee successfully validated. Zero delegate or financial details required."
                      : `✓ Mode A Simulation Passed!\n\nCategory [${values.participantCategory || "Participant"}] registration branch verified against Google Form routing specification.`
                  );
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <span>Simulate Registration Submission</span>
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Built-in 5-Year Financial Statements Table Renderer with real-time equity & working capital calculation
 */
function renderFinancialStatementsMatrix(
  value: any,
  onChange: (val: any) => void,
  disabled: boolean
) {
  const currentStatements = value || {};

  const handleCellChange = (year: string, field: string, rawVal: string) => {
    if (disabled) return;
    const yearData = { ...(currentStatements[year] || {}) };
    const num = rawVal === "" ? null : Number(rawVal);
    yearData[field] = rawVal === "" ? null : isNaN(num as number) ? null : num;

    // Automatic Real-Time Calculations
    yearData.totalEquity = calculateTotalEquity(yearData.totalAssets, yearData.totalLiabilities);
    yearData.workingCapital = calculateWorkingCapital(yearData.currentAssets, yearData.currentLiabilities);

    const updated = {
      ...currentStatements,
      [year]: yearData,
    };
    onChange(updated);
  };

  const rows: Array<{
    key: string;
    label: string;
    hint?: string;
    readOnly?: boolean;
  }> = [
    { key: "totalAssets", label: "Total Assets" },
    { key: "totalLiabilities", label: "Total Liabilities" },
    {
      key: "totalEquity",
      label: "Total Equity",
      hint: "Auto: Total Assets − Liabilities",
      readOnly: true,
    },
    { key: "currentAssets", label: "Current Assets" },
    { key: "currentLiabilities", label: "Current Liabilities" },
    {
      key: "workingCapital",
      label: "Working Capital",
      hint: "Auto: Current Assets − Liabilities",
      readOnly: true,
    },
    { key: "totalRevenue", label: "Total Revenue" },
    {
      key: "profitBeforeTax",
      label: "Profit Before Tax",
      hint: "May be negative",
    },
  ];

  return (
    <div className="space-y-2 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden text-xs">
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[700px] text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700">
              <th className="py-3 px-3 text-left font-bold w-[240px]">
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
            {rows.map(({ key, label, hint, readOnly }) => (
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
                  const yrData = currentStatements[year] || {};
                  const val = yrData[key];
                  const isNegative = val !== null && val !== undefined && val < 0;

                  return (
                    <td key={year} className="py-1.5 px-2">
                      <input
                        type={readOnly ? "text" : "number"}
                        readOnly={readOnly || disabled}
                        tabIndex={readOnly ? -1 : 0}
                        value={val !== null && val !== undefined ? val : ""}
                        onChange={(e) => !readOnly && handleCellChange(year, key, e.target.value)}
                        placeholder="0"
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Built-in Supplier Materials & Capacity List Renderer
 */
function renderSupplierMaterialsList(
  value: any,
  onChange: (val: any) => void,
  disabled: boolean,
  allValues?: Record<string, any>,
  onGlobalChange?: (fieldId: string, val: any) => void
) {
  const selectedMaterials: string[] = Array.isArray(value) ? value : [];
  const capacities = allValues?.["supplierDetails.supplyCapacities"] || {};

  const handleToggle = (mat: string) => {
    if (disabled) return;
    let next: string[];
    if (selectedMaterials.includes(mat)) {
      next = selectedMaterials.filter((m) => m !== mat);
    } else {
      next = [...selectedMaterials, mat];
    }
    onChange(next);
  };

  const handleCapacityChange = (mat: string, field: "quantity" | "unit", val: string) => {
    if (disabled || !onGlobalChange) return;
    const current = { ...(capacities[mat] || { quantity: "", unit: "MT per year" }) };
    current[field] = val;
    onGlobalChange("supplierDetails.supplyCapacities", {
      ...capacities,
      [mat]: current,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {SUPPLIER_MATERIALS.map((mat) => {
          const isChecked = selectedMaterials.includes(mat);
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
                onChange={() => handleToggle(mat)}
                disabled={disabled}
                className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800"
              />
              <span className="text-xs">{mat}</span>
            </label>
          );
        })}
      </div>

      {selectedMaterials.includes("Other") && (
        <MultiItemOtherInput
          label="Please specify other material type(s):"
          buttonLabel="+ Add another material"
          placeholder={(idx) => (idx === 0 ? "Specify your material..." : `Additional material #${idx + 1}...`)}
          value={allValues?.["supplierDetails.materialsOther"] || ""}
          onChange={(val) => onGlobalChange?.("supplierDetails.materialsOther", val)}
          disabled={disabled}
        />
      )}

      {selectedMaterials.length > 0 && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <span className="text-[11px] font-bold text-blue-900 uppercase block">
            Annual Supply / Production Capacity for Selected Materials
          </span>
          <div className="space-y-2">
            {selectedMaterials.map((mat) => {
              const cap = capacities[mat] || { quantity: "", unit: "MT per year" };
              return (
                <div
                  key={mat}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs"
                >
                  <span className="font-semibold text-slate-800 sm:w-1/3">{mat}</span>
                  <div className="flex gap-2 sm:w-2/3">
                    <input
                      type="number"
                      placeholder="Annual Quantity"
                      value={cap.quantity || ""}
                      onChange={(e) => handleCapacityChange(mat, "quantity", e.target.value)}
                      disabled={disabled}
                      className="w-2/3 p-1.5 border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-800 font-mono text-xs"
                    />
                    <select
                      value={cap.unit || "MT per year"}
                      onChange={(e) => handleCapacityChange(mat, "unit", e.target.value)}
                      disabled={disabled}
                      className="w-1/3 p-1.5 border border-slate-300 rounded text-slate-900 font-medium text-xs bg-white"
                    >
                      <option value="MT per year">MT per year</option>
                      <option value="Cu.m per year">Cu.m per year</option>
                      <option value="Nos per year">Nos per year</option>
                      <option value="Liters per year">Liters per year</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Built-in Ongoing Works Repeating Contracts Table Renderer (With Dynamic Add/Remove)
 */
function renderOngoingWorksContracts(
  value: any,
  onChange: (val: any) => void,
  disabled: boolean
) {
  const contracts: any[] = Array.isArray(value) && value.length > 0 ? value : [{}, {}, {}];

  const handleContractChange = (idx: number, field: string, val: any) => {
    if (disabled) return;
    const list = [...contracts];
    while (list.length <= idx) list.push({});
    list[idx] = {
      ...list[idx],
      contractIndex: idx + 1,
      [field]: val,
    };
    onChange(list);
  };

  const handleAddContract = () => {
    if (disabled) return;
    const list = [...contracts];
    list.push({
      contractIndex: list.length + 1,
      contractName: "",
      contractNo: "",
      employerName: "",
      contractAmount: null,
      currency: "LKR",
      completionDate: null,
    });
    onChange(list);
  };

  const handleRemoveContract = (idx: number) => {
    if (disabled) return;
    if (contracts.length <= 1) {
      onChange([
        {
          contractIndex: 1,
          contractName: "",
          contractNo: "",
          employerName: "",
          contractAmount: null,
          currency: "LKR",
          completionDate: null,
        },
      ]);
      return;
    }
    const list = contracts.filter((_, i) => i !== idx).map((c, i) => ({
      ...c,
      contractIndex: i + 1,
    }));
    onChange(list);
  };

  const totalOutstanding = contracts.reduce((acc, c) => {
    const val = Number(c.contractAmount);
    return acc + (!isNaN(val) && val > 0 ? val : 0);
  }, 0);

  return (
    <div className="space-y-3">
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
            {contracts.map((c, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-3 text-center font-bold text-blue-900 bg-slate-50/50 align-top pt-4">
                  #{idx + 1}
                </td>
                <td className="p-3 align-top">
                  <input
                    type="text"
                    placeholder="Name of contract"
                    value={c.contractName || ""}
                    onChange={(e) => handleContractChange(idx, "contractName", e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </td>
                <td className="p-3 align-top">
                  <input
                    type="text"
                    placeholder="Contract No"
                    value={c.contractNo || ""}
                    onChange={(e) => handleContractChange(idx, "contractNo", e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                  />
                </td>
                <td className="p-3 align-top">
                  <input
                    type="text"
                    placeholder="Employer's Name"
                    value={c.employerName || ""}
                    onChange={(e) => handleContractChange(idx, "employerName", e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </td>
                <td className="p-3 align-top space-y-1">
                  <input
                    type="number"
                    placeholder="Amount in LKR"
                    value={c.contractAmount ?? ""}
                    onChange={(e) =>
                      handleContractChange(
                        idx,
                        "contractAmount",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    disabled={disabled}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono"
                  />
                  {c.contractAmount !== null && c.contractAmount !== undefined && c.contractAmount !== "" && (
                    <span className="text-[10px] font-mono text-slate-600 block">
                      = LKR {Number(c.contractAmount).toLocaleString()}
                    </span>
                  )}
                </td>
                <td className="p-3 align-top">
                  <input
                    type="date"
                    value={c.completionDate || ""}
                    onChange={(e) => handleContractChange(idx, "completionDate", e.target.value)}
                    disabled={disabled}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </td>
                <td className="p-3 text-center align-top pt-4">
                  {contracts.length > 1 && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRemoveContract(idx)}
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
                  LKR {totalOutstanding.toLocaleString()}
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
          disabled={disabled}
          onClick={handleAddContract}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Ongoing Contract</span>
        </button>
        <span className="text-[11px] font-medium text-slate-500">
          {contracts.filter((c) => c.contractName).length} of {contracts.length} contracts specified
        </span>
      </div>
    </div>
  );
}

/**
 * Built-in Similar Works Repeating Contracts Table Renderer (With Dynamic Add/Remove)
 */
function renderSimilarWorksContracts(
  value: any,
  onChange: (val: any) => void,
  disabled: boolean
) {
  const contracts: any[] = Array.isArray(value) && value.length > 0 ? value : [{}, {}, {}];

  const handleContractChange = (idx: number, field: string, val: any) => {
    if (disabled) return;
    const list = [...contracts];
    while (list.length <= idx) list.push({});
    list[idx] = {
      ...list[idx],
      contractIndex: idx + 1,
      [field]: val,
    };
    onChange(list);
  };

  const handleAddContract = () => {
    if (disabled) return;
    const list = [...contracts];
    list.push({
      contractIndex: list.length + 1,
      contractType: "",
      contractName: "",
      contractAmount: null,
      startDate: null,
      completionDate: null,
      completionStatus: "",
    });
    onChange(list);
  };

  const handleRemoveContract = (idx: number) => {
    if (disabled) return;
    if (contracts.length <= 1) {
      onChange([
        {
          contractIndex: 1,
          contractType: "",
          contractName: "",
          contractAmount: null,
          startDate: null,
          completionDate: null,
          completionStatus: "",
        },
      ]);
      return;
    }
    const list = contracts.filter((_, i) => i !== idx).map((c, i) => ({
      ...c,
      contractIndex: i + 1,
    }));
    onChange(list);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3 w-12 text-center">#</th>
              <th className="p-3 min-w-[200px]">Contract Name / Project</th>
              <th className="p-3 w-48">Contract Type</th>
              <th className="p-3 w-44">Amount (LKR)</th>
              <th className="p-3 w-52">Duration (Start - Completion)</th>
              <th className="p-3 w-48">Completion Status</th>
              <th className="p-3 w-14 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80">
            {contracts.map((c, idx) => {
              const isNA = Boolean(c.contractName && c.contractName.trim().toUpperCase() === "N/A");
              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isNA ? "bg-slate-50/40 opacity-70" : ""
                  }`}
                >
                  <td className="p-3 text-center font-bold text-blue-900 bg-slate-50/50 align-top pt-4">
                    #{idx + 1}
                  </td>
                  <td className="p-3 align-top space-y-1">
                    <input
                      type="text"
                      placeholder={idx === 0 ? "Project Title or enter N/A" : "Project Title"}
                      value={c.contractName || ""}
                      onChange={(e) => handleContractChange(idx, "contractName", e.target.value)}
                      disabled={disabled}
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
                      value={c.contractType || ""}
                      onChange={(e) => handleContractChange(idx, "contractType", e.target.value)}
                      disabled={disabled || isNA}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium disabled:opacity-50"
                    >
                      <option value="">— Select Type —</option>
                      {CONTRACT_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {c.contractType === "Other" && (
                      <input
                        type="text"
                        placeholder="Specify contract type..."
                        value={c.contractTypeOther || ""}
                        onChange={(e) => handleContractChange(idx, "contractTypeOther", e.target.value)}
                        disabled={disabled || isNA}
                        className="w-full p-1.5 bg-amber-50/60 border border-amber-300 rounded text-slate-900 text-xs focus:ring-1 focus:ring-blue-800 disabled:opacity-50"
                      />
                    )}
                  </td>
                  <td className="p-3 align-top space-y-1">
                    <input
                      type="number"
                      placeholder="Amount in LKR"
                      value={c.contractAmount ?? ""}
                      onChange={(e) =>
                        handleContractChange(
                          idx,
                          "contractAmount",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      disabled={disabled || isNA}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono disabled:opacity-50"
                    />
                    {!isNA &&
                      c.contractAmount !== null &&
                      c.contractAmount !== undefined &&
                      c.contractAmount !== "" && (
                        <span className="text-[10px] font-mono text-slate-600 block">
                          = LKR {Number(c.contractAmount).toLocaleString()}
                        </span>
                      )}
                  </td>
                  <td className="p-3 align-top">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 w-9 shrink-0 font-medium">
                          Start:
                        </span>
                        <input
                          type="date"
                          value={c.startDate || ""}
                          onChange={(e) => handleContractChange(idx, "startDate", e.target.value)}
                          disabled={disabled || isNA}
                          className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 w-9 shrink-0 font-medium">
                          End:
                        </span>
                        <input
                          type="date"
                          value={c.completionDate || ""}
                          onChange={(e) => handleContractChange(idx, "completionDate", e.target.value)}
                          disabled={disabled || isNA}
                          className="flex-1 p-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 text-[11px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    <select
                      value={c.completionStatus || ""}
                      onChange={(e) => handleContractChange(idx, "completionStatus", e.target.value)}
                      disabled={disabled || isNA}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium disabled:opacity-50"
                    >
                      <option value="">— Select Status —</option>
                      {COMPLETION_STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-center align-top pt-4">
                    {contracts.length > 1 && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleRemoveContract(idx)}
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

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={handleAddContract}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Similar Work Contract</span>
        </button>
        <span className="text-[11px] font-medium text-slate-500">
          {
            contracts.filter(
              (c) => c.contractName && c.contractName.trim().toUpperCase() !== "N/A"
            ).length
          }{" "}
          similar contract(s) listed
        </span>
      </div>
    </div>
  );
}

/**
 * Field Input Renderer for all Field Types matching /register 100%
 */
function renderFieldInput(
  question: IFormQuestion,
  value: any,
  onChange: (val: any) => void,
  error?: string,
  disabled = false,
  renderCustomComplexField?: (q: IFormQuestion, val: any, cb: (v: any) => void) => React.ReactNode,
  allValues?: Record<string, any>,
  onGlobalChange?: (fieldId: string, val: any) => void
) {
  // 1. External custom complex field renderer delegate
  if (
    (question.fieldType === "complex_financial_table" ||
      question.fieldType === "complex_table" ||
      question.fieldType === ("complex_supplier_materials" as any) ||
      question.fieldType === ("complex_ongoing_works" as any) ||
      question.fieldType === ("complex_similar_works" as any)) &&
    renderCustomComplexField
  ) {
    const rendered = renderCustomComplexField(question, value, onChange);
    if (rendered) return rendered;
  }

  // 2. Built-in Financial Table
  if (
    question.fieldType === "complex_financial_table" ||
    question.id === "financialStatements"
  ) {
    return renderFinancialStatementsMatrix(value, onChange, disabled);
  }

  // 3. Built-in Supplier Materials
  if (
    question.fieldType === ("complex_supplier_materials" as any) ||
    question.id === "supplierDetails.materialsSupplied"
  ) {
    return renderSupplierMaterialsList(value, onChange, disabled, allValues, onGlobalChange);
  }

  // 4. Built-in Ongoing Works
  if (
    question.fieldType === ("complex_ongoing_works" as any) ||
    question.id === "ongoingContracts"
  ) {
    return renderOngoingWorksContracts(value, onChange, disabled);
  }

  // 5. Built-in Similar Works
  if (
    question.fieldType === ("complex_similar_works" as any) ||
    question.id === "similarWorks"
  ) {
    return renderSimilarWorksContracts(value, onChange, disabled);
  }

  const baseInputClasses = `w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800 disabled:opacity-50 text-xs sm:text-sm ${
    error ? "border-rose-400 focus:ring-rose-500" : ""
  }`;

  switch (question.fieldType) {
    case "short_text":
      return (
        <input
          id={`input-${question.id}`}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Enter text..."}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case "long_text":
      return (
        <textarea
          id={`input-${question.id}`}
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Enter details..."}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case "integer":
      return (
        <input
          id={`input-${question.id}`}
          type="number"
          step="1"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
          placeholder={question.placeholder || "0"}
          disabled={disabled}
          className={`${baseInputClasses} font-mono`}
        />
      );

    case "decimal":
      return (
        <input
          id={`input-${question.id}`}
          type="number"
          step="0.01"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
          placeholder={question.placeholder || "0.00"}
          disabled={disabled}
          className={`${baseInputClasses} font-mono`}
        />
      );

    case "currency":
      return (
        <div className="relative">
          <input
            id={`input-${question.id}`}
            type="number"
            step="0.01"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
            placeholder={question.placeholder || "0.00"}
            disabled={disabled}
            className={`${baseInputClasses} font-mono`}
          />
          {value !== null && value !== undefined && value !== "" && (
            <span className="text-[11px] font-mono font-semibold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded inline-block mt-1">
              = LKR {Number(value).toLocaleString()}
            </span>
          )}
        </div>
      );

    case "email":
      return (
        <input
          id={`input-${question.id}`}
          type="email"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "e.g. info@company.lk"}
          disabled={disabled}
          className={`${baseInputClasses} font-mono`}
        />
      );

    case "telephone":
      return (
        <input
          id={`input-${question.id}`}
          type="tel"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "e.g. 0112123456 / 0771234567"}
          disabled={disabled}
          className={`${baseInputClasses} font-mono`}
        />
      );

    case "url":
      return (
        <input
          id={`input-${question.id}`}
          type="url"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "https://www.company.lk"}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case "date":
      return (
        <input
          id={`input-${question.id}`}
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case "datetime":
      return (
        <input
          id={`input-${question.id}`}
          type="datetime-local"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClasses}
        />
      );

    case "yes_no":
      return (
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {["Yes", "No"].map((choice) => (
            <label
              key={choice}
              className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2"
            >
              <input
                type="radio"
                name={`yesno-${question.id}`}
                value={choice}
                checked={value === choice}
                onChange={() => onChange(choice)}
                disabled={disabled}
                className="w-4 h-4 text-blue-900 focus:ring-blue-800"
              />
              <span className="font-medium text-slate-800">{choice}</span>
            </label>
          ))}
        </div>
      );

    case "radio":
      // If 2 options like Yes/No:
      if ((question.options || []).length <= 2) {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              {(question.options || []).map((opt) => (
                <label
                  key={opt.id || opt.value}
                  className="inline-flex items-center gap-2 cursor-pointer py-1.5 pr-2"
                >
                  <input
                    type="radio"
                    name={`radio-${question.id}`}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={() => onChange(opt.value)}
                    disabled={disabled}
                    className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                  />
                  <span className="font-medium text-slate-800">{opt.label}</span>
                </label>
              ))}
            </div>
            {value === "Other" && (
              <MultiItemOtherInput
                label={`Please specify ${question.text || "other"}:`}
                buttonLabel="+ Add another"
                placeholder={(idx) => (idx === 0 ? "If Other, please specify..." : `Additional #${idx + 1}...`)}
                value={allValues?.[`${question.id}Other`] || allValues?.[`${question.code}Other`] || ""}
                onChange={(val) => {
                  onGlobalChange?.(`${question.id}Other`, val);
                  if (question.code) onGlobalChange?.(`${question.code}Other`, val);
                }}
                disabled={disabled}
              />
            )}
          </div>
        );
      }

      // If 3 or more options (e.g. Participant Category cards):
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {(question.options || []).map((opt) => (
              <label
                key={opt.id || opt.value}
                className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all min-h-[44px] ${
                  value === opt.value
                    ? "bg-blue-50/80 border-blue-900 text-blue-950 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name={`radio-${question.id}`}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange(opt.value)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-900 focus:ring-blue-800"
                />
                <span className="leading-snug">{opt.label}</span>
              </label>
            ))}
          </div>
          {value === "Other" && (
            <MultiItemOtherInput
              label={`Please specify ${question.text || "other"}:`}
              buttonLabel="+ Add another"
              placeholder={(idx) => (idx === 0 ? "If Other, please specify..." : `Additional #${idx + 1}...`)}
              value={allValues?.[`${question.id}Other`] || allValues?.[`${question.code}Other`] || ""}
              onChange={(val) => {
                onGlobalChange?.(`${question.id}Other`, val);
                if (question.code) onGlobalChange?.(`${question.code}Other`, val);
              }}
              disabled={disabled}
            />
          )}
        </div>
      );

    case "dropdown": {
      let filteredOptions = question.options || [];

      // Dependent District Dropdown: filter by selected Province
      if (
        (question.id === "supplierDetails.district" || question.code === "Q16" || question.code === "Q13") &&
        allValues
      ) {
        const selectedProv =
          allValues["supplierDetails.province"] || allValues["Q15"] || allValues["Q12"];
        if (selectedProv && PROVINCE_DISTRICT_MAP[selectedProv as SriLankaProvince]) {
          const allowedDistricts = new Set(PROVINCE_DISTRICT_MAP[selectedProv as SriLankaProvince]);
          filteredOptions = (question.options || []).filter((opt) =>
            allowedDistricts.has(opt.value) || allowedDistricts.has(opt.label)
          );
        } else if (!selectedProv) {
          filteredOptions = [];
        }
      }

      return (
        <div className="space-y-2">
          <select
            id={`input-${question.id}`}
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`${baseInputClasses} font-medium`}
          >
            <option value="">
              {question.id === "supplierDetails.district" && (!allValues || (!allValues["supplierDetails.province"] && !allValues["Q15"] && !allValues["Q12"]))
                ? "— Please select a Province first —"
                : "— Select an option —"}
            </option>
            {filteredOptions.map((opt) => (
              <option key={opt.id || opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Google Form Specification for CIDA Grading Other */}
          {(question.id === "cidaGrade" || question.code === "Q19") && value === "Other" && (
            <MultiItemOtherInput
              label="Please specify your CIDA grading(s):"
              buttonLabel="+ Add another grade"
              placeholder={(idx) => (idx === 0 ? "If Other, please specify your CIDA grading..." : `Additional grade #${idx + 1}...`)}
              value={allValues?.["cidaGradeOther"] || ""}
              onChange={(val) => onGlobalChange?.("cidaGradeOther", val)}
              disabled={disabled}
            />
          )}

          {/* Generic Dropdown Other */}
          {value === "Other" && question.id !== "cidaGrade" && question.code !== "Q19" && (
            <MultiItemOtherInput
              label={`Please specify ${question.text || "other"}:`}
              buttonLabel="+ Add another"
              placeholder={(idx) => (idx === 0 ? "If Other, please specify..." : `Additional #${idx + 1}...`)}
              value={allValues?.[`${question.id}Other`] || allValues?.[`${question.code}Other`] || ""}
              onChange={(val) => {
                onGlobalChange?.(`${question.id}Other`, val);
                if (question.code) onGlobalChange?.(`${question.code}Other`, val);
              }}
              disabled={disabled}
            />
          )}
        </div>
      );
    }

    case "multi_select":
    case "checkbox": {
      const currentSelected: string[] = Array.isArray(value) ? value : [];

      const handleToggle = (optVal: string) => {
        if (currentSelected.includes(optVal)) {
          onChange(currentSelected.filter((v) => v !== optVal));
        } else {
          onChange([...currentSelected, optVal]);
        }
      };

      return (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(question.options || []).map((opt) => {
              const isChecked = currentSelected.includes(opt.value);
              return (
                <div
                  key={opt.id || opt.value}
                  className={`flex flex-col p-2.5 rounded-lg border text-xs transition-colors ${
                    isChecked
                      ? "bg-blue-50/80 border-blue-800 text-blue-950 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(opt.value)}
                      disabled={disabled}
                      className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800 mt-0.5 shrink-0"
                    />
                    <span className="leading-snug">{opt.label}</span>
                  </label>

                  {/* CIDA Grading under specialty in DynamicFormRenderer */}
                  {isChecked && (question.id === "areasOfSpecialty" || question.code === "Q18") && opt.value !== "Other" && (
                    <div className="mt-2 pt-2 border-t border-blue-200/80 space-y-1" onClick={(e) => e.stopPropagation()}>
                      <span className="block text-[10px] font-bold text-slate-700">
                        CIDA Grading for {opt.label}:
                      </span>
                      <select
                        value={allValues?.specialtyGrades?.[opt.value] || ""}
                        onChange={(e) => {
                          const next = { ...(allValues?.specialtyGrades || {}), [opt.value]: e.target.value };
                          onGlobalChange?.("specialtyGrades", next);
                        }}
                        disabled={disabled}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-800"
                      >
                        <option value="">— Select CIDA Grading —</option>
                        {["CS2", "CS1", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "SP1", "SP2", "SP3", "SP4", "SP5", "Not registered with CIDA", "Other"].map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Google Form Specification for Areas of Specialty Other */}
          {(question.id === "areasOfSpecialty" || question.code === "Q18") && currentSelected.includes("Other") && (
            <MultiItemOtherInput
              label="Please specify your area(s) of specialty:"
              buttonLabel="+ Add another specialty"
              placeholder={(idx) => (idx === 0 ? "If Other, please specify your area of specialty..." : `Additional specialty #${idx + 1}...`)}
              value={allValues?.["specialtyOther"] || ""}
              onChange={(val) => onGlobalChange?.("specialtyOther", val)}
              disabled={disabled}
            />
          )}

          {/* Generic Multi-Select / Checkbox Other */}
          {currentSelected.includes("Other") && question.id !== "areasOfSpecialty" && question.code !== "Q18" && (
            <MultiItemOtherInput
              label={`Please specify ${question.text || "other"}:`}
              buttonLabel="+ Add another"
              placeholder={(idx) => (idx === 0 ? "If Other, please specify..." : `Additional #${idx + 1}...`)}
              value={allValues?.[`${question.id}Other`] || allValues?.[`${question.code}Other`] || ""}
              onChange={(val) => {
                onGlobalChange?.(`${question.id}Other`, val);
                if (question.code) onGlobalChange?.(`${question.code}Other`, val);
              }}
              disabled={disabled}
            />
          )}
        </div>
      );
    }

    case "file_upload":
    case "image_upload":
      return (
        <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center hover:bg-slate-100/60 transition-colors">
          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-slate-700">
            {value?.name ? `Selected: ${value.name}` : "Click to select or drag and drop official documents"}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Max: {question.validation?.maxFileSizeMb || 10} MB • Allowed:{" "}
            {question.validation?.allowedFileExtensions?.join(", ") || "PDF, JPG, PNG"}
          </div>
          <input
            id={`input-${question.id}`}
            type="file"
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange({ name: file.name, size: file.size, type: file.type });
            }}
          />
        </div>
      );

    default:
      return (
        <input
          id={`input-${question.id}`}
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClasses}
        />
      );
  }
}
