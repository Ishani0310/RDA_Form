"use client";

import React, { useMemo } from "react";
import {
  IFormQuestion,
  IFormSection,
} from "@/types/questionnaire";
import {
  Edit3,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Workflow,
  HelpCircle,
  FileCheck,
  Hash,
} from "lucide-react";

interface QuestionCardProps {
  question: IFormQuestion;
  index: number;
  totalQuestions: number;
  allSections: IFormSection[];
  currentSectionId: string;
  onEdit: (q: IFormQuestion) => void;
  onDuplicate: (q: IFormQuestion) => void;
  onDelete: (q: IFormQuestion) => void;
  onMoveUp: (q: IFormQuestion) => void;
  onMoveDown: (q: IFormQuestion) => void;
  onMoveToSection: (q: IFormQuestion, targetSectionId: string) => void;
  disabled?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  totalQuestions,
  allSections,
  currentSectionId,
  onEdit,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onMoveToSection,
  disabled = false,
}) => {
  const isChoice = ["radio", "dropdown", "multi_select", "checkbox"].includes(question.fieldType);
  const isFile = ["file_upload", "image_upload"].includes(question.fieldType);

  // Lookup dependent question code if conditional logic is configured
  const depQuestion = useMemo(() => {
    if (!question.conditionalLogic?.enabled || !question.conditionalLogic.dependsOnQuestionId) {
      return null;
    }
    for (const sec of allSections) {
      const found = sec.questions.find((q) => q.id === question.conditionalLogic?.dependsOnQuestionId);
      if (found) return found;
    }
    return null;
  }, [allSections, question.conditionalLogic]);

  const formatOperator = (op?: string) => {
    switch (op) {
      case "equals": return "equals";
      case "not_equals": return "does not equal";
      case "contains": return "contains";
      case "greater_than": return "is greater than";
      case "less_than": return "is less than";
      case "is_answered": return "is answered";
      case "is_not_answered": return "is not answered";
      default: return op || "equals";
    }
  };

  const hasValidationRules =
    question.validation &&
    (question.validation.minLength !== undefined ||
      question.validation.maxLength !== undefined ||
      question.validation.minValue !== undefined ||
      question.validation.maxValue !== undefined ||
      Boolean(question.validation.pattern) ||
      (question.validation.allowedFileExtensions && question.validation.allowedFileExtensions.length > 0) ||
      question.validation.maxFileSizeMb !== undefined);

  return (
    <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group">
      {/* Left Details */}
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Top Badges */}
        <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
          <span className="font-mono font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
            <Hash className="w-2.5 h-2.5 text-blue-600" />
            {question.code}
          </span>

          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase font-mono">
            {question.fieldType.replace(/_/g, " ")}
          </span>

          {question.isRequired ? (
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
              REQUIRED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 font-medium text-[10px]">
              OPTIONAL
            </span>
          )}

          {question.conditionalLogic?.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-[10px]">
              <Workflow className="w-3 h-3" />
              <span>CONDITIONAL</span>
            </span>
          )}

          {isChoice && question.options && (
            <span className="text-slate-400 font-mono text-[10px]">
              {question.options.length} {question.options.length === 1 ? "option" : "options"}
            </span>
          )}
        </div>

        {/* Question Text */}
        <h4 className="text-sm font-bold text-slate-900 leading-snug pt-0.5">
          {question.text}
        </h4>

        {/* Description & Help */}
        {question.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {question.description}
          </p>
        )}

        {question.placeholder && (
          <p className="text-[11px] text-slate-400 italic">
            Placeholder: "{question.placeholder}"
          </p>
        )}

        {question.helpText && (
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{question.helpText}</span>
          </p>
        )}

        {/* Choice Options Chips Preview */}
        {isChoice && question.options && question.options.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Options:</span>
            {question.options.slice(0, 6).map((opt) => (
              <span
                key={opt.id}
                className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/70 font-medium"
              >
                {opt.label}
              </span>
            ))}
            {question.options.length > 6 && (
              <span className="text-[10px] text-slate-400 font-mono font-semibold">
                +{question.options.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Validation summary chips */}
        {hasValidationRules && (
          <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] text-slate-600 pt-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileCheck className="w-3 h-3 text-slate-400" />
              Rules:
            </span>
            {question.validation?.minLength !== undefined && (
              <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px]">
                Min {question.validation.minLength} chars
              </span>
            )}
            {question.validation?.maxLength !== undefined && (
              <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px]">
                Max {question.validation.maxLength} chars
              </span>
            )}
            {question.validation?.minValue !== undefined && (
              <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px]">
                Min: {question.validation.minValue}
              </span>
            )}
            {question.validation?.maxValue !== undefined && (
              <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px]">
                Max: {question.validation.maxValue}
              </span>
            )}
            {question.validation?.pattern && (
              <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px]">
                Pattern: /{question.validation.pattern}/
              </span>
            )}
            {isFile && question.validation?.allowedFileExtensions && question.validation.allowedFileExtensions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px]">
                Allowed: {question.validation.allowedFileExtensions.join(", ")}
              </span>
            )}
            {isFile && question.validation?.maxFileSizeMb !== undefined && (
              <span className="px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono text-[10px]">
                Max: {question.validation.maxFileSizeMb} MB
              </span>
            )}
          </div>
        )}

        {/* Conditional Logic Inspector Detail */}
        {question.conditionalLogic?.enabled && (
          <div className="flex items-center gap-1.5 text-[11px] text-purple-900 bg-purple-50/90 border border-purple-200 px-2.5 py-1 rounded-lg mt-1">
            <Workflow className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="font-bold text-[10px] uppercase tracking-wider text-purple-700">Display Logic:</span>
            <span>
              Show when{" "}
              <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-950 font-bold">
                {depQuestion ? `${depQuestion.code} - ${depQuestion.text.slice(0, 30)}...` : question.conditionalLogic.dependsOnQuestionId}
              </strong>{" "}
              <span className="italic font-medium text-purple-800">{formatOperator(question.conditionalLogic.operator)}</span>
              {question.conditionalLogic.operator !== "is_answered" &&
                question.conditionalLogic.operator !== "is_not_answered" &&
                question.conditionalLogic.value !== undefined &&
                question.conditionalLogic.value !== "" && (
                  <>
                    {" "}
                    <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-950 font-bold">
                      "{String(question.conditionalLogic.value)}"
                    </strong>
                  </>
                )}
            </span>
          </div>
        )}
      </div>

      {/* Right Action Toolbar */}
      <div className="flex items-center gap-1 shrink-0 self-end sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
        {/* Reorder Buttons */}
        <div className="flex items-center mr-1 bg-slate-50 rounded-lg p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={() => onMoveUp(question)}
            disabled={disabled || index === 0}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded disabled:opacity-30"
            title="Move Question Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(question)}
            disabled={disabled || index === totalQuestions - 1}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded disabled:opacity-30"
            title="Move Question Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Move to Section Dropdown */}
        {allSections.length > 1 && (
          <div className="relative inline-block mr-1">
            <select
              aria-label="Move question to another section"
              value=""
              onChange={(e) => {
                if (e.target.value) onMoveToSection(question, e.target.value);
              }}
              disabled={disabled}
              className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-white cursor-pointer"
            >
              <option value="" disabled>Move to...</option>
              {allSections
                .filter((s) => s.id !== currentSectionId)
                .map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.code} - {sec.title}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Edit Button */}
        <button
          type="button"
          onClick={() => onEdit(question)}
          disabled={disabled}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
          title="Edit Question"
        >
          <Edit3 className="w-3.5 h-3.5 text-blue-900" />
          <span className="hidden md:inline">Edit</span>
        </button>

        {/* Duplicate Button */}
        <button
          type="button"
          onClick={() => onDuplicate(question)}
          disabled={disabled}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          title="Duplicate Question"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(question)}
          disabled={disabled}
          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
          title="Delete Question"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
