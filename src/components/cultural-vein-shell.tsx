"use client";

import { useEffect, useMemo, useState } from "react";

import {
  BookExplorer,
  type ExplorerOpenOptions,
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

function inferEraFromYearText(yearText?: string) {
  if (!yearText) {
    return null;
  }

  const matched = yearText.match(/-?\d{3,4}/);

  if (!matched) {
    return null;
  }

  const year = Number(matched[0]);

  if (Number.isNaN(year)) {
    return null;
  }

  if (year <= -221) {
    return "先秦" as const;
  }

  if (year <= 220) {
    return "两汉" as const;
  }

  if (year <= 589) {
    return "魏晋" as const;
  }

  if (year <= 907) {
    return "隋唐" as const;
  }

  if (year <= 1368) {
    return "宋元" as const;
  }

  if (year <= 1911) {
    return "明清" as const;
  }

  return "近现代" as const;
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

const branchAccentByLayer = {
  metadata: "#f59e0b",
  explicit: "#34d399",
  semantic: "#38bdf8",
  influence: "#c084fc",
} as const;

const eraNarratives: Record<
  (typeof eras)[number],
  {
    lead: string;
    trunk: string;
    branch: string;
  }
> = {
  "先秦": {
    lead: "主河仍在上游聚束，核心是经典原点与最初的思想定型。",
    trunk: "主干以《诗经》《尚书》《周易》《论语》为轴，奠定后世经学与义理的源头层。",
    branch: "可从《孟子》与《左传》看思想分化与史学叙事如何开始外展。",
  },
  "两汉": {
    lead: "河道开始显著放宽，经典整理、篇章析出与训诂系统同步成形。",
    trunk: "《礼记》《大学》《中庸》《孝经》把礼治、教化与修身秩序重新编入主河道。",
    branch: "《说文解字》《公羊传》一类支流开始把文字、义例与制度讨论接入主脉。",
  },
  "魏晋": {
    lead: "主河进入重释与转写阶段，经学资源向文论、总集和新解释框架扩散。",
    trunk: "《文心雕龙》《昭明文选》把经典源流转译为诗文批评与选本阅读传统。",
    branch: "这一段更适合讲“经学资源怎样溢出主河”，走向诗学与文体理论支流。",
  },
  "隋唐": {
    lead: "河势转入官学整理期，正义、疏解与制度化讲授让主流更稳定可传。",
    trunk: "《尚书正义》代表的官学经疏，把原典重新固定成更大范围的教学主线。",
    branch: "可顺着经疏支流讲注释体系如何充当河道整修者，放大经典传播半径。",
  },
  "宋元": {
    lead: "这是支流爆发的一层，理学重组与通史编纂让整条河出现强烈分流。",
    trunk: "《四书章句集注》《论语集注》《资治通鉴》把教材化、义理化与历史叙事推到高峰。",
    branch: "最适合展示四书体系、史法支流与多层传播网络如何同时长成。",
  },
  "明清": {
    lead: "河道进入考据、反思与再整理阶段，部分旧支流收束，部分新支流转深。",
    trunk: "《日知录》这样的节点把经世批评、训诂回流和制度反思重新压入主线讨论。",
    branch: "这一层适合讲“回看源头”的力量，展示支流如何折返主河，形成考据与反思。",
  },
  "近现代": {
    lead: "河面抵达近现代，古典资源被重新改写成新的出版、审美与公共文化话语。",
    trunk: "《人间词话》把古典诗学转译为现代审美判断，让整条河在近代重新发光。",
    branch: "可从近现代研究文献、专题资料和公共传播场景继续把支流向现实空间外推。",
  },
};

function deriveBranchAnnotations(
  activeEraIndex: number,
  allowedSlugs: Set<string>,
  selectedSlug: string,
): RiverBranchAnnotation[] {
  const visibleBooks = riverDataset.books.filter((book) => {
    return allowedSlugs.has(book.slug) && eras.indexOf(book.dynasty) <= activeEraIndex;
  });
  const bookById = new Map(visibleBooks.map((book) => [book.id, book]));
  const candidates = riverDataset.citations
    .map((citation) => {
      const sourceBook = bookById.get(citation.source);
      const targetBook = bookById.get(citation.target);

      if (!sourceBook || !targetBook) {
        return null;
      }

      const branchWeight =
        Math.abs((sourceBook.branchLevel ?? 0) - (targetBook.branchLevel ?? 0)) +
        (sourceBook.school === targetBook.school ? 0 : 1) +
        (sourceBook.category === targetBook.category ? 0 : 0.6) +
        citation.confidence;

      return {
        citation,
        sourceBook,
        targetBook,
        branchWeight,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is {
        citation: (typeof riverDataset.citations)[number];
        sourceBook: (typeof riverDataset.books)[number];
        targetBook: (typeof riverDataset.books)[number];
        branchWeight: number;
      } => Boolean(candidate),
    )
    .filter(({ sourceBook, targetBook, branchWeight }) => {
      return (
        branchWeight >= 1.9 &&
        sourceBook.slug !== targetBook.slug &&
        (sourceBook.branchLevel ?? 0) >= 1 &&
        sourceBook.slug !== selectedSlug &&
        targetBook.slug !== selectedSlug
      );
    })
    .sort((left, right) => {
      const sourceEraDelta = eras.indexOf(left.sourceBook.dynasty) - eras.indexOf(right.sourceBook.dynasty);

      if (sourceEraDelta !== 0) {
        return sourceEraDelta;
      }

      return right.branchWeight - left.branchWeight;
    });

  const usedTargets = new Set<string>();

  return candidates
    .filter(({ sourceBook }) => {
      if (usedTargets.has(sourceBook.slug)) {
        return false;
      }

      usedTargets.add(sourceBook.slug);
      return true;
    })
    .slice(0, 6)
    .map(({ citation, sourceBook, targetBook }) => {
      const sourcePoint = sourceBook.coordinates;
      const targetPoint = targetBook.coordinates;
      const midX = (sourcePoint[0] + targetPoint[0]) / 2;
      const midY = Math.max(sourcePoint[1], targetPoint[1]) + 0.22;
      const midZ = (sourcePoint[2] + targetPoint[2]) / 2;
      const offsetZ = sourcePoint[2] >= targetPoint[2] ? 0.28 : -0.28;
      const label = `${sourceBook.shortTitle} · ${citation.label}`;

      return {
        id: `branch-${citation.id}`,
        label,
        description: `${sourceBook.shortTitle} 由 ${targetBook.shortTitle} 这层文脉引出。${citation.evidence}`,
        sourceSlug: targetBook.slug,
        targetSlug: sourceBook.slug,
        accentColor: branchAccentByLayer[citation.layer],
        position: [midX, midY, midZ + offsetZ] as [number, number, number],
      };
    });
}

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
  const [hoveredDockId, setHoveredDockId] = useState<string | null>(null);
  const [selectedDockId, setSelectedDockId] = useState<string | null>(null);
  const [traceFocus, setTraceFocus] = useState<TraceFocusState | null>(null);
  const [sceneFocus, setSceneFocus] = useState<SceneFocusState | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showMobileDossier, setShowMobileDossier] = useState(false);
  const [showDesktopDossier, setShowDesktopDossier] = useState(false);
  const [showDesktopControls, setShowDesktopControls] = useState(false);
  const [activeSourceAtlasId, setActiveSourceAtlasId] = useState<string | null>(null);
  const [entryExplorerTab, setEntryExplorerTab] = useState<
    "spread" | "people" | "versions" | "timeline" | "passages" | null
  >(null);
  const [activeDesktopPanel, setActiveDesktopPanel] = useState<
    "search" | "era" | "category" | "branch"
  >("search");
  const [transitionState, setTransitionState] = useState<
    "idle" | "diving" | "settling" | "returning"
  >("idle");
  const [transitionTargetSlug, setTransitionTargetSlug] = useState<string | null>(null);

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
  const primarySearchFocusSlug = searchHighlightedSlugs[0] ?? null;

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

  const visibleBookSlugs = useMemo(
    () => new Set(filteredBooks.map((book) => book.slug)),
    [filteredBooks],
  );
  const visibleBranchAnnotations = useMemo(
    () => deriveBranchAnnotations(activeEraIndex, visibleBookSlugs, selectedBookSlug),
    [activeEraIndex, visibleBookSlugs, selectedBookSlug],
  );

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

  const handleDiveToBook = (slug: string, options?: ExplorerOpenOptions) => {
    const nextEntryTab =
      options?.entryTab ??
      (sceneFocus?.active
        ? sceneFocus.mode === "source"
          ? "versions"
          : sceneFocus.mode
        : null);

    if (selectedBookSlug === slug && viewMode === "book") {
      setShowDesktopDossier(true);
      setShowDesktopControls(false);
      setEntryExplorerTab(nextEntryTab);
      setSelectedBookSlug(slug);
      return;
    }

    setSceneFocus(null);
    setEntryExplorerTab(nextEntryTab);
    setTransitionTargetSlug(slug);
    setTransitionState("diving");
    window.setTimeout(() => {
      setShowDesktopDossier(true);
      setShowDesktopControls(false);
      setShowMobileControls(false);
      setShowMobileDossier(true);
      setSelectedBookSlug(slug);
      setTransitionState("settling");
    }, 180);
  };

  const handleReturnToRiver = () => {
    setTransitionTargetSlug(selectedBookSlug || null);
    setTransitionState("returning");
    window.setTimeout(() => {
      setTraceFocus(null);
      setSceneFocus(null);
      setEntryExplorerTab(null);
      setShowDesktopDossier(false);
      setShowDesktopControls(false);
      setShowMobileDossier(false);
      setShowMobileControls(false);
      resetSelection();
    }, 120);
  };
  const handleOpenDesktopPanel = (panel: "search" | "era" | "category" | "branch") => {
    setShowMobileControls(false);
    setShowMobileDossier(false);
    setShowDesktopDossier(false);
    setActiveDesktopPanel(panel);
    setShowDesktopControls(true);
  };

  const showDiveOverlay =
    transitionState === "diving" ||
    transitionState === "settling" ||
    transitionState === "returning";
  const sourceAtlasEntries = insights?.sourceAtlas ?? [];
  const atlasMeta = insights?.atlasMeta ?? null;
  const inferSourceAtlasEra = (entry: NonNullable<typeof sourceAtlasEntries>[number]) => {
    const inferredEra =
      entry.sampleRecords
        ?.map((record) => inferEraFromYearText(record.year))
        .find((era): era is (typeof eras)[number] => Boolean(era)) ?? null;

    if (inferredEra) {
      return inferredEra;
    }

    if (
      entry.name.includes("报刊") ||
      entry.name.includes("专题片") ||
      entry.name.includes("图书馆") ||
      entry.name.includes("纪念馆")
    ) {
      return "近现代" as const;
    }

    return null;
  };
  const activeSourceAtlasEntry =
    sourceAtlasEntries.find((entry) => entry.id === activeSourceAtlasId) ??
    sourceAtlasEntries[0] ??
    null;
  const activeSourceAtlasIndex = activeSourceAtlasEntry
    ? sourceAtlasEntries.findIndex((entry) => entry.id === activeSourceAtlasEntry.id)
    : -1;
  const sourceAtlasSuggestedEra = activeSourceAtlasEntry
    ? inferSourceAtlasEra(activeSourceAtlasEntry) ?? activeEra
    : null;
  const sourceAtlasDockMarkers: RiverDockMarker[] = (() => {
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
  })();
  const sourceAtlasPathPoints = sourceAtlasDockMarkers.map(
    (dock) => [dock.position[0], dock.position[1] + 0.06, dock.position[2]] as [number, number, number],
  );
  const sourceAtlasRoutes = (() => {
    if (!sourceAtlasEntries.length) {
      return [];
    }

    const accentPalette = ["#fbbf24", "#fb923c", "#f59e0b", "#fde68a", "#facc15", "#fdba74"];
    const anchorPool =
      filteredBooks.length > 0
        ? filteredBooks
        : riverDataset.books.filter((book) => eras.indexOf(book.dynasty) <= activeEraIndex);
    const fallbackPool = anchorPool.length > 0 ? anchorPool : riverDataset.books;

    return sourceAtlasEntries
      .map((entry, entryIndex) => {
        const samples = entry.sampleRecords?.slice(0, 3) ?? [];

        if (samples.length < 2) {
          return null;
        }

        const routePoints = samples
          .map((_, sampleIndex) => {
            const anchorBook =
              fallbackPool[(entryIndex * 2 + sampleIndex * 3) % Math.max(fallbackPool.length, 1)];

            if (!anchorBook) {
              return null;
            }

            const [baseX, baseY, baseZ] = anchorBook.coordinates;
            const laneBias = entryIndex - (sourceAtlasEntries.length - 1) / 2;
            const sway = sampleIndex % 2 === 0 ? 1 : -1;

            return [
              baseX + laneBias * 0.78 + sampleIndex * 0.18,
              baseY + 0.03 + entryIndex * 0.01,
              baseZ + sway * (0.72 + entryIndex * 0.12),
            ] as [number, number, number];
          })
          .filter((point): point is [number, number, number] => Boolean(point));

        if (routePoints.length < 2) {
          return null;
        }

        return {
          id: entry.id,
          label: entry.name,
          color: accentPalette[entryIndex % accentPalette.length]!,
          points: routePoints,
        };
      })
      .filter((route): route is NonNullable<typeof route> => Boolean(route));
  })();
  const sourceAtlasRouteMap = new Map(sourceAtlasRoutes.map((route) => [route.id, route]));
  const activeSourceRoute = activeSourceAtlasEntry
    ? sourceAtlasRouteMap.get(activeSourceAtlasEntry.id) ?? null
    : null;
  const activeSourceDock =
    sourceAtlasDockMarkers.find((dock) => dock.id === selectedDockId) ??
    sourceAtlasDockMarkers.find((dock) => dock.id === hoveredDockId) ??
    null;
  const activeSourceRecordIndex = (() => {
    if (!activeSourceAtlasEntry?.sampleRecords?.length) {
      return null;
    }

    if (!activeSourceDock?.id?.startsWith(`source-atlas-${activeSourceAtlasEntry.id}-`)) {
      return 0;
    }

    const index = Number(
      activeSourceDock.id.slice(`source-atlas-${activeSourceAtlasEntry.id}-`.length),
    );

    return Number.isNaN(index) ? 0 : index;
  })();
  const activeSourceRecord =
    activeSourceRecordIndex !== null
      ? activeSourceAtlasEntry?.sampleRecords?.[activeSourceRecordIndex] ??
        activeSourceAtlasEntry?.sampleRecords?.[0] ??
        null
      : null;
  const getSourceAtlasDockId = (index: number) =>
    activeSourceAtlasEntry ? `source-atlas-${activeSourceAtlasEntry.id}-${index}` : null;
  const mergedDockMarkers = selectedBook ? riverDockMarkers : sourceAtlasDockMarkers;
  const sourceAtlasHighlightedBookSlugs = (() => {
    if (!activeSourceAtlasEntry || selectedBook) {
      return [];
    }

    const focusCandidates = filteredBooks
      .filter((book) => {
        if (sourceAtlasSuggestedEra && book.dynasty !== sourceAtlasSuggestedEra) {
          return false;
        }

        if (activeSourceAtlasEntry.name.includes("搜韵")) {
          return book.category === "集" || book.school.includes("诗");
        }

        if (activeSourceAtlasEntry.name.includes("报刊")) {
          return book.dynasty === "近现代";
        }

        if (activeSourceAtlasEntry.name.includes("专题片")) {
          return book.dynasty === "近现代" || book.dynasty === "明清";
        }

        if (activeSourceAtlasEntry.name.includes("CBDB")) {
          return book.category === "史" || book.category === "经";
        }

        return true;
      })
      .sort((left, right) => right.influence - left.influence)
      .slice(0, 5)
      .map((book) => book.slug);

    return focusCandidates;
  })();
  const mergedHighlightedBookSlugs = Array.from(
    new Set([...searchHighlightedSlugs, ...sourceAtlasHighlightedBookSlugs]),
  );
  const sourceAtlasMass = sourceAtlasEntries.reduce(
    (sum, entry) => sum + (entry.magnitude ?? entry.sampleRecords?.length ?? 0),
    0,
  );
  const handleSourceAtlasSelect = (entryId: string) => {
    setActiveSourceAtlasId(entryId);
    setSelectedDockId(null);
    setShowDesktopControls(true);
    setShowDesktopDossier(false);
    setShowMobileDossier(false);

    const selectedEntry = sourceAtlasEntries.find((entry) => entry.id === entryId);
    if (!selectedBook && selectedEntry) {
      const inferredEra = inferSourceAtlasEra(selectedEntry);
      if (inferredEra && inferredEra !== activeEra) {
        setActiveEra(inferredEra);
      }

      const focusBook =
        filteredBooks
          .filter((book) => {
            if (inferredEra && book.dynasty !== inferredEra) {
              return false;
            }

            if (selectedEntry.name.includes("搜韵")) {
              return book.category === "集" || book.school.includes("诗");
            }

            if (selectedEntry.name.includes("报刊")) {
              return book.dynasty === "近现代";
            }

            if (selectedEntry.name.includes("专题片")) {
              return book.dynasty === "近现代" || book.dynasty === "明清";
            }

            if (selectedEntry.name.includes("CBDB")) {
              return book.category === "史" || book.category === "经";
            }

            return true;
          })
          .sort((left, right) => right.influence - left.influence)[0] ?? null;

      setSceneFocus(
        focusBook
          ? {
              active: true,
              mode: "source",
              currentTitle: focusBook.title,
              contextLabel: `来源联动：${selectedEntry.name}`,
              detail: `${selectedEntry.name} 的样本资料正在驱动主河道镜头聚焦 ${focusBook.shortTitle} 所在河段。`,
            }
          : null,
      );
    }
  };
  const handleSourceAtlasStep = (direction: -1 | 1) => {
    if (!sourceAtlasEntries.length) {
      return;
    }

    const nextIndex =
      activeSourceAtlasIndex >= 0
        ? (activeSourceAtlasIndex + direction + sourceAtlasEntries.length) % sourceAtlasEntries.length
        : 0;
    const nextEntry = sourceAtlasEntries[nextIndex];

    if (nextEntry) {
      handleSourceAtlasSelect(nextEntry.id);
    }
  };
  const handleSourceRecordFocus = (index: number) => {
    const dockId = getSourceAtlasDockId(index);

    if (!dockId) {
      return;
    }

    setSelectedDockId((current) => (current === dockId ? null : dockId));
    setShowDesktopControls(true);
    setShowDesktopDossier(false);
    setShowMobileDossier(false);
  };
  const focusModeLabel = traceFocus?.active
    ? "逆流溯源"
    : sceneFocus?.active
      ? "场景联动"
      : viewMode === "book"
      ? "入卷细览"
      : "顺河入画";
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
  const resolvedSearchResult =
    searchResult?.query.trim() === searchTerm.trim() ? searchResult : null;
  const searchSuggestionChips =
    resolvedSearchResult?.relatedConcepts.length
      ? resolvedSearchResult.relatedConcepts
      : defaultConceptSuggestions;
  const panelBaseClass =
    "rounded-[28px] border border-[#dfbf74]/34 bg-[linear-gradient(180deg,rgba(151,114,52,0.92),rgba(88,58,19,0.9))] shadow-2xl shadow-black/30 backdrop-blur-xl";
  const desktopPanels: Array<{
    id: "search" | "era" | "category" | "branch";
    label: string;
    summary: string;
  }> = [
    {
      id: "search",
      label: "寻章",
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
      label: "河册",
      summary: activeBranchAnnotation?.label ?? "来源与河上码头",
    },
  ];
  const activeDesktopPanelConfig =
    desktopPanels.find((panel) => panel.id === activeDesktopPanel) ?? desktopPanels[0];
  const activeEraNarrative = eraNarratives[activeEra];
  const activePanelNarrative =
    activeDesktopPanel === "search"
      ? resolvedSearchResult?.query
        ? `“${resolvedSearchResult.query}”已在河面照出相应典籍与支流脉络。`
        : "概念、典籍与支流正在同一条河面上彼此映照。"
      : activeDesktopPanel === "era"
        ? `${activeEra} 河段里，${activeEraNarrative.lead}`
        : activeDesktopPanel === "category"
          ? "门类与学派收束之后，主线脉络会在河面上显得更清晰。"
          : activeSourceAtlasEntry
            ? "这股来源已经映上河面，与主河道共同构成可回查的现实落点。"
            : activeBranchAnnotation
              ? activeBranchAnnotation.description
              : "主河道与来源支流正在同一卷面上交汇展开。";
  const sourceAtlasNeighborEntries =
    activeSourceAtlasIndex >= 0
      ? [-1, 1]
          .map((offset) => sourceAtlasEntries[activeSourceAtlasIndex + offset])
          .filter((entry): entry is NonNullable<typeof sourceAtlasEntries>[number] => Boolean(entry))
      : sourceAtlasEntries.slice(1, 3);
  const eraRecommendedBooks = useMemo(() => {
    return filteredBooks
      .filter((book) => book.dynasty === activeEra)
      .sort((left, right) => {
        if (left.branchLevel !== right.branchLevel) {
          return left.branchLevel - right.branchLevel;
        }

        return right.influence - left.influence;
      })
      .slice(0, 4);
  }, [activeEra, filteredBooks]);
  const eraProgressPercent =
    eras.length > 1 ? Math.round((activeEraIndex / (eras.length - 1)) * 100) : 0;
  const transitionTargetBook = transitionTargetSlug
    ? riverDataset.books.find((book) => book.slug === transitionTargetSlug) ?? null
    : null;
  const transitionLabel =
    transitionState === "diving"
      ? transitionTargetBook
        ? `文卷正向《${transitionTargetBook.shortTitle}》展开`
        : "文卷正徐徐展开"
      : transitionState === "settling"
        ? transitionTargetBook
          ? `《${transitionTargetBook.shortTitle}》已停驻卷心`
          : "文卷已经停驻卷心"
        : transitionState === "returning"
          ? "文卷正缓缓收回主河道"
          : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2d1a07] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(249,224,150,0.34),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(222,183,87,0.2),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(207,158,60,0.18),transparent_36%),linear-gradient(180deg,#d1ae61_0%,#8c6327_24%,#4a2f10_56%,#201103_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,241,198,0.34),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(231,192,93,0.22),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(170,113,31,0.16),transparent_36%),linear-gradient(180deg,#ecd599_0%,#c79548_26%,#885722_58%,#45280d_100%)]" />
      <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(rgba(110,72,22,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(110,72,22,0.08)_1px,transparent_1px)] [background-size:112px_112px]" />

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
          {transitionLabel ? (
            <div className="absolute left-1/2 top-16 w-[min(32rem,calc(100vw-2.5rem))] -translate-x-1/2">
              <div className="rounded-[26px] border border-[#ecd18a]/20 bg-[linear-gradient(180deg,rgba(135,96,31,0.72),rgba(74,47,15,0.72))] px-5 py-4 text-center shadow-2xl shadow-black/20 backdrop-blur-md">
                <div className="text-[10px] tracking-[0.32em] text-[#f2dfab]/80">
                  {transitionState === "returning" ? "归河过渡" : "入卷过渡"}
                </div>
                <div className="mt-2 text-sm leading-7 text-[#fbf1d2]">{transitionLabel}</div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 min-h-screen">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 hidden items-start justify-between gap-3 px-4 py-4 md:flex sm:px-6 lg:px-8">
          <div className={`pointer-events-auto max-w-[228px] px-4 py-3 sm:max-w-[248px] ${panelBaseClass}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.32em] text-[#f2dfab]/80">
                  黄河文脉长卷
                </div>
                <h1 className="mt-1 text-[clamp(1.25rem,2vw,1.65rem)] font-semibold text-[#fff4d6]">
                  文脉溯源
                </h1>
              </div>
              <div className="rounded-full border border-[#ead8a6]/24 bg-[rgba(255,248,220,0.08)] px-3 py-1 text-[11px] text-[#eadfbc]">
                {viewMode === "river" ? "巡河" : "入卷"}
              </div>
            </div>
            <div className="mt-3 text-[11px] leading-6 text-[#eadfbc]">
              河心承载典籍主脉，支流映出传播、人物、版本与文本回响。
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowMobileControls(false);
                setShowMobileDossier(false);
                setShowDesktopControls((current) => !current);
              }}
              className="hidden rounded-full border border-[#e7c97b]/24 bg-[linear-gradient(180deg,rgba(164,123,52,0.92),rgba(96,64,24,0.88))] px-4 py-2 text-xs text-[#fff0cf] backdrop-blur-xl md:inline-flex"
            >
              {showDesktopControls ? "收河图" : "河图"}
            </button>
            {selectedBook ? (
              <button
                type="button"
                onClick={() => {
                  setShowDesktopControls(false);
                  setShowDesktopDossier((current) => !current);
                }}
                className="hidden rounded-full border border-amber-200/24 bg-[linear-gradient(180deg,rgba(164,123,52,0.92),rgba(96,64,24,0.88))] px-4 py-2 text-xs text-amber-50 backdrop-blur-xl md:inline-flex"
              >
                {showDesktopDossier ? "收文卷" : "文卷"}
              </button>
            ) : null}
          </div>
        </div>

        {showDesktopControls ? (
          <div className="absolute right-4 top-[132px] z-20 hidden w-[228px] sm:right-6 md:block lg:right-8 lg:w-[248px]">
            <aside className="pointer-events-auto xl:pt-2">
              <div className={`p-4 ${panelBaseClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] tracking-[0.28em] text-[#d8c9a3]">河图</div>
                  <div className="mt-1 text-base font-medium text-[#fbf3da]">河上卷签</div>
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

              <div className="mt-4 grid grid-cols-2 gap-2">
                {desktopPanels.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActiveDesktopPanel(panel.id)}
                    className={`rounded-[14px] px-3 py-2 text-[11px] transition ${
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
                  <div className="rounded-full border border-[#ead8a6]/18 px-2 py-1 text-[10px] text-[#f2dfab]">卷面</div>
                </div>
                <div className="mt-3 rounded-2xl border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-3 py-3 text-[12px] leading-6 text-[#e8d8af]">
                  {activePanelNarrative}
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
                      <div className="mt-3 rounded-2xl border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setActiveDesktopPanel("branch")}
                          className="text-left text-sm text-[#eadfbc] transition hover:text-[#fbf3da]"
                        >
                          这个词暂未照见河上节点，换一枚相关概念再看河面回响。
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {searchSuggestionChips.slice(0, 3).map((concept) => (
                            <button
                              key={`fallback-concept-${concept}`}
                              type="button"
                              onClick={() => handleSearchTermChange(concept)}
                              className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-xs text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                            >
                              {concept}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {activeDesktopPanel === "era" ? (
                  <div className="mt-4">
                    <div className="rounded-[18px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                      <div className="text-[11px] tracking-[0.22em] text-[#d8c9a3]">时代河段</div>
                      <div className="mt-2 text-[12px] leading-6 text-[#f6e8c4]">
                        {activeEraNarrative.lead}
                      </div>
                      <div className="mt-3 rounded-[14px] border border-[#ead8a6]/10 bg-[rgba(42,26,9,0.28)] px-3 py-2.5">
                        <div className="text-[10px] tracking-[0.2em] text-[#d8c9a3]">主干</div>
                        <div className="mt-1 text-[11px] leading-5 text-[#eadfbc]">
                          {activeEraNarrative.trunk}
                        </div>
                      </div>
                      <div className="mt-2 rounded-[14px] border border-[#ead8a6]/10 bg-[rgba(42,26,9,0.28)] px-3 py-2.5">
                        <div className="text-[10px] tracking-[0.2em] text-[#d8c9a3]">支流</div>
                        <div className="mt-1 text-[11px] leading-5 text-[#eadfbc]">
                          {activeEraNarrative.branch}
                        </div>
                      </div>
                      {eraRecommendedBooks.length ? (
                        <div className="mt-2 rounded-[14px] border border-[#ead8a6]/10 bg-[rgba(42,26,9,0.28)] px-3 py-2.5">
                          <div className="text-[10px] tracking-[0.2em] text-[#d8c9a3]">河段节点</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {eraRecommendedBooks.map((book) => (
                              <button
                                key={`era-recommend-${book.slug}`}
                                type="button"
                                onClick={() => handleDiveToBook(book.slug)}
                                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-xs text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.12)] hover:text-[#fbf3da]"
                              >
                                {book.shortTitle}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
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
                      <button
                        type="button"
                        onClick={() => setActiveDesktopPanel("branch")}
                        className="text-left transition hover:text-[#fbf3da]"
                      >
                        {activeEra} 河段中，{categoryFilter} 与 {schoolFilter} 的典籍主线已经在河面收束成形。
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeDesktopPanel === "branch" ? (
                  <div className="mt-4">
                    <div className="rounded-[18px] border border-[#ead8a6]/14 bg-[rgba(27,17,7,0.22)] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">关系层级</div>
                        <div className="text-[11px] text-[#c9b68a]">河上脉络</div>
                      </div>
                      <div className="mt-3 grid gap-2 text-[11px] text-[#eadfbc]">
                        {(Object.keys(relationLayerMeta) as Array<keyof typeof relationLayerMeta>).map((layer) => (
                          <div
                            key={`desktop-layer-legend-${layer}`}
                            className={`rounded-[14px] border px-3 py-2 ${relationLayerMeta[layer].tone}`}
                          >
                            <div className="font-medium">{relationLayerMeta[layer].label}</div>
                            <div className="mt-1 text-[10px] leading-5 opacity-80">
                              {layer === "metadata"
                                ? "用于展示书目、版本与主线挂接关系。"
                                : layer === "explicit"
                                  ? "原文、注疏或目录中能够直接找到援引证据。"
                                  : layer === "semantic"
                                    ? "主题、义理或术语高度接近，构成中程支流。"
                                    : "通过人物、时代与学术路径形成的间接回响。"}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {relationSummary.map(({ layer, count }) => (
                          <button
                            key={layer}
                            type="button"
                            onClick={() => {
                              const target = visibleBranchAnnotations.find(
                                (branch) => branch.id === `branch-${layer}`,
                              );

                              if (target?.targetSlug) {
                                handleDiveToBook(target.targetSlug);
                              }
                            }}
                            className={`rounded-full border px-3 py-1.5 text-[11px] ${relationLayerMeta[layer].tone}`}
                          >
                            {relationLayerMeta[layer].label} {count}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 rounded-[18px] border border-[#ead8a6]/14 bg-[rgba(93,62,18,0.22)] px-3 py-3">
                      {activeBranchAnnotation ? (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-medium text-[#fbf3da]">
                              {activeBranchAnnotation.label}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDiveToBook(activeBranchAnnotation.targetSlug)}
                              className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-[11px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                            >
                              入卷
                            </button>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[#f4e8c4]">
                            {activeBranchAnnotation.description}
                          </p>
                        </>
                      ) : (
                        <div className="text-sm text-[#d8c9a3]">
                          河面节点已经浮起，文脉走向正在水势之间显现。
                        </div>
                      )}
                    </div>
                    {sourceAtlasEntries.length ? (
                    <div className="mt-3 rounded-[18px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(105,72,24,0.3),rgba(39,25,8,0.22))] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">来源河册</div>
                        <div className="text-[10px] text-[#f2dfab]">{sourceAtlasMass.toLocaleString()}</div>
                        </div>
                        {atlasMeta ? (
                          <button
                            type="button"
                            onClick={() => setActiveDesktopPanel("branch")}
                            className="mt-3 w-full rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-3 py-3 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs font-medium text-[#fbf3da]">
                                河上已映出 {atlasMeta.demoBookCount} 部主线典籍
                              </div>
                              <div className="text-[10px] text-[#f2dfab]">
                                已连入 {atlasMeta.activeSources} 股真实来源
                              </div>
                            </div>
                            <div className="mt-2 text-[11px] leading-5 text-[#e6d7ae]">
                              {atlasMeta.expansionNote}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {atlasMeta.plannedLayers.slice(0, 4).map((layer) => (
                                <span
                                  key={`atlas-layer-${layer}`}
                                  className="rounded-full border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.04)] px-2.5 py-1 text-[10px] text-[#dccb9c]"
                                >
                                  {layer}
                                </span>
                              ))}
                            </div>
                          </button>
                        ) : null}
                        <div className="mt-3 rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(35,22,7,0.26)] px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[11px] tracking-[0.2em] text-[#d8c9a3]">来源支流</div>
                            <div className="text-[10px] text-[#c9b68a]">
                              {activeSourceAtlasIndex >= 0
                                ? `${activeSourceAtlasIndex + 1}/${sourceAtlasEntries.length}`
                                : `${Math.min(sourceAtlasEntries.length, 1)}/${sourceAtlasEntries.length}`}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSourceAtlasStep(-1)}
                              className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-[10px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                            >
                              前一股
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSourceAtlasStep(1)}
                              className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-[10px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                            >
                              后一股
                            </button>
                          </div>
                          {activeSourceAtlasEntry ? (
                            <button
                              type="button"
                              onClick={() => handleSourceAtlasSelect(activeSourceAtlasEntry.id)}
                              className="mt-3 w-full rounded-[14px] border border-amber-300/28 bg-[rgba(120,81,26,0.4)] px-3 py-3 text-left transition hover:bg-[rgba(131,90,29,0.46)]"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: activeSourceRoute?.color ?? "#d6a33d" }}
                                />
                                <span className="truncate text-[11px] text-[#fbf3da]">
                                  {activeSourceAtlasEntry.name}
                                </span>
                              </div>
                              <div className="mt-2 text-[10px] text-[#f2dfab]">
                                {activeSourceAtlasEntry.stat ?? "来源样本"}
                              </div>
                              <div className="mt-2 line-clamp-3 text-[10px] leading-5 text-[#e6d7ae]">
                                {activeSourceAtlasEntry.summary ?? "这股来源正在河面留下对应样本与落点。"}
                              </div>
                              {activeSourceAtlasEntry.evidenceLabel ? (
                                <div className="mt-2 rounded-[12px] border border-[#ead8a6]/10 bg-[rgba(35,22,7,0.18)] px-2.5 py-2">
                                  <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">原始凭据</div>
                                  <div className="mt-1 text-[10px] text-[#fbf3da]">
                                    {activeSourceAtlasEntry.evidenceLabel}
                                  </div>
                                  {activeSourceAtlasEntry.evidenceNote ? (
                                    <div className="mt-1 line-clamp-3 text-[10px] leading-5 text-[#dccb9c]">
                                      {activeSourceAtlasEntry.evidenceNote}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </button>
                          ) : null}
                          <div className="mt-3 space-y-2">
                            {sourceAtlasNeighborEntries.map((entry) => {
                              const route = sourceAtlasRouteMap.get(entry.id);

                              return (
                                <button
                                  key={`desktop-source-route-${entry.id}`}
                                  type="button"
                                  onClick={() => handleSourceAtlasSelect(entry.id)}
                                  className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#ead8a6]/10 bg-[rgba(255,248,220,0.03)] px-3 py-2.5 text-left transition hover:bg-[rgba(255,248,220,0.07)]"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                                        style={{ backgroundColor: route?.color ?? "#d6a33d" }}
                                      />
                                      <span className="truncate text-[11px] text-[#eadfbc]">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <div className="mt-1 truncate text-[10px] text-[#cdb98d]">
                                      {entry.stat ?? "来源样本"}
                                    </div>
                                  </div>
                                  <div className="shrink-0 text-[10px] text-[#d8c9a3]">待映照</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {activeSourceAtlasEntry ? (
                          <div className="mt-3 rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-xs font-medium text-[#fbf3da]">
                                  {activeSourceAtlasEntry.name}
                                </div>
                                <div className="mt-1 text-[11px] leading-5 text-[#e6d7ae]">
                                  {activeSourceAtlasEntry.summary ?? "来源样本"}
                                </div>
                              </div>
                              <div className="shrink-0 text-[10px] text-[#f2dfab]">
                                {activeSourceAtlasEntry.stat}
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleSourceAtlasSelect(activeSourceAtlasEntry.id)}
                                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-[10px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                              >
                                映到河面
                              </button>
                              {activeSourceAtlasEntry.sampleRecords?.slice(0, 4).map((record, index) => {
                                const dockId = getSourceAtlasDockId(index);
                                const isDockActive = dockId !== null && activeSourceDock?.id === dockId;

                                return (
                                  <button
                                    key={`desktop-source-record-${activeSourceAtlasEntry.id}-${record.title}`}
                                    type="button"
                                    onClick={() => handleSourceRecordFocus(index)}
                                    className={`rounded-full px-3 py-1.5 text-[10px] transition ${
                                      isDockActive
                                        ? "bg-[#f3dfab] text-[#42290a]"
                                        : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                                    }`}
                                  >
                                    {record.title}
                                  </button>
                                );
                              })}
                            </div>
                            {activeSourceAtlasEntry.evidenceLabel ? (
                              <div className="mt-3 rounded-[14px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.22)] px-3 py-2.5">
                                <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">原始凭据</div>
                                <div className="mt-1 text-[11px] text-[#fbf3da]">
                                  {activeSourceAtlasEntry.evidenceLabel}
                                </div>
                                {activeSourceAtlasEntry.evidenceNote ? (
                                  <div className="mt-1 text-[10px] leading-5 text-[#dccb9c]">
                                    {activeSourceAtlasEntry.evidenceNote}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                            {activeSourceRoute ? (
                              <div className="mt-3 rounded-[14px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.26)] px-3 py-2.5 text-[11px] text-[#dccb9c]">
                                这股来源支流沿
                                <span className="px-1 text-[#fbf3da]">
                                  {activeSourceRoute.points.length}
                                </span>
                                个样本码头铺开，河段与来源已彼此扣合。
                              </div>
                            ) : null}
                            {activeSourceRecord ? (
                              <div className="mt-3 rounded-[14px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.34)] px-3 py-2.5">
                                <div className="text-[11px] font-medium leading-5 text-[#fbf3da]">
                                  {activeSourceRecord.title}
                                </div>
                                <div className="mt-1 text-[10px] text-[#f2dfab]">
                                  {[activeSourceRecord.category, activeSourceRecord.year]
                                    .filter(Boolean)
                                    .join(" · ") || "样本条目"}
                                </div>
                                {activeSourceRecord.note ? (
                                  <div className="mt-1 text-[11px] leading-5 text-[#dccb9c] line-clamp-4">
                                    {activeSourceRecord.note}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                            {activeSourceDock ? (
                              <div className="mt-2 rounded-[14px] border border-amber-300/18 bg-[rgba(89,60,19,0.34)] px-3 py-2.5">
                                <div className="text-[11px] font-medium leading-5 text-[#fbf3da]">
                                  {activeSourceDock.label}
                                </div>
                                {activeSourceDock.note ? (
                                  <div className="mt-1 text-[11px] leading-5 text-[#dccb9c] line-clamp-4">
                                    {activeSourceDock.note}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            </div>
          </aside>
        </div>
        ) : null}

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
                          入卷典籍
                        </div>
                        <div className="text-sm text-[#d8c9a3]">{selectedBook.dynasty}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleReturnToRiver}
                        className="rounded-full border border-amber-300/22 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100"
                      >
                        归河
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDesktopDossier(false)}
                        className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-xs text-[#eadfbc]"
                      >
                        收卷
                      </button>
                    </div>
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

                    <div className="mt-4 rounded-[22px] border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-4 py-3 text-sm leading-7 text-[#eadfbc]">
                      {selectedBook.dynasty} 的这部典籍正以 {focusModeLabel} 停驻卷心，
                      {traceFocus?.active
                        ? ` 溯源光线已推进 ${traceFocus.progress}/${traceFocus.total} 层。`
                        : sceneFocus?.active
                          ? ` ${sceneFocus.contextLabel} 已与主河镜头相接。`
                          : " 主河镜头正在等待下一次联动显影。"}
                    </div>
                  </div>

                  <div className="mt-3 rounded-[28px] border border-[#ead8a6]/16 bg-[linear-gradient(180deg,rgba(244,230,188,0.96),rgba(224,200,146,0.92))] px-4 py-4 text-[#42290a] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#b89247]/20 pb-3">
                      <div>
                        <div className="text-[11px] tracking-[0.24em] text-[#8d6a2c]">
                          卷内脉络
                        </div>
                        <div className="mt-1 text-sm font-medium text-[#5b3a11]">
                          沿卷细看传播、人物、版本与溯源回声
                        </div>
                      </div>
                    </div>
                    <div className="max-h-[calc(100vh-368px)] overflow-auto pr-1">
                      <BookExplorer
                        key={`desktop-explorer-${selectedBook.slug}-${entryExplorerTab ?? "spread"}`}
                        book={selectedBook}
                        detail={selectedDetail}
                        forcedTab={entryExplorerTab}
                        activeEra={activeEra}
                        onRequestEraChange={setActiveEra}
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
            hoveredDockId={hoveredDockId}
            onHoverDock={setHoveredDockId}
            selectedDockId={selectedDockId}
            onSelectDock={setSelectedDockId}
            traceFocus={traceFocus}
            sceneFocus={sceneFocus}
            dockMarkers={mergedDockMarkers}
            sourceAtlasLabel={!selectedBook ? activeSourceAtlasEntry?.name ?? null : null}
            sourceAtlasSummary={!selectedBook ? activeSourceAtlasEntry?.summary ?? null : null}
            sourceAtlasPathPoints={!selectedBook ? sourceAtlasPathPoints : []}
            sourceAtlasRoutes={!selectedBook ? sourceAtlasRoutes : []}
            visibleNodeCount={filteredBooks.length}
            totalNodeCount={riverDataset.books.length}
            highlightedBookSlugs={mergedHighlightedBookSlugs}
            searchFocusSlug={!selectedBook ? primarySearchFocusSlug : null}
            onOpenControlPanel={() => handleOpenDesktopPanel("branch")}
            onOpenEraPanel={() => handleOpenDesktopPanel("era")}
            onReturnToRiver={selectedBook ? handleReturnToRiver : null}
            mobilePanelOpen={showMobileControls || showMobileDossier}
          />
        </main>

        {showMobileControls ? (
          <div className="absolute inset-x-3 bottom-[4.75rem] z-40 md:hidden">
            <div className={`pointer-events-auto max-h-[36vh] overflow-auto p-3 ${panelBaseClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] tracking-[0.28em] text-[#d8c9a3]">河图</div>
                  <div className="mt-1 text-sm font-medium text-[#fbf3da]">{activeDesktopPanelConfig.label}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileControls(false)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200"
                >
                  收卷
                </button>
              </div>
              <div className="mt-3 rounded-[18px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-3 text-[12px] leading-6 text-[#eadfbc]">
                {activeDesktopPanel === "search"
                  ? `河面当前显出 ${filteredBooks.length} 部典籍，概念检索会把镜头直接带往对应河段。`
                  : activeDesktopPanel === "era"
                    ? `${activeEra} 水位已推至 ${eraProgressPercent}% ，这一段文脉河势正在卷面铺开。`
                    : activeDesktopPanel === "category"
                      ? `${categoryFilter} 与 ${schoolFilter} 的筛选结果正在收束河道轮廓。`
                      : "来源支流、关系层级与河上码头正沿同一卷面彼此映照。"}
              </div>
              {activeDesktopPanel === "era" ? (
                <div className="mt-3 rounded-[20px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                  <div className="text-[11px] tracking-[0.22em] text-[#d8c9a3]">时代河段</div>
                  <div className="mt-2 text-[12px] leading-6 text-[#f6e8c4]">
                    {activeEraNarrative.lead}
                  </div>
                  <div className="mt-3 text-[11px] leading-5 text-[#eadfbc]">
                    {activeEraNarrative.trunk}
                  </div>
                  {eraRecommendedBooks.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {eraRecommendedBooks.map((book) => (
                        <button
                          key={`mobile-era-recommend-${book.slug}`}
                          type="button"
                          onClick={() => {
                            setShowMobileControls(false);
                            handleDiveToBook(book.slug);
                          }}
                          className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-xs text-[#eadfbc]"
                        >
                          {book.shortTitle}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {activeDesktopPanel === "branch" && sourceAtlasEntries.length ? (
                <div className="mt-3 rounded-[22px] border border-[#ead8a6]/14 bg-[rgba(93,62,18,0.22)] px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">来源河册</div>
                    <div className="text-[11px] text-[#f2dfab]">{sourceAtlasMass.toLocaleString()}</div>
                  </div>
                  {atlasMeta ? (
                    <button
                      type="button"
                      onClick={() => setActiveDesktopPanel("branch")}
                      className="mt-3 w-full rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-3 py-3 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                    >
                      <div className="text-xs font-medium text-[#fbf3da]">
                        河上已映出 {atlasMeta.demoBookCount} 部主线典籍，已连入 {atlasMeta.activeSources} 股真实来源
                      </div>
                      <div className="mt-2 text-[11px] leading-5 text-[#e6d7ae]">
                        {atlasMeta.expansionNote}
                      </div>
                    </button>
                  ) : null}
                  <div className="mt-2 rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(38,25,8,0.24)] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] tracking-[0.2em] text-[#d8c9a3]">来源支流</div>
                      <div className="text-[10px] text-[#c9b68a]">来源与样本</div>
                    </div>
                    <div className="mt-2 max-h-32 space-y-2 overflow-auto pr-1">
                      {sourceAtlasEntries.map((entry) => {
                        const route = sourceAtlasRouteMap.get(entry.id);
                        const isActive = activeSourceAtlasEntry?.id === entry.id;

                        return (
                          <button
                            key={`mobile-atlas-route-${entry.id}`}
                            type="button"
                            onClick={() => handleSourceAtlasSelect(entry.id)}
                            className={`flex w-full items-center justify-between gap-3 rounded-[14px] border px-3 py-2 text-left transition ${
                              isActive
                                ? "border-amber-300/28 bg-[rgba(120,81,26,0.4)]"
                                : "border-[#ead8a6]/10 bg-[rgba(255,248,220,0.03)]"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: route?.color ?? "#d6a33d" }}
                                />
                                <span className="truncate text-[11px] text-[#fbf3da]">{entry.name}</span>
                              </div>
                              <div className="mt-1 truncate text-[10px] text-[#d8c9a3]">
                                {entry.stat ?? "来源样本"}
                              </div>
                            </div>
                            <div className="shrink-0 text-[10px] text-[#f2dfab]">
                              {isActive ? "正在映照" : route ? "已连河道" : "待映照"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {activeSourceAtlasEntry ? (
                    <div className="mt-3 rounded-[18px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-xs text-[#fbf3da]">{activeSourceAtlasEntry.name}</div>
                          {activeSourceRoute ? (
                            <div className="mt-1 text-[10px] text-[#c9b68a]">
                              这股来源支流正沿 {activeSourceRoute.points.length} 个样本码头铺开
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-[10px] text-[#f2dfab]">{activeSourceAtlasEntry.stat}</div>
                      </div>
                      <div className="mt-1 text-[11px] leading-5 text-[#e6d7ae]">
                        {activeSourceAtlasEntry.summary ?? "来源样本"}
                      </div>
                      {activeSourceAtlasEntry.evidenceLabel ? (
                        <div className="mt-2 rounded-[14px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.22)] px-3 py-2.5">
                          <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">原始凭据</div>
                          <div className="mt-1 text-[11px] text-[#fbf3da]">
                            {activeSourceAtlasEntry.evidenceLabel}
                          </div>
                          {activeSourceAtlasEntry.evidenceNote ? (
                            <div className="mt-1 text-[10px] leading-5 text-[#dccb9c] line-clamp-3">
                              {activeSourceAtlasEntry.evidenceNote}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleSourceAtlasSelect(activeSourceAtlasEntry.id)}
                          className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-[10px] text-[#eadfbc]"
                        >
                          映到河面
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowMobileControls(false);
                            setSelectedDockId(null);
                          }}
                          className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.04)] px-3 py-1.5 text-[10px] text-[#d8c9a3]"
                        >
                          归河
                        </button>
                      </div>
                      {activeSourceAtlasEntry.sampleRecords?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {activeSourceAtlasEntry.sampleRecords.slice(0, 3).map((record, index) => {
                            const dockId = getSourceAtlasDockId(index);
                            const isDockActive = dockId !== null && activeSourceDock?.id === dockId;

                            return (
                              <button
                                key={`mobile-source-record-${activeSourceAtlasEntry.id}-${record.title}`}
                                type="button"
                                onClick={() => handleSourceRecordFocus(index)}
                                className={`rounded-full px-3 py-1.5 text-[10px] transition ${
                                  isDockActive
                                    ? "bg-[#f3dfab] text-[#42290a]"
                                    : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                                }`}
                              >
                                {record.title}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                      {activeSourceRecord ? (
                        <div className="mt-2 rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.34)] px-3 py-2.5">
                          <div className="mb-1 text-[10px] tracking-[0.18em] text-[#c9b68a]">样本切片</div>
                          <div className="text-[11px] font-medium leading-5 text-[#fbf3da]">
                            {activeSourceRecord.title}
                          </div>
                          <div className="mt-1 text-[10px] text-[#f2dfab]">
                            {[
                              activeSourceRecord.category,
                              activeSourceRecord.year,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "来源条目"}
                          </div>
                          {activeSourceRecord.note ? (
                            <div className="mt-1 text-[11px] leading-5 text-[#dccb9c] line-clamp-3">
                              {activeSourceRecord.note}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {activeSourceDock ? (
                        <div className="mt-2 rounded-[16px] border border-amber-300/18 bg-[rgba(89,60,19,0.34)] px-3 py-2.5">
                          <div className="mb-1 text-[10px] tracking-[0.18em] text-[#e7d5a8]">河上码头</div>
                          <div className="text-[11px] font-medium leading-5 text-[#fbf3da]">{activeSourceDock.label}</div>
                          {activeSourceDock.note ? (
                            <div className="mt-1 text-[11px] leading-5 text-[#dccb9c] line-clamp-3">{activeSourceDock.note}</div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
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
                  <label className="mt-3 block">
                    <span className="text-xs tracking-[0.22em] text-[#d8c9a3]">概念检索</span>
                    <input
                      value={searchTerm}
                      onChange={(event) => handleSearchTermChange(event.target.value)}
                      placeholder="例如 仁、礼、诗教、朱熹"
                      className="mt-2 w-full rounded-2xl border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-4 py-3 text-sm text-[#fbf3da] outline-none placeholder:text-[#c9b68a] focus:border-[#f0cf75]/40"
                    />
                  </label>
                  <div className="mt-3 rounded-[22px] border border-[#ead8a6]/18 bg-[rgba(27,17,7,0.24)] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">相关概念</div>
                      <div className="text-[11px] text-[#c9b68a]">
                        {searchPending
                          ? "检索中"
                          : resolvedSearchResult?.query
                            ? `命中 ${resolvedSearchResult.total} 本`
                            : "常见概念"}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {searchSuggestionChips.slice(0, 6).map((concept) => (
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
                <div className="mt-3 rounded-[22px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-3">
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
                  <div className="mt-3 flex flex-wrap gap-2">
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
                  <div className="mt-3 rounded-[22px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-3">
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
                  <div className="mt-3 rounded-[22px] border border-[#ead8a6]/14 bg-[rgba(27,17,7,0.18)] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">关系层级</div>
                      <div className="text-[11px] text-[#c9b68a]">点层级切河道</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {relationSummary.map(({ layer, count }) => (
                        <button
                          key={`mobile-layer-${layer}`}
                          type="button"
                          onClick={() => {
                            const target = visibleBranchAnnotations.find(
                              (branch) => branch.id === `branch-${layer}`,
                            );

                            if (target?.targetSlug) {
                              handleDiveToBook(target.targetSlug);
                            }
                          }}
                          className={`rounded-full border px-3 py-1.5 text-[11px] ${relationLayerMeta[layer].tone}`}
                        >
                          {relationLayerMeta[layer].label} {count}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 rounded-[22px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-3 text-sm text-[#eadfbc]">
                    {activeBranchAnnotation ? activeBranchAnnotation.description : "河上节点已经浮起，可择一典籍顺势入卷细看。"}
                  </div>
                </>
              ) : null}
              <div className="mt-3 rounded-2xl border border-[#ead8a6]/16 bg-[rgba(27,17,7,0.18)] px-3 py-3 text-sm leading-6 text-[#eadfbc]">
                {activeDesktopPanel === "search"
                  ? `${categoryFilter} 与 ${schoolFilter} 的主线节点正在河面并行显现。`
                  : activeDesktopPanel === "era"
                    ? `${activeEra} 的时代水位已经把这一段文脉河势完整托起。`
                    : activeDesktopPanel === "category"
                      ? `${categoryFilter} 与 ${schoolFilter} 的筛选结果已经让河道轮廓更集中。`
                      : "关系层级、来源支流与河上码头正在同一卷面上彼此照应。"}
              </div>
            </div>
          </div>
        ) : null}

        {showMobileDossier && selectedBook && selectedDetail ? (
          <div className="absolute inset-x-3 bottom-[4.75rem] z-40 md:hidden">
            <div className={`pointer-events-auto overflow-hidden p-3 transition-all duration-500 ease-out ${panelBaseClass} ${dossierMotionClass}`}>
              <div className="rounded-[26px] border border-[#ead8a6]/18 bg-[linear-gradient(180deg,rgba(245,231,188,0.16),rgba(104,72,25,0.14))] p-3">
                <div className="rounded-[24px] border border-[#ead8a6]/16 bg-[linear-gradient(180deg,rgba(247,237,206,0.98),rgba(230,204,140,0.94))] px-4 py-4 text-[#42290a]">
                  <div className="rounded-[20px] border border-[#b89247]/16 bg-[rgba(255,255,255,0.18)] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] tracking-[0.22em] text-[#8d6a2c]">卷首题签</div>
                        <div className="mt-2 text-lg font-semibold leading-tight text-[#5b3a11]">{selectedBook.title}</div>
                        <div className="mt-2 text-xs text-[#6f4b18]">
                          {selectedBook.category} · {selectedBook.school}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="rounded-full border border-[#b89247]/18 bg-[rgba(255,255,255,0.22)] px-3 py-1 text-[10px] text-[#7a571d]">
                          {focusModeLabel}
                        </div>
                        <button
                          type="button"
                          onClick={handleReturnToRiver}
                          className="rounded-full border border-amber-300/22 bg-amber-300/10 px-3 py-1.5 text-[10px] text-amber-100"
                        >
                          归河
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 mt-3 rounded-[18px] border border-[#b89247]/14 bg-[rgba(255,255,255,0.2)] px-4 py-3 text-[12px] leading-6 text-[#5b3a11]">
                    {selectedBook.dynasty} 的这部典籍此刻正以 {focusModeLabel} 停驻卷心，卷内已牵出 {selectedBookCitations.length} 条关联
                    {selectedSources.length ? ` 与 ${selectedSources.length} 类来源回声。` : "。"}
                  </div>
                  <div className="max-h-[calc(40vh-112px)] overflow-auto pr-1">
                    <BookExplorer
                      key={`mobile-explorer-${selectedBook.slug}-${entryExplorerTab ?? "spread"}`}
                      book={selectedBook}
                      detail={selectedDetail}
                      forcedTab={entryExplorerTab}
                      activeEra={activeEra}
                      onRequestEraChange={setActiveEra}
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
        <div className="pointer-events-none absolute bottom-4 right-3 z-30 md:hidden">
          <div className="pointer-events-auto">
            <div className="flex items-center gap-2 rounded-full border border-[#e7c97b]/26 bg-[linear-gradient(180deg,rgba(143,104,40,0.92),rgba(92,61,20,0.92))] px-2 py-2 shadow-xl shadow-black/20 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => {
                setShowMobileDossier(false);
                setShowMobileControls((current) => !current);
              }}
              className={`rounded-full px-3 py-1.5 text-[10px] tracking-[0.2em] transition ${
                showMobileControls
                  ? "bg-[#f3dfab] text-[#42290a]"
                  : "border border-[#e7c97b]/20 bg-[rgba(255,240,199,0.08)] text-[#fff0c7]"
              }`}
            >
              河图
            </button>
            {selectedBook ? (
              <button
                type="button"
                onClick={() => {
                  setShowMobileControls(false);
                  setShowMobileDossier((current) => !current);
                }}
                className={`rounded-full px-3 py-1.5 text-[10px] transition ${
                  showMobileDossier
                    ? "bg-[#f3dfab] text-[#42290a]"
                    : "border border-[#ead8a6]/20 bg-[rgba(255,240,199,0.08)] text-[#f8ebc6]"
                }`}
              >
                文卷
              </button>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
