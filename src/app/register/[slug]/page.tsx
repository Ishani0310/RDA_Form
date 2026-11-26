"use client";

import React, { useState, useEffect, use } from "react";
import RegisterPage from "../page";
import {
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Printer,
  ExternalLink,
  RefreshCw,
  Send,
  HelpCircle,
  Copy,
  ArrowRight,
  Package,
  Truck,
  Plus,
  X,
  Users,
} from "lucide-react";
import Link from "next/link";
import { IQuestionnaireData, IFormSection, IFormQuestion } from "@/types/questionnaire";
import { SUPPLIER_MATERIALS } from "@/lib/questionnaire-types";

const LABOUR_CATEGORIES = [
  {
    id: "Skilled",
    label: "Skilled Labour",
    description: "Certified masons, carpenters, bar benders, equipment operators, electricians, welders, etc.",
  },
  {
    id: "Semi-Skilled",
    label: "Semi-Skilled Labour",
    description: "Trades assistants, experienced site hands, machine attendants, concrete placement crew.",
  },
  {
    id: "Unskilled",
    label: "Unskilled Labour",
    description: "General manual construction labour, earthwork/excavation workforce, site clearing crew.",
  },
] as const;

interface DynamicRegistrationPageProps {
  params: Promise<{ slug: string }>;
}

export default function DynamicRegistrationPage({ params }: DynamicRegistrationPageProps) {
  const resolvedParams = use(params);
  const slug = (resolvedParams.slug || "").trim().toLowerCase();

  // If the slug is 'contractor', strictly preserve and render Form 1
  if (slug === "contractor" || !slug) {
    return <RegisterPage />;
  }

  return <CustomFormRegistrationPortal slug={slug} />;
}

