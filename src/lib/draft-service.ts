import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { Contractor, IContractor } from "@/models/Contractor";
import { Submission, ISubmission } from "@/models/Submission";
import { DraftToken, IDraftToken } from "@/models/DraftToken";
import { Questionnaire } from "@/models/Questionnaire";
import { DEFAULT_QUESTIONNAIRE_CODE } from "@/lib/questionnaire-seed";
import { recordActivityLog } from "@/lib/audit";

import {
  normalizeQuestionnaireData,
  validateQuestionnaireSubmission,
} from "./questionnaire-validator";

const DRAFT_TOKEN_EXPIRATION_DAYS = 30;

export interface DraftPayload {
  registrationNumber?: string;
  businessName?: string;
  businessRegistrationNumber?: string;
  cidaGrade?: string;
  primarySpeciality?: string;
  province?: string;
  district?: string;
  formId?: string;
  formSlug?: string;
  contactOfficer?: {
    name?: string;
    designation?: string;
    phone?: string;
    email?: string;
  };
  questionnaireData?: Record<string, unknown>;
}

export function generateResumeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResumeToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export function isValidTokenFormat(token: string): boolean {
  return typeof token === "string" && /^[a-f0-9]{64}$/i.test(token.trim());
}

/**
 * Generate permanent RDA ICDP registration reference number.
 * Format: RDA-ICDP-YYYY-XXXXX (e.g. RDA-ICDP-2026-00125)
 * Generated when the registration is first saved as a draft,
 * and retained permanently through resume and final submission.
 */
export async function generatePermanentRegistrationReference(
  year: number = new Date().getFullYear()
): Promise<string> {
  const prefix = `RDA-ICDP-${year}-`;

  // Find the highest sequential reference number matching prefix
  const highestSub = await Submission.findOne(
    { submissionReference: { $regex: `^${prefix}\\d{5}$` } },
    { submissionReference: 1 },
    { sort: { submissionReference: -1 } }
  ).lean();

  let nextSeq = 1;
  if (highestSub?.submissionReference) {
    const parts = highestSub.submissionReference.split("-");
    const numPart = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(numPart)) {
      nextSeq = numPart + 1;
    }
  } else {
    // Fallback: total submissions count + 1
    const count = await Submission.countDocuments();
    nextSeq = count + 1;
  }

  // Ensure absolute uniqueness
  while (true) {
    const candidate = `${prefix}${String(nextSeq).padStart(5, "0")}`;
    const exists = await Submission.exists({ submissionReference: candidate });
    if (!exists) {
      return candidate;
    }
    nextSeq++;
  }
}

/**
 * Initialize a new draft or update an existing progress draft using a secure resume token
 */
