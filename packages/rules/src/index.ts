import type { CrawledPage, Finding, FindingStatus, RiskLevel, ScopeAnswers } from "@checker/shared";

interface RuleDefinition {
  id: string;
  title: string;
  category: string;
  risk: RiskLevel;
  basis: string;
  recommendation: string;
}

const categories = {
  trade: "特定商取引法及基础交易信息",
  checkout: "最終確認画面",
  ads: "广告表示风险提示",
  privacy: "个人信息与日本在地化",
};

const caaTrade = "消费者厅《通信販売广告について》／特定商取引法第 11 条";
const caaCheckout = "消费者厅《通信販売における最終確認画面について》";
const caaAds = "消费者厅《表示に関する Q＆A》／景品表示法";
const ppc = "个人信息保护委员会《个人信息保护法指南（通则编）》";

export const ruleDefinitions: RuleDefinition[] = [
  { id: "R01", title: "特商法页面存在", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "建立并公开“特定商取引法に基づく表記”页面。" },
  { id: "R02", title: "特商法页面容易到达", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "从首页页脚或商品相关页面提供清楚的特商法页面入口。" },
  { id: "R03", title: "经营者正式名称", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "显示登记簿中的完整法人名称或个人事业者法定姓名。" },
  { id: "R04", title: "代表者或业务负责人", category: categories.trade, risk: "medium", basis: caaTrade, recommendation: "法人网站补充代表者或通信販売业务负责人。" },
  { id: "R05", title: "完整经营地址", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "显示没有省略的完整经营地址。" },
  { id: "R06", title: "联系电话", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "显示消费者可以联系的电话号码。" },
  { id: "R07", title: "商品销售价格", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "在商品页清楚显示销售价格。" },
  { id: "R08", title: "税费表示", category: categories.trade, risk: "medium", basis: caaTrade, recommendation: "明确价格是否含税以及适用税费。" },
  { id: "R09", title: "送料说明", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "明确各地区送料、免邮门槛或购买前可确认送料的位置。" },
  { id: "R10", title: "其他附加费用", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "说明手续费、关税等消费者可能承担的其他费用。" },
  { id: "R11", title: "支付方式", category: categories.trade, risk: "medium", basis: caaTrade, recommendation: "列出可使用的支付方式。" },
  { id: "R12", title: "支付时间", category: categories.trade, risk: "medium", basis: caaTrade, recommendation: "说明各支付方式的扣款或付款时间。" },
  { id: "R13", title: "交付时间", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "说明付款后预计发货或交付时间。" },
  { id: "R14", title: "退货与取消条件", category: categories.trade, risk: "high", basis: caaTrade, recommendation: "明确可否退货、申请期限、商品状态、运费承担和瑕疵品处理。" },
  { id: "R15", title: "数量或服务期间", category: categories.checkout, risk: "high", basis: caaCheckout, recommendation: "在订单确定前显示商品数量、次数或服务期间。" },
  { id: "R16", title: "支付总额", category: categories.checkout, risk: "high", basis: caaCheckout, recommendation: "在订单确定前显示商品、送料、税费和最终支付总额。" },
  { id: "R17", title: "支付条件", category: categories.checkout, risk: "high", basis: caaCheckout, recommendation: "在最終確認画面显示支付方式和支付时间。" },
  { id: "R18", title: "交付条件", category: categories.checkout, risk: "high", basis: caaCheckout, recommendation: "在最終確認画面显示预计发货或交付时间。" },
  { id: "R19", title: "取消、退货与解约", category: categories.checkout, risk: "high", basis: caaCheckout, recommendation: "在订单确定按钮附近显示取消、退货或解约条件。" },
  { id: "R20", title: "申请期限", category: categories.checkout, risk: "medium", basis: caaCheckout, recommendation: "限时销售存在时，在订单确定前显示申请截止时间。" },
  { id: "R21", title: "定期购完整条件", category: categories.checkout, risk: "high", basis: caaCheckout, recommendation: "显示各期价格、次数、总额、后续发货和解约方式。" },
  { id: "R22", title: "排名及比较表达", category: categories.ads, risk: "medium", basis: caaAds, recommendation: "对排名或比较表达补充调查对象、期间、方法和依据。" },
  { id: "R23", title: "绝对及效果表达", category: categories.ads, risk: "high", basis: caaAds, recommendation: "删除无法充分证明的绝对化或效果保证表达，并进行专业复核。" },
  { id: "R24", title: "原价及折扣表达", category: categories.ads, risk: "medium", basis: caaAds, recommendation: "保存并说明比较价格和折扣依据。" },
  { id: "R25", title: "稀缺及限时表达", category: categories.ads, risk: "medium", basis: caaAds, recommendation: "确认倒计时、库存和限时优惠真实且不会重复重置。" },
  { id: "R26", title: "推荐、评价及前后对比", category: categories.ads, risk: "medium", basis: caaAds, recommendation: "保存评价、推荐和前后对比的真实性及使用授权证据。" },
  { id: "R27", title: "隐私政策存在且可达", category: categories.privacy, risk: "high", basis: ppc, recommendation: "建立隐私政策，并从首页或表单附近提供入口。" },
  { id: "R28", title: "个人信息基础说明", category: categories.privacy, risk: "medium", basis: ppc, recommendation: "说明个人信息利用目的、咨询窗口及适用的第三方提供或跨境处理。" },
  { id: "R29", title: "日本交易表达一致性", category: categories.privacy, risk: "medium", basis: "日本市场在地化基础检查", recommendation: "统一日文、日元、日期、地址、电话及税费表达。" },
  { id: "R30", title: "跨境配送信息", category: categories.privacy, risk: "high", basis: caaTrade, recommendation: "海外发货时说明发货地、配送时间、关税和进口费用承担方。" },
];

