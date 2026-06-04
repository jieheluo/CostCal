export function assertFormalResultExists<T>(result: T | null | undefined): T {
  if (!result) {
    throw new Error("Formal result is required for export.");
  }

  return result;
}
