"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function AllOfficersReportPage() {
  return (
    <ReportDirectoryView
      title="Government Officers Master Directory"
      subtitle="Complete official directory of participating government and road authority officers."
      attendanceFilter="all"
      categoryFilter="Government Officer"
      parentPath="/reports"
      parentLabel="Analytics & Reports"
      currentPath="/reports/officers"
      activeTabKey="officers"
    />
  );
}
