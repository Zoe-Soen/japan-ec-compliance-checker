#!/usr/bin/env bash

set -euo pipefail

DOC_PATH="${1:-docs/MVP产品设计文档.md}"

if [[ ! -s "$DOC_PATH" ]]; then
  echo "MVP 产品设计文档不存在或内容为空：$DOC_PATH" >&2
  exit 1
fi

required_sections=(
  "## 1. 产品摘要"
  "## 2. 已确认事实、产品假设与待确认项"
  "## 5. 产品目标与非目标"
  "## 6. 产品边界与法律提示"
  "## 8. 功能需求"
  "## 9. 首批 30 条检查规则"
  "## 13. 测试与验收计划"
  "## 15. 官方依据与维护基线"
)

for section in "${required_sections[@]}"; do
  if ! grep -Fq "$section" "$DOC_PATH"; then
    echo "缺少必要章节：$section" >&2
    exit 1
  fi
done

rule_ids="$({
  sed -n '/### 9\.1/,/### 9\.5/p' "$DOC_PATH" \
    | grep -Eo '\| R[0-9]{2} \|' \
    | grep -Eo 'R[0-9]{2}'
} || true)"

rule_count="$(printf '%s\n' "$rule_ids" | sed '/^$/d' | wc -l | tr -d ' ')"
unique_rule_count="$(printf '%s\n' "$rule_ids" | sed '/^$/d' | sort -u | wc -l | tr -d ' ')"

if [[ "$rule_count" -ne 30 || "$unique_rule_count" -ne 30 ]]; then
  echo "检查规则必须正好包含 30 个唯一编号；当前总数：$rule_count，唯一数：$unique_rule_count" >&2
  exit 1
fi

expected_rule_ids="$(seq -f 'R%02g' 1 30)"
actual_rule_ids="$(printf '%s\n' "$rule_ids" | sort)"

if [[ "$actual_rule_ids" != "$expected_rule_ids" ]]; then
  echo "检查规则编号必须连续覆盖 R01～R30" >&2
  exit 1
fi

source_link_count="$({
  sed -n '/## 15\. 官方依据与维护基线/,/## 16\./p' "$DOC_PATH" \
    | grep -Ec 'https://'
} || true)"

if [[ "$source_link_count" -lt 8 ]]; then
  echo "官方依据章节至少需要 8 个来源链接；当前数量：$source_link_count" >&2
  exit 1
fi

if ! grep -Fq '> 更新时间：2026-08-31' "$DOC_PATH"; then
  echo "文档顶部缺少正确的更新时间" >&2
  exit 1
fi

echo "MVP 产品设计文档验证通过：30 条规则、必要章节和官方来源均已包含。"
