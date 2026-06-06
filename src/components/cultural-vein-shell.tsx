"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { BookExplorer } from "@/components/book-explorer";
import { RiverScene, type RiverBranchAnnotation } from "@/components/river-scene";
import { riverDataset } from "@/data/demo-graph";
import { useCulturalVeinStore } from "@/store/app-store";
import type { CitationEdge, DatasetInsight } from "@/types/domain";
import type { ExplorerTab } from "@/components/book-explorer";

const eras = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"] as const;
const categories = ["全部", "经", "史", "子", "集"] as const;
const relationLayerMeta: Record<
  CitationEdge["layer"],
  {
    label: string;
    lineLabel: string;
    colorClass: string;
    badgeClass: string;
    description: string;
  }
> = {
  metadata: {
    label: "元数据关系",
    lineLabel: "白色实线",
    colorClass: "bg-stone-100",
    badgeClass: "border-white/15 bg-white/10 text-stone-100",
    description: "直接来自书目、作者、版本等权威元数据，可靠度最高。",
  },
  explicit: {
    label: "显式引用",
    lineLabel: "绿色实线",
    colorClass: "bg-emerald-300",
    badgeClass: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    description: "文本中存在明确引述痕迹，可解释为高置信度引用证据。",
  },
  semantic: {
    label: "语义关联",
    lineLabel: "黄色虚线",
    colorClass: "bg-amber-300",
    badgeClass: "border-amber-300/25 bg-amber-300/10 text-amber-100",
    description: "段落义理或表达高度相似，但缺少直接引文标记。",
  },
  influence: {
    label: "间接影响",
    lineLabel: "灰色点线",
    colorClass: "bg-slate-300",
    badgeClass: "border-slate-300/20 bg-slate-300/10 text-slate-100",
    description: "更适合视作研究线索，不在界面中伪装成确定事实。",
  },
};
const targetDatasetPlan = [
  { name: "古籍循证数据", scale: "130 万余种", role: "典籍元数据、版本关系、河流节点基础" },
  { name: "人名规范库", scale: "135 万余人", role: "人物关系网、注家与引者识别" },
  { name: "书目数据", scale: "354 万余条", role: "版本流变树、出版与藏馆信息" },
  { name: "CBDB", scale: "64 万余人", role: "人物传记、活动地点、活动时间线补充" },
  { name: "地名志 / 历史地点", scale: "10000+ 地点", role: "传播路径与历史地点定位" },
  { name: "历史文化事件", scale: "1.5 万余条", role: "典籍相关时间线事件补强" },
  { name: "家谱 / 红色文献 / 诗词", scale: "10+ 万到百万级", role: "专题分支、跨域传播与衍生脉络" },
] as const;
const pipelineSteps = [
  {
    title: "离线抽取",
    detail: "Python 脚本从 /data 中筛出当前可稳定利用的馆藏、人物与活动样本。",
  },
  {
    title: "关系建模",
    detail: "按元数据、显式引用、语义关联、影响链四类边组织成可展示的知识关系。",
  },
  {
    title: "前端消费",
    detail: "生成数据进入统一图谱对象，供河流总览、典籍钻入和文本溯源复用。",
  },
  {
    title: "增量扩展",
    detail: "后续只要继续导入新数据，河流、时间线、人物与机构面板都会自然长出新支流。",
  },
] as const;
const applicationScenarios = [
  {
    title: "学术研究",
    detail: "帮助研究者快速发现典籍间的引用、注疏与批评性继承关系，减少手工比勘成本。",
  },
  {
    title: "公共传播",
    detail: "适合图书馆、博物馆或展陈空间做“文脉飞越”式公共展示，让普通观众快速理解谱系。",
  },
  {
    title: "知识服务",
    detail: "可作为图书馆数字人文基础设施的前端入口，后续接入更完整图数据库和搜索服务。",
  },
] as const;
const branchAnnotations: RiverBranchAnnotation[] = [
  {
    id: "branch-li-xue",
    label: "朱熹集注 -> 理学分流",
    description: "以《论语集注》《四书章句集注》为中心，把经学重新组织成理学化、教材化的主河段。",
    targetSlug: "sishu-zhangju",
    accentColor: "#f59e0b",
    position: [3.1, 1.05, 0.58],
  },
  {
    id: "branch-shi-fa",
    label: "左传史法 -> 通鉴支流",
    description: "从《春秋左传》到《史记》《资治通鉴》，展示经史互证如何沉淀为后世史学叙事方法。",
    targetSlug: "zi-zhi-tong-jian",
    accentColor: "#38bdf8",
    position: [-1.1, 0.58, -0.96],
  },
  {
    id: "branch-jing-shi",
    label: "孟子义理 -> 经世反思",
    description: "从《孟子》到《日知录》，强调王道、民本与现实制度讨论之间的批评性承继。",
    targetSlug: "ri-zhi-lu",
    accentColor: "#34d399",
    position: [5.95, 0.52, 0.8],
  },
  {
    id: "branch-poetics",
    label: "诗教传统 -> 近代诗学",
    description: "从《诗经》一路回流到《人间词话》，把古典诗教转译为近代审美与境界论。",
    targetSlug: "ren-jian-ci-hua",
    accentColor: "#c084fc",
    position: [9.2, 0.72, -0.18],
  },
] as const;

