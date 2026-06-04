import { NextResponse } from "next/server";

import { listSupplierOptionsForSpecification } from "@/lib/domain/master-data/supplierPrices";

export async function GET(
  _request: Request,
  context: { params: Promise<{ specificationId: string }> }
) {
  const { specificationId } = await context.params;

  if (!specificationId) {
    return NextResponse.json({ error: "specificationId is required" }, { status: 400 });
  }

  const suppliers = await listSupplierOptionsForSpecification({ specificationId });

  return NextResponse.json({ suppliers });
}
