-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateType" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'preview',
    "successRowCount" INTEGER NOT NULL DEFAULT 0,
    "failedRowCount" INTEGER NOT NULL DEFAULT 0,
    "errorReportPath" TEXT,
    "importedById" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportBatch_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultUnit" TEXT NOT NULL,
    "importBatchId" TEXT,
    CONSTRAINT "Material_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Specification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "normalizedKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SpecificationAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alias" TEXT NOT NULL,
    "specificationId" TEXT NOT NULL,
    CONSTRAINT "SpecificationAlias_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active'
);

-- CreateTable
CREATE TABLE "SupplierPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "specificationId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "priceUnit" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL,
    "importBatchId" TEXT NOT NULL,
    CONSTRAINT "SupplierPrice_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierPrice_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierPrice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierPrice_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackageType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageName" TEXT NOT NULL,
    "weightCoefficient" DECIMAL NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "UPHRoute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageTypeId" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "standardUph" DECIMAL NOT NULL,
    "importBatchId" TEXT,
    CONSTRAINT "UPHRoute_packageTypeId_fkey" FOREIGN KEY ("packageTypeId") REFERENCES "PackageType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UPHRoute_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StandardUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageTypeId" TEXT NOT NULL,
    "costGroup" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "materialId" TEXT,
    "specificationId" TEXT,
    "standardUsage" DECIMAL NOT NULL,
    "usageUnit" TEXT NOT NULL,
    "pricingMode" TEXT NOT NULL,
    "importBatchId" TEXT,
    CONSTRAINT "StandardUsage_packageTypeId_fkey" FOREIGN KEY ("packageTypeId") REFERENCES "PackageType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StandardUsage_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandardUsage_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StandardUsage_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productName" TEXT NOT NULL,
    "packageTypeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostProject_packageTypeId_fkey" FOREIGN KEY ("packageTypeId") REFERENCES "PackageType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CostProject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "costGroup" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "specificationId" TEXT,
    "supplierId" TEXT,
    "supplierPriceId" TEXT,
    "usage" DECIMAL,
    "usageUnit" TEXT,
    "price" DECIMAL,
    "priceUnit" TEXT,
    "pricingMode" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "priceSource" TEXT,
    "includeInQuote" BOOLEAN NOT NULL DEFAULT true,
    "sourceNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CostProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CostItem_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CostItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CostItem_supplierPriceId_fkey" FOREIGN KEY ("supplierPriceId") REFERENCES "SupplierPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MonthlyExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "laborCost" DECIMAL NOT NULL DEFAULT 0,
    "rentCost" DECIMAL NOT NULL DEFAULT 0,
    "powerCost" DECIMAL NOT NULL DEFAULT 0,
    "depreciationCost" DECIMAL NOT NULL DEFAULT 0,
    "otherManufacturingCost" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MonthlyOutput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "packageTypeId" TEXT NOT NULL,
    "actualOutputK" DECIMAL NOT NULL,
    "weightCoefficient" DECIMAL NOT NULL,
    CONSTRAINT "MonthlyOutput_packageTypeId_fkey" FOREIGN KEY ("packageTypeId") REFERENCES "PackageType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "mainMaterialCostK" DECIMAL NOT NULL,
    "auxiliaryMaterialCostK" DECIMAL NOT NULL,
    "processFeeCostK" DECIMAL NOT NULL,
    "overheadCostK" DECIMAL NOT NULL,
    "totalCostK" DECIMAL NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "inputSnapshot" TEXT NOT NULL,
    "priceSnapshot" TEXT NOT NULL,
    "importBatchSnapshot" TEXT NOT NULL,
    "calculatedById" TEXT NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CostProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CostResult_calculatedById_fkey" FOREIGN KEY ("calculatedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExportRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "costResultId" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExportRecord_costResultId_fkey" FOREIGN KEY ("costResultId") REFERENCES "CostResult" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExportRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Material_materialCode_category_key" ON "Material"("materialCode", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Specification_normalizedKey_key" ON "Specification"("normalizedKey");

-- CreateIndex
CREATE UNIQUE INDEX "SpecificationAlias_alias_key" ON "SpecificationAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierPrice_materialId_specificationId_supplierId_effectiveDate_key" ON "SupplierPrice"("materialId", "specificationId", "supplierId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "PackageType_packageName_key" ON "PackageType"("packageName");

-- CreateIndex
CREATE UNIQUE INDEX "UPHRoute_packageTypeId_processName_key" ON "UPHRoute"("packageTypeId", "processName");

-- CreateIndex
CREATE UNIQUE INDEX "StandardUsage_packageTypeId_costGroup_itemName_specificationId_key" ON "StandardUsage"("packageTypeId", "costGroup", "itemName", "specificationId");

-- CreateIndex
CREATE UNIQUE INDEX "CostProject_productName_packageTypeId_version_key" ON "CostProject"("productName", "packageTypeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyExpense_month_key" ON "MonthlyExpense"("month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyOutput_month_packageTypeId_key" ON "MonthlyOutput"("month", "packageTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CostResult_projectId_version_key" ON "CostResult"("projectId", "version");

