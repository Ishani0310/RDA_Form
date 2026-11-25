import { connectToDatabase } from "@/lib/mongodb";
import { Notification } from "@/models/Notification";

export interface CreateNotificationParams {
  type: "SUBMISSION" | "DRAFT" | "LOGIN" | "SYSTEM";
  title: string;
  message: string;
  reference?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectToDatabase();
    return await Notification.create({
      type: params.type,
      title: params.title,
      message: params.message,
      reference: params.reference,
      link: params.link,
      metadata: params.metadata || {},
      isRead: false,
    });
  } catch (err) {
    console.error("Non-blocking notification error:", err);
    return null;
  }
}
