import React from "react";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { SystemNotices } from "@/components/dashboard/SystemNotices";
import { ShieldAlert } from "lucide-react";

interface DashboardPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const isAccessDenied = resolvedParams.denied === "insufficient_privileges";

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Access Denied Alert for RBAC Restrictions */}
      {isAccessDenied && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 shadow-sm">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold">Access Restricted by Role-Based Access Control</h4>
            <p className="text-rose-700 mt-0.5 leading-relaxed">
              Your assigned officer role does not possess authorization for the requested management section. User administration and system configurations are restricted to <strong>Super Administrators</strong> and <strong>Provincial Directors</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Central ICDP Stakeholder Management Dashboard */}
      <DashboardClient />

      {/* Operational Information & Institutional Notices */}
      <SystemNotices />
    </div>
  );
}
