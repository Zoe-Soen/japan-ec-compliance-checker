export const DEFAULT_WEBSITE_URL = "https://example.com";

export function urlValueOnFirstFocus(value: string): string {
  return value === DEFAULT_WEBSITE_URL ? "" : value;
}

export function normalizeWebsiteUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isWebsiteUrlReady(value: string): boolean {
  try {
    const url = new URL(normalizeWebsiteUrlInput(value));
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".");
  } catch {
    return false;
  }
}
