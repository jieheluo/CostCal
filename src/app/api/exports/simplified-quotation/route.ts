import { type Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { assertFormalResultExists } from "@/lib/domain/exports/exportGuards";
import { buildSimplifiedQuotationExcel } from "@/lib/domain/exports/simplifiedQuotationExcel";

type ExportRequest = {
  costResultId?: string;
  role?: Role;
  targetGrossMargin?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ExportRequest;

  if (!body.role || !hasPermission(body.role, "export_simplified_quote")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!body.costResultId) {
    return NextResponse.json({ error: "costResultId is required" }, { status: 400 });
  }

  const result = assertFormalResultExists(await findExportableResult(body.costResultId));
  const file = buildSimplifiedQuotationExcel({
    result,
    targetGrossMargin: body.targetGrossMargin ?? 0.25,
    quotationDate: new Date().toISOString().slice(0, 10)
  });

  return new Response(new Uint8Array(file), {
    headers: excelHeaders("simplified-quotation.xlsx")
  });
}

async function findExportableResult(costResultId: string) {
  const result = await db.costResult.findUnique({
    where: { id: costResultId },
    include: {
      project: {
        include: { packageType: true }
      }
    }
  });

  if (!result) {
    return null;
  }

  return {
    ...result,
    mainMaterialCostK: result.mainMaterialCostK.toNumber(),
    auxiliaryMaterialCostK: result.auxiliaryMaterialCostK.toNumber(),
    processFeeCostK: result.processFeeCostK.toNumber(),
    overheadCostK: result.overheadCostK.toNumber(),
    totalCostK: result.totalCostK.toNumber()
  };
}

function excelHeaders(fileName: string) {
  return {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${fileName}"`
  };
}
