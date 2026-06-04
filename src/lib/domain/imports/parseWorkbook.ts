import * as XLSX from "xlsx";

import {
  IMPORT_TEMPLATES,
  type ImportTemplateType
} from "./templates";

export type ParsedImportRow = {
  rowNumber: number;
  data: Record<string, unknown>;
  raw: Record<string, unknown>;
};

export function parseWorkbook(
  templateType: ImportTemplateType,
  workbookBytes: Buffer | Uint8Array | ArrayBuffer
): ParsedImportRow[] {
  const template = IMPORT_TEMPLATES[templateType];
  const workbook = XLSX.read(workbookBytes, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: true
  });

  return rawRows.map((raw, index) => {
    const data: Record<string, unknown> = {};

    for (const columnDefinition of Object.values(template.columns)) {
      const matchingLabel = columnDefinition.labels.find((label) =>
        Object.prototype.hasOwnProperty.call(raw, label)
      );

      if (matchingLabel) {
        data[columnDefinition.key] = raw[matchingLabel];
      }
    }

    return {
      rowNumber: index + 2,
      data,
      raw
    };
  });
}