export async function saveOrUpdateDraft(
  payload: DraftPayload,
  existingToken?: string,
  clientIp?: string
): Promise<{
  token: string;
  submissionReference: string;
  expiresAt: string;
  isNew: boolean;
  contractor?: Record<string, unknown>;
  submission?: Record<string, unknown>;
}> {
  await connectToDatabase();

  const qData = (payload.questionnaireData as Record<string, any>) || {};
  const businessName = (
    payload.businessName ||
    qData.organizationName ||
    qData.supplierDetails?.companyName ||
    ""
  ).trim();
  const province = (
    payload.province ||
    qData.supplierDetails?.province ||
    "Western Province"
  ).trim();
  const district = (
    payload.district ||
    qData.supplierDetails?.district ||
    ""
  ).trim();
  const rawReg = (payload.registrationNumber || qData.ictadRegistrationNumber || "").trim();

  // If an existing token is provided, verify and update
  if (existingToken && isValidTokenFormat(existingToken)) {
    const tokenHash = hashResumeToken(existingToken);
    const draftTokenDoc = await DraftToken.findOne({ tokenHash });

    if (!draftTokenDoc) {
      throw new Error("Invalid or unrecognized resume token. Please verify your token link.");
    }

    if (draftTokenDoc.isRevoked) {
      throw new Error("This draft has already been officially submitted and locked. Duplicate modification is prohibited.");
    }

    if (new Date() > draftTokenDoc.expiresAt) {
      throw new Error("This draft session has expired (30-day limit). Please start a new registration.");
    }

    // Update associated contractor
    const contractor = await Contractor.findById(draftTokenDoc.contractor);
    if (contractor) {
      if (businessName) contractor.businessName = businessName;
      if (rawReg && rawReg.toUpperCase() !== contractor.registrationNumber) {
        const otherWithReg = await Contractor.findOne({
          registrationNumber: rawReg.toUpperCase(),
          _id: { $ne: contractor._id },
        });
        if (otherWithReg) {
          throw new Error(`Registration number ${rawReg.toUpperCase()} is already registered in the system.`);
        }
        contractor.registrationNumber = rawReg.toUpperCase();
      }
      if (payload.businessRegistrationNumber) contractor.businessRegistrationNumber = payload.businessRegistrationNumber.trim();
      if (payload.cidaGrade || qData.cidaGrade) contractor.cidaGrade = (payload.cidaGrade || qData.cidaGrade) as any;
      if (payload.primarySpeciality) contractor.primarySpeciality = payload.primarySpeciality.trim();
      if (province) contractor.province = province as any;
      if (district) contractor.district = district;
      else if (payload.district) contractor.district = payload.district.trim();
      if (payload.contactOfficer || qData.contactNumber || qData.email) {
        contractor.contactOfficer = {
          name: payload.contactOfficer?.name?.trim() || qData.participant1?.fullName?.trim() || contractor.contactOfficer?.name || "Authorized Representative",
          designation: payload.contactOfficer?.designation?.trim() || qData.participant1?.designation?.trim() || contractor.contactOfficer?.designation || "Authorized Officer",
          phone: payload.contactOfficer?.phone?.trim() || qData.contactNumber?.trim() || contractor.contactOfficer?.phone || "",
          email: payload.contactOfficer?.email?.trim().toLowerCase() || qData.email?.trim().toLowerCase() || contractor.contactOfficer?.email || "",
        };
      }
      await contractor.save();
    }

    // Update associated submission
    const submission = await Submission.findById(draftTokenDoc.submission);
    if (submission) {
      if (province) submission.provincialOffice = province;
      if (payload.questionnaireData) {
        submission.questionnaireData = normalizeQuestionnaireData(payload.questionnaireData) as unknown as Record<string, unknown>;
      }
      // Status remains Draft on progress saves; only final submission transitions to Submitted
      if (submission.status !== "Submitted") {
        submission.status = "Draft";
      }
      await submission.save();
    }

    // Update draft access timestamp
    draftTokenDoc.lastAccessedAt = new Date();
    await draftTokenDoc.save();

    return {
      token: existingToken,
      submissionReference: submission?.submissionReference || "RDA-ICDP-DRAFT",
      expiresAt: draftTokenDoc.expiresAt.toISOString(),
      isNew: false,
      contractor: contractor ? {
        id: contractor._id.toString(),
        registrationNumber: contractor.registrationNumber,
        businessName: contractor.businessName,
        cidaGrade: contractor.cidaGrade,
        province: contractor.province,
        contactOfficer: contractor.contactOfficer,
      } : undefined,
      submission: submission ? {
        id: submission._id.toString(),
        reference: submission.submissionReference,
        status: submission.status,
      } : undefined,
    };
  }

  // Creating a new draft session
  const effectiveBusinessName = businessName || "New Registration Draft";
  const effectiveRegNo = (rawReg || `DFT-${Date.now().toString().slice(-6)}`).toUpperCase();

  // Check if this CIDA registration number already has an active verified profile
  const existingVerified = await Contractor.findOne({
    registrationNumber: effectiveRegNo,
    status: { $in: ["Verified", "Pending_Review"] },
  });

  if (existingVerified) {
    throw new Error(
      `Registration number ${effectiveRegNo} is already registered in the system (Status: ${existingVerified.status}). Please contact your RDA Provincial Directorate for amendments.`
    );
  }

  // Create or reuse draft contractor record
  let contractor = await Contractor.findOne({ registrationNumber: effectiveRegNo, status: "Draft" });

  if (!contractor) {
    contractor = await Contractor.create({
      registrationNumber: effectiveRegNo,
      businessName: effectiveBusinessName,
      businessRegistrationNumber: payload.businessRegistrationNumber?.trim() || "",
      cidaGrade: ((payload.cidaGrade || qData.cidaGrade) as any) || "Pending",
      primarySpeciality: payload.primarySpeciality?.trim() || (qData.willParticipate === "No" ? "Non-Attendee" : ""),
      province: (province || "Western Province") as any,
      district: district || payload.district?.trim() || "",
      contactOfficer: {
        name: payload.contactOfficer?.name?.trim() || qData.participant1?.fullName?.trim() || "",
        designation: payload.contactOfficer?.designation?.trim() || qData.participant1?.designation?.trim() || "",
        phone: payload.contactOfficer?.phone?.trim() || qData.contactNumber?.trim() || "",
        email: payload.contactOfficer?.email?.trim().toLowerCase() || qData.email?.trim().toLowerCase() || "",
      },
      status: "Draft",
      isDemoRecord: false,
    });
  }

  // Generate permanent registration reference number (retained through full lifecycle)
  const permanentRef = await generatePermanentRegistrationReference(new Date().getFullYear());

  // Check active published questionnaire
  const targetFormIdentifier = (payload.formId || payload.formSlug || DEFAULT_QUESTIONNAIRE_CODE).trim();
  const activePublished = await Questionnaire.findOne({
    $or: [{ code: targetFormIdentifier }, { slug: targetFormIdentifier }],
    status: "PUBLISHED",
  }).select("_id version code slug");

  const effectiveFormId = activePublished?.code || (payload.formId || DEFAULT_QUESTIONNAIRE_CODE);
  const effectiveFormSlug = activePublished?.slug || (payload.formSlug || "contractor");

  const submission = await Submission.create({
    submissionReference: permanentRef,
    contractor: contractor._id,
    submissionType: "Annual_Capacity_Declaration",
    provincialOffice: (payload.province || "Western Province").trim(),
    status: "Draft",
    schemaVersion: activePublished?.version || "1.0.0-pending-finalization",
    formId: effectiveFormId,
    formSlug: effectiveFormSlug,
    questionnaireId: activePublished?._id,
    questionnaireVersion: activePublished?.version,
    questionnaireData: payload.questionnaireData ? (normalizeQuestionnaireData(payload.questionnaireData) as unknown as Record<string, unknown>) : {},
    attachments: [],
    isDemoRecord: false,
  });

  // Generate high-entropy resume token and store SHA-256 hash
  const rawToken = generateResumeToken();
  const tokenHash = hashResumeToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DRAFT_TOKEN_EXPIRATION_DAYS);

  await DraftToken.create({
    tokenHash,
    contractor: contractor._id,
    submission: submission._id,
    expiresAt,
    isRevoked: false,
    lastAccessedAt: new Date(),
    ipAddress: clientIp || "web-portal",
  });

  return {
    token: rawToken,
    submissionReference: permanentRef,
    expiresAt: expiresAt.toISOString(),
    isNew: true,
    contractor: {
      id: contractor._id.toString(),
      registrationNumber: contractor.registrationNumber,
      businessName: contractor.businessName,
      cidaGrade: contractor.cidaGrade,
      province: contractor.province,
      contactOfficer: contractor.contactOfficer,
    },
    submission: {
      id: submission._id.toString(),
      reference: permanentRef,
      status: submission.status,
    },
  };
}

