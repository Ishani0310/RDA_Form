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
}) => {
  // CRITICAL REQUIREMENT: Display ONLY ONE primary questionnaire card
  // representing the authoritative registration form implemented at /register.
  const primaryForm = useMemo(() => {
    if (!forms || forms.length === 0) return null;
    const match = forms.find(
      (f) =>
        f.code === "RDA-ICDP-CONTRACTOR-Q" ||
        f.isDefault ||
        f.slug === "contractor"
    );
    return match || forms[0];
  }, [forms]);

  const isLive = primaryForm?.status === "PUBLISHED";
  const isDraftOnly = primaryForm?.status === "DRAFT";

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
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  PRIMARY INSTITUTIONAL FORM
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Dynamic Form Management System
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage the live questionnaire deployed at{" "}
                <code className="text-blue-900 font-mono font-bold">/register</code>.
                Configure sections, fields, conditional rules, and version releases.
              </p>
            </div>
          </div>

          {/* Quick Portal Link */}
          {primaryForm && (
            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
              <a
                href={primaryForm.publicUrl || "/register"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all shadow-2xs"
              >
                <span>Open Public Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-900" />
              </a>
              {onOpenQr && (
                <button
                  type="button"
                  onClick={() => onOpenQr(primaryForm)}
                  className="p-2 rounded-xl text-slate-600 hover:text-blue-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
                  title="View Portal QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Form Card */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading questionnaire details...</p>
        </div>
      ) : !primaryForm ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Primary Form Not Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Unable to retrieve the primary questionnaire record. Please check server connectivity.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col">
            {/* Card Header & Badges */}
            <div className="p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    {primaryForm.code || "RDA-ICDP-CONTRACTOR-Q"}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {primaryForm.category || "Contractor & Stakeholder Registration"}
                  </span>
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
                    <span>{primaryForm.status || "PUBLISHED"}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    v{primaryForm.publishedVersion || primaryForm.draftVersion || "1.0"}
                  </span>
                </div>
              </div>

              {/* Form Title & Description */}
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {primaryForm.title || "RDA Contractor Registration & Capacity Declaration Questionnaire"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {primaryForm.description ||
                    "Official Road Development Authority stakeholder questionnaire for Contractor, Supplier, and Government Officer registrations under the Inclusive Connectivity and Development Project (ICDP)."}
                </p>
              </div>

              {/* Public Portal Reference Bar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Public Portal Route:</span>
                  <span className="font-mono text-blue-900 font-bold truncate">
                    {primaryForm.publicUrl || "http://localhost:3000/register"}
                  </span>
                </div>
                <Link
                  href="/register"
                  target="_blank"
                  className="font-bold text-blue-900 hover:underline flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Metadata Metrics Grid (Sections, Questions, Conditional Fields, Submissions, Updated) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sections
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
                    {primaryForm.stats?.totalSections || 10}
                  </span>
                  <span className="text-[10px] text-slate-500">defined sections</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Questions
                  </span>
                  <span className="text-lg font-black text-blue-950 font-mono mt-0.5 block">
                    {primaryForm.stats?.totalQuestions || 27}
                  </span>
                  <span className="text-[10px] text-slate-500">active fields</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                    Conditional Fields
                  </span>
                  <span className="text-lg font-black text-purple-900 font-mono mt-0.5 block">
                    {primaryForm.stats?.conditionalQuestions || 18}
                  </span>
                  <span className="text-[10px] text-purple-700">dynamic rules</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Submissions
                  </span>
                  <Link
                    href={`/submissions?formId=${primaryForm.code}`}
                    className="text-lg font-black text-blue-900 hover:underline font-mono mt-0.5 block flex items-center gap-1"
                  >
                    <span>{primaryForm.submissionsCount || 0}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <span className="text-[10px] text-slate-500">recorded responses</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Last Updated
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
                    {primaryForm.updatedAt
                      ? new Date(primaryForm.updatedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recently"}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>
                      {primaryForm.updatedAt
                        ? new Date(primaryForm.updatedAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Active"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Exactly 5 Actions on the Card */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Action 1: View Form */}
              <button
                type="button"
                onClick={() => onViewForm(primaryForm.code)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all hover:border-slate-400"
                title="View form exactly as public contractors see it (Simulation)"
              >
                <Eye className="w-4 h-4 text-blue-900" />
                <span>View Form</span>
              </button>

              {/* Action 2: Edit Form */}
              <button
                type="button"
                onClick={() => onEditForm(primaryForm.code)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-all"
                title="Edit sections, questions, and conditional rules"
              >
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Form</span>
              </button>

              {/* Action 3: Preview Form */}
              <button
                type="button"
                onClick={() => onPreviewForm(primaryForm)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shadow-2xs transition-all"
                title="Interactive preview simulation with draft state"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Preview Form</span>
              </button>

              {/* Action 4: Version History */}
              <button
                type="button"
                onClick={() => onVersionHistory(primaryForm)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all hover:border-slate-400"
                title="View version revisions and audit log"
              >
                <History className="w-4 h-4 text-slate-600" />
                <span>Version History</span>
              </button>

              {/* Action 5: Publish Changes */}
              <button
                type="button"
                onClick={() => onPublishChanges(primaryForm)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl shadow-2xs transition-all col-span-2 sm:col-span-1"
                title="Publish changes live to the public registration portal"
              >
                <Send className="w-4 h-4 text-emerald-700" />
                <span>Publish Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
