"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function AllSuppliersReportPage() {
  return (
    <ReportDirectoryView
      title="Material Suppliers Master Directory"
      subtitle="Complete official registry of material, equipment, and plant suppliers."
      attendanceFilter="all"
      categoryFilter="Supplier"
      parentPath="/reports"
      parentLabel="Analytics & Reports"
      currentPath="/reports/suppliers"
      activeTabKey="suppliers"
    />
  );
}
