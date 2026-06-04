import { Role as PrismaRole } from "@prisma/client";

export type Role = `${PrismaRole}`;

export type Permission =
  | "import_data"
  | "maintain_supplier_prices"
  | "create_cost_project"
  | "formal_calculation"
  | "export_internal_detail"
  | "export_simplified_quote"
  | "manage_system";

const rolePermissions: Record<Role, readonly Permission[]> = {
  cost_engineer: [
    "import_data",
    "create_cost_project",
    "formal_calculation",
    "export_internal_detail",
    "export_simplified_quote"
  ],
  procurement: ["maintain_supplier_prices"],
  admin: [
    "import_data",
    "maintain_supplier_prices",
    "create_cost_project",
    "formal_calculation",
    "export_internal_detail",
    "export_simplified_quote",
    "manage_system"
  ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function canViewSupplierSwitchingImpact(role: Role): boolean {
  return role === "cost_engineer" || role === "procurement" || role === "admin";
}
