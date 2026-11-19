import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQRToken extends Document {
  tokenHash: string;
  contractor: mongoose.Types.ObjectId;
  projectScope?: string;
  issuingDirectorate: string;
  issuedBy?: mongoose.Types.ObjectId;
  issuedAt: Date;
  expiresAt: Date;
  scanCount: number;
  lastScannedAt?: Date;
  status: "Active" | "Revoked" | "Expired";
  securitySignature: string;
  isDemoRecord: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QRTokenSchema = new Schema<IQRToken>(
  {
    tokenHash: {
      type: String,
      required: [true, "Unique token hash is required"],
      unique: true,
      trim: true,
      index: true,
    },
    contractor: {
      type: Schema.Types.ObjectId,
      ref: "Contractor",
      required: [true, "Contractor reference is required"],
      index: true,
    },
    projectScope: {
      type: String,
      trim: true,
    },
    issuingDirectorate: {
      type: String,
      required: [true, "Issuing provincial directorate is required"],
      trim: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      index: true,
    },
    scanCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastScannedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Revoked", "Expired"],
      default: "Active",
      index: true,
    },
    securitySignature: {
      type: String,
      required: [true, "Cryptographic tamper-proof signature is required"],
    },
    isDemoRecord: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const QRToken: Model<IQRToken> =
  mongoose.models.QRToken || mongoose.model<IQRToken>("QRToken", QRTokenSchema);
