"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function NotParticipatingContractorsPage() {
  return (
    <ReportDirectoryView
      title="Non-Participating Civil Contractors"
      subtitle="Civil contractors who indicated they cannot participate in the workshop."
      attendanceFilter="No"
      categoryFilter="Contractor"
      parentPath="/reports/not-participating"
      parentLabel="Non-Attendees Directory"
      currentPath="/reports/not-participating/contractors"
      activeTabKey="contractors"
    />
  );
}
