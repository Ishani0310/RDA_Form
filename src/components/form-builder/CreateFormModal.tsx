"use client";

import React, { useState } from "react";
import { IFormSummary } from "@/types/questionnaire";
import { X, Plus, Sparkles, AlertCircle } from "lucide-react";

interface CreateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newFormCode: string) => void;
  existingForms: IFormSummary[];
}

export const CreateFormModal: React.FC<CreateFormModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!code) {
      const generatedCode = `RDA-${val.toUpperCase().replace(/[^A-Z0-9]+/g, "-").slice(0, 16)}-Q`;
      setCode(generatedCode);
    }
    if (!slug) {
      const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24).replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Form title is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          code: code.trim().toUpperCase(),
          slug: slug.trim().toLowerCase(),
          category: category.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
          templateType: "blank",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onCreated(data.form?.code || code);
        onClose();
      } else {
        setError(data.message || "Failed to create new form.");
      }
    } catch {
      setError("Network error creating new form.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Create New Institutional Form</h3>
              <p className="text-[11px] text-slate-500">Configure a brand new independent questionnaire</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-5 py-3 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            <strong>Fresh Independent Form:</strong> Starts as a clean blank slate (0 existing questions) so you can add your own separate questions and sections.
          </span>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">

          <div>
            <label className="block text-slate-700 font-bold mb-1">Form Title *</label>
            <input
              type="text"
              placeholder="e.g., Road Safety Audit & Consultant Registration Form"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Unique Form ID (Code) *</label>
              <input
                type="text"
                placeholder="e.g., RDA-SAFETY-Q"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Unique uppercase identifier</span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Public URL Slug *</label>
              <div className="flex items-center">
                <span className="p-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-500 font-mono text-[11px]">
                  /register/
                </span>
                <input
                  type="text"
                  placeholder="safety-audit"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-r-xl font-mono lowercase focus:bg-white"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Public registration portal address</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Stakeholder Category</label>
            <input
              type="text"
              placeholder="e.g., Contractor, Supplier, Consultant, Workshop, Procurement"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Form Description</label>
            <textarea
              rows={2}
              placeholder="Brief description of the purpose of this questionnaire..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Registration Instructions</label>
            <textarea
              rows={2}
              placeholder="Instructions displayed to respondents at the top of the registration page..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-md disabled:opacity-50"
            >
              {loading ? "Creating Form..." : "Create Form"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
