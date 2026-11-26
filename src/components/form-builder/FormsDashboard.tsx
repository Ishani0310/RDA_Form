"use client";

import React, { useMemo } from "react";
import { IFormSummary } from "@/types/questionnaire";
import {
  Layers,
  Eye,
  Edit2,
  History,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  ExternalLink,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface FormsDashboardProps {
  forms: IFormSummary[];
  loading: boolean;
  onViewForm: (formCode: string) => void;
  onEditForm: (formCode: string) => void;
  onPreviewForm: (form: IFormSummary) => void;
  onVersionHistory: (form: IFormSummary) => void;
  onPublishChanges: (form: IFormSummary) => void;
  onOpenQr?: (form: IFormSummary) => void;
  onCreateNewForm?: () => void;
}

export const FormsDashboard: React.FC<FormsDashboardProps> = ({
  forms,
  loading,
  onViewForm,
  onEditForm,
  onVersionHistory,
  onCreateNewForm,
}) => {
  // Ensure Form 1 (authoritative registration form at /register) is always first
  const orderedForms = useMemo(() => {
    if (!forms || forms.length === 0) return [];
    const list = [...forms];
    const defIdx = list.findIndex(
      (f) =>
        f.code === "RDA-ICDP-CONTRACTOR-Q" ||
        f.isDefault ||
        f.slug === "contractor"
    );
    if (defIdx > 0) {
      const [primary] = list.splice(defIdx, 1);
      list.unshift(primary);
    }
    return list;
  }, [forms]);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Compact Banner Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0b1f3a] text-amber-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9.5px] tracking-wider font-black text-blue-900 uppercase">
                  Road Development Authority &bull; Forms Hub
                </span>
                <span className="px-1.5 py-0.2 text-[9px] bg-blue-50 text-blue-800 font-bold rounded border border-blue-200">
                  {orderedForms.length} {orderedForms.length === 1 ? "FORM" : "FORMS"}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                Forms Selection &amp; Builder Hub
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            {onCreateNewForm && (
              <button
                type="button"
                onClick={onCreateNewForm}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Form N</span>
              </button>
            )}

            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              <span>Public /register</span>
              <ExternalLink className="w-3 h-3 text-blue-900" />
            </a>
          </div>
        </div>
      </div>

      {/* Forms Selection Grid */}
      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading questionnaires...</p>
        </div>
      ) : orderedForms.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Questionnaires Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your first form or synchronizing the baseline schema.
          </p>
          {onCreateNewForm && (
            <button
              type="button"
              onClick={onCreateNewForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Form 1</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {orderedForms.map((form, index) => {
            const formNumber = index + 1;
            const isFormOne = formNumber === 1;
            const isLive = form.status === "PUBLISHED";
            const isDraftOnly = form.status === "DRAFT";
            const publicPath = isFormOne ? "/register" : (form.publicUrl || `/register/${form.slug}`);

            return (
              <div
                key={form.code}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col"
              >
                {/* Compact Card Body */}
                <div className="p-4 sm:p-5 space-y-3">
                  {/* Top Badges Strip */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Form Number Badge */}
                      <span
                        className={`font-mono font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-2xs ${
                          isFormOne
                            ? "text-slate-950 bg-amber-400"
                            : "text-white bg-blue-900"
                        }`}
                      >
                        FORM {formNumber < 10 ? `0${formNumber}` : formNumber}
                      </span>

                      {/* Form Code */}
                      <span className="font-mono font-bold text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {form.code}
                      </span>

                      {/* Category */}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {form.category || "General"}
                      </span>

                      {isFormOne && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          PRIMARY FORM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isLive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-mono"
                            : isDraftOnly
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLive ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                          }`}
                        />
                        <span>{form.status || "PUBLISHED"}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        v{form.publishedVersion || form.draftVersion || "1.0"}
                      </span>
                    </div>
                  </div>

                  {/* Form Title & Description */}
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                      {isFormOne
                        ? form.title || "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire"
                        : form.title.startsWith("Form ")
                        ? form.title
                        : `Form ${formNumber}: ${form.title}`}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {form.description ||
                        "Official Road Development Authority stakeholder questionnaire under the Inclusive Connectivity and Development Project (ICDP)."}
                    </p>
                  </div>

                  {/* Public Portal Reference Bar - Slim */}
                  <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-600">Public Route:</span>
                      <span className="font-mono text-blue-900 font-bold truncate">
                        {publicPath}
                      </span>
                    </div>
                    <Link
                      href={publicPath}
                      target="_blank"
                      className="font-bold text-blue-900 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Open Portal</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Compact Metrics Grid */}
                  <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sections
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono block">
                        {form.stats?.totalSections || 12}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Questions
                      </span>
                      <span className="text-sm font-black text-blue-950 font-mono block">
                        {form.stats?.totalQuestions || 38}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[8.5px] font-bold text-purple-600 uppercase tracking-wider block">
                        Conditional
                      </span>
                      <span className="text-sm font-black text-purple-900 font-mono block">
                        {form.stats?.conditionalQuestions || 34}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Submissions
                      </span>
                      <Link
                        href={`/submissions?formId=${form.code}`}
                        className="text-sm font-black text-blue-900 hover:underline font-mono block"
                      >
                        {form.submissionsCount || 0} &rarr;
                      </Link>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Updated
                      </span>
                      <span className="text-[10px] font-bold text-slate-800 block truncate mt-0.5">
                        {form.updatedAt
                          ? new Date(form.updatedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })
                          : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compact Actions Bar */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[10.5px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Click to open or edit Form {formNumber}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Action 1: Open Exact Form (View Mode by default) */}
                    <button
                      type="button"
                      onClick={() => onViewForm(form.code)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-lg shadow-2xs transition-all"
                      title={`Open Form ${formNumber} exact form view`}
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open Form {formNumber}</span>
                    </button>

                    {/* Action 2: Edit Form */}
                    <button
                      type="button"
                      onClick={() => onEditForm(form.code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all"
                      title={`Edit Form ${formNumber} structure and fields`}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-900" />
                      <span>Edit Form</span>
                    </button>

                    {/* Action 3: History */}
                    <button
                      type="button"
                      onClick={() => onVersionHistory(form)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-all"
                      title="View version revisions"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>History</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Compact Add Form N Card */}
          {onCreateNewForm && (
            <div
              onClick={onCreateNewForm}
              className="border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl p-4 bg-slate-50/60 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 group-hover:border-blue-900 group-hover:bg-blue-900 text-slate-600 group-hover:text-amber-400 flex items-center justify-center shadow-2xs transition-all shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-950">
                    + Create Form {orderedForms.length + 1} (Form N)
                  </h3>
                  <p className="text-[10.5px] text-slate-500">
                    Add a new independent questionnaire template or duplicate from Form 1.
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-blue-900 group-hover:underline shrink-0">
                Create &rarr;
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
