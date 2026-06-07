"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

interface SourceAtlasEntryDetailPayload {
  entry: NonNullable<DatasetInsight["sourceAtlas"]>[number];
  relatedBooks: Array<{
    id: string;
    slug: string;
    title: string;
    dynasty: string;
    category: string;
  }>;
}

interface DerivedBranchAnnotation extends RiverBranchAnnotation {
  layer: keyof typeof relationLayerMeta;
  weight: number;
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
  influence: "#c0893d",
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

function getSourceThemeLabel(name: string) {
  if (name.includes("红色") || name.includes("南湖")) {
    return "红色支流";
  }

  if (name.includes("搜韵")) {
    return "诗学支流";
  }

  if (name.includes("纪传")) {
    return "人物支流";
  }

  if (name.includes("借阅")) {
    return "公共流通";
  }

  if (name.includes("活动")) {
    return "城市现场";
  }

  if (name.includes("专题片")) {
    return "城市影像";
  }

  if (name.includes("Artlib") || name.includes("艺术")) {
    return "艺术图像";
  }

  if (name.includes("报刊")) {
    return "近现代文献";
  }

  if (name.includes("图书馆") || name.includes("馆藏") || name.includes("纪念馆")) {
    return "馆藏支流";
  }

  if (name.includes("宋庆龄") || name.includes("韬奋")) {
    return "近现代支流";
  }

  return "来源支流";
}

function deriveBranchAnnotations(
  activeEraIndex: number,
  allowedSlugs: Set<string>,
  selectedSlug: string,
): DerivedBranchAnnotation[] {
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
    .map(({ citation, sourceBook, targetBook, branchWeight }) => {
      const sourcePoint = sourceBook.coordinates;
      const targetPoint = targetBook.coordinates;
      const midX = (sourcePoint[0] + targetPoint[0]) / 2;
      const midY = Math.max(sourcePoint[1], targetPoint[1]) + 0.22;
      const midZ = (sourcePoint[2] + targetPoint[2]) / 2;
      const offsetZ = sourcePoint[2] >= targetPoint[2] ? 0.28 : -0.28;
      const label = `${sourceBook.shortTitle} · ${citation.label}`;

      return {
        id: `branch-${citation.id}`,
        layer: citation.layer,
        weight: branchWeight,
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
  const [activeSourceAtlasDetail, setActiveSourceAtlasDetail] =
    useState<SourceAtlasEntryDetailPayload | null>(null);
  const [sourceAtlasThemeFilter, setSourceAtlasThemeFilter] = useState<string>("全部");
  const [sourceAtlasEraFilter, setSourceAtlasEraFilter] = useState<string>("全部");
  const [entryExplorerTab, setEntryExplorerTab] = useState<
    "spread" | "people" | "versions" | "timeline" | "passages" | null
  >(null);
  const [activeDesktopPanel, setActiveDesktopPanel] = useState<
    "search" | "era" | "category" | "branch"
  >("branch");
  const [transitionState, setTransitionState] = useState<
    "idle" | "diving" | "settling" | "returning"
  >("idle");
  const [transitionTargetSlug, setTransitionTargetSlug] = useState<string | null>(null);
  const isMobileViewport = () =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

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

  const handleSearchTermChange = useCallback(
    (value: string) => {
      setSearchPending(value.trim().length > 0);
      setSearchTerm(value);
    },
    [setSearchTerm],
  );
  const clearSearchContext = useCallback(() => {
    setSearchPending(false);
    setSearchResult(null);
    setSearchTerm("");
  }, [setSearchTerm]);

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
  const relationSummary = useMemo(
    () =>
      (Object.keys(relationLayerMeta) as Array<keyof typeof relationLayerMeta>).map((layer) => {
        const layerBranches = visibleBranchAnnotations.filter((branch) => branch.layer === layer);

        return {
          layer,
          count: layerBranches.length,
          primaryBranch: layerBranches.sort((left, right) => right.weight - left.weight)[0] ?? null,
        };
      }),
    [visibleBranchAnnotations],
  );

  const activeBranchAnnotation =
    visibleBranchAnnotations.find((annotation) => annotation.id === hoveredBranchId) ??
    visibleBranchAnnotations.find((annotation) => annotation.targetSlug === selectedBookSlug) ??
    visibleBranchAnnotations[0] ??
    null;
  const activeBranchSummary = relationSummary.find(
    ({ layer }) => layer === activeBranchAnnotation?.layer,
  ) ?? null;
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

  const resolvedActiveSourceAtlasId = activeSourceAtlasId ?? insights?.sourceAtlas?.[0]?.id ?? null;

  useEffect(() => {
    if (!resolvedActiveSourceAtlasId) {
      return;
    }

    let cancelled = false;

    const loadSourceAtlasDetail = async () => {
      try {
        const response = await fetch(
          `/api/source-atlas/${encodeURIComponent(resolvedActiveSourceAtlasId)}`,
        );

        if (!response.ok) {
          if (!cancelled) {
            setActiveSourceAtlasDetail(null);
          }
          return;
        }

        const payload = (await response.json()) as SourceAtlasEntryDetailPayload;
        if (!cancelled) {
          setActiveSourceAtlasDetail(payload);
        }
      } catch {
        if (!cancelled) {
          setActiveSourceAtlasDetail(null);
        }
      }
    };

    void loadSourceAtlasDetail();

    return () => {
      cancelled = true;
    };
  }, [resolvedActiveSourceAtlasId]);

  const handleDiveToBook = (slug: string, options?: ExplorerOpenOptions) => {
    const nextEntryTab =
      options?.entryTab ??
      (sceneFocus?.active
        ? sceneFocus.mode === "source"
          ? "versions"
          : sceneFocus.mode
        : null);

    if (selectedBookSlug === slug && viewMode === "book") {
      const mobileViewport = isMobileViewport();
      setShowDesktopDossier(!mobileViewport);
      setShowDesktopControls(false);
      setShowMobileControls(false);
      setShowMobileDossier(false);
      setEntryExplorerTab(nextEntryTab);
      setSelectedBookSlug(slug);
      return;
    }

    setSceneFocus(null);
    setEntryExplorerTab(nextEntryTab);
    setTransitionTargetSlug(slug);
    setTransitionState("diving");
    window.setTimeout(() => {
      const mobileViewport = isMobileViewport();
      setShowDesktopDossier(!mobileViewport);
      setShowDesktopControls(false);
      setShowMobileControls(false);
      setShowMobileDossier(false);
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
      if (activeSourceAtlasEntry) {
        setActiveDesktopPanel("branch");
      }
      resetSelection();
    }, 120);
  };
  const handleEraFocus = useCallback(
    (era: (typeof eras)[number]) => {
      clearSearchContext();
      setSceneFocus(null);
      setTraceFocus(null);
      setSelectedDockId(null);
      setHoveredBranchId(null);
      setActiveEra(era);
    },
    [clearSearchContext, setActiveEra],
  );
  const handleOpenDesktopPanel = (panel: "search" | "era" | "category" | "branch") => {
    if (panel !== "search") {
      clearSearchContext();
    }

    if (panel === "era" || panel === "branch" || panel === "category") {
      setSceneFocus(null);
      setTraceFocus(null);
      setSelectedDockId(null);
      setHoveredBranchId(null);
    }

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
  const sourceAtlasEntries = useMemo(() => insights?.sourceAtlas ?? [], [insights?.sourceAtlas]);
  const atlasMeta = insights?.atlasMeta ?? null;
  const inferSourceAtlasEra = useCallback(
    (entry: NonNullable<typeof sourceAtlasEntries>[number]) => {
      const inferredEra =
        entry.sampleRecords
          ?.map((record) => inferEraFromYearText(record.year))
          .find((era): era is (typeof eras)[number] => Boolean(era)) ?? null;

      if (inferredEra) {
        return inferredEra;
      }

      if (
        entry.name.includes("南湖") ||
        entry.name.includes("红色") ||
        entry.name.includes("韬奋") ||
        entry.name.includes("宋庆龄")
      ) {
        return "近现代" as const;
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
    },
    [],
  );
  const sourceAtlasThemeOptions = useMemo(() => {
    return ["全部", ...Array.from(new Set(sourceAtlasEntries.map((entry) => getSourceThemeLabel(entry.name))))];
  }, [sourceAtlasEntries]);
  const sourceAtlasEraOptions = useMemo(() => {
    return [
      "全部",
      ...Array.from(
        new Set(
          sourceAtlasEntries
            .map((entry) => inferSourceAtlasEra(entry))
            .filter((era): era is (typeof eras)[number] => Boolean(era)),
        ),
      ),
    ];
  }, [inferSourceAtlasEra, sourceAtlasEntries]);
  const filteredSourceAtlasEntries = useMemo(() => {
    return sourceAtlasEntries.filter((entry) => {
      const matchesTheme =
        sourceAtlasThemeFilter === "全部" ||
        getSourceThemeLabel(entry.name) === sourceAtlasThemeFilter;
      const matchesEra =
        sourceAtlasEraFilter === "全部" || inferSourceAtlasEra(entry) === sourceAtlasEraFilter;

      return matchesTheme && matchesEra;
    });
  }, [inferSourceAtlasEra, sourceAtlasEntries, sourceAtlasEraFilter, sourceAtlasThemeFilter]);
  const sourceAtlasFilterActive =
    sourceAtlasThemeFilter !== "全部" || sourceAtlasEraFilter !== "全部";
  const sourceAtlasFilterSummary = [
    sourceAtlasThemeFilter !== "全部" ? sourceAtlasThemeFilter : null,
    sourceAtlasEraFilter !== "全部" ? sourceAtlasEraFilter : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const prioritizedSourceAtlasEntries = useMemo(() => {
    return [...filteredSourceAtlasEntries].sort((left, right) => {
      const leftEra = inferSourceAtlasEra(left);
      const rightEra = inferSourceAtlasEra(right);
      const leftMatchesEra = leftEra === activeEra ? 1 : 0;
      const rightMatchesEra = rightEra === activeEra ? 1 : 0;

      if (leftMatchesEra !== rightMatchesEra) {
        return rightMatchesEra - leftMatchesEra;
      }

      const leftModernBoost =
        activeEra === "近现代" &&
        (left.name.includes("红色") ||
          left.name.includes("南湖") ||
          left.name.includes("韬奋") ||
          left.name.includes("宋庆龄") ||
          left.name.includes("报刊"))
          ? 1
          : 0;
      const rightModernBoost =
        activeEra === "近现代" &&
        (right.name.includes("红色") ||
          right.name.includes("南湖") ||
          right.name.includes("韬奋") ||
          right.name.includes("宋庆龄") ||
          right.name.includes("报刊"))
          ? 1
          : 0;

      if (leftModernBoost !== rightModernBoost) {
        return rightModernBoost - leftModernBoost;
      }

      return (right.magnitude ?? 0) - (left.magnitude ?? 0);
    });
  }, [activeEra, filteredSourceAtlasEntries, inferSourceAtlasEra]);
  const activeSourceAtlasEntry =
    prioritizedSourceAtlasEntries.find((entry) => entry.id === activeSourceAtlasId) ??
    prioritizedSourceAtlasEntries[0] ??
    null;
  const activeSourceAtlasIndex = activeSourceAtlasEntry
    ? prioritizedSourceAtlasEntries.findIndex((entry) => entry.id === activeSourceAtlasEntry.id)
    : -1;
  const sourceAtlasSuggestedEra = activeSourceAtlasEntry
    ? inferSourceAtlasEra(activeSourceAtlasEntry) ?? activeEra
    : null;
  const getEntryAnchorBooks = useCallback(
    (entry: NonNullable<typeof sourceAtlasEntries>[number]) => {
      const linkedBooks = filteredBooks.filter((book) => entry.relatedBookSlugs?.includes(book.slug));

      if (linkedBooks.length) {
        return linkedBooks.sort((left, right) => left.year - right.year);
      }

      const inferredEra = inferSourceAtlasEra(entry);
      const fallbackBooks = filteredBooks.filter((book) => {
        if (inferredEra && book.dynasty !== inferredEra) {
          return false;
        }

        return true;
      });

      return (fallbackBooks.length ? fallbackBooks : filteredBooks).sort(
        (left, right) => left.year - right.year,
      );
    },
    [filteredBooks, inferSourceAtlasEra],
  );
  const sourceAtlasDockMarkers: RiverDockMarker[] = (() => {
    if (!activeSourceAtlasEntry?.sampleRecords?.length) {
      return [];
    }

    const anchorBooks = getEntryAnchorBooks(activeSourceAtlasEntry);

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
    if (!prioritizedSourceAtlasEntries.length) {
      return [];
    }

    const anchorPool =
      filteredBooks.length > 0
        ? filteredBooks
        : riverDataset.books.filter((book) => eras.indexOf(book.dynasty) <= activeEraIndex);
    const fallbackPool = anchorPool.length > 0 ? anchorPool : riverDataset.books;

    return prioritizedSourceAtlasEntries
      .map((entry, entryIndex) => {
        const anchorBooks = getEntryAnchorBooks(entry);
        const primaryAnchors = (anchorBooks.length ? anchorBooks : fallbackPool).slice(0, 4);

        if (primaryAnchors.length < 2) {
          return null;
        }

        const laneBias = entryIndex - (prioritizedSourceAtlasEntries.length - 1) / 2;
        const routePoints = primaryAnchors.map((anchorBook, anchorIndex) => {
          const [baseX, baseY, baseZ] = anchorBook.coordinates;
          const sway = anchorIndex % 2 === 0 ? 1 : -1;
          const depthOffset = entry.relatedBookSlugs?.length
            ? sway * (0.22 + anchorIndex * 0.04)
            : sway * (0.52 + entryIndex * 0.08);

          return [
            baseX + laneBias * (entry.relatedBookSlugs?.length ? 0.18 : 0.62) + anchorIndex * 0.08,
            baseY + 0.03 + Math.min(entryIndex * 0.01, 0.04),
            baseZ + depthOffset,
          ] as [number, number, number];
        });

        if (routePoints.length < 2) {
          return null;
        }

        const routeColor = entry.name.includes("红色")
          ? "#dc2626"
          : entry.name.includes("南湖")
          ? "#ef4444"
          : entry.name.includes("韬奋") || entry.name.includes("宋庆龄")
            ? "#fb7185"
            : entry.name.includes("报刊")
              ? "#f97316"
              : entry.name.includes("搜韵")
                ? "#fbbf24"
                : ["#fbbf24", "#fb923c", "#f59e0b", "#fde68a", "#facc15", "#fdba74"][
                    entryIndex % 6
                  ]!;

        return {
          id: entry.id,
          label: entry.name,
          color: routeColor,
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

    if (activeSourceAtlasEntry.relatedBookSlugs?.length) {
      return filteredBooks
        .filter((book) => activeSourceAtlasEntry.relatedBookSlugs?.includes(book.slug))
        .map((book) => book.slug);
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

        if (
          activeSourceAtlasEntry.name.includes("南湖") ||
          activeSourceAtlasEntry.name.includes("红色") ||
          activeSourceAtlasEntry.name.includes("韬奋") ||
          activeSourceAtlasEntry.name.includes("宋庆龄")
        ) {
          return book.dynasty === "近现代";
        }

        if (
          activeSourceAtlasEntry.name.includes("CBDB") ||
          activeSourceAtlasEntry.name.includes("纪传")
        ) {
          return book.category === "史" || book.category === "经";
        }

        return true;
      })
      .sort((left, right) => right.influence - left.influence)
      .slice(0, 5)
      .map((book) => book.slug);

    return focusCandidates;
  })();
  const openingSourceSpotlightSlugs = useMemo(() => {
    if (selectedBook) {
      return [];
    }

    const openingEntries = prioritizedSourceAtlasEntries.slice(0, 3);
    const preferredBooks = openingEntries.flatMap((entry) =>
      getEntryAnchorBooks(entry)
        .sort((left, right) => right.influence - left.influence)
        .slice(0, 2)
        .map((book) => book.slug),
    );

    return Array.from(new Set(preferredBooks)).slice(0, 4);
  }, [getEntryAnchorBooks, prioritizedSourceAtlasEntries, selectedBook]);
  const mergedHighlightedBookSlugs = Array.from(
    new Set([
      ...searchHighlightedSlugs,
      ...sourceAtlasHighlightedBookSlugs,
      ...openingSourceSpotlightSlugs,
    ]),
  );
  const sourceAtlasMass = prioritizedSourceAtlasEntries.reduce(
    (sum, entry) => sum + (entry.magnitude ?? entry.sampleRecords?.length ?? 0),
    0,
  );
  const applySourceSceneFocus = useCallback(
    (entry: NonNullable<typeof sourceAtlasEntries>[number]) => {
      const inferredEra = inferSourceAtlasEra(entry);
      if (inferredEra && inferredEra !== activeEra) {
        handleEraFocus(inferredEra);
      }

      const focusBook =
        getEntryAnchorBooks(entry).sort((left, right) => right.influence - left.influence)[0] ?? null;

      setSceneFocus(
        focusBook
          ? {
              active: true,
              mode: "source",
              currentTitle: focusBook.title,
              contextLabel: `来源联动：${entry.name}`,
              detail: `${entry.name} 的来源线索正在驱动主河道镜头聚焦 ${focusBook.shortTitle} 所在河段。`,
            }
          : null,
      );
    },
    [activeEra, getEntryAnchorBooks, handleEraFocus, inferSourceAtlasEra],
  );
  const handleSourceAtlasSelect = (entryId: string) => {
    clearSearchContext();
    setTraceFocus(null);
    setHoveredBranchId(null);
    setActiveSourceAtlasId(entryId);
    setActiveSourceAtlasDetail(null);
    setSelectedDockId(null);
    setShowDesktopControls(true);
    setShowDesktopDossier(false);
    setShowMobileDossier(false);

    const selectedEntry = prioritizedSourceAtlasEntries.find((entry) => entry.id === entryId);
    const applySourceEntry = () => {
      if (!selectedEntry) {
        return;
      }

      applySourceSceneFocus(selectedEntry);
    };

    if (selectedBook) {
      setTransitionTargetSlug(selectedBook.slug);
      setTransitionState("returning");
      window.setTimeout(() => {
        setTraceFocus(null);
        setSceneFocus(null);
        setEntryExplorerTab(null);
        setShowDesktopDossier(false);
        setShowMobileDossier(false);
        setShowMobileControls(false);
        resetSelection();
        setActiveDesktopPanel("branch");
        setShowDesktopControls(true);
        applySourceEntry();
      }, 120);
      return;
    }

    applySourceEntry();
  };
  const handleSourceAtlasStep = (direction: -1 | 1) => {
    if (!prioritizedSourceAtlasEntries.length) {
      return;
    }

    const nextIndex =
      activeSourceAtlasIndex >= 0
        ? (activeSourceAtlasIndex + direction + prioritizedSourceAtlasEntries.length) % prioritizedSourceAtlasEntries.length
        : 0;
    const nextEntry = prioritizedSourceAtlasEntries[nextIndex];

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
      ? "translate-y-8 scale-[0.972] opacity-0 blur-[1px]"
      : transitionState === "settling"
        ? "translate-y-0 scale-100 opacity-100"
        : transitionState === "returning"
          ? "-translate-y-4 scale-[1.018] opacity-0 blur-[1px]"
          : "translate-y-0 scale-100 opacity-100";
  const resolvedSearchResult =
    searchResult?.query.trim() === searchTerm.trim() ? searchResult : null;
  const searchSuggestionChips =
    resolvedSearchResult?.relatedConcepts.length
      ? resolvedSearchResult.relatedConcepts
      : defaultConceptSuggestions;
  const panelBaseClass =
    "rounded-[28px] border border-[#c89b43]/30 bg-[linear-gradient(180deg,rgba(245,232,189,0.96),rgba(225,191,112,0.92))] shadow-[0_18px_56px_rgba(92,58,16,0.16)] backdrop-blur-xl";
  const desktopControlPanelClass =
    "rounded-[24px] border border-[#c89b43]/22 bg-[linear-gradient(180deg,rgba(248,238,206,0.94),rgba(224,189,104,0.88))] shadow-[0_14px_40px_rgba(92,58,16,0.12)] backdrop-blur-xl";
  const mobileSheetClass =
    "rounded-[24px] border border-[#c89b43]/24 bg-[linear-gradient(180deg,rgba(250,242,216,0.97),rgba(229,197,118,0.94))] shadow-[0_18px_38px_rgba(92,58,16,0.12)] backdrop-blur-xl";
  const showMobileSheet = showMobileControls || showMobileDossier;
  const mobileSheetFrameClass = showMobileDossier
    ? "max-h-[min(27rem,64vh)]"
    : "max-h-[min(10.5rem,24vh)]";
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
  const visibleSourceAtlasDetail =
    activeSourceAtlasDetail?.entry.id === activeSourceAtlasEntry?.id ? activeSourceAtlasDetail : null;
  const activeSourceRelatedBooks = useMemo(
    () => visibleSourceAtlasDetail?.relatedBooks ?? [],
    [visibleSourceAtlasDetail?.relatedBooks],
  );
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
  const transitionTargetBook = transitionTargetSlug
    ? riverDataset.books.find((book) => book.slug === transitionTargetSlug) ?? null
    : null;
  const transitionLabel =
    transitionState === "diving"
      ? transitionTargetBook
        ? `文卷正自河心向《${transitionTargetBook.shortTitle}》舒展开来`
        : "文卷正自河心徐徐展开"
      : transitionState === "settling"
        ? transitionTargetBook
          ? `《${transitionTargetBook.shortTitle}》已停驻卷心`
          : "文卷已停驻卷心"
        : transitionState === "returning"
          ? "文卷正沿水势缓缓归回主河道"
          : null;
  const openingLead =
    activeSourceAtlasEntry
      ? `先让 ${activeSourceAtlasEntry.name} 这股真实来源支流映上河身，再顺着主河追看典籍入卷。`
      : activeEra === "先秦"
        ? "从经典源头起笔，沿河看见文脉如何生长。"
        : activeEra === "宋元"
          ? "此处正是支流奔涌最盛的一段河身。"
          : "顺着黄河长卷巡看主河、支流与时代起伏。";
  const openingSourcePreviewBooks = useMemo(() => {
    if (selectedBook) {
      return [];
    }

    const previewBooks =
      activeSourceRelatedBooks.length > 0
        ? activeSourceRelatedBooks
        : activeSourceAtlasEntry
          ? getEntryAnchorBooks(activeSourceAtlasEntry)
              .sort((left, right) => right.influence - left.influence)
              .slice(0, 3)
              .map((book) => ({
                id: book.id,
                slug: book.slug,
                title: book.title,
                dynasty: book.dynasty,
                category: book.category,
              }))
          : [];

    return previewBooks.slice(0, 2);
  }, [activeSourceAtlasEntry, activeSourceRelatedBooks, getEntryAnchorBooks, selectedBook]);
  const compactRelationSummary = relationSummary.filter(({ count }) => count > 0).slice(0, 3);
  const compactSourceMeta = [
    activeSourceAtlasEntry ? getSourceThemeLabel(activeSourceAtlasEntry.name) : null,
    activeSourceAtlasEntry?.stat ?? null,
    atlasMeta ? `主线 ${atlasMeta.demoBookCount} 部` : null,
  ].filter((item): item is string => Boolean(item));
  const compactSourceThemeOptions = sourceAtlasThemeOptions.slice(0, 4);
  const compactSourceEraOptions = sourceAtlasEraOptions.slice(0, 4);
  const compactSourceRouteEntries = prioritizedSourceAtlasEntries.slice(0, 2);
  const compactBranchLead = activeBranchAnnotation
    ? activeBranchSummary
      ? `${relationLayerMeta[activeBranchSummary.layer].label}当前显出 ${activeBranchSummary.count} 股。`
      : "顺着这一股支流继续入卷。"
    : "河上节点已经浮起，可择一典籍顺势入卷。";
  const collapsedDesktopLead = selectedBook
    ? `《${selectedBook.shortTitle}》已入卷`
    : activeSourceAtlasEntry
      ? activeSourceAtlasEntry.name
      : openingSourcePreviewBooks[0]?.title ?? "顺河入画";
  const collapsedDesktopNote = selectedBook
    ? `卷内细看 ${focusModeLabel}`
    : activeSourceAtlasEntry
      ? `${getSourceThemeLabel(activeSourceAtlasEntry.name)} · ${activeEra}`
      : `${activeEra} · 河岸巡看`;
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#e7c978] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,250,224,0.72),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(240,199,92,0.34),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(176,118,34,0.2),transparent_38%),linear-gradient(180deg,#fbf1cf_0%,#f0dc9f_24%,#d8ac54_56%,#8e591f_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,252,235,0.3),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(248,226,150,0.14),transparent_24%),linear-gradient(180deg,rgba(255,247,220,0.2)_0%,rgba(222,177,83,0.08)_28%,rgba(126,79,24,0.12)_100%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(149,108,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(149,108,42,0.08)_1px,transparent_1px)] [background-size:108px_108px]" />
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(122,84,26,0.14)_0.6px,transparent_0.6px)] [background-size:22px_22px]" />

      {showDiveOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
          <div
            className={`absolute inset-0 transition-all duration-500 ${
              transitionState === "diving"
                ? "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.22),rgba(4,8,7,0.9)_68%)] backdrop-blur-[3px]"
                : transitionState === "settling"
                  ? "bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(38,24,8,0.74)_72%)]"
                  : "bg-[radial-gradient(circle_at_center,rgba(243,212,123,0.08),rgba(4,8,7,0.84)_70%)]"
            }`}
          />
          <div
            className={`absolute inset-y-0 left-1/2 w-[min(38vw,440px)] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(248,223,154,0.16),rgba(248,223,154,0.03),rgba(248,223,154,0.14))] transition-all duration-500 ${
              transitionState === "diving"
                ? "opacity-90 blur-[8px] scale-x-[1.02]"
                : transitionState === "settling"
                  ? "opacity-62 blur-[12px] scale-x-100"
                  : "opacity-0 blur-[18px] scale-x-[0.96]"
            }`}
          />
          <div
            className={`absolute inset-y-[14%] left-1/2 w-[min(44vw,520px)] -translate-x-1/2 rounded-[999px] border border-[#f5dfab]/18 bg-[linear-gradient(180deg,rgba(255,244,205,0.12),rgba(255,244,205,0.02),rgba(219,172,76,0.1))] transition-all duration-500 ${
              transitionState === "diving"
                ? "opacity-100 blur-[10px] scale-y-[1.08]"
                : transitionState === "settling"
                  ? "opacity-66 blur-[12px] scale-y-100"
                  : "opacity-0 blur-[18px] scale-y-[0.92]"
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
        {showDesktopControls ? (
          <div className="absolute left-4 top-4 z-20 hidden w-[min(11.75rem,calc(100vw-39rem))] md:block lg:left-6 lg:top-6 lg:w-[12rem]">
            <aside className="pointer-events-auto xl:pt-2">
              <div className={`relative max-h-[min(68vh,40rem)] overflow-hidden px-3 py-3 ${desktopControlPanelClass}`}>
              <div className="pointer-events-none absolute inset-y-4 left-2 w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(244,220,156,0.12),rgba(180,127,39,0.82),rgba(244,220,156,0.12))]" />
              <div className="pointer-events-none absolute inset-y-4 right-2 w-px bg-[linear-gradient(180deg,transparent,rgba(213,167,70,0.34),transparent)]" />
              <div className="pl-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[9px] tracking-[0.28em] text-[#8d6a2c]">岸边卷签</div>
                    <div className="mt-1 text-[13px] font-semibold text-[#5b3a11]">文脉溯源</div>
                    <div className="mt-1 text-[10px] text-[#8d6a2c]">{activeDesktopPanelConfig.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDesktopControls(false)}
                    className="rounded-full border border-[#b89247]/16 bg-[rgba(255,255,255,0.16)] px-2 py-1 text-[9px] text-[#7a571d] transition hover:bg-[rgba(255,255,255,0.24)]"
                  >
                    收起
                  </button>
                </div>

                <div className="mt-3 rounded-[16px] border border-[#d9b86b]/14 bg-[rgba(255,252,240,0.18)] px-3 py-2.5 text-[#6f4b18]">
                  <div className="text-[10px] leading-5">{openingLead}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-[#d9b86b]/20 bg-[rgba(255,255,255,0.16)] px-2.5 py-1 text-[9px] text-[#7a571d]">
                      {focusModeLabel}
                    </span>
                    {openingSourcePreviewBooks.slice(0, 1).map((book) => (
                      <button
                        key={`opening-source-preview-${book.slug}`}
                        type="button"
                        onPointerEnter={() => setHoveredBookSlug(book.slug)}
                        onPointerLeave={() => setHoveredBookSlug((current) => (current === book.slug ? null : current))}
                        onClick={() => handleDiveToBook(book.slug)}
                        className={`rounded-full border px-2.5 py-1 text-[9px] transition ${
                          hoveredBookSlug === book.slug
                            ? "border-[#c99d4f]/35 bg-[#f3dfab] text-[#42290a]"
                            : "border-[#d9b86b]/22 bg-[rgba(255,255,255,0.14)] text-[#6f4b18] hover:bg-[rgba(255,255,255,0.22)]"
                        }`}
                      >
                        《{book.title}》
                      </button>
                    ))}
                  </div>
                </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {desktopPanels.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActiveDesktopPanel(panel.id)}
                    className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                      activeDesktopPanel === panel.id
                        ? "bg-[#f3dfab] text-[#42290a]"
                        : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                    }`}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>

              <section className={`mt-3 max-h-[min(40vh,22rem)] overflow-auto rounded-[18px] border border-[#ead8a6]/10 bg-[rgba(93,62,18,0.12)] px-3 py-3 pr-2 transition-all duration-500 ease-out ${showDesktopControls ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] tracking-[0.22em] text-[#d8c9a3]">
                      {activeDesktopPanelConfig.summary}
                    </div>
                    {viewMode === "river" ? <div className="mt-2 text-[11px] leading-5 text-[#eadfbc]">拖河巡看，再择书入卷。</div> : null}
                  </div>
                  {viewMode === "book" ? (
                    <button
                      type="button"
                      onClick={handleReturnToRiver}
                      className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] text-amber-100 transition hover:bg-amber-300/15"
                    >
                      归河
                    </button>
                  ) : null}
                </div>

                {activeDesktopPanel === "search" ? (
                  <div className="mt-4">
                    <label className="block">
                      <span className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                        寻章入河
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
                        handleEraFocus(eras[Number(event.target.value)] ?? eras[0])
                      }
                      className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
                    />
                    <div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-[#c9b68a]">
                      {eras.map((era) => (
                        <button
                          key={era}
                          type="button"
                          onClick={() => handleEraFocus(era)}
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
                    {!selectedBook && activeSourceAtlasEntry ? (
                      <div className="mb-3 rounded-[18px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.06)] px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: activeSourceRoute?.color ?? "#d6a33d" }}
                          />
                          <div className="text-[10px] tracking-[0.24em] text-[#f4d892]/82">真实来源图例</div>
                        </div>
                        <div className="mt-2 text-[12px] text-[#fff2cf]">{activeSourceAtlasEntry.name}</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {compactSourceMeta.map((label) => (
                            <span
                              key={`compact-source-meta-${label}`}
                              className="rounded-full border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-2.5 py-1 text-[10px] text-[#f3e3bb]"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="rounded-[18px] border border-[#ead8a6]/14 bg-[rgba(27,17,7,0.22)] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">关系层级</div>
                        <div className="text-[11px] text-[#c9b68a]">河上脉络</div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {compactRelationSummary.map(({ layer, count }) => (
                          <button
                            key={layer}
                            type="button"
                            onClick={() => {
                              const target =
                                relationSummary.find((item) => item.layer === layer)?.primaryBranch ?? null;

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
                            <div>
                              <div className="text-sm font-medium text-[#fbf3da]">
                                {activeBranchAnnotation.label}
                              </div>
                              {activeBranchSummary ? (
                                <div className="mt-1 text-[11px] text-[#d8c9a3]">{compactBranchLead}</div>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDiveToBook(activeBranchAnnotation.targetSlug)}
                              className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-[11px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                            >
                              入卷
                            </button>
                          </div>
                          <p className="mt-2 line-clamp-4 text-sm leading-6 text-[#f4e8c4]">
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
                    <div className="mt-3 rounded-[18px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(127,87,27,0.24),rgba(58,36,10,0.16))] px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">支流巡签</div>
                          <div className="mt-1 text-[10px] text-[#cdb98d]">
                            当前第{" "}
                            {activeSourceAtlasIndex >= 0
                              ? activeSourceAtlasIndex + 1
                              : Math.min(prioritizedSourceAtlasEntries.length, 1)}
                            /{prioritizedSourceAtlasEntries.length || 1} 股
                          </div>
                        </div>
                        <div className="text-[10px] text-[#f2dfab]">
                          {activeSourceAtlasEntry?.stat ?? "来源线索"}
                        </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-2.5 py-1 text-[10px] text-[#f3e3bb]">
                            当前可见 {prioritizedSourceAtlasEntries.length} 股
                          </span>
                          {sourceAtlasFilterActive ? (
                            <>
                              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-100">
                                已筛 {sourceAtlasFilterSummary}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSourceAtlasThemeFilter("全部");
                                  setSourceAtlasEraFilter("全部");
                                }}
                                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-2.5 py-1 text-[10px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                              >
                                归零筛选
                              </button>
                            </>
                          ) : (
                            <span className="rounded-full border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-2.5 py-1 text-[10px] text-[#dccb9c]">
                              未加筛选
                            </span>
                          )}
                        </div>
                        <div className="mt-3 rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(35,22,7,0.26)] px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[11px] tracking-[0.2em] text-[#d8c9a3]">来源支流</div>
                            <div className="text-[10px] text-[#c9b68a]">
                              {activeSourceAtlasIndex >= 0
                                ? `${activeSourceAtlasIndex + 1}/${prioritizedSourceAtlasEntries.length}`
                                : `${Math.min(prioritizedSourceAtlasEntries.length, 1)}/${prioritizedSourceAtlasEntries.length}`}
                            </div>
                          </div>
                          {activeSourceAtlasEntry ? (
                            <button
                              type="button"
                              onClick={() => handleSourceAtlasSelect(activeSourceAtlasEntry.id)}
                              className="mt-3 w-full rounded-[14px] border border-amber-300/24 bg-[rgba(120,81,26,0.32)] px-3 py-3 text-left transition hover:bg-[rgba(131,90,29,0.4)]"
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
                              <div className="mt-2 inline-flex rounded-full border border-amber-200/22 bg-[rgba(255,244,214,0.08)] px-2.5 py-1 text-[10px] text-[#fff0c2]">
                                {getSourceThemeLabel(activeSourceAtlasEntry.name)}
                                {sourceAtlasSuggestedEra ? ` · ${sourceAtlasSuggestedEra}` : ""}
                              </div>
                              <div className="mt-2 line-clamp-2 text-[10px] leading-5 text-[#e6d7ae]">
                                {activeSourceAtlasEntry.summary ?? "这股来源正在河面留下对应线索与落点。"}
                              </div>
                            </button>
                          ) : (
                            <div className="mt-3 rounded-[14px] border border-dashed border-[#ead8a6]/16 bg-[rgba(255,248,220,0.03)] px-3 py-3 text-[11px] leading-5 text-[#d8c9a3]">
                              当前筛选下还没有映上河面的来源支流，换个主题或时代再看。
                            </div>
                          )}
                          <div className="mt-3">
                            <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">按主题看</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {compactSourceThemeOptions.map((theme) => (
                                <button
                                  key={`source-theme-${theme}`}
                                  type="button"
                                  onClick={() => setSourceAtlasThemeFilter(theme)}
                                  className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                                    sourceAtlasThemeFilter === theme
                                      ? "bg-[#f3dfab] text-[#42290a]"
                                      : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                                  }`}
                                >
                                  {theme}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">按时代看</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {compactSourceEraOptions.map((era) => (
                                <button
                                  key={`source-era-${era}`}
                                  type="button"
                                  onClick={() => setSourceAtlasEraFilter(era)}
                                  className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                                    sourceAtlasEraFilter === era
                                      ? "bg-[#f3dfab] text-[#42290a]"
                                      : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                                  }`}
                                >
                                  {era}
                                </button>
                              ))}
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
                          {compactSourceRouteEntries.length ? (
                            <div className="mt-3 space-y-2">
                              {compactSourceRouteEntries.map((entry) => {
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
                                        {entry.stat ?? "来源线索"}
                                      </div>
                                    </div>
                                    <div className="shrink-0 text-[10px] text-[#d8c9a3]">
                                      {getSourceThemeLabel(entry.name)}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                        {activeSourceAtlasEntry ? (
                          <div className="mt-3 rounded-[16px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                            {activeSourceAtlasEntry.sampleRecords?.slice(0, 2).length ? (
                              <div className="flex flex-wrap gap-2">
                                {activeSourceAtlasEntry.sampleRecords.slice(0, 2).map((record, index) => {
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
                            ) : null}
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
                                个码头落点铺开，河段与来源已彼此扣合。
                              </div>
                            ) : null}
                            {activeSourceRelatedBooks.length ? (
                              <div className="mt-3 rounded-[14px] border border-[#ead8a6]/12 bg-[rgba(64,41,12,0.3)] px-3 py-3">
                                <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">顺流可入</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {activeSourceRelatedBooks.slice(0, 2).map((book) => (
                                    <button
                                      key={`source-related-${activeSourceAtlasEntry.id}-${book.slug}`}
                                      type="button"
                                      onClick={() => handleDiveToBook(book.slug)}
                                      className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-1.5 text-[10px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.12)] hover:text-[#fbf3da]"
                                    >
                                      {book.title} · {book.dynasty}
                                    </button>
                                  ))}
                                </div>
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
                                    .join(" · ") || "来源条目"}
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
            </div>
          </aside>
        </div>
        ) : null}

        {showDesktopDossier && selectedBook && selectedDetail ? (
          <div className="absolute right-4 top-[104px] z-20 hidden w-[min(400px,calc(100vw-20rem))] sm:right-6 lg:right-8 xl:block">
            <aside className={`pointer-events-auto transition-all duration-500 ease-out xl:pt-2 ${dossierMotionClass}`}>
              <div className={`overflow-hidden p-4 ${panelBaseClass}`}>
                <div
                  className={`relative rounded-[30px] border border-[#ead8a6]/20 bg-[linear-gradient(180deg,rgba(245,231,188,0.14),rgba(104,72,25,0.14))] p-3 ${
                    traceFocus?.active
                      ? "shadow-[0_0_28px_rgba(245,158,11,0.12)]"
                      : transitionState === "diving" || transitionState === "settling"
                        ? "shadow-[0_0_24px_rgba(245,158,11,0.1)]"
                        : ""
                  }`}
                >
                  <div className="pointer-events-none absolute inset-y-6 left-2 w-3 rounded-full bg-[linear-gradient(180deg,rgba(255,239,196,0.9),rgba(212,164,72,0.58),rgba(255,239,196,0.84))]" />
                  <div className="pointer-events-none absolute inset-y-6 right-2 w-3 rounded-full bg-[linear-gradient(180deg,rgba(255,232,184,0.88),rgba(196,138,47,0.58),rgba(255,232,184,0.84))]" />
                  <div className="pointer-events-none absolute inset-x-8 top-3 h-px bg-[linear-gradient(90deg,transparent,rgba(246,221,160,0.6),transparent)]" />
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

                    <div className="mt-4 h-px bg-[linear-gradient(90deg,transparent,rgba(242,223,171,0.55),transparent)]" />
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.08)] px-3 py-1.5 text-[#fbf3da]">
                        {focusModeLabel}
                      </span>
                      <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.08)] px-3 py-1.5 text-[#eadfbc]">
                        关联 {selectedBookCitations.length} 条
                      </span>
                      {selectedSources.length ? (
                        <span className="rounded-full border border-[#ead8a6]/18 bg-[rgba(233,191,86,0.1)] px-3 py-1.5 text-[#fbf3da]">
                          实证线索 {selectedSources.length} 类
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

                  <div className="relative mt-3 rounded-[28px] border border-[#ead8a6]/16 bg-[linear-gradient(180deg,rgba(248,236,198,0.98),rgba(227,204,148,0.94))] px-4 py-4 text-[#42290a] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
                    <div className="pointer-events-none absolute inset-y-4 left-2 w-px bg-[linear-gradient(180deg,transparent,rgba(178,139,71,0.35),transparent)]" />
                    <div className="pointer-events-none absolute inset-y-4 right-2 w-px bg-[linear-gradient(180deg,transparent,rgba(178,139,71,0.28),transparent)]" />
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#b89247]/20 pb-3">
                      <div>
                      <div className="text-[11px] tracking-[0.24em] text-[#8d6a2c]">
                          卷内细看
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
        ) : !showDesktopDossier ? (
          <div className="absolute left-4 top-4 z-20 hidden md:block lg:left-6 lg:top-6">
            <aside className="pointer-events-auto">
              <div className="group relative w-[8.35rem] overflow-hidden rounded-[20px] border border-[#c89b43]/18 bg-[linear-gradient(180deg,rgba(250,241,210,0.82),rgba(228,191,108,0.6))] px-2.5 py-2 shadow-[0_10px_28px_rgba(92,58,16,0.08)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(92,58,16,0.14)]">
                <div className="pointer-events-none absolute inset-y-2 left-2 w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(245,223,165,0.16),rgba(180,127,39,0.88),rgba(245,223,165,0.16))]" />
                <div className="pointer-events-none absolute inset-y-2.5 right-2 w-px bg-[linear-gradient(180deg,transparent,rgba(213,167,70,0.22),transparent)]" />
                <div className="pl-2">
                  <div className="text-[9px] tracking-[0.28em] text-[#8d6a2c]">河岸题签</div>
                  <div className="mt-1 text-[12px] font-semibold text-[#5b3a11]">文脉溯源</div>
                  <div className="mt-1 line-clamp-2 text-[9px] font-medium leading-4 text-[#6d4a18]">{collapsedDesktopLead}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 pl-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDesktopPanel("branch")}
                    className="rounded-full border border-[#d6b166]/20 bg-[rgba(255,248,220,0.52)] px-2 py-1 text-[9px] text-[#42290a] transition hover:bg-[#f7e7bc]"
                  >
                    河册
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDesktopPanel("era")}
                    className="rounded-full border border-[#d8b56c]/20 bg-[rgba(255,255,255,0.12)] px-2 py-1 text-[9px] text-[#7a571d] transition hover:bg-[rgba(255,255,255,0.24)]"
                  >
                    {activeEra}
                  </button>
                </div>
                <div className="mt-1 pl-2 text-[8px] leading-4 text-[#8d6a2c]">{collapsedDesktopNote}</div>
                {selectedBook ? (
                  <button
                    type="button"
                    onClick={() => setShowDesktopDossier(true)}
                    className="mt-2 ml-2 w-[calc(100%-0.5rem)] rounded-full border border-[#d8b56c]/22 bg-[rgba(255,255,255,0.14)] px-2.5 py-1 text-[9px] text-[#7a571d] transition hover:bg-[rgba(255,255,255,0.24)]"
                  >
                    开卷
                  </button>
                ) : null}
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
            mobilePanelOpen={showMobileSheet}
            overlayBusy={showDesktopControls || showDesktopDossier || showMobileSheet}
          />
        </main>

        {showMobileSheet ? (
          <div className="absolute inset-x-0 bottom-[4.75rem] z-40 px-3 md:hidden">
            <div
              className={`pointer-events-auto mx-auto w-[min(24rem,calc(100vw-1.5rem))] overflow-auto px-3 py-3 shadow-[0_16px_34px_rgba(52,28,6,0.12)] ${mobileSheetFrameClass} ${mobileSheetClass}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] tracking-[0.28em] text-[#8d6a2c]">卷边题签</div>
                  <div className="mt-1 text-[13px] font-medium text-[#5b3a11]">
                    {showMobileDossier && selectedBook ? `《${selectedBook.shortTitle}》卷内` : activeDesktopPanelConfig.label}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileControls(false);
                    setShowMobileDossier(false);
                  }}
                  className="rounded-full border border-[#b89247]/20 bg-[rgba(255,255,255,0.18)] px-3 py-1.5 text-xs text-[#6f4b18]"
                >
                  收起
                </button>
              </div>
              {selectedBook ? (
                <div className="mt-3 rounded-full border border-[#d5b16a]/18 bg-[rgba(255,248,220,0.18)] p-1">
                  <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileControls(true);
                      setShowMobileDossier(false);
                    }}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[11px] transition ${
                      showMobileControls
                        ? "bg-[#f3dfab] text-[#42290a]"
                        : "text-[#6f4b18]"
                    }`}
                  >
                    河册
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileControls(false);
                      setShowMobileDossier(true);
                    }}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[11px] transition ${
                      showMobileDossier
                        ? "bg-[#f3dfab] text-[#42290a]"
                        : "text-[#6f4b18]"
                    }`}
                  >
                    卷内
                  </button>
                </div>
                </div>
              ) : null}
              {showMobileDossier && selectedBook && selectedDetail ? (
                <div className="mt-3 rounded-[26px] border border-[#ead8a6]/18 bg-[linear-gradient(180deg,rgba(245,231,188,0.16),rgba(104,72,25,0.14))] p-3">
                  <div className="relative rounded-[24px] border border-[#ead8a6]/16 bg-[linear-gradient(180deg,rgba(247,237,206,0.98),rgba(230,204,140,0.94))] px-4 py-4 text-[#42290a]">
                    <div className="pointer-events-none absolute inset-y-5 left-2 w-2 rounded-full bg-[linear-gradient(180deg,rgba(255,239,196,0.88),rgba(212,164,72,0.55),rgba(255,239,196,0.82))]" />
                    <div className="pointer-events-none absolute inset-y-5 right-2 w-2 rounded-full bg-[linear-gradient(180deg,rgba(255,232,184,0.86),rgba(196,138,47,0.55),rgba(255,232,184,0.8))]" />
                    <div className="rounded-[20px] border border-[#b89247]/16 bg-[rgba(255,255,255,0.18)] px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] tracking-[0.22em] text-[#8d6a2c]">卷首题签</div>
                          <div className="mt-2 text-lg font-semibold leading-tight text-[#5b3a11]">{selectedBook.title}</div>
                          <div className="mt-2 text-xs text-[#6f4b18]">
                            {selectedBook.category} · {selectedBook.school}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleReturnToRiver}
                          className="rounded-full border border-[#b89247]/18 bg-[rgba(255,255,255,0.22)] px-3 py-1 text-[10px] text-[#7a571d]"
                        >
                          归河
                        </button>
                      </div>
                    </div>
                    <div className="mb-3 mt-3 rounded-[18px] border border-[#b89247]/14 bg-[rgba(255,255,255,0.2)] px-4 py-3 text-[12px] leading-6 text-[#5b3a11]">
                      {selectedBook.dynasty} 的这部典籍此刻正以 {focusModeLabel} 停驻卷心，卷内已牵出 {selectedBookCitations.length} 条关联
                      {selectedSources.length ? ` 与 ${selectedSources.length} 类实证回声。` : "。"}
                    </div>
                    <div className="max-h-[min(14rem,24vh)] overflow-auto pr-1">
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
              ) : null}
              {showMobileControls ? (
                <>
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
                  <div className="mt-3 rounded-[20px] border border-[#ead8a6]/14 bg-[rgba(93,62,18,0.2)] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] tracking-[0.22em] text-[#d8c9a3]">来源河册</div>
                      <div className="text-[10px] text-[#f2dfab]">
                        {activeSourceAtlasEntry?.stat ?? sourceAtlasMass.toLocaleString()}
                      </div>
                    </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-2.5 py-1 text-[10px] text-[#f3e3bb]">
                      当前可见 {prioritizedSourceAtlasEntries.length} 股
                    </span>
                    {sourceAtlasFilterActive ? (
                      <>
                        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-100">
                          已筛 {sourceAtlasFilterSummary}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSourceAtlasThemeFilter("全部");
                            setSourceAtlasEraFilter("全部");
                          }}
                          className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-2.5 py-1 text-[10px] text-[#eadfbc]"
                        >
                          归零筛选
                        </button>
                      </>
                    ) : (
                      <span className="rounded-full border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.05)] px-2.5 py-1 text-[10px] text-[#dccb9c]">
                        未加筛选
                      </span>
                    )}
                  </div>
                  {activeSourceAtlasEntry ? (
                    <div className="mt-3 rounded-[16px] border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.06)] px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: activeSourceRoute?.color ?? "#d6a33d" }}
                        />
                        <div className="min-w-0 text-[11px] font-medium text-[#fbf3da]">
                          {activeSourceAtlasEntry.name}
                        </div>
                      </div>
                      <div className="mt-2 text-[11px] leading-5 text-[#eadfbc]">
                        {activeSourceAtlasEntry.summary ?? "来源支流已映上河面。"}
                      </div>
                      <div className="mt-2 text-[10px] text-[#d8c9a3]">
                        {getSourceThemeLabel(activeSourceAtlasEntry.name)}
                        {sourceAtlasSuggestedEra ? ` · ${sourceAtlasSuggestedEra}` : ""}
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">按主题看</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sourceAtlasThemeOptions.slice(0, 4).map((theme) => (
                        <button
                          key={`mobile-source-theme-${theme}`}
                          type="button"
                          onClick={() => setSourceAtlasThemeFilter(theme)}
                          className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                            sourceAtlasThemeFilter === theme
                              ? "bg-[#f3dfab] text-[#42290a]"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">按时代看</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sourceAtlasEraOptions.slice(0, 4).map((era) => (
                        <button
                          key={`mobile-source-era-${era}`}
                          type="button"
                          onClick={() => setSourceAtlasEraFilter(era)}
                          className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                            sourceAtlasEraFilter === era
                              ? "bg-[#f3dfab] text-[#42290a]"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                          }`}
                        >
                          {era}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {prioritizedSourceAtlasEntries.slice(0, 2).map((entry) => {
                      const isActive = activeSourceAtlasEntry?.id === entry.id;

                      return (
                        <button
                          key={`mobile-atlas-route-${entry.id}`}
                          type="button"
                          onClick={() => handleSourceAtlasSelect(entry.id)}
                          className={`rounded-full px-3 py-1.5 text-[10px] transition ${
                            isActive
                              ? "bg-[#f3dfab] text-[#42290a]"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                          }`}
                        >
                          {entry.name} · {getSourceThemeLabel(entry.name)}
                        </button>
                      );
                    })}
                  </div>
                  {!prioritizedSourceAtlasEntries.length ? (
                    <div className="mt-3 rounded-[16px] border border-dashed border-[#ead8a6]/16 bg-[rgba(255,248,220,0.06)] px-3 py-3 text-[11px] leading-5 text-[#6f4b18]">
                      当前筛选下暂无可用来源支流，换个主题或时代再试。
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
              {selectedBook ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileControls(false);
                      setShowMobileDossier(true);
                    }}
                    className="w-full rounded-[22px] border border-[#b89247]/18 bg-[rgba(255,255,255,0.18)] px-4 py-3 text-left transition hover:bg-[rgba(255,255,255,0.24)]"
                  >
                    <div className="text-[11px] tracking-[0.24em] text-[#8d6a2c]">文卷入口</div>
                    <div className="mt-2 text-sm font-medium text-[#5b3a11]">展开《{selectedBook.shortTitle}》卷内细读</div>
                    <div className="mt-1 text-[11px] leading-5 text-[#6f4b18]">卷内细节放到这里再看，不挡河面。</div>
                  </button>
                </div>
              ) : null}
              {activeDesktopPanel === "search" ? (
                <>
                  <label className="mt-3 block">
                    <span className="text-xs tracking-[0.22em] text-[#d8c9a3]">寻章入河</span>
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
                  {resolvedSearchResult?.hits.length ? (
                    <div className="mt-3 space-y-2">
                      {resolvedSearchResult.hits.slice(0, 3).map((hit) => (
                        <button
                          key={`mobile-search-hit-${hit.slug}`}
                          type="button"
                          onClick={() => {
                            setShowMobileControls(false);
                            handleDiveToBook(hit.slug);
                          }}
                          className="w-full rounded-[20px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-3 text-left transition hover:bg-[rgba(255,248,220,0.12)]"
                        >
                          <div className="text-sm font-medium text-[#fbf3da]">{hit.title}</div>
                          <div className="mt-1 text-[11px] text-[#cdb98d]">
                            {hit.dynasty} · {hit.category} · {hit.school}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : resolvedSearchResult?.query && !searchPending ? (
                    <div className="mt-3 rounded-[20px] border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] px-3 py-3">
                      <div className="text-sm leading-6 text-[#eadfbc]">
                        这一枚概念暂未照见河上节点，换一组相关概念再看河面回响。
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {searchSuggestionChips.slice(0, 3).map((concept) => (
                          <button
                            key={`mobile-fallback-concept-${concept}`}
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
                    onChange={(event) => handleEraFocus(eras[Number(event.target.value)] ?? eras[0])}
                    className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
                  />
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-[#c9b68a]">
                    {eras.map((era) => (
                      <button
                        key={era}
                        type="button"
                        onClick={() => handleEraFocus(era)}
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
                            const target =
                              relationSummary.find((item) => item.layer === layer)?.primaryBranch ?? null;

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
                </>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="pointer-events-none absolute bottom-3 right-3 z-30 md:hidden">
          <div className="pointer-events-auto">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (selectedBook) {
                    setShowMobileControls(false);
                    setShowMobileDossier((current) => !current);
                    return;
                  }

                  setShowMobileDossier(false);
                  setShowMobileControls((current) => !current);
                }}
                className={`min-w-[4.25rem] rounded-[999px] border px-3.5 py-2 text-center shadow-[0_10px_22px_rgba(52,28,6,0.16)] backdrop-blur-xl transition ${
                  showMobileSheet
                    ? "border-[#f0cf75]/30 bg-[linear-gradient(180deg,rgba(244,223,166,0.96),rgba(207,162,70,0.92))] text-[#42290a]"
                    : "border-[#e7c97b]/18 bg-[linear-gradient(180deg,rgba(174,126,46,0.82),rgba(112,75,24,0.78))] text-[#fff0c7]"
                }`}
              >
                <div className="text-[9px] tracking-[0.24em]">
                  {selectedBook ? "卷心印" : "河印"}
                </div>
                <div className="mt-0.5 text-[11px] font-medium">
                  {selectedBook ? selectedBook.shortTitle : "开卷"}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
