import { retryCheck } from "@checker/db";

export const runtime = "nodejs";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const check = await retryCheck(id);
    if (!check) return Response.json({ error: "没有找到要复查的任务" }, { status: 404 });
    return Response.json({ check }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "无法创建复查任务" }, { status: 500 });
  }
}
