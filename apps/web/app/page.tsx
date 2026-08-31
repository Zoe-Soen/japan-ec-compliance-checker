"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowSquareOut, BookOpen, CaretDown, CaretRight,
  Check, CheckCircle, CircleNotch, ClockCounterClockwise, Copy, Database,
  DownloadSimple, FileText, Globe, Info, ListChecks, MagnifyingGlass, Plus,
  ShieldCheck, Sparkle, Warning, XCircle,
} from "@phosphor-icons/react";
import { ruleDefinitions } from "@checker/rules";
import type { Finding, JobStatus, ScopeAnswers } from "@checker/shared";
import { getFindingResultPresentation } from "../lib/finding-presentation";

type View = "flow" | "records" | "rules";
type ReportFilter = "all" | "high" | "medium" | "pass" | "unknown";

interface CheckRecord {
  id: string;
  projectId: string;
  projectName: string;
  url: string;
  scope: ScopeAnswers;
  scanType: "site_full" | "product_quick" | "recheck";
  status: JobStatus;
  progress: number;
  stage: string;
  ruleVersion: string;
  error: string | null;
  pageCount: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  summary?: Record<string, number>;
  findings?: Finding[];
  pages?: Array<{ url: string; title: string; kind: string }>;
  usage?: { units: number; page_count: number; duration_ms: number } | null;
}

const steps = ["网站信息", "检查范围", "自动扫描", "风险报告"];
const initialScope: ScopeAnswers = { location: "overseas", entity: "company", category: "ordinary", sales: "single", shipping: "overseas" };
const statusLabel = { pass: "通过", issue: "问题", unknown: "待确认", not_applicable: "不适用" } as const;

async function readJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data as T;
}

