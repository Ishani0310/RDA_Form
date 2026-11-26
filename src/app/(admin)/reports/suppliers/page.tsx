"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function AllSuppliersReportPage() {
  return (
    <ReportDirectoryView
      title="Supplier Submissions"
      subtitle="Complete official registry of material, equipment, and plant supplier submissions."
      attendanceFilter="all"
      categoryFilter="Supplier"
      parentPath="/submissions"
      parentLabel="Data Submissions"
      currentPath="/reports/suppliers"
      activeTabKey="suppliers"
    />
  );
}
