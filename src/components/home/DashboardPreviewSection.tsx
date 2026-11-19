"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Truck,
  Landmark,
  Users,
  FileCheck2,
  Clock,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  Layers,
  Sparkles,
  PieChart,
} from "lucide-react";

export const DashboardPreviewSection: React.FC = () => {
  const previewCards = [
    {
      title: "Registered Organizations",
      value: "342",
      icon: Building2,
      style: "border-t-blue-900",
      iconColor: "text-blue-900 bg-blue-50",
    },
    {
      title: "Contractors",
      value: "218",
      icon: Briefcase,
      style: "border-t-indigo-600",
      iconColor: "text-indigo-700 bg-indigo-50",
    },
    {
      title: "Suppliers",
      value: "89",
      icon: Truck,
      style: "border-t-purple-600",
      iconColor: "text-purple-700 bg-purple-50",
    },
    {
      title: "Government Officers",
      value: "35",
      icon: Landmark,
      style: "border-t-emerald-600",
      iconColor: "text-emerald-700 bg-emerald-50",
    },
    {
      title: "Workshop Delegates",
      value: "412",
      icon: Users,
      style: "border-t-cyan-600",
      iconColor: "text-cyan-700 bg-cyan-50",
    },
    {
      title: "Submitted Registrations",
      value: "318",
      icon: FileCheck2,
      style: "border-t-emerald-600",
      iconColor: "text-emerald-700 bg-emerald-50",
    },
    {
      title: "Active Drafts",
      value: "24",
      icon: Clock,
      style: "border-t-amber-500",
      iconColor: "text-amber-700 bg-amber-50",
    },
  ];

  return (
    <section id="preview" className="py-14 sm:py-20 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-900 text-[11px] font-bold uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 text-blue-900" />
            <span>Executive Dashboard Interface</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Powerful Administrative Oversight
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Real-time provincial intelligence, submission tracking and multi-tier
            compliance metrics at an executive glance.
          </p>
        </div>

        {/* Dashboard Preview Shell */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Top Control Bar */}
          <div className="bg-[#0b1f3a] px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#183659]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                ICDP Stakeholder Management Dashboard
              </span>
              <span className="text-[10px] text-amber-300 font-mono px-2 py-0.5 rounded bg-white/10 border border-white/15">
                Preview Mode
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-300 font-mono">
                Illustrative Interface Representation
              </span>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors shrink-0"
              >
                <span>Access Live Console</span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
              </Link>
            </div>
          </div>

          {/* Body: 7 Preview KPI Cards Grid */}
          <div className="p-4 sm:p-6 space-y-5 bg-slate-50/60">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Key Performance Indicators</span>
                <span className="text-[10px] text-slate-400 font-mono font-normal">
                  Standardized metrics updated on demand
                </span>
              </div>

              {/* 7 Conceptual KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {previewCards.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={i}
                      className={`bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs flex flex-col justify-between h-[105px] border-t-2 ${card.style}`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center ${card.iconColor}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="my-auto">
                        <span className="text-xl font-black text-slate-900 font-mono leading-none block">
                          {card.value}
                        </span>
                      </div>

                      <div className="h-[24px] flex items-center">
                        <h4 className="text-[10.5px] font-bold text-slate-600 leading-tight line-clamp-2">
                          {card.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Middle Preview Row: Category Breakdown & Filing Status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Category Breakdown Mockup (7 cols) */}
              <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-blue-900" />
                    <span>Stakeholder Category Distribution</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Total: 342</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                      <span>Civil & Road Contractors</span>
                      <span className="font-mono text-slate-900 font-bold">218 (63.7%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-blue-900 h-2 rounded-full w-[64%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                      <span>Material & Plant Suppliers</span>
                      <span className="font-mono text-slate-900 font-bold">89 (26.0%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-purple-600 h-2 rounded-full w-[26%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-700 font-semibold mb-1 text-[11px]">
                      <span>Government Officers & Agencies</span>
                      <span className="font-mono text-slate-900 font-bold">35 (10.3%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-600 h-2 rounded-full w-[10%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Access Box (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#0b1f3a] to-[#14325a] text-white p-4 rounded-xl border border-[#1b3e68] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      RBAC
                    </div>
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Authorized Access Only
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Live system records, contractor financial capacity, and official
                    workshop delegate rosters are restricted to credentialed RDA
                    officers and provincial directors.
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Session Timeout: 8 Hours
                  </span>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <span>Log in to access records</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
