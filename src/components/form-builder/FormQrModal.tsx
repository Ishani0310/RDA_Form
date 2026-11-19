"use client";

import React, { useState, useEffect } from "react";
import { IFormSummary } from "@/types/questionnaire";
import { X, QrCode, Copy, ExternalLink, Download, Printer, RefreshCw } from "lucide-react";

interface FormQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: IFormSummary | null;
}

export const FormQrModal: React.FC<FormQrModalProps> = ({ isOpen, onClose, form }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [regUrl, setRegUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (form && isOpen) {
      setLoading(true);
      fetch(`/api/public/config?slug=${encodeURIComponent(form.slug)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.qrCodeDataUrl) {
            setQrDataUrl(data.qrCodeDataUrl);
            setRegUrl(data.registrationUrl);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [form, isOpen]);

  if (!isOpen || !form) return null;

  const handleCopy = () => {
    if (regUrl) {
      navigator.clipboard.writeText(regUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    if (qrDataUrl) {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `rda-qr-${form.slug}.png`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{form.title}</h3>
              <p className="text-[10px] text-slate-400 font-mono">Form ID: {form.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
          {loading ? (
            <div className="py-12">
              <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mx-auto" />
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${form.title}`}
              className="w-48 h-48 rounded-xl bg-white p-2 shadow-xs border border-slate-200"
            />
          ) : (
            <div className="py-12 text-xs text-slate-400">QR Code unavailable</div>
          )}
        </div>

        {/* URL Pill & Copy */}
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Public Registration URL
          </span>
          <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="truncate font-mono text-[11px] text-blue-950 flex-1">{regUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 shadow-2xs"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          <a
            href={regUrl || `/register/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-xs transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Portal</span>
          </a>
        </div>
      </div>
    </div>
  );
};
