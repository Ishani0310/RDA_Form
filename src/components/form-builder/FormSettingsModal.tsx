"use client";

import React, { useState, useEffect } from "react";
import { IFormSummary } from "@/types/questionnaire";
import { X, Settings, AlertCircle, Save } from "lucide-react";

interface FormSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: IFormSummary | null;
  onUpdated: () => void;
}

export const FormSettingsModal: React.FC<FormSettingsModalProps> = ({
  isOpen,
  onClose,
  form,
  onUpdated,
}) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (form) {
      setTitle(form.title || "");
      setSlug(form.slug || "");
      setCategory(form.category || "General");
      setDescription(form.description || "");
      setInstructions(form.instructions || "");
      setError(null);
    }
  }, [form, isOpen]);

  if (!isOpen || !form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Form title cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/forms/${form.code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim().toLowerCase(),
          category: category.trim(),
          description: description.trim(),
          instructions: instructions.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onUpdated();
        onClose();
      } else {
        setError(data.message || "Failed to update form settings.");
      }
    } catch {
      setError("Network error updating form settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Form Settings & Metadata</h3>
              <p className="text-[11px] text-slate-500 font-mono">Form ID: {form.code}</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Form Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Stakeholder Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Public URL Slug</label>
              <div className="flex items-center">
                <span className="p-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-500 font-mono text-[11px]">
                  /register/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-r-xl font-mono lowercase focus:bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Instructions for Respondents</label>
            <textarea
              rows={2}
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
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-md disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
