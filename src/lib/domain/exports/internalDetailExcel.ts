import { utils, write } from "xlsx";

import {
  parseSnapshot,
  type ExportableCostResult
} from "./exportTypes";

type InputSnapshot = {
  costItems?: Array<{
    costGroup?: string;
    itemName?: string;
    specificationName?: string;
    supplierName?: string;
    usage?: number;
    usageUnit?: string;
    price?: number;
    priceUnit?: string;
    pricingMode?: string;
  }>;
};

export function buildInternalDetailExcel(result: ExportableCostResult): Buffer {
  const workbook = utils.book_new();
  const inputSnapshot = parseSnapshot<InputSnapshot>(result.inputSnapshot, {});
  const importSources = parseSnapshot<Array<{ importBatchId: string }>>(
    result.importBatchSnapshot,
    []
  );

  utils.book_append_sheet(workbook, utils.aoa_to_sheet(summaryRows(result)), "Summary");
  utils.book_append_sheet(
    workbook,
    utils.aoa_to_sheet(costItemRows(inputSnapshot.costItems ?? [])),
    "Cost Items"
  );
  utils.book_append_sheet(
    workbook,
    utils.aoa_to_sheet(snapshotRows(result)),
    "Snapshots"
  );
  utils.book_append_sheet(
    workbook,
    utils.aoa_to_sheet(importSourceRows(importSources)),
    "Import Sources"
  );

  return write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function summaryRows(result: ExportableCostResult) {
  return [
    ["Product", result.project.productName],
    ["Formula Version", result.formulaVersion],
    ["Result Version", result.version],
    ["Main Material Cost CNY/K", result.mainMaterialCostK],
    ["Auxiliary Material Cost CNY/K", result.auxiliaryMaterialCostK],
    ["Process Fee Cost CNY/K", result.processFeeCostK],
    ["Overhead Cost CNY/K", result.overheadCostK],
    ["Total Cost CNY/K", result.totalCostK]
  ];
}

function costItemRows(items: NonNullable<InputSnapshot["costItems"]>) {
  return [
    [
      "Cost Group",
      "Item",
      "Specification",
      "Supplier",
      "Usage",
      "Price",
      "Pricing Mode",
      "Unit"
    ],
    ...items.map((item) => [
      item.costGroup ?? "",
      item.itemName ?? "",
      item.specificationName ?? "",
      item.supplierName ?? "",
      item.usage ?? "",
      item.price ?? "",
      item.pricingMode ?? "",
      item.priceUnit ?? item.usageUnit ?? ""
    ])
  ];
}

function snapshotRows(result: ExportableCostResult) {
  return [
    ["Snapshot", "JSON"],
    ["Input", result.inputSnapshot],
    ["Price", result.priceSnapshot],
    ["Import Batches", result.importBatchSnapshot]
  ];
}

function importSourceRows(sources: Array<{ importBatchId: string }>) {
  return [
    ["Import Batch ID"],
    ...sources.map((source) => [source.importBatchId])
  ];
}