/**
 * Retrieve draft data using the secure plain-text resume token
 */
export async function getDraftByToken(rawToken: string): Promise<{
  submissionReference: string;
  status: string;
  expiresAt: string;
  contractor: {
    registrationNumber: string;
    businessName: string;
    businessRegistrationNumber: string;
    cidaGrade: string;
    primarySpeciality: string;
    province: string;
    district: string;
    contactOfficer: {
      name: string;
      designation: string;
      phone: string;
      email: string;
    };
  };
  questionnaireData: Record<string, unknown>;
}> {
  if (!isValidTokenFormat(rawToken)) {
    throw new Error("Invalid token format. Resume token must be a 64-character hexadecimal key.");
  }

  await connectToDatabase();
  const tokenHash = hashResumeToken(rawToken);
  const draftTokenDoc = await DraftToken.findOne({ tokenHash });

  if (!draftTokenDoc) {
    throw new Error("Draft not found. The resume token is invalid or does not exist.");
  }

  if (draftTokenDoc.isRevoked) {
    throw new Error("This draft has already been submitted and finalized. It cannot be accessed in draft mode.");
  }

  if (new Date() > draftTokenDoc.expiresAt) {
    throw new Error("This draft session has expired (30-day validity window).");
  }

  const contractor = await Contractor.findById(draftTokenDoc.contractor).lean();
  const submission = await Submission.findById(draftTokenDoc.submission).lean();

  if (!contractor || !submission) {
    throw new Error("Associated draft records could not be retrieved from database.");
  }

  // Update last accessed timestamp
  await DraftToken.updateOne({ _id: draftTokenDoc._id }, { lastAccessedAt: new Date() });

  return {
    submissionReference: submission.submissionReference,
    status: submission.status,
    expiresAt: draftTokenDoc.expiresAt.toISOString(),
    contractor: {
      registrationNumber: contractor.registrationNumber,
      businessName: contractor.businessName,
      businessRegistrationNumber: contractor.businessRegistrationNumber || "",
      cidaGrade: contractor.cidaGrade,
      primarySpeciality: contractor.primarySpeciality || "",
      province: contractor.province,
      district: contractor.district || "",
      contactOfficer: {
        name: contractor.contactOfficer?.name || "",
        designation: contractor.contactOfficer?.designation || "",
        phone: contractor.contactOfficer?.phone || "",
        email: contractor.contactOfficer?.email || "",
      },
    },
    questionnaireData: (submission.questionnaireData as Record<string, unknown>) || {},
  };
}

