"use client";

import React from "react";
import {
  FileEdit,
  Send,
  CheckCheck,
  LayoutDashboard,
  Workflow,
} from "lucide-react";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: "01",
      title: "Register",
      description:
        "Stakeholders provide the required information through the digital registration process, including corporate structure, CIDA status, and machinery.",
      icon: FileEdit,
      status: "Initial Intake",
    },
    {
      num: "02",
      title: "Submit",
      description:
        "Completed information is securely submitted to the system with cryptographic draft-token security and automated validation checks.",
      icon: Send,
      status: "Secure Delivery",
    },
    {
      num: "03",
      title: "Review",
      description:
        "Authorized RDA officers and provincial committees review and verify submitted records against accreditation guidelines and CIDA benchmarks.",
      icon: CheckCheck,
      status: "Officer Verification",
    },
    {
      num: "04",
      title: "Monitor",
      description:
        "Administrators can monitor registrations, statuses, and system statistics through the executive dashboard with real-time analytics.",
      icon: LayoutDashboard,
      status: "Executive Oversight",
    },
  ];

  return (
    <section id="how-it-works" className="py-14 sm:py-20 bg-white border-y border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 text-[11px] font-bold uppercase tracking-wider border border-blue-200">
            <Workflow className="w-3.5 h-3.5 text-blue-800" />
            <span>Process & Governance</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            How the System Works
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A structured, 4-stage operational workflow ensuring transparency,
            verifiable documentation and streamlined government oversight.
          </p>
        </div>

        {/* 4-Step Timeline: Horizontal on Desktop, Vertical on Mobile */}
        <div className="relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 bg-slate-200 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="bg-slate-50/70 lg:bg-transparent rounded-2xl p-5 lg:p-0 border lg:border-none border-slate-200 flex flex-col items-start lg:items-center text-left lg:text-center group"
                >
                  {/* Step Badge / Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 group-hover:border-blue-900 shadow-sm flex items-center justify-center mb-4 transition-all relative">
                    <Icon className="w-6 h-6 text-blue-900" />
                    <span className="absolute -top-2 -right-2 bg-[#0b1f3a] text-amber-400 text-[10px] font-black font-mono px-1.5 py-0.5 rounded-md border border-amber-400/30">
                      {step.num}
                    </span>
                  </div>

                  {/* Title & Stage */}
                  <div className="mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">
                      {step.status}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {step.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
