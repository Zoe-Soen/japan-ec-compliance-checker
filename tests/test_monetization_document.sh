#!/usr/bin/env bash

set -euo pipefail

DOC_PATH="${1:-docs/MVP商业变现逻辑方案.md}"

if [[ ! -s "$DOC_PATH" ]]; then
  echo "MVP 商业变现逻辑方案不存在或内容为空：$DOC_PATH" >&2
  exit 1
fi

required_sections=(
  "## 1. 结论摘要"
  "## 2. 已确认事实、推算与待确认项"
  "## 5. 为什么主产品选择 SaaS"
  "## 6. 建议的收费结构"
  "## 8. 收入与成本逻辑"
  "## 10. 最小商业实验"
  "## 11. 主要商业风险"
  "## 12. 本版商业决策记录"
  "## 13. 资料依据"
)

for section in "${required_sections[@]}"; do
  if ! grep -Fq "$section" "$DOC_PATH"; then
    echo "缺少必要章节：$section" >&2
    exit 1
  fi
done

required_decisions=(
  "Web SaaS"
  "按次或额度包"
  "订阅／年费包含额度"
  "无限次套餐 | 不采用"
  "网站完整检查"
  "新商品快速检查"
  "整改复查"
  "具体价格 | 暂不确定"
  "至少 1 人愿意"
)

for decision in "${required_decisions[@]}"; do
  if ! grep -Fq "$decision" "$DOC_PATH"; then
    echo "缺少关键商业判断：$decision" >&2
    exit 1
  fi
done

if ! grep -Fq '> 更新时间：2026-08-31' "$DOC_PATH"; then
  echo "文档顶部缺少正确的更新时间" >&2
  exit 1
fi

source_link_count="$(sed -n '/## 13\. 资料依据/,/## 14\./p' "$DOC_PATH" | grep -Ec 'https://')"
if [[ "$source_link_count" -lt 4 ]]; then
  echo "资料依据至少需要 4 个来源链接；当前数量：$source_link_count" >&2
  exit 1
fi

echo "MVP 商业变现逻辑方案验证通过：必要章节、关键判断和验证计划均已包含。"
