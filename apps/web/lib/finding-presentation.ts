import type { Finding, FindingStatus, RiskLevel } from "@checker/shared";

export type FindingResultTone = RiskLevel | "clear" | "pending" | "not-applicable";
export type FindingGroupKey = RiskLevel | "unknown" | "pass" | "not-applicable";

export interface FindingGroup {
  key: FindingGroupKey;
  label: string;
  findings: Finding[];
}

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

const groupOrder: Array<{ key: FindingGroupKey; label: string; matches: (finding: Finding) => boolean }> = [
  { key: "high", label: "优先处理 · 高风险问题", matches: (finding) => finding.status === "issue" && finding.risk === "high" },
  { key: "medium", label: "随后处理 · 中风险问题", matches: (finding) => finding.status === "issue" && finding.risk === "medium" },
  { key: "low", label: "低风险问题", matches: (finding) => finding.status === "issue" && finding.risk === "low" },
  { key: "unknown", label: "需要人工确认", matches: (finding) => finding.status === "unknown" },
  { key: "pass", label: "检查通过", matches: (finding) => finding.status === "pass" },
  { key: "not-applicable", label: "不适用", matches: (finding) => finding.status === "not_applicable" },
];

export function groupFindingsByPriority(findings: Finding[]): FindingGroup[] {
  return groupOrder
    .map((group) => ({ key: group.key, label: group.label, findings: findings.filter(group.matches) }))
    .filter((group) => group.findings.length > 0);
}
