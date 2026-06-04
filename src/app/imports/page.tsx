"use client";

import { useState } from "react";

import { IMPORT_TEMPLATES, type ImportTemplateType } from "@/lib/domain/imports/templates";
import type { ImportPreview } from "@/lib/domain/imports/validateImportRows";

export default function ImportsPage() {
  const [templateType, setTemplateType] = useState<ImportTemplateType>("material_price");
  const [file, setFile] = useState<File | null>(null);
  const [importedById, setImportedById] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState<string>("");

  async function submit(action: "preview" | "confirm") {
    if (!file) {
      setMessage("Select an Excel file first.");
      return;
    }

    if (action === "confirm" && importedById.trim() === "") {
      setMessage("Enter the importing user ID before confirming.");
      return;
    }

    const workbookBase64 = await fileToBase64(file);
    const response = await fetch("/api/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        templateType,
        fileName: file.name,
        workbookBase64,
        importedById: importedById.trim() || undefined
      })
    });
    const result = await response.json();

    if (!response.ok) {
      setPreview(result.preview ?? null);
      setMessage(result.error ?? "Import failed.");
      return;
    }

    setPreview(result.preview ?? result);
    setMessage(action === "confirm" ? "Import confirmed." : "Preview ready.");
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 32 }}>
      <h1>Import Data</h1>
      <section style={{ display: "grid", gap: 16 }}>
        <label>
          Template
          <select
            value={templateType}
            onChange={(event) => setTemplateType(event.target.value as ImportTemplateType)}
          >
            {Object.keys(IMPORT_TEMPLATES).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          Imported by user ID
          <input
            type="text"
            value={importedById}
            onChange={(event) => setImportedById(event.target.value)}
            placeholder="Existing user ID"
          />
        </label>

        <label>
          Excel file
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => submit("preview")}>
            Preview
          </button>
          <button
            type="button"
            disabled={!preview || preview.errorRows.length > 0 || preview.duplicateRows.length > 0}
            onClick={() => submit("confirm")}
          >
            Confirm Import
          </button>
        </div>
      </section>

      {message ? <p>{message}</p> : null}
      {preview ? <PreviewTable preview={preview} /> : null}
    </main>
  );
}

function PreviewTable({ preview }: { preview: ImportPreview }) {
  return (
    <section>
      <h2>Preview</h2>
      <p>
        Valid rows: {preview.validRows.length} | Error rows: {preview.errorRows.length} |
        Duplicate rows: {preview.duplicateRows.length}
      </p>

      {preview.errorRows.length > 0 ? (
        <>
          <h3>Errors</h3>
          <table>
            <tbody>
              {preview.errorRows.map((row) => (
                <tr key={row.rowNumber}>
                  <td>Row {row.rowNumber}</td>
                  <td>{row.errors.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      {preview.duplicateRows.length > 0 ? (
        <>
          <h3>Duplicates</h3>
          <table>
            <tbody>
              {preview.duplicateRows.map((row) => (
                <tr key={`${row.rowNumber}-${row.key}`}>
                  <td>Row {row.rowNumber}</td>
                  <td>{row.key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(file);
  });
}
