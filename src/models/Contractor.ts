import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContractor extends Document {
  registrationNumber: string;
  businessName: string;
  businessRegistrationNumber?: string;
  cidaGrade:
    | "CS1"
    | "CS2"
    | "C1"
    | "C2"
    | "C3"
    | "C4"
    | "C5"
    | "C6"
    | "C7"
    | "C8"
    | "C9"
    | "Specialist"
    | "Pending"
    | (string & {});
  primarySpeciality?: string;
  province:
    | "Western Province"
    | "Central Province"
    | "Southern Province"
    | "Northern Province"
    | "Eastern Province"
    | "North Western Province"
    | "North Central Province"
    | "Uva Province"
    | "Sabaragamuwa Province";
  district?: string;
  contactOfficer: {
    name?: string;
    designation?: string;
    phone?: string;
    email?: string;
  };
  status: "Draft" | "Pending_Review" | "Verified" | "Action_Required" | "Suspended";
  metadata?: Record<string, unknown>;
  isDemoRecord: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContractorSchema = new Schema<IContractor>(
  {
    registrationNumber: {
      type: String,
      required: [true, "CIDA/RDA registration number is required"],
      unique: true,
      trim: true,
      index: true,
    },
    businessName: {
      type: String,
      required: [true, "Business / Contractor company name is required"],
      trim: true,
      index: true,
    },
    businessRegistrationNumber: {
      type: String,
      trim: true,
    },
    cidaGrade: {
      type: String,
      trim: true,
      default: "Pending",
    },
    primarySpeciality: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      required: [true, "Administrative province is required"],
      enum: [
        "Western Province",
        "Central Province",
        "Southern Province",
        "Northern Province",
        "Eastern Province",
        "North Western Province",
        "North Central Province",
        "Uva Province",
        "Sabaragamuwa Province",
      ],
      index: true,
    },
    district: {
      type: String,
      trim: true,
    },
    contactOfficer: {
      name: { type: String, trim: true },
      designation: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    status: {
      type: String,
      enum: ["Draft", "Pending_Review", "Verified", "Action_Required", "Suspended"],
      default: "Draft",
      index: true,
    },
    // Flexible container for future verified fields without inventing questionnaire questions
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
    timestamps: true,
  }
);

export const Contractor: Model<IContractor> =
  mongoose.models.Contractor || mongoose.model<IContractor>("Contractor", ContractorSchema);
