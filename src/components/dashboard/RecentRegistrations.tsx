"use client";

import React from "react";
import Link from "next/link";
import {
  Inbox,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  UserX,
  Briefcase,
  Truck,
  Landmark,
  Phone,
  Calendar,
  Layers,
} from "lucide-react";

export interface RecentRegistrationItem {
  id: string;
  ref: string;
  organizationName: string;
  participantCategory: string;
  contactNumber: string;
  email: string;
  workshopAttendance: string;
  participantCount: number;
  submissionDate: string;
  provincialOffice?: string;
  status: string;
  isViewed?: boolean;
  viewedAt?: string | null;
  viewedByName?: string | null;
}

interface RecentRegistrationsProps {
  registrations: RecentRegistrationItem[];
  loading: boolean;
}

export const RecentRegistrations: React.FC<RecentRegistrationsProps> = ({
  registrations,
  loading,
}) => {
  const getCategoryBadge = (cat: string, attendance: string) => {
    if (attendance === "No") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <UserX className="w-3 h-3 text-slate-500" />
          Non-Attendee
        </span>
      );
    }

    switch (cat) {
      case "Contractor":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-900 border border-blue-200/60">
            <Briefcase className="w-3 h-3 text-blue-700" />
            Contractor
          </span>
        );
      case "Supplier":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200/60">
            <Truck className="w-3 h-3 text-purple-700" />
            Supplier
          </span>
        );
      case "Government Officer":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-900 border border-teal-200/60">
            <Landmark className="w-3 h-3 text-teal-700" />
            Gov Officer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
            {cat || "General"}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Table Header Section */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Recent Registrations
            </h3>
            <p className="text-[11px] text-slate-500">
              Latest 10 successfully submitted stakeholder registrations
            </p>
          </div>
        </div>

        <Link
          href="/submissions"
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors"
        >
          <span>View All Submissions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium">Loading recent registrations...</span>
        </div>
      ) : registrations.length === 0 ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
          <Inbox className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-bold text-slate-700">No submissions found</p>
          <p className="text-[11px] text-slate-400 max-w-sm">
            When organizations submit their capacity questionnaires or workshop registrations, the latest 10 will display here in real time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Organization / Company Name</th>
                <th className="px-4 py-2.5">Registration Category</th>
                <th className="px-4 py-2.5">Contact Number</th>
                <th className="px-4 py-2.5">Submission Date</th>
                <th className="px-4 py-2.5">Review Status</th>
                <th className="px-4 py-2.5">Registration Status</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.map((reg) => (
                <tr
                  key={reg.id}
                  className={`transition-colors ${
                    reg.isViewed
                      ? "hover:bg-slate-50/60"
                      : "bg-amber-50/25 hover:bg-amber-50/50 border-l-2 border-l-amber-500"
                  }`}
                >
                  {/* Column 1: Organization / Company Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{reg.organizationName}</p>
                      {!reg.isViewed && (
                        <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-amber-500 text-white tracking-wide">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{reg.ref}</p>
                  </td>

                  {/* Column 2: Registration Category */}
                  <td className="px-4 py-3">
                    {getCategoryBadge(reg.participantCategory, reg.workshopAttendance)}
                  </td>

                  {/* Column 3: Contact Number */}
                  <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{reg.contactNumber}</span>
                    </div>
                  </td>

                  {/* Column 4: Submission Date */}
                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{reg.submissionDate}</span>
                    </div>
                  </td>

                  {/* Column 5: Review Status (Unseen vs Seen) */}
                  <td className="px-4 py-3">
                    {reg.isViewed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Eye className="w-3 h-3 text-emerald-600" />
                        Seen / Checked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                        <EyeOff className="w-3 h-3 text-amber-700" />
                        Unseen (Not Checked)
                      </span>
                    )}
                  </td>

                  {/* Column 6: Registration Status */}
                  <td className="px-4 py-3">
                    {reg.workshopAttendance === "No" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <UserX className="w-3.5 h-3.5 text-slate-400" />
                        Submitted (Declined)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Submitted ({reg.participantCount} Attendee{reg.participantCount > 1 ? "s" : ""})
                      </span>
                    )}
                  </td>

                  {/* Column 6: Action (View Details) */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/submissions?ref=${encodeURIComponent(reg.ref)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-all border border-blue-200/60"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Details</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
