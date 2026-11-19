"use client";

import React from "react";
import {
  Building2,
  Briefcase,
  Truck,
  Landmark,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Lock,
  QrCode,
  FileText,
  Activity,
} from "lucide-react";

export const HeroVisualMockup: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* Decorative ambient background blur */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-900/15 via-blue-600/10 to-amber-500/15 rounded-2xl blur-xl opacity-70 pointer-events-none" />

      {/* Main Container: Government Enterprise Window Chrome */}
      <div className="relative bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
        {/* Window Title Bar */}
        <div className="bg-[#0b1f3a] px-4 py-2.5 flex items-center justify-between border-b border-[#183659]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></span>
            </div>
            <div className="h-3 w-px bg-slate-700 mx-1"></div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-200 tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>RDA ICDP Management Console</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold hidden sm:inline">Live Sync Active</span>
            <span className="text-slate-400">GMT+5:30</span>
          </div>
        </div>

        {/* Console Body */}
        <div className="p-3.5 sm:p-4 space-y-3 bg-slate-50/70">
          {/* Header Bar inside Console */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">
                Provincial Stakeholder Oversight
              </div>
              <div className="text-xs font-black text-slate-800">
                National Contractor & Supplier Registry
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Authenticated Audit Stream</span>
            </div>
          </div>

          {/* 4 Mini KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border-t-2 border-t-blue-900 border-x border-b border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">Total Entities</span>
                <Building2 className="w-3.5 h-3.5 text-blue-900" />
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-1">342</div>
              <div className="text-[9px] text-slate-400 font-medium">9 Provinces</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border-t-2 border-t-indigo-600 border-x border-b border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">Contractors</span>
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-1">218</div>
              <div className="text-[9px] text-indigo-600 font-medium">C1 - C7 Grades</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border-t-2 border-t-purple-600 border-x border-b border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">Suppliers</span>
                <Truck className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-1">89</div>
              <div className="text-[9px] text-purple-600 font-medium">Plant & Asphalt</div>
            </div>

            <div className="bg-white p-2.5 rounded-xl border-t-2 border-t-emerald-600 border-x border-b border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">Officers</span>
                <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-base font-black text-slate-900 font-mono mt-1">35</div>
              <div className="text-[9px] text-emerald-600 font-medium">Gov Delegates</div>
            </div>
          </div>

          {/* Mini Table: Verified Stakeholder Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-blue-900" />
                <span>Verified Stakeholder Registrations</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Audit Record Stream</span>
            </div>

            <div className="divide-y divide-slate-100 text-[11px]">
              <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-800 truncate">
                    Maga Engineering (Pvt) Ltd
                  </div>
                  <div className="text-[9.5px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-slate-500">ICDP-CON-0891</span>
                    <span>•</span>
                    <span>Roads & Highways C1</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Submitted
                  </span>
                </div>
              </div>

              <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-800 truncate">
                    Access Engineering PLC
                  </div>
                  <div className="text-[9.5px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-slate-500">ICDP-CON-0742</span>
                    <span>•</span>
                    <span>Bridges & Expressways C1</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Submitted
                  </span>
                </div>
              </div>

              <div className="px-3 py-2 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-800 truncate">
                    Lanka Asphalt Materials & Premix
                  </div>
                  <div className="text-[9.5px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-slate-500">ICDP-SUP-0319</span>
                    <span>•</span>
                    <span>Batching & Material Plant</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Banner inside Console */}
          <div className="px-3 py-2 bg-gradient-to-r from-[#0b1f3a] to-[#12315b] rounded-xl text-white flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium text-slate-200">
                Cryptographic Token Verification & QR Clearance
              </span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
              <Lock className="w-3 h-3" />
              <span>TLS / SHA-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Institutional Badge */}
      <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200 shadow-lg flex items-center gap-2.5 z-10 hidden sm:flex">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-900 leading-tight">
            Official RDA Clearance
          </div>
          <div className="text-[9px] text-slate-500 leading-none">
            Government Audited Portal
          </div>
        </div>
      </div>
    </div>
  );
};
