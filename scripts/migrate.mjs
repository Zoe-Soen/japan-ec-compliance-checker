import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL 未设置");

const migrationPath = fileURLToPath(new URL("../packages/db/migrations/001_initial.sql", import.meta.url));
const sql = await readFile(migrationPath, "utf8");
const client = new pg.Client({ connectionString: databaseUrl });

await client.connect();
try {
  await client.query(sql);
  process.stdout.write("数据库迁移完成。\n");
} finally {
  await client.end();
}
