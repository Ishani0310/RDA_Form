"use client";

import React from "react";
import Link from "next/link";
import { PieChart, Briefcase, Truck, Landmark, ArrowUpRight } from "lucide-react";

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

interface RegistrationCategoryChartProps {
  data: CategoryBreakdownItem[];
  loading: boolean;
}

export const RegistrationCategoryChart: React.FC<RegistrationCategoryChartProps> = ({
  data,
  loading,
}) => {
  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  // SVG Donut Chart Geometry constants
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  let accumulatedOffset = 0;
  const slices = data.map((item) => {
    const fraction = totalCount > 0 ? item.count / totalCount : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += fraction * circumference;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
      fraction,
    };
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "Contractor":
        return Briefcase;
      case "Supplier":
        return Truck;
      case "Government Officer":
        return Landmark;
      default:
        return Briefcase;
    }
  };

  const getCategoryHref = (cat: string) => {
    return `/submissions?category=${encodeURIComponent(cat)}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Category Distribution
            </h3>
            <p className="text-[11px] text-slate-500">
              Stakeholder breakdown for workshop attendees
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 font-mono">
          {totalCount} Total
        </span>
      </div>

      {/* Main Body: Donut Chart on Left + Legend Table on Right */}
      <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* SVG Donut Chart */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-slate-100"
              strokeWidth="12"
              fill="transparent"
            />

            {/* Slices */}
            {totalCount > 0 ? (
              slices.map((slice) => (
                <circle
                  key={slice.category}
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={slice.color}
                  strokeWidth="12"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="butt"
                  fill="transparent"
                  className="transition-all duration-700 ease-out hover:opacity-85"
                />
              ))
            ) : (
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="12"
                strokeDasharray="4 4"
                fill="transparent"
              />
            )}
          </svg>

          {/* Center Text in Donut Hole */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            {loading ? (
              <div className="w-8 h-4 bg-slate-200 animate-pulse rounded"></div>
            ) : (
              <>
                <span className="text-xl font-black text-slate-900 tracking-tight font-mono leading-none">
                  {totalCount}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  Entities
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend Cards */}
        <div className="flex-1 w-full space-y-2">
          {data.map((item) => {
            const Icon = getCategoryIcon(item.category);
            return (
              <Link
                key={item.category}
                href={getCategoryHref(item.category)}
                className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/80 transition-all text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                    <span className="font-semibold text-slate-800 truncate">
                      {item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-slate-900">
                    {item.count}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {item.percentage}%
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-blue-900 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Insight */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Attending organizations with confirmed participation</span>
        <Link
          href="/submissions?attendance=Yes"
          className="text-blue-900 hover:underline font-semibold inline-flex items-center gap-0.5"
        >
          View All Attendees →
        </Link>
      </div>
    </div>
  );
};
