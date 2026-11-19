"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  QrCode,
  FileBarChart2,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Subtle engineering-blueprint SVG pattern for the left panel
   ───────────────────────────────────────────────────────────── */
function BlueprintPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="blueprint-grid"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.5"
          />
        </pattern>
        <pattern
          id="blueprint-dots"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="1" fill="#fbbf24" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
      <rect width="100%" height="100%" fill="url(#blueprint-dots)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   RDA Emblem (amber-on-navy, consistent with Sidebar)
   ───────────────────────────────────────────────────────────── */
function RdaEmblem({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims =
    size === "lg"
      ? "w-20 h-20 text-2xl"
      : size === "sm"
      ? "w-10 h-10 text-xs"
      : "w-14 h-14 text-base";
  return (
    <div
      className={`${dims} rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[2px] shadow-xl shadow-amber-900/30 flex items-center justify-center shrink-0`}
    >
      <div className="w-full h-full bg-[#071a30] rounded-[14px] flex flex-col items-center justify-center gap-0.5">
        <span className="font-black text-amber-400 leading-none tracking-widest">
          RDA
        </span>
        {size !== "sm" && (
          <div className="w-6 h-px bg-amber-500/60" />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Left Branding Panel
   ───────────────────────────────────────────────────────────── */
function BrandingPanel() {
  const features = [
    {
      icon: MapPin,
      title: "Provincial Coverage",
      desc: "All 9 Administrative Provinces of Sri Lanka",
    },
    {
      icon: QrCode,
      title: "QR Site Verification",
      desc: "Cryptographic QR tokens for authenticated contractor access",
    },
    {
      icon: FileBarChart2,
      title: "Procurement Reporting",
      desc: "Structured capacity assessments and audit-ready submissions",
    },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-1/2 relative bg-gradient-to-br from-[#071529] via-[#0b1f3a] to-[#040e1c] overflow-hidden">
      {/* Engineering blueprint watermark */}
      <BlueprintPattern />

      {/* Radial glow */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-12">
        {/* Top badge */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
              Government of Sri Lanka
            </span>
          </div>
        </div>

        {/* Main branding */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-8">
            <RdaEmblem size="lg" />
          </div>

          <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight mb-2">
            Road Development
            <br />
            Authority
          </h1>
          <p className="text-amber-400 font-semibold text-sm uppercase tracking-widest mb-6">
            Contractor Data Collection System
          </p>

          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-10">
            Centralized digital platform for contractor capacity assessment,
            procurement grade management, and QR-based site verification across
            all RDA provincial offices.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold tracking-wide">
                    {title}
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom ministry footer */}
        <div className="border-t border-white/10 pt-6 mt-6">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Road Development Authority · &quot;Maganeguma Mahamedura&quot;,
            Battaramulla, Sri Lanka
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Ministry of Transport &amp; Highways
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Login Form Component
   ───────────────────────────────────────────────────────────── */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your official RDA email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage(
        "Please enter a valid official email address (e.g. officer.name@rda.gov.lk)."
      );
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Authentication failed. Please verify your credentials."
        );
      }
      router.push(redirectTarget);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* ── LEFT PANEL (desktop only) ── */}
      <BrandingPanel />

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 lg:w-1/2 flex flex-col bg-slate-50 min-h-screen">
        {/* Mobile-only top branding bar */}
        <div className="lg:hidden flex items-center gap-3 px-5 py-4 bg-[#0b1f3a] border-b border-blue-900/50">
          <RdaEmblem size="sm" />
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest leading-none">
              Government of Sri Lanka
            </p>
            <p className="text-xs font-bold text-white mt-0.5">
              Road Development Authority
            </p>
          </div>
        </div>

        {/* Login card container */}
        <div className="flex-1 flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-sm sm:max-w-md">

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200 overflow-hidden">

              {/* Card Header */}
              <div className="bg-gradient-to-b from-slate-50 to-white px-7 sm:px-9 pt-8 pb-6 border-b border-slate-100 text-center">
                {/* Desktop emblem (hidden on mobile since top bar shows it) */}
                <div className="hidden lg:flex justify-center mb-4">
                  <RdaEmblem size="md" />
                </div>
                <div className="flex lg:hidden justify-center mb-4 mt-1">
                  <div className="w-10 h-10 rounded-xl bg-[#0b1f3a] text-amber-400 flex items-center justify-center shadow-md">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Officer Sign In
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Restricted access · RDA Administrative Console
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mx-7 sm:mx-9 mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-7 sm:px-9 py-6 space-y-5" noValidate autoComplete="off">
                {/* Hidden decoy fields to suppress aggressive browser autofill of personal credentials */}
                <input type="text" name="decoy_username" tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="off" />
                <input type="password" name="decoy_password" tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="off" />

                {/* Email */}
                <div>
                  <label
                    htmlFor="rda-email"
                    className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5"
                  >
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="rda-email"
                      name="official_email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer.name@rda.gov.lk"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck="false"
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/60 focus:border-blue-800/40 transition-all placeholder:text-slate-400 disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="rda-password"
                    className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="rda-password"
                      name="official_password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/60 focus:border-blue-800/40 transition-all placeholder:text-slate-400 disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 rounded"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Workstation */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800 focus:ring-offset-0"
                    disabled={loading}
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Remember this authorized workstation
                  </span>
                </label>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#0b1f3a] via-[#0d274c] to-[#0a1c35] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-950/20 hover:from-blue-900 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 transition-all flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Sign In to Administrative Console</span>
                    </>
                  )}
                </button>
              </form>

              {/* Statutory Warning */}
              <div className="px-7 sm:px-9 py-3.5 bg-slate-100 border-t border-slate-200 text-[10px] text-slate-500 text-center leading-relaxed">
                <strong className="text-slate-600">Statutory Warning:</strong>{" "}
                Unauthorized access to this government information system is
                strictly prohibited under the{" "}
                <em>Computer Crimes Act No. 24 of 2007 (Sri Lanka)</em>. All
                access attempts are logged and monitored.
              </div>
            </div>

            {/* Below-card system label */}
            <p className="text-center text-[11px] text-slate-400 mt-4 leading-relaxed">
              RDA Contractor Data Collection System &nbsp;·&nbsp; v0.1&nbsp;Beta
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-3 px-5 border-t border-slate-200 text-[10px] text-slate-400 bg-white">
          Road Development Authority &nbsp;·&nbsp; Ministry of Transport &amp;
          Highways &nbsp;·&nbsp; Sri Lanka
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page export — Suspense required for useSearchParams
   ───────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b1f3a] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading RDA Portal…</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
