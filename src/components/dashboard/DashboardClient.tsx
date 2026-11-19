"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { StatsOverview, DashboardStatsData } from "./StatsOverview";
import { RegistrationCategoryChart, CategoryBreakdownItem } from "./RegistrationCategoryChart";
import { RegistrationStatusOverview, StatusOverviewData } from "./RegistrationStatusOverview";
import { RecentRegistrations, RecentRegistrationItem } from "./RecentRegistrations";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DashboardApiResponse {
  success: boolean;
  stats: DashboardStatsData;
  categoryBreakdown: CategoryBreakdownItem[];
  statusOverview: StatusOverviewData;
  recentRegistrations: RecentRegistrationItem[];
  message?: string;
}

export const DashboardClient: React.FC = () => {
  const [data, setData] = useState<DashboardApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Authentication required. Please sign in as an authorized RDA officer.");
        }
        throw new Error(`Failed to load dashboard metrics (HTTP ${res.status})`);
      }
      const json: DashboardApiResponse = await res.json();
      if (json.success) {
        setData(json);
        setLastUpdated(new Date());
      } else {
        throw new Error(json.message || "Failed to retrieve dashboard metrics from server.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred loading dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* 1. Dashboard Executive Header */}
      <DashboardHeader
        onRefresh={fetchDashboardData}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {/* Error Alert with Retry */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* 2. Key Performance Indicators (8 Single-Row Summary Cards on Desktop) */}
      <StatsOverview stats={data?.stats || null} loading={loading} />

      {/* 3. Analytics Section: Donut Chart & Filing Lifecycle Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 items-stretch">
        <RegistrationCategoryChart
          data={data?.categoryBreakdown || []}
          loading={loading}
        />
        <RegistrationStatusOverview
          data={data?.statusOverview || null}
          loading={loading}
        />
      </div>

      {/* 4. Recent Registrations Table (Latest 10 Submitted Records) */}
      <RecentRegistrations
        registrations={data?.recentRegistrations || []}
        loading={loading}
      />
    </div>
  );
};
