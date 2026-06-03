# OSAT CostCal MVP Design

Date: 2026-06-03

## 1. Scope

This spec defines the MVP for an OSAT packaging cost calculation intranet web app. The MVP focuses on replacing Excel-based manual cost calculation with a traceable cost workbench.

The confirmed MVP route is a cost-workbench-first Web App for intranet deployment.

Primary user:

- Cost engineer / quotation engineer.

Secondary user:

- Procurement / supply chain user.

MVP goals:

- Import fixed-template Excel data for materials, supplier prices, UPH, and standard usage / BOM.
- Build a structured cost workbench for OSAT packaging cost calculation.
- Support supplier filtering by specification.
- Provide live cost estimates while editing.
- Generate formal calculation results with input and price snapshots.
- Export internal cost detail Excel and simplified quotation Excel.
- Support lightweight role control.

MVP non-goals:

- AI process parsing.
- Management dashboard.
- PDF quotation.
- Full audit approval workflow.
- SaaS multi-tenancy.
- Mobile-first experience.

## 2. Information Architecture

The MVP navigation centers on the cost workbench. Supporting pages exist to serve workbench accuracy and data quality.

Pages:

- Cost Workbench: create cost projects, configure cost items, switch suppliers, preview costs, generate formal results, and export Excel.
- Import Data: upload fixed-template Excel files, preview parsed rows, review errors, and confirm import.
- Materials and Prices: query and maintain material, specification, supplier, price, unit, and effective-date data.
- Standard Usage: maintain package-level standard usage / BOM templates.
- UPH and Expense Setup: maintain package process UPH, monthly expenses, monthly output, and package complexity weights.
- Exports: export internal cost detail Excel and simplified quotation Excel from formal calculation results.
- User and Role Setup: lightweight admin page for user and role assignment.

Primary flow:

1. Import Excel data.
2. Validate and persist master data.
3. Create a cost project.
4. Initialize BOM from package template.
5. Configure material, auxiliary material, process / outsourced fee, and overhead items.
6. Preview live cost.
7. Generate a formal calculation result.
8. Export internal detail or simplified quotation Excel.

## 3. Data Model and Data Flow

The MVP data model is organized into five layers.

### 3.1 Import Batch Layer

`ImportBatch` records each import operation:

- File name.
- Template type.
- Template version.
- Imported by.
- Imported at.
- Success row count.
- Failed row count.
- Error report reference.

Even when imported data overwrites existing records, the system keeps import batch lineage so prices, standard usage, and UPH records can be traced to their source.

### 3.2 Master Data Layer

Core entities:

- `Material`: material code, category, name, default unit.
- `Specification`: normalized specification key and display name.
- `SpecificationAlias`: optional alias mapping for later fuzzy matching support.
- `Supplier`: supplier name and status.
- `SupplierPrice`: material, specification, supplier, price, price unit, effective date, import batch.
- `PackageType`: package name and complexity weight.
- `UPHRoute`: package, process name, standard UPH.
- `StandardUsage`: package, cost item category, item name, specification, standard usage, usage unit, default pricing mode.

`Specification` is the key index for supplier filtering, BOM traceability, export traceability, and future AI matching.

### 3.3 Cost Project Layer

`CostProject` represents one product cost calculation project:

- Product model.
- Package type.
- Version.
- Status.
- Created by.
- Created at.

`CostItem` records each workbench cost item:

- Cost group: main material, auxiliary material, process / outsourced fee, or overhead allocation.
- Item name.
- Specification.
- Supplier.
- Usage.
- Usage unit.
- Price.
- Price unit.
- Pricing mode.
- Formula version.
- Price source.
- Import batch source.
- Included in quotation flag.

The workbench uses these records for live estimates. Formal exports only use formal `CostResult` records.

### 3.4 Expense Allocation Layer

`MonthlyExpense` records monthly labor and manufacturing expenses:

- Labor cost.
- Rent cost.
- Power cost.
- Depreciation cost.
- Other manufacturing cost.

`MonthlyOutput` records package output and weighting:

- Month.
- Package type.
- Actual output in K.
- Complexity weight.

Allocation rules:

