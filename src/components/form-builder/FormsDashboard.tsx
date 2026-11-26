"use client";

import React, { useMemo } from "react";
import { IFormSummary } from "@/types/questionnaire";
import {
  Layers,
  Eye,
  Edit2,
  History,
  Clock,
  ShieldCheck,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  QrCode,
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
  onDeleteForm?: (form: IFormSummary) => void;
  onOpenQr?: (form: IFormSummary) => void;
  onCreateNewForm?: () => void;
}

export const FormsDashboard: React.FC<FormsDashboardProps> = ({
  forms,
  loading,
  onViewForm,
  onEditForm,
  onVersionHistory,
  onDeleteForm,
  onOpenQr,
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
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0b1f3a] text-amber-400 flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] tracking-wider font-black text-blue-900 uppercase">
                  Road Development Authority &bull; Forms Hub
                </span>
                <span className="px-2 py-0.5 text-[9.5px] bg-blue-50 text-blue-800 font-bold rounded-full border border-blue-200">
                  {orderedForms.length} {orderedForms.length === 1 ? "FORM ACTIVE" : "FORMS ACTIVE"}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight mt-0.5">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Form N</span>
              </button>
            )}

            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
            >
              <span>Public /register</span>
              <ExternalLink className="w-3 h-3 text-blue-900" />
            </a>
          </div>
        </div>
      </div>

      {/* Forms Selection List */}
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
        <div className="space-y-4">
          {orderedForms.map((form, index) => {
            const formNumber = index + 1;
            const isFormOne = formNumber === 1;
            const isLive = form.status === "PUBLISHED";
            const isDraftOnly = form.status === "DRAFT";
            const publicPath = isFormOne ? "/register" : (form.publicUrl || `/register/${form.slug}`);

            return (
              <div
                key={form.code}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col border-l-4 border-l-amber-500"
              >
                {/* Header & Main Info */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Badges + Public Link */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-mono font-black text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs ${
                          isFormOne
                            ? "text-slate-950 bg-amber-400"
                            : "text-white bg-blue-900"
                        }`}
                      >
                        FORM {formNumber < 10 ? `0${formNumber}` : formNumber}
                      </span>

                      <span className="font-mono font-bold text-[11px] text-blue-900 bg-blue-50/80 px-2.5 py-0.5 rounded-md border border-blue-200/80">
                        {form.code}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {form.category || "General"}
                      </span>

                      {isFormOne && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                          PRIMARY FORM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                          isLive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-mono"
                            : isDraftOnly
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLive ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                          }`}
                        />
                        <span>{form.status || "PUBLISHED"}</span>
                      </span>

                      <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        v{form.publishedVersion || form.draftVersion || "1.0"}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                          {isFormOne
                            ? form.title || "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire"
                            : form.title.startsWith("Form ")
                            ? form.title
                            : `Form ${formNumber}: ${form.title}`}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {form.description ||
                            "Official Road Development Authority stakeholder questionnaire under the Inclusive Connectivity and Development Project (ICDP)."}
                        </p>
                      </div>

                      {/* Live Public Portal Pill */}
                      <Link
                        href={publicPath}
                        target="_blank"
                        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-900 bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/90 transition-all shrink-0 hover:shadow-2xs"
                        title="Open live public form in new tab"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Route: {publicPath}</span>
                        <ExternalLink className="w-3 h-3 text-blue-800 ml-0.5" />
                      </Link>
                    </div>

                    {/* Mobile Portal Route Link */}
                    <div className="md:hidden pt-1">
                      <Link
                        href={publicPath}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:underline"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Route: {publicPath}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Modern Unified Metrics Strip (Sleek Horizontal Segmented Card) */}
                  <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-2.5 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 text-center">
                    <div className="p-1 sm:px-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sections
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 font-mono mt-0.5 block">
                        {form.stats?.totalSections || 12}
                      </span>
                      <span className="text-[9.5px] text-slate-400">defined</span>
                    </div>

                    <div className="p-1 sm:px-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Questions
                      </span>
                      <span className="text-sm sm:text-base font-black text-blue-950 font-mono mt-0.5 block">
                        {form.stats?.totalQuestions || 38}
                      </span>
                      <span className="text-[9.5px] text-slate-400">fields</span>
                    </div>

                    <div className="p-1 sm:px-2">
                      <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider block">
                        Conditional
                      </span>
                      <span className="text-sm sm:text-base font-black text-purple-900 font-mono mt-0.5 block">
                        {form.stats?.conditionalQuestions || 34}
                      </span>
                      <span className="text-[9.5px] text-purple-700/80">dynamic rules</span>
                    </div>

                    <div className="p-1 sm:px-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Submissions
                      </span>
                      <Link
                        href={`/submissions?formId=${form.code}`}
                        className="text-sm sm:text-base font-black text-blue-900 hover:underline font-mono mt-0.5 block"
                      >
                        {form.submissionsCount || 0} &rarr;
                      </Link>
                      <span className="text-[9.5px] text-slate-400">responses</span>
                    </div>

                    <div className="p-1 sm:px-2 col-span-2 sm:col-span-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Last Updated
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                        {form.updatedAt
                          ? new Date(form.updatedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Active"}
                      </span>
                      <span className="text-[9.5px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {form.updatedAt
                            ? new Date(form.updatedAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Live"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Official Verified Questionnaire &bull; Ready for Responses</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Primary Action: Open Form */}
                    <button
                      type="button"
                      onClick={() => onViewForm(form.code)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                      title={`Open Form ${formNumber} exact form view`}
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open Form {formNumber}</span>
                    </button>

                    {/* Secondary Action: Edit Form */}
                    <button
                      type="button"
                      onClick={() => onEditForm(form.code)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all"
                      title={`Edit Form ${formNumber} structure and questions`}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-900" />
                      <span>Edit Form</span>
                    </button>

                    {/* Utility: History */}
                    <button
                      type="button"
                      onClick={() => onVersionHistory(form)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all"
                      title="View revision versions and audit log"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>History</span>
                    </button>

                    {/* QR Code Action */}
                    {onOpenQr && (
                      <button
                        type="button"
                        onClick={() => onOpenQr(form)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                        title={`View and download QR Code for Form ${formNumber}`}
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-800" />
                        <span>QR Code</span>
                      </button>
                    )}

                    {/* Delete Form Button */}
                    {onDeleteForm && (
                      <button
                        type="button"
                        onClick={() => onDeleteForm(form)}
                        className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-xl shadow-2xs transition-all hover:scale-[1.01] active:scale-[0.99]"
                        title={`Delete Form ${formNumber}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    )}
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
