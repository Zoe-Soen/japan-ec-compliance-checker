import type { CreateCheckInput, ScopeAnswers } from "@checker/shared";

const allowed = {
  location: new Set(["japan", "overseas"]),
  entity: new Set(["company", "individual"]),
  category: new Set(["ordinary", "cosmetics", "food", "other_high_risk"]),
  sales: new Set(["single", "subscription", "both"]),
  shipping: new Set(["japan", "overseas", "both"]),
};

export function validateCreatePayload(value: unknown): CreateCheckInput {
  if (!value || typeof value !== "object") throw new Error("请求内容不完整。");
  const body = value as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  const rawScope = body.scope as Record<string, unknown> | undefined;
  if (!name || name.length > 120) throw new Error("请输入 1～120 字的项目名称。");
  if (!url || url.length > 2048) throw new Error("请输入有效的网站地址。");
  if (!rawScope) throw new Error("请完成检查范围问题。");
  for (const key of Object.keys(allowed) as Array<keyof ScopeAnswers>) {
    if (!allowed[key].has(String(rawScope[key]))) throw new Error("检查范围选项不完整。");
  }
  return { name, url, scope: rawScope as unknown as ScopeAnswers, scanType: "site_full" };
}
