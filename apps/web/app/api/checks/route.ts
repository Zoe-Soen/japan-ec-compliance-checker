import { createCheck, listChecks } from "@checker/db";
import { assertSafePublicUrl, UnsafeUrlError } from "@checker/shared";
import { validateCreatePayload } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ checks: await listChecks() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "无法读取检查记录" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = validateCreatePayload(await request.json());
    const normalized = await assertSafePublicUrl(input.url);
    const check = await createCheck({ ...input, url: normalized.href });
    return Response.json({ check }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法创建检查任务";
    const status = error instanceof UnsafeUrlError || message.includes("请输入") || message.includes("检查范围") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
