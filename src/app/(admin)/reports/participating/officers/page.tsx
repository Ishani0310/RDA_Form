"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function ParticipatingOfficersPage() {
  return (
    <ReportDirectoryView
      title="Participating Government Officers"
      subtitle="Government and provincial road officers confirmed to attend the ICDP Capacity Workshop."
      attendanceFilter="Yes"
      categoryFilter="Government Officer"
      parentPath="/reports/participating"
      parentLabel="Participating Entities"
      currentPath="/reports/participating/officers"
      activeTabKey="officers"
    />
  );
}
