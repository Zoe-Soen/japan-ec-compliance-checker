export const DEFAULT_WEBSITE_URL = "https://example.com";

export function urlValueOnFirstFocus(value: string): string {
  return value === DEFAULT_WEBSITE_URL ? "" : value;
}
