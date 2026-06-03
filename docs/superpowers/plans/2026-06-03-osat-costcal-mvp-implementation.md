# OSAT CostCal MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the OSAT CostCal MVP intranet web app with fixed Excel imports, structured cost workbench, supplier filtering, formal calculation snapshots, lightweight roles, and two Excel exports.

**Architecture:** Create a Next.js TypeScript app with server-side route handlers, Prisma data models, and a cost engine split into focused domain modules. Use SQLite for local MVP development and keep the Prisma schema portable for PostgreSQL later.

**Tech Stack:** Next.js App Router, TypeScript, Prisma, SQLite, React Hook Form, Zod, xlsx, Vitest, Playwright.

---

## Scope Check

The approved MVP contains several subsystems, but they form one testable vertical product loop: import master data, create a cost project, configure the workbench, calculate a formal result, and export Excel. This plan implements that loop in phases and keeps AI parsing, dashboards, PDF export, approval workflow, SaaS tenancy, and mobile-specific UI out of scope.

## File Structure

- `package.json`: project scripts and dependencies.
- `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`: app and test configuration.
- `prisma/schema.prisma`: database schema for users, roles, imports, master data, projects, cost items, expense allocation, results, and exports.
- `src/lib/db.ts`: Prisma client singleton.
- `src/lib/auth/roles.ts`: lightweight role and permission rules.
- `src/lib/domain/imports/*.ts`: Excel parsing, template validation, and import persistence.
- `src/lib/domain/master-data/*.ts`: specification, supplier, price, UPH, and standard usage services.
- `src/lib/domain/costing/*.ts`: pricing modes, unit conversion, workbench estimate, formal calculation, and snapshot creation.
- `src/lib/domain/exports/*.ts`: internal detail and simplified quotation Excel builders.
- `src/app/api/**/route.ts`: route handlers.
- `src/app/**/page.tsx`: app pages.
- `src/components/**`: focused UI components for upload, tables, forms, workbench sections, and export actions.
- `tests/unit/**`: domain tests.
- `tests/e2e/**`: browser flow tests.

## Tasks

### Task 1: Project Foundation

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.gitignore`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Initialize git for this workspace**

Run:

```powershell
git init
```

Expected: repository initialized in `D:\code\CostCal`.

- [ ] **Step 2: Create the Next.js TypeScript project files**

Create the listed config files with scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

- [ ] **Step 3: Install dependencies**

Run:

```powershell
npm install next react react-dom @prisma/client prisma zod xlsx react-hook-form @hookform/resolvers
npm install -D typescript @types/node @types/react @types/react-dom vitest playwright
```

Expected: dependencies installed and `package-lock.json` created.

- [ ] **Step 4: Add a minimal home page**

Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>OSAT CostCal</h1>
      <p>Packaging cost calculation workbench</p>
    </main>
  );
}
```

- [ ] **Step 5: Verify the foundation**

Run:

```powershell
npm run build
```

Expected: Next.js build completes.

- [ ] **Step 6: Commit**

Run:

```powershell
git add .
git commit -m "chore: initialize costcal app"
```

### Task 2: Database Schema and Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/auth/roles.ts`
- Test: `tests/unit/auth/roles.test.ts`

- [ ] **Step 1: Write role permission tests**

Create tests that assert:

- Cost engineers can import, calculate, and export.
- Procurement can maintain supplier prices and view supplier switching impact.
- Procurement cannot generate formal quotation exports.
- Admin can manage users and dictionaries.

- [ ] **Step 2: Implement role rules**

Define roles:

```ts
export type Role = "cost_engineer" | "procurement" | "admin";
export type Permission =
  | "import_data"
  | "maintain_supplier_prices"
  | "create_cost_project"
  | "formal_calculation"
  | "export_internal_detail"
  | "export_simplified_quote"
  | "manage_system";
```

- [ ] **Step 3: Create Prisma schema**

Include models:

- `User`, `ImportBatch`, `Material`, `Specification`, `SpecificationAlias`, `Supplier`, `SupplierPrice`, `PackageType`, `UPHRoute`, `StandardUsage`, `CostProject`, `CostItem`, `MonthlyExpense`, `MonthlyOutput`, `CostResult`, `ExportRecord`.

Key requirements:

- `SupplierPrice` links to `Material`, `Specification`, `Supplier`, and `ImportBatch`.
- `CostItem` stores `costGroup`, `pricingMode`, usage, unit, price, price unit, formula version, and price source.
- `CostResult` stores immutable JSON snapshots for inputs, prices, and import batches.

- [ ] **Step 4: Generate and migrate**

Run:

```powershell
npm run prisma:generate
npm run prisma:migrate -- --name init
```

Expected: migration succeeds with SQLite database.

