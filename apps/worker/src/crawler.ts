import { chromium, type Browser, type BrowserContext } from "playwright-core";
import { assertSafePublicUrl, isSameSite, type CrawledPage } from "@checker/shared";

const priorityPatterns = [
  /特定商取引|特商法|legal|commercial/i,
  /支払|決済|payment/i,
  /返品|返金|キャンセル|return|refund/i,
  /送料|配送|発送|shipping|delivery/i,
  /privacy|プライバシー|個人情報/i,
  /利用規約|terms|guide/i,
  /contact|問い合わせ|連絡/i,
  /product|products|商品|item/i,
];

export function classifyPage(url: string, title: string, text: string, isHome = false, linkLabel = ""): CrawledPage["kind"] {
  if (isHome) return "home";
  // Page identity must come from its URL, title, or clicked label. Shared headers and
  // footers often mention every policy page and must not decide the page kind.
  const identity = `${url} ${title} ${linkLabel}`;
  if (/privacy|プライバシー|個人情報保護/i.test(identity)) return "privacy";
  if (/特定商取引|特商法|tokusho|commercial|policies\/company/i.test(identity)) return "legal";
  if (/支払|決済|payment/i.test(identity)) return "payment";
  if (/返品|返金|キャンセル|return|refund|exchange/i.test(identity)) return "returns";
  if (/送料|配送|発送|shipping|delivery/i.test(identity)) return "shipping";
  if (/利用規約|terms|規約/i.test(identity)) return "terms";
  if (/問い合わせ|contact|連絡先/i.test(identity)) return "contact";
  if (/product|products|商品|item|collections|[-/]p-\d+/i.test(identity)) return "product";

  // If URL, title and clicked label provide no identity, keeping the page as
  // "other" is safer than guessing from shared navigation in its body.
  return "other";
}

export function linkPriority(url: string, label: string): number {
  const value = `${url} ${label}`;
  const index = priorityPatterns.findIndex((pattern) => pattern.test(value));
  return index === -1 ? 100 : index;
}

function cleanText(value: string): string {
  return value.replace(/[\t\r ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 80_000);
}

async function readStableBodyText(page: import("playwright-core").Page, timeoutMs: number): Promise<string> {
  const deadline = Date.now() + Math.min(timeoutMs, 3_000);
  let previous = "";
  let stableReads = 0;

  // Dynamic storefronts commonly render policy content after DOMContentLoaded.
  await page.waitForLoadState("networkidle", { timeout: Math.min(timeoutMs, 1_500) }).catch(() => undefined);
  while (Date.now() < deadline) {
    const current = cleanText(await page.locator("body").innerText({ timeout: Math.min(timeoutMs, 5_000) }).catch(() => ""));
    if (current && current === previous) stableReads += 1;
    else stableReads = 0;
    previous = current;
    if (stableReads >= 1) break;
    await page.waitForTimeout(200);
  }
  return previous;
}

async function launchBrowser(): Promise<Browser> {
  const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  if (executablePath) return chromium.launch({ headless: true, executablePath });
  return chromium.launch({ headless: true, channel: process.env.CHECKER_CHROME_CHANNEL || "chrome" });
}

async function protectContext(context: BrowserContext): Promise<void> {
  await context.route("**/*", async (route) => {
    const request = route.request();
    const type = request.resourceType();
    if (["image", "media", "font"].includes(type)) return route.abort("blockedbyclient");
    const raw = request.url();
    if (raw.startsWith("data:") || raw.startsWith("blob:") || raw === "about:blank") return route.continue();
    try {
      await assertSafePublicUrl(raw);
      return route.continue();
    } catch {
      return route.abort("blockedbyclient");
    }
  });
}

interface QueueItem {
  url: string;
  label: string;
  linkedFromHome: boolean;
}

export interface CrawlOptions {
  maxPages?: number;
  timeoutMs?: number;
  onProgress?: (completed: number, maxPages: number, stage: string) => Promise<void> | void;
}

export async function crawlSite(rawUrl: string, options: CrawlOptions = {}): Promise<CrawledPage[]> {
  const startUrl = await assertSafePublicUrl(rawUrl);
  const maxPages = Math.max(1, Math.min(options.maxPages ?? 30, 30));
  const timeoutMs = options.timeoutMs ?? 12_000;
  const browser = await launchBrowser();
  const context = await browser.newContext({
    acceptDownloads: false,
    ignoreHTTPSErrors: false,
    javaScriptEnabled: true,
    locale: "ja-JP",
    serviceWorkers: "block",
    userAgent: "JapanECComplianceChecker/0.1 (+local MVP; public-page audit)",
  });
  await protectContext(context);
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(timeoutMs);
  page.setDefaultTimeout(timeoutMs);

  const queue: QueueItem[] = [{ url: startUrl.href, label: "首页", linkedFromHome: true }];
  const queued = new Set(queue.map((item) => item.url));
  const visited = new Set<string>();
  const results: CrawledPage[] = [];

  try {
    while (queue.length && results.length < maxPages) {
      queue.sort((a, b) => linkPriority(a.url, a.label) - linkPriority(b.url, b.label));
      const item = queue.shift()!;
      if (visited.has(item.url)) continue;
      visited.add(item.url);
      await options.onProgress?.(results.length, maxPages, results.length ? "正在发现关键页面" : "正在读取首页");

      try {
        const response = await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: timeoutMs });
        if (!response || response.status() >= 500) throw new Error(`页面返回 ${response?.status() ?? "无响应"}`);
        const finalUrl = await assertSafePublicUrl(page.url());
        if (!isSameSite(finalUrl, startUrl)) continue;
        const title = cleanText(await page.title());
        const bodyText = await readStableBodyText(page, timeoutMs);
        if (!bodyText) continue;
        const isHome = results.length === 0;
        results.push({
          url: finalUrl.href,
          title,
          text: bodyText,
          kind: classifyPage(finalUrl.href, title, bodyText, isHome, item.label),
          linkedFromHome: item.linkedFromHome,
        });

        const links = await page.locator("a[href]").evaluateAll((anchors) => anchors.slice(0, 500).map((anchor) => ({
          href: (anchor as HTMLAnchorElement).href,
          label: (anchor.textContent || "").trim().slice(0, 100),
        })));
        for (const link of links) {
          try {
            const candidate = new URL(link.href, finalUrl);
            candidate.hash = "";
            if (!['http:', 'https:'].includes(candidate.protocol) || !isSameSite(candidate, startUrl)) continue;
            if (/\.(pdf|zip|jpe?g|png|gif|webp|svg|mp4|mp3)$/i.test(candidate.pathname)) continue;
            const normalized = candidate.href;
            if (queued.has(normalized) || visited.has(normalized)) continue;
            queued.add(normalized);
            queue.push({ url: normalized, label: link.label, linkedFromHome: isHome });
          } catch {
            // Ignore malformed links found in third-party themes.
          }
        }
      } catch (error) {
        if (!results.length) throw error;
      }
    }
    if (!results.length) throw new Error("没有取得可读取的公开页面。");
    await options.onProgress?.(results.length, maxPages, "页面读取完成");
    return results;
  } finally {
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}
