import React from "react";
import type { Metadata } from "next";
import { HomeNavbar } from "@/components/home/HomeNavbar";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { PlatformModules } from "@/components/home/PlatformModules";
import { HowItWorks } from "@/components/home/HowItWorks";
import { DashboardPreviewSection } from "@/components/home/DashboardPreviewSection";
import { SecurityReliabilitySection } from "@/components/home/SecurityReliabilitySection";
import { BottomCtaSection } from "@/components/home/BottomCtaSection";
import { HomeFooter } from "@/components/home/HomeFooter";

export const metadata: Metadata = {
  title:
    "Contractor Data Collection System | Road Development Authority (RDA) Sri Lanka",
  description:
    "Official digital stakeholder registration and contractor management platform for the Road Development Authority (RDA) and the Inclusive Connectivity and Development Project (ICDP).",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-blue-900 selection:text-white">
      {/* 1. Official Government Top Navigation */}
      <HomeNavbar />

      {/* 2. Hero Section with Custom Dashboard Visual */}
      <main className="flex-1">
        <HeroSection />

        {/* 3. Official Trust & Institutional Status Strip */}
        <TrustStrip />

        {/* 4. What the Platform Provides (4 Feature Cards) */}
        <div id="about">
          <PlatformModules />
        </div>

        {/* 5. How It Works (4-Step Workflow Timeline) */}
        <HowItWorks />

        {/* 6. Dashboard Preview (Conceptual Administrative Preview) */}
        <DashboardPreviewSection />

        {/* 7. Institutional Security & Reliability Section (6 Pillars) */}
        <SecurityReliabilitySection />

        {/* 8. Call to Action Section */}
        <BottomCtaSection />
      </main>

      {/* 9. Government Official Footer */}
      <HomeFooter />
    </div>
  );
}
