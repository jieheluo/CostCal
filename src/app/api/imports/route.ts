import { NextResponse } from "next/server";

import { parseWorkbook } from "@/lib/domain/imports/parseWorkbook";
import { persistImportBatch } from "@/lib/domain/imports/persistImportBatch";
import {
  validateImportRows,
  type ImportPreview
} from "@/lib/domain/imports/validateImportRows";
import {
  IMPORT_TEMPLATES,
  type ImportTemplateType
} from "@/lib/domain/imports/templates";

type ImportRequest = {
  action?: "preview" | "confirm";
  templateType?: ImportTemplateType;
  fileName?: string;
  workbookBase64?: string;
  importedById?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ImportRequest;

  if (!body.templateType || !IMPORT_TEMPLATES[body.templateType]) {
    return NextResponse.json({ error: "Unsupported templateType" }, { status: 400 });
  }

  if (!body.workbookBase64) {
    return NextResponse.json({ error: "workbookBase64 is required" }, { status: 400 });
  }

  const workbookBytes = Buffer.from(body.workbookBase64, "base64");
  const rows = parseWorkbook(body.templateType, workbookBytes);
  const preview = validateImportRows(body.templateType, rows);

  if (body.action !== "confirm") {
    return NextResponse.json(preview);
  }

  if (!body.importedById) {
    return NextResponse.json({ error: "importedById is required for confirm" }, { status: 400 });
  }

  if (preview.errorRows.length > 0 || preview.duplicateRows.length > 0) {
    return NextResponse.json(
      { error: "Import has validation issues", preview },
      { status: 422 }
    );
  }

  const batch = await persistImportBatch({
    templateType: body.templateType,
    fileName: body.fileName ?? "uploaded.xlsx",
    importedById: body.importedById,
    validRows: preview.validRows,
    failedRowCount: preview.errorRows.length
  });

  return NextResponse.json({ batch, preview } satisfies {
    batch: unknown;
    preview: ImportPreview;
  });
}
