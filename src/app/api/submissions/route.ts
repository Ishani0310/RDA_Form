import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Submission } from "@/models/Submission";
import { Contractor } from "@/models/Contractor";
import { DraftToken } from "@/models/DraftToken";
import { generateResumeToken, hashResumeToken } from "@/lib/draft-service";
import { recordActivityLog } from "@/lib/audit";
import "@/models/User";

/**
 * GET /api/submissions
 * Review console for incoming contractor questionnaire submissions and filings.
 * Supports filtering by Category, Workshop Attendance, Status, Province, and Global Search.
 * 
 * RBAC: Accessible to any authenticated RDA Officer.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Official RDA officer authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const province = (searchParams.get("province") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const attendance = (searchParams.get("attendance") || "").trim();
    const viewStatus = (searchParams.get("viewStatus") || "").trim().toLowerCase();
    const ref = (searchParams.get("ref") || "").trim();
    const formFilter = (searchParams.get("formId") || searchParams.get("form") || "").trim();

    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const page = Math.max(1, isNaN(pageParam) ? 1 : pageParam);
    const limit = Math.min(100, Math.max(1, isNaN(limitParam) ? 10 : limitParam));
    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Prevent duplicate draft records: Clean up any stale drafts whose email already has an official submission
    const completedSubmissions = await Submission.find({
      status: { $in: ["Submitted", "Under_Review", "Verified", "Action_Required", "Rejected"] },
    })
      .select("questionnaireData.email questionnaireData.participant1.email")
      .lean();

    const submittedEmails = new Set<string>();
    for (const sub of completedSubmissions) {
      const q = (sub as any).questionnaireData || {};
      const e1 = q.email?.trim().toLowerCase();
      const e2 = q.participant1?.email?.trim().toLowerCase();
      if (e1 && e1 !== "contact@rda.gov.lk") submittedEmails.add(e1);
      if (e2 && e2 !== "contact@rda.gov.lk") submittedEmails.add(e2);
    }

    if (submittedEmails.size > 0) {
      const emailList = Array.from(submittedEmails);
      await Submission.deleteMany({
        status: "Draft",
        $or: [
          { "questionnaireData.email": { $in: emailList } },
          { "questionnaireData.participant1.email": { $in: emailList } },
        ],
      }).catch(() => {});
    }

    // Prevent duplicate draft records: If multiple drafts exist for the same company name, retain only the newest draft
    try {
      const allDrafts = await Submission.find({ status: "Draft" })
        .select("_id contractor questionnaireData.organizationName questionnaireData.supplierDetails.companyName createdAt")
        .sort({ createdAt: -1 })
        .lean();

      const seenOrgs = new Set<string>();
      const dupDraftSubIds: any[] = [];
      const dupContractorIds: any[] = [];

      for (const d of allDrafts) {
        const org = (
          (d as any).questionnaireData?.organizationName ||
          (d as any).questionnaireData?.supplierDetails?.companyName ||
          ""
        ).trim().toLowerCase();

        if (org && org !== "new registration draft") {
          if (seenOrgs.has(org)) {
            dupDraftSubIds.push(d._id);
            if ((d as any).contractor) dupContractorIds.push((d as any).contractor);
          } else {
            seenOrgs.add(org);
          }
        }
      }

      if (dupDraftSubIds.length > 0) {
        await Promise.all([
          Submission.deleteMany({ _id: { $in: dupDraftSubIds } }),
          DraftToken.deleteMany({ submission: { $in: dupDraftSubIds } }),
          Contractor.deleteMany({ _id: { $in: dupContractorIds }, status: "Draft" }),
        ]).catch(() => {});
      }
    } catch {
      // Background draft cleanup guard
    }

    const query: Record<string, unknown> = {};

    // Specific Form Filter
    if (formFilter && formFilter !== "ALL") {
      query.$or = [{ formId: formFilter }, { formSlug: formFilter }];
    }

    // Provincial Director / Engineer scoping
    if (session.role === "PROVINCIAL_DIRECTOR") {
      query.provincialOffice = session.assignedProvince;
    } else if (province && province !== "All Provincial Offices") {
      query.provincialOffice = province;
    }

    // Direct reference match - if specific ref is requested, bypass category/status restrictions so it is always found
    if (ref) {
      query.submissionReference = ref;
    } else {
      // Category filter (Contractor, Supplier, Government Officer)
      if (category && category !== "All Categories") {
        query["questionnaireData.participantCategory"] = category;
      }

      // Workshop Attendance filter (Yes, No)
      if (attendance && attendance !== "All Attendance") {
        query["questionnaireData.willParticipate"] = attendance;
      }

      // Review / Viewed Status filter (unseen, seen)
      if (viewStatus === "unseen") {
        query.$or = [{ isViewed: false }, { isViewed: { $exists: false } }];
      } else if (viewStatus === "seen") {
        query.isViewed = true;
      }

      // Status filter
      if (status && status !== "All Statuses") {
        const lower = status.toLowerCase();
        if (lower === "submitted") {
          query.status = { $in: ["Submitted", "Under_Review", "Verified", "Action_Required", "Rejected"] };
        } else if (lower === "draft") {
          query.status = "Draft";
        } else if (lower === "under_review") {
          query.status = "Under_Review";
        } else if (lower === "approved" || lower === "verified") {
          query.status = "Verified";
        } else if (lower === "rejected" || lower === "action_required") {
          query.status = { $in: ["Rejected", "Action_Required"] };
        } else {
          query.status = status;
        }
      }
    }

    // Global Search: Organization Name, ICTAD Reg No, Contact Number, Email
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingContractors = await Contractor.find({
        $or: [
          { businessName: { $regex: escaped, $options: "i" } },
          { registrationNumber: { $regex: escaped, $options: "i" } },
          { "contactOfficer.phone": { $regex: escaped, $options: "i" } },
          { "contactOfficer.email": { $regex: escaped, $options: "i" } },
          { "contactOfficer.name": { $regex: escaped, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const matchingContractorIds = matchingContractors.map((c) => c._id);

      query.$or = [
        { submissionReference: { $regex: escaped, $options: "i" } },
        { provincialOffice: { $regex: escaped, $options: "i" } },
        { "questionnaireData.organizationName": { $regex: escaped, $options: "i" } },
        { "questionnaireData.supplierDetails.companyName": { $regex: escaped, $options: "i" } },
        { "questionnaireData.ictadRegistrationNumber": { $regex: escaped, $options: "i" } },
        { "questionnaireData.contactNumber": { $regex: escaped, $options: "i" } },
        { "questionnaireData.email": { $regex: escaped, $options: "i" } },
        { "questionnaireData.participant1.fullName": { $regex: escaped, $options: "i" } },
        { "questionnaireData.participant1.mobileNumber": { $regex: escaped, $options: "i" } },
        ...(matchingContractorIds.length > 0 ? [{ contractor: { $in: matchingContractorIds } }] : []),
      ];
    }

    const baseQueryNoStatus = { ...query };
    delete baseQueryNoStatus.status;
    delete baseQueryNoStatus.isViewed;
    delete baseQueryNoStatus.$or;

    const [totalCount, submittedCount, draftCount, unseenCount, seenCount] = await Promise.all([
      Submission.countDocuments(query),
      Submission.countDocuments({
        ...baseQueryNoStatus,
        status: { $in: ["Submitted", "Under_Review", "Verified", "Action_Required", "Rejected"] },
      }),
      Submission.countDocuments({
        ...baseQueryNoStatus,
        status: "Draft",
      }),
      Submission.countDocuments({
        ...baseQueryNoStatus,
        status: { $in: ["Submitted", "Under_Review", "Verified", "Action_Required", "Rejected"] },
        $or: [{ isViewed: false }, { isViewed: { $exists: false } }],
      }),
      Submission.countDocuments({
        ...baseQueryNoStatus,
        status: { $in: ["Submitted", "Under_Review", "Verified", "Action_Required", "Rejected"] },
        isViewed: true,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    const submissions = await Submission.find(query)
      .populate("contractor", "businessName registrationNumber cidaGrade province")
      .populate("reviewedBy", "fullName designation")
      .sort({ updatedAt: -1, submittedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = submissions.map((s: any) => {
      const isDraft = s.status === "Draft";
      const createdDate = s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : "—";
      const updatedDate = s.updatedAt ? new Date(s.updatedAt).toLocaleDateString("en-GB") : createdDate;
      const finalSubmissionDate = !isDraft
        ? s.submittedAt
          ? new Date(s.submittedAt).toLocaleDateString("en-GB")
          : s.createdAt
          ? new Date(s.createdAt).toLocaleDateString("en-GB")
          : "Submitted"
        : null;

      return {
        id: s._id.toString(),
        ref: s.submissionReference,
        contractor: s.contractor?.businessName || s.questionnaireData?.organizationName || "Unknown Entity",
        regNo: s.contractor?.registrationNumber || "N/A",
        grade: s.contractor?.cidaGrade || "Pending",
        submissionType: s.submissionType || "Annual_Capacity_Declaration",
        provincialOffice: s.provincialOffice,
        status: s.status,
        category: s.questionnaireData?.participantCategory || (s.contractor?.primarySpeciality ? "Contractor" : "General"),
        isViewed: Boolean(s.isViewed),
        viewedAt: s.viewedAt ? new Date(s.viewedAt).toLocaleDateString("en-GB") : null,
        viewedByName: s.viewedByName || null,
        schemaVersion: s.schemaVersion,
        formId: s.formId || "RDA-ICDP-CONTRACTOR-Q",
        formSlug: s.formSlug || "contractor",
        questionnaireId: s.questionnaireId?.toString(),
        questionnaireVersion: s.questionnaireVersion || s.schemaVersion,
        questionnaireData: s.questionnaireData || null,
        createdAt: createdDate,
        updatedAt: updatedDate,
        submittedAt: finalSubmissionDate,
        reviewedBy: s.reviewedBy?.fullName || "Awaiting Review",
        reviewNotes: s.reviewNotes || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted,
      counts: {
        all: totalCount,
        submitted: submittedCount,
        draft: draftCount,
        unseen: unseenCount,
        seen: seenCount,
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to query contractor submissions.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PATCH /api/submissions
 * Updates submission review/view status (e.g. mark as seen / unseen / checked).
 * Accessible to authenticated RDA officers.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Official RDA officer authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, ref, isViewed } = body;

    if (!id && !ref) {
      return NextResponse.json(
        { success: false, message: "Submission ID or Reference is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query: Record<string, unknown> = id ? { _id: id } : { submissionReference: ref };
    const submission = await Submission.findOne(query);

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission record not found." },
        { status: 404 }
      );
    }

    if (typeof isViewed === "boolean") {
      submission.isViewed = isViewed;
      if (isViewed) {
        submission.viewedAt = new Date();
        submission.viewedByName = session.fullName || "RDA Officer";
      } else {
        submission.viewedAt = undefined;
        submission.viewedByName = undefined;
      }
    }

    await submission.save();

    return NextResponse.json({
      success: true,
      data: {
        id: submission._id.toString(),
        ref: submission.submissionReference,
        isViewed: submission.isViewed,
        viewedAt: submission.viewedAt ? new Date(submission.viewedAt).toLocaleDateString("en-GB") : null,
        viewedByName: submission.viewedByName || null,
      },
      message: submission.isViewed ? "Submission marked as seen." : "Submission marked as unseen.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update submission view status.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * PUT /api/submissions
 * Updates an existing submission record and its questionnaire data.
 * Accessible to authenticated RDA officers.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Official RDA officer authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, ref, updates } = body;

    if (!id && !ref) {
      return NextResponse.json(
        { success: false, message: "Submission ID or Reference is required to update." },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json(
        { success: false, message: "Valid update payload is required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query: Record<string, unknown> = id ? { _id: id } : { submissionReference: ref };
    const submission = await Submission.findOne(query);

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission record not found." },
        { status: 404 }
      );
    }

    // Update submission level attributes
    if (updates.status) submission.status = updates.status;
    if (updates.provincialOffice) submission.provincialOffice = updates.provincialOffice;
    if (updates.reviewNotes !== undefined) submission.reviewNotes = updates.reviewNotes;

    // When an administrator sets/reverts status to "Draft", activate/un-revoke a valid DraftToken
    // so the contractor who submitted the form can edit their registration again seamlessly.
    if (updates.status === "Draft") {
      const plainToken = generateResumeToken();
      const tokenHash = hashResumeToken(plainToken);
      const draftTokenDoc = await DraftToken.findOne({ submission: submission._id });
      if (draftTokenDoc) {
        draftTokenDoc.tokenHash = tokenHash;
        draftTokenDoc.isRevoked = false;
        draftTokenDoc.revokedAt = undefined;
        draftTokenDoc.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await draftTokenDoc.save();
      } else {
        await DraftToken.create({
          tokenHash,
          contractor: submission.contractor,
          submission: submission._id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isRevoked: false,
        });
      }
    }

    // Merge questionnaireData payload
    const currentQData = (submission.questionnaireData as Record<string, any>) || {};
    const updatedQData: Record<string, any> = {
      ...currentQData,
      ...(updates.questionnaireData || {}),
    };

    // Sync high-level quick-edit fields into questionnaireData
    if (updates.organizationName) updatedQData.organizationName = updates.organizationName;
    if (updates.contactNumber) updatedQData.contactNumber = updates.contactNumber;
    if (updates.email) updatedQData.email = updates.email;
    if (updates.willParticipate) updatedQData.willParticipate = updates.willParticipate;
    if (updates.participantCategory) updatedQData.participantCategory = updates.participantCategory;
    if (updates.participant1) updatedQData.participant1 = updates.participant1;
    if (updates.participant2) updatedQData.participant2 = updates.participant2;
    if (updates.supplierDetails) updatedQData.supplierDetails = updates.supplierDetails;
    if (updates.ictadRegistrationNumber !== undefined) updatedQData.ictadRegistrationNumber = updates.ictadRegistrationNumber;
    if (updates.cidaGrade !== undefined) updatedQData.cidaGrade = updates.cidaGrade;
    if (updates.generalExperience !== undefined) updatedQData.generalExperience = updates.generalExperience;
    if (updates.hasRdaOrIcdpExperience !== undefined) updatedQData.hasRdaOrIcdpExperience = updates.hasRdaOrIcdpExperience;
    if (updates.rdaIcdpExperienceType !== undefined) updatedQData.rdaIcdpExperienceType = updates.rdaIcdpExperienceType;
    if (updates.forecastedCapacity2027 !== undefined) updatedQData.forecastedCapacity2027 = updates.forecastedCapacity2027;
    if (updates.forecastedRuralRoadKmPerYear !== undefined) updatedQData.forecastedRuralRoadKmPerYear = updates.forecastedRuralRoadKmPerYear;
    if (updates.forecastedNationalProvincialKmPerYear !== undefined) updatedQData.forecastedNationalProvincialKmPerYear = updates.forecastedNationalProvincialKmPerYear;
    if (updates.preferableDistricts !== undefined) updatedQData.preferableDistricts = updates.preferableDistricts;
    if (updates.mattersForDiscussion !== undefined) updatedQData.mattersForDiscussion = updates.mattersForDiscussion;

    submission.questionnaireData = updatedQData;
    submission.updatedAt = new Date();
    await submission.save();

    // Synchronize Contractor document
    if (submission.contractor) {
      const contractor = await Contractor.findById(submission.contractor);
      if (contractor) {
        const newOrgName =
          (updatedQData.participantCategory === "Supplier" && updatedQData.supplierDetails?.companyName)
            ? updatedQData.supplierDetails.companyName
            : (updates.organizationName || updatedQData.organizationName);

        if (newOrgName) {
          contractor.businessName = newOrgName;
        }

        if (updatedQData.participantCategory === "Supplier") {
          if (updatedQData.supplierDetails?.province) {
            contractor.province = updatedQData.supplierDetails.province as any;
          }
          if (updatedQData.supplierDetails?.district) {
            contractor.district = updatedQData.supplierDetails.district;
          }
          if (updatedQData.supplierDetails?.materialsSupplied?.length) {
            contractor.primarySpeciality = updatedQData.supplierDetails.materialsSupplied.join(", ");
          }
        } else {
          if (updatedQData.ictadRegistrationNumber) {
            contractor.registrationNumber = updatedQData.ictadRegistrationNumber;
          }
          if (updatedQData.cidaGrade) {
            contractor.cidaGrade = updatedQData.cidaGrade;
          }
          if (submission.provincialOffice) {
            contractor.province = submission.provincialOffice as any;
          }
        }
        if (updatedQData.contactNumber || updatedQData.email || updatedQData.participant1) {
          contractor.contactOfficer = {
            name: updatedQData.participant1?.fullName || contractor.contactOfficer?.name || "",
            designation: updatedQData.participant1?.designation || contractor.contactOfficer?.designation || "",
            phone: updatedQData.contactNumber || updatedQData.participant1?.mobileNumber || contractor.contactOfficer?.phone || "",
            email: updatedQData.email || updatedQData.participant1?.email || contractor.contactOfficer?.email || "",
          };
        }
        await contractor.save();
      }
    }

    // Record audit activity log
    await recordActivityLog({
      action: "SUBMISSION_UPDATED",
      session,
      targetType: "Submission",
      targetId: submission._id.toString(),
      description: `Submission ${submission.submissionReference} was edited and updated by ${session.fullName || "RDA Officer"}.`,
      metadata: {
        reference: submission.submissionReference,
        status: submission.status,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Submission ${submission.submissionReference} updated successfully.`,
      data: {
        id: submission._id.toString(),
        ref: submission.submissionReference,
        status: submission.status,
        provincialOffice: submission.provincialOffice,
        questionnaireData: submission.questionnaireData,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update submission data.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

/**
 * DELETE /api/submissions
 * Permanently deletes a submission record and its associated draft tokens.
 * Only authenticated RDA officers can delete records.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentOfficerSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Official RDA officer authentication required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const id = body.id || searchParams.get("id");
    const ref = body.ref || searchParams.get("ref");

    if (!id && !ref) {
      return NextResponse.json(
        { success: false, message: "Submission ID or Reference is required for deletion." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query: Record<string, unknown> = id ? { _id: id } : { submissionReference: ref };
    const submission = await Submission.findOne(query);

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission record not found." },
        { status: 404 }
      );
    }

    const submissionId = submission._id;
    const subRef = submission.submissionReference;
    const contractorId = submission.contractor;

    // Remove associated DraftToken documents
    await DraftToken.deleteMany({ submission: submissionId }).catch(() => {});

    // Delete submission
    await Submission.deleteOne({ _id: submissionId });

    // If contractor has no remaining submissions and was in Draft status, clean up
    if (contractorId) {
      const remainingSubs = await Submission.countDocuments({ contractor: contractorId });
      if (remainingSubs === 0) {
        await Contractor.deleteOne({ _id: contractorId, status: "Draft" }).catch(() => {});
      }
    }

    // Record audit activity log
    await recordActivityLog({
      action: "SUBMISSION_DELETED",
      session,
      targetType: "Submission",
      targetId: submissionId.toString(),
      description: `Submission ${subRef} was permanently deleted by ${session.fullName || "RDA Officer"}.`,
      metadata: { reference: subRef },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Submission ${subRef} was permanently deleted.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete submission record.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
