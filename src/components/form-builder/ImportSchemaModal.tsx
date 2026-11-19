"use client";

import React, { useState } from "react";
import { X, Upload, AlertCircle, FileText } from "lucide-react";

interface ImportSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportSchemaModal: React.FC<ImportSchemaModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonText(String(event.target?.result || ""));
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setError("");
    if (!jsonText.trim()) {
      setError("Please paste a JSON schema or select a .json file.");
      return;
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(jsonText);
    } catch {
      setError("Invalid JSON format. Please ensure valid JSON syntax.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/questionnaires/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.errors ? data.errors.join("; ") : data.message || "Failed to import schema.";
        setError(errorMsg);
        return;
      }

      onImportSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error during import.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b1f3a] text-white flex items-center justify-between border-b border-[#183659]">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Import Questionnaire Schema</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <p className="text-slate-600">
            Import an official JSON questionnaire schema. Imported schemas are saved as a <strong>DRAFT</strong> so you can review and validate before publishing.
          </p>

          {/* File Picker */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Schema File (.json)</label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100"
            />
          </div>

          {/* Text Area */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Or Paste JSON Directly</label>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste JSON questionnaire schema here..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px] focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading}
            className="px-5 py-1.5 font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-lg shadow-sm text-xs disabled:opacity-60"
          >
            {loading ? "Validating & Importing..." : "Import as Draft"}
          </button>
        </div>
      </div>
    </div>
  );
};
