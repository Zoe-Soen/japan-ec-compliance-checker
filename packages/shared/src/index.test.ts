import { describe, expect, it } from "vitest";
import { isSameSite, isUnsafeIp, normalizePublicUrl, UnsafeUrlError } from "./index";

describe("URL safety", () => {
  it.each(["127.0.0.1", "10.0.0.1", "172.16.0.1", "192.168.1.1", "169.254.169.254", "::1", "fc00::1"])("blocks private address %s", (address) => {
    expect(isUnsafeIp(address)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])("allows public address %s", (address) => {
    expect(isUnsafeIp(address)).toBe(false);
  });

  it("normalizes a public URL and strips the fragment", () => {
    expect(normalizePublicUrl("https://example.com/shop#detail").href).toBe("https://example.com/shop");
  });

  it("rejects local and credentialed URLs", () => {
    expect(() => normalizePublicUrl("http://localhost")).toThrow(UnsafeUrlError);
    expect(() => normalizePublicUrl("https://user:secret@example.com")).toThrow(UnsafeUrlError);
  });

  it("recognizes same-site subdomains", () => {
    expect(isSameSite(new URL("https://shop.example.com/a"), new URL("https://example.com"))).toBe(true);
    expect(isSameSite(new URL("https://example.org"), new URL("https://example.com"))).toBe(false);
  });
});
