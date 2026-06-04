import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

type MasterDataRunner = {
  specification: {
    findMany: (args: Prisma.SpecificationFindManyArgs) => Promise<SpecificationRow[]>;
  };
  supplierPrice: {
    findMany: (args: Prisma.SupplierPriceFindManyArgs) => Promise<MaterialPriceRow[]>;
  };
};

type SpecificationRow = Prisma.SpecificationGetPayload<{
  select: {
    id: true;
    displayName: true;
    normalizedKey: true;
  };
}>;

type MaterialPriceRow = Prisma.SupplierPriceGetPayload<{
  include: {
    material: true;
    specification: true;
    supplier: true;
    importBatch: {
      select: {
        id: true;
        fileName: true;
        importedAt: true;
      };
    };
  };
}>;

export type SpecificationOption = {
  id: string;
  displayName: string;
  normalizedKey: string;
};

export type MaterialPriceListItem = {
  supplierPriceId: string;
  materialCategory: string;
  materialCode: string;
  materialName: string;
  defaultUnit: string;
  specificationId: string;
  specificationName: string;
  supplierId: string;
  supplierName: string;
  supplierStatus: string;
  price: string;
  priceUnit: string;
  effectiveDate: string;
  importBatchId: string;
  importBatchFileName: string;
  importedAt: string;
};

export async function listSpecifications(input: {
  dbClient?: Pick<MasterDataRunner, "specification">;
} = {}): Promise<SpecificationOption[]> {
  const rows = await getRunner(input.dbClient).specification.findMany({
    select: {
      id: true,
      displayName: true,
      normalizedKey: true
    },
    orderBy: { displayName: "asc" }
  });

  return rows.map((row) => ({
    id: row.id,
    displayName: row.displayName,
    normalizedKey: row.normalizedKey
  }));
}

export async function listMaterialPrices(input: {
  dbClient?: Pick<MasterDataRunner, "supplierPrice">;
  search?: string;
} = {}): Promise<MaterialPriceListItem[]> {
  const search = input.search?.trim();
  const rows = await getRunner(input.dbClient).supplierPrice.findMany({
    where: search
      ? {
          OR: [
            { material: { category: { contains: search } } },
            { material: { materialCode: { contains: search } } },
            { material: { name: { contains: search } } },
            { specification: { displayName: { contains: search } } },
            { supplier: { name: { contains: search } } },
            { importBatch: { fileName: { contains: search } } }
          ]
        }
      : undefined,
    include: {
      material: true,
      specification: true,
      supplier: true,
      importBatch: {
        select: {
          id: true,
          fileName: true,
          importedAt: true
        }
      }
    },
    orderBy: [
      { material: { category: "asc" } },
      { material: { materialCode: "asc" } },
      { specification: { displayName: "asc" } },
      { supplier: { name: "asc" } },
      { effectiveDate: "desc" }
    ],
    take: 200
  });

  return rows.map(toMaterialPriceListItem);
}

function getRunner<T extends Partial<MasterDataRunner>>(dbClient?: T): T & MasterDataRunner {
  return (dbClient ?? db) as T & MasterDataRunner;
}

function toMaterialPriceListItem(row: MaterialPriceRow): MaterialPriceListItem {
  return {
    supplierPriceId: row.id,
    materialCategory: row.material.category,
    materialCode: row.material.materialCode,
    materialName: row.material.name,
    defaultUnit: row.material.defaultUnit,
    specificationId: row.specificationId,
    specificationName: row.specification.displayName,
    supplierId: row.supplierId,
    supplierName: row.supplier.name,
    supplierStatus: row.supplier.status,
    price: row.price.toString(),
    priceUnit: row.priceUnit,
    effectiveDate: row.effectiveDate.toISOString(),
    importBatchId: row.importBatch.id,
    importBatchFileName: row.importBatch.fileName,
    importedAt: row.importBatch.importedAt.toISOString()
  };
}
