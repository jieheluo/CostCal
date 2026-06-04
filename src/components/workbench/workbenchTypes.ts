import type { CostGroup, PricingMode } from "@prisma/client";

export type WorkbenchCostItem = {
  id: string;
  costGroup: CostGroup;
  itemName: string;
  pricingMode: PricingMode;
  price: number;
  priceUnit: string;
  usage?: number;
  usageUnit?: string;
  batchOutputK?: number;
  piecesPerShot?: number;
  supplierName?: string;
  sourceNote?: string;
};

export type WorkbenchEstimate = {
  mainMaterialCostK: number;
  auxiliaryMaterialCostK: number;
  processFeeCostK: number;
  overheadCostK: number;
  totalCostK: number;
  blockingIssues: string[];
};
