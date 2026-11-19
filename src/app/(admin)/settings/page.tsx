import React from "react";
import { Settings, Shield, Bell, Database, Globe, Building, Check, Server } from "lucide-react";
import { DemoBanner } from "@/components/ui/DemoBanner";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-900" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              System Settings &amp; Configuration
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Global operational parameters, security profiles, and provincial network settings for the RDA contractor portal.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization & Jurisdiction */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-900 pb-2 border-b border-slate-100">
            <Building className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-800">
              Authority Identification
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Parent Ministry
              </label>
              <input
                type="text"
                disabled
                defaultValue="Ministry of Transport and Highways"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Statutory Body
              </label>
              <input
                type="text"
                disabled
                defaultValue="Road Development Authority (RDA)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Headquarters
              </label>
              <input
                type="text"
                disabled
                defaultValue="Maganeguma Mahamedura, Koswatta, Battaramulla"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Portal & Regional Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-900 pb-2 border-b border-slate-100">
            <Globe className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-800">
              Regional &amp; Localization
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Standard Time Zone
              </label>
              <input
                type="text"
                disabled
                defaultValue="Asia/Colombo (Sri Lanka Standard Time UTC+05:30)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Supported Official Languages
              </label>
              <input
                type="text"
                disabled
                defaultValue="English, Sinhala (සිංහල), Tamil (தமிழ்)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Currency Base
              </label>
              <input
                type="text"
                disabled
                defaultValue="Sri Lankan Rupee (LKR / රු.)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Security & Audit Policies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-900 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-800">
              Security &amp; Audit Trail
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Government SMS Dispatch Gateway
              </label>
              <input
                type="text"
                disabled
                defaultValue="Lanka Government Network (LGN / LankaGate)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Session Inactivity Timeout
              </label>
              <input
                type="text"
                disabled
                defaultValue="15 Minutes (Mandatory Government Standard)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Audit Record Retention
              </label>
              <input
                type="text"
                disabled
                defaultValue="7 Years (Public Procurement Compliance)"
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
