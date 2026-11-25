"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function ParticipatingPage() {
  return (
    <ReportDirectoryView
      title="Workshop Confirmed Attendees (Yes)"
      subtitle="Entities and representatives who have confirmed participation in the ICDP Capacity Workshop."
      attendanceFilter="Yes"
      categoryFilter="all"
      parentPath="/reports"
      parentLabel="Analytics & Reports"
      currentPath="/reports/participating"
      activeTabKey="all"
    />
  );
}
