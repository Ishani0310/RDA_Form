import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubmission extends Document {
  submissionReference: string;
  contractor: mongoose.Types.ObjectId;
  submissionType: string;
  provincialOffice: string;
  status:
    | "Draft"
    | "Submitted"
    | "Under_Review"
    | "Verified"
    | "Action_Required"
    | "Rejected";
  isViewed: boolean;
  viewedAt?: Date;
  viewedBy?: mongoose.Types.ObjectId;
  viewedByName?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  reviewedAt?: Date;
  submittedAt?: Date;
  editRequested?: boolean;
  editRequestReason?: string;
  editRequestedAt?: Date;
  schemaVersion: string;
  formId?: string;
  formSlug?: string;
  questionnaireId?: mongoose.Types.ObjectId;
  questionnaireVersion?: string;
  /**
   * Flexible schema design: accommodates the dynamic questionnaire
   * structure when officially finalized by the RDA Planning Directorate.
   * No static questionnaire fields are invented here.
   */
  questionnaireData: Record<string, unknown>;
  attachments: Array<{
    title: string;
    fileUrl: string;
    fileType?: string;
    uploadedAt: Date;
  }>;
  isDemoRecord: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    submissionReference: {
      type: String,
      required: [true, "Submission reference number is required"],
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
    submissionType: {
      type: String,
      default: "Annual_Capacity_Declaration",
      trim: true,
    },
    provincialOffice: {
      type: String,
      required: [true, "Provincial Directorate office is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Under_Review",
        "Verified",
        "Action_Required",
        "Rejected",
      ],
      default: "Submitted",
      index: true,
    },
    isViewed: {
      type: Boolean,
      default: false,
      index: true,
    },
    viewedAt: {
      type: Date,
    },
    viewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    viewedByName: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    reviewedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      index: true,
    },
    editRequested: {
      type: Boolean,
      default: false,
      index: true,
    },
    editRequestReason: {
      type: String,
      trim: true,
    },
    editRequestedAt: {
      type: Date,
    },
    schemaVersion: {
      type: String,
      default: "1.0.0-pending-finalization",
    },
    formId: {
      type: String,
      trim: true,
      index: true,
      default: "RDA-ICDP-CONTRACTOR-Q",
    },
    formSlug: {
      type: String,
      trim: true,
      index: true,
      default: "contractor",
    },
    questionnaireId: {
      type: Schema.Types.ObjectId,
      ref: "Questionnaire",
    },
    questionnaireVersion: {
      type: String,
      trim: true,
    },
    // Dynamic container strictly preserving future official questionnaire schema
    questionnaireData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    attachments: [
      {
        title: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        fileType: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);
