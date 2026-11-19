"use client";

import React, { useEffect, useState } from "react";
import { X, History, CheckCircle2, Archive, Calendar, User } from "lucide-react";

interface VersionItem {
  _id: string;
  title: string;
  version: string;
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isPublished: boolean;
  isLocked: boolean;
  stats: {
    totalSections: number;
    totalQuestions: number;
    requiredQuestions: number;
  };
  publishedAt?: string;
  publishedBy?: { fullName: string; email: string };
  createdBy?: { fullName: string; email: string };
  updatedAt: string;
}

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaireId: string;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  questionnaireId,
}) => {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && questionnaireId) {
      setLoading(true);
      fetch(`/api/questionnaires/${questionnaireId}/versions`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setVersions(data.versions || []);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, questionnaireId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 bg-[#0b1f3a] text-white flex items-center justify-between border-b border-[#183659]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Questionnaire Version History</h3>
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
        <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          {loading ? (
            <div className="p-6 text-center text-slate-500 font-medium">
              Loading version timeline...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No version records found.
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver._id}
                className={`p-3.5 rounded-xl border transition-all ${
                  ver.status === "PUBLISHED"
                    ? "bg-blue-50/50 border-blue-900 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">
                      v{ver.version}
                    </span>
                    {ver.status === "PUBLISHED" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>ACTIVE PUBLISHED</span>
                      </span>
                    ) : ver.status === "DRAFT" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        WORKING DRAFT
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        <span>ARCHIVED</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Questions: {ver.stats?.totalQuestions ?? 0}</span>
                    <span>Sections: {ver.stats?.totalSections ?? 0}</span>
                  </div>

                  {ver.publishedAt && (
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10.5px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        Published: {new Date(ver.publishedAt).toLocaleDateString()} by{" "}
                        {ver.publishedBy?.fullName || "Directorate"}
                      </span>
                    </div>
                  )}

                  {!ver.publishedAt && (
                    <div className="text-[10.5px] text-slate-400">
                      Updated: {new Date(ver.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
