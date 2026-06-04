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
