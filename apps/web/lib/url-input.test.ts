import { describe, expect, it } from "vitest";
import { DEFAULT_WEBSITE_URL, urlValueOnFirstFocus } from "./url-input";

describe("website URL input", () => {
  it("clears the example URL when the input first receives focus", () => {
    expect(urlValueOnFirstFocus(DEFAULT_WEBSITE_URL)).toBe("");
  });

  it("preserves a URL already entered by the user", () => {
    expect(urlValueOnFirstFocus("https://www.yuclassy.com/")).toBe("https://www.yuclassy.com/");
  });
});
