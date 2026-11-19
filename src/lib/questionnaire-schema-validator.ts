import { IFormSection, IFormQuestion, FormFieldType } from "@/types/questionnaire";

export interface SchemaValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_FIELD_TYPES: FormFieldType[] = [
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
];

export function validateQuestionnaireSchema(sections: IFormSection[]): SchemaValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    errors.push("Questionnaire must contain at least one section.");
    return { isValid: false, errors, warnings };
  }

  const sectionCodes = new Set<string>();
  const questionCodes = new Set<string>();
  const questionIds = new Set<string>();
  const allQuestions: IFormQuestion[] = [];

  // First pass: collect IDs and check sections
  sections.forEach((section, sIdx) => {
    if (!section.title || !section.title.trim()) {
      errors.push(`Section ${sIdx + 1}: Missing section title.`);
    }

    const sCode = (section.code || "").trim().toUpperCase();
    if (!sCode) {
      errors.push(`Section "${section.title || sIdx + 1}": Section code is required.`);
    } else if (sectionCodes.has(sCode)) {
      errors.push(`Duplicate section code "${sCode}" found in Section "${section.title}".`);
    } else {
      sectionCodes.add(sCode);
    }

    if (!section.questions || !Array.isArray(section.questions) || section.questions.length === 0) {
      warnings.push(`Section "${section.title || sCode}" currently has no questions.`);
    } else {
      section.questions.forEach((q) => {
        allQuestions.push(q);
        if (q.id) questionIds.add(q.id);
      });
    }
  });

  if (allQuestions.length === 0) {
    errors.push("Questionnaire must contain at least one question.");
    return { isValid: false, errors, warnings };
  }

  // Second pass: check questions
  allQuestions.forEach((q, qIdx) => {
    const qCode = (q.code || "").trim().toUpperCase();
    if (!qCode) {
      errors.push(`Question index ${qIdx + 1} (${q.text || "Untitled"}): Question code is required.`);
    } else if (questionCodes.has(qCode)) {
      errors.push(`Duplicate question code "${qCode}" in question "${q.text}". Each question must have a unique code.`);
    } else {
      questionCodes.add(qCode);
    }

    if (!q.text || !q.text.trim()) {
      errors.push(`Question ${qCode || qIdx + 1}: Question text cannot be empty.`);
    }

    if (!q.fieldType || !VALID_FIELD_TYPES.includes(q.fieldType)) {
      errors.push(`Question ${qCode}: Invalid field type "${q.fieldType}".`);
    }

    // Choice field options verification
    if (["radio", "dropdown", "multi_select", "checkbox"].includes(q.fieldType)) {
      if (!q.options || !Array.isArray(q.options) || q.options.length === 0) {
        errors.push(`Question ${qCode} (${q.fieldType}): Requires at least one choice option.`);
      } else {
        const optionValues = new Set<string>();
        q.options.forEach((opt, oIdx) => {
          if (!opt.label || !opt.label.trim()) {
            errors.push(`Question ${qCode}: Option ${oIdx + 1} has an empty label.`);
          }
          if (!opt.value || !opt.value.trim()) {
            errors.push(`Question ${qCode}: Option ${oIdx + 1} has an empty value.`);
          } else if (optionValues.has(opt.value)) {
            errors.push(`Question ${qCode}: Duplicate option value "${opt.value}".`);
          } else {
            optionValues.add(opt.value);
          }
        });
      }
    }

    // Number validation verification
    if (["integer", "decimal", "currency"].includes(q.fieldType)) {
      if (
        q.validation?.minValue !== undefined &&
        q.validation?.maxValue !== undefined &&
        q.validation.minValue > q.validation.maxValue
      ) {
        errors.push(`Question ${qCode}: Minimum value (${q.validation.minValue}) cannot exceed maximum value (${q.validation.maxValue}).`);
      }
    }

    // Text length validation verification
    if (["short_text", "long_text", "email", "url", "telephone"].includes(q.fieldType)) {
      if (
        q.validation?.minLength !== undefined &&
        q.validation?.maxLength !== undefined &&
        q.validation.minLength > q.validation.maxLength
      ) {
        errors.push(`Question ${qCode}: Minimum length (${q.validation.minLength}) cannot exceed maximum length (${q.validation.maxLength}).`);
      }
    }

    // Conditional logic verification
    if (q.conditionalLogic?.enabled) {
      const depId = q.conditionalLogic.dependsOnQuestionId;
      if (!depId) {
        errors.push(`Question ${qCode}: Conditional logic is enabled but no target question is selected.`);
      } else if (!questionIds.has(depId)) {
        errors.push(`Question ${qCode}: Conditional rule references non-existent question "${depId}".`);
      } else if (depId === q.id) {
        errors.push(`Question ${qCode}: Cannot depend conditionally on itself.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
