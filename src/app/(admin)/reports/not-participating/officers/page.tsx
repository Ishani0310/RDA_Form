"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function NotParticipatingOfficersPage() {
  return (
    <ReportDirectoryView
      title="Non-Participating Government Officers"
      subtitle="Government officers who indicated they cannot participate in the workshop."
      attendanceFilter="No"
      categoryFilter="Government Officer"
      parentPath="/reports/not-participating"
      parentLabel="Non-Attendees Directory"
      currentPath="/reports/not-participating/officers"
      activeTabKey="officers"
    />
  );
}
