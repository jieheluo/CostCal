import { PrismaClient, Role, CostGroup, PricingMode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@costcal.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@costcal.local",
      role: Role.admin
    }
  });

  await prisma.user.upsert({
    where: { email: "cost.engineer@costcal.local" },
    update: {},
    create: {
      name: "Cost Engineer",
      email: "cost.engineer@costcal.local",
      role: Role.cost_engineer
    }
  });

  await prisma.user.upsert({
    where: { email: "procurement@costcal.local" },
    update: {},
    create: {
      name: "Procurement",
      email: "procurement@costcal.local",
      role: Role.procurement
    }
  });

  const packageType = await prisma.packageType.upsert({
    where: { packageName: "Default Package" },
    update: {},
    create: {
      packageName: "Default Package",
      weightCoefficient: 1
    }
  });

  const defaultCostItems = [
    { costGroup: CostGroup.main_material, itemName: "Lead Frame", pricingMode: PricingMode.CNY_PER_K },
    { costGroup: CostGroup.main_material, itemName: "Bonding Adhesive", pricingMode: PricingMode.USAGE_TIMES_UNIT_PRICE },
    { costGroup: CostGroup.main_material, itemName: "Molding Compound", pricingMode: PricingMode.SHOT_CONVERSION },
    { costGroup: CostGroup.main_material, itemName: "Wire", pricingMode: PricingMode.USAGE_TIMES_UNIT_PRICE },
    { costGroup: CostGroup.auxiliary_material, itemName: "Mold Cleaning Compound", pricingMode: PricingMode.USAGE_TIMES_UNIT_PRICE },
    { costGroup: CostGroup.auxiliary_material, itemName: "Reel", pricingMode: PricingMode.CNY_PER_PIECE_TO_K },
    { costGroup: CostGroup.auxiliary_material, itemName: "Cover Tape", pricingMode: PricingMode.USAGE_TIMES_UNIT_PRICE },
    { costGroup: CostGroup.auxiliary_material, itemName: "Carrier Tape", pricingMode: PricingMode.USAGE_TIMES_UNIT_PRICE },
    { costGroup: CostGroup.auxiliary_material, itemName: "Consumable Parts", pricingMode: PricingMode.BATCH_TO_K },
    { costGroup: CostGroup.auxiliary_material, itemName: "Packaging Materials", pricingMode: PricingMode.BATCH_TO_K },
    { costGroup: CostGroup.process_outsourced_fee, itemName: "Dicing Fee", pricingMode: PricingMode.CNY_PER_K },
    { costGroup: CostGroup.process_outsourced_fee, itemName: "Plating Fee", pricingMode: PricingMode.CNY_PER_K }
  ];

  for (const item of defaultCostItems) {
    const existing = await prisma.standardUsage.findFirst({
      where: {
        packageTypeId: packageType.id,
        costGroup: item.costGroup,
        itemName: item.itemName
      }
    });

    if (!existing) {
      await prisma.standardUsage.create({
        data: {
          packageTypeId: packageType.id,
          costGroup: item.costGroup,
          itemName: item.itemName,
          standardUsage: 0,
          usageUnit: "K",
          pricingMode: item.pricingMode
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