/**
 * Finalize contractor submission: transitions statuses to "Submitted", revokes token,
 * assigns official submission reference, and records tamper-evident audit event.
 */
export async function submitFinalDeclaration(
  rawToken: string,
  clientIp?: string
): Promise<{
  submissionReference: string;
  businessName: string;
  submittedAt: string;
  provincialOffice: string;
}> {
  if (!isValidTokenFormat(rawToken)) {
    throw new Error("Invalid resume token format.");
  }

  await connectToDatabase();
  const tokenHash = hashResumeToken(rawToken);
  const draftTokenDoc = await DraftToken.findOne({ tokenHash });

  if (!draftTokenDoc) {
    throw new Error("Draft session not found.");
  }

  if (draftTokenDoc.isRevoked) {
    throw new Error("This declaration has already been submitted. Duplicate submissions are strictly prevented.");
  }

  if (new Date() > draftTokenDoc.expiresAt) {
    throw new Error("This draft session has expired. Submissions must occur within the active 30-day window.");
  }

  const contractor = await Contractor.findById(draftTokenDoc.contractor);
  const submission = await Submission.findById(draftTokenDoc.submission);

  if (!contractor || !submission) {
    throw new Error("Draft records not found in database.");
  }

  if (submission.status === "Submitted") {
    throw new Error("This registration has already been successfully submitted. Duplicate submissions are strictly prevented.");
  }

  const targetFormCode = submission.formId || DEFAULT_QUESTIONNAIRE_CODE;

  // Normalize & validate official questionnaire if populated
  const rawQ = (submission.questionnaireData as Record<string, any>) || {};
  if (rawQ && Object.keys(rawQ).length > 0) {
    const normalizedQ = normalizeQuestionnaireData(rawQ);

    // Only apply contractor-specific baseline questionnaire rules for the contractor form
    if (!submission.formId || submission.formId === DEFAULT_QUESTIONNAIRE_CODE) {
      const valResult = validateQuestionnaireSubmission(normalizedQ);
      if (!valResult.isValid) {
        const firstError = Object.values(valResult.errors)[0];
        throw new Error(`Incomplete questionnaire: ${firstError}`);
      }
    }

    const activePublished = await Questionnaire.findOne({
      $or: [{ code: targetFormCode }, { slug: targetFormCode }],
      status: "PUBLISHED",
    }).select("_id version code slug");

    submission.questionnaireData = normalizedQ as unknown as Record<string, unknown>;
    submission.schemaVersion = activePublished?.version || submission.schemaVersion || "2.0.0-official-form";
    if (activePublished) {
      submission.formId = activePublished.code;
      submission.formSlug = activePublished.slug;
      submission.questionnaireId = activePublished._id;
      submission.questionnaireVersion = activePublished.version;
    }

    if (normalizedQ.organizationName) {
      contractor.businessName = normalizedQ.organizationName;
    }
    if (normalizedQ.participantCategory === "Supplier" && normalizedQ.supplierDetails?.companyName) {
      contractor.businessName = normalizedQ.supplierDetails.companyName;
    }
    if (normalizedQ.participantCategory === "Supplier") {
      if (normalizedQ.supplierDetails?.province) {
        contractor.province = normalizedQ.supplierDetails.province as any;
        submission.provincialOffice = normalizedQ.supplierDetails.province;
      }
      if (normalizedQ.supplierDetails?.district) {
        contractor.district = normalizedQ.supplierDetails.district;
      }
      if (normalizedQ.supplierDetails?.materialsSupplied?.length) {
        contractor.primarySpeciality = normalizedQ.supplierDetails.materialsSupplied.join(", ");
      }
    } else if (normalizedQ.participantCategory === "Government Officer") {
      contractor.primarySpeciality = "Government Stakeholder";
    } else if (normalizedQ.participantCategory === "Contractor") {
      if (normalizedQ.ictadRegistrationNumber) {
        contractor.registrationNumber = normalizedQ.ictadRegistrationNumber.toUpperCase();
      }
      if (normalizedQ.cidaGrade) {
        contractor.cidaGrade = normalizedQ.cidaGrade as any;
      }
      if (normalizedQ.areasOfSpecialty?.length) {
        contractor.primarySpeciality = normalizedQ.areasOfSpecialty
          .map((s) => (s === "Other" && normalizedQ.specialtyOther ? `Other (${normalizedQ.specialtyOther})` : s))
          .join(", ");
      }
    } else if (normalizedQ.willParticipate === "No") {
      contractor.primarySpeciality = "Non-Attendee";
    }
  }

  // Mandatory fields fallback for non-questionnaire or partial profiles
  if (!contractor.businessName) contractor.businessName = rawQ.organizationName || "Registered Organization";
  if (!contractor.registrationNumber) contractor.registrationNumber = rawQ.ictadRegistrationNumber || `REG-${Date.now().toString().slice(-6)}`;
  if (!contractor.province) contractor.province = (rawQ.supplierDetails?.province || "Western Province") as any;
  if (!contractor.contactOfficer) contractor.contactOfficer = {};
  if (rawQ.participant1?.fullName) contractor.contactOfficer.name = rawQ.participant1.fullName.trim();
  if (rawQ.participant1?.designation) contractor.contactOfficer.designation = rawQ.participant1.designation.trim();
  if (rawQ.participant1?.mobileNumber) contractor.contactOfficer.phone = rawQ.participant1.mobileNumber.trim();
  else if (rawQ.contactNumber) contractor.contactOfficer.phone = rawQ.contactNumber.trim();
  if (rawQ.participant1?.email) contractor.contactOfficer.email = rawQ.participant1.email.trim().toLowerCase();
  else if (rawQ.email) contractor.contactOfficer.email = rawQ.email.trim().toLowerCase();

  const submittedAt = new Date();

  // Transition submission: update status to Submitted and preserve permanent registration reference
  submission.status = "Submitted";
  submission.submittedAt = submittedAt;
  await submission.save();

  const officialSubmissionRef = submission.submissionReference;

  // Transition contractor
  contractor.status = "Pending_Review";
  await contractor.save();

  // Revoke token immediately to lock the draft
  draftTokenDoc.isRevoked = true;
  draftTokenDoc.revokedAt = submittedAt;
  await draftTokenDoc.save();

  // Record audit log
  await recordActivityLog({
    action: "CONTRACTOR_SUBMISSION_RECEIVED",
    performerName: contractor.contactOfficer?.name || contractor.businessName || "Authorized Representative",
    performerRole: "CONTRACTOR",
    targetType: "Submission",
    targetId: officialSubmissionRef,
    description: `Official contractor submission received from ${contractor.businessName} (${contractor.registrationNumber})`,
    province: contractor.province,
    ipAddress: clientIp || "web-portal",
    metadata: {
      registrationNumber: contractor.registrationNumber,
      submissionReference: officialSubmissionRef,
      cidaGrade: contractor.cidaGrade,
    },
  });

  return {
    submissionReference: officialSubmissionRef,
    businessName: contractor.businessName,
    submittedAt: submittedAt.toISOString(),
    provincialOffice: submission.provincialOffice,
  };
}
