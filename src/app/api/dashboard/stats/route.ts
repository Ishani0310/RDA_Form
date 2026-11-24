import { NextRequest, NextResponse } from "next/server";
import { getCurrentOfficerSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Submission } from "@/models/Submission";
import { DraftToken } from "@/models/DraftToken";
import "@/models/Contractor"; // Ensure model registration for populate

/**
 * GET /api/dashboard/stats
 * Central administrative analytics endpoint for RDA ICDP staff.
 * Calculates all 8 dynamic metrics from actual MongoDB records according to official rules.
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

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const requestedProvince = searchParams.get("province") || "";

    // Provincial Director scoping
    const submissionBaseQuery: Record<string, unknown> = {};
    if (session.role === "PROVINCIAL_DIRECTOR") {
      submissionBaseQuery.provincialOffice = session.assignedProvince;
    } else if (requestedProvince && requestedProvince !== "All Provincial Offices") {
      submissionBaseQuery.provincialOffice = requestedProvince;
    }

    // Base query for submitted records (excludes Draft status)
    const submittedBaseMatch: Record<string, unknown> = {
      ...submissionBaseQuery,
      status: { $in: ["Submitted", "Under_Review", "Verified", "Action_Required", "Rejected"] },
    };

    // -------------------------------------------------------------------------
    // CARD 7: Total Submitted Registrations (All submitted records, attendees + non-attendees)
    // -------------------------------------------------------------------------
    const totalSubmittedRegistrations = await Submission.countDocuments(submittedBaseMatch);

    // -------------------------------------------------------------------------
    // CARD 2: Total Contractors
    // -------------------------------------------------------------------------
    const totalContractors = await Submission.countDocuments({
      ...submittedBaseMatch,
      "questionnaireData.participantCategory": "Contractor",
    });

    // -------------------------------------------------------------------------
    // CARD 3: Total Suppliers
    // -------------------------------------------------------------------------
    const totalSuppliers = await Submission.countDocuments({
      ...submittedBaseMatch,
      "questionnaireData.participantCategory": "Supplier",
    });

    // -------------------------------------------------------------------------
    // CARD 4: Total Government Officers
    // -------------------------------------------------------------------------
    const totalGovernmentOfficers = await Submission.countDocuments({
      ...submittedBaseMatch,
      "questionnaireData.participantCategory": "Government Officer",
    });

    // -------------------------------------------------------------------------
    // CARD 6: Total Non-Attendees (Successfully submitted registrations where attendance is No)
    // -------------------------------------------------------------------------
    const totalNonAttendees = await Submission.countDocuments({
      ...submittedBaseMatch,
      "questionnaireData.willParticipate": "No",
    });

    // -------------------------------------------------------------------------
    // CARD 1: Total Registered Organizations
    // Count only successfully submitted organizations.
    // Include Contractors, Suppliers, Government Officers.
    // Drafts and non-attendees must NOT be included. Each organization counted once.
    // -------------------------------------------------------------------------
    const uniqueOrgAggregation = await Submission.aggregate([
      {
        $match: {
          ...submittedBaseMatch,
          "questionnaireData.willParticipate": "Yes",
          "questionnaireData.participantCategory": {
            $in: ["Contractor", "Supplier", "Government Officer"],
          },
        },
      },
      {
        $lookup: {
          from: "contractors",
          localField: "contractor",
          foreignField: "_id",
          as: "contractorDoc",
        },
      },
      {
        $unwind: {
          path: "$contractorDoc",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          normalizedOrgName: {
            $trim: {
              input: {
                $toLower: {
                  $ifNull: [
                    "$questionnaireData.organizationName",
                    {
                      $ifNull: [
                        "$questionnaireData.supplierDetails.companyName",
                        { $ifNull: ["$contractorDoc.businessName", ""] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $match: {
          normalizedOrgName: { $ne: "" },
        },
      },
      {
        $group: {
          _id: "$normalizedOrgName",
        },
      },
      {
        $count: "uniqueCount",
      },
    ]);

    const totalRegisteredOrganizations =
      uniqueOrgAggregation.length > 0 ? uniqueOrgAggregation[0].uniqueCount : 0;

    // -------------------------------------------------------------------------
    // CARD 5: Total Workshop Participants
    // Calculate total actual registered attendees:
    // P1 = 1, P2 = 1 if provided/non-empty. Only submitted where willParticipate is Yes.
    // -------------------------------------------------------------------------
    const participantsAggregation = await Submission.aggregate([
      {
        $match: {
          ...submittedBaseMatch,
          "questionnaireData.willParticipate": "Yes",
        },
      },
      {
        $project: {
          p1Count: {
            $cond: [
              {
                $gt: [
                  {
                    $strLenCP: {
                      $trim: {
                        input: {
                          $ifNull: ["$questionnaireData.participant1.fullName", ""],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              1,
              1, // P1 is required for all attending participants
            ],
          },
          p2Count: {
            $cond: [
              {
                $gt: [
                  {
                    $strLenCP: {
                      $trim: {
                        input: {
                          $ifNull: ["$questionnaireData.participant2.fullName", ""],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: { $add: ["$p1Count", "$p2Count"] } },
        },
      },
    ]);

    const totalWorkshopParticipants =
      participantsAggregation.length > 0 ? participantsAggregation[0].totalParticipants : 0;

    // -------------------------------------------------------------------------
    // CARD 8: Total Draft Registrations
    // Currently active, unsubmitted draft registrations (status === "Draft").
    // Excludes finalized submissions.
    // -------------------------------------------------------------------------
    const activeDraftTokensCount = await Submission.countDocuments({
      ...submissionBaseQuery,
      status: "Draft",
    });

    // -------------------------------------------------------------------------
    // SECTION 3: Registration Category Chart Data (Contractors, Suppliers, Gov Officers)
    // -------------------------------------------------------------------------
    const categorySum = totalContractors + totalSuppliers + totalGovernmentOfficers;
    const categoryBreakdown = [
      {
        category: "Contractor",
        count: totalContractors,
        percentage: categorySum > 0 ? Math.round((totalContractors / categorySum) * 1000) / 10 : 0,
        color: "#1e3a8a", // RDA Blue
      },
      {
        category: "Supplier",
        count: totalSuppliers,
        percentage: categorySum > 0 ? Math.round((totalSuppliers / categorySum) * 1000) / 10 : 0,
        color: "#7c3aed", // Violet / Purple
      },
      {
        category: "Government Officer",
        count: totalGovernmentOfficers,
        percentage: categorySum > 0 ? Math.round((totalGovernmentOfficers / categorySum) * 1000) / 10 : 0,
        color: "#059669", // Emerald
      },
    ];

    // -------------------------------------------------------------------------
    // SECTION 5: Registration Status Overview (Submitted, Active Drafts, Non-Attendees)
    // -------------------------------------------------------------------------
    const statusOverview = {
      submitted: totalSubmittedRegistrations,
      activeDrafts: activeDraftTokensCount,
      nonAttendees: totalNonAttendees,
    };

    // -------------------------------------------------------------------------
    // SECTION 4: Recent Registrations (Latest 10 successfully submitted records)
    // -------------------------------------------------------------------------
    const recentDocs = await Submission.find(submittedBaseMatch)
      .populate("contractor", "businessName registrationNumber cidaGrade province contactOfficer")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentRegistrations = recentDocs.map((doc: any) => {
      const q = doc.questionnaireData || {};
      const c = doc.contractor || {};

      const orgName =
        q.organizationName?.trim() ||
        q.supplierDetails?.companyName?.trim() ||
        c.businessName ||
        "Unnamed Entity";

      const category = q.participantCategory || (q.willParticipate === "No" ? "Non-Attendee" : "Unspecified");

      const contactNumber =
        q.contactNumber ||
        q.participant1?.mobileNumber ||
        c.contactOfficer?.phone ||
        "—";

      const email =
        q.email ||
        c.contactOfficer?.email ||
        "—";

      const attendance = q.willParticipate === "No" ? "No" : "Yes";

      let participantCount = 0;
      if (q.willParticipate === "Yes") {
        participantCount = 1; // P1 is required
        if (q.participant2?.fullName?.trim()) participantCount += 1;
      }

      return {
        id: doc._id.toString(),
        ref: doc.submissionReference,
        organizationName: orgName,
        participantCategory: category,
        contactNumber,
        email,
        workshopAttendance: attendance,
        participantCount,
        submissionDate: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("en-GB") : "Recent",
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        provincialOffice: doc.provincialOffice,
        status: doc.status,
        isViewed: Boolean(doc.isViewed),
        viewedAt: doc.viewedAt ? new Date(doc.viewedAt).toLocaleDateString("en-GB") : null,
        viewedByName: doc.viewedByName || null,
      };
    });

    const totalUnseenRegistrations = await Submission.countDocuments({
      ...submittedBaseMatch,
      $or: [{ isViewed: false }, { isViewed: { $exists: false } }],
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRegisteredOrganizations,
        totalContractors,
        totalSuppliers,
        totalGovernmentOfficers,
        totalWorkshopParticipants,
        totalNonAttendees,
        totalSubmittedRegistrations,
        totalDraftRegistrations: activeDraftTokensCount,
        totalUnseenRegistrations,
      },
      categoryBreakdown,
      statusOverview,
      recentRegistrations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate dashboard statistics.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