- `Q_total_norm = Σ(Q_j * W_j)`
- `Rate_norm = total_expense / Q_total_norm`
- `Cost_overhead_j = Rate_norm * W_j`

### 3.5 Formal Result Layer

`CostResult` stores one formal calculation result:

- Project.
- Version.
- Main material cost.
- Auxiliary material cost.
- Process / outsourced fee.
- Labor and manufacturing allocation.
- Total cost in CNY / K.
- Formula version.
- Input snapshot.
- Price snapshot.
- Import batch references.
- Calculated by.
- Calculated at.

Formal results are immutable for quotation purposes. Later price updates do not mutate historical formal results.

## 4. Cost Workbench Design

The workbench uses a four-layer cost structure:

1. Main materials.
2. Auxiliary materials.
3. Process / outsourced fees.
4. Labor and manufacturing expense allocation.

### 4.1 Main Materials

Main material examples:

- Lead frame.
- Bonding adhesive.
- Molding compound.
- Wire.

Each item records specification, supplier, usage, unit, price, price unit, pricing mode, and price source.

Molding compound supports Shot-based calculation.

Wire supports gram / K usage calculation.

### 4.2 Auxiliary Materials

Auxiliary material examples:

- Mold cleaning compound.
- Reel.
- Cover tape.
- Carrier tape.
- Consumable parts.
- Packaging materials.

Auxiliary items can be initialized from package-level standard usage templates. Cost engineers can add or adjust auxiliary items within a project.

### 4.3 Process / Outsourced Fees

Process / outsourced fee examples:

- Dicing fee.
- Plating fee.

These items are modeled separately from materials because they often follow service pricing rather than physical material consumption.

Supported MVP pricing modes:

- CNY / K.
- CNY / piece converted to K.
- Batch amount converted to K.
- Supplier quoted service price.
- Manual amount with required source note.

### 4.4 Labor and Manufacturing Allocation

Labor and manufacturing expenses are calculated from monthly expense, output, and package complexity weight data. The workbench displays this as a separate cost layer, not as a material line.

### 4.5 Live Estimate and Formal Calculation

The workbench supports two calculation states:

- Live estimate: updates immediately when supplier, usage, pricing mode, or special parameters change.
- Formal calculation: generated only when the user clicks the formal calculation action.

Formal calculation saves:

- Input snapshot.
- Price snapshot.
- Formula version.
- Import batch references.
- User and timestamp.

Exports are allowed only from formal calculation results.

### 4.6 Supplier Switching

Supplier dropdowns are filtered by specification. The system does not allow selecting a supplier that is not bound to the current specification.

The workbench includes a lightweight supplier comparison panel:

- Current supplier and price.
- Available alternative suppliers.
- Effective date.
- Cost delta after switching.

This supports procurement users without turning the MVP into a full purchasing analytics system.

## 5. Import Design

MVP uses fixed templates with template version tracking. User-defined field mapping is not included in MVP, but the import model keeps enough metadata to support mapping later.

Templates:

- Material and supplier price template.
- Standard UPH template.
- Standard usage / BOM template.

Import flow:

1. Upload Excel.
2. Parse by template type and version.
3. Preview parsed rows.
4. Show validation errors, duplicate rows, and rows requiring confirmation.
5. Confirm import.
6. Persist data and create `ImportBatch`.
7. Allow error report download.

Validation examples:

- Required fields missing.
- Specification missing.
- Price missing or invalid.
- Unit unsupported.
- UPH empty or zero.
- Duplicate material + specification + supplier price records.

## 6. Permissions

MVP uses lightweight role control.

Roles:

- Cost engineer: import templates, create projects, configure workbench, generate formal calculations, export internal detail Excel and simplified quotation Excel.
- Procurement / supply chain: maintain supplier prices, view materials and suppliers, view supplier switching impact, but cannot generate formal quotation exports.
- Administrator: manage users, roles, package types, process dictionaries, and basic system settings.

Sensitive operations:

- Internal cost detail export is limited to authorized users.
- Simplified quotation export requires a formal calculation result.
- Procurement users cannot generate formal quotation results unless granted an additional permission.

