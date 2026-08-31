import { getCheck } from "@checker/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const check = await getCheck(id);
    if (!check) return Response.json({ error: "没有找到该检查任务" }, { status: 404 });
    return Response.json({ check }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "无法读取检查结果" }, { status: 500 });
  }
}
