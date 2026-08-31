import { describe, expect, it } from "vitest";
import type { CrawledPage, ScopeAnswers } from "@checker/shared";
import { evaluateRules, ruleDefinitions, summarizeFindings } from "./index";

const scope: ScopeAnswers = { location: "overseas", entity: "company", category: "ordinary", sales: "single", shipping: "overseas" };
const pages: CrawledPage[] = [
  { url: "https://shop.example/", title: "日本向けショップ", kind: "home", linkedFromHome: true, text: "商品 ¥3,980 税込" },
  { url: "https://shop.example/legal", title: "特定商取引法に基づく表記", kind: "legal", linkedFromHome: true, text: "販売業者 株式会社例 代表者 山田 住所 東京都 電話 03-1234-5678 支払方法 クレジットカード 支払時期 注文時 発送 3営業日 返品 7日以内 送料 500円" },
  { url: "https://shop.example/privacy", title: "プライバシーポリシー", kind: "privacy", linkedFromHome: true, text: "個人情報の利用目的 お問い合わせ窓口" },
  { url: "https://shop.example/shipping", title: "配送", kind: "shipping", linkedFromHome: true, text: "海外発送 配送 7営業日 関税は購入者負担" },
];

describe("MVP rule engine", () => {
  it("contains exactly 30 stable rule IDs", () => {
    expect(ruleDefinitions).toHaveLength(30);
    expect(ruleDefinitions.map((rule) => rule.id)).toEqual(Array.from({ length: 30 }, (_, index) => `R${String(index + 1).padStart(2, "0")}`));
  });

  it("evaluates every rule without inventing checkout evidence", () => {
    const findings = evaluateRules({ pages, scope });
    expect(findings).toHaveLength(30);
    expect(findings.find((finding) => finding.ruleId === "R01")?.status).toBe("pass");
    expect(findings.find((finding) => finding.ruleId === "R15")?.status).toBe("unknown");
    expect(findings.find((finding) => finding.ruleId === "R21")?.status).toBe("not_applicable");
    expect(findings.find((finding) => finding.ruleId === "R30")?.status).toBe("pass");
  });

  it("flags missing core pages and keeps four-state counts", () => {
    const findings = evaluateRules({ pages: pages.slice(0, 1), scope });
    expect(findings.find((finding) => finding.ruleId === "R01")?.status).toBe("issue");
    expect(findings.find((finding) => finding.ruleId === "R27")?.status).toBe("issue");
    const summary = summarizeFindings(findings);
    expect(Object.keys(summary).sort()).toEqual(["issue", "not_applicable", "pass", "unknown"].sort());
    expect(Object.values(summary).reduce((sum, value) => sum + value, 0)).toBe(30);
  });
});
