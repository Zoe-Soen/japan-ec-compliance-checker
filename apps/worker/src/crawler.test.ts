import { describe, expect, it } from "vitest";
import { classifyPage, linkPriority } from "./crawler";

describe("crawler discovery helpers", () => {
  it("classifies key Japanese ecommerce pages", () => {
    expect(classifyPage("https://example.com/legal", "特定商取引法に基づく表記", "", false)).toBe("legal");
    expect(classifyPage("https://example.com/privacy", "プライバシーポリシー", "", false)).toBe("privacy");
    expect(classifyPage("https://example.com/returns", "返品・返金", "", false)).toBe("returns");
    expect(classifyPage("https://example.com/payment", "お支払いについて", "", false)).toBe("payment");
    expect(classifyPage("https://example.com", "Shop", "", true)).toBe("home");
  });

  it("does not let shared policy navigation override page identity", () => {
    const sharedNavigation = "特定商取引法に基づく表記 プライバシーポリシー 配送について";
    expect(classifyPage("https://example.com/policies/privacy-policy.html", "プライバシーポリシー", sharedNavigation)).toBe("privacy");
    expect(classifyPage("https://example.com/help/shipping", "配送について", sharedNavigation)).toBe("shipping");
    expect(classifyPage("https://example.com/help/payment", "お支払いについて", sharedNavigation)).toBe("payment");
    expect(classifyPage("https://example.com/account/login.html", "ログイン", sharedNavigation)).toBe("other");
    expect(classifyPage("https://example.com/linen-shirt-p-5263.html", "リネンシャツ", sharedNavigation)).toBe("product");
  });

  it("prioritizes legal and policy links over generic pages", () => {
    expect(linkPriority("https://example.com/legal", "特定商取引法")).toBeLessThan(linkPriority("https://example.com/blog", "ニュース"));
    expect(linkPriority("https://example.com/privacy", "プライバシー")).toBeLessThan(linkPriority("https://example.com/about", "会社紹介"));
  });
});
