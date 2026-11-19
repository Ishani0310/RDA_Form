"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  MapPin,
  X,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  Lock,
} from "lucide-react";

export const HomeFooter: React.FC = () => {
  const [activeModal, setActiveModal] = useState<
    "help" | "contact" | "privacy" | "terms" | null
  >(null);

  const closeModal = () => setActiveModal(null);

  return (
    <>
      <footer id="contact" className="bg-[#050f1c] text-slate-300 border-t border-[#132c4a] relative text-xs">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
            {/* Column 1: Organization Identity & Address (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[2px] shadow-sm flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-[#0b1f3a] rounded-[10px] flex items-center justify-center text-amber-400 font-extrabold text-xs tracking-wider">
                    RDA
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                    Gov of Sri Lanka
                  </div>
                  <h3 className="text-sm font-black text-white tracking-tight leading-tight">
                    Road Development Authority
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Contractor Data Collection System
                  </p>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed max-w-sm">
                Centralized digital platform for collecting, verifying and
                managing contractor and stakeholder records under the Inclusive
                Connectivity and Development Project (ICDP).
              </p>

              {/* Verified Address from Codebase */}
              <div className="flex items-start gap-2 text-slate-400 pt-2 border-t border-slate-800">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <address className="not-italic text-[11px] leading-relaxed text-slate-300">
                  <strong className="text-white block font-semibold">
                    Head Office ("Maganeguma Mahamedura")
                  </strong>
                  Denzil Kobbekaduwa Mawatha, Koswatta, Battaramulla, Sri Lanka
                </address>
              </div>
            </div>

            {/* Column 2: System Navigation (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Navigation
              </h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li>
                  <a href="#hero" className="hover:text-amber-400 transition-colors">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#about" className="hover:text-amber-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#modules" className="hover:text-amber-400 transition-colors">
                    Services / Modules
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-amber-400 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#preview" className="hover:text-amber-400 transition-colors">
                    Dashboard Preview
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Portal Access (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Portal Access
              </h4>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-amber-400 transition-colors font-semibold text-slate-200"
                  >
                    Officer Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-amber-400 transition-colors"
                  >
                    Stakeholder Registration
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("help")}
                    className="hover:text-amber-400 transition-colors text-left"
                  >
                    Help & FAQs
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("contact")}
                    className="hover:text-amber-400 transition-colors text-left"
                  >
                    Contact Secretariat
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Institutional Governance (3 cols on lg) */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Institutional Governance
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Operating in accordance with the regulatory directives of the
                Ministry of Transport and Highways and CIDA guidelines.
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal("privacy")}
                  className="text-left text-xs text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Privacy Policy & Data Security</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("terms")}
                  className="text-left text-xs text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Terms of Official Service</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="mt-12 pt-6 border-t border-[#132c4a] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                © 2026 Road Development Authority. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span className="font-semibold text-slate-300">
                Inclusive Connectivity and Development Project (ICDP)
              </span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Official Government Portal
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Institutional Modals for Help, Contact, Privacy, Terms */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white text-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold text-xs">
                  RDA
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {activeModal === "help" && "System Help & Guidelines"}
                  {activeModal === "contact" && "RDA ICDP Secretariat Contact"}
                  {activeModal === "privacy" && "Data Governance & Privacy"}
                  {activeModal === "terms" && "Terms of Official Service"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {activeModal === "help" && (
                <>
                  <p className="font-semibold text-slate-800">
                    How do contractors submit registrations?
                  </p>
                  <p>
                    Contractors can open the Stakeholder Registration Form,
                    populate their organizational data, save progress using a
                    secure draft token, and finalize their official submission.
                  </p>
                  <p className="font-semibold text-slate-800 pt-2">
                    Who can access the Administrative Dashboard?
                  </p>
                  <p>
                    Only authorized Road Development Authority personnel with
                    assigned officer roles (Super Admin, Provincial Director, or
                    Verification Officer) can access administrative records.
                  </p>
                </>
              )}

              {activeModal === "contact" && (
                <>
                  <p>
                    For institutional inquiries regarding the Inclusive
                    Connectivity and Development Project (ICDP) stakeholder
                    registration:
                  </p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-900">
                      Road Development Authority
                    </p>
                    <p className="text-slate-600">
                      Inclusive Connectivity and Development Project (ICDP)
                    </p>
                    <p className="text-slate-600">
                      "Maganeguma Mahamedura", Denzil Kobbekaduwa Mawatha,
                      Koswatta, Battaramulla, Sri Lanka
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Registered delegates can also consult their official
                    workshop invitation letters for designated desk officers.
                  </p>
                </>
              )}

              {activeModal === "privacy" && (
                <>
                  <p>
                    The Road Development Authority is committed to protecting all
                    commercial and personal information collected through this
                    system.
                  </p>
                  <p>
                    Information submitted by contractors, material suppliers and
                    government officers is stored securely, accessed exclusively
                    by authorized project officials, and utilized strictly for
                    statutory capacity evaluations, procurement monitoring, and
                    workshop administrative management.
                  </p>
                </>
              )}

              {activeModal === "terms" && (
                <>
                  <p>
                    By accessing or submitting information to the RDA Contractor
                    Data Collection System, you declare that all submitted
                    corporate profiles, financial figures, CIDA grades, and
                    equipment records are truthful and accurate.
                  </p>
                  <p>
                    Unauthorized access attempts or misrepresentation of
                    engineering credentials are subject to administrative audit
                    and statutory review under applicable Sri Lankan public
                    procurement frameworks.
                  </p>
                </>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 text-xs font-semibold bg-[#0b1f3a] text-white rounded-lg hover:bg-[#132f54]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