## 7. Export Design

MVP supports Excel export only.

### 7.1 Internal Cost Detail Excel

Includes:

- Product and package information.
- Formal calculation version.
- Main material cost lines.
- Auxiliary material cost lines.
- Process / outsourced fee lines.
- Labor and manufacturing allocation.
- Supplier, specification, usage, price, pricing mode, and formula version.
- Input snapshot and price snapshot references.
- Import batch references.

### 7.2 Simplified Quotation Excel

Includes:

- Product model.
- Package type.
- Formal result version.
- Total cost in CNY / K.
- Target gross margin.
- Suggested quotation.
- Quotation date.

Excludes:

- Internal material breakdown.
- Labor detail.
- Manufacturing expense detail.
- Supplier price breakdown.
- Formula internals.

PDF export is deferred to a later phase.

## 8. Error Handling

Blocking conditions for formal calculation:

- Missing price.
- Unit cannot be converted.
- Supplier does not match specification.
- Required usage or parameter is missing.
- `Q_shot <= 0` for Shot-based molding compound calculation.
- Unsupported pricing mode.

Import errors:

- Missing required fields.
- Invalid numeric values.
- Unsupported units.
- Missing specification.
- Invalid UPH.
- Duplicate records requiring user choice.

Live estimate behavior:

- Live estimate may display an incomplete or not-calculable state.
- Incomplete live estimates cannot be exported.
- Formal calculation action remains disabled until blocking issues are resolved.

Historical result behavior:

- Historical formal results are immutable.
- New price imports do not alter existing formal calculation results.
- Recalculation creates a new result version.

## 9. Acceptance Criteria

### 9.1 Usable Closed Loop

- Users can import material prices, standard UPH, and standard usage / BOM Excel files.
- Users can create a cost project.
- Users can configure the four-layer cost structure in the workbench.
- Supplier options are filtered by specification.
- Live estimate refreshes after supplier, usage, pricing mode, or special parameter changes.
- Users can generate formal calculation results.
- Users can export internal cost detail Excel and simplified quotation Excel.

### 9.2 Calculation Trust

- With agreed sample data, system results match manual Excel results.
- All formal cost results output CNY / K.
- Missing price, failed unit conversion, supplier mismatch, and invalid parameters block formal calculation.
- Formal results save input snapshot, price snapshot, formula version, and import batch references.
- Historical quotation results are not affected by later price updates.

### 9.3 Collaboration Control

- Cost engineers can import, configure, calculate, and export.
- Procurement users can maintain supplier prices and view supplier switching impact.
- Simplified quotation Excel hides internal cost details.
- Internal cost detail Excel is limited to authorized users.

## 10. Test Strategy

Import tests:

- Required field missing.
- Duplicate data.
- Missing specification.
- Unsupported unit.
- Invalid template version.

Supplier filtering tests:

- Valid supplier appears for matching specification.
- Invalid supplier is hidden and blocked by backend validation.

Calculation tests:

- Main material calculations.
- Auxiliary material calculations.
- Process / outsourced fee calculations.
- Shot-based molding compound calculation.
- Wire usage calculation.
- Labor and manufacturing allocation.
- Unit conversion to CNY / K.

Workbench tests:

- Live estimate refresh.
- Formal calculation snapshot.
- Historical result immutability.
- Recalculation creates a new version.

Permission tests:

- Cost engineer permissions.
- Procurement permissions.
- Administrator permissions.
- Internal export restriction.

Export tests:

- Internal cost detail completeness.
- Simplified quotation hides sensitive fields.
- Export is blocked when no formal calculation result exists.

## 11. Phase Boundary

M1 includes:

- Fixed-template imports.
- Master data for specification, materials, suppliers, prices, UPH, and standard usage.
- Cost workbench with four-layer cost structure.
- Supplier filtering and supplier switching impact.
- Live estimate and formal calculation.
- Lightweight role control.
- Two Excel exports.

M1 excludes:

- AI process parsing.
- Cost dashboard.
- PDF export.
- Full workflow approval.
- Advanced fuzzy matching automation.
- SaaS multi-tenant controls.
- Mobile-specific UI.

