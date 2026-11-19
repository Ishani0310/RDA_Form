"use client";

import React from "react";
import {
  Briefcase,
  Truck,
  Users,
  FileCheck2,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";
import Link from "next/link";

export const PlatformModules: React.FC = () => {
  const modules = [
    {
      id: "contractors",
      title: "Contractor Registration",
      subtitle: "Civil & Highway Engineering",
      description:
        "Register and manage engineering contractors and relevant organization information, including CIDA grading, provincial capacity and project history.",
      icon: Briefcase,
      color: "border-t-blue-900",
      iconBg: "bg-blue-50 text-blue-900 border-blue-200",
      badge: "CIDA Grades C1 - C7",
    },
    {
      id: "suppliers",
      title: "Supplier Registration",
      subtitle: "Materials & Equipment Plants",
      description:
        "Collect and manage material and plant supplier information, including asphalt batching plants, aggregate crushers, concrete mixers and heavy machinery.",
      icon: Truck,
      color: "border-t-indigo-600",
      iconBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      badge: "Plants & Materials",
    },
    {
      id: "stakeholders",
      title: "Stakeholder Registration",
      subtitle: "Institutional Representation",
      description:
        "Manage government officers, workshop delegates and other relevant stakeholders representing provincial agencies, ministries and statutory bodies.",
      icon: Users,
      color: "border-t-emerald-600",
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badge: "Provincial & Ministry",
    },
    {
      id: "management",
      title: "Digital Data Management",
      subtitle: "Records & Oversight",
      description:
        "Centralized records, submissions, status tracking and administrative reporting with real-time audit logs and structured capacity assessments.",
      icon: FileCheck2,
      color: "border-t-amber-500",
      iconBg: "bg-amber-50 text-amber-700 border-amber-200",
      badge: "Audited Intelligence",
    },
  ];

  return (
    <section id="modules" className="py-14 sm:py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-blue-900" />
            <span>Core Capabilities</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            A Centralized Platform for Stakeholder Management
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Standardized digital workflows designed specifically for the Road
            Development Authority and the Inclusive Connectivity and Development
            Project (ICDP).
          </p>
        </div>

        {/* 4 Professional Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between border-t-4 ${item.color} group`}
              >
                <div>
                  {/* Top Bar with Icon and Tag */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${item.iconBg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                      {item.badge}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    {item.title}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 mb-3">
                    {item.subtitle}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Footer link to Portal */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-900 group-hover:text-blue-950">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sub-banner providing quick link to Registration */}
        <div className="mt-10 p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Are you an invited contractor or workshop participant?
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500">
                Submit your official organization profile or resume your draft registration.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <span>Public Registration Form</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
