import type { Finding, FindingStatus, RiskLevel } from "@checker/shared";

export type FindingResultTone = RiskLevel | "clear" | "pending" | "not-applicable";

const issueLabel: Record<RiskLevel, string> = {
  high: "高风险",
  medium: "中风险",
  low: "低风险",
};

const nonIssuePresentation: Record<Exclude<FindingStatus, "issue">, { label: string; tone: FindingResultTone }> = {
  pass: { label: "无问题", tone: "clear" },
  unknown: { label: "待确认", tone: "pending" },
  not_applicable: { label: "不适用", tone: "not-applicable" },
};

export function getFindingResultPresentation(finding: Pick<Finding, "risk" | "status">): { label: string; tone: FindingResultTone } {
  if (finding.status === "issue") {
    return { label: issueLabel[finding.risk], tone: finding.risk };
  }

  return nonIssuePresentation[finding.status];
}
