"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function ParticipatingContractorsPage() {
  return (
    <ReportDirectoryView
      title="Participating Civil Contractors"
      subtitle="Civil construction contractors confirmed to attend the ICDP Capacity Workshop."
      attendanceFilter="Yes"
      categoryFilter="Contractor"
      parentPath="/reports/participating"
      parentLabel="Participating Entities"
      currentPath="/reports/participating/contractors"
      activeTabKey="contractors"
    />
  );
}
