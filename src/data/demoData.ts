/**
 * System Data Structures & Default Initial State
 * Road Development Authority, Sri Lanka
 * 
 * All mock/sample records have been removed.
 * Default values reflect a clean, unpopulated production-ready state.
 */

export interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  subtitle: string;
}

export const INITIAL_DASHBOARD_STATS: StatCard[] = [
  {
    title: "Registered Contractors",
    value: "0",
    change: "0 this month",
    changeType: "neutral",
    subtitle: "Total active CIDA-graded contractors in registry",
  },
  {
    title: "Submissions Received",
    value: "0",
    change: "0 this week",
    changeType: "neutral",
    subtitle: "Electronic questionnaire filings collected",
  },
  {
    title: "Pending RDA Verification",
    value: "0",
    change: "None pending",
    changeType: "neutral",
    subtitle: "Awaiting Provincial Chief Engineer review",
  },
  {
    title: "Active QR Portals Issued",
    value: "0",
    change: "0 active",
    changeType: "neutral",
    subtitle: "Secure site-access QR codes deployed",
  },
];

// Backwards-compatibility alias for components
export const DEMO_DASHBOARD_STATS = INITIAL_DASHBOARD_STATS;

export interface RecentActivityItem {
  id: string;
  contractorName: string;
  regNumber: string;
  grade: string;
  province: string;
  action: string;
  timestamp: string;
  status: "Verified" | "Under Review" | "Action Required" | "Draft";
}

export const INITIAL_RECENT_ACTIVITY: RecentActivityItem[] = [];
export const DEMO_RECENT_ACTIVITY = INITIAL_RECENT_ACTIVITY;

export interface ProvincialDistributionItem {
  province: string;
  registeredCount: number;
  percentage: number;
}

export const INITIAL_PROVINCIAL_DISTRIBUTION: ProvincialDistributionItem[] = [];
export const DEMO_PROVINCIAL_DISTRIBUTION = INITIAL_PROVINCIAL_DISTRIBUTION;

export interface GradeSummaryItem {
  grade: string;
  description: string;
  count: number;
}

export const INITIAL_GRADE_BREAKDOWN: GradeSummaryItem[] = [];
export const DEMO_GRADE_BREAKDOWN = INITIAL_GRADE_BREAKDOWN;
