"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  LogOut,
  Shield,
  User,
} from "lucide-react";

interface TopNavProps {
  onToggleSidebar: () => void;
}

interface CurrentOfficer {
  fullName: string;
  email: string;
  designation: string;
  role: string;
  assignedProvince: string;
  rdaStaffId: string;
  isDemoSession?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [officer, setOfficer] = useState<CurrentOfficer>({
    fullName: "RDA Officer",
    email: "",
    designation: "Administrative Console",
    role: "OFFICER",
    assignedProvince: "Sri Lanka",
    rdaStaffId: "",
    isDemoSession: false,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.officer) {
          setOfficer(data.officer);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-all">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-blue-900 tracking-wide uppercase">
                Road Development Authority
              </span>
              <span className="text-sm font-bold text-slate-800">
                Contractor Data Collection System
              </span>
            </div>
            <span className="inline-flex sm:hidden text-xs font-bold text-blue-950">
              RDA Portal
            </span>
          </div>

          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Official Session
          </span>
        </div>

        {/* Center: Search (Desktop) */}
        <div className="hidden xl:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contractor, CIDA grade, or submission ref..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right: Actions, Alerts, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Calendar / Date */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded-lg border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Sri Lanka (GMT+5:30)</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">RDA System Alerts</span>
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                    SAMPLE NOTICES
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="p-3 hover:bg-slate-50">
                    <p className="font-semibold text-slate-800">
                      Official Questionnaire Pending
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      The questionnaire formulation committee has convened. Question fields are locked from user editing.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">10 mins ago</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50">
                    <p className="font-semibold text-slate-800">
                      Officer Portal Session Active
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Authenticated as {officer.fullName} ({officer.role.replace("_", " ")}).
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Just now</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 p-1 pl-2 sm:pl-2.5 pr-2 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-900 to-blue-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                RDA
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-800 leading-none">
                  {officer.fullName}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {officer.role.replace("_", " ")}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{officer.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{officer.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-800 rounded font-semibold text-[10px]">
                      {officer.role}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium text-[10px]">
                      {officer.rdaStaffId}
                    </span>
                  </div>
                </div>
                <div className="py-1">
                  <div className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 cursor-pointer flex items-center justify-between">
                    <span>Assigned Directorate:</span>
                    <span className="font-medium text-slate-800 text-[11px]">
                      {officer.assignedProvince.split(" ")[0]}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 cursor-pointer font-medium flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out (Terminate Session)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
