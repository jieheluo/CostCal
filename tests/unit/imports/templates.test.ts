import { describe, expect, it } from "vitest";

import {
  IMPORT_TEMPLATES,
  TEMPLATE_VERSIONS
} from "../../../src/lib/domain/imports/templates";

describe("import templates", () => {
  it("defines fixed versions for all supported templates", () => {
    expect(TEMPLATE_VERSIONS).toEqual({
      material_price: "MATERIAL_PRICE_V1",
      standard_uph: "STANDARD_UPH_V1",
      standard_usage: "STANDARD_USAGE_V1"
    });
  });

  it("includes required English and Chinese labels for material prices", () => {
    const materialPrice = IMPORT_TEMPLATES.material_price;

    expect(materialPrice.columns.materialCode.labels).toContain("Material Code");
    expect(materialPrice.columns.materialCode.labels).toContain("\u7269\u6599\u7f16\u7801");
    expect(materialPrice.columns.specification.labels).toContain("Specification");
    expect(materialPrice.columns.specification.labels).toContain("\u89c4\u683c");
  });
});
