import { type Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { assertFormalResultExists } from "@/lib/domain/exports/exportGuards";
import { demoExportResult } from "@/lib/domain/exports/exportTypes";
import { buildInternalDetailExcel } from "@/lib/domain/exports/internalDetailExcel";

type ExportRequest = {
  costResultId?: string;
  role?: Role;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ExportRequest;

  if (!body.role || !hasPermission(body.role, "export_internal_detail")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!body.costResultId) {
    return NextResponse.json({ error: "costResultId is required" }, { status: 400 });
  }

  const result = assertFormalResultExists(await findExportableResult(body.costResultId));
  const file = buildInternalDetailExcel(result);

  return new Response(new Uint8Array(file), {
    headers: excelHeaders("internal-detail.xlsx")
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const costResultId = url.searchParams.get("costResultId");
  const role = url.searchParams.get("role") as Role | null;

  if (!role || !hasPermission(role, "export_internal_detail")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!costResultId) {
    return NextResponse.json({ error: "costResultId is required" }, { status: 400 });
  }

  const result = costResultId.startsWith("demo-result")
    ? demoExportResult(costResultId)
    : assertFormalResultExists(await findExportableResult(costResultId));
  const file = buildInternalDetailExcel(result);

  return new Response(new Uint8Array(file), {
    headers: excelHeaders("internal-detail.xlsx")
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
