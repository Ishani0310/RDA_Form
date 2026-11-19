import React from "react";
import { MapPin, Award, Inbox } from "lucide-react";
import { INITIAL_PROVINCIAL_DISTRIBUTION, INITIAL_GRADE_BREAKDOWN } from "@/data/demoData";

export const ContractorDistribution: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Provincial Representation */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-900">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Provincial Distribution (Sri Lanka)
              </h3>
              <p className="text-xs text-slate-500">
                Contractors registered across 9 Administrative Provinces
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1">
          {INITIAL_PROVINCIAL_DISTRIBUTION.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
              <Inbox className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">No provincial distribution data available yet</p>
              <span className="text-[11px] text-slate-400">Data will populate automatically as contractors register</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {INITIAL_PROVINCIAL_DISTRIBUTION.map((item) => (
                <div key={item.province} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.province}</span>
                    <span className="text-slate-500 font-semibold">
                      {item.registeredCount} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-700 to-blue-500 transition-all duration-500"
                      style={{ width: `${item.percentage * 2.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Source: RDA Provincial Directorate Registry</span>
          <span>Live Directory</span>
        </div>
      </div>

      {/* CIDA Technical Grading Breakdown */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-900">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                CIDA Technical Grading Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                National classification from CS1/C1 to Specialist
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex-1">
          {INITIAL_GRADE_BREAKDOWN.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl">
              <Award className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-medium">No grade breakdown data available yet</p>
              <span className="text-[11px] text-slate-400">Classifications will display upon contractor intake</span>
            </div>
          ) : (
            <div className="space-y-3">
              {INITIAL_GRADE_BREAKDOWN.map((grade) => (
                <div
                  key={grade.grade}
                  className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-extrabold text-blue-950 text-xs w-16">
                      {grade.grade}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {grade.description}
                    </span>
                  </div>
                  <span className="font-bold text-xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {grade.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Standards: Construction Industry Development Authority</span>
          <span>Gazetted Grades</span>
        </div>
      </div>
    </div>
  );
};
