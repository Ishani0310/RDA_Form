import React from "react";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Admin Route Group Layout
 *
 * Wraps all authenticated administrative pages in the full RDA AppShell:
 * - Admin Sidebar
 * - Top Navigation Bar (with user identity & notifications)
 * - Prototype Demo Banner
 * - Government Official Footer
 *
 * This layout ONLY applies to routes inside the (admin) route group:
 * - / (redirects to /dashboard)
 * - /dashboard
 * - /contractors
 * - /submissions
 * - /qr-management
 * - /form-builder
 * - /reports
 * - /user-management
 * - /settings
 *
 * The (auth) route group (/login) is completely isolated outside of this layout.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