const demoSteps: Array<{
  id: string;
  title: string;
  headline: string;
  summary: string;
  talkingPoint: string;
  era: (typeof eras)[number];
  category: (typeof categories)[number];
  searchTerm: string;
  bookSlug: string;
  tab: ExplorerTab | null;
}> = [
  {
    id: "macro-river",
    title: "步骤 1",
    headline: "宏观河流总览",
    summary: "先用河流隐喻讲清文脉主干、支流和时代推进，回答“这个项目为什么不是普通图谱”。",
    talkingPoint: "评审先看到的是整体谱系，而不是一团关系线。",
    era: "近现代",
    category: "全部",
    searchTerm: "",
    bookSlug: "sishu-zhangju",
    tab: null,
  },
  {
    id: "core-book",
    title: "步骤 2",
    headline: "典籍钻入示范",
    summary: "从《四书章句集注》切入，展示从总览到单书剖面的钻取路径。",
    talkingPoint: "这一跳说明平台既能总览，也能落到单个知识对象。",
    era: "宋元",
    category: "经",
    searchTerm: "朱熹",
    bookSlug: "sishu-zhangju",
    tab: "spread",
  },
  {
    id: "people-network",
    title: "步骤 3",
    headline: "人物与传播网络",
    summary: "切到人物与传播关系，讲清著者、注者、后继者和传播路径如何交织。",
    talkingPoint: "这里是中观层，最适合回答“研究价值和扩展空间”。",
    era: "明清",
    category: "经",
    searchTerm: "",
    bookSlug: "sishu-zhangju",
    tab: "people",
  },
  {
    id: "text-trace",
    title: "步骤 4",
    headline: "文本溯源与置信度",
    summary: "进入微观层，展示证据卡、置信度分层和逆流而上的溯源链路。",
    talkingPoint: "这一步用来回答“你们怎么保证严谨，不把推测当事实”。",
    era: "明清",
    category: "经",
    searchTerm: "礼",
    bookSlug: "sishu-zhangju",
    tab: "passages",
  },
  {
    id: "real-data",
    title: "步骤 5",
    headline: "真实数据来源与扩展性",
    summary: "回到真实样本覆盖，强调 CBDB、上图、南图、复旦馆藏已经接入到人物、时间线和机构来源。",
    talkingPoint: "最后把作品从“好看”拉回到“可验证、可持续扩展”。",
    era: "近现代",
    category: "全部",
    searchTerm: "",
    bookSlug: "shijing",
    tab: "timeline",
  },
];

