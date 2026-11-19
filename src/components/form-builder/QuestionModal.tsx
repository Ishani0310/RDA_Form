"use client";

import React, { useState, useEffect } from "react";
import {
  IFormQuestion,
  FormFieldType,
  IQuestionOption,
  IFormSection,
} from "@/types/questionnaire";
import {
  X,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Workflow,
  Layers,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (question: IFormQuestion, targetSectionId?: string) => void;
  initialQuestion?: IFormQuestion | null;
  allSections: IFormSection[];
  targetSectionId: string;
}

const FIELD_TYPE_OPTIONS: Array<{ value: FormFieldType; label: string; group: string }> = [
  { value: "short_text", label: "Short Text", group: "Text" },
  { value: "long_text", label: "Long Text (Textarea)", group: "Text" },
  { value: "email", label: "Email Address", group: "Text" },
  { value: "telephone", label: "Telephone / Phone", group: "Text" },
  { value: "url", label: "Website URL", group: "Text" },
  { value: "integer", label: "Integer (Whole Number)", group: "Numeric" },
  { value: "decimal", label: "Decimal Number", group: "Numeric" },
  { value: "currency", label: "Currency (LKR)", group: "Numeric" },
  { value: "date", label: "Date", group: "Date & Time" },
  { value: "datetime", label: "Date & Time", group: "Date & Time" },
  { value: "yes_no", label: "Yes / No Toggle", group: "Choice" },
  { value: "radio", label: "Radio (Single Choice)", group: "Choice" },
  { value: "dropdown", label: "Dropdown (Select)", group: "Choice" },
  { value: "multi_select", label: "Multi Select (Checkboxes)", group: "Choice" },
  { value: "checkbox", label: "Checkbox Group", group: "Choice" },
  { value: "file_upload", label: "File Upload", group: "Files" },
  { value: "image_upload", label: "Image Upload", group: "Files" },
];

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialQuestion,
  allSections,
  targetSectionId,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "options" | "validation" | "conditional">("general");

  const [sectionId, setSectionId] = useState(targetSectionId);
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [helpText, setHelpText] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [fieldType, setFieldType] = useState<FormFieldType>("short_text");
  const [isRequired, setIsRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);

  // Options state
  const [options, setOptions] = useState<IQuestionOption[]>([]);

  // Validation state
  const [minLength, setMinLength] = useState<number | "">("");
  const [maxLength, setMaxLength] = useState<number | "">("");
  const [pattern, setPattern] = useState("");
  const [patternErrorMessage, setPatternErrorMessage] = useState("");
  const [minValue, setMinValue] = useState<number | "">("");
  const [maxValue, setMaxValue] = useState<number | "">("");
  const [decimalPlaces, setDecimalPlaces] = useState<number | "">("");
  const [maxFileSizeMb, setMaxFileSizeMb] = useState<number | "">(10);
  const [allowedFileExtensions, setAllowedFileExtensions] = useState("pdf, jpg, png");

  // Conditional logic state
  const [condEnabled, setCondEnabled] = useState(false);
  const [condDependsOn, setCondDependsOn] = useState("");
  const [condOperator, setCondOperator] = useState<any>("equals");
  const [condValue, setCondValue] = useState("");

  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (initialQuestion) {
      setId(initialQuestion.id || "");
      setCode(initialQuestion.code || "");
      setText(initialQuestion.text || "");
      setDescription(initialQuestion.description || "");
      setHelpText(initialQuestion.helpText || "");
      setPlaceholder(initialQuestion.placeholder || "");
      setFieldType(initialQuestion.fieldType || "short_text");
      setIsRequired(initialQuestion.isRequired ?? false);
      setDefaultValue(String(initialQuestion.defaultValue ?? ""));
      setDisplayOrder(initialQuestion.displayOrder || 1);

      setOptions(initialQuestion.options ? [...initialQuestion.options] : []);

      setMinLength(initialQuestion.validation?.minLength ?? "");
      setMaxLength(initialQuestion.validation?.maxLength ?? "");
      setPattern(initialQuestion.validation?.pattern || "");
      setPatternErrorMessage(initialQuestion.validation?.patternErrorMessage || "");
      setMinValue(initialQuestion.validation?.minValue ?? "");
      setMaxValue(initialQuestion.validation?.maxValue ?? "");
      setDecimalPlaces(initialQuestion.validation?.decimalPlaces ?? "");
      setMaxFileSizeMb(initialQuestion.validation?.maxFileSizeMb ?? 10);
      setAllowedFileExtensions(initialQuestion.validation?.allowedFileExtensions?.join(", ") || "pdf, jpg, png");

      setCondEnabled(Boolean(initialQuestion.conditionalLogic?.enabled));
      setCondDependsOn(initialQuestion.conditionalLogic?.dependsOnQuestionId || "");
      setCondOperator(initialQuestion.conditionalLogic?.operator || "equals");
      setCondValue(String(initialQuestion.conditionalLogic?.value ?? ""));
    } else {
      const generatedId = `q_${Date.now().toString(36)}`;
      setId(generatedId);
      setCode("Q_NEW");
      setText("");
      setDescription("");
      setHelpText("");
      setPlaceholder("");
      setFieldType("short_text");
      setIsRequired(false);
      setDefaultValue("");
      setDisplayOrder(1);

      setOptions([
        { id: "opt-1", value: "Option 1", label: "Option 1", displayOrder: 1, isActive: true },
        { id: "opt-2", value: "Option 2", label: "Option 2", displayOrder: 2, isActive: true },
      ]);

      setMinLength("");
      setMaxLength("");
      setPattern("");
      setPatternErrorMessage("");
      setMinValue("");
      setMaxValue("");
      setDecimalPlaces("");
      setMaxFileSizeMb(10);
      setAllowedFileExtensions("pdf, jpg, png");

      setCondEnabled(false);
      setCondDependsOn("");
      setCondOperator("equals");
      setCondValue("");
    }
    setSectionId(targetSectionId);
    setActiveTab("general");
    setValidationError("");
  }, [initialQuestion, isOpen, targetSectionId]);

  if (!isOpen) return null;

  // Collect all available questions for conditional dependencies
  const otherQuestions: Array<{ id: string; code: string; text: string }> = [];
  allSections.forEach((sec) => {
    (sec.questions || []).forEach((q) => {
      if (q.id !== id) {
        otherQuestions.push({ id: q.id, code: q.code, text: q.text });
      }
    });
  });

  const handleAddOption = () => {
    const nextIdx = options.length + 1;
    setOptions([
      ...options,
      {
        id: `opt-${Date.now().toString(36)}-${nextIdx}`,
        value: `Option ${nextIdx}`,
        label: `Option ${nextIdx}`,
        displayOrder: nextIdx,
        isActive: true,
      },
    ]);
  };

  const handleUpdateOption = (index: number, key: keyof IQuestionOption, val: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [key]: val };
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!text.trim()) {
      setValidationError("Question text is required.");
      setActiveTab("general");
      return;
    }
    if (!code.trim()) {
      setValidationError("Question code is required.");
      setActiveTab("general");
      return;
    }

    const isChoiceType = ["radio", "dropdown", "multi_select", "checkbox"].includes(fieldType);
    if (isChoiceType && options.length === 0) {
      setValidationError("At least one option is required for choice field types.");
      setActiveTab("options");
      return;
    }

    const questionObj: IFormQuestion = {
      id: id || `q_${Date.now().toString(36)}`,
      code: code.trim().toUpperCase(),
      number: initialQuestion?.number || 1,
      text: text.trim(),
      description: description.trim() || undefined,
      helpText: helpText.trim() || undefined,
      placeholder: placeholder.trim() || undefined,
      fieldType,
      isRequired,
      defaultValue: defaultValue || undefined,
      displayOrder: Number(displayOrder) || 1,
      options: isChoiceType ? options : undefined,
      validation: {
        minLength: minLength !== "" ? Number(minLength) : undefined,
        maxLength: maxLength !== "" ? Number(maxLength) : undefined,
        pattern: pattern.trim() || undefined,
        patternErrorMessage: patternErrorMessage.trim() || undefined,
        minValue: minValue !== "" ? Number(minValue) : undefined,
        maxValue: maxValue !== "" ? Number(maxValue) : undefined,
        decimalPlaces: decimalPlaces !== "" ? Number(decimalPlaces) : undefined,
        maxFileSizeMb: maxFileSizeMb !== "" ? Number(maxFileSizeMb) : undefined,
        allowedFileExtensions: allowedFileExtensions
          ? allowedFileExtensions.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
          : undefined,
      },
      conditionalLogic: condEnabled
        ? {
            enabled: true,
            dependsOnQuestionId: condDependsOn,
            operator: condOperator,
            value: condValue,
          }
        : undefined,
    };

    onSave(questionObj, sectionId);
    onClose();
  };

  const isChoiceType = ["radio", "dropdown", "multi_select", "checkbox"].includes(fieldType);
  const isNumericType = ["integer", "decimal", "currency"].includes(fieldType);
  const isFileType = ["file_upload", "image_upload"].includes(fieldType);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b1f3a] text-white flex items-center justify-between border-b border-[#183659]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#0b1f3a] flex items-center justify-center font-bold text-xs">
              {code || "Q"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                {initialQuestion ? "Edit Questionnaire Question" : "Add New Questionnaire Question"}
              </h3>
              <p className="text-[11px] text-slate-300">
                Configure field parameters, data validations and conditional rules
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "general"
                ? "border-blue-900 text-blue-900 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>General Info</span>
          </button>

          {isChoiceType && (
            <button
              type="button"
              onClick={() => setActiveTab("options")}
              className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "options"
                  ? "border-blue-900 text-blue-900 bg-white"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Options ({options.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("validation")}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "validation"
                ? "border-blue-900 text-blue-900 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Validation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("conditional")}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "conditional"
                ? "border-blue-900 text-blue-900 bg-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>Conditional Logic {condEnabled && "•"}</span>
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="mx-5 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Assign to Section <span className="text-blue-900">*</span>
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  {allSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.code}: {sec.title}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400">Move or place this question inside this section</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Question Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g., Q_WEBSITE, Q05"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Unique alphanumeric code</span>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Field Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={fieldType}
                    onChange={(e) => setFieldType(e.target.value as FormFieldType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium"
                  >
                    {FIELD_TYPE_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label} ({f.group})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Question Text (Label) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g., Company Website, Registered Corporate Email"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context shown below the question label..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="e.g., https://www.company.lk"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Help Text / Hint</label>
                  <input
                    type="text"
                    value={helpText}
                    onChange={(e) => setHelpText(e.target.value)}
                    placeholder="e.g., Must begin with https://"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded focus:ring-blue-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800">Required Field</span>
                    <p className="text-[11px] text-slate-400">
                      Contractors cannot finalize submission without answering this question
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: OPTIONS */}
          {activeTab === "options" && isChoiceType && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Choice Options</h4>
                  <p className="text-[11px] text-slate-400">
                    Define the selectable items for {fieldType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {options.map((opt, oIdx) => (
                  <div
                    key={opt.id || oIdx}
                    className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200"
                  >
                    <span className="w-5 text-center text-slate-400 font-mono font-bold text-[11px]">
                      {oIdx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Label"
                      value={opt.label}
                      onChange={(e) => {
                        handleUpdateOption(oIdx, "label", e.target.value);
                        if (!opt.value || opt.value === opt.label) {
                          handleUpdateOption(oIdx, "value", e.target.value);
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Stored Value"
                      value={opt.value}
                      onChange={(e) => handleUpdateOption(oIdx, "value", e.target.value)}
                      className="w-32 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(oIdx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      title="Remove option"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: VALIDATION */}
          {activeTab === "validation" && (
            <div className="space-y-4">
              {/* Text validation */}
              {!isNumericType && !isFileType && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Minimum Characters</label>
                    <input
                      type="number"
                      value={minLength}
                      onChange={(e) => setMinLength(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g., 3"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Maximum Characters</label>
                    <input
                      type="number"
                      value={maxLength}
                      onChange={(e) => setMaxLength(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g., 150"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Number validation */}
              {isNumericType && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Minimum Value</label>
                    <input
                      type="number"
                      value={minValue}
                      onChange={(e) => setMinValue(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g., 0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Maximum Value</label>
                    <input
                      type="number"
                      value={maxValue}
                      onChange={(e) => setMaxValue(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="e.g., 100000000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* File validation */}
              {isFileType && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Maximum File Size (MB)</label>
                    <input
                      type="number"
                      value={maxFileSizeMb}
                      onChange={(e) => setMaxFileSizeMb(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Allowed File Extensions</label>
                    <input
                      type="text"
                      value={allowedFileExtensions}
                      onChange={(e) => setAllowedFileExtensions(e.target.value)}
                      placeholder="pdf, jpg, png, docx"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Regex pattern */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Regex Pattern (Optional)</label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g., ^https?:\/\/.+"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Custom Error Message</label>
                <input
                  type="text"
                  value={patternErrorMessage}
                  onChange={(e) => setPatternErrorMessage(e.target.value)}
                  placeholder="e.g., Please enter a valid URL starting with https://"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* TAB 4: CONDITIONAL LOGIC */}
          {activeTab === "conditional" && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={condEnabled}
                  onChange={(e) => setCondEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded focus:ring-blue-600"
                />
                <div>
                  <span className="font-bold text-slate-800">Enable Conditional Display</span>
                  <p className="text-[11px] text-slate-400">
                    Only display this question when specific answers are provided in another question
                  </p>
                </div>
              </label>

              {condEnabled && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Depends On Question</label>
                    <select
                      value={condDependsOn}
                      onChange={(e) => setCondDependsOn(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- Select Question --</option>
                      {otherQuestions.map((q) => (
                        <option key={q.id} value={q.id}>
                          [{q.code}] {q.text}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Condition Operator</label>
                      <select
                        value={condOperator}
                        onChange={(e) => setCondOperator(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="equals">Equals (=)</option>
                        <option value="not_equals">Does Not Equal (≠)</option>
                        <option value="contains">Contains</option>
                        <option value="greater_than">Greater Than (&gt;)</option>
                        <option value="less_than">Less Than (&lt;)</option>
                        <option value="is_answered">Is Answered</option>
                        <option value="is_not_answered">Is Not Answered</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Target Value</label>
                      <input
                        type="text"
                        value={condValue}
                        onChange={(e) => setCondValue(e.target.value)}
                        placeholder="e.g., Yes, Contractor"
                        disabled={condOperator === "is_answered" || condOperator === "is_not_answered"}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-lg shadow-sm"
          >
            {initialQuestion ? "Update Question" : "Save Question to Draft"}
          </button>
        </div>
      </div>
    </div>
  );
};
