export type FormFieldType =
  | "short_text"
  | "long_text"
  | "integer"
  | "decimal"
  | "currency"
  | "email"
  | "telephone"
  | "url"
  | "date"
  | "datetime"
  | "yes_no"
  | "radio"
  | "dropdown"
  | "multi_select"
  | "checkbox"
  | "file_upload"
  | "image_upload"
  | "complex_financial_table"
  | "complex_table";

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "is_answered"
  | "is_not_answered";

export interface IQuestionOption {
  id: string;
  value: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
}

export interface IQuestionValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternErrorMessage?: string;
  minValue?: number;
  maxValue?: number;
  decimalPlaces?: number;
  maxFileSizeMb?: number;
  allowedFileExtensions?: string[];
  allowedMimeTypes?: string[];
}

export interface IConditionalLogic {
  enabled: boolean;
  dependsOnQuestionId: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface IFormQuestion {
  id: string;
  code: string;
  number: number;
  text: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  fieldType: FormFieldType;
  defaultValue?: unknown;
  displayOrder: number;
  isRequired: boolean;
  options?: IQuestionOption[];
  validation?: IQuestionValidation;
  conditionalLogic?: IConditionalLogic;
  metadata?: Record<string, unknown>;
}

export interface IFormSection {
  id: string;
  code: string;
  title: string;
  description?: string;
  displayOrder: number;
  isCollapsed?: boolean;
  questions: IFormQuestion[];
}

export interface IQuestionnaireStats {
  totalSections: number;
  totalQuestions: number;
  requiredQuestions: number;
  optionalQuestions: number;
  conditionalQuestions: number;
}

export interface IQuestionnaireData {
  _id: string;
  title: string;
  code: string;
  formId?: string;
  slug?: string;
  category?: string;
  instructions?: string;
  isDefault?: boolean;
  description: string;
  version: string;
  versionNumber: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isPublished: boolean;
  isLocked: boolean;
  lockReason?: string;
  publishedAt?: Date | string;
  publishedBy?: any;
  createdBy?: any;
  updatedBy?: any;
  sections: IFormSection[];
  stats: IQuestionnaireStats;
  metadata?: Record<string, unknown>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IFormSummary {
  formId: string;
  code: string;
  title: string;
  description: string;
  instructions?: string;
  category: string;
  slug: string;
  status: "PUBLISHED" | "DRAFT" | "UNPUBLISHED" | "ARCHIVED";
  publishedVersion?: string;
  draftVersion?: string;
  isLocked: boolean;
  isDefault: boolean;
  stats: IQuestionnaireStats;
  submissionsCount: number;
  publicUrl: string;
  publishedAt?: string | Date;
  updatedAt?: string | Date;
  totalVersions: number;
}

export function computeQuestionnaireStats(sections: IFormSection[]): IQuestionnaireStats {
  let totalQuestions = 0;
  let requiredQuestions = 0;
  let optionalQuestions = 0;
  let conditionalQuestions = 0;

  for (const sec of sections || []) {
    for (const q of sec.questions || []) {
      totalQuestions++;
      if (q.isRequired) requiredQuestions++;
      else optionalQuestions++;
      if (q.conditionalLogic?.enabled) conditionalQuestions++;
    }
  }

  return {
    totalSections: (sections || []).length,
    totalQuestions,
    requiredQuestions,
    optionalQuestions,
    conditionalQuestions,
  };
}
