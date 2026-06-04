import type { PricingMode } from "@prisma/client";

import { readPositiveNumber, roundCost } from "./units";

export type PricingModeCode = PricingMode | string;

export type PricingModeInput = {
  pricingMode: PricingModeCode;
  price?: number;
  priceUnit?: string;
  usage?: number;
  usageUnit?: string;
  batchOutputK?: number;
  piecesPerShot?: number;
  sourceNote?: string | null;
};

export type PricingModeResult = {
  costK: number;
  issues: string[];
};

export function calculatePricingModeCostK(input: PricingModeInput): PricingModeResult {
  const price = readPositiveNumber(input.price, "price", input.pricingMode);
  if (price.value === null) {
    return { costK: 0, issues: [price.issue] };
  }

  switch (input.pricingMode) {
    case "CNY_PER_K":
      return { costK: roundCost(price.value), issues: [] };
    case "USAGE_TIMES_UNIT_PRICE":
      return usageTimesUnitPrice(input, price.value);
    case "SHOT_CONVERSION":
      return shotConversion(input, price.value);
    case "CNY_PER_PIECE_TO_K":
      return { costK: roundCost(price.value * 1000), issues: [] };
    case "BATCH_TO_K":
      return batchToK(input, price.value);
    case "MANUAL_WITH_SOURCE":
      return manualWithSource(input, price.value);
    default:
      return { costK: 0, issues: [`Unsupported pricing mode: ${input.pricingMode}.`] };
  }
}

function usageTimesUnitPrice(input: PricingModeInput, price: number): PricingModeResult {
  const usage = readPositiveNumber(input.usage, "usage", input.pricingMode);
  if (usage.value === null) {
    return { costK: 0, issues: [usage.issue] };
  }

  return { costK: roundCost(price * usage.value), issues: [] };
}

function shotConversion(input: PricingModeInput, price: number): PricingModeResult {
  const piecesPerShot = readPositiveNumber(
    input.piecesPerShot,
    "piecesPerShot",
    input.pricingMode
  );
  if (piecesPerShot.value === null) {
    return { costK: 0, issues: [piecesPerShot.issue] };
  }

  return { costK: roundCost((price / piecesPerShot.value) * 1000), issues: [] };
}

function batchToK(input: PricingModeInput, price: number): PricingModeResult {
  const batchOutputK = readPositiveNumber(input.batchOutputK, "batchOutputK", input.pricingMode);
  if (batchOutputK.value === null) {
    return { costK: 0, issues: [batchOutputK.issue] };
  }

  return { costK: roundCost(price / batchOutputK.value), issues: [] };
}

function manualWithSource(input: PricingModeInput, price: number): PricingModeResult {
  const issues = input.sourceNote?.trim() ? [] : ["Manual price requires a source note."];

  return { costK: roundCost(price), issues };
}
