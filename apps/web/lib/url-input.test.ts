import { describe, expect, it } from "vitest";
import { DEFAULT_WEBSITE_URL, isWebsiteUrlReady, normalizeWebsiteUrlInput, urlValueOnFirstFocus } from "./url-input";

describe("website URL input", () => {
  it("clears the example URL when the input first receives focus", () => {
    expect(urlValueOnFirstFocus(DEFAULT_WEBSITE_URL)).toBe("");
  });

  it("preserves a URL already entered by the user", () => {
    expect(urlValueOnFirstFocus("https://www.yuclassy.com/")).toBe("https://www.yuclassy.com/");
  });

  it("accepts a bare domain and normalizes it to HTTPS", () => {
    expect(isWebsiteUrlReady("www.yuclassy.com")).toBe(true);
    expect(normalizeWebsiteUrlInput("www.yuclassy.com")).toBe("https://www.yuclassy.com");
  });

  it("keeps complete URLs and rejects incomplete input", () => {
    expect(normalizeWebsiteUrlInput(" https://www.yuclassy.com/ ")).toBe("https://www.yuclassy.com/");
    expect(isWebsiteUrlReady("https://www.yuclassy.com/")).toBe(true);
    expect(isWebsiteUrlReady("https://")).toBe(false);
    expect(isWebsiteUrlReady("localhost")).toBe(false);
  });
});
