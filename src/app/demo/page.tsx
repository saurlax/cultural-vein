import Link from "next/link";

import { riverDataset } from "@/data/demo-graph";

const narrativeSteps = [
  {
    id: "macro",
    label: "01",
    title: "飞越文脉",
    detail:
      "从《诗经》《礼记》到《四书章句集注》，先把典籍传承看成会随时代生长的知识长河，而不是难以阅读的节点团。",
  },
  {
    id: "meso",
    label: "02",
    title: "钻入典籍",
    detail:
      "以《四书章句集注》为主案例，向评审展示传播路径、人物关联、版本流变和时间线如何形成一套完整中观叙事。",
  },
  {
    id: "micro",
    label: "03",
    title: "逐字探源",
    detail:
      "切到文本层，说明显式引用、语义关联、间接影响三类证据如何区分，保证系统既有探索性，也有学术边界。",
  },
  {
    id: "data",
    label: "04",
    title: "真实数据接入",
    detail:
      "强调 CBDB、上海图书馆、南京图书馆、复旦大学图书馆样本已经被接到人物、活动、机构与时间线模块里。",
  },
  {
    id: "future",
    label: "05",
    title: "扩展成基础设施",
    detail:
      "最后把答辩从一个 demo 拉回到可扩展平台：继续导入数据，就能长出更多支流、人物和版本谱系。",
  },
] as const;

const scenarioCards = [
  {
    title: "学术研究",
    detail: "发现典籍间的引文、注疏和批评性继承，辅助文献溯源与学术史研究。",
  },
  {
    title: "展陈传播",
    detail: "面向图书馆或博物馆公共展示，让观众通过 3D 河流快速理解中华文脉。",
  },
  {
    title: "知识服务",
    detail: "作为后续接入图数据库、搜索引擎和更多开放数据的数字人文前端入口。",
  },
] as const;

const targetDatasets = [
  "古籍循证数据",
  "人名规范库",
  "书目数据",
  "CBDB",
  "地名志",
  "历史文化事件",
  "家谱 / 红色文献 / 诗词",
] as const;

const topBooks = [...riverDataset.books]
  .sort((left, right) => right.influence - left.influence)
  .slice(0, 4);

