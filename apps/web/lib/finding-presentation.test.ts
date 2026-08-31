import { describe, expect, it } from "vitest";
import { getFindingResultPresentation } from "./finding-presentation";

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
});
