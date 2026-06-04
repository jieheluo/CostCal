import { describe, expect, it } from "vitest";

import {
  canViewSupplierSwitchingImpact,
  hasPermission
} from "../../../src/lib/auth/roles";

describe("role permissions", () => {
  it("allows cost engineers to import, calculate, and export internal detail", () => {
    expect(hasPermission("cost_engineer", "import_data")).toBe(true);
    expect(hasPermission("cost_engineer", "formal_calculation")).toBe(true);
    expect(hasPermission("cost_engineer", "export_internal_detail")).toBe(true);
  });

  it("allows procurement to maintain supplier prices and view supplier switching impact", () => {
    expect(hasPermission("procurement", "maintain_supplier_prices")).toBe(true);
    expect(canViewSupplierSwitchingImpact("procurement")).toBe(true);
  });

  it("prevents procurement from generating formal quotation exports", () => {
    expect(hasPermission("procurement", "export_simplified_quote")).toBe(false);
  });

  it("allows admins to manage users and dictionaries", () => {
    expect(hasPermission("admin", "manage_system")).toBe(true);
  });
});