const citationLayerSummary = riverDataset.citations.reduce(
  (summary, citation) => {
    summary[citation.layer] = (summary[citation.layer] ?? 0) + 1;
    return summary;
  },
  {} as Record<string, number>,
);

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1b3e39_0%,#0f221f_34%,#081110_70%,#040807_100%)] text-stone-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-6 py-6 shadow-[0_25px_70px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="text-sm uppercase tracking-[0.32em] text-amber-300/80">
                Defense Narrative
              </div>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50">
                文脉溯源 · 一页式答辩页
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-stone-300">
                这是一页专为评审演示整理的叙事版本：不要求评审自己探索复杂工作台，而是顺着“宏观总览 →
                典籍钻入 → 文本探源 → 真实数据 → 工程扩展”快速理解作品价值。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone-200 transition hover:bg-white/10"
              >
                返回工作台
              </Link>
              <a
                href="#narrative"
                className="rounded-full bg-amber-300 px-4 py-2 text-sm text-stone-950 transition hover:bg-amber-200"
              >
                开始讲述
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-stone-400">典籍节点</div>
              <div className="mt-2 text-2xl font-semibold text-stone-50">
                {riverDataset.books.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-stone-400">关系边</div>
              <div className="mt-2 text-2xl font-semibold text-stone-50">
                {riverDataset.citations.length}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-stone-400">核心演示书</div>
              <div className="mt-2 text-2xl font-semibold text-stone-50">
                四书章句集注
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-stone-400">答辩重点</div>
              <div className="mt-2 text-2xl font-semibold text-stone-50">
                创新 + 严谨 + 数据
              </div>
            </div>
          </div>
        </header>

        <section
          id="narrative"
          className="rounded-[32px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(6,12,12,0.92))] px-6 py-6"
        >
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.24em] text-amber-100/75">
              Narrative Path
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-stone-50">
              五步完成整场答辩
            </h2>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              用固定路径回答评审最常追问的五个问题：为什么要用河流隐喻、是否有真实数据、如何保证严谨、系统能否扩展、作品能落到哪些真实场景。
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-5">
            {narrativeSteps.map((step) => (
              <div
                key={step.id}
                className="rounded-[24px] border border-white/10 bg-black/15 px-4 py-4"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-amber-100/75">
                  Step {step.label}
                </div>
                <div className="mt-2 text-lg font-semibold text-stone-50">{step.title}</div>
                <p className="mt-3 text-sm leading-7 text-stone-300">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-6 py-6">
            <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
              Innovation Frame
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-stone-50">
              为什么它不是普通知识图谱
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-sm font-medium text-stone-50">文脉 = 水脉</div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  用主河、支流、分叉、变宽、干涸去表达典籍传承，比传统 hairball
                  图谱更直观，也更贴合竞赛主题“文脉风华”。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-sm font-medium text-stone-50">三层交互架构</div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  宏观层负责看谱系，中观层负责找关系，微观层负责看证据，3D
                  是理解手段，不是炫技目的。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-sm font-medium text-stone-50">证据分层</div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  元数据、显式引用、语义关联、间接影响分层展示，不把研究线索包装成确定事实。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-sm font-medium text-stone-50">持续扩展</div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  当前先做深示范域，后续随着数据导入，河流和人物网络会自然生长成更完整的基础设施。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(13,27,27,0.96),rgba(7,14,14,0.98))] px-6 py-6">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">
              Current Coverage
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-stone-50">
              当前最适合现场点开的内容
            </h2>
            <div className="mt-5 grid gap-3">
              {topBooks.map((book) => (
                <div
                  key={book.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-stone-50">{book.title}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        {book.dynasty} · {book.category} · {book.school}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                      影响力 {book.influence}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-300">{book.summary}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[32px] border border-white/10 bg-black/20 px-6 py-6">
            <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
              Confidence System
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-stone-50">
              四类关系层级
            </h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-stone-50">元数据关系</span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-stone-100">
                    {citationLayerSummary.metadata ?? 0} 条
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-stone-300">
                  直接来自书目、作者、版本等权威数据源，是系统可靠度最高的关系层。
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-emerald-100">显式引用</span>
                  <span className="rounded-full bg-emerald-300/12 px-3 py-1 text-xs text-emerald-100">
                    {citationLayerSummary.explicit ?? 0} 条
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-stone-300">
                  通过明确引述痕迹建立高置信度文本关系，是“逐字探源”的核心抓手。
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-amber-100">语义关联</span>
                  <span className="rounded-full bg-amber-300/12 px-3 py-1 text-xs text-amber-100">
                    {citationLayerSummary.semantic ?? 0} 条
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-stone-300">
                  用于提示化用和义理继承，但不会在界面中冒充直接引用。
                </p>
              </div>
              <div className="rounded-2xl border border-slate-300/15 bg-slate-300/5 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">间接影响</span>
                  <span className="rounded-full bg-slate-300/12 px-3 py-1 text-xs text-slate-100">
                    {citationLayerSummary.influence ?? 0} 条
                  </span>
                </div>
                <p className="mt-2 text-sm leading-7 text-stone-300">
                  作为研究线索保留给评审和研究者，体现系统对学术边界的尊重。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-fuchsia-300/10 bg-[linear-gradient(135deg,rgba(18,22,30,0.96),rgba(20,34,36,0.98),rgba(46,20,32,0.8))] px-6 py-6">
            <div className="text-xs uppercase tracking-[0.24em] text-fuchsia-100/75">
              Data & Future
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-stone-50">
              数据版图与落地空间
            </h2>
            <div className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-sm font-medium text-stone-50">目标数据版图</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {targetDatasets.map((dataset) => (
                    <span
                      key={dataset}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-stone-200"
                    >
                      {dataset}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-sm font-medium text-stone-50">三类落地场景</div>
                <div className="mt-3 grid gap-3">
                  {scenarioCards.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <div className="font-medium text-stone-50">{item.title}</div>
                      <p className="mt-2 text-sm leading-7 text-stone-300">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-6 py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
                Next Action
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-stone-50">
                现场演示建议
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                如果需要完整交互，就从这里跳回综合工作台；如果只做答辩说明，这一页已经覆盖了创新性、数据利用、学术严谨和可扩展性四大核心评审维度。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full bg-amber-300 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-200"
              >
                进入综合工作台
              </Link>
              <a
                href="#narrative"
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-stone-200 transition hover:bg-white/10"
              >
                回到讲述起点
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
