"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
} from "lucide-react";

export const BottomCtaSection: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-[#08182e] via-[#0b1f3a] to-[#061426] text-white relative overflow-hidden">
      {/* Decorative Blueprint Watermark */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fbbf24 1px, transparent 1px), linear-gradient(90deg, #fbbf24 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
        {/* Emblem Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-amber-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Road Development Authority Official Portal</span>
        </div>

        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug max-w-2xl mx-auto">
          Ready to access the Contractor Data Collection System?
        </h2>

        {/* Supporting text */}
        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Access the official portal to register, manage stakeholder information
          and monitor submissions.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl shadow-lg hover:shadow-xl transition-all group"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-4 h-4 text-slate-900 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors"
          >
            <span>Stakeholder Registration Form</span>
            <ExternalLink className="w-4 h-4 text-slate-300" />
          </Link>
        </div>

        {/* Government Disclaimer */}
        <div className="pt-6 border-t border-white/10 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3">
          <span>RDA Staff Credentials Required for Admin Functions</span>
          <span>•</span>
          <span>Democratic Socialist Republic of Sri Lanka</span>
        </div>
      </div>
    </section>
  );
};
