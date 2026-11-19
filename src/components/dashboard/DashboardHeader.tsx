"use client";

import React from "react";
import {
  RefreshCw,
  Printer,
  Clock,
} from "lucide-react";

interface DashboardHeaderProps {
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefresh,
  loading,
  lastUpdated,
}) => {
  return (
    <div className="bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
      {/* Left: Dashboard Heading & Executive Description */}
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
          ICDP Stakeholder Management Dashboard
        </h1>

        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
          Monitor contractor, supplier and government stakeholder registrations for the Early Market Engagement Workshop.
        </p>
      </div>

      {/* Right: Live Sync Status & Executive Action Controls */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap self-start lg:self-center">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0 font-medium min-w-[120px] justify-center">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="tabular-nums">
            {lastUpdated
              ? `Synced ${lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Live Sync Active"}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all disabled:opacity-60"
          title="Refresh dashboard metrics from database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-900" : "text-slate-500"}`} />
          <span>Refresh</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all"
          title="Print executive summary report"
        >
          <Printer className="w-3.5 h-3.5 text-amber-300" />
          <span>Print Summary</span>
        </button>
      </div>
    </div>
  );
};
