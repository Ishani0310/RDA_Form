import React from "react";
import Link from "next/link";
import {
  Calendar,
  Phone,
  QrCode,
  ShieldCheck,
  Building,
  Database,
  ArrowRight,
} from "lucide-react";

export const SystemNotices: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* 1. Official Workshop Logistics */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              Workshop Logistics
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200/60">
              07 DEC 2026
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              Early Market Engagement Workshop
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Commencing at 9.00 AM. Registration closes officially on <strong className="font-bold text-rose-700">03 December 2026</strong>.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>Inquiries: 070 697 0408 (Thilina Tharinda)</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">RDA Head Office</span>
          <span className="text-emerald-700 font-semibold">Scheduled</span>
        </div>
      </div>

      {/* 2. Public Intake & Common QR Dispatch */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <QrCode className="w-3.5 h-3.5 text-slate-700" />
              Public Registration Intake
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
              ACTIVE
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              Common QR Code Architecture
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Standard QR code points directly to the public registration portal. Progress is saved with high-entropy 64-character tokens.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <Link
            href="/qr-management"
            className="text-blue-900 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Manage QR Codes</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-emerald-700 font-semibold">Online</span>
        </div>
      </div>

      {/* 3. Provincial Oversight & Audit Trail */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Building className="w-3.5 h-3.5 text-slate-700" />
              Provincial Oversight &amp; Audit
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              9 PROVINCES
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              Submission Verification Queue
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Provincial engineering desks and directors can filter and review submissions by district, stakeholder category, and attendance.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <Link
            href="/submissions"
            className="text-blue-900 font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>Submissions Queue</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-slate-500 font-medium font-mono text-[10px]">Audit Logged</span>
        </div>
      </div>
    </div>
  );
};
