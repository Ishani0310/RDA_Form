"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  QrCode,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Copy,
  Info,
  RefreshCw,
  AlertTriangle,
  Lock,
  Layers,
} from "lucide-react";
import { IFormSummary } from "@/types/questionnaire";

interface PublicConfig {
  system: string;
  organization: string;
  registrationUrl: string;
  qrCodeDataUrl: string;
  qrCodeSvg?: string;
  status: string;
}

export default function QRManagementPage() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [forms, setForms] = useState<IFormSummary[]>([]);
  const [selectedFormCode, setSelectedFormCode] = useState<string>("RDA-ICDP-CONTRACTOR-Q");
  const [loading, setLoading] = useState(true);
  const [formsLoading, setFormsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 1. Fetch available active forms
  useEffect(() => {
    const loadForms = async () => {
      try {
        setFormsLoading(true);
        const res = await fetch("/api/forms");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.forms) {
            setForms(data.forms);
          }
        }
      } catch {
        // Fallback silently
      } finally {
        setFormsLoading(false);
      }
    };
    loadForms();
  }, []);

  const selectedForm = useMemo(() => {
    return forms.find((f) => f.code === selectedFormCode) || forms[0] || null;
  }, [forms, selectedFormCode]);

  const selectedFormIndex = useMemo(() => {
    if (!selectedForm) return 0;
    const idx = forms.findIndex((f) => f.code === selectedForm.code);
    return idx >= 0 ? idx : 0;
  }, [forms, selectedForm]);

  const formNumber = selectedFormIndex + 1;
  const isForm1 =
    !selectedForm ||
    selectedForm.code === "RDA-ICDP-CONTRACTOR-Q" ||
    selectedForm.isDefault ||
    selectedForm.slug === "contractor";

  // 2. Fetch QR config for the chosen form
  const fetchConfig = async (formSlug?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url =
        !formSlug || formSlug === "contractor"
          ? "/api/public/config"
          : `/api/public/config?slug=${encodeURIComponent(formSlug)}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load QR configuration (HTTP ${res.status})`);
      }
      const data = await res.json();
      setConfig(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load QR configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedForm) {
      fetchConfig(isForm1 ? undefined : selectedForm.slug);
    } else {
      fetchConfig();
    }
  }, [selectedFormCode, forms]);

  const handleCopyUrl = async () => {
    if (!config?.registrationUrl) return;
    try {
      await navigator.clipboard.writeText(config.registrationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPng = () => {
    if (!config?.qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = config.qrCodeDataUrl;
    a.download = isForm1
      ? "RDA-Official-Contractor-Intake-Form01-QR.png"
      : `RDA-Official-Form0${formNumber}-${selectedForm?.slug || "form"}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Official Questionnaire QR System
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Access, display, and download official high-resolution QR codes for each RDA questionnaire.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchConfig(isForm1 ? undefined : selectedForm?.slug)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-900" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!config}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-all disabled:opacity-60"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Official Notice</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={!config?.qrCodeDataUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-all disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download High-Res QR</span>
          </button>
        </div>
      </div>

      {/* Form Selector Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Select Questionnaire for QR Code
            </label>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Each form receives its own dedicated QR code. Form 1&apos;s published QR code remains permanently locked and untouched.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select Form for QR Code"
              value={selectedFormCode}
              onChange={(e) => setSelectedFormCode(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:bg-white min-w-[280px]"
            >
              {forms.map((f, idx) => (
                <option key={f.code} value={f.code}>
                  Form {idx + 1}: {f.title} {f.code === "RDA-ICDP-CONTRACTOR-Q" ? "(Permanent Distributed Form)" : ""}
                </option>
              ))}
              {forms.length === 0 && (
                <option value="RDA-ICDP-CONTRACTOR-Q">
                  Form 1: RDA Contractor Registration Questionnaire (Permanent Distributed Form)
                </option>
              )}
            </select>
          </div>
        </div>

        {/* Selected Form Status Strip */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
          <span className="font-mono font-black text-[10px] text-amber-950 bg-amber-400 px-2.5 py-0.5 rounded-full shadow-2xs">
            FORM {formNumber < 10 ? `0${formNumber}` : formNumber}
          </span>
          <span className="font-bold text-slate-900 truncate max-w-md">
            {selectedForm?.title || "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire"}
          </span>
          {isForm1 ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>PERMANENT DISTRIBUTED QR (LOCKED &amp; PROTECTED)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              <QrCode className="w-3 h-3 text-blue-700" />
              <span>DEDICATED SEPARATE FORM QR</span>
            </span>
          )}
        </div>
      </div>

      {/* Operational Policy Banner */}
      {isForm1 ? (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-950">
              Form 1 Permanent National QR Code &bull; Officially Distributed &amp; Preserved
            </p>
            <p className="text-amber-800/90 leading-relaxed">
              This is the official published QR code for Form 1 that has already been distributed nationwide to contractors, suppliers, and government officers. 
              Its target destination permanently resolves to <strong>/register</strong> and is locked against changes.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-blue-900">
          <QrCode className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-blue-950">
              Form {formNumber} Dedicated Independent QR Code
            </p>
            <p className="text-blue-800/90 leading-relaxed">
              This is the distinct QR code generated exclusively for <strong>&quot;{selectedForm?.title}&quot;</strong> pointing to <strong>/register/{selectedForm?.slug}</strong>. 
              Using this QR code does not affect Form 1&apos;s published QR code in any way.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: QR Card + System Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official QR Display Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <span className="text-[11px] font-bold text-blue-950 uppercase tracking-wider">
              {isForm1 ? "Form 01 Official Display Badge" : `Form 0${formNumber} Display Badge`}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              {isForm1 ? "Permanent Locked" : "Dedicated Active"}
            </span>
          </div>

          {loading ? (
            <div className="w-64 h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
              <span className="text-xs text-slate-500 mt-2 font-medium">Generating QR Matrix...</span>
            </div>
          ) : config?.qrCodeDataUrl ? (
            <div className="relative group p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.qrCodeDataUrl}
                alt={`RDA Official Form ${formNumber} QR Code`}
                className="w-64 h-64 object-contain rounded-lg"
              />
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>RDA Verified Government Access &bull; Form {formNumber}</span>
              </div>
            </div>
          ) : (
            <div className="w-64 h-64 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
              <QrCode className="w-10 h-10" />
              <span className="text-xs mt-2">QR Code unavailable</span>
            </div>
          )}

          <div className="mt-5 w-full text-left bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Target Endpoint URL</p>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="text-xs font-mono text-blue-950 bg-white px-2.5 py-1 rounded border border-slate-200 truncate flex-1 select-all">
                {config?.registrationUrl || "Loading..."}
              </code>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-200 rounded transition-all"
                title="Copy URL"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={config?.registrationUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-slate-200 rounded transition-all"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Copied to clipboard!
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Architectural & Operational Specs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Status Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">QR Architecture</p>
              <h3 className="text-base font-black text-slate-900 mt-1">Single Common</h3>
              <span className="text-[11px] text-emerald-600 font-medium">Island-wide standard</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Intake Protocol</p>
              <h3 className="text-base font-black text-slate-900 mt-1">Self-Directed</h3>
              <span className="text-[11px] text-blue-600 font-medium">No account required</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Draft Security</p>
              <h3 className="text-base font-black text-slate-900 mt-1">SHA-256 Tokens</h3>
              <span className="text-[11px] text-amber-600 font-medium">Zero plain tokens stored</span>
            </div>
          </div>

          {/* Operational Guidance */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              Deployment &amp; On-Site Instructions for RDA Officers
            </h2>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-800">Notice Board &amp; Project Site Placement</p>
                  <p className="mt-0.5 leading-relaxed">
                    Download and print the official badge for display at RDA Head Office, 9 Provincial Offices, 25 Executive Engineer (EE) Divisions, and active construction site offices.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-800">Contractor Self-Service Onboarding</p>
                  <p className="mt-0.5 leading-relaxed">
                    Contractors scan this QR code with any standard smartphone camera. No prior officer accounts or credentials are needed to begin data entry.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-800">Secure Draft &amp; Offline Resume Token</p>
                  <p className="mt-0.5 leading-relaxed">
                    When a contractor saves a draft, the system issues a secret 64-character high-entropy resume token. Only its SHA-256 hash is held in MongoDB, guaranteeing data privacy.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  4
                </div>
                <div>
                  <p className="font-bold text-slate-800">Permanent Token Revocation Upon Submission</p>
                  <p className="mt-0.5 leading-relaxed">
                    Once the contractor reviews and files their final statutory declaration, their resume token is immediately revoked to lock the record against tampering. Submissions stream directly to the Provincial Review Queue.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Cryptographic &amp; Matrix Specifications
            </h3>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-slate-500">Encoding Scheme:</span>
              <span className="font-mono font-medium text-slate-800">QR Code ISO/IEC 18004</span>

              <span className="text-slate-500">Error Correction Level:</span>
              <span className="font-medium text-slate-800">Level Q (25% redundancy)</span>

              <span className="text-slate-500">Matrix Resolution:</span>
              <span className="font-medium text-slate-800">512 x 512 px (High-DPI)</span>

              <span className="text-slate-500">Resume Token Entropy:</span>
              <span className="font-mono font-medium text-slate-800">256-bit (CSPRNG)</span>

              <span className="text-slate-500">Token Storage Hash:</span>
              <span className="font-mono font-medium text-slate-800">SHA-256 Digest</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
