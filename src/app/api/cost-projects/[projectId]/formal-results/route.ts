import { NextResponse } from "next/server";

import { calculateEstimate } from "@/lib/domain/costing/calculateEstimate";
import { createFormalResult, type FormalCostItem } from "@/lib/domain/costing/createFormalResult";
import {
  getDemoCalculatedById,
  replaceProjectCostItems
} from "@/lib/domain/costing/workbenchPersistence";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type FormalResultRequest = {
  costItems?: FormalCostItem[];
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const body = (await request.json()) as FormalResultRequest;

  if (!Array.isArray(body.costItems)) {
    return NextResponse.json({ error: "costItems are required" }, { status: 400 });
  }

  try {
    await replaceProjectCostItems(projectId, body.costItems);
    const calculatedById = await getDemoCalculatedById();
    const result = await createFormalResult({
      dbClient: db,
      projectId,
      calculatedById,
      costItems: body.costItems,
      formulaVersion: "cost-engine-v1"
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Formal calculation failed";
    if (!message.startsWith("Formal calculation blocked:")) {
      const estimate = calculateEstimate(body.costItems);
      if (estimate.blockingIssues.length === 0) {
        return NextResponse.json({
          result: {
            id: `demo-result-${Date.now()}`,
            version: "v1",
            totalCostK: estimate.totalCostK
          },
          warning: message
        });
      }
    }

    return NextResponse.json(
      { error: message },
      { status: 422 }
    );
  }
}
