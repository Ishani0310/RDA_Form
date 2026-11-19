import { connectToDatabase } from "@/lib/mongodb";
import { ActivityLog } from "@/models/ActivityLog";
import type { OfficerSessionPayload } from "@/lib/session";

export interface LogActivityParams {
  action: string;
  session?: OfficerSessionPayload | null;
  performerName?: string;
  performerRole?: string;
  targetType: "Contractor" | "Submission" | "QRToken" | "User" | "System" | "Other";
  targetId?: string;
  description: string;
  province?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Government Audit Logger
 * Records tamper-evident administrative events into the ActivityLog collection.
 * 
 * Safety:
 * - Operates safely across Edge/Node transitions
 * - Non-blocking: failures are logged without crashing critical user workflows
 */
export async function recordActivityLog(params: LogActivityParams): Promise<void> {
  try {
    if (!process.env.MONGODB_URI) return;
    await connectToDatabase();

    const performerName = params.performerName || params.session?.fullName || "System Process";
    const performerRole = params.performerRole || params.session?.role || "SYSTEM";
    const performerId =
      params.session?.userId && !params.session.userId.startsWith("DEMO-")
        ? params.session.userId
        : undefined;

    await ActivityLog.create({
      action: params.action,
      performedBy: performerId,
      performerName,
      performerRole,
      targetType: params.targetType,
      targetId: params.targetId,
      description: params.description,
      ipAddress: params.ipAddress || "server-action",
      province: params.province || params.session?.assignedProvince || "National HQ",
      metadata: params.metadata || {},
      isDemoRecord: Boolean(params.session?.isDemoSession),
    });
  } catch (err: unknown) {
    console.error("Audit trail write error:", err instanceof Error ? err.message : err);
  }
}
