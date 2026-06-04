export type ExportableCostResult = {
  id: string;
  project: {
    productName: string;
    version: string;
    packageType: {
      packageName: string;
    };
  };
  version: string;
  mainMaterialCostK: number;
  auxiliaryMaterialCostK: number;
  processFeeCostK: number;
  overheadCostK: number;
  totalCostK: number;
  formulaVersion: string;
  inputSnapshot: string;
  priceSnapshot: string;
  importBatchSnapshot: string;
  calculatedAt: Date;
};

export function parseSnapshot<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function demoExportResult(id: string): ExportableCostResult {
  return {
    id,
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
          supplierName: "Alternative Supplier",
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
        supplierPriceId: "demo-price",
        supplierName: "Alternative Supplier",
        price: 120,
        priceUnit: "CNY/K"
      }
    ]),
    importBatchSnapshot: JSON.stringify([{ importBatchId: "demo-batch" }]),
    calculatedAt: new Date("2026-06-05T00:00:00.000Z")
  };
}
