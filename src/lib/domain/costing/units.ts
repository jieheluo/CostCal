export function roundCost(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
}

export function requirePositiveNumber(
  value: number | undefined,
  fieldName: string,
  pricingMode: string
): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return `${fieldName} is required for ${pricingMode}.`;
  }

  return null;
}

export function readPositiveNumber(
  value: number | undefined,
  fieldName: string,
  pricingMode: string
): { value: number; issue: null } | { value: null; issue: string } {
  const issue = requirePositiveNumber(value, fieldName, pricingMode);

  if (issue) {
    return { value: null, issue };
  }

  return { value: value as number, issue: null };
}
