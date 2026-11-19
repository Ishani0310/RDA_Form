"use client";

import React, { useState } from "react";
import { IQuestionnaireData, IFormSection } from "@/types/questionnaire";
import { DynamicFormRenderer } from "@/components/dynamic-form/DynamicFormRenderer";
import { X, Eye, RefreshCw } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaire: IQuestionnaireData | { sections: IFormSection[]; title?: string; version?: string };
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  questionnaire,
}) => {
  const [testValues, setTestValues] = useState<Record<string, any>>({
    willParticipate: "Yes",
    participantCategory: "Contractor",
  });

  if (!isOpen) return null;

  const handleChange = (fieldId: string, val: any) => {
    setTestValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  const handleReset = () => {
    setTestValues({
      willParticipate: "Yes",
      participantCategory: "Contractor",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-50 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b1f3a] text-white flex items-center justify-between border-b border-[#183659] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Live Questionnaire Preview
              </h3>
              <p className="text-[11px] text-slate-300">
                Interactive contractor experience powered by DynamicFormRenderer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
              title="Reset Test Answers"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <DynamicFormRenderer
            questionnaire={questionnaire}
            values={testValues}
            onChange={handleChange}
            previewMode={true}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Testing answers are held in memory only and will not affect production filings.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-semibold bg-[#0b1f3a] text-white rounded-lg hover:bg-[#132f54]"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
