#!/usr/bin/env bash

set -euo pipefail

DOC_PATH="${1:-docs/MVP技术方案.md}"

if [[ ! -s "$DOC_PATH" ]]; then
  echo "MVP 技术方案不存在或内容为空：$DOC_PATH" >&2
  exit 1
fi

required_sections=(
  "## 1. 结论摘要"
  "## 3. 系统总体结构"
  "## 5. 主要模块"
  "## 8. 安全与隐私"
  "## 11. 测试与发布门槛"
  "## 13. 实施顺序"
  "## 16. 技术决策记录"
  "## 17. 官方技术依据"
)

for section in "${required_sections[@]}"; do
  if ! grep -Fq "$section" "$DOC_PATH"; then
    echo "缺少必要章节：$section" >&2
    exit 1
  fi
done

required_decisions=(
  "Web SaaS"
  "Next.js + React + TypeScript"
  "Node.js + TypeScript + Playwright"
  "PostgreSQL"
  "不采用 Electron"
  "SSRF"
  "无法自动确认"
)

for decision in "${required_decisions[@]}"; do
  if ! grep -Fq "$decision" "$DOC_PATH"; then
    echo "缺少关键技术决策：$decision" >&2
    exit 1
  fi
done

source_link_count="$(sed -n '/## 17\. 官方技术依据/,/## 18\./p' "$DOC_PATH" | grep -Ec 'https://')"
if [[ "$source_link_count" -lt 8 ]]; then
  echo "官方技术依据至少需要 8 个来源链接；当前数量：$source_link_count" >&2
  exit 1
fi

if ! grep -Fq '> 更新时间：2026-08-31' "$DOC_PATH"; then
  echo "文档顶部缺少正确的更新时间" >&2
  exit 1
fi

echo "MVP 技术方案验证通过：必要章节、关键决策和官方依据均已包含。"
