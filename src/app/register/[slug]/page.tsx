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
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { IQuestionnaireData, IFormSection, IFormQuestion } from "@/types/questionnaire";

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
  });

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

    setFieldErrors(errors);
    return Object.keys(errors).length === 0 && !emailUniqueError;
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
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
                setFormData({ organizationName: "", contactNumber: "", email: "" });
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

            {/* Question 4: Supplier Type */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <label className="block font-bold text-slate-800">
                4. Supplier Type <span className="text-rose-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Please select the primary supply category provided by your organization (Material, Labour, or Equipment).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {[
                  {
                    type: "Material",
                    label: "Material",
                    desc: "Bitumen, asphalt premix, aggregate, cement, steel, etc.",
                    icon: Package,
                    color: "text-blue-700",
                    borderSelected: "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/30",
                  },
                  {
                    type: "Labour",
                    label: "Labour",
                    desc: "Skilled/unskilled labour force, site crews, technical personnel.",
                    icon: Users,
                    color: "text-amber-700",
                    borderSelected: "border-amber-600 bg-amber-50/70 ring-2 ring-amber-600/30",
                  },
                  {
                    type: "Equipment",
                    label: "Equipment",
                    desc: "Heavy machinery, pavers, rollers, excavators, transport fleet.",
                    icon: Wrench,
                    color: "text-emerald-700",
                    borderSelected: "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-600/30",
                  },
                ].map((item) => {
                  const isSelected = formData.supplierType === item.type;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleChange("supplierType", item.type)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? item.borderSelected
                          : "bg-slate-50/90 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? "bg-white shadow-xs" : "bg-slate-200/70"
                          }`}>
                            <Icon className={`w-4 h-4 ${isSelected ? item.color : "text-slate-600"}`} />
                          </div>
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-blue-900 bg-blue-900"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight block mt-1">
                          {item.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {fieldErrors.supplierType && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.supplierType}</span>
                </p>
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
