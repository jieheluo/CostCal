import {
  CostGroup,
  PricingMode,
  Prisma,
  type ImportTemplateType
} from "@prisma/client";

import { db } from "@/lib/db";
import {
  IMPORT_TEMPLATES,
  TEMPLATE_VERSIONS,
  type ImportTemplateType as DomainTemplateType
} from "./templates";
import type { ImportPreview, ValidImportRow } from "./validateImportRows";

type PersistImportBatchInput = {
  dbClient?: TransactionRunner;
  templateType: DomainTemplateType;
  fileName: string;
  importedById: string;
  validRows: ValidImportRow[];
  failedRowCount?: number;
};

export async function persistImportBatch(input: PersistImportBatchInput) {
  const template = IMPORT_TEMPLATES[input.templateType];

  return runTransaction(input.dbClient, async (tx) => {
    const batch = await tx.importBatch.create({
      data: {
        templateType: input.templateType as ImportTemplateType,
        templateVersion: TEMPLATE_VERSIONS[input.templateType],
        fileName: input.fileName,
        status: "imported",
        successRowCount: input.validRows.length,
        failedRowCount: input.failedRowCount ?? 0,
        importedById: input.importedById
      }
    });

    if (template.type === "material_price") {
      await persistMaterialPrices(tx, batch.id, input.validRows);
    } else if (template.type === "standard_uph") {
      await persistUphRoutes(tx, batch.id, input.validRows);
    } else {
      await persistStandardUsages(tx, batch.id, input.validRows);
    }

    return batch;
  });
}

type TransactionRunner = {
  $transaction: <T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
};

function runTransaction<T>(
  dbClient: TransactionRunner | undefined,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  if (dbClient) {
    return dbClient.$transaction(callback);
  }

  return db.$transaction(callback);
}

export function persistImportPreview(input: Omit<PersistImportBatchInput, "templateType" | "validRows" | "failedRowCount"> & {
  preview: ImportPreview;
}) {
  return persistImportBatch({
    dbClient: input.dbClient,
    templateType: input.preview.templateType,
    fileName: input.fileName,
    importedById: input.importedById,
    validRows: input.preview.validRows,
    failedRowCount: input.preview.errorRows.length + input.preview.duplicateRows.length
  });
}

async function persistMaterialPrices(
  tx: Prisma.TransactionClient,
  importBatchId: string,
  rows: ValidImportRow[]
) {
  for (const row of rows) {
    const material = await tx.material.upsert({
      where: {
        materialCode_category: {
          materialCode: asString(row.data.materialCode),
          category: asString(row.data.materialCategory)
        }
      },
      update: {
        name: asString(row.data.materialName),
        defaultUnit: asString(row.data.defaultUnit),
        importBatchId
      },
      create: {
        materialCode: asString(row.data.materialCode),
        category: asString(row.data.materialCategory),
        name: asString(row.data.materialName),
        defaultUnit: asString(row.data.defaultUnit),
        importBatchId
      }
    });

    const specification = await upsertSpecification(tx, asString(row.data.specification));
    const supplier = await tx.supplier.upsert({
      where: { name: asString(row.data.supplier) },
      update: { status: "active" },
      create: { name: asString(row.data.supplier), status: "active" }
    });

    await tx.supplierPrice.upsert({
      where: {
        materialId_specificationId_supplierId_effectiveDate: {
          materialId: material.id,
          specificationId: specification.id,
          supplierId: supplier.id,
          effectiveDate: asDate(row.data.effectiveDate)
        }
      },
      update: {
        price: asDecimal(row.data.price),
        priceUnit: asString(row.data.priceUnit),
        importBatchId
      },
      create: {
        materialId: material.id,
        specificationId: specification.id,
        supplierId: supplier.id,
        price: asDecimal(row.data.price),
        priceUnit: asString(row.data.priceUnit),
        effectiveDate: asDate(row.data.effectiveDate),
        importBatchId
      }
    });
  }
}

async function persistUphRoutes(
  tx: Prisma.TransactionClient,
  importBatchId: string,
  rows: ValidImportRow[]
) {
  for (const row of rows) {
    const packageType = await upsertPackageType(tx, asString(row.data.packageType));

    await tx.uPHRoute.upsert({
      where: {
        packageTypeId_processName: {
          packageTypeId: packageType.id,
          processName: asString(row.data.processName)
        }
      },
      update: {
        standardUph: asDecimal(row.data.standardUph),
        importBatchId
      },
      create: {
        packageTypeId: packageType.id,
        processName: asString(row.data.processName),
        standardUph: asDecimal(row.data.standardUph),
        importBatchId
      }
    });
  }
}

async function persistStandardUsages(
  tx: Prisma.TransactionClient,
  importBatchId: string,
  rows: ValidImportRow[]
) {
  for (const row of rows) {
    const packageType = await upsertPackageType(tx, asString(row.data.packageType));
    const specification = await upsertSpecification(tx, asString(row.data.specification));
    const materialCode = row.data.materialCode ? asString(row.data.materialCode) : null;
    const material = materialCode ? await findUnambiguousMaterial(tx, materialCode) : null;

    await tx.standardUsage.upsert({
      where: {
        packageTypeId_costGroup_itemName_specificationId: {
          packageTypeId: packageType.id,
          costGroup: asString(row.data.costGroup) as CostGroup,
          itemName: asString(row.data.itemName),
          specificationId: specification.id
        }
      },
      update: {
        materialId: material?.id,
        standardUsage: asDecimal(row.data.standardUsage),
        usageUnit: asString(row.data.usageUnit),
        pricingMode: asString(row.data.pricingMode) as PricingMode,
        importBatchId
      },
      create: {
        packageTypeId: packageType.id,
        costGroup: asString(row.data.costGroup) as CostGroup,
        itemName: asString(row.data.itemName),
        materialId: material?.id,
        specificationId: specification.id,
        standardUsage: asDecimal(row.data.standardUsage),
        usageUnit: asString(row.data.usageUnit),
        pricingMode: asString(row.data.pricingMode) as PricingMode,
        importBatchId
      }
    });
  }
}

async function findUnambiguousMaterial(
  tx: Prisma.TransactionClient,
  materialCode: string
) {
  const materials = await tx.material.findMany({
    where: { materialCode },
    take: 2
  });

  if (materials.length > 1) {
    throw new Error(`Ambiguous materialCode: ${materialCode}`);
  }

  return materials[0] ?? null;
}

async function upsertPackageType(tx: Prisma.TransactionClient, packageName: string) {
  return tx.packageType.upsert({
    where: { packageName },
    update: {},
    create: { packageName, weightCoefficient: 1 }
  });
}

async function upsertSpecification(tx: Prisma.TransactionClient, displayName: string) {
  return tx.specification.upsert({
    where: { normalizedKey: normalizeSpecification(displayName) },
    update: { displayName },
    create: {
      normalizedKey: normalizeSpecification(displayName),
      displayName
    }
  });
}

function normalizeSpecification(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function asString(value: unknown): string {
  return String(value ?? "").trim();
}

function asDecimal(value: unknown): Prisma.Decimal {
  return new Prisma.Decimal(String(value));
}

function asDate(value: unknown): Date {
  if (value instanceof Date) {
    return value;
  }

  return new Date(String(value));
}
