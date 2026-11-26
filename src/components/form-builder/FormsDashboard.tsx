"use client";

import React, { useMemo } from "react";
import { IFormSummary } from "@/types/questionnaire";
import {
  Layers,
  Eye,
  Edit2,
  Sparkles,
  History,
  Send,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  QrCode,
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
  onPreviewForm,
  onVersionHistory,
  onPublishChanges,
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
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0b1f3a] text-amber-400 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-widest font-black text-blue-900 uppercase">
                  Road Development Authority &bull; Sri Lanka
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-800 font-bold border border-blue-200">
                  {orderedForms.length} {orderedForms.length === 1 ? "FORM CONFIGURED" : "FORMS CONFIGURED"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Forms Selection &amp; Builder Hub
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Select <strong>Form 1</strong> (existing registration questionnaire) or any other form to inspect sections, configure questions, and publish live schemas.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap">
            {onCreateNewForm && (
              <button
                type="button"
                onClick={onCreateNewForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] shadow-xs transition-all"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Create Form (Form N)</span>
              </button>
            )}

            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-2xs"
            >
              <span>Open Public /register</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-900" />
            </a>
          </div>
        </div>
      </div>

      {/* Forms Selection Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading questionnaires...</p>
        </div>
      ) : orderedForms.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Questionnaires Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your first institutional form or synchronizing the baseline schema.
          </p>
          {onCreateNewForm && (
            <button
              type="button"
              onClick={onCreateNewForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Form 1</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {orderedForms.map((form, index) => {
            const formNumber = index + 1;
            const isFormOne = formNumber === 1;
            const isLive = form.status === "PUBLISHED";
            const isDraftOnly = form.status === "DRAFT";
            const publicPath = isFormOne ? "/register" : (form.publicUrl || `/register/${form.slug}`);

            return (
              <div
                key={form.code}
                className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col"
              >
                {/* Card Header & Badges */}
                <div className="p-6 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Form Number Badge */}
                      <span
                        className={`font-mono font-black text-xs px-3 py-1 rounded-full shadow-2xs ${
                          isFormOne
                            ? "text-slate-950 bg-amber-400"
                            : "text-white bg-blue-900"
                        }`}
                      >
                        FORM {formNumber < 10 ? `0${formNumber}` : formNumber}
                      </span>

                      {/* Form Code */}
                      <span className="font-mono font-bold text-xs text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        {form.code}
                      </span>

                      {/* Category */}
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {form.category || "General"}
                      </span>

                      {isFormOne && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          PRIMARY OFFICIAL REGISTRATION FORM
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                          isLive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-mono"
                            : isDraftOnly
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isLive ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                          }`}
                        />
                        <span>{form.status || "PUBLISHED"}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        v{form.publishedVersion || form.draftVersion || "1.0"}
                      </span>
                    </div>
                  </div>

                  {/* Form Title & Description */}
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                      {isFormOne
                        ? form.title || "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire"
                        : form.title.startsWith("Form ")
                        ? form.title
                        : `Form ${formNumber}: ${form.title}`}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                      {form.description ||
                        "Official Road Development Authority stakeholder questionnaire for Contractor, Supplier, and Government Officer registrations under the Inclusive Connectivity and Development Project (ICDP)."}
                    </p>
                  </div>

                  {/* Public Portal Reference Bar */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-700">Public Portal Route:</span>
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

                  {/* Metadata Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Sections
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
                        {form.stats?.totalSections || 12}
                      </span>
                      <span className="text-[10px] text-slate-500">defined sections</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Questions
                      </span>
                      <span className="text-lg font-black text-blue-950 font-mono mt-0.5 block">
                        {form.stats?.totalQuestions || 38}
                      </span>
                      <span className="text-[10px] text-slate-500">active fields</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                        Conditional Fields
                      </span>
                      <span className="text-lg font-black text-purple-900 font-mono mt-0.5 block">
                        {form.stats?.conditionalQuestions || 34}
                      </span>
                      <span className="text-[10px] text-purple-700">dynamic rules</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Submissions
                      </span>
                      <Link
                        href={`/submissions?formId=${form.code}`}
                        className="text-lg font-black text-blue-900 hover:underline font-mono mt-0.5 block flex items-center gap-1"
                      >
                        <span>{form.submissionsCount || 0}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-[10px] text-slate-500">recorded responses</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Last Updated
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
                        {form.updatedAt
                          ? new Date(form.updatedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recently"}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {form.updatedAt
                            ? new Date(form.updatedAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Active"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions on the Card */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {/* Action 1: Select & Edit Form (Direct entry into workspace) */}
                  <button
                    type="button"
                    onClick={() => onEditForm(form.code)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-xs transition-all col-span-2 sm:col-span-2"
                    title={`Open Form ${formNumber} in Form Builder workspace editor`}
                  >
                    <Edit2 className="w-4 h-4 text-amber-400" />
                    <span>Select &amp; Edit Form {formNumber}</span>
                  </button>

                  {/* Action 2: View Simulation */}
                  <button
                    type="button"
                    onClick={() => onViewForm(form.code)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all hover:border-slate-400"
                    title="View form interactive simulation"
                  >
                    <Eye className="w-4 h-4 text-blue-900" />
                    <span>View Form</span>
                  </button>

                  {/* Action 3: Preview Form */}
                  <button
                    type="button"
                    onClick={() => onPreviewForm(form)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shadow-2xs transition-all"
                    title="Interactive preview simulation"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Preview</span>
                  </button>

                  {/* Action 4: Version History */}
                  <button
                    type="button"
                    onClick={() => onVersionHistory(form)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all hover:border-slate-400"
                    title="View version revisions and audit log"
                  >
                    <History className="w-4 h-4 text-slate-600" />
                    <span>History</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Form N Card */}
          {onCreateNewForm && (
            <div
              onClick={onCreateNewForm}
              className="border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-3xl p-8 bg-slate-50/60 hover:bg-blue-50/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 group-hover:border-blue-900 group-hover:bg-blue-900 text-slate-600 group-hover:text-amber-400 flex items-center justify-center shadow-xs transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-950">
                  Create Form {orderedForms.length + 1} (Form N)
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  Configure a new questionnaire template from scratch or duplicate from Form 1 with customized sections and conditional questions.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