function CustomFormRegistrationPortal({ slug }: { slug: string }) {
  const [questionnaire, setQuestionnaire] = useState<IQuestionnaireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Field values state
  const [formData, setFormData] = useState<Record<string, any>>({
    organizationName: "",
    contactNumber: "",
    email: "",
    supplierType: "",
    materialsSupplied: [] as string[],
    materialsOther: "",
    supplyCapacities: {} as Record<string, any>,
    labourCategories: [] as string[],
    labourDetails: {} as Record<string, any>,
  });
  const [supplierMaterialsOtherList, setSupplierMaterialsOtherList] = useState<string[]>([""]);

  // Validation errors state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailUniqueError, setEmailUniqueError] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    reference: string;
    organizationName: string;
    contactNumber: string;
    email: string;
    supplierType?: string;
    materialsSupplied?: string[];
    labourCategories?: string[];
    submittedAt: string;
  } | null>(null);

  // Fetch form schema
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/public/questionnaire?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.questionnaire) {
          setQuestionnaire(d.questionnaire);
        } else {
          setError(d.message || "Failed to load registration form.");
        }
      })
      .catch(() => setError("Network error loading registration form."))
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle value change
  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
    if (fieldId === "email" && emailUniqueError) {
      setEmailUniqueError(null);
    }
  };

  // Handle materials toggle for material supplier
  const handleMaterialToggle = (mat: string) => {
    setFormData((prev) => {
      const currentList: string[] = prev.materialsSupplied || [];
      const updated = currentList.includes(mat)
        ? currentList.filter((m) => m !== mat)
        : [...currentList, mat];
      return { ...prev, materialsSupplied: updated };
    });
    if (fieldErrors.materialsSupplied) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.materialsSupplied;
        return copy;
      });
    }
  };

  const handleAddSupplierMaterialOther = () => {
    setSupplierMaterialsOtherList((prev) => [...prev, ""]);
  };

  const handleRemoveSupplierMaterialOther = (index: number) => {
    setSupplierMaterialsOtherList((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      const combined = updated.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({ ...f, materialsOther: combined }));
      return updated.length > 0 ? updated : [""];
    });
  };

  const handleUpdateSupplierMaterialOther = (index: number, val: string) => {
    setSupplierMaterialsOtherList((prev) => {
      const updated = [...prev];
      updated[index] = val;
      const combined = updated.map((s) => s.trim()).filter(Boolean).join(", ");
      setFormData((f) => ({ ...f, materialsOther: combined }));
      return updated;
    });
  };

  // Handle capacity changes
  const handleCapacityChange = (matKey: string, field: string, val: string) => {
    setFormData((prev) => {
      const caps = { ...(prev.supplyCapacities || {}) };
      caps[matKey] = {
        ...(caps[matKey] || { quantity: "", unit: "MT per year", rate: "", rateUnit: "cu.m" }),
        [field]: val,
      };
      return { ...prev, supplyCapacities: caps };
    });
  };

  // Handle labour categories toggle
  const handleLabourCategoryToggle = (catId: string) => {
    setFormData((prev) => {
      const currentList: string[] = prev.labourCategories || [];
      const updated = currentList.includes(catId)
        ? currentList.filter((c) => c !== catId)
        : [...currentList, catId];
      return { ...prev, labourCategories: updated };
    });
    if (fieldErrors.labourCategories) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.labourCategories;
        return copy;
      });
    }
  };

  // Handle labour category details
  const handleLabourDetailChange = (catId: string, field: string, val: string) => {
    setFormData((prev) => {
      const currentDetails = { ...(prev.labourDetails || {}) };
      currentDetails[catId] = {
        ...(currentDetails[catId] || { count: "", rate: "", trades: "" }),
        [field]: val,
      };
      return { ...prev, labourDetails: currentDetails };
    });
  };

  // Real-time unique email check on blur
  const handleEmailBlur = async () => {
    const rawEmail = (formData.email || "").trim().toLowerCase();
    if (!rawEmail) return;

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      setFieldErrors((prev) => ({ ...prev, email: "Please enter a valid email address (e.g. name@domain.com)." }));
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await fetch(`/api/public/check-email?email=${encodeURIComponent(rawEmail)}&slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (!data.available) {
        setEmailUniqueError(data.message || "This email address has already been used for an official registration. Email must be unique.");
      } else {
        setEmailUniqueError(null);
      }
    } catch {
      // Ignore network hiccup on check
    } finally {
      setCheckingEmail(false);
    }
  };

  // Validate all fields
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Organization Name
    const org = (formData.organizationName || "").trim();
    if (!org) {
      errors.organizationName = "Organization / Company name is required.";
    } else if (org.length < 3) {
      errors.organizationName = "Organization name must be at least 3 characters.";
    } else if (org.length > 200) {
      errors.organizationName = "Organization name cannot exceed 200 characters.";
    }

    // 2. Phone Number
    const phone = (formData.contactNumber || "").trim();
    if (!phone) {
      errors.contactNumber = "Organization contact phone number is required.";
    } else {
      const digitsOnly = phone.replace(/[^0-9]/g, "");
      if (digitsOnly.length < 9 || digitsOnly.length > 15) {
        errors.contactNumber = "Please enter a valid telephone/mobile number (9 to 15 digits).";
      }
    }

    // 3. Email
    const email = (formData.email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = "Official organization email address is required.";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    } else if (emailUniqueError) {
      errors.email = emailUniqueError;
    }

    // 4. Supplier Type
    const supType = (formData.supplierType || "").trim();
    if (!supType) {
      errors.supplierType = "Supplier type is required. Please select Material, Labour, or Equipment.";
    } else if (!["Material", "Labour", "Equipment"].includes(supType)) {
      errors.supplierType = "Please select a valid supplier type (Material, Labour, or Equipment).";
    }

    // If Material is selected, require at least one material selected
    if (supType === "Material") {
      if (!formData.materialsSupplied || formData.materialsSupplied.length === 0) {
        errors.materialsSupplied = "Please select at least one material you supply.";
      } else if (formData.materialsSupplied.includes("Other")) {
        const hasOtherValue =
          supplierMaterialsOtherList.some((s) => s.trim().length > 0) ||
          Boolean(formData.materialsOther?.trim());
        if (!hasOtherValue) {
          errors.materialsOther = "Please specify the other material(s) you supply.";
        }
      }
    }

    // If Labour is selected, require at least one labour category
    if (supType === "Labour") {
      if (!formData.labourCategories || formData.labourCategories.length === 0) {
        errors.labourCategories = "Please select at least one labour category (Skilled, Semi-Skilled, or Unskilled).";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0 && !emailUniqueError;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const otherCombined = supplierMaterialsOtherList
        .map((s) => s.trim())
        .filter(Boolean)
        .join(", ");

      const payload = {
        businessName: formData.organizationName.trim(),
        formId: questionnaire?.code || "RDA-SUPPLIER-Q",
        formSlug: questionnaire?.slug || slug,
        questionnaireData: {
          ...formData,
          organizationName: formData.organizationName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          supplierType: (formData.supplierType || "Material").trim(),
          materialsSupplied: formData.materialsSupplied || [],
          materialsOther: otherCombined || formData.materialsOther || "",
          supplyCapacities: formData.supplyCapacities || {},
          labourCategories: formData.labourCategories || [],
          labourDetails: formData.labourDetails || {},
          supplierDetails: {
            companyName: formData.organizationName.trim(),
            materialsSupplied: formData.materialsSupplied || [],
            materialsOther: otherCombined || formData.materialsOther || "",
            supplyCapacities: formData.supplyCapacities || {},
            labourCategories: formData.labourCategories || [],
            labourDetails: formData.labourDetails || {},
          },
          participantCategory: questionnaire?.category || "Supplier",
        },
      };

      const res = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsRedirecting(false);

        const refNo =
          data.submissionReference ||
          data.submission?.reference ||
          data.reference ||
          "";

        setSubmissionSuccess({
          reference: refNo,
          organizationName: formData.organizationName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          supplierType: (formData.supplierType || "Material").trim(),
          materialsSupplied: formData.materialsSupplied || [],
          labourCategories: formData.labourCategories || [],
          submittedAt: new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const msg = data.message || "Failed to submit questionnaire.";
        if (msg.toLowerCase().includes("email")) {
          setEmailUniqueError(msg);
          setFieldErrors((prev) => ({ ...prev, email: msg }));
        } else {
          alert(`Submission Error: ${msg}`);
        }
      }
    } catch {
      alert("Network error submitting questionnaire. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <RefreshCw className="w-8 h-8 text-blue-900 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Official Registration Portal...</p>
        <p className="text-xs text-slate-400 mt-1">Connecting to Government of Sri Lanka Road Development Authority</p>
      </div>
    );
  }

  if (error || !questionnaire) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Registration Form Not Found</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {error || `No published form found for address "/register/${slug}".`}
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-sm"
            >
              <span>Go to Contractor Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS CONFIRMATION RECEIPT VIEW
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 flex items-center justify-center">
        <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6">
          {/* Header Logos */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ministry-logo.png" alt="Ministry" className="h-10 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rda-logo.png" alt="RDA" className="h-10 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icdp-logo.jpg" alt="ICDP" className="h-10 w-auto object-contain" />
          </div>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Thank You for Your Submission!
            </h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your official supplier registration has been successfully recorded in the Road Development Authority system.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Official Filing Reference
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                VERIFIED FILING
              </span>
            </div>

            <div className="text-center py-2">
              <span className="font-mono text-xl sm:text-2xl font-black text-blue-950 tracking-wider select-all">
                {submissionSuccess.reference}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Keep this official reference number for all institutional correspondence.</p>
            </div>

            <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Organization Name</span>
                <span className="font-bold text-slate-800">{submissionSuccess.organizationName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Supplier Type</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200 mt-0.5">
                  {submissionSuccess.supplierType || "Material"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Contact Number</span>
                <span className="font-bold text-slate-800">{submissionSuccess.contactNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Registered Email</span>
                <span className="font-bold text-blue-900">{submissionSuccess.email}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Filing Timestamp</span>
                <span className="font-bold text-slate-800">{submissionSuccess.submittedAt}</span>
              </div>
              {submissionSuccess.materialsSupplied && submissionSuccess.materialsSupplied.length > 0 && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    Materials Supplied
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {submissionSuccess.materialsSupplied.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {submissionSuccess.labourCategories && submissionSuccess.labourCategories.length > 0 && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                    Labour Categories Supplied
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {submissionSuccess.labourCategories.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Official Receipt</span>
            </button>
            <Link
              href={`/register/${slug}`}
              onClick={() => {
                setSubmissionSuccess(null);
                setFormData({
                  organizationName: "",
                  contactNumber: "",
                  email: "",
                  supplierType: "",
                  materialsSupplied: [],
                  materialsOther: "",
                  supplyCapacities: {},
                  labourCategories: [],
                  labourDetails: {},
                });
                setSupplierMaterialsOtherList([""]);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl shadow-xs transition-all"
            >
              <span>Submit Another</span>
            </Link>
          </div>

          <p className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100">
            &copy; 2026 Road Development Authority (RDA). Inclusive Connectivity and Development Project (ICDP).
          </p>
        </div>
      </div>
    );
  }

  // ACTIVE REGISTRATION FORM VIEW
  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 relative">
      {/* Redirecting Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold">Supplier Registration Submitted Successfully!</h2>
          <p className="text-xs text-slate-300 mt-2 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Redirecting to Material Suppliers Directory...</span>
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Government Letterhead Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ministry-logo.png" alt="Ministry of Transport" className="h-8 sm:h-10 w-auto object-contain" />
            <div className="h-8 w-px bg-slate-200" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rda-logo.png" alt="Road Development Authority" className="h-8 sm:h-10 w-auto object-contain" />
            <div className="h-8 w-px bg-slate-200" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icdp-logo.jpg" alt="ICDP" className="h-8 sm:h-10 w-auto object-contain" />
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">
              Government of Sri Lanka
            </span>
            <span className="text-xs font-black text-blue-950 block">
              Road Development Authority
            </span>
          </div>
        </div>

        {/* Hero Form Header Card */}
        <div className="bg-[#0b1f3a] text-white p-5 sm:p-7 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-black text-[10px] text-amber-950 bg-amber-400 px-2.5 py-0.5 rounded-full shadow-2xs">
                FORM 02
              </span>
              <span className="font-mono font-bold text-[10px] text-blue-200 bg-blue-900/60 border border-blue-700/60 px-2 py-0.5 rounded">
                {questionnaire.code}
              </span>
              <span className="text-[10px] font-bold bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full">
                {questionnaire.category || "Supplier"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {questionnaire.title}
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {questionnaire.description || "Official institutional questionnaire for materials suppliers under the Inclusive Connectivity and Development Project (ICDP)."}
            </p>

            {questionnaire.instructions && (
              <div className="pt-2 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-1.5 border-t border-white/10 mt-2">
                <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>{questionnaire.instructions}</span>
              </div>
            )}
          </div>
        </div>

        {/* Registration Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-900" />
              <span>1. Supplier Organization &amp; Contact Details</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All three fields below are mandatory. Each organization must register using a unique email address.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Question 1: Organization Name */}
            <div className="space-y-1.5">
              <label htmlFor="input-org-name" className="block font-bold text-slate-800">
                1. Name of Supplier Organization / Company <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Official registered corporate or commercial trading name.
              </p>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-org-name"
                  type="text"
                  placeholder="e.g., Lanka Asphalt & Aggregates (Pvt) Ltd"
                  value={formData.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.organizationName
                      ? "border-rose-400 focus:ring-rose-200 text-rose-950"
                      : "border-slate-300 focus:ring-blue-900/30 text-slate-900"
                  }`}
                  required
                />
              </div>
              {fieldErrors.organizationName && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.organizationName}</span>
                </p>
              )}
            </div>

            {/* Question 2: Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="input-phone" className="block font-bold text-slate-800">
                2. Organization Contact Telephone / Mobile Number <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Active official contact number for institutional correspondence (e.g., +94 11 234 5678 or 077 123 4567).
              </p>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-phone"
                  type="tel"
                  placeholder="+94 11 234 5678 / 077 123 4567"
                  value={formData.contactNumber}
                  onChange={(e) => handleChange("contactNumber", e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.contactNumber
                      ? "border-rose-400 focus:ring-rose-200 text-rose-950"
                      : "border-slate-300 focus:ring-blue-900/30 text-slate-900"
                  }`}
                  required
                />
              </div>
              {fieldErrors.contactNumber && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.contactNumber}</span>
                </p>
              )}
            </div>

            {/* Question 3: Email Address (Unique) */}
            <div className="space-y-1.5">
              <label htmlFor="input-email" className="block font-bold text-slate-800">
                3. Official Organization Email Address (Unique) <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Primary verified email. Official registration confirmation and tracking reference will be dispatched to this address. <strong>Must be unique per supplier.</strong>
              </p>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="input-email"
                  type="email"
                  placeholder="e.g., supplier@organization.lk"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={handleEmailBlur}
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    fieldErrors.email || emailUniqueError
                      ? "border-rose-400 focus:ring-rose-200 text-rose-950 bg-rose-50/30"
                      : "border-slate-300 focus:ring-blue-900/30 text-slate-900"
                  }`}
                  required
                />
                {checkingEmail && (
                  <RefreshCw className="w-4 h-4 text-blue-900 animate-spin absolute right-3 top-3 pointer-events-none" />
                )}
              </div>

              {emailUniqueError ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 mt-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{emailUniqueError}</span>
                </div>
              ) : fieldErrors.email ? (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified unique institutional email requirement enforced.</span>
                </p>
              )}
            </div>
          </div>

          {/* SECTION 2: SUPPLIER DETAILS */}
          <div className="pt-6 border-t border-slate-200 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-900" />
                <span>2. Supplier Details</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your supplier category and provide specific operational capacity details.
              </p>
            </div>

            <div className="space-y-5 text-xs">
              {/* Supplier Type Selection */}
              <div className="space-y-1.5">
                <label htmlFor="input-supplier-type" className="block font-bold text-slate-800">
                  Supplier Type <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Please select the primary supply category provided by your organization (Material, Labour, or Equipment).
                </p>
                <div className="relative">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    id="input-supplier-type"
                    value={formData.supplierType}
                    onChange={(e) => handleChange("supplierType", e.target.value)}
                    className={`w-full pl-9 pr-8 py-2.5 bg-slate-50 border rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 transition-all cursor-pointer text-slate-900 ${
                      fieldErrors.supplierType
                        ? "border-rose-400 focus:ring-rose-200 text-rose-950"
                        : "border-slate-300 focus:ring-blue-900/30"
                    }`}
                    required
                  >
                    <option value="" disabled>-- Select Supplier Type --</option>
                    <option value="Material">Material (Bitumen, asphalt premix, aggregate, cement, steel, etc.)</option>
                    <option value="Labour">Labour (Skilled/unskilled labour force, site crews, technical personnel)</option>
                    <option value="Equipment">Equipment (Heavy machinery, pavers, rollers, excavators, transport fleet)</option>
                  </select>
                </div>

                {fieldErrors.supplierType && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.supplierType}</span>
                  </p>
                )}
              </div>

              {/* Conditionally Show Material Details when Material is selected */}
              {formData.supplierType === "Material" && (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
                  <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-950">
                    <p className="leading-relaxed">
                      Please provide details of the materials you supply and your production/supply capacity.
                    </p>
                  </div>

                <div className="space-y-4 text-xs">
                  {/* Material Selection Checkboxes */}
                  <div id="input-supplierDetails-materialsSupplied">
                    <label className="block font-semibold text-slate-700 mb-2">
                      Please select the material(s) you supply <span className="text-rose-500">*</span> (Multiple selection allowed)
                    </label>
                    <div
                      className={`grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1.5 rounded-xl transition-all ${
                        fieldErrors.materialsSupplied ? "bg-rose-50/40 border-2 border-rose-500" : ""
                      }`}
                    >
                      {SUPPLIER_MATERIALS.map((mat) => {
                        const isChecked = (formData.materialsSupplied || []).includes(mat);
                        return (
                          <label
                            key={mat}
                            className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-blue-50/80 border-blue-800 text-blue-950 font-semibold shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleMaterialToggle(mat)}
                              className="w-4 h-4 text-blue-900 rounded focus:ring-blue-800 cursor-pointer"
                            />
                            <span>{mat}</span>
                          </label>
                        );
                      })}
                    </div>
                    {fieldErrors.materialsSupplied && (
                      <div role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <span>{fieldErrors.materialsSupplied}</span>
                      </div>
                    )}

                    {/* Specify Other Supplied Material(s) */}
                    {(formData.materialsSupplied || []).includes("Other") && (
                      <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                            Specify Other Supplied Material(s) <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[11px] text-slate-500">
                            Add one or more material types
                          </span>
                        </div>

                        <div className="space-y-2">
                          {supplierMaterialsOtherList.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                  handleUpdateSupplierMaterialOther(idx, e.target.value);
                                  if (fieldErrors.materialsOther) {
                                    setFieldErrors((prev) => {
                                      const copy = { ...prev };
                                      delete copy.materialsOther;
                                      return copy;
                                    });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddSupplierMaterialOther();
                                  }
                                }}
                                placeholder={
                                  idx === 0
                                    ? "If Other, please specify your material type..."
                                    : `Additional material #${idx + 1}`
                                }
                                className={`flex-1 p-2 bg-white rounded-lg text-slate-900 text-xs focus:outline-hidden focus:ring-2 ${
                                  fieldErrors.materialsOther && idx === 0
                                    ? "border-2 border-rose-500 focus:ring-rose-200"
                                    : "border border-slate-300 focus:ring-blue-800"
                                }`}
                              />
                              {supplierMaterialsOtherList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSupplierMaterialOther(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                                  title="Remove this material"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {fieldErrors.materialsOther && (
                          <div role="alert" className="flex items-start gap-1.5 mt-1 text-xs font-semibold text-rose-600 animate-fadeIn">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                            <span>{fieldErrors.materialsOther}</span>
                          </div>
                        )}

                        <div>
                          <button
                            type="button"
                            onClick={handleAddSupplierMaterialOther}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-900 hover:text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add another material</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Annual Supply Capacity Per Selected Material */}
                  {(formData.materialsSupplied || []).length > 0 && (
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[11px] block">
                          Annual Supply Capacity &amp; Rates
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Specify annual production or supply capacity with its unit (e.g. MT per year), and enter the unit rate with its selected unit.
                        </span>
                      </div>

                      {/* Desktop Header */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="sm:col-span-2">Material</div>
                        <div className="sm:col-span-6">Annual Capacity (Quantity &amp; Unit)</div>
                        <div className="sm:col-span-4">Rate &amp; Unit</div>
                      </div>

                      <div className="space-y-2.5">
                        {(() => {
                          const capacityRows: { key: string; label: string }[] = [];
                          const mats: string[] = formData.materialsSupplied || [];
                          const otherItems = supplierMaterialsOtherList
                            .map((s) => s.trim())
                            .filter(Boolean);

                          mats.forEach((mat: string) => {
                            if (mat !== "Other") {
                              capacityRows.push({ key: mat, label: mat });
                            } else if (otherItems.length === 0) {
                              capacityRows.push({ key: "Other", label: "Other" });
                            } else {
                              otherItems.forEach((item) => {
                                capacityRows.push({
                                  key: `Other (${item})`,
                                  label: `Other (${item})`,
                                });
                              });
                            }
                          });

                          return capacityRows.map((row) => {
                            const defaultUnit = "MT per year";
                            const cap =
                              formData.supplyCapacities?.[row.key] || {
                                quantity: "",
                                unit: defaultUnit,
                                rate: "",
                                rateUnit: "cu.m",
                              };

                            return (
                              <div
                                key={row.key}
                                className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2.5 sm:items-center"
                              >
                                <div className="sm:col-span-2">
                                  <span className="font-semibold text-blue-950 text-xs sm:text-sm block">
                                    {row.label}
                                  </span>
                                </div>

                                {/* 1. Annual Capacity */}
                                <div className="sm:col-span-6">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                    Annual Capacity (Quantity &amp; Unit)
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={cap.quantity !== null && cap.quantity !== undefined ? cap.quantity : ""}
                                      onChange={(e) => handleCapacityChange(row.key, "quantity", e.target.value)}
                                      placeholder="Quantity (e.g. 50,000)"
                                      className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800 font-mono"
                                    />
                                    <input
                                      type="text"
                                      value={cap.unit || ""}
                                      onChange={(e) => handleCapacityChange(row.key, "unit", e.target.value)}
                                      placeholder="Unit (e.g. MT per year)"
                                      className="w-1/2 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800"
                                    />
                                  </div>
                                </div>

                                {/* 2. Rate & Unit */}
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                    Rate &amp; Unit
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center w-3/5">
                                      <span className="px-2 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-[10px] font-bold text-slate-600 select-none">
                                        LKR
                                      </span>
                                      <input
                                        type="text"
                                        value={cap.rate !== null && cap.rate !== undefined ? cap.rate : ""}
                                        onChange={(e) => handleCapacityChange(row.key, "rate", e.target.value)}
                                        placeholder="Rate (e.g. 4,500)"
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-r-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800 font-mono"
                                      />
                                    </div>
                                    <div className="w-2/5">
                                      <select
                                        value={cap.rateUnit || "cu.m"}
                                        onChange={(e) => handleCapacityChange(row.key, "rateUnit", e.target.value)}
                                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-semibold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-800 cursor-pointer"
                                      >
                                        <option value="cu.m">cu.m</option>
                                        <option value="cube">cube</option>
                                        <option value="MT">MT</option>
                                        <option value="Liters">Liter</option>
                                        <option value="Nos">Nos</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conditionally Show Labour Details when Labour is selected */}
            {formData.supplierType === "Labour" && (
              <div className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn">
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-950">
                  <p className="leading-relaxed">
                    Please provide details of the labour categories supplied by your organization and available workforce capacity.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Labour Category Selection Checkboxes */}
                  <div id="input-supplierDetails-labourCategories">
                    <label className="block font-semibold text-slate-700 mb-2">
                      Please select the labour category(ies) you supply <span className="text-rose-500">*</span> (Multiple selection allowed)
                    </label>
                    <div
                      className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 rounded-xl transition-all ${
                        fieldErrors.labourCategories ? "bg-rose-50/40 border-2 border-rose-500" : ""
                      }`}
                    >
                      {LABOUR_CATEGORIES.map((cat) => {
                        const isChecked = (formData.labourCategories || []).includes(cat.id);
                        return (
                          <label
                            key={cat.id}
                            className={`flex flex-col gap-1 p-3 border rounded-xl cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-amber-50/80 border-amber-600 text-amber-950 font-semibold shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleLabourCategoryToggle(cat.id)}
                                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                              />
                              <span className="font-bold text-slate-900">{cat.label}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 pl-6 leading-tight font-normal">
                              {cat.description}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {fieldErrors.labourCategories && (
                      <div role="alert" className="flex items-start gap-1.5 mt-2 text-xs font-semibold text-rose-600 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                        <span>{fieldErrors.labourCategories}</span>
                      </div>
                    )}
                  </div>

                  {/* Labour Capacity & Rate Details for selected categories */}
                  {(formData.labourCategories || []).length > 0 && (
                    <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-900 uppercase text-[11px] block">
                          Workforce Capacity &amp; Daily Rates
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Specify available personnel count, daily wage/rate (LKR per day), and key trades provided.
                        </span>
                      </div>

                      {/* Desktop Header */}
                      <div className="hidden sm:grid sm:grid-cols-12 gap-2.5 px-3 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <div className="sm:col-span-3">Labour Category</div>
                        <div className="sm:col-span-3">Available Workforce (Personnel Count)</div>
                        <div className="sm:col-span-3">Daily Rate (LKR / Day)</div>
                        <div className="sm:col-span-3">Key Trades / Specialization</div>
                      </div>

                      <div className="space-y-2.5">
                        {LABOUR_CATEGORIES.filter((cat) => (formData.labourCategories || []).includes(cat.id)).map((cat) => {
                          const details = formData.labourDetails?.[cat.id] || { count: "", rate: "", trades: "" };
                          return (
                            <div
                              key={cat.id}
                              className="p-3 bg-white border border-slate-200 rounded-lg space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2.5 sm:items-center"
                            >
                              <div className="sm:col-span-3">
                                <span className="font-semibold text-amber-950 text-xs sm:text-sm block">
                                  {cat.label}
                                </span>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                  Available Workforce
                                </label>
                                <input
                                  type="text"
                                  value={details.count || ""}
                                  onChange={(e) => handleLabourDetailChange(cat.id, "count", e.target.value)}
                                  placeholder="e.g. 25 workers"
                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                  Daily Rate (LKR)
                                </label>
                                <div className="flex items-center">
                                  <span className="px-2 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-[10px] font-bold text-slate-600 select-none">
                                    LKR
                                  </span>
                                  <input
                                    type="text"
                                    value={details.rate || ""}
                                    onChange={(e) => handleLabourDetailChange(cat.id, "rate", e.target.value)}
                                    placeholder="e.g. 4,500 / day"
                                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-r-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-3">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 sm:hidden">
                                  Key Trades
                                </label>
                                <input
                                  type="text"
                                  value={details.trades || ""}
                                  onChange={(e) => handleLabourDetailChange(cat.id, "trades", e.target.value)}
                                  placeholder="e.g. Masons, Carpenters"
                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Submission Notice & Submit Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
              <span>Official Government Filing &bull; Democratic Socialist Republic of Sri Lanka</span>
            </div>

            <button
              type="submit"
              disabled={submitting || checkingEmail}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Filing Registration...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>Submit Supplier Registration</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 py-3">
          &copy; 2026 Road Development Authority (RDA). Inclusive Connectivity and Development Project (ICDP).
        </div>
      </div>
    </div>
  );
}