- [ ] **Step 5: Seed package and role data**

Seed:

- Admin, cost engineer, and procurement users.
- Default package type.
- Cost item names for main material, auxiliary material, and process / outsourced fees.

- [ ] **Step 6: Run tests and commit**

Run:

```powershell
npm run test
git add .
git commit -m "feat: add schema and role permissions"
```

### Task 3: Excel Import Services

**Files:**
- Create: `src/lib/domain/imports/templates.ts`
- Create: `src/lib/domain/imports/parseWorkbook.ts`
- Create: `src/lib/domain/imports/validateImportRows.ts`
- Create: `src/lib/domain/imports/persistImportBatch.ts`
- Create: `src/app/api/imports/route.ts`
- Create: `src/app/imports/page.tsx`
- Test: `tests/unit/imports/*.test.ts`

- [ ] **Step 1: Write parser and validation tests**

Test the three fixed templates:

- Material and supplier price.
- Standard UPH.
- Standard usage / BOM.

Assert missing required fields, unsupported units, invalid UPH, duplicate price rows, and missing specification are reported before persistence.

- [ ] **Step 2: Implement template definitions**

Define template columns and versions:

```ts
export const TEMPLATE_VERSIONS = {
  material_price: "MATERIAL_PRICE_V1",
  standard_uph: "STANDARD_UPH_V1",
  standard_usage: "STANDARD_USAGE_V1"
} as const;
```

- [ ] **Step 3: Implement workbook parsing**

Use `xlsx` to read the first worksheet and map rows by exact Chinese/English column names accepted by the template.

- [ ] **Step 4: Implement row validation**

Return a preview object:

```ts
type ImportPreview = {
  templateType: string;
  validRows: unknown[];
  errorRows: { rowNumber: number; errors: string[]; raw: unknown }[];
  duplicateRows: { rowNumber: number; key: string; raw: unknown }[];
};
```

- [ ] **Step 5: Implement persistence**

Persist `ImportBatch`, then upsert master data. Preserve `importBatchId` on affected records.

- [ ] **Step 6: Add import API and page**

Add upload, preview, confirm import, and error display. Keep UI utilitarian: upload area, preview table, error table, confirm button.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm run test
npm run build
git add .
git commit -m "feat: add fixed template imports"
```

### Task 4: Master Data and Supplier Filtering

**Files:**
- Create: `src/lib/domain/master-data/specifications.ts`
- Create: `src/lib/domain/master-data/supplierPrices.ts`
- Create: `src/app/api/specifications/[specificationId]/suppliers/route.ts`
- Create: `src/app/materials/page.tsx`
- Test: `tests/unit/master-data/supplierFiltering.test.ts`

- [ ] **Step 1: Write supplier filtering tests**

Assert:

- Matching suppliers are returned for a specification.
- Suppliers for other specifications are excluded.
- Inactive suppliers or expired prices are excluded from selectable options.

- [ ] **Step 2: Implement supplier filtering service**

Return supplier options with price, price unit, effective date, and material metadata.

- [ ] **Step 3: Implement backend validation helper**

Create `assertSupplierMatchesSpecification(specificationId, supplierId)` and use it later in cost item persistence.

- [ ] **Step 4: Add materials and prices page**

Show searchable table with material category, material code, specification, supplier, price, unit, effective date, and import batch.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm run test
npm run build
git add .
git commit -m "feat: add master data supplier filtering"
```

### Task 5: Cost Engine

**Files:**
- Create: `src/lib/domain/costing/units.ts`
- Create: `src/lib/domain/costing/pricingModes.ts`
- Create: `src/lib/domain/costing/calculateEstimate.ts`
- Create: `src/lib/domain/costing/createFormalResult.ts`
- Test: `tests/unit/costing/*.test.ts`

- [ ] **Step 1: Write unit conversion tests**

Cover CNY / K, CNY / gram with gram / K usage, CNY / piece converted to K, and batch amount converted to K.

- [ ] **Step 2: Implement pricing modes**

Supported modes:

- `CNY_PER_K`
- `USAGE_TIMES_UNIT_PRICE`
- `SHOT_CONVERSION`
- `CNY_PER_PIECE_TO_K`
- `BATCH_TO_K`
- `MANUAL_WITH_SOURCE`

- [ ] **Step 3: Write cost estimate tests**

Assert main material, auxiliary material, process / outsourced fee, and overhead allocation totals are separated and total CNY / K is correct.

- [ ] **Step 4: Implement live estimate calculation**

Return:

```ts
type CostEstimate = {
  mainMaterialCostK: number;
  auxiliaryMaterialCostK: number;
  processFeeCostK: number;
  overheadCostK: number;
  totalCostK: number;
  blockingIssues: string[];
};
```

