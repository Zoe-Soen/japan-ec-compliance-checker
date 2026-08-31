import { claimNextJob, closePool, failJob, finishJob, updateJobProgress } from "@checker/db";
import { evaluateRules } from "@checker/rules";
import { crawlSite } from "./crawler";

const pollMs = Number(process.env.CHECKER_WORKER_POLL_MS ?? 1000);
const maxPages = Number(process.env.CHECKER_MAX_PAGES ?? 30);
const timeoutMs = Number(process.env.CHECKER_PAGE_TIMEOUT_MS ?? 12_000);
let stopping = false;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function processNext(): Promise<boolean> {
  const job = await claimNextJob();
  if (!job) return false;
  const started = Date.now();
  process.stdout.write(`[worker] ${job.id} 开始扫描 ${job.url}\n`);
  try {
    const pages = await crawlSite(job.url, {
      maxPages,
      timeoutMs,
      onProgress: async (completed, maximum, stage) => {
        const progress = Math.min(70, 8 + Math.round((completed / Math.max(maximum, 1)) * 62));
        await updateJobProgress(job.id, progress, stage);
      },
    });
    await updateJobProgress(job.id, 82, "正在执行 30 条基础规则");
    const findings = evaluateRules({ pages, scope: job.scope });
    await updateJobProgress(job.id, 94, "正在整理证据与整改建议");
    await finishJob(job.id, pages, findings, Date.now() - started);
    process.stdout.write(`[worker] ${job.id} 完成：${pages.length} 个页面，${findings.length} 条结果\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "扫描发生未知错误";
    await failJob(job.id, message);
    process.stderr.write(`[worker] ${job.id} 失败：${message}\n`);
  }
  return true;
}

async function run(): Promise<void> {
  process.stdout.write("[worker] 本地扫描 Worker 已启动。\n");
  while (!stopping) {
    try {
      const processed = await processNext();
      if (!processed) await wait(pollMs);
    } catch (error) {
      process.stderr.write(`[worker] 任务循环错误：${error instanceof Error ? error.message : String(error)}\n`);
      await wait(Math.max(pollMs, 1500));
    }
  }
  await closePool();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => { stopping = true; });
}

await run();
