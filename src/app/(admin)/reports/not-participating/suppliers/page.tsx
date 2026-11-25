"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function NotParticipatingSuppliersPage() {
  return (
    <ReportDirectoryView
      title="Non-Participating Material Suppliers"
      subtitle="Material suppliers who indicated they cannot participate in the workshop."
      attendanceFilter="No"
      categoryFilter="Supplier"
      parentPath="/reports/not-participating"
      parentLabel="Non-Attendees Directory"
      currentPath="/reports/not-participating/suppliers"
      activeTabKey="suppliers"
    />
  );
}
