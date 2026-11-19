import React from "react";
import { BarChart3, Download, FileSpreadsheet, Calendar, Filter, PieChart, TrendingUp } from "lucide-react";
import { DemoBanner } from "@/components/ui/DemoBanner";

const REPORT_TEMPLATES = [
  {
    id: "REP-01",
    title: "Provincial Contractor Capacity & Grade Matrix",
    description: "Breakdown of active C1-C9 civil contractors per administrative province and district.",
    frequency: "Monthly / On-Demand",
    lastGenerated: "2026-11-10",
    format: "PDF / XLSX",
  },
  {
    id: "REP-02",
    title: "Heavy Equipment & Road Plant Availability",
    description: "Declared inventory of asphalt pavers, excavators, vibratory rollers, and batching plants.",
    frequency: "Bi-annual",
    lastGenerated: "2026-11-05",
    format: "PDF / XLSX",
  },
  {
    id: "REP-03",
    title: "Questionnaire Filing Compliance & Verification Rate",
    description: "Provincial engineer review turnaround time, approval benchmarks, and revisions requested.",
    frequency: "Weekly",
    lastGenerated: "2026-11-15",
    format: "PDF / CSV",
  },
  {
    id: "REP-04",
    title: "QR Portal Authentications & Site Inspection Log",
    description: "Audit trail of QR scans logged by RDA site inspection engineers across active work zones.",
    frequency: "Real-time / Weekly",
    lastGenerated: "2026-11-14",
    format: "PDF / CSV",
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Reports &amp; Analytical Insights
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Official RDA intelligence reporting on contractor availability, infrastructure capabilities, and regional resource distribution.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Generate Custom Report</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-900" />
          <span>Report Parameter Configuration</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Target Directorate</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
              <option>All 9 Provinces (National Level)</option>
              <option>Western Province</option>
              <option>Central Province</option>
              <option>Southern Province</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">CIDA Classification</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
              <option>All Grades (CS1 to Specialist)</option>
              <option>CS1 & C1 (Highways only)</option>
              <option>C2 & C3 (Regional Works)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Reporting Period</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
              <option>Current Financial Year (2026)</option>
              <option>Q3 2026 (Jul - Sep)</option>
              <option>Q4 2026 (Oct - Dec)</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Export Format</label>
            <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
              <option>Government Standard PDF</option>
              <option>Microsoft Excel (.xlsx)</option>
              <option>CSV Data Stream</option>
            </select>
          </div>
        </div>
      </div>

      {/* Standard RDA Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {REPORT_TEMPLATES.map((report) => (
          <div
            key={report.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                  {report.id}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {report.frequency}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-2.5">
                {report.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {report.description}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Last run: {report.lastGenerated} [SAMPLE]
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ({report.format})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
