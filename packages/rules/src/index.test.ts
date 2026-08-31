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

  it("recognises common Japanese labels across separate policy pages", () => {
    const splitPages: CrawledPage[] = [
      { url: "https://shop.example/", title: "Shop", kind: "home", linkedFromHome: true, text: "商品 ￥3,980 税込" },
      { url: "https://shop.example/company", title: "特定商取引法に基づく表記", kind: "legal", linkedFromHome: true, text: "販売事業者 株式会社例 代表者 山田 所在地 東京都 電話 03-1234-5678" },
      { url: "https://shop.example/payment", title: "お支払いについて", kind: "payment", linkedFromHome: true, text: "お支払い方法 クレジットカード お支払い時期 注文時" },
      { url: "https://shop.example/shipping", title: "配送について", kind: "shipping", linkedFromHome: true, text: "送料 500円 海外から発送 配送期間 7営業日 関税は購入者負担" },
      { url: "https://shop.example/returns", title: "返品ポリシー", kind: "returns", linkedFromHome: true, text: "返品は7日以内" },
      { url: "https://shop.example/privacy", title: "プライバシーポリシー", kind: "privacy", linkedFromHome: true, text: "個人情報の利用目的 お問い合わせ窓口" },
    ];

    const findings = evaluateRules({ pages: splitPages, scope });
    for (const id of ["R03", "R05", "R09", "R11", "R12", "R13", "R14", "R27", "R28", "R30"]) {
      expect(findings.find((finding) => finding.ruleId === id)?.status, id).toBe("pass");
    }
  });

  it("excludes contact promises from R23 and includes context for real candidates", () => {
    const footerOnly: CrawledPage[] = [
      { url: "https://shop.example/", title: "Shop", kind: "home", linkedFromHome: true, text: "商品 ￥3,980 税込 お問い合わせは受付順に必ずご返信いたします" },
    ];
    expect(evaluateRules({ pages: footerOnly, scope }).find((finding) => finding.ruleId === "R23")?.status).toBe("pass");

    const claimPages: CrawledPage[] = [
      { url: "https://shop.example/", title: "Shop", kind: "home", linkedFromHome: true, text: "商品 ￥3,980 税込" },
      { url: "https://shop.example/products/serum", title: "商品詳細", kind: "product", linkedFromHome: true, text: "この美容液でお肌の悩みが絶対に改善するとは限りません。" },
    ];
    const finding = evaluateRules({ pages: claimPages, scope }).find((item) => item.ruleId === "R23")!;
    expect(finding.status).toBe("unknown");
    expect(finding.sourceUrl).toBe("https://shop.example/products/serum");
    expect(finding.evidence).toContain("絶対");
    expect(finding.evidence).toContain("この美容液");
  });

  it("does not mistake overseas manufacturing for cross-border delivery disclosure", () => {
    const shippingPages: CrawledPage[] = [
      { url: "https://shop.example/", title: "Shop", kind: "home", linkedFromHome: true, text: "商品 ￥3,980 税込" },
      { url: "https://shop.example/shipping", title: "配送", kind: "shipping", linkedFromHome: true, text: "海外製造商品です。配送期間は3から8営業日です。" },
    ];
    const finding = evaluateRules({ pages: shippingPages, scope }).find((item) => item.ruleId === "R30")!;
    expect(finding.status).toBe("issue");
    expect(finding.evidence).toContain("海外发货地");
    expect(finding.evidence).toContain("关税或进口费用");
  });
});
