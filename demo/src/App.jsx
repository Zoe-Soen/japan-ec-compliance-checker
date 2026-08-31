import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowSquareOut, BookOpen, CaretDown, CaretLeft,
  CaretRight, Check, CheckCircle, CircleNotch, ClockCounterClockwise,
  Copy, DownloadSimple, FileText, Globe, Info, ListChecks, MagnifyingGlass,
  Plus, ShieldCheck, Sparkle, UploadSimple, Warning, X,
} from "@phosphor-icons/react";

const steps = ["网站信息", "检查范围", "自动扫描", "风险报告"];
const riskRank = { high: 0, medium: 1, pass: 2, unknown: 3 };
const riskMeta = {
  high: { label: "高风险", className: "risk-high" },
  medium: { label: "中风险", className: "risk-medium" },
  pass: { label: "通过", className: "risk-pass" },
  unknown: { label: "无法确认", className: "risk-unknown" },
};

const issueFindings = [
  {
    id: "R14", title: "退货条件不明确", risk: "high", status: "issue", confidence: "高",
    source: "https://sakura-select.example.jp/guide/returns",
    evidence: "返品についてはお問い合わせください。",
    explanation: "退货条件（可否退货、期限、费用承担、所需条件与流程）未具体说明，消费者无法在购买前准确判断，可能不满足通信販売中关于退货条件的明示要求。",
    basis: "消费者厅《通信販売広告について》／特定商取引法第 11 条（返品に関する表示）",
    recommendation: "在“退货／返品”页面中分别明确：是否可退货、申请期限、商品状态要求、退货运费承担方、瑕疵品处理方式，以及申请渠道和处理流程。",
  },
  {
    id: "R09", title: "送料说明不完整", risk: "high", status: "issue", confidence: "高",
    source: "https://sakura-select.example.jp/guide/shipping", evidence: "送料は注文内容により異なります。",
    explanation: "页面未说明具体送料、计算方式或能够在购买前确认送料的位置。",
    basis: "消费者厅《通信販売広告について》／销售价格及送料的表示",
    recommendation: "明确日本境内各地区送料、免邮门槛和海外发货时可能产生的关税或进口费用。",
  },
  {
    id: "R23", title: "使用“100%有效”表达", risk: "high", status: "issue", confidence: "中",
    source: "https://sakura-select.example.jp/products/bright-serum", evidence: "使用者の100%が効果を実感！",
    explanation: "绝对化效果表达需要充分、合理且可验证的依据，当前页面未显示调查条件。",
    basis: "消费者厅《表示に関する Q＆A》／景品表示法",
    recommendation: "删除绝对化表达，或同时清楚显示调查对象、样本量、期间、方法和结果范围，并由专业人士复核。",
  },
  {
    id: "R28", title: "个人信息利用目的不完整", risk: "medium", status: "issue", confidence: "中",
    source: "https://sakura-select.example.jp/privacy", evidence: "取得した情報はサービス提供のために使用します。",
    explanation: "利用目的过于概括，消费者难以理解订单、配送、营销等具体用途。",
    basis: "个人信息保护委员会《个人信息保护法指南（通则编）》",
    recommendation: "按订单处理、配送、客服、营销等用途分别具体说明，并补充咨询窗口。",
  },
  {
    id: "R03", title: "经营者正式名称不完整", risk: "medium", status: "issue", confidence: "高",
    source: "https://sakura-select.example.jp/legal", evidence: "販売事業者：Sakura Select",
    explanation: "页面只显示品牌名称，未显示经营主体的法人正式名称。",
    basis: "消费者厅《通信販売広告について》／事業者の氏名（名称）",
    recommendation: "补充登记簿上的完整法人名称，并确保与页脚及隐私政策一致。",
  },
  {
    id: "R16", title: "支付总额显示不完整", risk: "medium", status: "issue", confidence: "中",
    source: "用户上传的最終確認画面截图", evidence: "商品小計 ¥6,980（送料另计）",
    explanation: "最终确认画面未在提交订单前直接显示包含送料的支付总额。",
    basis: "消费者厅《通信販売における“最終確認画面”について》",
    recommendation: "在订单确定按钮附近显示商品小计、送料、税费和最终支付总额。",
  },
  {
    id: "R30", title: "跨境配送费用说明不足", risk: "medium", status: "issue", confidence: "中",
    source: "https://sakura-select.example.jp/guide/shipping", evidence: "海外倉庫から発送する場合があります。",
    explanation: "未说明海外发货时可能产生的关税、进口消费税及承担方。",
    basis: "消费者厅《通信販売広告について》／購入者が負担すべき金銭",
    recommendation: "说明发货地、预计配送时间，以及关税或进口费用是否由消费者承担。",
  },
];