function Sidebar({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  const items = [
    { key: "flow" as const, label: "新建检查", icon: Plus },
    { key: "records" as const, label: "检查记录", icon: ClockCounterClockwise },
    { key: "rules" as const, label: "规则说明", icon: BookOpen },
  ];
  return (
    <aside className="sidebar">
      <div className="brand"><ShieldCheck weight="duotone" /><span>证据优先的<br />合规工作台</span></div>
      <nav aria-label="主要导航">
        {items.map(({ key, label, icon: Icon }) => (
          <button className={`nav-item ${view === key ? "active" : ""}`} key={key} type="button" onClick={() => onNavigate(key)}>
            <Icon weight={view === key ? "fill" : "regular"} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="local-mode"><Database weight="duotone" /><div><strong>本地基础版</strong><span>真实任务与本地数据</span></div></div>
    </aside>
  );
}

function Stepper({ step, onStep }: { step: number; onStep: (step: number) => void }) {
  return (
    <ol className="stepper" aria-label="检查流程">
      {steps.map((label, index) => {
        const number = index + 1;
        const completed = number < step;
        const active = number === step;
        return (
          <li className={`${completed ? "completed" : ""} ${active ? "active" : ""}`} key={label}>
            <button type="button" disabled={number > step} onClick={() => number <= step && onStep(number)} aria-current={active ? "step" : undefined}>
              <span className="step-marker">{completed ? <Check weight="bold" /> : number}</span>
              <span className="step-copy"><strong>{number} {label}</strong><small>{completed ? "已完成" : active ? "当前步骤" : "待进行"}</small></span>
            </button>
            {number < 4 && <span className="step-line" />}
          </li>
        );
      })}
    </ol>
  );
}

function FlowHeader({ step, projectName, url, onStep }: { step: number; projectName: string; url: string; onStep: (step: number) => void }) {
  return (
    <header className="flow-header">
      <div className="project-heading">
        <div><p className="eyebrow">日本 EC 网站风险体检</p><h1>{step === 4 ? "检查报告" : steps[step - 1]}</h1></div>
        <div className="runtime-badge"><span />本地运行</div>
      </div>
      <div className="project-line"><strong>{projectName || "新检查项目"}</strong>{url && <span>{url}</span>}</div>
      <Stepper step={step} onStep={onStep} />
    </header>
  );
}

function WebsiteStep({ name, url, setName, setUrl, onNext }: { name: string; url: string; setName: (value: string) => void; setUrl: (value: string) => void; onNext: () => void }) {
  const canContinue = name.trim().length > 0 && /^https?:\/\//i.test(url);
  return (
    <section className="setup-screen">
      <div className="setup-main">
        <p className="section-kicker">第 1 步，共 4 步</p><h2>输入要检查的网站</h2>
        <p className="section-lead">基础版会实际访问公开页面。不会提交表单、登录账号、创建订单或进行真实购买。</p>
        <label className="field-label" htmlFor="project-name">项目名称</label>
        <input id="project-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} />
        <label className="field-label" htmlFor="website-url">网站 URL</label>
        <div className="input-with-icon"><Globe /><input id="website-url" value={url} onChange={(event) => setUrl(event.target.value)} inputMode="url" /></div>
        <p className="field-help">仅支持公开的 http／https 网站；本机、内网和特殊端口会被拒绝。</p>
        <div className="setup-actions"><button className="primary-button" type="button" disabled={!canContinue} onClick={onNext}>继续设置检查范围 <ArrowRight weight="bold" /></button></div>
      </div>
      <aside className="setup-aside">
        <h3>这个版本已经接入</h3>
        <ul className="check-list">
          <li><CheckCircle weight="fill" />本地 PostgreSQL 任务记录</li>
          <li><CheckCircle weight="fill" />真实公开页面读取</li>
          <li><CheckCircle weight="fill" />30 条保守型规则判断</li>
          <li><CheckCircle weight="fill" />证据、来源与整改建议</li>
        </ul>
        <div className="boundary-note compact"><Info weight="fill" /><span>这是基础风险筛查，不构成法律意见或合规认证。</span></div>
      </aside>
    </section>
  );
}

function RadioRow({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <fieldset className="question-row"><legend>{label}</legend><div className="radio-options">{options.map((option) => <label key={option.value}><input type="radio" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span>{option.label}</span></label>)}</div></fieldset>;
}

function ScopeStep({ scope, setScope, onBack, onStart, busy, error }: { scope: ScopeAnswers; setScope: (scope: ScopeAnswers) => void; onBack: () => void; onStart: () => void; busy: boolean; error: string }) {
  return (
    <section className="scope-screen">
      <div className="scope-heading"><div><p className="section-kicker">第 2 步，共 4 步</p><h2>确认本次检查范围</h2><p>这些回答会决定规则是否适用；当前只开放网站完整检查。</p></div><div className="rule-count"><ListChecks weight="duotone" /><strong>30</strong><span>条基础规则</span></div></div>
      <div className="scope-grid">
        <div className="question-list">
          <RadioRow label="1. 经营主体所在地" value={scope.location} options={[{ value: "japan", label: "日本" }, { value: "overseas", label: "海外" }]} onChange={(location) => setScope({ ...scope, location: location as ScopeAnswers["location"] })} />
          <RadioRow label="2. 经营主体类型" value={scope.entity} options={[{ value: "company", label: "法人" }, { value: "individual", label: "个人事业者" }]} onChange={(entity) => setScope({ ...scope, entity: entity as ScopeAnswers["entity"] })} />
          <div className="question-row select-row"><label htmlFor="category">3. 商品类别</label><div className="select-control"><select id="category" value={scope.category} onChange={(event) => setScope({ ...scope, category: event.target.value as ScopeAnswers["category"] })}><option value="ordinary">普通实体商品</option><option value="cosmetics">化妆品（仅做通用检查）</option><option value="food">食品／保健品（仅做通用检查）</option><option value="other_high_risk">其他专项商品</option></select><CaretDown /></div></div>
          <RadioRow label="4. 销售方式" value={scope.sales} options={[{ value: "single", label: "单次购买" }, { value: "subscription", label: "定期购" }, { value: "both", label: "两者都有" }]} onChange={(sales) => setScope({ ...scope, sales: sales as ScopeAnswers["sales"] })} />
          <RadioRow label="5. 发货地" value={scope.shipping} options={[{ value: "japan", label: "日本境内" }, { value: "overseas", label: "海外" }, { value: "both", label: "两者都有" }]} onChange={(shipping) => setScope({ ...scope, shipping: shipping as ScopeAnswers["shipping"] })} />
        </div>
        <aside className="scope-summary"><h3>本次执行</h3><ul><li>最多读取 30 个同站页面</li><li>特商法及基础交易信息</li><li>广告表达风险关键词</li><li>隐私政策与日本在地化</li><li>跨境配送基础信息</li></ul><div className="scope-alert"><Warning weight="fill" /><div><strong>当前限制</strong><span>最終確認画面 OCR 尚未接入，对应规则会诚实标记为无法确认。</span></div></div></aside>
      </div>
      {error && <div className="form-error"><Warning weight="fill" />{error}</div>}
      <div className="setup-actions split-actions"><button className="secondary-button" type="button" onClick={onBack}><ArrowLeft />返回网站信息</button><button className="primary-button" type="button" disabled={busy} onClick={onStart}>{busy ? <CircleNotch className="spin" /> : <MagnifyingGlass />} {busy ? "正在创建任务" : "开始真实检查"}</button></div>
    </section>
  );
}

function ScanStep({ check, onRetry, onBack }: { check: CheckRecord | null; onRetry: () => void; onBack: () => void }) {
  const failed = check?.status === "failed";
  return (
    <section className="scan-screen">
      <div className={`scan-orbit ${failed ? "failed" : ""}`}>{failed ? <XCircle weight="bold" /> : <MagnifyingGlass weight="bold" />}</div>
      <p className="section-kicker">第 3 步，共 4 步</p><h2>{failed ? "本次检查未能完成" : "正在检查网站公开页面"}</h2>
      <p>{failed ? check?.error : check?.stage || "任务正在等待本地 Worker"}</p>
      <div className="progress-track" aria-label={`扫描进度 ${check?.progress ?? 0}%`}><span style={{ width: `${check?.progress ?? 0}%` }} /></div><strong className="progress-value">{check?.progress ?? 0}%</strong>
      <div className="scan-log">
        <div className={(check?.progress ?? 0) >= 8 ? "done" : "pending"}><CheckCircle weight="fill" /><span>URL 与网络安全检查</span><strong>{(check?.progress ?? 0) >= 8 ? "已完成" : "等待中"}</strong></div>
        <div className={(check?.progress ?? 0) >= 70 ? "done" : "pending"}>{(check?.progress ?? 0) >= 70 ? <CheckCircle weight="fill" /> : <CircleNotch className="spin" />}<span>发现并读取关键页面</span><strong>{check?.pageCount ? `${check.pageCount} 页` : "进行中"}</strong></div>
        <div className={(check?.progress ?? 0) >= 90 ? "done" : "pending"}>{(check?.progress ?? 0) >= 90 ? <CheckCircle weight="fill" /> : <CircleNotch className="spin" />}<span>执行规则并整理证据</span><strong>{(check?.progress ?? 0) >= 90 ? "整理中" : "等待中"}</strong></div>
      </div>
      {failed && <div className="setup-actions centered"><button className="secondary-button" type="button" onClick={onBack}>修改网站地址</button><button className="primary-button" type="button" onClick={onRetry}>重新创建检查</button></div>}
      <div className="boundary-note compact scan-boundary"><ShieldCheck weight="duotone" /><span>不会绕过登录、人机验证或目标网站的访问限制。</span></div>
    </section>
  );
}

function StatusMark({ finding }: { finding: Finding }) {
  if (finding.status === "pass") return <CheckCircle weight="fill" />;
  if (finding.status === "issue") return <Warning weight="fill" />;
  return <Info weight="fill" />;
}

function FindingResultBadge({ finding }: { finding: Finding }) {
  const presentation = getFindingResultPresentation(finding);
  return <span className={`result-pill result-${presentation.tone}`}>{presentation.label}</span>;
}

function ReportStep({ check, onRetry }: { check: CheckRecord; onRetry: () => void }) {
  const findings = check.findings ?? [];
  const [filter, setFilter] = useState<ReportFilter>("all");
  const [selectedId, setSelectedId] = useState(findings[0]?.ruleId ?? "");
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!selectedId && findings[0]) setSelectedId(findings[0].ruleId); }, [findings, selectedId]);
  const filtered = useMemo(() => findings.filter((finding) => {
    if (filter === "all") return true;
    if (filter === "pass") return finding.status === "pass";
    if (filter === "unknown") return finding.status === "unknown";
    return finding.status === "issue" && finding.risk === filter;
  }), [findings, filter]);
  const selected = findings.find((finding) => finding.ruleId === selectedId) ?? filtered[0] ?? findings[0];
  const count = (predicate: (finding: Finding) => boolean) => findings.filter(predicate).length;
  const high = count((finding) => finding.status === "issue" && finding.risk === "high");
  const medium = count((finding) => finding.status === "issue" && finding.risk === "medium");
  const pass = count((finding) => finding.status === "pass");
  const unknown = count((finding) => finding.status === "unknown");

  const exportReport = () => {
    const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]!));
    const rows = findings.map((finding) => {
      const result = getFindingResultPresentation(finding);
      return `<article><h2>${finding.ruleId}｜${escape(finding.title)}</h2><p><b>${result.label}／${statusLabel[finding.status]}</b></p><p>${escape(finding.explanation)}</p><p><b>证据：</b>${escape(finding.evidence)}</p><p><b>建议：</b>${escape(finding.recommendation)}</p><p><b>依据：</b>${escape(finding.basis)}</p></article>`;
    }).join("");
    const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${escape(check.projectName)} 整改报告</title><style>body{font:15px/1.7 sans-serif;max-width:900px;margin:40px auto;color:#162536}article{border-top:1px solid #ccd5db;padding:18px 0}h1{color:#087d7b}h2{font-size:18px}</style><h1>${escape(check.projectName)}｜风险检查报告</h1><p>${escape(check.url)}｜规则版本 ${escape(check.ruleVersion)}｜高风险 ${high}｜中风险 ${medium}</p>${rows}<p>本报告是风险筛查结果，不构成法律意见或合规认证。</p></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${check.projectName}-整改报告.html`; anchor.click(); URL.revokeObjectURL(url);
  };

  const copyRecommendation = async () => {
    if (!selected) return;
    await navigator.clipboard?.writeText(selected.recommendation).catch(() => undefined);
    setCopied(true); window.setTimeout(() => setCopied(false), 1200);
  };

  return (
    <section className="report-screen">
      <div className="report-summary">
        <div className="report-headline"><Warning weight="fill" /><div><h2>发现 {high + medium} 项问题 · {high} 项高风险</h2><p>实际读取 {check.pageCount} 个页面 · 规则版本 {check.ruleVersion}</p></div></div>
        <div className="summary-actions"><button className="secondary-button" type="button" onClick={onRetry}><ClockCounterClockwise />重新检查</button><button className="primary-button" type="button" onClick={exportReport}><DownloadSimple />导出 HTML 报告</button></div>
        <div className="summary-row">
          {[{ key: "high", label: "高风险", value: high }, { key: "medium", label: "中风险", value: medium }, { key: "pass", label: "通过", value: pass }, { key: "unknown", label: "无法确认", value: unknown }].map((item) => <button className={`summary-${item.key} ${filter === item.key ? "selected" : ""}`} key={item.key} type="button" onClick={() => setFilter(filter === item.key ? "all" : item.key as ReportFilter)}><span>{item.label}</span><strong>{item.value}</strong></button>)}
        </div>
      </div>
      <div className="report-workspace">
        <section className="findings-panel">
          <div className="panel-toolbar"><h2>检查结果 <span>（{filtered.length}／{findings.length} 项）</span></h2><label className="filter-control"><select value={filter} onChange={(event) => setFilter(event.target.value as ReportFilter)}><option value="all">全部状态</option><option value="high">高风险问题</option><option value="medium">中风险问题</option><option value="pass">通过</option><option value="unknown">无法确认</option></select><CaretDown /></label></div>
          <div className="finding-table-header"><span>编号</span><span>检查项</span><span>本次风险</span><span>状态</span></div>
          <div className="finding-list">{filtered.map((finding) => <button className={`finding-row ${selected?.ruleId === finding.ruleId ? "selected" : ""}`} type="button" key={finding.ruleId} onClick={() => setSelectedId(finding.ruleId)}><span>{finding.ruleId}</span><strong>{finding.title}</strong><FindingResultBadge finding={finding} /><span className={`status-${finding.status}`}><StatusMark finding={finding} />{statusLabel[finding.status]}</span><CaretRight /></button>)}</div>
        </section>
        {selected ? <aside className="detail-pane">
          <div className="detail-title"><div><strong>{selected.ruleId}</strong><h2>{selected.title}</h2><FindingResultBadge finding={selected} /></div></div>
          <dl className="detail-sections">
            <div><dt>页面来源</dt><dd>{selected.sourceUrl ? <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceUrl}<ArrowSquareOut /></a> : "没有取得可定位页面"}</dd></div>
            <div><dt>页面证据</dt><dd className="evidence-box">{selected.evidence}</dd></div>
            <div><dt>判断说明</dt><dd>{selected.explanation}</dd></div>
            <div><dt>官方依据</dt><dd>{selected.basis}</dd></div>
            <div><dt>整改建议</dt><dd className="recommendation"><span>{selected.recommendation}</span><button type="button" onClick={copyRecommendation}><Copy />{copied ? "已复制" : "复制"}</button></dd></div>
            <div><dt>自动判断把握度</dt><dd><span className={`confidence confidence-${selected.confidence}`}>{selected.confidence === "high" ? "高" : selected.confidence === "medium" ? "中" : "低"}</span></dd></div>
          </dl>
        </aside> : <aside className="detail-empty"><Info /><span>当前筛选下没有检查项</span></aside>}
      </div>
      <div className="boundary-note report-boundary"><ShieldCheck weight="duotone" /><span>风险筛查结果，不构成法律意见或合规认证。网站可能因登录、动态渲染或访问限制而出现“无法确认”。</span></div>
    </section>
  );
}

