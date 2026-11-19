"use client";

import React, { useState, useEffect } from "react";
import { IFormSection } from "@/types/questionnaire";
import { X, Layers } from "lucide-react";

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: Partial<IFormSection>) => void;
  initialSection?: IFormSection | null;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSection,
}) => {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialSection) {
      setCode(initialSection.code || "");
      setTitle(initialSection.title || "");
      setDescription(initialSection.description || "");
    } else {
      setCode(`SEC_${Date.now().toString(36).toUpperCase().slice(-4)}`);
      setTitle("");
      setDescription("");
    }
    setError("");
  }, [initialSection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Section title is required.");
      return;
    }
    if (!code.trim()) {
      setError("Section code is required.");
      return;
    }

    onSave({
      id: initialSection?.id || `sec_${Date.now().toString(36)}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || undefined,
      displayOrder: initialSection?.displayOrder || 1,
      questions: initialSection?.questions || [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 bg-[#0b1f3a] text-white flex items-center justify-between border-b border-[#183659]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              {initialSection ? "Edit Section" : "Add Questionnaire Section"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Section Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., SEC-01, SEC-COMPANY"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Section Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., General Corporate Information"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Guidance or introductory note shown to contractors..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-lg shadow-sm"
            >
              {initialSection ? "Update Section" : "Create Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
