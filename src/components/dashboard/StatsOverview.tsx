"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Truck,
  Landmark,
  Users,
  UserX,
  FileCheck2,
  Clock,
} from "lucide-react";

export interface DashboardStatsData {
  totalRegisteredOrganizations: number;
  totalContractors: number;
  totalSuppliers: number;
  totalGovernmentOfficers: number;
  totalWorkshopParticipants: number;
  totalNonAttendees: number;
  totalSubmittedRegistrations: number;
  totalDraftRegistrations: number;
}

interface StatsOverviewProps {
  stats: DashboardStatsData | null;
  loading: boolean;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, loading }) => {
  const cards = [
    {
      id: "card-registered-orgs",
      title: "Registered Organizations",
      value: stats?.totalRegisteredOrganizations ?? 0,
      href: "/submissions?status=submitted&attendance=Yes",
      icon: Building2,
      accentStyle: "border-t-2 border-t-blue-900",
      iconStyle: "bg-blue-50 text-blue-900",
    },
    {
      id: "card-contractors",
      title: "Contractors",
      value: stats?.totalContractors ?? 0,
      href: "/submissions?category=Contractor",
      icon: Briefcase,
      accentStyle: "border-t-2 border-t-indigo-600",
      iconStyle: "bg-indigo-50 text-indigo-700",
    },
    {
      id: "card-suppliers",
      title: "Suppliers",
      value: stats?.totalSuppliers ?? 0,
      href: "/submissions?category=Supplier",
      icon: Truck,
      accentStyle: "border-t-2 border-t-purple-600",
      iconStyle: "bg-purple-50 text-purple-700",
    },
    {
      id: "card-gov-officers",
      title: "Government Officers",
      value: stats?.totalGovernmentOfficers ?? 0,
      href: "/submissions?category=Government+Officer",
      icon: Landmark,
      accentStyle: "border-t-2 border-t-teal-600",
      iconStyle: "bg-teal-50 text-teal-700",
    },
    {
      id: "card-workshop-participants",
      title: "Workshop Delegates",
      value: stats?.totalWorkshopParticipants ?? 0,
      href: "/submissions?attendance=Yes",
      icon: Users,
      accentStyle: "border-t-2 border-t-cyan-600",
      iconStyle: "bg-cyan-50 text-cyan-800",
    },
    {
      id: "card-non-attendees",
      title: "Non-Attendees",
      value: stats?.totalNonAttendees ?? 0,
      href: "/submissions?attendance=No",
      icon: UserX,
      accentStyle: "border-t-2 border-t-slate-500",
      iconStyle: "bg-slate-100 text-slate-700",
    },
    {
      id: "card-submitted-registrations",
      title: "Submitted Registrations",
      value: stats?.totalSubmittedRegistrations ?? 0,
      href: "/submissions?status=submitted",
      icon: FileCheck2,
      accentStyle: "border-t-2 border-t-emerald-600",
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      id: "card-draft-registrations",
      title: "Active Drafts",
      value: stats?.totalDraftRegistrations ?? 0,
      href: "/submissions?status=draft",
      icon: Clock,
      accentStyle: "border-t-2 border-t-amber-500",
      iconStyle: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-2">
      {/* Section Header: Title & Subtitle */}
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Registration Key Performance Indicators
        </h2>
        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Click any card to inspect filtered records
        </span>
      </div>

      {/* 8-Column Single Horizontal Row Layout on Desktop (grid-template-columns: repeat(8, minmax(0, 1fr))) */}
      <div className="kpi-row-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              className={`group bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between h-[100px] ${card.accentStyle}`}
            >
              {/* Top Row: Small Icon (18-20px) */}
              <div className="flex items-center justify-between">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${card.iconStyle}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
              </div>

              {/* Middle Row: Large, Clear Numerical Value */}
              <div className="my-auto">
                {loading ? (
                  <div className="h-6 w-12 bg-slate-200 animate-pulse rounded" />
                ) : (
                  <span className="text-xl font-black text-slate-900 tracking-tight font-mono leading-none block">
                    {Number(card.value).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Bottom Row: Short Card Title (Consistent 2-line height alignment) */}
              <div className="h-[26px] flex items-center">
                <h3 className="text-[10.5px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors leading-tight line-clamp-2">
                  {card.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
