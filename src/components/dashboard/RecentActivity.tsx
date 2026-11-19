import React from "react";
import { Clock, CheckCircle2, AlertCircle, FileText, ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";
import { INITIAL_RECENT_ACTIVITY } from "@/data/demoData";

const statusColor = (status: string) => {
  switch (status) {
    case "Verified":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Under Review":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Action Required":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Draft":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export const RecentActivity: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              Recent System Activity &amp; Submissions
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feed of contractor data entries, verifications and portal tokens
          </p>
        </div>

        <Link
          href="/submissions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors self-start sm:self-auto"
        >
          <span>View All Submissions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {INITIAL_RECENT_ACTIVITY.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
          <Inbox className="w-10 h-10 text-slate-300" />
          <p className="text-xs font-medium text-slate-600">No recent activity recorded</p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            System events, contractor submissions, and verification audit trails will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Contractor / Firm</th>
                <th className="px-5 py-3">Registration &amp; Grade</th>
                <th className="px-5 py-3">Province</th>
                <th className="px-5 py-3">Action Description</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {INITIAL_RECENT_ACTIVITY.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {act.contractorName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-slate-600 font-medium">{act.regNumber}</span>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-900">
                      {act.grade}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 font-medium">
                    {act.province}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {act.action}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {act.timestamp}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor(act.status)}`}>
                      {act.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
