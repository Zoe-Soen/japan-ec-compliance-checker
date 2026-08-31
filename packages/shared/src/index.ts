import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ScanType = "site_full" | "product_quick" | "recheck";
export type JobStatus = "queued" | "running" | "succeeded" | "partially_succeeded" | "failed" | "cancelled";
export type FindingStatus = "pass" | "issue" | "unknown" | "not_applicable";
export type RiskLevel = "high" | "medium" | "low";

export interface ScopeAnswers {
  location: "japan" | "overseas";
  entity: "company" | "individual";
  category: "ordinary" | "cosmetics" | "food" | "other_high_risk";
  sales: "single" | "subscription" | "both";
  shipping: "japan" | "overseas" | "both";
}

export interface CreateCheckInput {
  name: string;
  url: string;
  scope: ScopeAnswers;
  scanType?: ScanType;
}

export interface CrawledPage {
  url: string;
  title: string;
  text: string;
  kind: "home" | "legal" | "privacy" | "shipping" | "returns" | "terms" | "product" | "contact" | "other";
  linkedFromHome: boolean;
}

export interface Finding {
  ruleId: string;
  title: string;
  category: string;
  risk: RiskLevel;
  status: FindingStatus;
  sourceUrl: string | null;
  evidence: string;
  explanation: string;
  recommendation: string;
  basis: string;
  confidence: "high" | "medium" | "low";
}

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export function normalizePublicUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new UnsafeUrlError("请输入完整的 http 或 https 网站地址。");
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new UnsafeUrlError("只支持 http 或 https 网站地址。");
  if (url.username || url.password) throw new UnsafeUrlError("网站地址不能包含用户名或密码。");
  if (url.port && !['80', '443'].includes(url.port)) throw new UnsafeUrlError("当前版本不扫描使用特殊端口的网站。");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    throw new UnsafeUrlError("不能扫描本机或内部网络地址。");
  }
  url.hash = "";
  return url;
}

function isUnsafeIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) || (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0) || a >= 224;
}

export function isUnsafeIp(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isUnsafeIpv4(address);
  if (version !== 6) return true;
  const value = address.toLowerCase();
  if (value.startsWith("::ffff:")) return isUnsafeIpv4(value.slice(7));
  return value === "::" || value === "::1" || value.startsWith("fc") || value.startsWith("fd") ||
    /^fe[89ab]/.test(value) || value.startsWith("ff") || value.startsWith("2001:db8");
}

export async function assertSafePublicUrl(raw: string): Promise<URL> {
  const url = normalizePublicUrl(raw);
  if (isIP(url.hostname)) {
    if (isUnsafeIp(url.hostname)) throw new UnsafeUrlError("不能扫描本机、内网或保留 IP 地址。");
    return url;
  }
  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("无法解析该网站地址，请确认域名是否正确。");
  }
  if (!addresses.length || addresses.some(({ address }) => isUnsafeIp(address))) {
    throw new UnsafeUrlError("该网站解析到了不允许访问的网络地址。");
  }
  return url;
}

export function isSameSite(candidate: URL, origin: URL): boolean {
  const candidateHost = candidate.hostname.toLowerCase();
  const originHost = origin.hostname.toLowerCase();
  return candidateHost === originHost || candidateHost.endsWith(`.${originHost}`) || originHost.endsWith(`.${candidateHost}`);
}
