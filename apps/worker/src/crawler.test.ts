import { describe, expect, it } from "vitest";
import { classifyPage, linkPriority } from "./crawler";

describe("crawler discovery helpers", () => {
  it("classifies key Japanese ecommerce pages", () => {
    expect(classifyPage("https://example.com/legal", "特定商取引法に基づく表記", "", false)).toBe("legal");
    expect(classifyPage("https://example.com/privacy", "プライバシーポリシー", "", false)).toBe("privacy");
    expect(classifyPage("https://example.com/returns", "返品・返金", "", false)).toBe("returns");
    expect(classifyPage("https://example.com", "Shop", "", true)).toBe("home");
  });

  it("prioritizes legal and policy links over generic pages", () => {
    expect(linkPriority("https://example.com/legal", "特定商取引法")).toBeLessThan(linkPriority("https://example.com/blog", "ニュース"));
    expect(linkPriority("https://example.com/privacy", "プライバシー")).toBeLessThan(linkPriority("https://example.com/about", "会社紹介"));
  });
});
