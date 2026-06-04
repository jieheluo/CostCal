import { NextResponse } from "next/server";

import {
  getWorkbenchProject,
  replaceProjectCostItems
} from "@/lib/domain/costing/workbenchPersistence";
import type { FormalCostItem } from "@/lib/domain/costing/createFormalResult";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type UpdateProjectRequest = {
  costItems?: FormalCostItem[];
};

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const project = await getWorkbenchProject(projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { projectId } = await context.params;
  const body = (await request.json()) as UpdateProjectRequest;

  if (!Array.isArray(body.costItems)) {
    return NextResponse.json({ error: "costItems are required" }, { status: 400 });
  }

  const project = await replaceProjectCostItems(projectId, body.costItems);

  return NextResponse.json({ project });
}