export interface RuleContext {
  pages: CrawledPage[];
  scope: ScopeAnswers;
  checkoutText?: string;
}

const has = (text: string, pattern: RegExp) => pattern.test(text);
const clean = (value: string) => value.replace(/\s+/g, " ").trim();

function makeFinding(rule: RuleDefinition, status: FindingStatus, page: CrawledPage | undefined, evidence: string, explanation: string, confidence: Finding["confidence"] = "medium"): Finding {
  return {
    ruleId: rule.id,
    title: rule.title,
    category: rule.category,
    risk: rule.risk,
    status,
    sourceUrl: page?.url ?? null,
    evidence: clean(evidence).slice(0, 500) || "当前扫描范围内没有取得足够的页面证据。",
    explanation,
    recommendation: rule.recommendation,
    basis: rule.basis,
    confidence,
  };
}

function pageOf(pages: CrawledPage[], ...kinds: CrawledPage["kind"][]): CrawledPage | undefined {
  return pages.find((page) => kinds.includes(page.kind));
}

function fieldRule(rule: RuleDefinition, page: CrawledPage | undefined, pattern: RegExp, label: string): Finding {
  if (!page) return makeFinding(rule, "unknown", undefined, "未发现优先检查页面。", `没有取得能够判断${label}的页面，不能判为通过。`, "low");
  if (has(page.text, pattern)) return makeFinding(rule, "pass", page, page.text.match(pattern)?.[0] ?? label, `当前页面发现了${label}相关字段。`, "medium");
  return makeFinding(rule, "issue", page, `${page.title || "相关页面"}中未发现${label}字段。`, `已发现相关页面，但没有识别到${label}。`, "medium");
}

function checkoutRule(rule: RuleDefinition, checkoutText: string | undefined, pattern: RegExp, label: string): Finding {
  if (!checkoutText) return makeFinding(rule, "unknown", undefined, "未提供可识别的最終確認画面文字。", `该项需要最終確認画面截图或人工操作确认${label}。`, "low");
  if (has(checkoutText, pattern)) return makeFinding(rule, "pass", undefined, checkoutText.match(pattern)?.[0] ?? label, `截图文字中发现${label}。`, "medium");
  return makeFinding(rule, "issue", undefined, `截图文字中未发现${label}。`, `当前最終確認画面没有识别到${label}。`, "medium");
}

