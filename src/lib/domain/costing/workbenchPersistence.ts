import {
  CostGroup,
  PricingMode,
  Prisma,
  Role
} from "@prisma/client";

import { db } from "@/lib/db";
import type { FormalCostItem } from "./createFormalResult";

const DEMO_USER_EMAIL = "cost.engineer@costcal.local";
const DEFAULT_PACKAGE_NAME = "Default Package";

export type WorkbenchProjectInput = {
  productName: string;
  version: string;
};

export async function createWorkbenchProject(input: WorkbenchProjectInput) {
  const [user, packageType] = await Promise.all([
    db.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {},
      create: {
        name: "Cost Engineer",
        email: DEMO_USER_EMAIL,
        role: Role.cost_engineer
      }
    }),
    db.packageType.upsert({
      where: { packageName: DEFAULT_PACKAGE_NAME },
      update: {},
      create: {
        packageName: DEFAULT_PACKAGE_NAME,
        weightCoefficient: 1
      }
    })
  ]);

  const project = await db.costProject.upsert({
    where: {
      productName_packageTypeId_version: {
        productName: input.productName,
        packageTypeId: packageType.id,
        version: input.version
      }
    },
    update: { status: "draft" },
    create: {
      productName: input.productName,
      packageTypeId: packageType.id,
      version: input.version,
      createdById: user.id
    },
    include: { packageType: true }
  });

  return { project, user };
}

export async function getWorkbenchProject(projectId: string) {
  return db.costProject.findUnique({
    where: { id: projectId },
    include: {
      packageType: true,
      costItems: true,
      costResults: {
        orderBy: { calculatedAt: "desc" },
        take: 5
      }
    }
  });
}

export async function replaceProjectCostItems(projectId: string, costItems: FormalCostItem[]) {
  await db.$transaction(async (tx) => {
    await tx.costItem.deleteMany({ where: { projectId } });

    for (const item of costItems) {
      await tx.costItem.create({
        data: {
          projectId,
          costGroup: item.costGroup as CostGroup,
          itemName: item.itemName,
          pricingMode: item.pricingMode as PricingMode,
          usage: decimalOrNull(item.usage),
          usageUnit: item.usageUnit,
          price: decimalOrNull(item.price),
          priceUnit: item.priceUnit,
          formulaVersion: "cost-engine-v1",
          priceSource: item.priceSource ?? "workbench",
          sourceNote: item.sourceNote
        }
      });
    }
  });

  return getWorkbenchProject(projectId);
}

export async function getDemoCalculatedById() {
  const user = await db.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      name: "Cost Engineer",
      email: DEMO_USER_EMAIL,
      role: Role.cost_engineer
    }
  });

  return user.id;
}

function decimalOrNull(value: number | undefined): Prisma.Decimal | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Prisma.Decimal(value)
    : null;
}
