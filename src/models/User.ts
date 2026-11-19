import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  designation?: string;
  role:
    | "SUPER_ADMIN"
    | "PROVINCIAL_DIRECTOR"
    | "EXECUTIVE_ENGINEER"
    | "INSPECTION_OFFICER"
    | "AUDITOR";
  assignedProvince: string;
  rdaStaffId?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  isDemoRecord: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Official email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "PROVINCIAL_DIRECTOR",
        "EXECUTIVE_ENGINEER",
        "INSPECTION_OFFICER",
        "AUDITOR",
      ],
      default: "EXECUTIVE_ENGINEER",
      index: true,
    },
    assignedProvince: {
      type: String,
      default: "Western Province",
      trim: true,
    },
    rdaStaffId: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    isDemoRecord: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
