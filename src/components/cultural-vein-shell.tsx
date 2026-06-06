"use client";

import { useEffect, useMemo, useState } from "react";

import { BookExplorer, type TraceFocusState } from "@/components/book-explorer";
import { RiverScene, type RiverBranchAnnotation } from "@/components/river-scene";
import { riverDataset } from "@/data/demo-graph";
import { useCulturalVeinStore } from "@/store/app-store";
import type { CitationEdge, DatasetInsight } from "@/types/domain";

const eras = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"] as const;
const categories = ["全部", "经", "史", "子", "集"] as const;
const hudPanelClass =
  "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,15,0.82),rgba(5,10,10,0.72))] shadow-2xl shadow-black/35 backdrop-blur-xl";

const relationLayerMeta: Record<
  CitationEdge["layer"],
  {
    label: string;
    badgeClass: string;
  }
> = {
  metadata: {
    label: "元数据",
    badgeClass: "border-white/15 bg-white/10 text-stone-100",
  },
  explicit: {
    label: "显式引用",
    badgeClass: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
  },
  semantic: {
    label: "语义关联",
    badgeClass: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  },
  influence: {
    label: "间接影响",
    badgeClass: "border-slate-300/20 bg-slate-300/10 text-slate-100",
  },
};

const branchAnnotations: RiverBranchAnnotation[] = [
  {
    id: "branch-li-xue",
    label: "朱熹集注 -> 理学分流",
    description:
      "以《论语集注》《四书章句集注》为中心，把经学重新组织成理学化、教材化的主河段。",
    targetSlug: "sishu-zhangju",
    accentColor: "#f59e0b",
    position: [3.1, 1.05, 0.58],
  },
  {
    id: "branch-shi-fa",
    label: "左传史法 -> 通鉴支流",
    description:
      "从《春秋左传》到《史记》《资治通鉴》，展示经史互证如何沉淀为后世史学叙事方法。",
    targetSlug: "zi-zhi-tong-jian",
    accentColor: "#38bdf8",
    position: [-1.1, 0.58, -0.96],
  },
  {
    id: "branch-jing-shi",
    label: "孟子义理 -> 经世反思",
    description:
      "从《孟子》到《日知录》，强调王道、民本与现实制度讨论之间的批评性承继。",
    targetSlug: "ri-zhi-lu",
    accentColor: "#34d399",
    position: [5.95, 0.52, 0.8],
  },
  {
    id: "branch-poetics",
    label: "诗教传统 -> 近代诗学",
    description:
      "从《诗经》一路回流到《人间词话》，把古典诗教转译为近代审美与境界论。",
    targetSlug: "ren-jian-ci-hua",
    accentColor: "#c084fc",
    position: [9.2, 0.72, -0.18],
  },
] as const;

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
  const [hoveredBranchId, setHoveredBranchId] = useState<string | null>(null);
  const [traceFocus, setTraceFocus] = useState<TraceFocusState | null>(null);
  const [transitionState, setTransitionState] = useState<
    "idle" | "diving" | "settling" | "returning"
  >("idle");

  const activeEraIndex = eras.indexOf(activeEra);

  const filteredBooks = useMemo(() => {
    return riverDataset.books.filter((book) => {
      const matchesEra = eras.indexOf(book.dynasty) <= activeEraIndex;
      const matchesCategory =
        categoryFilter === "全部" || book.category === categoryFilter;
      const normalized = `${book.title}${book.summary}${book.concepts.join("")}${book.school}`;
      const matchesSearch =
        searchTerm.trim().length === 0 || normalized.includes(searchTerm.trim());

      return matchesEra && matchesCategory && matchesSearch;
    });
  }, [activeEraIndex, categoryFilter, searchTerm]);

  const visibleCitations = useMemo(() => {
    return riverDataset.citations.filter((citation) => {
      return (
        filteredBooks.some((book) => book.id === citation.source) &&
        filteredBooks.some((book) => book.id === citation.target)
      );
    });
  }, [filteredBooks]);

  const layerSummary = useMemo(() => {
    return (Object.keys(relationLayerMeta) as CitationEdge["layer"][]).map((layer) => ({
      layer,
      count: visibleCitations.filter((citation) => citation.layer === layer).length,
    }));
  }, [visibleCitations]);

  const selectedBook = riverDataset.books.find((book) => book.slug === selectedBookSlug);
  const selectedDetail = riverDataset.booksBySlug[selectedBookSlug];
  const selectedBookCitations = selectedBook
    ? visibleCitations.filter(
        (citation) =>
          citation.source === selectedBook.id || citation.target === selectedBook.id,
      )
    : [];
  const selectedSources = selectedDetail?.realWorldSignals?.sourceLabel
    ?.split("+")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

  const visibleBranchAnnotations = branchAnnotations.filter((annotation) => {
    const targetBook = riverDataset.books.find((book) => book.slug === annotation.targetSlug);

    if (!targetBook) {
      return false;
    }

    return (
      filteredBooks.some((book) => book.slug === annotation.targetSlug) &&
      eras.indexOf(targetBook.dynasty) <= activeEraIndex
    );
  });

  const activeBranchAnnotation =
    visibleBranchAnnotations.find((annotation) => annotation.id === hoveredBranchId) ??
    visibleBranchAnnotations.find((annotation) => annotation.targetSlug === selectedBookSlug) ??
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
        // Keep the page available even when dataset insights are temporarily missing.
      }
    };

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, []);

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
      setTraceFocus(null);
      resetSelection();
    }, 120);
  };

  const showDiveOverlay =
    transitionState === "diving" ||
    transitionState === "settling" ||
    transitionState === "returning";
  const connectedSourceCount = [
    insights?.cbdbSummary?.available,
    insights?.shanghaiLibraryActivity?.available,
    insights?.nanjingLibrarySample?.available,
    insights?.fudanArchiveSample?.available,
    insights?.nanhuArchiveSample?.available,
    insights?.videoTopicSample?.available,
    insights?.shenzhenLibrarySample?.available,
    insights?.taofenMuseumSample?.available,
    insights?.soongLiteratureSample?.available,
    insights?.souyunKnowledgeGraphSample?.available,
    insights?.periodicalIndexSample?.available,
  ].filter(Boolean).length;
  const focusModeLabel = traceFocus?.active
    ? "逆流溯源"
    : viewMode === "book"
      ? "典籍钻入"
      : "河流巡航";
  const dossierToneClass = traceFocus?.active
    ? "border-cyan-300/18 bg-[linear-gradient(135deg,rgba(8,54,58,0.5),rgba(10,16,16,0.78))]"
    : transitionState === "diving" || transitionState === "settling"
      ? "border-amber-300/18 bg-[linear-gradient(135deg,rgba(62,42,12,0.46),rgba(10,16,16,0.78))]"
      : "border-amber-300/16 bg-[linear-gradient(135deg,rgba(54,34,12,0.38),rgba(10,16,16,0.78))]";
  const visibleNodePreview = filteredBooks.slice(0, 5);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050a09] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(45,212,191,0.18),transparent_28%),radial-gradient(circle_at_78%_24%,rgba(251,191,36,0.16),transparent_26%),radial-gradient(circle_at_50%_100%,rgba(34,197,94,0.12),transparent_38%),linear-gradient(180deg,#0a1614_0%,#07100f_42%,#030606_100%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:72px_72px]" />

      {showDiveOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              transitionState === "diving"
                ? "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(4,8,7,0.92)_68%)] backdrop-blur-[2px]"
                : transitionState === "settling"
                  ? "bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.12),rgba(4,8,7,0.78)_72%)]"
                  : "bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),rgba(4,8,7,0.88)_70%)]"
            }`}
          />
        </div>
      ) : null}

      <div className="relative z-10 min-h-screen">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className={`pointer-events-auto max-w-[320px] px-5 py-4 ${hudPanelClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-100/75">
                  Cultural Vein
                </div>
                <h1 className="mt-2 text-[clamp(1.45rem,2.5vw,2rem)] font-semibold text-stone-50">
                  文脉溯源
                </h1>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-stone-300">
                {viewMode === "river" ? "总览" : "钻入"}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              整页河流作为唯一主场景，用少量浮窗承载筛选、状态和典籍细部。
            </p>
          </div>

          <div className="pointer-events-auto flex flex-wrap gap-2">
            <div className="rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,18,0.85),rgba(5,10,10,0.72))] px-4 py-2 text-xs text-stone-300 backdrop-blur-xl">
              可见典籍 {filteredBooks.length}
            </div>
            <div className="rounded-full border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,18,0.85),rgba(5,10,10,0.72))] px-4 py-2 text-xs text-stone-300 backdrop-blur-xl">
              可见关系 {visibleCitations.length}
            </div>
            <div className="rounded-full border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,35,35,0.88),rgba(4,12,12,0.72))] px-4 py-2 text-xs text-cyan-100 backdrop-blur-xl">
              真实来源 {connectedSourceCount || "--"}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 top-[108px] z-20 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_420px]">
            <aside className="pointer-events-auto xl:pt-2">
              <div className={`p-4 ${hudPanelClass}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-stone-400">
                      River Console
                    </div>
                    <div className="mt-1 text-base font-medium text-stone-50">
                      河流仪表盘
                    </div>
                  </div>
                  {viewMode === "book" ? (
                    <button
                      type="button"
                      onClick={handleReturnToRiver}
                      className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/15"
                    >
                      返回总览
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-stone-300">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-stone-500">典籍</div>
                    <div className="mt-1 text-sm font-medium text-stone-100">
                      {filteredBooks.length}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="text-stone-500">关系</div>
                    <div className="mt-1 text-sm font-medium text-stone-100">
                      {visibleCitations.length}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-3 py-3">
                    <div className="text-cyan-100/70">来源</div>
                    <div className="mt-1 text-sm font-medium text-cyan-50">
                      {connectedSourceCount || "--"}
                    </div>
                  </div>
                </div>

                <label className="mt-4 block">
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-400">
                    检索关键词
                  </span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="例如 朱熹、礼、诗教"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-cyan-300/30"
                  />
                </label>

                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-stone-400">
                    <span>时代水位</span>
                    <span className="text-amber-100">{activeEra}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={eras.length - 1}
                    step={1}
                    value={activeEraIndex}
                    onChange={(event) =>
                      setActiveEra(eras[Number(event.target.value)] ?? eras[0])
                    }
                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
                  />
                  <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-stone-500">
                    {eras.map((era) => (
                      <button
                        key={era}
                        type="button"
                        onClick={() => setActiveEra(era)}
                        className={`rounded-full px-2 py-1 transition ${
                          activeEra === era
                            ? "bg-amber-300/14 text-amber-100"
                            : "bg-white/0 text-stone-500 hover:bg-white/5 hover:text-stone-300"
                        }`}
                      >
                        {era}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setCategoryFilter(category)}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          categoryFilter === category
                            ? "bg-stone-100 text-stone-950"
                            : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-stone-400">显现上限</div>
                    <div className="mt-1 font-medium text-stone-50">
                      {eras[0]}至{activeEra}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-stone-400">运行模式</div>
                    <div className="mt-1 font-medium text-stone-50">
                      {viewMode === "river" ? "河流总览" : "典籍钻入"}
                    </div>
                  </div>
                </div>

                {viewMode === "river" && visibleNodePreview.length ? (
                  <div className="mt-4 rounded-[24px] border border-white/10 bg-black/18 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-stone-400">
                        当前河段
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {filteredBooks.length} 本
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {visibleNodePreview.map((book) => (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => handleDiveToBook(book.slug)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            selectedBookSlug === book.slug
                              ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                              : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                          }`}
                        >
                          {book.shortTitle}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeBranchAnnotation ? (
                  <div className="mt-4 rounded-[26px] border border-cyan-300/14 bg-cyan-300/6 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/75">
                      Active Branch
                    </div>
                    <div className="mt-2 text-sm font-medium text-cyan-50">
                      {activeBranchAnnotation.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-cyan-50/85">
                      {activeBranchAnnotation.description}
                    </p>
                  </div>
                ) : null}
              </div>
            </aside>

            <div className="pointer-events-none hidden xl:block" />

            <aside
              className={`pointer-events-auto transition-all duration-500 xl:pt-2 ${
                viewMode === "book"
                  ? "translate-y-0 opacity-100"
                  : "xl:translate-x-6 xl:opacity-70"
              }`}
            >
              <div className={`max-h-[calc(100vh-170px)] overflow-hidden p-4 ${hudPanelClass}`}>
                {selectedBook && selectedDetail ? (
                  <>
                    <div
                      className={`mb-4 rounded-[24px] px-4 py-4 transition-all duration-500 ${dossierToneClass} ${
                        traceFocus?.active
                          ? "shadow-[0_0_28px_rgba(34,211,238,0.12)]"
                          : transitionState === "diving" || transitionState === "settling"
                            ? "shadow-[0_0_24px_rgba(245,158,11,0.1)]"
                            : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div
                            className={`text-[11px] uppercase tracking-[0.24em] ${
                              traceFocus?.active ? "text-cyan-100/75" : "text-amber-100/75"
                            }`}
                          >
                            Focus Dossier
                          </div>
                          <div className="mt-1 text-lg font-medium text-stone-50">
                            {selectedBook.title}
                          </div>
                          <div className="mt-1 text-sm text-stone-400">
                            {selectedBook.dynasty} · {selectedBook.category} · {selectedBook.school}
                          </div>
                        </div>
                        <div className="grid gap-2 text-xs text-stone-300">
                          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
                            关联 {selectedBookCitations.length} 条
                          </div>
                          <div
                            className={`rounded-full px-3 py-1 ${
                              traceFocus?.active
                                ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                                : "border border-amber-300/20 bg-amber-300/10 text-amber-100"
                            }`}
                          >
                            {focusModeLabel}
                          </div>
                          {selectedSources.length ? (
                            <div className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
                              {selectedSources.length} 类来源
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-stone-300">
                        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3">
                          <div className="text-stone-500">焦点朝代</div>
                          <div className="mt-1 text-sm font-medium text-stone-100">
                            {selectedBook.dynasty}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3">
                          <div className="text-stone-500">当前模式</div>
                          <div className="mt-1 text-sm font-medium text-stone-100">
                            {focusModeLabel}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3">
                          <div className="text-stone-500">河流联动</div>
                          <div className="mt-1 text-sm font-medium text-stone-100">
                            {traceFocus?.active ? `${traceFocus.progress}/${traceFocus.total}` : "就绪"}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[calc(100vh-300px)] overflow-auto pr-1">
                      <BookExplorer
                        book={selectedBook}
                        detail={selectedDetail}
                        activeEra={activeEra}
                        onTraceFocusChange={setTraceFocus}
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm leading-7 text-stone-400">
                    当前没有可显示的典籍。可以放宽筛选，或直接点击河流中的节点进入。
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        <main className="h-screen w-full p-2 sm:p-3 lg:p-4">
          <RiverScene
            books={filteredBooks}
            citations={visibleCitations}
            selectedBookSlug={selectedBookSlug}
            onSelectBook={handleDiveToBook}
            activeEra={activeEra}
            viewMode={viewMode}
            cinematicState={transitionState}
            branchAnnotations={visibleBranchAnnotations}
            hoveredBranchId={hoveredBranchId}
            onHoverBranch={setHoveredBranchId}
            traceFocus={traceFocus}
            visibleNodeCount={filteredBooks.length}
            totalNodeCount={riverDataset.books.length}
          />
        </main>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-4 sm:px-6 lg:px-8">
          <div className={`pointer-events-auto px-4 py-4 ${hudPanelClass}`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap gap-2">
                {layerSummary.map(({ layer, count }) => (
                  <span
                    key={layer}
                    className={`rounded-full border px-3 py-2 text-xs ${relationLayerMeta[layer].badgeClass}`}
                  >
                    {relationLayerMeta[layer].label} {count}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
                {traceFocus?.active ? (
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-100">
                    溯源推进 {traceFocus.progress}/{traceFocus.total} · {traceFocus.currentTitle}
                  </span>
                ) : null}
                {selectedBook ? (
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-amber-100">
                    当前焦点 {selectedBook.title}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  点击节点钻入，拖拽旋转河流
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