const passTitles = [
  "特商法页面存在", "特商法页面容易到达", "代表者或业务负责人", "完整经营地址",
  "联系电话", "商品销售价格", "税费表示", "支付方式", "支付时间", "交付时间",
  "订单数量显示", "支付条件显示", "交付条件显示", "申请期限", "隐私政策存在且可达",
  "日本交易表达一致", "商品页面可访问", "联系渠道存在",
];
const unknownTitles = ["电话号码是否可实际联系", "经营地址是否真实有效", "排名及比较表达依据", "用户评价真实性", "个人信息实际处理流程"];

const passRuleIds = ["R01", "R02", "R04", "R05", "R06", "R07", "R08", "R10", "R11", "R12", "R13", "R15", "R17", "R18", "R19", "R20", "R22", "R27"];
const unknownRuleIds = ["R21", "R24", "R25", "R26", "R29"];
const passFindings = passTitles.map((title, index) => ({
  id: passRuleIds[index], title, risk: "pass", status: "pass", confidence: "高",
  source: "网站公开页面", evidence: "已发现必要字段，并且能够从主要页面到达。",
  explanation: "当前公开页面未发现该项基础信息缺失。", basis: "本次 MVP 基础检查规则",
  recommendation: "无需立即修改；网站更新后建议重新检查。",
}));
const unknownFindings = unknownTitles.map((title, index) => ({
  id: unknownRuleIds[index], title, risk: "unknown", status: "unknown", confidence: "低",
  source: "网站公开页面", evidence: "公开页面不足以验证该事项的真实性或实际执行情况。",
  explanation: "此项需要人工测试、补充材料或专业人士确认。", basis: "工具能力边界",
  recommendation: "请由运营人员进行人工确认，并将验证结果留档。",
}));
const allFindings = [...issueFindings, ...passFindings, ...unknownFindings];

function StatusIcon({ finding }) {
  if (finding.status === "pass") return <CheckCircle weight="fill" aria-hidden="true" />;
  if (finding.status === "unknown") return <Info weight="fill" aria-hidden="true" />;
  return <Warning weight="fill" aria-hidden="true" />;
}

