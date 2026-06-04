import type { CostGroup } from "@prisma/client";

import {
  calculatePricingModeCostK,
  type PricingModeInput
} from "./pricingModes";
import { roundCost } from "./units";

export type EstimateCostItem = PricingModeInput & {
  id: string;
  costGroup: CostGroup | string;
  itemName: string;
};

export type CostEstimate = {
  mainMaterialCostK: number;
  auxiliaryMaterialCostK: number;
  processFeeCostK: number;
  overheadCostK: number;
  totalCostK: number;
  blockingIssues: string[];
};

export function calculateEstimate(items: EstimateCostItem[]): CostEstimate {
  const estimate: CostEstimate = {
    mainMaterialCostK: 0,
    auxiliaryMaterialCostK: 0,
    processFeeCostK: 0,
    overheadCostK: 0,
    totalCostK: 0,
    blockingIssues: []
  };

  for (const item of items) {
    const result = calculatePricingModeCostK(item);
    if (result.issues.length > 0) {
      estimate.blockingIssues.push(
        ...result.issues.map((issue) => `${item.itemName}: ${issue}`)
      );
      continue;
    }

    addCostToGroup(estimate, item.costGroup, result.costK);
  }

  estimate.mainMaterialCostK = roundCost(estimate.mainMaterialCostK);
  estimate.auxiliaryMaterialCostK = roundCost(estimate.auxiliaryMaterialCostK);
  estimate.processFeeCostK = roundCost(estimate.processFeeCostK);
  estimate.overheadCostK = roundCost(estimate.overheadCostK);
  estimate.totalCostK = roundCost(
    estimate.mainMaterialCostK
      + estimate.auxiliaryMaterialCostK
      + estimate.processFeeCostK
      + estimate.overheadCostK
  );

  return estimate;
}

function addCostToGroup(estimate: CostEstimate, costGroup: CostGroup | string, costK: number) {
  if (costGroup === "main_material") {
    estimate.mainMaterialCostK += costK;
  } else if (costGroup === "auxiliary_material") {
    estimate.auxiliaryMaterialCostK += costK;
  } else if (costGroup === "process_outsourced_fee") {
    estimate.processFeeCostK += costK;
  } else if (costGroup === "overhead_allocation") {
    estimate.overheadCostK += costK;
  } else {
    estimate.blockingIssues.push(`Unsupported cost group: ${costGroup}.`);
  }
}
