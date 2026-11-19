"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { DemoBanner } from "../ui/DemoBanner";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell
 *
 * Dedicated admin layout shell containing:
 * - Top DemoBanner
 * - Responsive Collapsible Sidebar
 * - Top Navigation Bar (with user identity, search, notifications)
 * - Government Official Footer
 *
 * Rendered exclusively by src/app/(admin)/layout.tsx.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Banner indicating prototype/demo status */}
      <DemoBanner compact />

      <div className="flex flex-1">
        {/* Responsive Sidebar */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all duration-300">
          {/* Top Navigation */}
          <TopNav onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

          {/* Page Body */}
          <main className="flex-1 p-3.5 sm:p-5 lg:p-6 max-w-7xl w-full mx-auto space-y-4">
            {children}
          </main>

          {/* Government Official Footer */}
          <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">
                  Road Development Authority (RDA)
                </span>
                <span>•</span>
                <span>"Maganeguma Mahamedura", Denzil Kobbekaduwa Mawatha, Koswatta, Battaramulla, Sri Lanka</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Contractor Data Collection System</span>
                <span>•</span>
                <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Official Portal
                </span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
