"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  Truck,
  QrCode,
  BarChart3,
  Users2,
  Settings,
  FormInput,
  ShieldCheck,
  ExternalLink,
  X,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const navItems = [
  {
    name: "Admin Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Contractor Registry",
    href: "/contractors",
    icon: Building2,
    badge: null,
  },
  {
    name: "Data Submissions",
    href: "/submissions",
    icon: FileCheck2,
    badge: null,
  },
  {
    name: "Supplier Submissions",
    href: "/supplier-submissions",
    icon: Truck,
    badge: null,
  },
  {
    name: "QR Management",
    href: "/qr-management",
    icon: QrCode,
    badge: null,
  },
  {
    name: "Form Builder",
    href: "/form-builder",
    icon: FormInput,
    badge: "Spec",
  },
  {
    name: "Analytics & Reports",
    href: "/reports",
    icon: BarChart3,
    badge: null,
  },
  {
    name: "User Management",
    href: "/user-management",
    icon: Users2,
    badge: null,
  },
  {
    name: "System Settings",
    href: "/settings",
    icon: Settings,
    badge: null,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-gradient-to-b from-[#0b1f3a] via-[#0d274c] to-[#07172c] text-slate-100 border-r border-[#1e3c5f] shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Government Brand */}
        <div className="p-5 border-b border-[#1b3d64] bg-[#08182e]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#0b1f3a] rounded-[10px] flex items-center justify-center text-amber-400 font-extrabold text-xs tracking-wider">
                RDA
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] tracking-widest font-bold text-amber-400 uppercase">
                  Gov of Sri Lanka
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                Road Development Authority
              </h1>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[170px]">
                Contractor Data System
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header / System Status Badge */}
        <div className="px-5 py-2.5 bg-[#091e38] border-b border-[#183659] text-[11px] text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Official Portal
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
            STAGE 1: PROTOTYPE
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40 border border-blue-400/30"
                    : "text-slate-300 hover:bg-[#153457] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-amber-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-blue-900/80 text-blue-100"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </div>
              </Link>
            );
          })}
        </div>

        {/* User / Division Footer */}
        <div className="p-4 border-t border-[#1b3d64] bg-[#07172c]/90">
          <div className="p-3 rounded-xl bg-[#0e2749] border border-[#1d4474] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow">
                RDA
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Chief Engineer Office</p>
                <p className="text-[10px] text-slate-400">Planning &amp; Procurement</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" title="Connected"></span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>RDA-SL System v0.1</span>
            <span className="text-emerald-400 font-semibold">Active Portal</span>
          </div>
        </div>
      </aside>
    </>
  );
};
