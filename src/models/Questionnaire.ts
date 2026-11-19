import mongoose, { Schema, Document, Model } from "mongoose";
import {
  FormFieldType,
  ConditionOperator,
  IQuestionOption,
  IQuestionValidation,
  IConditionalLogic,
  IFormQuestion,
  IFormSection,
  IQuestionnaireStats,
  IQuestionnaireData,
  IFormSummary,
} from "@/types/questionnaire";

export type {
  FormFieldType,
  ConditionOperator,
  IQuestionOption,
  IQuestionValidation,
  IConditionalLogic,
  IFormQuestion,
  IFormSection,
  IQuestionnaireStats,
  IQuestionnaireData,
  IFormSummary,
};

export { computeQuestionnaireStats } from "@/types/questionnaire";

export interface IQuestionnaire extends Document, Omit<IQuestionnaireData, "_id"> {
  _id: mongoose.Types.ObjectId;
}

const QuestionOptionSchema = new Schema<IQuestionOption>(
  {
    id: { type: String, required: true },
    value: { type: String, required: true },
    label: { type: String, required: true },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const QuestionValidationSchema = new Schema<IQuestionValidation>(
  {
    minLength: { type: Number },
    maxLength: { type: Number },
    pattern: { type: String },
    patternErrorMessage: { type: String },
    minValue: { type: Number },
    maxValue: { type: Number },
    decimalPlaces: { type: Number },
    maxFileSizeMb: { type: Number },
    allowedFileExtensions: [{ type: String }],
    allowedMimeTypes: [{ type: String }],
  },
  { _id: false }
);

const ConditionalLogicSchema = new Schema<IConditionalLogic>(
  {
    enabled: { type: Boolean, default: false },
    dependsOnQuestionId: { type: String, default: "" },
    operator: {
      type: String,
      enum: [
        "equals",
        "not_equals",
        "contains",
        "greater_than",
        "less_than",
        "is_answered",
        "is_not_answered",
      ],
      default: "equals",
    },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const FormQuestionSchema = new Schema<IFormQuestion>(
  {
    id: { type: String, required: true },
    code: { type: String, required: true },
    number: { type: Number, default: 1 },
    text: { type: String, required: true },
    description: { type: String },
    helpText: { type: String },
    placeholder: { type: String },
    fieldType: {
      type: String,
      enum: [
        "short_text",
        "long_text",
        "integer",
        "decimal",
        "currency",
        "email",
        "telephone",
        "url",
        "date",
        "datetime",
        "yes_no",
        "radio",
        "dropdown",
        "multi_select",
        "checkbox",
        "file_upload",
        "image_upload",
        "complex_financial_table",
        "complex_table",
      ],
      default: "short_text",
    },
    defaultValue: { type: Schema.Types.Mixed },
    displayOrder: { type: Number, default: 0 },
    isRequired: { type: Boolean, default: false },
    options: [QuestionOptionSchema],
    validation: QuestionValidationSchema,
    conditionalLogic: ConditionalLogicSchema,
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const FormSectionSchema = new Schema<IFormSection>(
  {
    id: { type: String, required: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    displayOrder: { type: Number, default: 0 },
    isCollapsed: { type: Boolean, default: false },
    questions: [FormQuestionSchema],
  },
  { _id: false }
);

const QuestionnaireSchema = new Schema<IQuestionnaire>(
  {
    title: {
      type: String,
      required: [true, "Questionnaire title is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Questionnaire code is required"],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      index: true,
      default: "contractor",
    },
    category: {
      type: String,
      trim: true,
      default: "Contractor",
      index: true,
    },
    instructions: {
      type: String,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    version: {
      type: String,
      required: true,
      default: "1.0",
    },
    versionNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockReason: {
      type: String,
      default: "",
    },
    publishedAt: {
      type: Date,
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    sections: [FormSectionSchema],
    stats: {
      totalSections: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      requiredQuestions: { type: Number, default: 0 },
      optionalQuestions: { type: Number, default: 0 },
      conditionalQuestions: { type: Number, default: 0 },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

QuestionnaireSchema.index({ code: 1, version: 1 }, { unique: true });

export const Questionnaire: Model<IQuestionnaire> =
  mongoose.models.Questionnaire ||
  mongoose.model<IQuestionnaire>("Questionnaire", QuestionnaireSchema);
