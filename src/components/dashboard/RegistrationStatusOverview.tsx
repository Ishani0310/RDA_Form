"use client";

import React from "react";
import Link from "next/link";
import { Layers, FileCheck2, Clock, UserX, ArrowUpRight } from "lucide-react";

export interface StatusOverviewData {
  submitted: number;
  activeDrafts: number;
  nonAttendees: number;
}

interface RegistrationStatusOverviewProps {
  data: StatusOverviewData | null;
  loading: boolean;
}

export const RegistrationStatusOverview: React.FC<RegistrationStatusOverviewProps> = ({
  data,
  loading,
}) => {
  const submitted = data?.submitted ?? 0;
  const activeDrafts = data?.activeDrafts ?? 0;
  const nonAttendees = data?.nonAttendees ?? 0;
  const totalLifecycle = submitted + activeDrafts;

  const submittedPct = totalLifecycle > 0 ? Math.round((submitted / totalLifecycle) * 100) : 0;
  const draftPct = totalLifecycle > 0 ? 100 - submittedPct : 0;

  const statuses = [
    {
      id: "status-submitted",
      label: "Submitted Registrations",
      count: submitted,
      description: "Finalized filings (attendees & non-attendees)",
      badge: "Official",
      badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
      icon: FileCheck2,
      iconStyle: "bg-emerald-50 text-emerald-700",
      href: "/submissions?status=submitted",
    },
    {
      id: "status-drafts",
      label: "Active Draft Registrations",
      count: activeDrafts,
      description: "In-progress sessions (unexpired & unrevoked)",
      badge: "In Progress",
      badgeStyle: "bg-amber-50 text-amber-800 border-amber-200/60",
      icon: Clock,
      iconStyle: "bg-amber-50 text-amber-700",
      href: "/submissions?status=draft",
    },
    {
      id: "status-non-attendees",
      label: "Submitted Non-Attendees",
      count: nonAttendees,
      description: "Formally declined attendance filings",
      badge: "Declined",
      badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
      icon: UserX,
      iconStyle: "bg-slate-100 text-slate-700",
      href: "/submissions?attendance=No",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Filing Lifecycle Status
              </h3>
              <p className="text-[11px] text-slate-500">
                Official submissions vs. active draft sessions
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 font-mono">
            {totalLifecycle} Total Lifecycle
          </span>
        </div>

        {/* Proportional Segmented Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Submitted: {submittedPct}%
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Active Drafts: {draftPct}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${submittedPct}%` }}
              className="bg-emerald-600 transition-all duration-500"
            />
            <div
              style={{ width: `${draftPct}%` }}
              className="bg-amber-500 transition-all duration-500"
            />
          </div>
        </div>

        {/* Status List Cards */}
        <div className="mt-4 space-y-2.5">
          {statuses.map((st) => {
            const Icon = st.icon;

            return (
              <Link
                key={st.id}
                href={st.href}
                className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/80 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${st.iconStyle}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {st.label}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${st.badgeStyle}`}>
                        {st.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {st.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2 shrink-0">
                  <span className="text-base font-black text-slate-900 font-mono">
                    {loading ? "..." : st.count}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-900 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Insight */}
      <div className="pt-2.5 border-t border-slate-100 mt-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>Drafts protected by high-entropy SHA-256 tokens</span>
        <Link
          href="/submissions"
          className="text-blue-900 hover:underline font-semibold inline-flex items-center gap-0.5"
        >
          Audit Queue →
        </Link>
      </div>
    </div>
  );
};
