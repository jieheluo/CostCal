export const TEMPLATE_VERSIONS = {
  material_price: "MATERIAL_PRICE_V1",
  standard_uph: "STANDARD_UPH_V1",
  standard_usage: "STANDARD_USAGE_V1"
} as const;

export type ImportTemplateType = keyof typeof TEMPLATE_VERSIONS;

export type TemplateColumn = {
  key: string;
  labels: readonly string[];
  required: boolean;
};

export type ImportTemplate = {
  type: ImportTemplateType;
  version: (typeof TEMPLATE_VERSIONS)[ImportTemplateType];
  columns: Record<string, TemplateColumn>;
  uniqueKeyColumns: readonly string[];
};

const MATERIAL_CODE_ZH = "\u7269\u6599\u7f16\u7801";
const MATERIAL_CATEGORY_ZH = "\u7269\u6599\u7c7b\u522b";
const MATERIAL_NAME_ZH = "\u7269\u6599\u540d\u79f0";
const DEFAULT_UNIT_ZH = "\u9ed8\u8ba4\u5355\u4f4d";
const SPECIFICATION_ZH = "\u89c4\u683c";
const SUPPLIER_ZH = "\u4f9b\u5e94\u5546";
const PRICE_ZH = "\u4ef7\u683c";
const PRICE_UNIT_ZH = "\u4ef7\u683c\u5355\u4f4d";
const EFFECTIVE_DATE_ZH = "\u751f\u6548\u65e5\u671f";
const PACKAGE_TYPE_ZH = "\u5c01\u88c5\u7c7b\u578b";
const PROCESS_NAME_ZH = "\u5de5\u5e8f";
const STANDARD_UPH_ZH = "\u6807\u51c6UPH";
const COST_GROUP_ZH = "\u6210\u672c\u5206\u7ec4";
const ITEM_NAME_ZH = "\u9879\u76ee\u540d\u79f0";
const STANDARD_USAGE_ZH = "\u6807\u51c6\u7528\u91cf";
const USAGE_UNIT_ZH = "\u7528\u91cf\u5355\u4f4d";
const PRICING_MODE_ZH = "\u8ba1\u4ef7\u65b9\u5f0f";

const column = (
  key: string,
  labels: readonly string[],
  required = true
): TemplateColumn => ({ key, labels, required });

export const IMPORT_TEMPLATES: Record<ImportTemplateType, ImportTemplate> = {
  material_price: {
    type: "material_price",
    version: TEMPLATE_VERSIONS.material_price,
    columns: {
      materialCode: column("materialCode", ["Material Code", MATERIAL_CODE_ZH]),
      materialCategory: column("materialCategory", ["Material Category", MATERIAL_CATEGORY_ZH]),
      materialName: column("materialName", ["Material Name", MATERIAL_NAME_ZH]),
      defaultUnit: column("defaultUnit", ["Default Unit", DEFAULT_UNIT_ZH]),
      specification: column("specification", ["Specification", SPECIFICATION_ZH]),
      supplier: column("supplier", ["Supplier", SUPPLIER_ZH]),
      price: column("price", ["Price", PRICE_ZH]),
      priceUnit: column("priceUnit", ["Price Unit", PRICE_UNIT_ZH]),
      effectiveDate: column("effectiveDate", ["Effective Date", EFFECTIVE_DATE_ZH])
    },
    uniqueKeyColumns: ["materialCode", "materialCategory", "specification", "supplier", "effectiveDate"]
  },
  standard_uph: {
    type: "standard_uph",
    version: TEMPLATE_VERSIONS.standard_uph,
    columns: {
      packageType: column("packageType", ["Package Type", PACKAGE_TYPE_ZH]),
      processName: column("processName", ["Process Name", PROCESS_NAME_ZH]),
      standardUph: column("standardUph", ["Standard UPH", STANDARD_UPH_ZH])
    },
    uniqueKeyColumns: ["packageType", "processName"]
  },
  standard_usage: {
    type: "standard_usage",
    version: TEMPLATE_VERSIONS.standard_usage,
    columns: {
      packageType: column("packageType", ["Package Type", PACKAGE_TYPE_ZH]),
      costGroup: column("costGroup", ["Cost Group", COST_GROUP_ZH]),
      itemName: column("itemName", ["Item Name", ITEM_NAME_ZH]),
      materialCode: column("materialCode", ["Material Code", MATERIAL_CODE_ZH], false),
      specification: column("specification", ["Specification", SPECIFICATION_ZH]),
      standardUsage: column("standardUsage", ["Standard Usage", STANDARD_USAGE_ZH]),
      usageUnit: column("usageUnit", ["Usage Unit", USAGE_UNIT_ZH]),
      pricingMode: column("pricingMode", ["Pricing Mode", PRICING_MODE_ZH])
    },
    uniqueKeyColumns: ["packageType", "costGroup", "itemName", "specification"]
  }
};
