import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDraftToken extends Document {
  tokenHash: string;
  contractor: mongoose.Types.ObjectId;
  submission: mongoose.Types.ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DraftTokenSchema = new Schema<IDraftToken>(
  {
    tokenHash: {
      type: String,
      required: [true, "Cryptographic token hash is required"],
      unique: true,
      trim: true,
      index: true,
    },
    contractor: {
      type: Schema.Types.ObjectId,
      ref: "Contractor",
      required: [true, "Associated contractor reference is required"],
      index: true,
    },
    submission: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      required: [true, "Associated submission reference is required"],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration timestamp is required"],
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DraftToken: Model<IDraftToken> =
  mongoose.models.DraftToken || mongoose.model<IDraftToken>("DraftToken", DraftTokenSchema);
