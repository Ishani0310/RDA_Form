"use client";

import React from "react";
import {
  Landmark,
  ShieldCheck,
  Lock,
  Database,
} from "lucide-react";

export const TrustStrip: React.FC = () => {
  const trustItems = [
    {
      icon: Landmark,
      primary: "ROAD DEVELOPMENT AUTHORITY",
      secondary: "Gov of Sri Lanka",
      accent: "text-amber-500",
    },
    {
      icon: ShieldCheck,
      primary: "Official Digital Registration Portal",
      secondary: "Ministry of Transport and Highways",
      accent: "text-emerald-500",
    },
    {
      icon: Lock,
      primary: "Secure Data Collection",
      secondary: "Encrypted & Audited Transmissions",
      accent: "text-blue-500",
    },
    {
      icon: Database,
      primary: "Centralized Stakeholder Management",
      secondary: "Inclusive Connectivity Project (ICDP)",
      accent: "text-indigo-500",
    },
  ];

  return (
    <div className="bg-[#08182e] text-white border-y border-[#183659] py-3.5 sm:py-4 px-4 sm:px-6 relative shadow-inner">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 ${
                  idx > 0 ? "pt-3 sm:pt-0 sm:pl-6" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${item.accent}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-tight text-slate-100 uppercase truncate">
                    {item.primary}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    {item.secondary}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
