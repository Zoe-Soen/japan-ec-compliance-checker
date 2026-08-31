import { describe, expect, it } from "vitest";
import type { Finding, FindingStatus, RiskLevel } from "@checker/shared";
import { getFindingResultPresentation, groupFindingsByPriority } from "./finding-presentation";

function finding(ruleId: string, status: FindingStatus, risk: RiskLevel): Finding {
  return {
    ruleId,
    title: ruleId,
    category: "测试",
    risk,
    status,
    sourceUrl: null,
    evidence: "",
    explanation: "",
    recommendation: "",
    basis: "",
    confidence: "high",
  };
}

describe("getFindingResultPresentation", () => {
  it("只对实际问题显示规则风险等级", () => {
    expect(getFindingResultPresentation({ status: "issue", risk: "high" })).toEqual({ label: "高风险", tone: "high" });
    expect(getFindingResultPresentation({ status: "issue", risk: "medium" })).toEqual({ label: "中风险", tone: "medium" });
  });

  it("通过的高风险规则显示为无问题", () => {
    expect(getFindingResultPresentation({ status: "pass", risk: "high" })).toEqual({ label: "无问题", tone: "clear" });
  });

  it("无法确认和不适用的规则不会显示成风险问题", () => {
    expect(getFindingResultPresentation({ status: "unknown", risk: "high" })).toEqual({ label: "待确认", tone: "pending" });
    expect(getFindingResultPresentation({ status: "not_applicable", risk: "high" })).toEqual({ label: "不适用", tone: "not-applicable" });
  });

  it("按照实际处理优先级分组，高风险问题始终排在首位", () => {
    const groups = groupFindingsByPriority([
      finding("R01", "pass", "high"),
      finding("R02", "unknown", "high"),
      finding("R03", "issue", "medium"),
      finding("R04", "not_applicable", "medium"),
      finding("R05", "issue", "high"),
    ]);

    expect(groups.map((group) => group.key)).toEqual(["high", "medium", "unknown", "pass", "not-applicable"]);
    expect(groups[0].findings.map((item) => item.ruleId)).toEqual(["R05"]);
  });
});
