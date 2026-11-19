"use client";

import React from "react";
import { SchemaValidationReport } from "@/lib/questionnaire-schema-validator";
import { X, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SchemaValidationReport | null;
  onProceedPublish?: () => void;
  canPublish?: boolean;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  report,
  onProceedPublish,
  canPublish = false,
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b1f3a] text-white flex items-center justify-between border-b border-[#183659]">
          <div className="flex items-center gap-2">
            {report.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <h3 className="text-sm font-bold text-white">
              {report.isValid ? "Schema Validation Passed" : "Schema Validation Report"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs leading-relaxed">
          {report.isValid ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
              <div className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Questionnaire schema is valid and ready to publish.</span>
              </div>
              <p className="text-xs text-emerald-700">
                All sections, questions, choice options, and conditional rules passed structural verification.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
              <div className="font-bold text-sm flex items-center gap-2 text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Cannot publish. {report.errors.length} validation errors must be fixed:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-rose-700 text-xs">
                {report.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {report.warnings.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Notice ({report.warnings.length} items):</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-700 text-[11px]">
                {report.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            Close
          </button>

          {report.isValid && onProceedPublish && canPublish && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onProceedPublish();
              }}
              className="px-5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Proceed to Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
