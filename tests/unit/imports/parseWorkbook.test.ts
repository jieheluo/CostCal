import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";

import { parseWorkbook } from "../../../src/lib/domain/imports/parseWorkbook";

function workbookBuffer(rows: Record<string, unknown>[]) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

describe("parseWorkbook", () => {
  it("maps English material price columns to canonical row keys", () => {
    const rows = parseWorkbook("material_price", workbookBuffer([
      {
        "Material Code": "LF-001",
        "Material Category": "Lead Frame",
        "Material Name": "Lead Frame A",
        "Default Unit": "K",
        Specification: "QFN-32",
        Supplier: "Supplier A",
        Price: 12.5,
        "Price Unit": "CNY/K",
        "Effective Date": "2026-06-01"
      }
    ]));

    expect(rows).toEqual([
      {
        rowNumber: 2,
        data: {
          materialCode: "LF-001",
          materialCategory: "Lead Frame",
          materialName: "Lead Frame A",
          defaultUnit: "K",
          specification: "QFN-32",
          supplier: "Supplier A",
          price: 12.5,
          priceUnit: "CNY/K",
          effectiveDate: "2026-06-01"
        },
        raw: expect.any(Object)
      }
    ]);
  });

  it("maps Chinese standard UPH columns to canonical row keys", () => {
    const rows = parseWorkbook("standard_uph", workbookBuffer([
      {
        "\u5c01\u88c5\u7c7b\u578b": "QFN",
        "\u5de5\u5e8f": "Wire Bond",
        "\u6807\u51c6UPH": 1500
      }
    ]));

    expect(rows[0]?.data).toEqual({
      packageType: "QFN",
      processName: "Wire Bond",
      standardUph: 1500
    });
  });

  it("maps standard usage columns to canonical row keys", () => {
    const rows = parseWorkbook("standard_usage", workbookBuffer([
      {
        "Package Type": "QFN",
        "Cost Group": "main_material",
        "Item Name": "Lead Frame",
        "Material Code": "LF-001",
        Specification: "QFN-32",
        "Standard Usage": 1,
        "Usage Unit": "K",
        "Pricing Mode": "CNY_PER_K"
      }
    ]));

    expect(rows[0]?.data).toEqual({
      packageType: "QFN",
      costGroup: "main_material",
      itemName: "Lead Frame",
      materialCode: "LF-001",
      specification: "QFN-32",
      standardUsage: 1,
      usageUnit: "K",
      pricingMode: "CNY_PER_K"
    });
  });
});
