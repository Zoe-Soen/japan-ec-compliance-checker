import assert from "node:assert/strict";
import pg from "pg";

const expectedTables = [
  "findings",
  "page_snapshots",
  "projects",
  "scan_jobs",
  "usage_ledger",
];

assert.ok(process.env.DATABASE_URL, "DATABASE_URL 未设置");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();

  const tableResult = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  const actualTables = tableResult.rows.map((row) => row.table_name);

  for (const table of expectedTables) {
    assert.ok(actualTables.includes(table), `缺少数据表：${table}`);
  }

  const constraintResult = await client.query(`
    SELECT count(*)::int AS count
    FROM pg_constraint
    WHERE conrelid = 'usage_ledger'::regclass
      AND contype = 'u'
  `);
  assert.ok(constraintResult.rows[0].count >= 1, "用量流水缺少防重复约束");

  console.log(`数据库验收通过：${expectedTables.length} 张核心数据表与用量防重复约束均存在。`);
} finally {
  await client.end();
}
