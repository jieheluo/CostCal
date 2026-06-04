import { NextResponse } from "next/server";

import { createWorkbenchProject } from "@/lib/domain/costing/workbenchPersistence";

type CreateProjectRequest = {
  productName?: string;
  version?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CreateProjectRequest;
  const productName = body.productName?.trim();
  const version = body.version?.trim();

  if (!productName || !version) {
    return NextResponse.json(
      { error: "productName and version are required" },
      { status: 400 }
    );
  }

  try {
    const result = await createWorkbenchProject({ productName, version });

    return NextResponse.json({ project: result.project });
  } catch (error) {
    return NextResponse.json({
      project: {
        id: `demo-${Date.now()}`,
        productName,
        version,
        status: "draft"
      },
      warning: error instanceof Error ? error.message : "Database unavailable"
    });
  }
}
