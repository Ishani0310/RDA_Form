"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Lock,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { HeroVisualMockup } from "./HeroVisualMockup";

export const HeroSection: React.FC = () => {
  return (
    <section
      id="hero"
      className="relative pt-6 sm:pt-10 pb-12 sm:pb-16 bg-gradient-to-b from-white via-slate-50 to-slate-100/70 border-b border-slate-200/80 overflow-hidden"
    >
      {/* Subtle institutional background watermark pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#0b1f3a 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Typography & CTAs (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Government Institutional Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="font-bold tracking-wide uppercase text-[11px]">
                Road Development Authority
              </span>
              <span className="text-blue-300">•</span>
              <span className="text-blue-700 text-[11px] font-medium">
                National Portal
              </span>
            </div>

            {/* Main Headings */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Contractor Data Collection System
              </h1>
              <h2 className="text-lg sm:text-xl font-bold text-blue-900 tracking-normal leading-snug">
                Digital Stakeholder Registration & Management for Road Development Authority
              </h2>
            </div>

            {/* Concise Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              A secure digital platform for collecting, managing and monitoring
              contractor, supplier and stakeholder information for Road
              Development Authority programmes and engagements.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] active:bg-[#07172c] rounded-xl shadow-md hover:shadow-lg transition-all group"
              >
                <span>Access Portal</span>
                <ArrowRight className="w-4 h-4 text-amber-400 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#modules"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-xs transition-colors"
              >
                <span>Learn More</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </a>

              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-blue-900 hover:text-blue-950 sm:ml-2 hover:underline"
              >
                <span>Stakeholder Registration Form</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Trust Micro-Checklist */}
            <div className="pt-3 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">
                  Official RDA Portal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-900 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">
                  Secure Data Collection
                </span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Building2 className="w-4 h-4 text-indigo-700 shrink-0" />
                <span className="font-medium text-[11px] sm:text-xs">
                  All 9 Sri Lankan Provinces
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Dashboard Visual (5 cols on lg) */}
          <div className="lg:col-span-5 pt-4 lg:pt-0">
            <HeroVisualMockup />
          </div>
        </div>
      </div>
    </section>
  );
};