function RecordsView({ records, loading, onRefresh, onOpen, onNew }: { records: CheckRecord[]; loading: boolean; onRefresh: () => void; onOpen: (record: CheckRecord) => void; onNew: () => void }) {
  return <section className="standalone-view"><div className="standalone-heading"><div><p className="eyebrow">本地项目工作区</p><h1>检查记录</h1><p>任务和报告保存在本机 PostgreSQL 中。</p></div><div className="heading-actions"><button className="secondary-button" type="button" onClick={onRefresh}><ClockCounterClockwise />刷新</button><button className="primary-button" type="button" onClick={onNew}><Plus />新建检查</button></div></div>{loading ? <div className="loading-state"><CircleNotch className="spin" />正在读取记录</div> : records.length ? <div className="records-list">{records.map((record) => <button type="button" key={record.id} onClick={() => onOpen(record)}><span className="record-icon"><FileText weight="duotone" /></span><span className="record-main"><strong>{record.projectName}</strong><small>{record.url}</small></span><span><small>检查时间</small><strong>{new Date(record.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</strong></span><span><small>页面</small><strong>{record.pageCount}</strong></span><span className={`job-status job-${record.status}`}>{record.status === "succeeded" ? "已完成" : record.status === "failed" ? "失败" : record.status === "running" ? "检查中" : "等待中"}</span><CaretRight /></button>)}</div> : <div className="empty-records"><Sparkle weight="duotone" /><h2>还没有真实检查记录</h2><p>创建第一个任务后，进度和报告会保存在这里。</p><button className="primary-button" type="button" onClick={onNew}>创建第一个检查</button></div>}</section>;
}

function RulesView() {
  const groups = Array.from(new Set(ruleDefinitions.map((rule) => rule.category))).map((category) => ({ category, rules: ruleDefinitions.filter((rule) => rule.category === category) }));
  return <section className="standalone-view"><div className="standalone-heading"><div><p className="eyebrow">规则版本 mvp-0.1</p><h1>规则说明</h1><p>当前基础版使用 30 条确定性规则；没有证据时不会判为通过。</p></div></div><div className="rules-intro"><BookOpen weight="duotone" /><div><strong>四种结果状态</strong><p>通过、发现问题、无法自动确认、不适用。最終確認画面 OCR 尚未接入，因此相关规则会保守显示。</p></div></div><div className="rule-groups">{groups.map((group, index) => <article key={group.category}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{group.category}</h2><p>{group.rules[0].id}～{group.rules.at(-1)?.id}</p></div><strong>{group.rules.length} 条</strong></article>)}</div><div className="boundary-note rules-boundary"><Info weight="fill" /><span>食品、化妆品、药品等专项法规未覆盖，需要专业人士进一步复核。</span></div></section>;
}

export default function HomePage() {
  const [view, setView] = useState<View>("flow");
  const [step, setStep] = useState(1);
  const [name, setName] = useState("日本站基础检查");
  const [url, setUrl] = useState("https://example.com");
  const [scope, setScope] = useState<ScopeAnswers>(initialScope);
  const [check, setCheck] = useState<CheckRecord | null>(null);
  const [records, setRecords] = useState<CheckRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadCheck = useCallback(async (id: string) => {
    const data = await readJson<{ check: CheckRecord }>(await fetch(`/api/checks/${id}`, { cache: "no-store" }));
    setCheck(data.check);
    if (data.check.status === "succeeded") setStep(4);
    return data.check;
  }, []);

  useEffect(() => {
    if (step !== 3 || !check || ["succeeded", "failed", "cancelled"].includes(check.status)) return;
    const timer = window.setInterval(() => loadCheck(check.id).catch((cause) => setError(cause instanceof Error ? cause.message : "无法读取进度")), 900);
    return () => window.clearInterval(timer);
  }, [check, loadCheck, step]);

  const startCheck = async () => {
    setBusy(true); setError("");
    try {
      const data = await readJson<{ check: CheckRecord }>(await fetch("/api/checks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, url, scope }) }));
      setCheck(data.check); setStep(3);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法创建检查任务");
    } finally { setBusy(false); }
  };

  const retry = async () => {
    if (!check) return startCheck();
    setBusy(true); setError("");
    try {
      const data = await readJson<{ check: CheckRecord }>(await fetch(`/api/checks/${check.id}/retry`, { method: "POST" }));
      setCheck(data.check); setStep(3);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "无法创建复查任务"); }
    finally { setBusy(false); }
  };

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try { const data = await readJson<{ checks: CheckRecord[] }>(await fetch("/api/checks", { cache: "no-store" })); setRecords(data.checks); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "无法读取记录"); }
    finally { setLoadingRecords(false); }
  }, []);

  const navigate = (next: View) => {
    setView(next); setError("");
    if (next === "records") void loadRecords();
    if (next === "flow" && step === 4) { setStep(1); setCheck(null); }
  };

  const openRecord = async (record: CheckRecord) => {
    setView("flow"); setCheck(record); setName(record.projectName); setUrl(record.url); setScope(record.scope);
    setStep(record.status === "succeeded" ? 4 : 3);
    await loadCheck(record.id).catch((cause) => setError(cause instanceof Error ? cause.message : "无法读取报告"));
  };

  return <div className="app-shell"><Sidebar view={view} onNavigate={navigate} /><main className="main-surface">
    {view === "flow" && <><FlowHeader step={step} projectName={name} url={url} onStep={setStep} />
      {step === 1 && <WebsiteStep name={name} url={url} setName={setName} setUrl={setUrl} onNext={() => { setError(""); setStep(2); }} />}
      {step === 2 && <ScopeStep scope={scope} setScope={setScope} onBack={() => setStep(1)} onStart={startCheck} busy={busy} error={error} />}
      {step === 3 && <ScanStep check={check} onRetry={retry} onBack={() => setStep(1)} />}
      {step === 4 && check && <ReportStep check={check} onRetry={retry} />}
    </>}
    {view === "records" && <RecordsView records={records} loading={loadingRecords} onRefresh={loadRecords} onOpen={openRecord} onNew={() => { setView("flow"); setStep(1); setCheck(null); }} />}
    {view === "rules" && <RulesView />}
  </main></div>;
}
