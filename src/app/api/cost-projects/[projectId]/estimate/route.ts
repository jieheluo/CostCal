import { NextResponse } from "next/server";

import { calculateEstimate } from "@/lib/domain/costing/calculateEstimate";
import type { FormalCostItem } from "@/lib/domain/costing/createFormalResult";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type EstimateRequest = {
  costItems?: FormalCostItem[];
};

export async function POST(request: Request, context: RouteContext) {
  await context.params;
  const body = await readJson(request);

  if (!Array.isArray(body.costItems)) {
    return NextResponse.json({ error: "costItems are required" }, { status: 400 });
  }

  const estimate = calculateEstimate(body.costItems);

  return NextResponse.json({ estimate });
}

async function readJson(request: Request): Promise<EstimateRequest> {
  try {
    return (await request.json()) as EstimateRequest;
  } catch {
    return {};
  }
}
