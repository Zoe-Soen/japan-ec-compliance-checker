import { checkDatabase } from "@checker/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const database = await checkDatabase();
    return Response.json({ ok: true, database });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "数据库不可用" }, { status: 503 });
  }
}