export function CulturalVeinShell() {
  const {
    activeEra,
    searchTerm,
    selectedBookSlug,
    categoryFilter,
    viewMode,
    setActiveEra,
    setCategoryFilter,
    setSearchTerm,
    setSelectedBookSlug,
    resetSelection,
  } = useCulturalVeinStore();
  const [insights, setInsights] = useState<DatasetInsight | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStepId, setDemoStepId] = useState(demoSteps[0].id);
  const [hoveredBranchId, setHoveredBranchId] = useState<string | null>(null);
  const [transitionState, setTransitionState] = useState<
    "idle" | "diving" | "settling" | "returning"
  >("idle");

  const filteredBooks = useMemo(() => {
    return riverDataset.books.filter((book) => {
      const matchesEra = eras.indexOf(book.dynasty) <= eras.indexOf(activeEra);
      const matchesCategory =
        categoryFilter === "全部" || book.category === categoryFilter;
      const normalized = `${book.title}${book.summary}${book.concepts.join("")}${book.school}`;
      const matchesSearch =
        searchTerm.trim().length === 0 || normalized.includes(searchTerm.trim());

      return matchesEra && matchesCategory && matchesSearch;
    });
  }, [activeEra, categoryFilter, searchTerm]);

  const activeEraIndex = eras.indexOf(activeEra);
  const visibleCitations = riverDataset.citations.filter((citation) => {
    return filteredBooks.some((book) => book.id === citation.source) &&
      filteredBooks.some((book) => book.id === citation.target);
  });
  const layerSummary = (Object.keys(relationLayerMeta) as CitationEdge["layer"][]).map(
    (layer) => {
      const items = visibleCitations.filter((citation) => citation.layer === layer);

      return {
        layer,
        count: items.length,
        averageConfidence:
          items.length > 0
            ? Math.round(
                (items.reduce((total, citation) => total + citation.confidence, 0) /
                  items.length) *
                  100,
              )
            : 0,
      };
    },
  );
  const matchedBooks = filteredBooks.filter((book) =>
    searchTerm.trim().length > 0
      ? `${book.title}${book.summary}${book.concepts.join("")}${book.school}`.includes(
          searchTerm.trim(),
        )
      : true,
  );

  const selectedBook = riverDataset.books.find((book) => book.slug === selectedBookSlug);
  const selectedDetail = riverDataset.booksBySlug[selectedBookSlug];
  const cbdbSummary = insights?.cbdbSummary;
  const currentDemoStep =
    demoSteps.find((step) => step.id === demoStepId) ?? demoSteps[0];
  const selectedBookCitations = selectedBook
    ? visibleCitations.filter((citation) =>
        citation.source === selectedBook.id || citation.target === selectedBook.id
      )
    : [];
  const selectedEvidenceCards = selectedBookCitations
    .map((citation) => {
      const sourceBook = riverDataset.books.find((book) => book.id === citation.source);
      const targetBook = riverDataset.books.find((book) => book.id === citation.target);

      if (!sourceBook || !targetBook) {
        return null;
      }

      return {
        ...citation,
        sourceTitle: sourceBook.title,
        targetTitle: targetBook.title,
      };
    })
    .filter((citation): citation is NonNullable<typeof citation> => Boolean(citation))
    .sort((left, right) => right.confidence - left.confidence);
  const bookSourceBadges = Object.fromEntries(
    Object.entries(riverDataset.booksBySlug).map(([slug, detail]) => [
      slug,
      detail.realWorldSignals?.sourceLabel
        ?.split("+")
        .map((item) => item.trim())
        .filter(Boolean) ?? [],
    ]),
  ) as Record<string, string[]>;
  const connectedDatasetCards = [
    {
      name: "CBDB",
      status: cbdbSummary?.available ? "已接入" : "待补充",
      scale: cbdbSummary?.personCount
        ? `${cbdbSummary.personCount.toLocaleString()} 条人物记录`
        : "人物传记样本",
      detail: "人物基础传记、别名匹配、活动地点与时间线线索。",
    },
    {
      name: "上海图书馆开放数据 2026",
      status: insights?.shanghaiLibraryActivity?.available ? "已接入" : "待补充",
      scale: insights?.shanghaiLibraryActivity?.topVenues?.length
        ? `${insights.shanghaiLibraryActivity.topVenues.length} 组场馆样本`
        : "活动样本",
      detail: "传播现场、活动场馆与在地文化事件信号。",
    },
    {
      name: "南京图书馆",
      status: insights?.nanjingLibrarySample?.available ? "已接入" : "待补充",
      scale: insights?.nanjingLibrarySample?.recordCount
        ? `${insights.nanjingLibrarySample.recordCount} 条资源记录`
        : "图像资源样本",
      detail: "图像资源出处、年代、分类与机构来源。",
    },
    {
      name: "复旦大学图书馆",
      status: insights?.fudanArchiveSample?.available ? "已接入" : "待补充",
      scale: insights?.fudanArchiveSample?.collectionTitle ?? "馆藏样例",
      detail: "馆藏介绍摘要、手稿诗笺与机构馆藏说明。",
    },
    {
      name: "南湖文献数据库",
      status: insights?.nanhuArchiveSample?.available ? "已接入" : "待补充",
      scale: insights?.nanhuArchiveSample?.documentCount
        ? `${insights.nanhuArchiveSample.documentCount} 篇文献 / ${insights.nanhuArchiveSample.imageCount ?? 0} 张图像`
        : insights?.nanhuArchiveSample?.collectionTitle ?? "专题资源样本",
      detail: "专题文献、图像资源与专题型历史知识分支样本。",
    },
    {
      name: "近代上海城市文化专题片",
      status: insights?.videoTopicSample?.available ? "已接入" : "待补充",
      scale: insights?.videoTopicSample?.sampleTitles?.length
        ? `${insights.videoTopicSample.sampleTitles.length} 条影像片目样本`
        : insights?.videoTopicSample?.collectionTitle ?? "影像专题样本",
      detail: "城市文化专题片、非遗与民俗影像资源样本，强化公共传播叙事。",
    },
  ];
  const visibleBranchAnnotations = branchAnnotations.filter((annotation) => {
    const targetBook = riverDataset.books.find((book) => book.slug === annotation.targetSlug);
    if (!targetBook) {
      return false;
    }

    const targetVisible = filteredBooks.some((book) => book.slug === annotation.targetSlug);
    return targetVisible && eras.indexOf(targetBook.dynasty) <= activeEraIndex;
  });
  const activeBranchAnnotation =
    visibleBranchAnnotations.find((annotation) => annotation.id === hoveredBranchId) ??
    visibleBranchAnnotations[0] ??
    null;

  useEffect(() => {
    let cancelled = false;

    const loadInsights = async () => {
      try {
        const response = await fetch("/api/insights");
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as DatasetInsight;
        if (!cancelled) {
          setInsights(payload);
        }
      } catch {
        // Keep the static shell usable even if the request fails.
      }
    };

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!demoMode) {
      return;
    }

    setActiveEra(currentDemoStep.era);
    setCategoryFilter(currentDemoStep.category);
    setSearchTerm(currentDemoStep.searchTerm);
    setSelectedBookSlug(currentDemoStep.bookSlug);
  }, [
    currentDemoStep.bookSlug,
    currentDemoStep.category,
    currentDemoStep.era,
    currentDemoStep.searchTerm,
    demoMode,
    setActiveEra,
    setCategoryFilter,
    setSearchTerm,
    setSelectedBookSlug,
  ]);

  useEffect(() => {
    if (transitionState !== "settling" && transitionState !== "returning") {
      return;
    }

    const timer = window.setTimeout(() => {
      setTransitionState("idle");
    }, transitionState === "settling" ? 650 : 420);

    return () => window.clearTimeout(timer);
  }, [transitionState]);

  const handleDiveToBook = (slug: string) => {
    if (selectedBookSlug === slug && viewMode === "book") {
      setSelectedBookSlug(slug);
      return;
    }

    setTransitionState("diving");
    window.setTimeout(() => {
      setSelectedBookSlug(slug);
      setTransitionState("settling");
    }, 180);
  };

  const handleReturnToRiver = () => {
    setTransitionState("returning");
    window.setTimeout(() => {
      resetSelection();
    }, 120);
  };

  const isTransitionActive = transitionState !== "idle";
  const showDiveOverlay =
    transitionState === "diving" || transitionState === "settling" || transitionState === "returning";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#214d46_0%,#102622_35%,#081512_65%,#050a09_100%)] text-stone-100">
      {showDiveOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              transitionState === "diving"
                ? "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(4,8,7,0.92)_68%)] backdrop-blur-[2px]"
                : transitionState === "settling"
                  ? "bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.12),rgba(4,8,7,0.82)_75%)] opacity-100"
                  : "bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.08),rgba(4,8,7,0.72)_78%)] opacity-100"
            }`}
          />
          <div
            className={`absolute left-1/2 top-1/2 h-[58vmax] w-[58vmax] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15 transition-all ${
              transitionState === "diving"
                ? "scale-[0.62] opacity-90"
                : transitionState === "settling"
                  ? "scale-[1.18] opacity-0 duration-700"
                  : "scale-[0.88] opacity-0 duration-500"
            }`}
          />
          <div
            className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition-all ${
              transitionState === "diving"
                ? "opacity-100"
                : "translate-y-3 opacity-0 duration-300"
            }`}
          >
            <div className="text-xs uppercase tracking-[0.38em] text-amber-100/75">
              Camera Dive
            </div>
            <div className="mt-3 text-2xl font-semibold text-stone-50">
              正在钻入典籍脉络
            </div>
          </div>
        </div>
      ) : null}

      <header className="border-b border-white/10 bg-black/15 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">
              Cultural Vein
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-50">
              文脉溯源
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-300">
              以三维河流隐喻重构典籍传承网络，先完成可演示的 MVP：宏观文脉总览、典籍钻入与文本溯源的统一框架。
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/demo"
                className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/18"
              >
                打开答辩页
              </Link>
              <button
                type="button"
                onClick={() => setDemoMode((value) => !value)}
                className={`rounded-full px-4 py-2 text-xs transition ${
                  demoMode
                    ? "bg-amber-300 text-stone-950"
                    : "border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
                }`}
              >
                {demoMode ? "退出答辩模式" : "进入答辩模式"}
              </button>
              {demoMode ? (
                <div className="rounded-full border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs text-amber-100">
                  当前演示：{currentDemoStep.headline}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 text-sm text-stone-200 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">典籍节点</div>
              <div className="mt-2 text-2xl font-semibold">{riverDataset.books.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">关系边</div>
              <div className="mt-2 text-2xl font-semibold">{riverDataset.citations.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">示范域</div>
              <div className="mt-2 text-2xl font-semibold">四书五经 + 诗史支流</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">状态</div>
              <div className="mt-2 text-2xl font-semibold">骨架已上线</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)_380px]">
        <aside className="space-y-4 rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          <section className="rounded-[26px] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(12,17,16,0.72))] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-amber-100/75">
                  Guided Demo
                </div>
                <h2 className="mt-2 text-lg font-semibold text-stone-50">
                  答辩演示路径
                </h2>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs ${
                  demoMode
                    ? "bg-amber-300 text-stone-950"
                    : "border border-white/10 bg-white/5 text-stone-300"
                }`}
              >
                {demoMode ? "进行中" : "待开启"}
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              把当前系统压缩成固定五步讲述顺序，方便现场答辩时稳定输出“创新性、严谨性、数据性、扩展性”。
            </p>
            <div className="mt-4 space-y-3">
              {demoSteps.map((step, index) => {
                const isActive = step.id === currentDemoStep.id;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setDemoMode(true);
                      setDemoStepId(step.id);
                    }}
                    className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-amber-300/45 bg-amber-300/10 shadow-lg shadow-amber-500/10"
                        : "border-white/10 bg-black/15 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
                          {step.title}
                        </div>
                        <div className="mt-2 text-base font-semibold text-stone-50">
                          {step.headline}
                        </div>
                      </div>
                      <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-stone-200">
                        {index + 1}/5
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-300">
                      {step.summary}
                    </p>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs leading-6 text-amber-50/90">
                      讲解重点：{step.talkingPoint}
                    </div>
                  </button>
                );
              })}
            </div>
            {demoMode ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = demoSteps.findIndex((step) => step.id === currentDemoStep.id);
                    setDemoStepId(demoSteps[Math.max(currentIndex - 1, 0)].id);
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-stone-200 transition hover:bg-white/10"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const currentIndex = demoSteps.findIndex((step) => step.id === currentDemoStep.id);
                    setDemoStepId(
                      demoSteps[Math.min(currentIndex + 1, demoSteps.length - 1)].id,
                    );
                  }}
                  className="rounded-full bg-amber-300 px-3 py-2 text-xs text-stone-950 transition hover:bg-amber-200"
                >
                  下一步
                </button>
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">宏观控制台</h2>
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300 transition hover:bg-white/10"
                onClick={handleReturnToRiver}
                type="button"
              >
                回到河流
              </button>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">
                概念搜索
              </span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索 仁 / 礼 / 诗 / 教化"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-50 outline-none placeholder:text-stone-500 focus:border-amber-300/50"
              />
            </label>

            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-400">
                类别筛选
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCategoryFilter(category)}
                    className={`rounded-full px-3 py-2 text-xs transition ${
                      categoryFilter === category
                        ? "bg-amber-300 text-stone-950"
                        : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-400">
              时间轴
            </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-3">
                <input
                  type="range"
                  min={0}
                  max={eras.length - 1}
                  step={1}
                  value={activeEraIndex}
                  onChange={(event) => setActiveEra(eras[Number(event.target.value)])}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
                />
                <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
                  <span>{eras[0]}</span>
                  <span>{eras[eras.length - 1]}</span>
                </div>
                <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                    当前断代
                  </div>
                  <div className="mt-1 text-lg font-semibold text-amber-50">{activeEra}</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    当前已显现 {filteredBooks.length} 条典籍河段与 {visibleCitations.length} 条关系边，
                    模拟文脉随时代逐步生长。
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {eras.map((era, index) => (
                  <button
                    key={era}
                    type="button"
                    onClick={() => setActiveEra(era)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      activeEra === era
                        ? "border-amber-300/60 bg-amber-200/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{era}</span>
                      <span className="text-xs text-stone-400">
                        {riverDataset.books.filter((book) => eras.indexOf(book.dynasty) <= index).length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <main
          className={`rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur transition-all duration-500 ${
            transitionState === "diving"
              ? "scale-[1.02] opacity-35 blur-[1px]"
              : transitionState === "settling"
                ? "translate-y-1 scale-[0.985]"
                : transitionState === "returning"
                  ? "scale-[0.992] opacity-70"
                  : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                第一阶段
              </p>
              <h2 className="text-2xl font-semibold">文脉河流数据骨架</h2>
            </div>
            <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
              {viewMode === "river" ? "河流总览" : "典籍钻入"}
            </div>
          </div>

          <RiverScene
            books={filteredBooks}
            citations={visibleCitations}
            selectedBookSlug={selectedBookSlug}
            onSelectBook={handleDiveToBook}
            activeEra={activeEra}
            branchAnnotations={visibleBranchAnnotations}
            hoveredBranchId={hoveredBranchId}
            onHoverBranch={setHoveredBranchId}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                主河段
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {eras[0]}至{activeEra}
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                以《诗经》《礼记》与《四书章句集注》构成知识主河道。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                支流
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {Array.from(new Set(filteredBooks.map((book) => book.school))).slice(0, 3).join(" / ") || "待显现"}
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                支流通过关系弧线与主河汇接，表达注疏、史法和影响扩散。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                关系编码
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {new Set(visibleCitations.map((citation) => citation.layer)).size} 层已显现
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                白色元数据、绿色显式引用、黄色语义关联、灰色影响链。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                当前时间轴
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">{activeEra}</div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                仅显示不晚于当前时代的河段与分支，模拟文脉逐步生长。
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(255,255,255,0.03))] px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">
                    Branch Annotations
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-stone-50">
                    河流分叉标注层
                  </h3>
                </div>
                <div className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  {visibleBranchAnnotations.length} 处分流
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                方案里提到的“悬停分叉点显式标注”现在直接落在主场景里了。悬停 3D 标注点可以查看说明，点击后会直接钻入对应典籍支流。
              </p>
              {activeBranchAnnotation ? (
                <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: activeBranchAnnotation.accentColor }}
                      />
                      <div className="text-sm font-medium text-stone-50">
                        {activeBranchAnnotation.label}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDiveToBook(activeBranchAnnotation.targetSlug)}
                      className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      直达分支
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-stone-300">
                    {activeBranchAnnotation.description}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-stone-400">
                  当前时代层尚未显现可标注的分流节点。
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
                    当前可见分流
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-stone-50">
                    从主河到专题支流
                  </h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                  Hover to focus
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {visibleBranchAnnotations.map((annotation) => (
                  <button
                    key={annotation.id}
                    type="button"
                    onMouseEnter={() => setHoveredBranchId(annotation.id)}
                    onMouseLeave={() => setHoveredBranchId((current) => (current === annotation.id ? null : current))}
                    onFocus={() => setHoveredBranchId(annotation.id)}
                    onBlur={() => setHoveredBranchId((current) => (current === annotation.id ? null : current))}
                    onClick={() => handleDiveToBook(annotation.targetSlug)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      activeBranchAnnotation?.id === annotation.id
                        ? "border-cyan-300/30 bg-cyan-300/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: annotation.accentColor }}
                        />
                        <div className="text-sm font-medium text-stone-50">
                          {annotation.label}
                        </div>
                      </div>
                      <div className="text-xs text-stone-400">
                        {riverDataset.books.find((book) => book.slug === annotation.targetSlug)?.title ?? "未命名典籍"}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-300">
                      {annotation.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
                    Confidence Layers
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-stone-50">
                    三层置信度 + 影响线索
                  </h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                  当前可见 {visibleCitations.length} 条
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                方案里的学术严谨性在这里直接展开：不同关系层级用不同线型、颜色和解释方式呈现，避免把研究线索包装成确定事实。
              </p>
              <div className="mt-4 grid gap-3">
                {layerSummary.map((item) => {
                  const meta = relationLayerMeta[item.layer];

                  return (
                    <div
                      key={item.layer}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-8 rounded-full ${meta.colorClass}`} />
                          <div>
                            <div className="text-sm font-medium text-stone-50">
                              {meta.label}
                            </div>
                            <div className="mt-1 text-xs text-stone-400">
                              {meta.lineLabel}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-stone-50">
                            {item.count}
                          </div>
                          <div className="text-xs text-stone-400">
                            平均可信度 {item.averageConfidence}%
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-stone-300">
                        {meta.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(24,35,35,0.96),rgba(6,12,12,0.98))] px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-cyan-100/75">
                    Evidence Board
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-stone-50">
                    {selectedBook ? `${selectedBook.title} 的关系证据` : "关系证据面板"}
                  </h3>
                </div>
                <div className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  {selectedEvidenceCards.length} 条直接关系
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                这里把当前选中典籍的直接关系逐条拆开，评审可以直接看到“关系是什么、证据来自哪里、我们把它判在哪个层级”。
              </p>
              <div className="mt-4 grid gap-3">
                {selectedEvidenceCards.length > 0 ? (
                  selectedEvidenceCards.slice(0, 6).map((citation) => {
                    const meta = relationLayerMeta[citation.layer];

                    return (
                      <div
                        key={citation.id}
                        className="rounded-[24px] border border-white/10 bg-black/15 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs ${meta.badgeClass}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-xs text-stone-400">
                              可信度 {Math.round(citation.confidence * 100)}%
                            </span>
                          </div>
                          <div className="text-xs uppercase tracking-[0.18em] text-stone-500">
                            {citation.label}
                          </div>
                        </div>
                        <div className="mt-3 text-base font-semibold text-stone-50">
                          {citation.sourceTitle} → {citation.targetTitle}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-stone-300">
                          {citation.evidence}
                        </p>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs leading-6 text-stone-300">
                          说明：{meta.description}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-8 text-sm text-stone-400">
                    当前没有与所选典籍直接相连的证据卡。可以切换时间轴、类别或重新选择节点后继续查看。
                  </div>
                )}
              </div>
            </div>
          </div>

          {cbdbSummary?.available ? (
            <div className="mt-4 rounded-[28px] border border-cyan-300/15 bg-cyan-300/5 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">
                    Real Dataset Coverage
                  </div>
                  <div className="mt-1 text-lg font-semibold text-cyan-50">
                    CBDB 已接入 {cbdbSummary.personCount?.toLocaleString() ?? "未知"} 条人物记录
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(cbdbSummary.topDynasties ?? []).slice(0, 4).map((item) => (
                    <span
                      key={item.name}
                      className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-xs text-cyan-100"
                    >
                      {item.name} {item.count.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
              {insights?.shanghaiLibraryActivity?.available ? (
                <div className="mt-3 text-xs text-cyan-100/75">
                  活动样本源：{insights.shanghaiLibraryActivity.sourceWorkbook} · 表：
                  {insights.shanghaiLibraryActivity.sheetName}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
                方法说明
              </div>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                三层关系 + 三层交互
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-sm font-medium text-stone-50">宏观层</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    用河流总览表达典籍主干、支流与时代推进。
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-sm font-medium text-stone-50">中观层</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    用传播、人物、版本、时间线展开关联叙事。
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-sm font-medium text-stone-50">微观层</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    用文本对读、证据切换和溯源链路解释引文关系。
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm leading-7 text-stone-300">
                当前界面把元数据关系、显式引用、语义关联与影响链统一组织到同一交互框架中，优先保证可演示性，再逐步扩大真实数据覆盖面。
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
                数据来源
              </div>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                当前已接入的真实样本
              </h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                  <div className="text-sm font-medium text-cyan-50">CBDB</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    人物传记、活动地点、活动时间线线索。
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                  <div className="text-sm font-medium text-cyan-50">上海图书馆开放数据 2026</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    活动场馆样本与文化传播现场事件。
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                  <div className="text-sm font-medium text-cyan-50">南京图书馆 / 复旦大学图书馆</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    图像资源样本、馆藏来源与手稿诗笺说明。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[30px] border border-fuchsia-300/10 bg-[linear-gradient(135deg,rgba(16,24,24,0.98),rgba(11,35,34,0.98),rgba(58,29,17,0.78))] px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs uppercase tracking-[0.24em] text-fuchsia-100/70">
                  Scale & Extensibility
                </div>
                <h3 className="mt-2 text-2xl font-semibold text-stone-50">
                  数据规模、工程路径与可扩展性
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  这一块专门回答方案里最容易被追问的三个问题：我们到底用了哪些数据、现在接到了什么程度、后续为什么能继续长成真正的数字人文基础设施。
                </p>
              </div>
              <div className="grid gap-2 text-xs text-stone-200 sm:grid-cols-3 xl:w-[420px]">
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">当前接入</div>
                  <div className="mt-2 font-medium text-stone-50">
                    {connectedDatasetCards.filter((item) => item.status === "已接入").length} 类真实来源
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">目标覆盖</div>
                  <div className="mt-2 font-medium text-stone-50">10+ 数据类型</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">工程模式</div>
                  <div className="mt-2 font-medium text-stone-50">离线抽取 → 统一图谱</div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[26px] border border-white/10 bg-black/15 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-lg font-medium text-stone-50">已接入真实来源</h4>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                    当前演示可见
                  </span>
                </div>
                <div className="mt-4 grid gap-3">
                  {connectedDatasetCards.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-stone-50">{item.name}</div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            item.status === "已接入"
                              ? "bg-emerald-300/12 text-emerald-100"
                              : "border border-white/10 bg-white/10 text-stone-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-amber-100">{item.scale}</div>
                      <p className="mt-2 text-sm leading-6 text-stone-300">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[26px] border border-white/10 bg-black/15 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-medium text-stone-50">方案目标数据版图</h4>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                      面向正式参赛版
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {targetDatasetPlan.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-medium text-stone-50">{item.name}</div>
                          <span className="rounded-full bg-fuchsia-300/10 px-3 py-1 text-xs text-fuchsia-100">
                            {item.scale}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-stone-300">{item.role}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[26px] border border-white/10 bg-black/15 px-4 py-4">
                    <h4 className="text-lg font-medium text-stone-50">工程扩展路径</h4>
                    <div className="mt-4 space-y-3">
                      {pipelineSteps.map((step, index) => (
                        <div key={step.title} className="flex gap-3">
                          <div className="flex w-8 flex-col items-center pt-1">
                            <div className="h-6 w-6 rounded-full bg-amber-300/15 text-center text-xs leading-6 text-amber-100">
                              {index + 1}
                            </div>
                            {index < pipelineSteps.length - 1 ? (
                              <div className="mt-2 h-full w-px bg-white/10" />
                            ) : null}
                          </div>
                          <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                            <div className="font-medium text-stone-50">{step.title}</div>
                            <p className="mt-2 text-sm leading-6 text-stone-300">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-white/10 bg-black/15 px-4 py-4">
                    <h4 className="text-lg font-medium text-stone-50">落地应用场景</h4>
                    <div className="mt-4 grid gap-3">
                      {applicationScenarios.map((scenario) => (
                        <div
                          key={scenario.title}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                        >
                          <div className="text-sm font-medium text-stone-50">{scenario.title}</div>
                          <p className="mt-2 text-sm leading-6 text-stone-300">
                            {scenario.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(8,17,16,0.92))] px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs uppercase tracking-[0.24em] text-amber-100/75">
                  Review Mode
                </div>
                <h3 className="mt-2 text-2xl font-semibold text-stone-50">
                  评审视角下的作品亮点
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  当前版本已经把“河流隐喻 + 典籍多维钻入 + 真实数据样本接入”组织成一套完整演示路径，适合用来回答创新性、数据利用深度、学术严谨性和交互体验这四类核心评审问题。
                </p>
              </div>
              <div className="grid gap-2 text-xs text-stone-200 sm:grid-cols-2 xl:w-[360px]">
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">创新隐喻</div>
                  <div className="mt-2 font-medium text-stone-50">文脉 = 水脉</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">真实来源</div>
                  <div className="mt-2 font-medium text-stone-50">CBDB + 上图 + 馆藏样例</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">关系分层</div>
                  <div className="mt-2 font-medium text-stone-50">元数据 / 引用 / 语义 / 影响</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">演示路径</div>
                  <div className="mt-2 font-medium text-stone-50">总览 → 钻入 → 溯源</div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  1. 创新性
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  用三维河流替代传统知识图谱 hairball，把时间演化、主干支流与影响强弱压进同一视觉语言。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  2. 数据利用
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  不只展示示范域，还把 CBDB、上海图书馆、南京图书馆、复旦大学图书馆的样本信号接入到人物、时间线和机构来源里。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  3. 学术严谨性
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  关系按置信层级区分，不把推测包装成事实；真实样本统一带来源说明，方便答辩时解释“哪些是权威数据、哪些是示范补全”。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  4. 交互深度
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  宏观层负责看谱系，中观层负责找关系，微观层负责看证据，能支撑展览传播和学术研究两类场景。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBooks.length === 0 ? (
              <div className="xl:col-span-3 rounded-[26px] border border-dashed border-white/10 bg-black/10 px-5 py-8 text-sm text-stone-400">
                当前筛选下没有匹配典籍。可以放宽时间轴、清空概念词，或切换类别后继续探索。
              </div>
            ) : null}
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => handleDiveToBook(book.slug)}
                className={`group rounded-[26px] border p-4 text-left transition ${
                  selectedBookSlug === book.slug
                    ? "border-amber-300/50 bg-amber-200/10 shadow-lg shadow-amber-500/10"
                    : "border-white/10 bg-black/10 hover:-translate-y-0.5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                      {book.dynasty} · {book.category}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-stone-50">
                      {book.title}
                    </h3>
                  </div>
                  <div className="rounded-full bg-white/8 px-3 py-1 text-xs text-amber-100">
                    {book.school}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">{book.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {book.concepts.map((concept) => (
                    <span
                      key={concept}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
                {bookSourceBadges[book.slug]?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {bookSourceBadges[book.slug].slice(0, 3).map((source) => (
                      <span
                        key={`${book.slug}-${source}`}
                        className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-[11px] text-cyan-100"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-stone-400">
                  <div className="rounded-2xl bg-white/5 px-3 py-2">
                    影响力 <span className="ml-2 text-stone-100">{book.influence}</span>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-3 py-2">
                    传播速率 <span className="ml-2 text-stone-100">{book.velocity.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-stone-500">
                  {matchedBooks.some((item) => item.id === book.id)
                    ? "命中当前文脉筛选"
                    : "位于当前时间层但未命中搜索"}
                </div>
              </button>
            ))}
          </div>
        </main>

        <aside
          className={`space-y-4 rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/20 backdrop-blur transition-all duration-500 ${
            viewMode === "book" && !isTransitionActive
              ? "translate-x-0 opacity-100"
              : transitionState === "diving"
                ? "translate-x-6 opacity-0"
                : transitionState === "settling"
                  ? "translate-x-0 opacity-100"
                  : ""
          }`}
        >
          {selectedBook && selectedDetail ? (
            <BookExplorer
              book={selectedBook}
              detail={selectedDetail}
              forcedTab={demoMode ? currentDemoStep.tab : null}
              activeEra={activeEra}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