- [ ] **Step 5: Write formal result snapshot tests**

Assert formal result includes input snapshot, price snapshot, formula version, and import batch references.

- [ ] **Step 6: Implement formal result creation**

Reject formal calculation when blocking issues exist. Create a new immutable result version for recalculation.

- [ ] **Step 7: Verify and commit**

Run:

```powershell
npm run test
git add .
git commit -m "feat: add cost calculation engine"
```

### Task 6: Cost Workbench UI and APIs

**Files:**
- Create: `src/app/workbench/page.tsx`
- Create: `src/app/api/cost-projects/route.ts`
- Create: `src/app/api/cost-projects/[projectId]/route.ts`
- Create: `src/app/api/cost-projects/[projectId]/estimate/route.ts`
- Create: `src/app/api/cost-projects/[projectId]/formal-results/route.ts`
- Create: `src/components/workbench/CostWorkbench.tsx`
- Create: `src/components/workbench/CostItemTable.tsx`
- Create: `src/components/workbench/CostSummaryPanel.tsx`
- Create: `src/components/workbench/SupplierSwitchPanel.tsx`
- Test: `tests/e2e/workbench.spec.ts`

- [ ] **Step 1: Write e2e flow test**

Test:

- Create project.
- Add main material, auxiliary material, and process fee items.
- Change supplier.
- See live estimate update.
- Generate formal result.

- [ ] **Step 2: Implement cost project APIs**

Add create, read, update cost item, estimate, and formal result endpoints.

- [ ] **Step 3: Implement workbench page**

Use four sections:

- Main material.
- Auxiliary material.
- Process / outsourced fee.
- Labor and manufacturing allocation.

- [ ] **Step 4: Implement live estimate**

Call the estimate API after cost item changes and display blocking issues.

- [ ] **Step 5: Implement formal calculation action**

Disable the button while blocking issues exist. On success, show formal result version and enable exports.

- [ ] **Step 6: Verify and commit**

Run:

```powershell
npm run test
npm run test:e2e
npm run build
git add .
git commit -m "feat: add cost workbench"
```

### Task 7: Excel Exports

**Files:**
- Create: `src/lib/domain/exports/internalDetailExcel.ts`
- Create: `src/lib/domain/exports/simplifiedQuotationExcel.ts`
- Create: `src/app/api/exports/internal-detail/route.ts`
- Create: `src/app/api/exports/simplified-quotation/route.ts`
- Test: `tests/unit/exports/*.test.ts`

- [ ] **Step 1: Write export tests**

Assert:

- Internal detail includes all cost groups, supplier, specification, usage, price, pricing mode, snapshots, and formula version.
- Simplified quotation excludes internal cost breakdown and supplier price details.
- Export fails when no formal result exists.

- [ ] **Step 2: Implement internal detail Excel builder**

Use `xlsx` to build sheets:

- Summary.
- Cost items.
- Snapshots.
- Import sources.

- [ ] **Step 3: Implement simplified quotation Excel builder**

Include product, package, formal result version, total cost CNY / K, target gross margin, suggested quotation, and quotation date.

- [ ] **Step 4: Implement export APIs**

Check role permissions before returning files.

- [ ] **Step 5: Verify and commit**

Run:

```powershell
npm run test
npm run build
git add .
git commit -m "feat: add excel exports"
```

### Task 8: Final Acceptance Flow

**Files:**
- Create: `tests/e2e/mvp-acceptance.spec.ts`
- Modify: relevant UI and route files from earlier tasks.

- [ ] **Step 1: Write full MVP acceptance e2e test**

The test creates or loads sample data, creates a project, configures four-layer costs, verifies supplier filtering, generates a formal result, and downloads both Excel exports.

- [ ] **Step 2: Run all automated verification**

Run:

```powershell
npm run test
npm run test:e2e
npm run build
```

Expected: all commands pass.

- [ ] **Step 3: Manual verification**

Run:

```powershell
npm run dev
```

Open `http://localhost:3000` and verify:

- Imports page loads.
- Materials page loads.
- Workbench page loads.
- Supplier switch panel updates cost impact.
- Formal result enables export actions.

- [ ] **Step 4: Commit**

Run:

```powershell
git add .
git commit -m "test: add mvp acceptance coverage"
```

## Self-Review

Spec coverage:

- Fixed Excel imports: Task 3.
- Master data and supplier filtering: Task 4.
- Four-layer cost workbench: Tasks 5 and 6.
- Live estimate and formal calculation snapshots: Tasks 5 and 6.
- Lightweight roles: Task 2 and Task 7 export checks.
- Two Excel exports: Task 7.
- Acceptance and tests: Task 8.

No planned task includes AI parsing, dashboard, PDF export, approval workflow, SaaS tenancy, or mobile-specific UI.

