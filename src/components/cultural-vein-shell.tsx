"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BookExplorer,
  type SceneFocusState,
  type TraceFocusState,
} from "@/components/book-explorer";
import {
  RiverScene,
  type RiverBranchAnnotation,
  type RiverDockMarker,
} from "@/components/river-scene";
import { riverDataset } from "@/data/river-dataset";
import { useCulturalVeinStore } from "@/store/app-store";
import type { DatasetInsight } from "@/types/domain";

const eras = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"] as const;
const categories = ["全部", "经", "史", "子", "集"] as const;
const schoolLabel = "学派";
const defaultConceptSuggestions = Array.from(
  new Set(riverDataset.books.flatMap((book) => book.concepts)),
).slice(0, 10);

interface SearchPayload {
  query: string;
  total: number;
  hits: Array<{
    slug: string;
    title: string;
    shortTitle: string;
    dynasty: string;
    category: string;
    school: string;
    score: number;
    matchedConcepts: string[];
    matchedFields: string[];
  }>;
  relatedConcepts: string[];
}

const relationLayerMeta = {
  metadata: {
    label: "书目关联",
    tone:
      "border-white/12 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]",
  },
  explicit: {
    label: "显式引用",
    tone:
      "border-emerald-300/24 bg-emerald-300/10 text-emerald-100",
  },
  semantic: {
    label: "语义关联",
    tone:
      "border-amber-300/24 bg-amber-300/10 text-amber-100",
  },
  influence: {
    label: "间接影响",
    tone:
      "border-slate-300/18 bg-slate-300/10 text-slate-100",
  },
} as const;

