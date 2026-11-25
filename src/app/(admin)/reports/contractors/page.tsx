"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function AllContractorsReportPage() {
  return (
    <ReportDirectoryView
      title="Civil Contractors Master Directory"
      subtitle="Complete official registry of registered and verified civil contractors."
      attendanceFilter="all"
      categoryFilter="Contractor"
      parentPath="/reports"
      parentLabel="Analytics & Reports"
      currentPath="/reports/contractors"
      activeTabKey="contractors"
    />
  );
}
