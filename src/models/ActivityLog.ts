import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  performerName: string;
  performerRole?: string;
  targetType: "Contractor" | "Submission" | "QRToken" | "User" | "System" | "Other";
  targetId?: string;
  description: string;
  ipAddress?: string;
  province?: string;
  metadata?: Record<string, unknown>;
  isDemoRecord: boolean;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      required: [true, "Activity action is required"],
      trim: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    performerName: {
      type: String,
      required: [true, "Performer name is required"],
      trim: true,
    },
    performerRole: {
      type: String,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["Contractor", "Submission", "QRToken", "User", "System", "Other"],
      default: "System",
      index: true,
    },
    targetId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description of the activity log is required"],
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isDemoRecord: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
