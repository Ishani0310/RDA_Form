"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function NotParticipatingPage() {
  return (
    <ReportDirectoryView
      title="Workshop Non-Attendees Directory (Declined / No)"
      subtitle="Entities and representatives who indicated they are unable to attend the ICDP Capacity Workshop."
      attendanceFilter="No"
      categoryFilter="all"
      parentPath="/reports"
      parentLabel="Analytics & Reports"
      currentPath="/reports/not-participating"
      activeTabKey="all"
    />
  );
}
