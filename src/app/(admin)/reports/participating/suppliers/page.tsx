"use client";

import React from "react";
import ReportDirectoryView from "@/components/admin/ReportDirectoryView";

export default function ParticipatingSuppliersPage() {
  return (
    <ReportDirectoryView
      title="Participating Material Suppliers"
      subtitle="Material, equipment, and plant suppliers confirmed to attend the ICDP Capacity Workshop."
      attendanceFilter="Yes"
      categoryFilter="Supplier"
      parentPath="/reports/participating"
      parentLabel="Participating Entities"
      currentPath="/reports/participating/suppliers"
      activeTabKey="suppliers"
    />
  );
}