export function evaluateRules(context: RuleContext): Finding[] {
  const { pages, scope, checkoutText } = context;
  const allText = pages.map((page) => page.text).join("\n");
  const home = pageOf(pages, "home");
  const legal = pageOf(pages, "legal");
  const privacy = pageOf(pages, "privacy");
  const shipping = pageOf(pages, "shipping") ?? legal;
  const returns = pageOf(pages, "returns") ?? legal;
  const product = pageOf(pages, "product") ?? home;
  const findings = new Map<string, Finding>();
  const add = (finding: Finding) => findings.set(finding.ruleId, finding);
  const rule = (id: string) => ruleDefinitions.find((item) => item.id === id)!;

  add(legal
    ? makeFinding(rule("R01"), "pass", legal, legal.title || legal.url, "已发现特定商取引法相关页面。", "high")
    : makeFinding(rule("R01"), "issue", home, "未发现特定商取引法相关页面。", "在本次扫描的站内链接中没有找到特商法页面。", "high"));
  add(legal?.linkedFromHome
    ? makeFinding(rule("R02"), "pass", legal, "该页面可以从首页链接到达。", "特商法页面入口可从首页发现。", "high")
    : makeFinding(rule("R02"), legal ? "issue" : "unknown", legal ?? home, "未确认首页存在清楚入口。", legal ? "页面存在，但未确认能从首页容易到达。" : "尚未找到页面，因此无法判断入口。", legal ? "medium" : "low"));

  add(fieldRule(rule("R03"), legal, /販売業者|事業者名|会社名|販売者/, "经营者正式名称"));
  add(scope.entity === "individual"
    ? makeFinding(rule("R04"), "not_applicable", legal, "经营主体选择为个人事业者。", "法人代表者规则不适用于本次范围。", "high")
    : fieldRule(rule("R04"), legal, /代表者|運営責任者|販売責任者|責任者/, "代表者或业务负责人"));
  add(fieldRule(rule("R05"), legal, /所在地|住所|〒\s*\d{3}[-ー]?\d{4}/, "经营地址"));
  add(fieldRule(rule("R06"), legal, /電話|TEL|tel|\d{2,4}-\d{2,4}-\d{3,4}/, "联系电话"));
  add(fieldRule(rule("R07"), product, /[¥￥]\s?[\d,]+|[\d,]+\s?円/, "商品销售价格"));
  add(fieldRule(rule("R08"), product, /税込|税別|消費税|内税|外税/, "税费表示"));
  add(fieldRule(rule("R09"), shipping, /送料|配送料|送料無料|shipping/i, "送料"));

  const extraCost = pages.find((page) => has(page.text, /手数料|関税|輸入消費税|その他.*費用/));
  add(extraCost
    ? makeFinding(rule("R10"), "pass", extraCost, extraCost.text.match(/手数料|関税|輸入消費税|その他.*費用/)?.[0] ?? "附加费用", "发现了附加费用相关说明。", "medium")
    : makeFinding(rule("R10"), "unknown", legal, "未识别到手续费、关税等说明。", "无法仅凭缺少关键词确认是否确实不存在其他费用。", "low"));

  add(fieldRule(rule("R11"), legal, /支払方法|クレジットカード|銀行振込|代金引換|PayPay|決済方法/, "支付方式"));
  add(fieldRule(rule("R12"), legal, /支払時期|決済時期|注文時|発送時|引き落とし|前払い|後払い/, "支付时间"));
  add(fieldRule(rule("R13"), shipping ?? legal, /引渡し時期|発送|配送|お届け|営業日/, "交付时间"));
  add(fieldRule(rule("R14"), returns, /返品|返金|キャンセル|交換|不良品/, "退货与取消条件"));

  add(checkoutRule(rule("R15"), checkoutText, /数量|個数|点数|契約期間/, "数量或服务期间"));
  add(checkoutRule(rule("R16"), checkoutText, /合計|総額|お支払い金額|注文金額/, "支付总额"));
  add(checkoutRule(rule("R17"), checkoutText, /支払|決済|クレジット|振込/, "支付条件"));
  add(checkoutRule(rule("R18"), checkoutText, /発送|配送|お届け|引渡し/, "交付条件"));
  add(checkoutRule(rule("R19"), checkoutText, /返品|キャンセル|解約|返金/, "取消、退货或解约条件"));

  const limitedSale = has(allText, /期間限定|本日まで|締切|申込期限|タイムセール/);
  add(limitedSale
    ? checkoutRule(rule("R20"), checkoutText, /期限|締切|まで/, "申请期限")
    : makeFinding(rule("R20"), "not_applicable", undefined, "扫描页面未发现限时销售表达。", "当前范围未识别到需要显示申请期限的销售方式。", "medium"));
  add(scope.sales === "single"
    ? makeFinding(rule("R21"), "not_applicable", undefined, "销售方式选择为单次购买。", "定期购规则不适用于本次范围。", "high")
    : checkoutRule(rule("R21"), checkoutText, /定期|各回|回数|総額|解約/, "定期购完整条件"));

  const rankPage = pages.find((page) => has(page.text, /No\.?\s?1|第[一1]位|最安|日本一|業界一/iu));
  add(rankPage
    ? makeFinding(rule("R22"), "unknown", rankPage, rankPage.text.match(/No\.?\s?1|第[一1]位|最安|日本一|業界一/iu)?.[0] ?? "排名表达", "发现排名或比较表达，但其调查依据需要人工确认。", "medium")
    : makeFinding(rule("R22"), "not_applicable", undefined, "扫描页面未发现排名或比较表达。", "本次扫描范围内未触发该项。", "medium"));
  const absolutePage = pages.find((page) => has(page.text, /100\s?%|絶対|必ず|完全|確実|即効|治る|改善する/));
  add(absolutePage
    ? makeFinding(rule("R23"), "issue", absolutePage, absolutePage.text.match(/100\s?%|絶対|必ず|完全|確実|即効|治る|改善する/)?.[0] ?? "绝对化表达", "发现需要充分证据支持的绝对化或效果表达。", "medium")
    : makeFinding(rule("R23"), "pass", product, "扫描页面未发现预设的绝对化高风险关键词。", "当前自动检查范围内未发现明显绝对化表达。", "medium"));
  const pricePage = pages.find((page) => has(page.text, /通常価格|参考価格|半額|[0-9]+%OFF|割引/));
  add(pricePage
    ? makeFinding(rule("R24"), "unknown", pricePage, pricePage.text.match(/通常価格|参考価格|半額|[0-9]+%OFF|割引/)?.[0] ?? "比较价格", "发现折扣或比较价格表达，需要人工确认依据。", "medium")
    : makeFinding(rule("R24"), "not_applicable", undefined, "扫描页面未发现比较价格表达。", "本次扫描范围内未触发该项。", "medium"));
  const scarcityPage = pages.find((page) => has(page.text, /残り\d+|在庫わずか|期間限定|本日まで|タイムセール|カウントダウン/));
  add(scarcityPage
    ? makeFinding(rule("R25"), "unknown", scarcityPage, scarcityPage.text.match(/残り\d+|在庫わずか|期間限定|本日まで|タイムセール|カウントダウン/)?.[0] ?? "稀缺表达", "发现稀缺或限时表达，真实性和重复重置需要人工确认。", "medium")
    : makeFinding(rule("R25"), "not_applicable", undefined, "扫描页面未发现稀缺或限时表达。", "本次扫描范围内未触发该项。", "medium"));
  const reviewPage = pages.find((page) => has(page.text, /お客様の声|口コミ|レビュー|推薦|Before|After|ビフォー|アフター/i));
  add(reviewPage
    ? makeFinding(rule("R26"), "unknown", reviewPage, reviewPage.text.match(/お客様の声|口コミ|レビュー|推薦|Before|After|ビフォー|アフター/i)?.[0] ?? "评价表达", "发现评价、推荐或前后对比，需要人工确认真实性和授权。", "medium")
    : makeFinding(rule("R26"), "not_applicable", undefined, "扫描页面未发现评价或前后对比表达。", "本次扫描范围内未触发该项。", "medium"));

  add(privacy
    ? makeFinding(rule("R27"), "pass", privacy, privacy.title || privacy.url, "已发现隐私政策页面。", "high")
    : makeFinding(rule("R27"), "issue", home, "未发现隐私政策页面。", "本次扫描未找到可到达的隐私政策。", "high"));
  if (!privacy) add(makeFinding(rule("R28"), "unknown", undefined, "未取得隐私政策。", "无法确认个人信息利用目的和咨询窗口。", "low"));
  else if (has(privacy.text, /利用目的/) && has(privacy.text, /問い合わせ|窓口|連絡/)) add(makeFinding(rule("R28"), "pass", privacy, "发现利用目的和咨询窗口相关字段。", "隐私政策包含基础说明。", "medium"));
  else add(makeFinding(rule("R28"), "issue", privacy, "未同时识别到利用目的和咨询窗口。", "隐私政策基础字段可能不完整。", "medium"));

  const japanese = has(allText, /[ぁ-んァ-ヶ一-龠]/);
  const yen = has(allText, /[¥￥]|円/);
  add(japanese && yen
    ? makeFinding(rule("R29"), "pass", home, "发现日文内容和日元表达。", "当前页面具备日本交易的基础语言及货币表达。", "medium")
    : makeFinding(rule("R29"), "issue", home, `${japanese ? "已发现日文" : "未充分发现日文"}；${yen ? "已发现日元" : "未发现日元"}。`, "日本市场基础表达可能不完整或不一致。", "medium"));

  const overseas = scope.shipping === "overseas" || scope.shipping === "both";
  add(!overseas
    ? makeFinding(rule("R30"), "not_applicable", shipping, "发货地选择为日本境内。", "跨境配送规则不适用于本次范围。", "high")
    : shipping && has(shipping.text, /海外|関税|輸入|通関/) && has(shipping.text, /配送|発送|お届け/)
      ? makeFinding(rule("R30"), "pass", shipping, "发现海外发货及配送费用相关说明。", "页面包含跨境配送基础信息。", "medium")
      : makeFinding(rule("R30"), "issue", shipping, "未完整识别海外发货、配送时间及关税说明。", "经营范围包含海外发货，但页面信息可能不足。", "medium"));

  return ruleDefinitions.map((definition) => findings.get(definition.id)!);
}

export function summarizeFindings(findings: Finding[]): Record<FindingStatus, number> {
  return findings.reduce<Record<FindingStatus, number>>((summary, finding) => {
    summary[finding.status] += 1;
    return summary;
  }, { pass: 0, issue: 0, unknown: 0, not_applicable: 0 });
}
