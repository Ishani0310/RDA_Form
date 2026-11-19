"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export const HomeNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#hero" },
    { label: "About", href: "#about" },
    { label: "Services / Modules", href: "#modules" },
    { label: "Help", href: "#how-it-works" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
            : "bg-white border-b border-slate-200/80"
        }`}
      >
        {/* Top National Identity Ribbon */}
        <div className="bg-[#0b1f3a] text-slate-200 text-[11px] py-1 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="font-semibold tracking-wider text-amber-300 uppercase text-[10px] sm:text-[11px]">
                Democratic Socialist Republic of Sri Lanka
              </span>
              <span className="text-slate-500 hidden md:inline">|</span>
              <span className="text-slate-300 hidden md:inline">
                Ministry of Transport and Highways
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="hidden sm:flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official Institutional Portal</span>
              </span>
              <span className="text-amber-400/90 font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">
                RDA-ICDP
              </span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          {/* Left: RDA Identity */}
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none group shrink-0"
            aria-label="Road Development Authority Home"
          >
            {/* RDA Emblem */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[2px] shadow-sm flex items-center justify-center shrink-0 transition-transform group-hover:scale-[1.02]">
              <div className="w-full h-full bg-[#0b1f3a] rounded-[10px] flex items-center justify-center text-amber-400 font-black text-xs sm:text-sm tracking-wider">
                RDA
              </div>
            </div>

            {/* Organization Title */}
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-900 tracking-wider uppercase leading-none">
                Road Development Authority
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                Contractor Data Collection System
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline leading-none mt-0.5">
                Inclusive Connectivity and Development Project (ICDP)
              </span>
            </div>
          </Link>

          {/* Right: Desktop Navigation Items & Access Portal Button */}
          <div className="hidden lg:flex items-center gap-6">
            <nav className="flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="h-5 w-px bg-slate-200"></div>

            {/* Access Portal CTA */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] active:bg-[#07172c] rounded-lg shadow-sm hover:shadow transition-all group"
            >
              <span>Access Portal</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0b1f3a] rounded-lg shadow-sm"
            >
              <span>Access</span>
              <ArrowRight className="w-3 h-3 text-amber-400" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <span>{link.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              ))}
            </nav>

            <div className="pt-3 mt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#0b1f3a] rounded-lg shadow"
              >
                <span>Access Portal (Administrative Login)</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                <span>Stakeholder Registration Form</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
