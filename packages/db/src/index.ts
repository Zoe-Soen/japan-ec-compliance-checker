import pg from "pg";
import type { CreateCheckInput, CrawledPage, Finding, JobStatus, ScopeAnswers, ScanType } from "@checker/shared";

const { Pool } = pg;

let pool: pg.Pool | undefined;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL 未设置");
    pool = new Pool({ connectionString, max: 8, idleTimeoutMillis: 10_000 });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) await pool.end();
  pool = undefined;
}

export async function checkDatabase(): Promise<{ now: string }> {
  const result = await getPool().query<{ now: string }>("SELECT now()::text AS now");
  return result.rows[0];
}

export interface JobRecord {
  id: string;
  projectId: string;
  projectName: string;
  url: string;
  scope: ScopeAnswers;
  scanType: ScanType;
  status: JobStatus;
  progress: number;
  stage: string;
  ruleVersion: string;
  error: string | null;
  pageCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

function mapJob(row: Record<string, unknown>): JobRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    projectName: String(row.project_name),
    url: String(row.url),
    scope: row.scope as ScopeAnswers,
    scanType: row.scan_type as ScanType,
    status: row.status as JobStatus,
    progress: Number(row.progress),
    stage: String(row.stage),
    ruleVersion: String(row.rule_version),
    error: row.error ? String(row.error) : null,
    pageCount: Number(row.page_count),
    createdAt: new Date(String(row.created_at)).toISOString(),
    startedAt: row.started_at ? new Date(String(row.started_at)).toISOString() : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)).toISOString() : null,
  };
}

const jobSelect = `
  SELECT j.*, p.name AS project_name, p.url, p.scope
  FROM scan_jobs j
  JOIN projects p ON p.id = j.project_id
`;

export async function createCheck(input: CreateCheckInput): Promise<JobRecord> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const project = await client.query<{ id: string }>(
      "INSERT INTO projects(name, url, scope) VALUES ($1, $2, $3::jsonb) RETURNING id",
      [input.name, input.url, JSON.stringify(input.scope)],
    );
    const job = await client.query(
      `INSERT INTO scan_jobs(project_id, scan_type)
       VALUES ($1, $2)
       RETURNING *`,
      [project.rows[0].id, input.scanType ?? "site_full"],
    );
    await client.query("COMMIT");
    return mapJob({ ...job.rows[0], project_name: input.name, url: input.url, scope: input.scope });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listChecks(limit = 20): Promise<Array<JobRecord & { summary: Record<string, number> }>> {
  const result = await getPool().query(
    `${jobSelect}
     ORDER BY j.created_at DESC
     LIMIT $1`,
    [limit],
  );
  const jobs = result.rows.map(mapJob);
  if (!jobs.length) return [];
  const summaries = await getPool().query<{ scan_job_id: string; status: string; count: string }>(
    `SELECT scan_job_id, status, count(*)::text AS count
     FROM findings WHERE scan_job_id = ANY($1::uuid[])
     GROUP BY scan_job_id, status`,
    [jobs.map((job) => job.id)],
  );
  const byJob = new Map<string, Record<string, number>>();
  for (const row of summaries.rows) {
    const summary = byJob.get(row.scan_job_id) ?? {};
    summary[row.status] = Number(row.count);
    byJob.set(row.scan_job_id, summary);
  }
  return jobs.map((job) => ({ ...job, summary: byJob.get(job.id) ?? {} }));
}

