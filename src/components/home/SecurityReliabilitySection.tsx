"use client";

import React from "react";
import {
  Lock,
  Database,
  FileSpreadsheet,
  Users2,
  FileCheck2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

export const SecurityReliabilitySection: React.FC = () => {
  const pillars = [
    {
      title: "Controlled Access",
      description:
        "Role-Based Access Control (RBAC) ensures administrative consoles and confidential filings are strictly accessible by authorized RDA officers, Super Admins, and Provincial Directors.",
      icon: Lock,
      badge: "RBAC Controls",
    },
    {
      title: "Centralized Records",
      description:
        "A single authoritative database of contractor qualifications, plant inventories, and public officer rosters, eliminating duplicate entries and records fragmentation.",
      icon: Database,
      badge: "Single Source of Truth",
    },
    {
      title: "Structured Data Collection",
      description:
        "Standardized electronic questionnaires capturing statutory business registrations, CIDA engineering grades, audited turnover figures, and machinery allocations.",
      icon: FileSpreadsheet,
      badge: "CIDA Standards",
    },
    {
      title: "Administrative Oversight",
      description:
        "Continuous provincial visibility enabling executive directors and project engineers to monitor stakeholder participation and contractor compliance in real time.",
      icon: Users2,
      badge: "Provincial Monitoring",
    },
    {
      title: "Submission Tracking",
      description:
        "Lifecycle tracking from temporary draft token state to finalized submission, complete with verifiable reference numbers and submission date stamps.",
      icon: FileCheck2,
      badge: "Audit Timestamps",
    },
    {
      title: "Secure Authentication",
      description:
        "Stateless cryptographic session tokens with automatic idle timeouts, credential verification, and strict route-level middleware protection.",
      icon: KeyRound,
      badge: "Protected Sessions",
    },
  ];

  return (
    <section id="security" className="py-14 sm:py-20 bg-white border-t border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold uppercase tracking-wider border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Institutional Governance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Built for Secure and Responsible Data Management
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Engineered to uphold strict standards of official integrity, data
            confidentiality, and accountability across Sri Lankan road
            infrastructure initiatives.
          </p>
        </div>

        {/* 6 Institutional Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/70 rounded-2xl p-5 sm:p-6 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-900 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Compliant with RDA System Protocols</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
