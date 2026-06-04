import { describe, expect, it } from "vitest";

import type { ParsedImportRow } from "../../../src/lib/domain/imports/parseWorkbook";
import { validateImportRows } from "../../../src/lib/domain/imports/validateImportRows";

function parsed(data: Record<string, unknown>, rowNumber = 2): ParsedImportRow {
  return { rowNumber, data, raw: data };
}

describe("validateImportRows", () => {
  it("reports missing required fields before persistence", () => {
    const preview = validateImportRows("material_price", [
      parsed({ materialCode: "LF-001", price: 12 })
    ]);

    expect(preview.validRows).toHaveLength(0);
    expect(preview.errorRows[0]?.errors).toContain("specification is required");
    expect(preview.errorRows[0]?.errors).toContain("supplier is required");
  });

  it("reports unsupported units", () => {
    const preview = validateImportRows("material_price", [
      parsed({
        materialCode: "LF-001",
        materialCategory: "Lead Frame",
        materialName: "Lead Frame",
        defaultUnit: "box",
        specification: "QFN-32",
        supplier: "Supplier A",
        price: 12,
        priceUnit: "USD",
        effectiveDate: "2026-06-01"
      })
    ]);

    expect(preview.errorRows[0]?.errors).toEqual(
      expect.arrayContaining(["defaultUnit is unsupported", "priceUnit is unsupported"])
    );
  });

  it("reports invalid effective dates", () => {
    const preview = validateImportRows("material_price", [
      parsed({
        materialCode: "LF-001",
        materialCategory: "Lead Frame",
        materialName: "Lead Frame",
        defaultUnit: "K",
        specification: "QFN-32",
        supplier: "Supplier A",
        price: 12,
        priceUnit: "CNY/K",
        effectiveDate: "not-a-date"
      })
    ]);

    expect(preview.errorRows[0]?.errors).toContain("effectiveDate must be a valid date");
  });

  it("reports impossible calendar dates", () => {
    const preview = validateImportRows("material_price", [
      parsed({
        materialCode: "LF-001",
        materialCategory: "Lead Frame",
        materialName: "Lead Frame",
        defaultUnit: "K",
        specification: "QFN-32",
        supplier: "Supplier A",
        price: 12,
        priceUnit: "CNY/K",
        effectiveDate: "2026-02-31"
      })
    ]);

    expect(preview.errorRows[0]?.errors).toContain("effectiveDate must be a valid date");
  });

  it("reports invalid UPH", () => {
    const preview = validateImportRows("standard_uph", [
      parsed({ packageType: "QFN", processName: "Wire Bond", standardUph: "0" })
    ]);

    expect(preview.errorRows[0]?.errors).toContain("standardUph must be greater than 0");
  });

  it("reports duplicate material price rows", () => {
    const row = {
      materialCode: "LF-001",
      materialCategory: "Lead Frame",
      materialName: "Lead Frame",
      defaultUnit: "K",
      specification: "QFN-32",
      supplier: "Supplier A",
      price: 12,
      priceUnit: "CNY/K",
      effectiveDate: "2026-06-01"
    };
    const preview = validateImportRows("material_price", [
      parsed(row, 2),
      parsed(row, 3)
    ]);

    expect(preview.validRows).toHaveLength(1);
    expect(preview.duplicateRows).toEqual([
      {
        rowNumber: 3,
        key: "lf-001|lead frame|qfn-32|supplier a|2026-06-01",
        raw: row
      }
    ]);
  });

  it("does not mark material prices with different categories as duplicates", () => {
    const base = {
      materialCode: "MAT-001",
      materialName: "Material",
      defaultUnit: "K",
      specification: "QFN-32",
      supplier: "Supplier A",
      price: 12,
      priceUnit: "CNY/K",
      effectiveDate: "2026-06-01"
    };
    const preview = validateImportRows("material_price", [
      parsed({ ...base, materialCategory: "Lead Frame" }, 2),
      parsed({ ...base, materialCategory: "Auxiliary" }, 3)
    ]);

    expect(preview.validRows).toHaveLength(2);
    expect(preview.duplicateRows).toHaveLength(0);
  });

  it("does not let invalid rows reserve duplicate keys", () => {
    const invalid = {
      materialCode: "LF-001",
      materialCategory: "Lead Frame",
      materialName: "Lead Frame",
      defaultUnit: "bad-unit",
      specification: "QFN-32",
      supplier: "Supplier A",
      price: 12,
      priceUnit: "CNY/K",
      effectiveDate: "2026-06-01"
    };
    const valid = { ...invalid, defaultUnit: "K" };
    const preview = validateImportRows("material_price", [
      parsed(invalid, 2),
      parsed(valid, 3)
    ]);

    expect(preview.errorRows).toHaveLength(1);
    expect(preview.validRows).toHaveLength(1);
    expect(preview.duplicateRows).toHaveLength(0);
  });

  it("reports missing specification in standard usage rows", () => {
    const preview = validateImportRows("standard_usage", [
      parsed({
        packageType: "QFN",
        costGroup: "main_material",
        itemName: "Lead Frame",
        standardUsage: 1,
        usageUnit: "K",
        pricingMode: "CNY_PER_K"
      })
    ]);

    expect(preview.errorRows[0]?.errors).toContain("specification is required");
  });
});