export async function getCheck(id: string): Promise<(JobRecord & { findings: Finding[]; pages: CrawledPage[]; usage: Record<string, number> | null }) | null> {
  const jobResult = await getPool().query(`${jobSelect} WHERE j.id = $1`, [id]);
  if (!jobResult.rowCount) return null;
  const [findingResult, pageResult, usageResult] = await Promise.all([
    getPool().query("SELECT * FROM findings WHERE scan_job_id = $1 ORDER BY CASE risk WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, rule_id", [id]),
    getPool().query("SELECT * FROM page_snapshots WHERE scan_job_id = $1 ORDER BY fetched_at", [id]),
    getPool().query("SELECT units::float, page_count, duration_ms FROM usage_ledger WHERE scan_job_id = $1 AND event_type = 'scan_completed'", [id]),
  ]);
  const findings: Finding[] = findingResult.rows.map((row) => ({
    ruleId: row.rule_id,
    title: row.title,
    category: row.category,
    risk: row.risk,
    status: row.status,
    sourceUrl: row.source_url,
    evidence: row.evidence,
    explanation: row.explanation,
    recommendation: row.recommendation,
    basis: row.basis,
    confidence: row.confidence,
  }));
  const pages: CrawledPage[] = pageResult.rows.map((row) => ({
    url: row.url,
    title: row.title,
    text: row.text_excerpt,
    kind: row.kind,
    linkedFromHome: row.linked_from_home,
  }));
  return {
    ...mapJob(jobResult.rows[0]),
    findings,
    pages,
    usage: usageResult.rowCount ? usageResult.rows[0] : null,
  };
}

export async function claimNextJob(): Promise<JobRecord | null> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `${jobSelect}
       WHERE j.status = 'queued'
       ORDER BY j.created_at
       FOR UPDATE OF j SKIP LOCKED
       LIMIT 1`,
    );
    if (!result.rowCount) {
      await client.query("COMMIT");
      return null;
    }
    const id = result.rows[0].id;
    await client.query(
      "UPDATE scan_jobs SET status = 'running', progress = 3, stage = '正在连接网站', started_at = now(), error = NULL WHERE id = $1",
      [id],
    );
    await client.query("COMMIT");
    return mapJob({ ...result.rows[0], status: "running", progress: 3, stage: "正在连接网站", started_at: new Date() });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateJobProgress(id: string, progress: number, stage: string): Promise<void> {
  await getPool().query("UPDATE scan_jobs SET progress = $2, stage = $3 WHERE id = $1 AND status = 'running'", [id, progress, stage]);
}

export async function finishJob(id: string, pages: CrawledPage[], findings: Finding[], durationMs: number): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM page_snapshots WHERE scan_job_id = $1", [id]);
    await client.query("DELETE FROM findings WHERE scan_job_id = $1", [id]);
    for (const page of pages) {
      await client.query(
        `INSERT INTO page_snapshots(scan_job_id, url, title, kind, text_excerpt, linked_from_home)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, page.url, page.title, page.kind, page.text.slice(0, 12_000), page.linkedFromHome],
      );
    }
    for (const finding of findings) {
      await client.query(
        `INSERT INTO findings(scan_job_id, rule_id, title, category, risk, status, source_url, evidence, explanation, recommendation, basis, confidence)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [id, finding.ruleId, finding.title, finding.category, finding.risk, finding.status, finding.sourceUrl, finding.evidence, finding.explanation, finding.recommendation, finding.basis, finding.confidence],
      );
    }
    await client.query(
      `INSERT INTO usage_ledger(scan_job_id, event_type, units, page_count, duration_ms)
       VALUES ($1, 'scan_completed', 1, $2, $3)
       ON CONFLICT (scan_job_id, event_type) DO UPDATE SET page_count = EXCLUDED.page_count, duration_ms = EXCLUDED.duration_ms`,
      [id, pages.length, durationMs],
    );
    await client.query(
      "UPDATE scan_jobs SET status = 'succeeded', progress = 100, stage = '检查完成', page_count = $2, completed_at = now() WHERE id = $1",
      [id, pages.length],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function failJob(id: string, message: string): Promise<void> {
  await getPool().query(
    "UPDATE scan_jobs SET status = 'failed', stage = '检查失败', error = $2, completed_at = now() WHERE id = $1",
    [id, message.slice(0, 1000)],
  );
}

export async function retryCheck(id: string): Promise<JobRecord | null> {
  const current = await getCheck(id);
  if (!current) return null;
  return createCheck({ name: current.projectName, url: current.url, scope: current.scope, scanType: current.scanType });
}