function Sidebar({ view, onNavigate }) {
  const items = [
    { key: "flow", label: "新建检查", icon: Plus },
    { key: "records", label: "检查记录", icon: ClockCounterClockwise },
    { key: "rules", label: "规则说明", icon: BookOpen },
  ];
  return (
    <aside className="sidebar">
      <div className="brand"><ShieldCheck weight="duotone" /><span>证据优先的<br />合规工作台</span></div>
      <nav aria-label="主要导航">
        {items.map(({ key, label, icon: Icon }) => (
          <button className={`nav-item ${view === key ? "active" : ""}`} key={key} onClick={() => onNavigate(key)} type="button">
            <Icon weight={view === key ? "fill" : "regular"} /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-note"><Sparkle weight="fill" /><div><strong>Demo 模式</strong><span>数据均为模拟内容</span></div></div>
    </aside>
  );
}

function Stepper({ step, onStep }) {
  return (
    <ol className="stepper" aria-label="检查流程">
      {steps.map((label, index) => {
        const number = index + 1;
        const completed = number < step;
        const active = number === step;
        return (
          <li className={`${completed ? "completed" : ""} ${active ? "active" : ""}`} key={label}>
            <button type="button" aria-current={active ? "step" : undefined} onClick={() => number <= step && onStep(number)} disabled={number > step}>
              <span className="step-marker">{completed ? <Check weight="bold" /> : number}</span>
              <span className="step-copy"><strong>{number} {label}</strong><small>{completed ? "已完成" : active ? "当前步骤" : "待进行"}</small></span>
            </button>
            {number < steps.length && <span className="step-line" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function FlowHeader({ step, onStep }) {
  return (
    <header className="flow-header">
      <div className="project-heading"><div><p className="eyebrow">日本 EC 网站风险体检</p><h1>{step === 4 ? "检查报告" : steps[step - 1]}</h1></div><div className="current-date">当前日期：2026-08-31</div></div>
      <div className="project-line"><strong>Sakura Select 日本站</strong><a href="#site">https://sakura-select.example.jp <ArrowSquareOut /></a></div>
      <Stepper step={step} onStep={onStep} />
    </header>
  );
}

function WebsiteStep({ project, setProject, onNext }) {
  return (
    <section className="setup-screen" aria-labelledby="website-step-title">
      <div className="setup-main">
        <p className="section-kicker">第 1 步，共 4 步</p><h2 id="website-step-title">输入要检查的网站</h2>
        <p className="section-lead">只读取公开页面，不会提交表单、创建订单或进行真实购买。</p>
        <label className="field-label" htmlFor="project-name">项目名称</label>
        <input id="project-name" value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
        <label className="field-label" htmlFor="website-url">网站 URL</label>
        <div className="input-with-icon"><Globe /><input id="website-url" value={project.url} onChange={(e) => setProject({ ...project, url: e.target.value })} /></div>
        <p className="field-help">Demo 已预填模拟网站地址，可直接继续体验。</p>
        <div className="setup-actions"><button className="primary-button" type="button" onClick={onNext}>继续设置检查范围 <ArrowRight weight="bold" /></button></div>
      </div>
      <aside className="setup-aside">
        <h3>本次体验将展示</h3>
        <ul className="check-list"><li><CheckCircle weight="fill" />5 个业务范围问题</li><li><CheckCircle weight="fill" />30 条模拟基础规则</li><li><CheckCircle weight="fill" />扫描进度与页面发现</li><li><CheckCircle weight="fill" />证据优先的整改报告</li></ul>
        <div className="boundary-note compact"><Info weight="fill" /><span>风险筛查工具，不构成法律意见或合规认证。</span></div>
      </aside>
    </section>
  );
}

function RadioGroup({ label, value, options, onChange }) {
  return <fieldset className="question-row"><legend>{label}</legend><div className="radio-options">{options.map((option) => <label key={option.value}><input type="radio" name={label} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span>{option.label}</span></label>)}</div></fieldset>;
}

function ScopeStep({ scope, setScope, onBack, onNext }) {
  const [fileName, setFileName] = useState("");
  return (
    <section className="scope-screen" aria-labelledby="scope-title">
      <div className="scope-heading"><div><p className="section-kicker">第 2 步，共 4 步</p><h2 id="scope-title">确认本次检查范围</h2><p>回答 5 个问题，我们会自动判断适用规则；预计 1 分钟完成。</p></div><div className="rule-count"><ListChecks weight="duotone" /><strong>30</strong><span>条基础检查</span></div></div>
      <div className="scope-grid">
        <div className="question-list">
          <RadioGroup label="1. 经营主体所在地" value={scope.location} options={[{ value: "japan", label: "日本" }, { value: "overseas", label: "海外" }]} onChange={(value) => setScope({ ...scope, location: value })} />
          <RadioGroup label="2. 经营主体类型" value={scope.entity} options={[{ value: "company", label: "法人" }, { value: "individual", label: "个人事业者" }]} onChange={(value) => setScope({ ...scope, entity: value })} />
          <div className="question-row select-row"><label htmlFor="category">3. 商品类别</label><div className="select-control"><select id="category" value={scope.category} onChange={(e) => setScope({ ...scope, category: e.target.value })}><option value="ordinary">普通实体商品</option><option value="cosmetics">化妆品（需专项复核）</option><option value="food">食品／保健品（需专项复核）</option></select><CaretDown /></div></div>
          <RadioGroup label="4. 销售方式" value={scope.sales} options={[{ value: "single", label: "单次购买" }, { value: "subscription", label: "定期购" }]} onChange={(value) => setScope({ ...scope, sales: value })} />
          <RadioGroup label="5. 发货地" value={scope.shipping} options={[{ value: "japan", label: "日本境内" }, { value: "overseas", label: "海外" }]} onChange={(value) => setScope({ ...scope, shipping: value })} />
        </div>
        <aside className="scope-summary"><h3>本次检查包含</h3><ul><li>特定商取引法基础表示</li><li>最終確認画面</li><li>广告表示风险</li><li>个人信息基础表示</li><li>日本在地化与跨境配送</li></ul><div className="scope-alert"><Warning weight="fill" /><div><strong>专项提示</strong><span>跨境配送信息将重点检查</span></div></div></aside>
      </div>
      <label className="upload-strip"><UploadSimple weight="duotone" /><span><strong>最終確認画面截图（可稍后补充）</strong><small>{fileName || "上传前请删除姓名、地址、电话及支付信息"}</small></span><input type="file" accept="image/png,image/jpeg" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} /><span className="outline-button">选择文件</span></label>
      <div className="setup-actions split-actions"><button className="secondary-button" type="button" onClick={onBack}><ArrowLeft weight="bold" />返回网站信息</button><button className="primary-button" type="button" onClick={onNext}>开始自动检查 <ArrowRight weight="bold" /></button></div>
    </section>
  );
}

const scanMilestones = [{ at: 0, label: "正在连接网站…" }, { at: 28, label: "已发现首页与商品页面" }, { at: 46, label: "已发现特定商取引法页面" }, { at: 63, label: "正在检查配送与退货信息" }, { at: 81, label: "正在检查广告表达与隐私政策" }, { at: 100, label: "30 条规则检查完成" }];

function ScanStep({ progress, scanComplete, onViewReport }) {
  const milestone = [...scanMilestones].reverse().find((item) => progress >= item.at);
  return (
    <section className="scan-screen" aria-labelledby="scan-title">
      <div className={`scan-orbit ${scanComplete ? "complete" : ""}`}>{scanComplete ? <Check weight="bold" /> : <MagnifyingGlass weight="bold" />}</div>
      <p className="section-kicker">第 3 步，共 4 步</p><h2 id="scan-title">{scanComplete ? "模拟检查已完成" : "正在检查网站公开页面"}</h2><p>{milestone.label}</p>
      <div className="progress-track" aria-label={`扫描进度 ${progress}%`}><span style={{ width: `${progress}%` }} /></div><strong className="progress-value">{progress}%</strong>
      <div className="scan-log"><div><CheckCircle weight="fill" /><span>已发现关键页面</span><strong>{Math.min(8, Math.max(1, Math.floor(progress / 12)))} / 8</strong></div><div><CheckCircle weight="fill" /><span>已执行基础规则</span><strong>{Math.min(30, Math.floor(progress * 0.3))} / 30</strong></div><div className={progress >= 80 ? "done" : "pending"}>{progress >= 80 ? <CheckCircle weight="fill" /> : <CircleNotch className="spin" />}<span>正在整理页面证据与整改建议</span><strong>{progress >= 80 ? "已完成" : "进行中"}</strong></div></div>
      {scanComplete && <button className="primary-button" type="button" onClick={onViewReport}>查看风险报告 <ArrowRight weight="bold" /></button>}
      <div className="boundary-note compact scan-boundary"><ShieldCheck weight="duotone" /><span>Demo 只模拟公开页面检查，不会访问真实网站。</span></div>
    </section>
  );
}

function Summary({ filter, setFilter }) {
  const items = [{ label: "高风险", value: 3, className: "summary-high", filter: "issue" }, { label: "中风险", value: 4, className: "summary-medium", filter: "issue" }, { label: "通过", value: 18, className: "summary-pass", filter: "pass" }, { label: "无法确认", value: 5, className: "summary-unknown", filter: "unknown" }];
  return <div className="summary-row" aria-label="检查结果摘要">{items.map((item) => <button key={item.label} className={`${item.className} ${filter === item.filter ? "selected" : ""}`} type="button" onClick={() => setFilter(filter === item.filter ? "all" : item.filter)}><span>{item.label}</span><strong>{item.value}</strong></button>)}</div>;
}

function FindingList({ selectedId, onSelect, filter, setFilter, sort, setSort }) {
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const next = filter === "all" ? allFindings : allFindings.filter((item) => item.status === filter);
    return [...next].sort((a, b) => sort === "rule" ? a.id.localeCompare(b.id) : riskRank[a.risk] - riskRank[b.risk]);
  }, [filter, sort]);
  useEffect(() => setPage(1), [filter, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const visible = filtered.slice((page - 1) * 10, page * 10);
  return (
    <section className="findings-panel" aria-label="检查结果列表">
      <div className="panel-toolbar"><h2>检查结果 <span>（30 项）</span></h2><div className="toolbar-controls"><label><span className="sr-only">筛选状态</span><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">全部状态</option><option value="issue">发现问题</option><option value="pass">通过</option><option value="unknown">无法确认</option></select><CaretDown /></label><label><span className="sr-only">排序方式</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="risk">按风险排序</option><option value="rule">按编号排序</option></select><CaretDown /></label></div></div>
      <div className="finding-table-header"><span>编号</span><span>检查项</span><span>风险级别</span><span>状态</span></div>
      <div className="finding-list">{visible.map((finding) => { const meta = riskMeta[finding.risk]; return <button type="button" className={`finding-row ${selectedId === finding.id ? "selected" : ""}`} key={`${finding.id}-${finding.title}`} onClick={() => onSelect(finding)}><span className="finding-id">{finding.id}</span><span className="finding-title">{finding.title}</span><span><span className={`risk-pill ${meta.className}`}>{meta.label}</span></span><span className={`finding-status status-${finding.status}`}><StatusIcon finding={finding} />{finding.status === "issue" ? "问题" : finding.status === "pass" ? "通过" : "待确认"}</span><CaretRight className="row-caret" /></button>; })}{visible.length === 0 && <div className="empty-state">当前筛选条件下没有结果。</div>}</div>
      <div className="pagination"><span>{filtered.length} 项结果</span><button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="上一页"><CaretLeft /></button>{Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} type="button" className={n === page ? "current" : ""} onClick={() => setPage(n)}>{n}</button>)}<button type="button" onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} aria-label="下一页"><CaretRight /></button></div>
    </section>
  );
}

function DetailPane({ finding, onClose }) {
  const [copied, setCopied] = useState(false);
  const meta = riskMeta[finding.risk];
  const copy = async () => { try { await navigator.clipboard.writeText(finding.recommendation); } catch { /* local preview may deny clipboard */ } setCopied(true); window.setTimeout(() => setCopied(false), 1200); };
  return (
    <aside className="detail-pane" aria-live="polite">
      <div className="detail-title"><div><strong>{finding.id}</strong><h2>{finding.title}</h2><span className={`risk-pill ${meta.className}`}>{meta.label}</span></div><button type="button" aria-label="关闭详情" onClick={onClose}><X /></button></div>
      <dl className="detail-sections"><div><dt>页面来源</dt><dd className="source-link">{finding.source}<ArrowSquareOut /></dd><dd className="inspection-time">检查时间：2026-08-31 10:24:15</dd></div><div><dt>页面原文证据</dt><dd className="evidence-box"><span>{finding.evidence}</span><button type="button" onClick={copy}><Copy />{copied ? "已复制" : "复制"}</button></dd></div><div><dt>风险说明</dt><dd>{finding.explanation}</dd></div><div><dt>官方依据</dt><dd className="basis-text">{finding.basis}<ArrowSquareOut /></dd></div><div><dt>整改建议</dt><dd>{finding.recommendation}</dd></div><div><dt>把握度</dt><dd className="confidence"><strong>{finding.confidence}</strong><span className={`confidence-bars confidence-${finding.confidence}`}><i /><i /><i /><i /><i /></span><Info /></dd></div></dl>
    </aside>
  );
}

function ReportStep({ onRecheck }) {
  const [selected, setSelected] = useState(issueFindings[0]);
  const [detailOpen, setDetailOpen] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("risk");
  const [exported, setExported] = useState(false);
  const exportReport = () => {
    const body = ["Sakura Select 日本站｜整改报告（Demo）", "检查日期：2026-08-31", "高风险 3｜中风险 4｜通过 18｜无法确认 5", "", ...issueFindings.map((item) => `${item.id} ${item.title}\n整改建议：${item.recommendation}\n`), "本报告为风险筛查结果，不构成法律意见或合规认证。"].join("\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "Sakura-Select-整改报告-Demo.txt"; anchor.click(); URL.revokeObjectURL(url); setExported(true); window.setTimeout(() => setExported(false), 1800);
  };
  return (
    <section className="report-screen">
      <div className="report-summary"><div className="report-headline"><Warning weight="fill" /><h2>发现 7 项问题 · 5 项需优先处理</h2></div><div className="summary-actions"><button className="secondary-button" type="button" onClick={onRecheck}><ClockCounterClockwise />重新检查</button><button className="primary-button" type="button" onClick={exportReport}>{exported ? <Check /> : <DownloadSimple />}{exported ? "报告已导出" : "导出整改报告"}</button></div><Summary filter={filter} setFilter={setFilter} /></div>
      <div className="report-workspace"><FindingList selectedId={detailOpen ? selected.id : undefined} onSelect={(finding) => { setSelected(finding); setDetailOpen(true); }} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />{detailOpen ? <DetailPane finding={selected} onClose={() => setDetailOpen(false)} /> : <aside className="detail-pane detail-empty"><Info weight="duotone" /><strong>选择检查项查看证据</strong><span>点击左侧任一结果，可查看页面来源、原文证据和整改建议。</span></aside>}</div>
      <div className="boundary-note report-boundary"><ShieldCheck weight="duotone" /><span>风险筛查结果，不构成法律意见或合规认证</span></div>
    </section>
  );
}

function RecordsView({ onOpen }) {
  const records = [{ name: "Sakura Select 日本站", url: "sakura-select.example.jp", date: "2026-08-31", high: 3, status: "待整改" }, { name: "Hikari Living", url: "hikari-living.example.jp", date: "2026-08-27", high: 0, status: "已复查" }, { name: "Mori Market", url: "mori-market.example.jp", date: "2026-08-18", high: 2, status: "待整改" }];
  return <section className="standalone-view"><div className="standalone-heading"><div><p className="eyebrow">项目工作区</p><h1>检查记录</h1><p>查看最近的模拟检查结果，或返回继续整改。</p></div><button className="primary-button" type="button" onClick={() => onOpen("new")}><Plus />新建检查</button></div><div className="records-list">{records.map((r) => <button key={r.name} type="button" onClick={() => onOpen(r.name)}><span className="record-icon"><FileText weight="duotone" /></span><span className="record-main"><strong>{r.name}</strong><small>{r.url}</small></span><span><small>检查日期</small><strong>{r.date}</strong></span><span><small>高风险</small><strong className={r.high ? "danger-text" : "success-text"}>{r.high}</strong></span><span className={`record-status ${r.status === "已复查" ? "checked" : ""}`}>{r.status}</span><CaretRight /></button>)}</div></section>;
}

function RulesView() {
  const groups = [{ title: "特定商取引法及基础交易信息", count: 14, description: "经营者、价格、送料、支付、交付与退货条件" }, { title: "最終確認画面", count: 7, description: "数量、总额、支付、交付、取消与定期购条件" }, { title: "广告表示风险提示", count: 5, description: "排名、绝对化表达、折扣、稀缺及推荐依据" }, { title: "个人信息与日本在地化", count: 4, description: "隐私政策、利用目的、日本交易表达与跨境配送" }];
  return <section className="standalone-view"><div className="standalone-heading"><div><p className="eyebrow">MVP 规则基线</p><h1>规则说明</h1><p>当前 Demo 使用 30 条模拟规则，结果只表示公开页面风险。</p></div></div><div className="rules-intro"><BookOpen weight="duotone" /><div><strong>规则结果有四种状态</strong><p>通过、发现问题、无法自动确认、不适用。没有取得充分证据时，系统不会判断为通过。</p></div></div><div className="rule-groups">{groups.map((g, i) => <article key={g.title}><span>{String(i + 1).padStart(2, "0")}</span><div><h2>{g.title}</h2><p>{g.description}</p></div><strong>{g.count} 条</strong></article>)}</div><div className="boundary-note"><Info weight="fill" /><span>专项商品法规不在首版覆盖范围内，需要专业人士进一步复核。</span></div></section>;
}

export function App() {
  const [view, setView] = useState("flow");
  const [step, setStep] = useState(1);
  const [project, setProject] = useState({ name: "Sakura Select 日本站", url: "https://sakura-select.example.jp" });
  const [scope, setScope] = useState({ location: "overseas", entity: "company", category: "ordinary", sales: "single", shipping: "overseas" });
  const [progress, setProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (view !== "flow" || step !== 3 || scanComplete) return undefined;
    setProgress(4);
    timerRef.current = window.setInterval(() => setProgress((current) => { const next = Math.min(100, current + 4); if (next === 100) { window.clearInterval(timerRef.current); setScanComplete(true); } return next; }), 90);
    return () => window.clearInterval(timerRef.current);
  }, [view, step, scanComplete]);

  const startScan = () => { setProgress(0); setScanComplete(false); setStep(3); };
  const navigate = (next) => { setView(next); if (next === "flow" && step === 4) setStep(1); };
  const openRecord = (record) => { setView("flow"); if (record === "new") setStep(1); else { setStep(4); setScanComplete(true); setProgress(100); } };

  return <div className="app-shell"><Sidebar view={view} onNavigate={navigate} /><main className="main-surface">{view === "flow" && <><FlowHeader step={step} onStep={setStep} />{step === 1 && <WebsiteStep project={project} setProject={setProject} onNext={() => setStep(2)} />}{step === 2 && <ScopeStep scope={scope} setScope={setScope} onBack={() => setStep(1)} onNext={startScan} />}{step === 3 && <ScanStep progress={progress} scanComplete={scanComplete} onViewReport={() => setStep(4)} />}{step === 4 && <ReportStep onRecheck={startScan} />}</>}{view === "records" && <RecordsView onOpen={openRecord} />}{view === "rules" && <RulesView />}</main></div>;
}
