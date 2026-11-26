"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IQuestionnaireData,
  IFormSection,
  IFormQuestion,
  IFormSummary,
  computeQuestionnaireStats,
} from "@/types/questionnaire";
import { FormsDashboard } from "@/components/form-builder/FormsDashboard";
import { CreateFormModal } from "@/components/form-builder/CreateFormModal";
import { FormSettingsModal } from "@/components/form-builder/FormSettingsModal";
import { FormQrModal } from "@/components/form-builder/FormQrModal";
import { QuestionModal } from "@/components/form-builder/QuestionModal";
import { SectionModal } from "@/components/form-builder/SectionModal";
import { PreviewModal } from "@/components/form-builder/PreviewModal";
import { ValidationModal } from "@/components/form-builder/ValidationModal";
import { VersionHistoryDrawer } from "@/components/form-builder/VersionHistoryDrawer";
import { ImportSchemaModal } from "@/components/form-builder/ImportSchemaModal";
import { DynamicFormRenderer } from "@/components/dynamic-form/DynamicFormRenderer";
import { validateQuestionnaireSchema, SchemaValidationReport } from "@/lib/questionnaire-schema-validator";
import {
  FormInput,
  Lock,
  Unlock,
  Plus,
  Save,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  History,
  Search,
  Filter,
  Layers,
  Sparkles,
  HelpCircle,
  Trash2,
  Edit2,
  Printer,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronsUpDown,
  ArrowLeft,
  ExternalLink,
  QrCode,
  LayoutGrid,
  Phone,
  Mail,
  Calendar,
  Clock,
  Info,
  AlertTriangle,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function FormBuilderPage() {
  // Top-level Navigation Mode: "DASHBOARD" (Forms Hub) or "WORKSPACE" (Form Editor)
  const [viewMode, setViewMode] = useState<"DASHBOARD" | "WORKSPACE">("DASHBOARD");
  const [showWorkshopInfo, setShowWorkshopInfo] = useState(false);

  // Multi-Form Hub State
  const [forms, setForms] = useState<IFormSummary[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [selectedFormCode, setSelectedFormCode] = useState<string>("RDA-ICDP-CONTRACTOR-Q");

  // Forms Hub Modals
  const [createFormModalOpen, setCreateFormModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingFormSettings, setEditingFormSettings] = useState<IFormSummary | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalForm, setQrModalForm] = useState<IFormSummary | null>(null);

  // Active Questionnaire Workspace State
  const [questionnaire, setQuestionnaire] = useState<IQuestionnaireData | null>(null);
  const [sections, setSections] = useState<IFormSection[]>([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Two Admin Modes: "VIEW" (Public Form View simulation) or "EDIT" (Exact design + Admin controls)
  const [adminMode, setAdminMode] = useState<"VIEW" | "EDIT">("EDIT");
  const [simulatedValues, setSimulatedValues] = useState<Record<string, any>>({});

  // Active section selection ("ALL" or specific section ID)
  const [activeSectionId, setActiveSectionId] = useState<string>("ALL");

  // Track expanded state for accordion sections
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({});

  // Search and filter inside Form Builder
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "REQUIRED" | "OPTIONAL" | "CONDITIONAL" | "FILES" | "CHOICE" | "TEXT" | "NUMERIC"
  >("ALL");

  // Permissions & Policy Lock
  const [permissions, setPermissions] = useState<{
    canEdit: boolean;
    canPublish: boolean;
    canLock: boolean;
    canImport: boolean;
    canExport: boolean;
  }>({
    canEdit: false,
    canPublish: false,
    canLock: false,
    canImport: false,
    canExport: true,
  });
  const [effectiveStatus, setEffectiveStatus] = useState<string>("DRAFT");

  // Workspace Modals
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<IFormQuestion | null>(null);
  const [targetSectionForNewQuestion, setTargetSectionForNewQuestion] = useState<string>("");

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<IFormSection | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "question" | "section" | "form";
    targetId: string;
    targetName: string;
    sectionId?: string;
    count?: number;
  } | null>(null);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationReport, setValidationReport] = useState<SchemaValidationReport | null>(null);
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Notification message
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // 1. Fetch Forms List for Centralized Hub
  const loadFormsList = async () => {
    setFormsLoading(true);
    try {
      const res = await fetch("/api/forms");
      const data = await res.json();
      if (data.success && data.forms) {
        setForms(data.forms);
      } else {
        showNotification("error", data.message || "Failed to load forms list.");
      }
    } catch {
      showNotification("error", "Network error loading forms list.");
    } finally {
      setFormsLoading(false);
    }
  };

  // 2. Load Active Questionnaire for Workspace
  const loadQuestionnaire = async (formCode?: string, forceSync = false) => {
    const codeToLoad = formCode || selectedFormCode;
    setWorkspaceLoading(true);
    try {
      const res = await fetch(`/api/questionnaires/current?code=${encodeURIComponent(codeToLoad)}${forceSync ? "&sync=true" : ""}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success && data.questionnaire) {
        setQuestionnaire(data.questionnaire);
        setSelectedFormCode(data.questionnaire.code);
        const fetchedSections = data.questionnaire.sections || [];
        setSections(fetchedSections);
        setPermissions(data.permissions || {});
        setEffectiveStatus(data.effectiveStatus || data.questionnaire.status);
        setHasUnsavedChanges(false);

        // Pre-populate simulated values with interactive defaults so sections can be inspected immediately
        const initialVals: Record<string, any> = {
          organizationName: "Sri Lanka Infrastructure Corp",
          contactNumber: "+94 11 234 5678",
          email: "info@slic.lk",
          willParticipate: "Yes",
          participantCategory: "Contractor",
          hasOngoingContracts: "Yes",
          "supplierDetails.materialsSupplied": ["Bitumen / Asphalt", "Aggregates"],
        };
        fetchedSections.forEach((s: IFormSection) => {
          (s.questions || []).forEach((q: IFormQuestion) => {
            if (q.defaultValue !== undefined) {
              initialVals[q.id] = q.defaultValue;
            }
          });
        });
        setSimulatedValues(initialVals);

        // Expand all sections by default so admin can see full structure immediately
        const initialExpanded: Record<string, boolean> = {};
        fetchedSections.forEach((s: IFormSection) => {
          initialExpanded[s.id] = true;
        });
        setExpandedSectionIds(initialExpanded);
      } else {
        showNotification("error", data.message || "Failed to load questionnaire.");
      }
    } catch {
      showNotification("error", "Network error loading questionnaire.");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // Synchronize with latest baseline registration form
  const handleSyncBaseline = async () => {
    setWorkspaceLoading(true);
    try {
      const res = await fetch("/api/questionnaires/sync-baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showNotification("success", "Form builder schema successfully synchronized with the latest official registration form!");
        await loadQuestionnaire(selectedFormCode, true);
      } else {
        showNotification("error", data.message || "Failed to sync baseline form.");
      }
    } catch {
      showNotification("error", "Error connecting to server to sync baseline.");
    } finally {
      setWorkspaceLoading(false);
    }
  };

  useEffect(() => {
    loadFormsList();
    loadQuestionnaire("RDA-ICDP-CONTRACTOR-Q");
  }, []);

  // Unsaved changes window listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Leave without saving?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Derived Statistics
  const stats = useMemo(() => computeQuestionnaireStats(sections), [sections]);

  // Handle live simulation field changes in Form View
  const handleSimulatedChange = (fieldId: string, val: any) => {
    setSimulatedValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  // Quick presets to test all Google Form conditional paths in Mode A
  const applyBranchPreset = (branch: "ATTENDANCE_NO" | "OFFICER" | "SUPPLIER" | "CONTRACTOR_YES" | "CONTRACTOR_NO" | "CLEAR") => {
    switch (branch) {
      case "ATTENDANCE_NO":
        setSimulatedValues({
          organizationName: "Sri Lanka Infrastructure Corp",
          contactNumber: "+94 11 234 5678",
          email: "info@slic.lk",
          willParticipate: "No",
        });
        showNotification("success", "Mode A Condition: Attendance = No (All subsequent sections hidden; immediate submit enabled)");
        break;

      case "OFFICER":
        setSimulatedValues({
          organizationName: "Ministry of Transport and Highways",
          contactNumber: "+94 11 288 7766",
          email: "procurement@highways.gov.lk",
          willParticipate: "Yes",
          participantCategory: "Government Officer",
          "participant1.fullName": "Eng. Sunil Perera",
          "participant1.mobileNumber": "0771234567",
          "participant1.designation": "Chief Engineer",
          "participant2.fullName": "Nimal Jayasinghe",
          "participant2.mobileNumber": "0719876543",
          "participant2.designation": "Assistant Director",
          mattersForDiscussion: "Please discuss contract packaging and bid security thresholds during the session.",
        });
        showNotification("success", "Mode A Condition: Government Officer (Sec 1, 2, 3A, 11 only; contractor/supplier sections hidden)");
        break;

      case "SUPPLIER":
        setSimulatedValues({
          organizationName: "Lanka Asphalt & Aggregates (Pvt) Ltd",
          contactNumber: "+94 11 445 5667",
          email: "sales@lankaasphalt.lk",
          willParticipate: "Yes",
          participantCategory: "Supplier",
          "participant1.fullName": "Kamal Wickramasinghe",
          "participant1.mobileNumber": "0779998877",
          "participant1.designation": "General Manager",
          "supplierDetails.companyName": "Lanka Asphalt & Aggregates",
          "supplierDetails.materialsSupplied": ["Bitumen / Asphalt", "Aggregates"],
          "supplierDetails.supplyCapacities": {
            "Bitumen / Asphalt": { quantity: 15000, unit: "MT per year" },
            Aggregates: { quantity: 40000, unit: "Cu.m per year" },
          },
          "supplierDetails.locationAddress": "Peliyagoda Industrial Estate, Kelaniya",
          "supplierDetails.province": "Western Province",
          "supplierDetails.district": "Gampaha",
          mattersForDiscussion: "Clarification on raw material import regulations and exchange rate adjustments.",
        });
        showNotification("success", "Mode A Condition: Supplier (Sec 1, 2, 3B with 1 rep only, 4-SUP, 11; contractor sections hidden)");
        break;

      case "CONTRACTOR_YES":
        setSimulatedValues({
          organizationName: "Maga Engineering (Pvt) Ltd",
          contactNumber: "+94 11 288 9900",
          email: "tenders@maga.lk",
          willParticipate: "Yes",
          participantCategory: "Contractor",
          "participant1.fullName": "M. G. Fernando",
          "participant1.mobileNumber": "0712223344",
          "participant1.designation": "Managing Director",
          "participant2.fullName": "R. A. Silva",
          "participant2.mobileNumber": "0773334455",
          "participant2.designation": "Senior Project Manager",
          ictadRegistrationNumber: "CIDA/CON/2026/044",
          areasOfSpecialty: ["Highway", "Bridges"],
          cidaGrade: "CS2",
          financialStatements: {
            "2024/2025": { totalAssets: 120000000, totalLiabilities: 70000000, totalEquity: 50000000, currentAssets: 60000000, currentLiabilities: 35000000, workingCapital: 25000000, totalRevenue: 150000000, profitBeforeTax: 12000000 },
          },
          "loanCommitments.twoYearRepaymentsDue2026To2028": 15.5,
          hasOngoingContracts: "Yes",
          totalOutstandingValueLkrMillion: 320,
          generalExperience: "More than 30 years",
          mattersForDiscussion: "Proposals for price fluctuation formula adjustments.",
        });
        showNotification("success", "Mode A Condition: Contractor with Ongoing Works = Yes (All Sections 1–11 active)");
        break;

      case "CONTRACTOR_NO":
        setSimulatedValues({
          organizationName: "Access Engineering PLC",
          contactNumber: "+94 11 760 6600",
          email: "bids@access.lk",
          willParticipate: "Yes",
          participantCategory: "Contractor",
          "participant1.fullName": "Rohana Karunaratne",
          "participant1.mobileNumber": "0778881122",
          "participant1.designation": "Director",
          ictadRegistrationNumber: "CIDA/CON/2026/012",
          areasOfSpecialty: ["Highway"],
          cidaGrade: "CS1",
          financialStatements: {
            "2024/2025": { totalAssets: 95000000, totalLiabilities: 55000000, totalEquity: 40000000, currentAssets: 45000000, currentLiabilities: 25000000, workingCapital: 20000000, totalRevenue: 110000000, profitBeforeTax: 8000000 },
          },
          "loanCommitments.twoYearRepaymentsDue2026To2028": 10.0,
          hasOngoingContracts: "No",
          generalExperience: "More than 20 and up to 30 years",
          mattersForDiscussion: "Advance payment guarantee requirements.",
        });
        showNotification("success", "Mode A Condition: Contractor with Ongoing Works = No (Section 8 Ongoing Works OMITTED)");
        break;

      case "CLEAR":
        setSimulatedValues({ willParticipate: "Yes" });
        showNotification("success", "Mode A simulation values reset to initial state.");
        break;
    }
  };

  // Toggle individual section expanded
  const toggleSectionExpanded = (secId: string) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }));
  };

  // Expand all sections
  const handleExpandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sections.forEach((s) => {
      allExpanded[s.id] = true;
    });
    setExpandedSectionIds(allExpanded);
  };

  // Collapse all sections
  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sections.forEach((s) => {
      allCollapsed[s.id] = false;
    });
    setExpandedSectionIds(allCollapsed);
  };

  // Check if a question matches active search & filter
  const matchesQuestionFilter = (q: IFormQuestion, secTitle: string) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesCode = q.code.toLowerCase().includes(query);
      const matchesText = q.text.toLowerCase().includes(query);
      const matchesType = q.fieldType.toLowerCase().includes(query);
      const matchesSec = secTitle.toLowerCase().includes(query);
      if (!matchesCode && !matchesText && !matchesType && !matchesSec) return false;
    }

    if (selectedFilter === "REQUIRED") return q.isRequired;
    if (selectedFilter === "OPTIONAL") return !q.isRequired;
    if (selectedFilter === "CONDITIONAL") return Boolean(q.conditionalLogic?.enabled);
    if (selectedFilter === "FILES") return ["file_upload", "image_upload"].includes(q.fieldType);
    if (selectedFilter === "CHOICE") return ["radio", "dropdown", "multi_select", "checkbox"].includes(q.fieldType);
    if (selectedFilter === "TEXT") return ["short_text", "long_text", "email", "url", "telephone"].includes(q.fieldType);
    if (selectedFilter === "NUMERIC") return ["integer", "decimal", "currency"].includes(q.fieldType);

    return true;
  };

  // Filtered sections and questions
  const displayedSections = useMemo(() => {
    return sections
      .filter((sec) => activeSectionId === "ALL" || sec.id === activeSectionId)
      .map((sec) => {
        const matchingQuestions = sec.questions.filter((q) =>
          matchesQuestionFilter(q, sec.title)
        );
        return {
          section: sec,
          questions: matchingQuestions,
          totalQuestions: sec.questions.length,
        };
      });
  }, [sections, activeSectionId, searchQuery, selectedFilter]);

  const totalMatchingQuestions = useMemo(() => {
    return displayedSections.reduce((sum, item) => sum + item.questions.length, 0);
  }, [displayedSections]);

  // Handler: Manage Form from Dashboard
  const handleOpenFormWorkspace = (formCode: string) => {
    setSelectedFormCode(formCode);
    setViewMode("WORKSPACE");
    loadQuestionnaire(formCode);
  };

  // Handler: Back to Dashboard
  const handleBackToDashboard = () => {
    if (hasUnsavedChanges && !confirm("You have unsaved changes in this form. Discard changes and return to forms list?")) {
      return;
    }
    setViewMode("DASHBOARD");
    loadFormsList();
  };

  // Save Draft (or branch into Draft if published)
  const handleSaveDraft = async () => {
    if (!questionnaire) return;
    setSaving(true);
    try {
      if (questionnaire.status === "PUBLISHED") {
        const createDraftRes = await fetch("/api/questionnaires", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: questionnaire.code }),
        });
        const createDraftData = await createDraftRes.json();
        if (!createDraftRes.ok || !createDraftData.success) {
          showNotification("error", createDraftData.message || "Failed to create working draft.");
          setSaving(false);
          return;
        }

        const draftId = createDraftData.questionnaire._id;
        const updateRes = await fetch(`/api/questionnaires/${draftId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections }),
        });
        const updateData = await updateRes.json();

        if (updateData.success) {
          setQuestionnaire(updateData.questionnaire);
          setEffectiveStatus("DRAFT");
          setLastSaved(new Date().toLocaleTimeString());
          setHasUnsavedChanges(false);
          showNotification("success", `Created and saved Revision Draft Version ${updateData.questionnaire.version}.`);
        } else {
          showNotification("error", updateData.message || "Failed to save draft.");
        }
      } else {
        const res = await fetch(`/api/questionnaires/${questionnaire._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections }),
        });
        const data = await res.json();
        if (data.success) {
          setQuestionnaire(data.questionnaire);
          setLastSaved(new Date().toLocaleTimeString());
          setHasUnsavedChanges(false);
          showNotification("success", "Draft saved successfully.");
        } else {
          showNotification("error", data.message || "Failed to save draft.");
        }
      }
    } catch {
      showNotification("error", "Error connecting to server to save draft.");
    } finally {
      setSaving(false);
    }
  };

  // Validate Schema
  const handleValidateSchema = () => {
    const report = validateQuestionnaireSchema(sections);
    setValidationReport(report);
    setValidationModalOpen(true);
  };

  // Publish Questionnaire
  const handlePublish = async () => {
    if (!questionnaire) return;
    const report = validateQuestionnaireSchema(sections);
    if (!report.isValid) {
      setValidationReport(report);
      setValidationModalOpen(true);
      return;
    }

    if (!confirm(`Publish Questionnaire "${questionnaire.title}" Version ${questionnaire.version}? It will become the live public registration schema.`)) {
      return;
    }

    setPublishing(true);
    try {
      let targetId = questionnaire._id;
      if (questionnaire.status === "PUBLISHED" && hasUnsavedChanges) {
        const createRes = await fetch("/api/questionnaires", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: questionnaire.code }),
        });
        const createData = await createRes.json();
        targetId = createData.questionnaire._id;
      }

      await fetch(`/api/questionnaires/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });

      const pubRes = await fetch(`/api/questionnaires/${targetId}/publish`, {
        method: "POST",
      });
      const pubData = await pubRes.json();

      if (pubData.success) {
        setQuestionnaire(pubData.questionnaire);
        setEffectiveStatus("PUBLISHED");
        setHasUnsavedChanges(false);
        showNotification("success", `Questionnaire Version ${pubData.questionnaire.version} published live!`);
        loadFormsList();
      } else {
        showNotification("error", pubData.message || "Failed to publish questionnaire.");
      }
    } catch {
      showNotification("error", "Error connecting to server to publish questionnaire.");
    } finally {
      setPublishing(false);
    }
  };

  // Unpublish Form
  const handleUnpublishForm = async (form: IFormSummary) => {
    if (!confirm(`Unpublish form "${form.title}" [${form.code}]? Respondents will no longer be able to register through /register/${form.slug}.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${form.code}/unpublish`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("success", `Form [${form.code}] unpublished successfully.`);
        loadFormsList();
        if (viewMode === "WORKSPACE" && questionnaire?.code === form.code) {
          loadQuestionnaire(form.code);
        }
      } else {
        showNotification("error", data.message || "Failed to unpublish form.");
      }
    } catch {
      showNotification("error", "Network error unpublishing form.");
    }
  };

  // Policy Lock Toggle
  const handleToggleLock = async () => {
    if (!questionnaire) return;
    try {
      const res = await fetch(`/api/questionnaires/${questionnaire._id}/lock`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setQuestionnaire({
          ...questionnaire,
          isLocked: data.isLocked,
        });
        setEffectiveStatus(data.isLocked ? "SCHEMA_LOCKED" : questionnaire.status);
        showNotification("success", data.message);
      } else {
        showNotification("error", data.message || "Failed to toggle policy lock.");
      }
    } catch {
      showNotification("error", "Network error toggling policy lock.");
    }
  };

  // Export Schema JSON
  const handleExportSchema = () => {
    if (!questionnaire) return;
    const exportData = {
      title: questionnaire.title,
      code: questionnaire.code,
      slug: questionnaire.slug,
      category: questionnaire.category,
      version: questionnaire.version,
      description: questionnaire.description,
      instructions: questionnaire.instructions,
      sections,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rda-${questionnaire.slug || questionnaire.code}-v${questionnaire.version}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("success", `Exported schema JSON.`);
  };

  // Download Full Form as PDF
  const handleDownloadPDF = () => {
    if (!questionnaire) return;

    const printWin = window.open("", "_blank");
    if (!printWin) {
      window.print();
      return;
    }

    const sectionsHtml = (sections || [])
      .map((sec, sIdx) => {
        const questionsHtml = (sec.questions || [])
          .map((q) => {
            let optionsHtml = "";
            if (q.options && q.options.length > 0) {
              optionsHtml = `
                <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 14px;">
                  ${q.options
                    .map(
                      (opt) => `
                    <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #1e293b;">
                      <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid #64748b; border-radius: ${
                        q.fieldType === "radio" ? "50%" : "3px"
                      };"></span>
                      <span>${opt.label || opt.value}</span>
                    </label>
                  `
                    )
                    .join("")}
                </div>
              `;
            } else {
              optionsHtml = `
                <div style="margin-top: 6px; height: 26px; border-bottom: 1px dashed #94a3b8; width: 100%; max-width: 500px;"></div>
              `;
            }

            return `
              <div style="margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="font-weight: 700; color: #1e3a8a; font-size: 11px; min-width: 32px;">${q.code || `Q${q.number}`}</span>
                  <div style="flex: 1;">
                    <div style="font-size: 12px; font-weight: 600; color: #0f172a;">
                      ${q.text} ${
              q.isRequired
                ? '<span style="color: #dc2626;">*</span>'
                : '<span style="color: #64748b; font-size: 10px; font-weight: normal;">(Optional)</span>'
            }
                    </div>
                    ${
                      q.description
                        ? `<div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${q.description}</div>`
                        : ""
                    }
                    ${optionsHtml}
                  </div>
                </div>
              </div>
            `;
          })
          .join("");

        return `
          <div style="margin-bottom: 24px; page-break-inside: avoid;">
            <div style="background: #0b1f3a; color: white; padding: 6px 12px; font-size: 12px; font-weight: bold; border-radius: 4px; margin-bottom: 12px; display: flex; justify-content: space-between;">
              <span>${sec.title || `SECTION ${sIdx + 1}`}</span>
              <span style="font-size: 10px; opacity: 0.8;">${sec.code || ""}</span>
            </div>
            ${
              sec.description
                ? `<p style="font-size: 11px; color: #475569; margin-bottom: 10px; font-style: italic;">${sec.description}</p>`
                : ""
            }
            <div style="padding-left: 6px;">
              ${questionsHtml}
            </div>
          </div>
        `;
      })
      .join("");

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${questionnaire.title} - Official Form</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 12px; font-size: 12px; line-height: 1.4; }
            .header { border-bottom: 2px solid #0b1f3a; padding-bottom: 12px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; }
            .logos { display: flex; align-items: center; gap: 10px; }
            .logos img { height: 42px; width: auto; object-fit: contain; }
            .meta { text-align: right; }
            .badge { display: inline-block; background: #fbbf24; color: #0f172a; font-weight: 800; font-size: 9px; padding: 2px 6px; border-radius: 4px; }
            .footer-sign { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 15px; display: flex; justify-content: space-between; page-break-inside: avoid; }
            .sign-box { width: 45%; border-top: 1px dashed #64748b; padding-top: 6px; font-size: 10px; color: #475569; text-align: center; margin-top: 35px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logos">
              <img src="/ministry-logo.png" alt="Ministry Logo" />
              <img src="/rda-logo.png" alt="RDA Logo" />
              <img src="/icdp-logo.jpg" alt="ICDP Logo" />
            </div>
            <div class="meta">
              <div style="font-size: 9px; font-weight: bold; color: #d97706; text-transform: uppercase;">Government of Sri Lanka</div>
              <div style="font-size: 13px; font-weight: 900; color: #0b1f3a;">Road Development Authority</div>
              <div style="font-size: 10px; color: #64748b;">Inclusive Connectivity and Development Project (ICDP)</div>
              <div style="margin-top: 4px;">
                <span class="badge">FORM 01</span>
                <span style="font-family: monospace; font-size: 10px; font-weight: bold; color: #1e3a8a; margin-left: 4px;">${questionnaire.code}</span>
                <span style="font-size: 10px; color: #64748b; margin-left: 4px;">v${questionnaire.version || "1.0"}</span>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <h1 style="font-size: 16px; font-weight: 900; color: #0b1f3a; margin: 0 0 4px 0;">${questionnaire.title}</h1>
            <p style="font-size: 11px; color: #475569; margin: 0;">${questionnaire.description || ""}</p>
          </div>

          ${sectionsHtml}

          <div class="footer-sign">
            <div class="sign-box">
              Authorized Representative Signature &amp; Date
            </div>
            <div class="sign-box">
              Official Corporate / Institutional Seal
            </div>
          </div>

          <div style="margin-top: 25px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px;">
            &copy; 2026 Road Development Authority (RDA). Inclusive Connectivity and Development Project (ICDP). Democratic Socialist Republic of Sri Lanka.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(fullHtml);
    printWin.document.close();
  };

  // Delete Confirm Action
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === "form") {
      try {
        const res = await fetch(`/api/forms/${deleteConfirm.targetId}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotification("success", data.message);
          loadFormsList();
          if (viewMode === "WORKSPACE") {
            setViewMode("DASHBOARD");
          }
        } else {
          showNotification("error", data.message || "Failed to delete form.");
        }
      } catch {
        showNotification("error", "Network error deleting form.");
      }
    } else if (deleteConfirm.type === "section") {
      setSections(sections.filter((s) => s.id !== deleteConfirm.targetId));
      if (activeSectionId === deleteConfirm.targetId) {
        setActiveSectionId("ALL");
      }
      showNotification("success", `Deleted section "${deleteConfirm.targetName}".`);
      setHasUnsavedChanges(true);
    } else if (deleteConfirm.type === "question" && deleteConfirm.sectionId) {
      setSections(
        sections.map((sec) =>
          sec.id === deleteConfirm.sectionId
            ? { ...sec, questions: sec.questions.filter((q) => q.id !== deleteConfirm.targetId) }
            : sec
        )
      );
      showNotification("success", `Deleted question "${deleteConfirm.targetName}".`);
      setHasUnsavedChanges(true);
    }

    setDeleteConfirm(null);
  };

  // Section CRUD operations
  const handleSaveSection = (savedSection: Partial<IFormSection>) => {
    if (savedSection.id) {
      const existingIndex = sections.findIndex((s) => s.id === savedSection.id);
      if (existingIndex >= 0) {
        const updated = [...sections];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...savedSection,
        } as IFormSection;
        setSections(updated);
        showNotification("success", `Updated section "${savedSection.title}".`);
      }
    } else {
      const newSection: IFormSection = {
        id: `sec_${Date.now().toString(36)}`,
        code: savedSection.code || `SEC-${String(sections.length + 1).padStart(2, "0")}`,
        title: savedSection.title || `Section ${sections.length + 1}`,
        description: savedSection.description,
        displayOrder: sections.length + 1,
        questions: [],
      };
      setSections([...sections, newSection]);
      setExpandedSectionIds((prev) => ({ ...prev, [newSection.id]: true }));
      showNotification("success", `Created new section "${newSection.title}".`);
    }
    setHasUnsavedChanges(true);
  };

  const handleMoveSection = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, moved);
    const reordered = updated.map((s, i) => ({ ...s, displayOrder: i + 1 }));
    setSections(reordered);
    setHasUnsavedChanges(true);
  };

  // Question CRUD operations
  const handleSaveQuestion = (savedQuestion: IFormQuestion, assignedSectionId?: string) => {
    const targetSecId = assignedSectionId || targetSectionForNewQuestion || (sections.length > 0 ? sections[0].id : "");
    let questionUpdated = false;

    const updatedSections = sections.map((sec) => {
      const qIndex = sec.questions.findIndex((q) => q.id === savedQuestion.id);

      if (qIndex >= 0) {
        questionUpdated = true;
        if (sec.id === targetSecId) {
          const updatedQList = [...sec.questions];
          updatedQList[qIndex] = savedQuestion;
          return { ...sec, questions: updatedQList };
        } else {
          return { ...sec, questions: sec.questions.filter((q) => q.id !== savedQuestion.id) };
        }
      }
      return sec;
    });

    if (questionUpdated) {
      const finalSections = updatedSections.map((sec) => {
        if (sec.id === targetSecId && !sec.questions.some((q) => q.id === savedQuestion.id)) {
          return { ...sec, questions: [...sec.questions, savedQuestion] };
        }
        return sec;
      });
      setSections(finalSections);
      showNotification("success", `Updated question [${savedQuestion.code}].`);
    } else {
      const finalSections = sections.map((sec) => {
        if (sec.id === targetSecId) {
          return { ...sec, questions: [...sec.questions, savedQuestion] };
        }
        return sec;
      });
      setSections(finalSections);
      setExpandedSectionIds((prev) => ({ ...prev, [targetSecId]: true }));
      showNotification("success", `Added question [${savedQuestion.code}] to section.`);
    }

    setHasUnsavedChanges(true);
  };

  const handleDuplicateQuestion = (q: IFormQuestion, secId: string) => {
    const newCode = `${q.code}_COPY`;
    const newId = `q_${Date.now().toString(36)}`;
    const duplicated: IFormQuestion = {
      ...q,
      id: newId,
      code: newCode,
      text: `${q.text} (Copy)`,
      displayOrder: q.displayOrder + 1,
    };

    setSections(
      sections.map((sec) =>
        sec.id === secId ? { ...sec, questions: [...sec.questions, duplicated] } : sec
      )
    );
    setHasUnsavedChanges(true);
    showNotification("success", `Duplicated question as [${newCode}].`);
  };

  const handleMoveQuestion = (secId: string, qIdx: number, direction: "up" | "down") => {
    setSections(
      sections.map((sec) => {
        if (sec.id !== secId) return sec;
        const targetIdx = direction === "up" ? qIdx - 1 : qIdx + 1;
        if (targetIdx < 0 || targetIdx >= sec.questions.length) return sec;

        const updated = [...sec.questions];
        const [moved] = updated.splice(qIdx, 1);
        updated.splice(targetIdx, 0, moved);
        const reordered = updated.map((q, i) => ({ ...q, displayOrder: i + 1 }));
        return { ...sec, questions: reordered };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleMoveQuestionOrder = (q: IFormQuestion, secId: string, direction: "up" | "down") => {
    setSections(
      sections.map((sec) => {
        if (sec.id !== secId) return sec;
        const idx = sec.questions.findIndex((x) => x.id === q.id);
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= sec.questions.length) return sec;

        const updated = [...sec.questions];
        const [moved] = updated.splice(idx, 1);
        updated.splice(targetIdx, 0, moved);
        return { ...sec, questions: updated };
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleMoveQuestionToSection = (q: IFormQuestion, sourceSecId: string, destSecId: string) => {
    let questionToMove: IFormQuestion | null = null;

    const updated = sections.map((sec) => {
      if (sec.id === sourceSecId) {
        questionToMove = sec.questions.find((x) => x.id === q.id) || null;
        return { ...sec, questions: sec.questions.filter((x) => x.id !== q.id) };
      }
      return sec;
    });

    if (questionToMove) {
      setSections(
        updated.map((sec) =>
          sec.id === destSecId ? { ...sec, questions: [...sec.questions, questionToMove!] } : sec
        )
      );
      setHasUnsavedChanges(true);
      showNotification("success", `Moved [${q.code}] to target section.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between shadow-md transition-all ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
      )}

      {/* VIEW 1: CENTRALIZED FORMS DASHBOARD */}
      {viewMode === "DASHBOARD" ? (
        <FormsDashboard
          forms={forms}
          loading={formsLoading}
          onCreateNewForm={() => setCreateFormModalOpen(true)}
          onViewForm={(formCode) => {
            setAdminMode("VIEW");
            handleOpenFormWorkspace(formCode);
          }}
          onEditForm={(formCode) => {
            setAdminMode("EDIT");
            handleOpenFormWorkspace(formCode);
          }}
          onPreviewForm={(form) => {
            handleOpenFormWorkspace(form.code);
            setPreviewModalOpen(true);
          }}
          onVersionHistory={(form) => {
            handleOpenFormWorkspace(form.code);
            setVersionDrawerOpen(true);
          }}
          onPublishChanges={(form) => {
            handleOpenFormWorkspace(form.code);
            handlePublish();
          }}
          onOpenQr={(form) => {
            setQrModalForm(form);
            setQrModalOpen(true);
          }}
        />
      ) : (
        /* VIEW 2: INDIVIDUAL FORM BUILDER WORKSPACE */
        <div className="space-y-4">
          {/* Top Breadcrumb Navigation Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleBackToDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Forms Hub</span>
              </button>

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-mono font-black text-[10px] text-amber-950 bg-amber-400 px-2.5 py-0.5 rounded-full shadow-2xs">
                  FORM 01
                </span>
                <span className="font-mono font-bold text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {questionnaire?.code || "RDA-ICDP-CONTRACTOR-Q"}
                </span>
                <span className="font-bold text-slate-900 truncate max-w-xs">
                  {questionnaire?.title || "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire"}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {questionnaire?.category || "Contractor, Supplier & Public Sector"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              {/* Direct Link to Public Portal */}
              <a
                href="/register"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-blue-900 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
              >
                <span>/register (Public Portal)</span>
                <ExternalLink className="w-3 h-3 text-blue-800" />
              </a>

              <div className="h-4 w-px bg-slate-200" />

              <Link
                href={`/submissions?formId=${questionnaire?.code || "RDA-ICDP-CONTRACTOR-Q"}`}
                className="font-bold text-slate-600 hover:text-blue-900"
              >
                Submissions
              </Link>
            </div>
          </div>

          {/* Main Form Workspace Header */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900">
                    <FormInput className="w-4 h-4" />
                  </div>
                  <span className="bg-amber-400 text-slate-900 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wider uppercase shadow-2xs">
                    FORM 01
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {questionnaire?.title || "Form 1: RDA Contractor Registration & Capacity Declaration Questionnaire"}
                  </h1>

                  {/* Status Badge */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        effectiveStatus === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : effectiveStatus === "DRAFT"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {effectiveStatus}
                    </span>

                    {questionnaire?.isLocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <Lock className="w-3 h-3" />
                        <span>POLICY LOCKED</span>
                      </span>
                    )}

                    {hasUnsavedChanges && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 animate-pulse">
                        UNSAVED CHANGES
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {questionnaire?.description || "Manage sections, questions, conditional rules, and version releases for this questionnaire."}
                </p>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {adminMode === "VIEW" ? (
                  <>
                    {/* Edit Form Button (Only way to enter edit mode) */}
                    <button
                      type="button"
                      onClick={() => setAdminMode("EDIT")}
                      className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0b1f3a] hover:bg-[#132f54] rounded-xl shadow-xs transition-all"
                      title="Click to edit sections, questions, and form structure"
                    >
                      <Edit2 className="w-4 h-4 text-amber-400" />
                      <span>Edit Form</span>
                    </button>

                    {/* Download as PDF Button */}
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-all"
                      title="Download and print full form as PDF"
                    >
                      <Printer className="w-4 h-4 text-blue-900" />
                      <span>Download as PDF</span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Save Draft Button */}
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={saving || questionnaire?.isLocked}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-all disabled:opacity-50"
                      title="Save current questionnaire state as draft"
                    >
                      <Save className="w-4 h-4 text-blue-900" />
                      <span>{saving ? "Saving..." : "Save Draft"}</span>
                    </button>

                    {/* Publish Live Button */}
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing || questionnaire?.isLocked}
                      className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all disabled:opacity-50"
                      title="Publish questionnaire live to the public portal"
                    >
                      <Send className="w-4 h-4 text-white" />
                      <span>{publishing ? "Publishing..." : "Publish Live"}</span>
                    </button>

                    {/* Return to View Mode Button */}
                    <button
                      type="button"
                      onClick={() => setAdminMode("VIEW")}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all"
                      title="Done editing, return to view mode"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>View Form</span>
                    </button>

                    {/* Download as PDF Button */}
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-all"
                      title="Download and print full form as PDF"
                    >
                      <Printer className="w-4 h-4 text-blue-900" />
                      <span>Download as PDF</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Metrics Summary Strip */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sections</span>
                <div className="text-base font-black text-slate-900 font-mono">{stats.totalSections}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Questions</span>
                <div className="text-base font-black text-slate-900 font-mono">{stats.totalQuestions}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Required</span>
                <div className="text-base font-black text-slate-900 font-mono">{stats.requiredQuestions}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Optional</span>
                <div className="text-base font-black text-slate-900 font-mono">{stats.optionalQuestions}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Conditional</span>
                <div className="text-base font-black text-purple-700 font-mono">{stats.conditionalQuestions}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Active Version</span>
                <div className="text-base font-black text-blue-900 font-mono">v{questionnaire?.version || "1.0"}</div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {lastSaved ? "Last Saved" : "Last Published"}
                </span>
                <div className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                  {lastSaved || (questionnaire?.publishedAt ? new Date(questionnaire.publishedAt).toLocaleDateString() : "Active")}
                </div>
              </div>
            </div>
          </div>

          {/* Mode Banner Indicator */}
          {adminMode === "VIEW" ? (
            <div className="bg-blue-50/80 border border-blue-200 text-blue-900 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  Viewing exact form. If you need to make edits or changes, click <strong>&quot;Edit Form&quot;</strong> in the toolbar.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAdminMode("EDIT")}
                className="font-bold text-white bg-blue-900 hover:bg-blue-950 px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 ml-2 transition-all"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Form</span>
              </button>
            </div>
          ) : (
            <div className="bg-amber-50/90 border border-amber-200 text-amber-950 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>EDIT MODE ACTIVE:</strong> Click any section or question below to edit fields, or click <strong>&quot;Save Draft&quot;</strong> / <strong>&quot;Publish Live&quot;</strong> when finished.
                </span>
              </div>
              <div className="flex items-center gap-2">
                {permissions.canEdit && !questionnaire?.isLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSection(null);
                      setSectionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-blue-950 hover:underline bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Section</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setAdminMode("VIEW")}
                  className="font-bold text-slate-700 bg-white hover:bg-slate-50 px-3 py-1 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>Done Editing</span>
                </button>
              </div>
            </div>
          )}

          {/* THE EXACT PUBLIC REGISTRATION FORM DESIGN */}
          <div className="max-w-4xl mx-auto space-y-6 pt-2 pb-12">
            {sections.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No sections in this questionnaire yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click below to create your first questionnaire section and add fields.
                </p>
                {permissions.canEdit && !questionnaire?.isLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSection(null);
                      setSectionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Section</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Official RDA ICDP Workshop Header Banner */}
                <div className="bg-[#0b1f3a] text-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
                        <div className="w-full h-full bg-[#0b1f3a] rounded-[10px] flex items-center justify-center text-amber-400 font-black text-xs tracking-wider">
                          RDA
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] tracking-widest font-bold text-amber-400 uppercase">
                            Road Development Authority &bull; Sri Lanka
                          </span>
                        </div>
                        <h2 className="text-base sm:text-lg lg:text-xl font-black tracking-tight mt-0.5 leading-snug">
                          Early Market Engagement Workshop
                        </h2>
                        <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                          <span className="text-slate-300 font-normal">Organized by </span>
                          <span className="text-amber-300 font-bold">Inclusive Connectivity and Development Project (ICDP)</span>
                          <span className="text-slate-400"> &bull; 07 December 2026</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <a
                        href="/register/contractor"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-colors"
                      >
                        <span>Open Public View</span>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Official Workshop Information & Inquiries Accordion Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setShowWorkshopInfo(!showWorkshopInfo)}
                    className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Info className="w-4 h-4 text-blue-900 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                          About the Workshop &amp; Registration Instructions
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Date: 07 Dec 2026 &bull; Time: 9.00 AM &bull; <strong className="text-rose-700 font-bold">Deadline: 03 Dec 2026</strong> &bull; Click to {showWorkshopInfo ? "hide" : "view"} official details
                        </span>
                      </div>
                    </div>
                    {showWorkshopInfo ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {showWorkshopInfo && (
                    <div className="p-4 sm:p-6 space-y-4 border-t border-slate-200 bg-white leading-relaxed text-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                            Workshop Overview
                          </h3>
                          <p>
                            <strong className="font-bold text-blue-900">
                              Organized by Inclusive Connectivity and Development Project (ICDP)
                            </strong>
                            , Road Development Authority (RDA). This Early Market Engagement Workshop engages prospective contractors, materials suppliers, and institutional stakeholders in the development and procurement framework.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                            Key Milestones &amp; Contacts
                          </h3>
                          <div className="space-y-1.5 text-[11px]">
                            <p className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                              <strong>Workshop Date:</strong> 07 December 2026 at 9.00 AM
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                              <strong>Registration Deadline:</strong> <strong className="font-black text-rose-900">03 December 2026</strong>
                            </p>
                            <div className="pt-0.5 space-y-1">
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <strong>General Number:</strong>{" "}
                                <a href="tel:0112865766" className="text-blue-900 underline hover:text-blue-700 font-medium">
                                  011 286 5766
                                </a>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <strong>Inquiry Contact:</strong>{" "}
                                <a href="tel:0706970408" className="text-blue-900 underline hover:text-blue-700 font-medium">
                                  070 697 0408
                                </a>{" "}
                                <span className="text-slate-500">(Thilina Tharinda)</span>
                              </p>

                              {/* Mr. Indunil Madhusanka Details */}
                              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 my-1">
                                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                                  Mr. Indunil Madhusanka
                                </p>
                                <p className="flex items-center gap-1.5 pl-5">
                                  <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Phone:</span>{" "}
                                  <a href="tel:0712863433" className="text-blue-900 underline hover:text-blue-700 font-medium">
                                    071 286 3433
                                  </a>
                                </p>
                                <p className="flex items-center gap-1.5 pl-5">
                                  <Mail className="w-3 h-3 text-blue-700 shrink-0" />
                                  <span>Email:</span>{" "}
                                  <a href="mailto:amindunil@gmail.com" className="text-blue-900 underline hover:text-blue-700 font-medium">
                                    amindunil@gmail.com
                                  </a>
                                </p>
                              </div>

                              <p className="flex items-center gap-1.5 pt-0.5">
                                <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                <strong>Registration Email:</strong>{" "}
                                <a
                                  href="mailto:wbicdpbid@gmail.com"
                                  className="text-blue-900 underline hover:text-blue-700 font-medium"
                                >
                                  wbicdpbid@gmail.com
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DynamicFormRenderer
                  questionnaire={{ ...questionnaire, sections }}
                  values={simulatedValues}
                  onChange={handleSimulatedChange}
                  disabled={adminMode === "EDIT"}
                  previewMode={questionnaire?.status !== "PUBLISHED"}
                  adminEditMode={adminMode === "EDIT"}
                  onEditSection={(section) => {
                    setEditingSection(section);
                    setSectionModalOpen(true);
                  }}
                  onAddQuestionToSection={(secId) => {
                    setTargetSectionForNewQuestion(secId);
                    setEditingQuestion(null);
                    setQuestionModalOpen(true);
                  }}
                  onDeleteSection={(section) => {
                    setDeleteConfirm({
                      type: "section",
                      targetId: section.id,
                      targetName: section.title,
                      count: section.questions.length,
                    });
                  }}
                  onMoveSection={(sIdx, dir) => handleMoveSection(sIdx, dir)}
                  onEditQuestion={(q, secId) => {
                    setTargetSectionForNewQuestion(secId);
                    setEditingQuestion(q);
                    setQuestionModalOpen(true);
                  }}
                  onDuplicateQuestion={(q, secId) => handleDuplicateQuestion(q, secId)}
                  onDeleteQuestion={(q, secId) => {
                    setDeleteConfirm({
                      type: "question",
                      targetId: q.id,
                      targetName: q.text,
                      sectionId: secId,
                    });
                  }}
                  onMoveQuestion={(secId, qIdx, dir) => handleMoveQuestion(secId, qIdx, dir)}
                />

                {/* Bottom Add Section Button in Edit Mode */}
                {adminMode === "EDIT" && permissions.canEdit && !questionnaire?.isLocked && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSection(null);
                        setSectionModalOpen(true);
                      }}
                      className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-blue-900 rounded-2xl bg-white hover:bg-blue-50/50 text-slate-600 hover:text-blue-900 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Plus className="w-4 h-4 text-blue-900" />
                      <span>Add Another Section to this Questionnaire</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create New Form Modal */}
      <CreateFormModal
        isOpen={createFormModalOpen}
        onClose={() => setCreateFormModalOpen(false)}
        onCreated={(newCode) => {
          showNotification("success", `Created new form [${newCode}]. Opening editor...`);
          loadFormsList();
          handleOpenFormWorkspace(newCode);
        }}
        existingForms={forms}
      />

      {/* MODAL 2: Form Settings Modal */}
      <FormSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          setEditingFormSettings(null);
        }}
        form={editingFormSettings}
        onUpdated={() => {
          showNotification("success", "Form settings updated successfully.");
          loadFormsList();
          if (viewMode === "WORKSPACE") {
            loadQuestionnaire();
          }
        }}
      />

      {/* MODAL 3: QR Code Modal */}
      <FormQrModal
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setQrModalForm(null);
        }}
        form={qrModalForm}
      />

      {/* MODAL 4: Add/Edit Question */}
      <QuestionModal
        isOpen={questionModalOpen}
        onClose={() => {
          setQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        allSections={sections}
        targetSectionId={targetSectionForNewQuestion}
      />

      {/* MODAL 5: Add/Edit Section */}
      <SectionModal
        isOpen={sectionModalOpen}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSave={handleSaveSection}
        initialSection={editingSection}
      />

      {/* MODAL 6: Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-800 rounded-2xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete {deleteConfirm.type === "form" ? "Form" : deleteConfirm.type === "section" ? "Section" : "Question"}?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {deleteConfirm.type === "form" ? (
                    <>
                      Are you sure you want to delete form <strong>"{deleteConfirm.targetName}"</strong> [
                      {deleteConfirm.targetId}]?
                      {deleteConfirm.count && deleteConfirm.count > 0 ? (
                        <span className="block mt-1 text-amber-700 font-semibold">
                          This form has {deleteConfirm.count} historical submissions and will be safely archived.
                        </span>
                      ) : null}
                    </>
                  ) : deleteConfirm.type === "section" ? (
                    <>
                      Section <strong>"{deleteConfirm.targetName}"</strong> contains{" "}
                      <strong>{deleteConfirm.count}</strong> questions. Deleting this section will
                      remove its questions from the draft.
                    </>
                  ) : (
                    <>
                      Remove question <strong>"{deleteConfirm.targetName}"</strong> from this
                      draft questionnaire?
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Historical published versions and past submissions are protected and will remain
                  intact.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: Live Dynamic Preview */}
      <PreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        questionnaire={{
          title: questionnaire?.title || "Institutional Questionnaire",
          version: questionnaire?.version || "Draft",
          sections,
        }}
      />

      {/* MODAL 8: Schema Validation Report */}
      <ValidationModal
        isOpen={validationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        report={validationReport}
        onProceedPublish={handlePublish}
        canPublish={permissions.canPublish && !questionnaire?.isLocked}
      />

      {/* DRAWER 9: Version History */}
      {questionnaire && (
        <VersionHistoryDrawer
          isOpen={versionDrawerOpen}
          onClose={() => setVersionDrawerOpen(false)}
          questionnaireId={questionnaire._id.toString()}
        />
      )}

      {/* MODAL 10: Import Schema */}
      <ImportSchemaModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => {
          showNotification("success", "Schema imported as draft successfully.");
          loadQuestionnaire();
        }}
      />
    </div>
  );
}
