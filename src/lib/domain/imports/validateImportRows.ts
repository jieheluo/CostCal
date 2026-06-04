import {
  IMPORT_TEMPLATES,
  type ImportTemplateType
} from "./templates";
import type { ParsedImportRow } from "./parseWorkbook";

export type ValidImportRow = ParsedImportRow & {
  data: Record<string, string | number | Date>;
};

export type ImportErrorRow = {
  rowNumber: number;
  errors: string[];
  raw: Record<string, unknown>;
};

export type ImportDuplicateRow = {
  rowNumber: number;
  key: string;
  raw: Record<string, unknown>;
};

export type ImportPreview = {
  templateType: ImportTemplateType;
  validRows: ValidImportRow[];
  errorRows: ImportErrorRow[];
  duplicateRows: ImportDuplicateRow[];
};

const SUPPORTED_UNITS = new Set([
  "K",
  "CNY/K",
  "CNY/g",
  "CNY/kg",
  "g/K",
  "piece",
  "batch"
]);

const SUPPORTED_COST_GROUPS = new Set([
  "main_material",
  "auxiliary_material",
  "process_outsourced_fee",
  "overhead_allocation"
]);

const SUPPORTED_PRICING_MODES = new Set([
  "CNY_PER_K",
  "USAGE_TIMES_UNIT_PRICE",
  "SHOT_CONVERSION",
  "CNY_PER_PIECE_TO_K",
  "BATCH_TO_K",
  "MANUAL_WITH_SOURCE"
]);

export function validateImportRows(
  templateType: ImportTemplateType,
  rows: ParsedImportRow[]
): ImportPreview {
  const template = IMPORT_TEMPLATES[templateType];
  const validRows: ValidImportRow[] = [];
  const errorRows: ImportErrorRow[] = [];
  const duplicateRows: ImportDuplicateRow[] = [];
  const seenKeys = new Set<string>();

  for (const row of rows) {
    const errors: string[] = [];

    for (const column of Object.values(template.columns)) {
      if (column.required && isBlank(row.data[column.key])) {
        errors.push(`${column.key} is required`);
      }
    }

    errors.push(...validateByTemplate(templateType, row.data));

    if (errors.length > 0) {
      errorRows.push({
        rowNumber: row.rowNumber,
        errors,
        raw: row.raw
      });
      continue;
    }

    const key = template.uniqueKeyColumns
      .map((column) => normalizeKeyPart(row.data[column]))
      .join("|");

    if (key && seenKeys.has(key)) {
      duplicateRows.push({
        rowNumber: row.rowNumber,
        key,
        raw: row.raw
      });
      continue;
    }

    if (key) {
      seenKeys.add(key);
    }

    validRows.push(row as ValidImportRow);
  }

  return {
    templateType,
    validRows,
    errorRows,
    duplicateRows
  };
}

function validateByTemplate(
  templateType: ImportTemplateType,
  data: Record<string, unknown>
): string[] {
  if (templateType === "material_price") {
    return [
      ...requireNumber(data.price, "price"),
      ...requireSupportedUnit(data.defaultUnit, "defaultUnit"),
      ...requireSupportedUnit(data.priceUnit, "priceUnit"),
      ...requirePresent(data.specification, "specification"),
      ...requireDate(data.effectiveDate, "effectiveDate")
    ];
  }

  if (templateType === "standard_uph") {
    const errors = requireNumber(data.standardUph, "standardUph");
    const standardUph = Number(data.standardUph);
    if (Number.isFinite(standardUph) && standardUph <= 0) {
      errors.push("standardUph must be greater than 0");
    }
    return errors;
  }

  return [
    ...requirePresent(data.specification, "specification"),
    ...requireNumber(data.standardUsage, "standardUsage"),
    ...requireSupportedUnit(data.usageUnit, "usageUnit"),
    ...requireInSet(data.costGroup, "costGroup", SUPPORTED_COST_GROUPS),
    ...requireInSet(data.pricingMode, "pricingMode", SUPPORTED_PRICING_MODES)
  ];
}

function requirePresent(value: unknown, field: string): string[] {
  return isBlank(value) ? [`${field} is required`] : [];
}

function requireNumber(value: unknown, field: string): string[] {
  if (typeof value === "number" && Number.isFinite(value)) {
    return [];
  }

  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return [];
  }

  return [`${field} must be a number`];
}

function requireDate(value: unknown, field: string): string[] {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return [];
  }

  if (typeof value === "string" && value.trim() !== "") {
    if (isStrictIsoDate(value.trim())) {
      return [];
    }
  }

  return [`${field} must be a valid date`];
}

function isStrictIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function requireSupportedUnit(value: unknown, field: string): string[] {
  return requireInSet(value, field, SUPPORTED_UNITS);
}

function requireInSet(value: unknown, field: string, allowed: Set<string>): string[] {
  if (typeof value === "string" && allowed.has(value.trim())) {
    return [];
  }

  return [`${field} is unsupported`];
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

function normalizeKeyPart(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}
