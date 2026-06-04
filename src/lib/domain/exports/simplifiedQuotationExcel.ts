import { utils, write } from "xlsx";

import type { ExportableCostResult } from "./exportTypes";

export type SimplifiedQuotationInput = {
  result: ExportableCostResult;
  targetGrossMargin: number;
  quotationDate: string;
};

export function buildSimplifiedQuotationExcel(input: SimplifiedQuotationInput): Buffer {
  const workbook = utils.book_new();
  const result = input.result;
  const suggestedQuotation = result.totalCostK / (1 - input.targetGrossMargin);

  const rows = [
    ["Product", result.project.productName],
    ["Package", result.project.packageType.packageName],
    ["Result Version", result.version],
    ["Total Cost CNY/K", result.totalCostK],
    ["Suggested Quotation CNY/K", roundMoney(suggestedQuotation)],
    ["Target Gross Margin", input.targetGrossMargin],
    ["Quotation Date", input.quotationDate]
  ];

  utils.book_append_sheet(workbook, utils.aoa_to_sheet(rows), "Quotation");

  return write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}