const branchAnnotations: RiverBranchAnnotation[] = [
  {
    id: "branch-li-xue",
    label: "朱熹集注 至 理学分流",
    description:
      "以《论语集注》《四书章句集注》为中心，把经学重新组织成理学化、教材化的主河段。",
    targetSlug: "sishu-zhangju",
    accentColor: "#f59e0b",
    position: [3.1, 1.05, 0.58],
  },
  {
    id: "branch-shi-fa",
    label: "左传史法 至 通鉴支流",
    description:
      "从《春秋左传》到《史记》《资治通鉴》，展示经史互证如何沉淀为后世史学叙事方法。",
    targetSlug: "zi-zhi-tong-jian",
    accentColor: "#38bdf8",
    position: [-1.1, 0.58, -0.96],
  },
  {
    id: "branch-jing-shi",
    label: "孟子义理 至 经世反思",
    description:
      "从《孟子》到《日知录》，强调王道、民本与现实制度讨论之间的批评性承继。",
    targetSlug: "ri-zhi-lu",
    accentColor: "#34d399",
    position: [5.95, 0.52, 0.8],
  },
  {
    id: "branch-poetics",
    label: "诗教传统 至 近代诗学",
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
    schoolFilter,
    viewMode,
    setActiveEra,
    setCategoryFilter,
    setSchoolFilter,
    setSearchTerm,
    setSelectedBookSlug,
    resetSelection,
  } = useCulturalVeinStore();
  const [insights, setInsights] = useState<DatasetInsight | null>(null);
  const [searchResult, setSearchResult] = useState<SearchPayload | null>(null);
  const [searchPending, setSearchPending] = useState(false);
  const [hoveredBranchId, setHoveredBranchId] = useState<string | null>(null);
  const [hoveredBookSlug, setHoveredBookSlug] = useState<string | null>(null);
  const [traceFocus, setTraceFocus] = useState<TraceFocusState | null>(null);
  const [sceneFocus, setSceneFocus] = useState<SceneFocusState | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showMobileDossier, setShowMobileDossier] = useState(false);
  const [showDesktopDossier, setShowDesktopDossier] = useState(false);
  const [activeSourceAtlasId, setActiveSourceAtlasId] = useState<string | null>(null);
  const [activeDesktopPanel, setActiveDesktopPanel] = useState<
    "search" | "era" | "category" | "branch"
  >("search");
  const [transitionState, setTransitionState] = useState<
    "idle" | "diving" | "settling" | "returning"
  >("idle");

  const activeEraIndex = eras.indexOf(activeEra);
  const schools = useMemo(
    () => ["全部", ...new Set(riverDataset.books.map((book) => book.school))],
    [],
  );

  useEffect(() => {
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(() => {
      const loadSearch = async () => {
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);

          if (!response.ok) {
            return;
          }

          const payload = (await response.json()) as SearchPayload;
          if (!cancelled) {
            setSearchResult(payload);
          }
        } catch {
          if (!cancelled) {
            setSearchResult(null);
          }
        } finally {
          if (!cancelled) {
            setSearchPending(false);
          }
        }
      };

      void loadSearch();
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  const handleSearchTermChange = (value: string) => {
    setSearchPending(value.trim().length > 0);
    setSearchTerm(value);
  };

  const filteredBooks = useMemo(() => {
    return riverDataset.books.filter((book) => {
      const matchesEra = eras.indexOf(book.dynasty) <= activeEraIndex;
      const matchesCategory =
        categoryFilter === "全部" || book.category === categoryFilter;
      const matchesSchool =
        schoolFilter === "全部" || book.school === schoolFilter;

      return matchesEra && matchesCategory && matchesSchool;
    });
  }, [
    activeEraIndex,
    categoryFilter,
    schoolFilter,
  ]);
  const searchHighlightedSlugs = useMemo(
    () =>
      searchTerm.trim().length > 0 && searchResult?.query.trim() === searchTerm.trim()
        ? searchResult?.hits.map((hit) => hit.slug) ?? []
        : [],
    [searchResult?.hits, searchResult?.query, searchTerm],
  );

  const visibleCitations = useMemo(() => {
    return riverDataset.citations.filter((citation) => {
      return (
        filteredBooks.some((book) => book.id === citation.source) &&
        filteredBooks.some((book) => book.id === citation.target)
      );
    });
  }, [filteredBooks]);
  const relationSummary = useMemo(
    () =>
      (Object.keys(relationLayerMeta) as Array<keyof typeof relationLayerMeta>).map((layer) => ({
        layer,
        count: visibleCitations.filter((citation) => citation.layer === layer).length,
      })),
    [visibleCitations],
  );

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
  const riverDockMarkers = useMemo<RiverDockMarker[]>(() => {
    if (!selectedBook || !selectedDetail?.places.length) {
      return [];
    }

    const [baseX, baseY, baseZ] = selectedBook.coordinates;

    return selectedDetail.places.slice(0, 4).map((place, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const laneOffset = 0.56 + index * 0.12;
      const longitudinalOffset = (index - 1.5) * 0.52;

      return {
        id: `${selectedBook.slug}-dock-${place.id}`,
        label: place.name,
        note: place.note,
        position: [
          baseX + longitudinalOffset,
          baseY + 0.03,
          baseZ + direction * laneOffset,
        ],
      };
    });
  }, [selectedBook, selectedDetail]);
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
      setShowDesktopDossier(true);
      setSelectedBookSlug(slug);
      return;
    }

    setTransitionState("diving");
    window.setTimeout(() => {
      setShowDesktopDossier(true);
      setSelectedBookSlug(slug);
      setTransitionState("settling");
    }, 180);
  };

  const handleReturnToRiver = () => {
    setTransitionState("returning");
    window.setTimeout(() => {
      setTraceFocus(null);
      setSceneFocus(null);
      setShowDesktopDossier(false);
      setShowMobileDossier(false);
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
  const sourceAtlasEntries = useMemo(
    () => (insights?.sourceAtlas ?? []).slice(0, 6),
    [insights?.sourceAtlas],
  );
  const activeSourceAtlasEntry = useMemo(() => {
    if (!sourceAtlasEntries.length) {
      return null;
    }

    return (
      sourceAtlasEntries.find((entry) => entry.id === activeSourceAtlasId) ??
      sourceAtlasEntries[0]
    );
  }, [activeSourceAtlasId, sourceAtlasEntries]);
  const sourceAtlasDockMarkers = useMemo<RiverDockMarker[]>(() => {
    if (!activeSourceAtlasEntry?.sampleRecords?.length) {
      return [];
    }

    const anchorBooks = filteredBooks
      .filter((book) => {
        if (
          !activeSourceAtlasEntry.name.includes("报刊") &&
          !activeSourceAtlasEntry.name.includes("专题片")
        ) {
          return true;
        }

        return book.dynasty === "近现代" || book.dynasty === "明清";
      })
      .sort((left, right) => left.year - right.year);

    const accentPalette = ["#fbbf24", "#f59e0b", "#fcd34d", "#f97316"];

    return activeSourceAtlasEntry.sampleRecords.slice(0, 4).map((record, index) => {
      const fallbackBook = filteredBooks[index % Math.max(filteredBooks.length, 1)];
      const anchorBook =
        anchorBooks[Math.min(index, Math.max(anchorBooks.length - 1, 0))] ?? fallbackBook;

      const [baseX, baseY, baseZ] = anchorBook?.coordinates ?? [index * 1.6, 0.18, 0];
      const laneDirection = index % 2 === 0 ? 1 : -1;

      return {
        id: `source-atlas-${activeSourceAtlasEntry.id}-${index}`,
        label: record.title,
        note: record.note,
        accentColor: accentPalette[index % accentPalette.length],
        position: [
          baseX + (index - 1.5) * 0.68,
          baseY + 0.04,
          baseZ + laneDirection * (0.96 + index * 0.12),
        ],
      };
    });
  }, [activeSourceAtlasEntry, filteredBooks]);
  const sourceAtlasPathPoints = useMemo(
    () =>
      sourceAtlasDockMarkers.map((dock) => [
        dock.position[0],
        dock.position[1] + 0.06,
        dock.position[2],
      ] as [number, number, number]),
    [sourceAtlasDockMarkers],
  );
  const mergedDockMarkers = selectedBook ? riverDockMarkers : sourceAtlasDockMarkers;
  const sourceAtlasMass =
    (insights?.cbdbSummary?.personCount ?? 0) +
    (insights?.nanjingLibrarySample?.recordCount ?? 0) +
    (insights?.nanhuArchiveSample?.documentCount ?? 0) +
    (insights?.nanhuArchiveSample?.imageCount ?? 0);
  const focusModeLabel = traceFocus?.active
    ? "逆流溯源"
    : sceneFocus?.active
      ? "场景联动"
    : viewMode === "book"
      ? "典籍钻入"
      : "河流巡航";
  const dossierToneClass = traceFocus?.active
    ? "border-amber-200/24 bg-[linear-gradient(135deg,rgba(125,82,18,0.4),rgba(37,24,8,0.9))]"
    : transitionState === "diving" || transitionState === "settling"
      ? "border-amber-300/20 bg-[linear-gradient(135deg,rgba(121,75,14,0.48),rgba(42,26,9,0.9))]"
      : "border-amber-200/18 bg-[linear-gradient(135deg,rgba(97,63,14,0.42),rgba(34,22,8,0.9))]";
  const dossierMotionClass =
    transitionState === "diving"
      ? "translate-y-6 scale-[0.985] opacity-0"
      : transitionState === "settling"
        ? "translate-y-0 scale-100 opacity-100"
        : transitionState === "returning"
          ? "translate-y-3 scale-[0.992] opacity-0"
          : "translate-y-0 scale-100 opacity-100";
  const visibleNodePreview = filteredBooks.slice(0, 5);
  const resolvedSearchResult =
    searchResult?.query.trim() === searchTerm.trim() ? searchResult : null;
  const searchSuggestionChips =
    resolvedSearchResult?.relatedConcepts.length
      ? resolvedSearchResult.relatedConcepts
      : defaultConceptSuggestions;
  const panelBaseClass =
    "rounded-[28px] border border-[#ead8a6]/24 bg-[linear-gradient(180deg,rgba(100,72,28,0.9),rgba(44,30,10,0.86))] shadow-2xl shadow-black/30 backdrop-blur-xl";
  const desktopPanels: Array<{
    id: "search" | "era" | "category" | "branch";
    label: string;
    summary: string;
  }> = [
    {
      id: "search",
      label: "检索",
      summary: resolvedSearchResult?.query
        ? `命中 ${resolvedSearchResult.total} 本`
        : "概念联想",
    },
    {
      id: "era",
      label: "时代",
      summary: activeEra,
    },
    {
      id: "category",
      label: "门类",
      summary:
        schoolFilter === "全部"
          ? categoryFilter
          : `${categoryFilter} · ${schoolFilter}`,
    },
    {
      id: "branch",
      label: "支流",
      summary: activeBranchAnnotation?.label ?? "主河道",
    },
  ];
  const activeDesktopPanelConfig =
    desktopPanels.find((panel) => panel.id === activeDesktopPanel) ?? desktopPanels[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#241405] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(244,208,110,0.22),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(214,164,68,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(196,146,52,0.12),transparent_38%),linear-gradient(180deg,#8d6324_0%,#4a2f0e_38%,#1b0f04_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,243,204,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,243,204,0.05)_1px,transparent_1px)] [background-size:96px_96px]" />

      {showDiveOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              transitionState === "diving"
                ? "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(4,8,7,0.92)_68%)] backdrop-blur-[2px]"
                : transitionState === "settling"
                  ? "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.16),rgba(38,24,8,0.76)_72%)]"
                  : "bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.08),rgba(4,8,7,0.88)_70%)]"
            }`}
          />
          <div
            className={`absolute inset-y-0 left-1/2 w-[min(38vw,440px)] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(248,223,154,0.16),rgba(248,223,154,0.03),rgba(248,223,154,0.14))] transition-all duration-500 ${
              transitionState === "diving"
                ? "opacity-80 blur-[10px]"
                : transitionState === "settling"
                  ? "opacity-55 blur-[14px]"
                  : "opacity-0 blur-[18px]"
            }`}
          />
        </div>
      ) : null}

      <div className="relative z-10 min-h-screen">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className={`pointer-events-auto max-w-[240px] px-4 py-3 sm:max-w-[300px] sm:px-5 sm:py-4 ${panelBaseClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.32em] text-[#f2dfab]/80">
                  中华文脉长卷
                </div>
                <h1 className="mt-2 text-[clamp(1.45rem,2.5vw,2rem)] font-semibold text-[#fbf3da]">
                  文脉溯源
                </h1>
              </div>
              <div className="rounded-full border border-[#ead8a6]/24 bg-[rgba(255,248,220,0.08)] px-3 py-1 text-[11px] text-[#eadfbc]">
                {viewMode === "river" ? "总览" : "钻入"}
              </div>
            </div>
            <p className="mt-3 text-xs leading-6 text-[#eadfbc] sm:text-sm">
              整页以黄河文脉为主景，题签与文卷只在需要时轻轻展开。
            </p>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {selectedBook ? (
              <button
                type="button"
                onClick={() => setShowDesktopDossier((current) => !current)}
                className="hidden rounded-full border border-amber-200/20 bg-[linear-gradient(180deg,rgba(87,59,19,0.9),rgba(42,28,10,0.82))] px-4 py-2 text-xs text-amber-50 backdrop-blur-xl md:inline-flex"
              >
                {showDesktopDossier ? "收起文卷" : "展开文卷"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="absolute left-4 top-[104px] z-20 hidden w-[228px] sm:left-6 md:block lg:left-8 lg:w-[236px]">
          <aside className="pointer-events-auto xl:pt-2">
            <div className={`p-4 ${panelBaseClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] tracking-[0.28em] text-[#d8c9a3]">
                    长卷侧注
                  </div>
                  <div className="mt-1 text-base font-medium text-[#fbf3da]">
                    河上题签
                  </div>
                </div>
                {viewMode === "book" ? (
                  <button
                    type="button"
                    onClick={handleReturnToRiver}
                    className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs text-amber-100 transition hover:bg-amber-300/15"
                  >
                    归河
                  </button>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-[#eadfbc]">
                <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5">
                  典籍 {filteredBooks.length}
                </span>
                <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5">
                  关系 {visibleCitations.length}
                </span>
                <span className="rounded-full border border-[#ead8a6]/20 bg-[rgba(233,191,86,0.08)] px-3 py-1.5 text-[#fbf3da]">
                  来源 {connectedSourceCount || "--"}
                </span>
              </div>

              <div className="mt-4 rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(27,17,7,0.18)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">
                    关系层级
                  </div>
                  <div className="text-[11px] text-[#c9b68a]">
                    置信度说明
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {relationSummary.map(({ layer, count }) => (
                    <span
                      key={layer}
                      className={`rounded-full border px-3 py-1.5 text-[11px] ${relationLayerMeta[layer].tone}`}
                    >
                      {relationLayerMeta[layer].label} {count}
                    </span>
                  ))}
                </div>
              </div>

              {sourceAtlasEntries.length ? (
                <div className="mt-4 rounded-[24px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(93,62,18,0.24),rgba(28,18,7,0.22))] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">
                        真实数据版图
                      </div>
                      <div className="mt-1 text-sm text-[#fbf3da]">
                        已接入 {connectedSourceCount} 路来源
                      </div>
                    </div>
                    <div className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-[10px] text-[#f2dfab]">
                      样本量级 {sourceAtlasMass.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sourceAtlasEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => setActiveSourceAtlasId(entry.id)}
                        className={`rounded-full px-3 py-1.5 text-[11px] transition ${
                          activeSourceAtlasEntry?.id === entry.id
                            ? "bg-[#f3dfab] text-[#42290a]"
                            : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                        }`}
                      >
                        {entry.name}
                      </button>
                    ))}
                  </div>
                  {activeSourceAtlasEntry ? (
                    <div className="mt-3 rounded-[22px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-medium text-[#fbf3da]">
                            {activeSourceAtlasEntry.name}
                          </div>
                          <div className="mt-1 text-[11px] leading-5 text-[#e6d7ae]">
                            {activeSourceAtlasEntry.summary ?? "真实来源样本"}
                          </div>
                        </div>
                        <div className="text-[10px] text-[#f2dfab]">{activeSourceAtlasEntry.stat}</div>
                      </div>
                      {activeSourceAtlasEntry.sampleRecords?.length ? (
                        <div className="mt-3 space-y-2">
                          {activeSourceAtlasEntry.sampleRecords.slice(0, 3).map((record) => (
                            <div
                              key={`${activeSourceAtlasEntry.id}-${record.title}`}
                              className="rounded-[18px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.36)] px-3 py-2.5"
                            >
                              <div className="text-[11px] font-medium leading-5 text-[#fbf3da]">
                                {record.title}
                              </div>
                              <div className="mt-1 text-[10px] text-[#f2dfab]">
                                {[record.category, record.year].filter(Boolean).join(" · ") || "样本条目"}
                              </div>
                              {record.note ? (
                                <div className="mt-1 text-[11px] leading-5 text-[#dccb9c] line-clamp-3">
                                  {record.note}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {desktopPanels.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActiveDesktopPanel(panel.id)}
                    className={`rounded-full px-3 py-2 text-[11px] transition ${
                      activeDesktopPanel === panel.id
                        ? "bg-[#f3dfab] text-[#42290a]"
                        : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                    }`}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>

              <section className="mt-4 rounded-[24px] border border-[#ead8a6]/16 bg-[rgba(27,17,7,0.22)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">
                      {activeDesktopPanelConfig.label}
                    </div>
                    <div className="mt-1 text-sm text-[#fbf3da]">
                      {activeDesktopPanelConfig.summary}
                    </div>
                  </div>
                  <div className="rounded-full border border-[#ead8a6]/18 px-2 py-1 text-[10px] text-[#f2dfab]">
                    当前题签
                  </div>
                </div>

                {activeDesktopPanel === "search" ? (
                  <div className="mt-4">
                    <label className="block">
                      <span className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                        概念检索
                      </span>
                      <input
                        value={searchTerm}
                        onChange={(event) => handleSearchTermChange(event.target.value)}
                        placeholder="例如 仁、礼、诗教、朱熹"
                        className="mt-2 w-full rounded-2xl border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-4 py-3 text-sm text-[#fbf3da] outline-none placeholder:text-[#c9b68a] focus:border-[#f0cf75]/40"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {searchSuggestionChips.slice(0, 8).map((concept) => (
                        <button
                          key={concept}
                          type="button"
                          onClick={() => handleSearchTermChange(concept)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            searchTerm.trim() === concept
                              ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                              : "border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                          }`}
                        >
                          {concept}
                        </button>
                      ))}
                    </div>
                    {resolvedSearchResult?.hits.length ? (
                      <div className="mt-3 space-y-2">
                        {resolvedSearchResult.hits.slice(0, 3).map((hit) => (
                          <button
                            key={hit.slug}
                            type="button"
                            onClick={() => handleDiveToBook(hit.slug)}
                            className="w-full rounded-2xl border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-3 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                          >
                            <div className="font-medium text-[#fbf3da]">{hit.title}</div>
                            <div className="mt-1 text-xs text-[#d8c9a3]">
                              {hit.dynasty} · {hit.category} · {hit.school}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : resolvedSearchResult?.query && !searchPending ? (
                      <div className="mt-3 text-sm text-[#d8c9a3]">
                        暂未照见相关文脉节点。
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {activeDesktopPanel === "era" ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between gap-3 text-[11px] tracking-[0.22em] text-[#d8c9a3]">
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
                    <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-[#c9b68a]">
                      {eras.map((era) => (
                        <button
                          key={era}
                          type="button"
                          onClick={() => setActiveEra(era)}
                          className={`rounded-full px-2 py-1 transition ${
                            activeEra === era
                              ? "bg-amber-300/14 text-amber-100"
                              : "bg-white/0 text-[#c9b68a] hover:bg-[rgba(255,248,220,0.05)] hover:text-[#eadfbc]"
                          }`}
                        >
                          {era}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeDesktopPanel === "category" ? (
                  <div className="mt-4">
                    <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">
                      四部门类
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setCategoryFilter(category)}
                          className={`rounded-full px-3 py-2 text-xs transition ${
                            categoryFilter === category
                              ? "bg-[#f3dfab] text-[#42290a]"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 text-[11px] tracking-[0.24em] text-[#d8c9a3]">
                      {schoolLabel}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {schools.map((school) => (
                        <button
                          key={school}
                          type="button"
                          onClick={() => setSchoolFilter(school)}
                          className={`rounded-full px-3 py-2 text-xs transition ${
                            schoolFilter === school
                              ? "bg-[#f3dfab] text-[#42290a]"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                          }`}
                        >
                          {school}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-3 py-3 text-sm text-[#eadfbc]">
                      当前河段显现自 {eras[0]} 至 {activeEra}，门类为 {categoryFilter}，学派为 {schoolFilter}。
                    </div>
                  </div>
                ) : null}

                {activeDesktopPanel === "branch" ? (
                  <div className="mt-4">
                    {activeBranchAnnotation ? (
                      <>
                        <div className="text-sm font-medium text-[#fbf3da]">
                          {activeBranchAnnotation.label}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#f4e8c4]">
                          {activeBranchAnnotation.description}
                        </p>
                      </>
                    ) : (
                      <div className="text-sm text-[#d8c9a3]">
                        此刻正停在主河道，可顺着河面节点入卷。
                      </div>
                    )}
                    {viewMode === "river" && visibleNodePreview.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {visibleNodePreview.map((book) => (
                          <button
                            key={book.id}
                            type="button"
                            onClick={() => handleDiveToBook(book.slug)}
                            className={`rounded-full border px-3 py-1.5 text-xs transition ${
                              selectedBookSlug === book.slug
                                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                                : "border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                            }`}
                          >
                            {book.shortTitle}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            </div>
          </aside>
        </div>

        {showDesktopDossier && selectedBook && selectedDetail ? (
          <div className="absolute right-4 top-[104px] z-20 hidden w-[min(400px,calc(100vw-20rem))] sm:right-6 lg:right-8 xl:block">
            <aside className={`pointer-events-auto transition-all duration-500 ease-out xl:pt-2 ${dossierMotionClass}`}>
              <div className={`overflow-hidden p-4 ${panelBaseClass}`}>
                <div
                  className={`rounded-[30px] border border-[#ead8a6]/20 bg-[linear-gradient(180deg,rgba(245,231,188,0.14),rgba(104,72,25,0.14))] p-3 ${
                    traceFocus?.active
                      ? "shadow-[0_0_28px_rgba(245,158,11,0.12)]"
                      : transitionState === "diving" || transitionState === "settling"
                        ? "shadow-[0_0_24px_rgba(245,158,11,0.1)]"
                        : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(61,40,11,0.45)] px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-[11px] tracking-[0.28em] text-[#f2dfab]/80">
                        河上文卷
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="rounded-full border border-[#ead8a6]/24 bg-[rgba(255,248,220,0.08)] px-3 py-1 text-[11px] text-[#eadfbc]">
                          焦点典籍
                        </div>
                        <div className="text-sm text-[#d8c9a3]">{selectedBook.dynasty}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDesktopDossier(false)}
                      className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-xs text-[#eadfbc]"
                    >
                      收卷
                    </button>
                  </div>

                  <div
                    className={`mt-3 rounded-[28px] px-5 py-5 transition-all duration-500 ${dossierToneClass}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[11px] tracking-[0.24em] text-[#f2dfab]/80">
                          卷首题签
                        </div>
                        <div className="mt-2 text-[1.35rem] font-semibold leading-tight text-[#fbf3da]">
                          {selectedBook.title}
                        </div>
                        <div className="mt-2 text-sm text-[#eadfbc]">
                          {selectedBook.category} · {selectedBook.school}
                        </div>
                      </div>
                      <div className="writing-mode-vertical-rl rounded-full border border-[#ead8a6]/20 bg-[rgba(255,248,220,0.08)] px-2 py-3 text-[10px] tracking-[0.24em] text-[#f2dfab] [writing-mode:vertical-rl]">
                        文脉
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.08)] px-3 py-1.5 text-[#fbf3da]">
                        {focusModeLabel}
                      </span>
                      <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.08)] px-3 py-1.5 text-[#eadfbc]">
                        关联 {selectedBookCitations.length} 条
                      </span>
                      {selectedSources.length ? (
                        <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(233,191,86,0.1)] px-3 py-1.5 text-[#fbf3da]">
                          来源 {selectedSources.length} 类
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#eadfbc]">
                      <div className="rounded-2xl border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                        <div className="text-[#c9b68a]">朝代</div>
                        <div className="mt-1 text-sm font-medium text-[#fbf3da]">
                          {selectedBook.dynasty}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                        <div className="text-[#c9b68a]">模式</div>
                        <div className="mt-1 text-sm font-medium text-[#fbf3da]">
                          {focusModeLabel}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                        <div className="text-[#c9b68a]">联动</div>
                        <div className="mt-1 text-sm font-medium text-[#fbf3da]">
                          {traceFocus?.active
                            ? `${traceFocus.progress}/${traceFocus.total}`
                            : sceneFocus?.active
                              ? sceneFocus.contextLabel
                              : "静观"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-[28px] border border-[#ead8a6]/16 bg-[linear-gradient(180deg,rgba(244,230,188,0.96),rgba(224,200,146,0.92))] px-4 py-4 text-[#42290a] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#b89247]/20 pb-3">
                      <div>
                        <div className="text-[11px] tracking-[0.24em] text-[#8d6a2c]">
                          卷内细览
                        </div>
                        <div className="mt-1 text-sm font-medium text-[#5b3a11]">
                          沿卷细看传播、人物、版本与溯源
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[calc(100vh-368px)] overflow-auto pr-1">
                      <BookExplorer
                        book={selectedBook}
                        detail={selectedDetail}
                        activeEra={activeEra}
                        onTraceFocusChange={setTraceFocus}
                        onSceneFocusChange={setSceneFocus}
                        onOpenBook={handleDiveToBook}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

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
            hoveredBookSlug={hoveredBookSlug}
            onHoverBook={setHoveredBookSlug}
            traceFocus={traceFocus}
            sceneFocus={sceneFocus}
            dockMarkers={mergedDockMarkers}
            sourceAtlasLabel={!selectedBook ? activeSourceAtlasEntry?.name ?? null : null}
            sourceAtlasSummary={!selectedBook ? activeSourceAtlasEntry?.summary ?? null : null}
            sourceAtlasPathPoints={!selectedBook ? sourceAtlasPathPoints : []}
            visibleNodeCount={filteredBooks.length}
            totalNodeCount={riverDataset.books.length}
            highlightedBookSlugs={searchHighlightedSlugs}
          />
        </main>

        {showMobileControls ? (
          <div className="absolute inset-x-3 bottom-[4.9rem] z-40 md:hidden">
            <div className={`pointer-events-auto max-h-[38vh] overflow-auto p-4 ${panelBaseClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] tracking-[0.28em] text-[#d8c9a3]">长卷侧注</div>
                  <div className="mt-1 text-sm font-medium text-[#fbf3da]">
                    {activeDesktopPanelConfig.label}题签
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileControls(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200"
                >
                  收起
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#eadfbc]">
                <div className="rounded-2xl border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-2.5">典籍 {filteredBooks.length}</div>
                <div className="rounded-2xl border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-2.5">关系 {visibleCitations.length}</div>
                <div className="rounded-2xl border border-[#ead8a6]/20 bg-[rgba(233,191,86,0.08)] px-3 py-2.5 text-[#fbf3da]">来源 {connectedSourceCount || "--"}</div>
              </div>
              {sourceAtlasEntries.length ? (
                <div className="mt-4 rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(93,62,18,0.22)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">真实数据版图</div>
                    <div className="text-[11px] text-[#f2dfab]">{sourceAtlasMass.toLocaleString()}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sourceAtlasEntries.slice(0, 4).map((entry) => (
                      <button
                        key={`mobile-source-${entry.id}`}
                        type="button"
                        onClick={() => setActiveSourceAtlasId(entry.id)}
                        className={`rounded-full px-3 py-1.5 text-[11px] transition ${
                          activeSourceAtlasEntry?.id === entry.id
                            ? "bg-[#f3dfab] text-[#42290a]"
                            : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                        }`}
                      >
                        {entry.name}
                      </button>
                    ))}
                  </div>
                  {activeSourceAtlasEntry ? (
                    <div className="mt-3 rounded-[18px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs text-[#fbf3da]">{activeSourceAtlasEntry.name}</div>
                        <div className="text-[10px] text-[#f2dfab]">{activeSourceAtlasEntry.stat}</div>
                      </div>
                      <div className="mt-1 text-[11px] leading-5 text-[#e6d7ae]">
                        {activeSourceAtlasEntry.summary ?? "真实来源样本"}
                      </div>
                      {activeSourceAtlasEntry.sampleRecords?.[0] ? (
                        <div className="mt-2 rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.34)] px-3 py-2.5">
                          <div className="text-[11px] font-medium leading-5 text-[#fbf3da]">
                            {activeSourceAtlasEntry.sampleRecords[0].title}
                          </div>
                          <div className="mt-1 text-[10px] text-[#f2dfab]">
                            {[
                              activeSourceAtlasEntry.sampleRecords[0].category,
                              activeSourceAtlasEntry.sampleRecords[0].year,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "样本条目"}
                          </div>
                          {activeSourceAtlasEntry.sampleRecords[0].note ? (
                            <div className="mt-1 text-[11px] leading-5 text-[#dccb9c] line-clamp-3">
                              {activeSourceAtlasEntry.sampleRecords[0].note}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {desktopPanels.map((panel) => (
                  <button
                    key={`mobile-tab-${panel.id}`}
                    type="button"
                    onClick={() => setActiveDesktopPanel(panel.id)}
                    className={`rounded-full px-3 py-2 text-xs transition ${
                      activeDesktopPanel === panel.id
                        ? "bg-[#f3dfab] text-[#42290a]"
                        : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                    }`}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>
              {activeDesktopPanel === "search" ? (
                <>
                  <label className="mt-4 block">
                    <span className="text-xs tracking-[0.22em] text-[#d8c9a3]">概念检索</span>
                    <input
                      value={searchTerm}
                      onChange={(event) => handleSearchTermChange(event.target.value)}
                      placeholder="例如 仁、礼、诗教、朱熹"
                      className="mt-2 w-full rounded-2xl border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-4 py-3 text-sm text-[#fbf3da] outline-none placeholder:text-[#c9b68a] focus:border-[#f0cf75]/40"
                    />
                  </label>
                  <div className="mt-4 rounded-[24px] border border-[#ead8a6]/18 bg-[rgba(27,17,7,0.24)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">概念联想</div>
                      <div className="text-[11px] text-[#c9b68a]">
                        {searchPending
                          ? "检索中"
                          : resolvedSearchResult?.query
                            ? `命中 ${resolvedSearchResult.total} 本`
                            : "常见概念"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {searchSuggestionChips.slice(0, 8).map((concept) => (
                        <button
                          key={`mobile-${concept}`}
                          type="button"
                          onClick={() => handleSearchTermChange(concept)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            searchTerm.trim() === concept
                              ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                              : "border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                          }`}
                        >
                          {concept}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              {activeDesktopPanel === "era" ? (
                <div className="mt-4 rounded-[24px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3 text-[11px] tracking-[0.22em] text-[#d8c9a3]">
                    <span>时代水位</span>
                    <span className="text-amber-100">{activeEra}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={eras.length - 1}
                    step={1}
                    value={activeEraIndex}
                    onChange={(event) => setActiveEra(eras[Number(event.target.value)] ?? eras[0])}
                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
                  />
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#c9b68a]">
                    {eras.map((era) => (
                      <button
                        key={era}
                        type="button"
                        onClick={() => setActiveEra(era)}
                        className={`rounded-full px-2 py-1 transition ${
                          activeEra === era
                            ? "bg-amber-300/14 text-amber-100"
                            : "bg-white/0 text-[#c9b68a] hover:bg-[rgba(255,248,220,0.05)] hover:text-[#eadfbc]"
                        }`}
                      >
                        {era}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {activeDesktopPanel === "category" ? (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setCategoryFilter(category)}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          categoryFilter === category
                            ? "bg-[#f3dfab] text-[#42290a]"
                            : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[24px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                    <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">
                      {schoolLabel}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {schools.map((school) => (
                        <button
                          key={`mobile-school-${school}`}
                          type="button"
                          onClick={() => setSchoolFilter(school)}
                          className={`rounded-full px-3 py-2 text-xs transition ${
                            schoolFilter === school
                              ? "bg-[#f3dfab] text-[#42290a]"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                          }`}
                        >
                          {school}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
              {activeDesktopPanel === "branch" ? (
                <>
                  <div className="mt-4 rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(27,17,7,0.18)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">关系层级</div>
                      <div className="text-[11px] text-[#c9b68a]">置信度说明</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {relationSummary.map(({ layer, count }) => (
                        <span
                          key={`mobile-layer-${layer}`}
                          className={`rounded-full border px-3 py-1.5 text-[11px] ${relationLayerMeta[layer].tone}`}
                        >
                          {relationLayerMeta[layer].label} {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 rounded-[24px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-4 py-4 text-sm text-[#eadfbc]">
                    {activeBranchAnnotation ? activeBranchAnnotation.description : "当前停留在主河道，可点河上节点入卷细看。"}
                  </div>
                </>
              ) : null}
              <div className="mt-4 rounded-2xl border border-[#ead8a6]/16 bg-[rgba(27,17,7,0.18)] px-3 py-3 text-sm text-[#eadfbc]">
                当前河段显现自 {eras[0]} 至 {activeEra}，门类为 {categoryFilter}，学派为 {schoolFilter}。
              </div>
            </div>
          </div>
        ) : null}

        {showMobileDossier && selectedBook && selectedDetail ? (
          <div className="absolute inset-x-3 bottom-[4.9rem] z-40 md:hidden">
            <div className={`pointer-events-auto overflow-hidden p-3 transition-all duration-500 ease-out ${panelBaseClass} ${dossierMotionClass}`}>
              <div className="rounded-[26px] border border-[#ead8a6]/18 bg-[linear-gradient(180deg,rgba(245,231,188,0.16),rgba(104,72,25,0.14))] p-3">
                <div className="flex items-start justify-between gap-3 rounded-[22px] border border-[#ead8a6]/14 bg-[rgba(61,40,11,0.42)] px-4 py-3">
                  <div>
                    <div className="text-[11px] tracking-[0.24em] text-[#f2dfab]/80">焦点文卷</div>
                    <div className="mt-1 text-lg font-medium text-[#fbf3da]">{selectedBook.title}</div>
                    <div className="mt-1 text-xs text-[#eadfbc]">
                      {selectedBook.dynasty} · {focusModeLabel}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileDossier(false)}
                    className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-xs text-[#eadfbc]"
                  >
                    收卷
                  </button>
                </div>
                <div className="mt-3 rounded-[24px] border border-[#ead8a6]/16 bg-[linear-gradient(180deg,rgba(247,237,206,0.98),rgba(230,204,140,0.94))] px-4 py-4 text-[#42290a]">
                  <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-[#b89247]/20 bg-[rgba(255,255,255,0.24)] px-3 py-1 text-[#5b3a11]">
                      关联 {selectedBookCitations.length} 条
                    </span>
                    {selectedSources.length ? (
                      <span className="rounded-full border border-[#b89247]/20 bg-[rgba(255,255,255,0.24)] px-3 py-1 text-[#5b3a11]">
                        来源 {selectedSources.length} 类
                      </span>
                    ) : null}
                  </div>
                  <div className="max-h-[calc(44vh-124px)] overflow-auto pr-1">
                    <BookExplorer
                      book={selectedBook}
                      detail={selectedDetail}
                      activeEra={activeEra}
                      onTraceFocusChange={setTraceFocus}
                      onSceneFocusChange={setSceneFocus}
                      onOpenBook={handleDiveToBook}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 md:hidden">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#ead8a6]/26 bg-[rgba(78,52,18,0.9)] px-2 py-2 shadow-xl shadow-black/25 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => {
                setShowMobileDossier(false);
                setShowMobileControls((current) => !current);
              }}
              className={`rounded-full px-3 py-2 text-xs transition ${
                showMobileControls ? "bg-[#f3dfab] text-[#42290a]" : "text-[#f7edd1]"
              }`}
            >
              题签
            </button>
            <button
              type="button"
              onClick={handleReturnToRiver}
              className="rounded-full px-3 py-2 text-xs text-[#f7edd1]"
            >
              归河
            </button>
            {selectedBook ? (
              <button
                type="button"
                onClick={() => {
                  setShowMobileControls(false);
                  setShowMobileDossier((current) => !current);
                }}
                className={`rounded-full px-3 py-2 text-xs transition ${
                  showMobileDossier ? "bg-[#f3dfab] text-[#42290a]" : "text-[#f7edd1]"
                }`}
              >
                文卷
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
