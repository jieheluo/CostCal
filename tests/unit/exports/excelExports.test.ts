import { read } from "xlsx";
import { describe, expect, it } from "vitest";

import { buildInternalDetailExcel } from "../../../src/lib/domain/exports/internalDetailExcel";
import { buildSimplifiedQuotationExcel } from "../../../src/lib/domain/exports/simplifiedQuotationExcel";
import { assertFormalResultExists } from "../../../src/lib/domain/exports/exportGuards";

describe("excel exports", () => {
  it("builds internal detail with cost items, snapshots, sources, and formula version", () => {
    const workbook = read(buildInternalDetailExcel(sampleResult()), { type: "buffer" });

    expect(workbook.SheetNames).toEqual([
      "Summary",
      "Cost Items",
      "Snapshots",
      "Import Sources"
    ]);

    const costItems = workbook.Sheets["Cost Items"];
    expect(costItems.A2?.v).toBe("main_material");
    expect(costItems.B2?.v).toBe("Lead Frame");
    expect(costItems.C2?.v).toBe("QFN-32");
    expect(costItems.D2?.v).toBe("Supplier A");
    expect(costItems.G2?.v).toBe("CNY_PER_K");

    const summary = workbook.Sheets.Summary;
    expect(summary.B2?.v).toBe("cost-engine-v1");
    expect(summary.B8?.v).toBe(193);
  });

  it("builds simplified quotation without internal cost breakdown or supplier prices", () => {
    const workbook = read(buildSimplifiedQuotationExcel({
      result: sampleResult(),
      targetGrossMargin: 0.25,
      quotationDate: "2026-06-05"
    }), { type: "buffer" });

    expect(workbook.SheetNames).toEqual(["Quotation"]);
    expect(workbook.Sheets.Quotation.A1?.v).toBe("Product");
    expect(workbook.Sheets.Quotation.B5?.v).toBe(257.333333);
    expect(JSON.stringify(workbook.Sheets)).not.toContain("Supplier A");
    expect(JSON.stringify(workbook.Sheets)).not.toContain("Lead Frame");
  });

  it("rejects export when no formal result exists", () => {
    expect(() => assertFormalResultExists(null)).toThrow("Formal result is required for export.");
  });
});

function sampleResult() {
  return {
    id: "result-1",
    project: {
      productName: "QFN Demo Product",
      version: "A",
      packageType: { packageName: "QFN" }
    },
    version: "v1",
    mainMaterialCostK: 120,
    auxiliaryMaterialCostK: 3,
    processFeeCostK: 20,
    overheadCostK: 50,
    totalCostK: 193,
    formulaVersion: "cost-engine-v1",
    inputSnapshot: JSON.stringify({
      costItems: [
        {
          costGroup: "main_material",
          itemName: "Lead Frame",
          specificationName: "QFN-32",
          supplierName: "Supplier A",
          usage: 1,
          usageUnit: "K",
          price: 120,
          priceUnit: "CNY/K",
          pricingMode: "CNY_PER_K"
        }
      ]
    }),
    priceSnapshot: JSON.stringify([
      {
        supplierPriceId: "price-1",
        supplierName: "Supplier A",
        price: 120,
        priceUnit: "CNY/K"
      }
    ]),
    importBatchSnapshot: JSON.stringify([{ importBatchId: "batch-1" }]),
    calculatedAt: new Date("2026-06-05T00:00:00.000Z")
  };
}
