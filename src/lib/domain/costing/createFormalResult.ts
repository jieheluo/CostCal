import type { Prisma } from "@prisma/client";

import {
  calculateEstimate,
  type EstimateCostItem
} from "./calculateEstimate";

type FormalResultRunner = {
  costResult: {
    findFirst: (args: Prisma.CostResultFindFirstArgs) => Promise<{ version: string } | null>;
    create: (args: Prisma.CostResultCreateArgs) => Promise<{ id: string; version: string }>;
  };
};

export type FormalCostItem = EstimateCostItem & {
  specificationId?: string | null;
  specificationName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierPriceId?: string | null;
  importBatchId?: string | null;
  priceSource?: string | null;
};

export type CreateFormalResultInput = {
  dbClient: FormalResultRunner;
  projectId: string;
  calculatedById: string;
  costItems: FormalCostItem[];
  formulaVersion: string;
};

export async function createFormalResult(input: CreateFormalResultInput) {
  const estimate = calculateEstimate(input.costItems);

  if (estimate.blockingIssues.length > 0) {
    throw new Error(`Formal calculation blocked: ${estimate.blockingIssues.join("; ")}`);
  }

  const version = await nextFormalResultVersion(input.dbClient, input.projectId);

  return input.dbClient.costResult.create({
    data: {
      projectId: input.projectId,
      version,
      mainMaterialCostK: estimate.mainMaterialCostK,
      auxiliaryMaterialCostK: estimate.auxiliaryMaterialCostK,
      processFeeCostK: estimate.processFeeCostK,
      overheadCostK: estimate.overheadCostK,
      totalCostK: estimate.totalCostK,
      formulaVersion: input.formulaVersion,
      inputSnapshot: JSON.stringify({
        projectId: input.projectId,
        formulaVersion: input.formulaVersion,
        costItems: input.costItems
      }),
      priceSnapshot: JSON.stringify(priceSnapshot(input.costItems)),
      importBatchSnapshot: JSON.stringify(importBatchSnapshot(input.costItems)),
      calculatedById: input.calculatedById
    }
  });
}

async function nextFormalResultVersion(dbClient: FormalResultRunner, projectId: string) {
  const latest = await dbClient.costResult.findFirst({
    where: { projectId },
    orderBy: { calculatedAt: "desc" },
    select: { version: true }
  });
  const latestNumber = latest ? Number(latest.version.replace(/^v/i, "")) : 0;

  return `v${Number.isFinite(latestNumber) ? latestNumber + 1 : 1}`;
}

function priceSnapshot(items: FormalCostItem[]) {
  return items
    .filter((item) => item.price !== undefined)
    .map((item) => ({
      itemId: item.id,
      itemName: item.itemName,
      specificationId: item.specificationId ?? null,
      specificationName: item.specificationName ?? null,
      supplierId: item.supplierId ?? null,
      supplierName: item.supplierName ?? null,
      supplierPriceId: item.supplierPriceId ?? null,
      price: item.price,
      priceUnit: item.priceUnit ?? null,
      priceSource: item.priceSource ?? null
    }));
}

function importBatchSnapshot(items: FormalCostItem[]) {
  const batchIds = new Set(
    items
      .map((item) => item.importBatchId)
      .filter((id): id is string => Boolean(id))
  );

  return Array.from(batchIds).sort().map((importBatchId) => ({ importBatchId }));
}
