"use client";

import { useEffect, useMemo, useState } from "react";

import { PersonNetwork3D } from "@/components/person-network-3d";
import { SpreadGlobe } from "@/components/spread-globe";
import { TraceLightField } from "@/components/trace-light-field";
import { VersionTree } from "@/components/version-tree";
import { buildSourceEvidence } from "@/lib/source-evidence";
import type { BookDetail, BookNode, RiverEra, VersionNode } from "@/types/domain";

const tabs = [
  { id: "spread", label: "地理传播" },
  { id: "people", label: "人物关系" },
  { id: "versions", label: "版本流变" },
  { id: "timeline", label: "关联时间线" },
  { id: "passages", label: "文本溯源" },
] as const;

export type ExplorerTab = (typeof tabs)[number]["id"];
export interface TraceFocusState {
  active: boolean;
  titles: string[];
  currentTitle: string | null;
  currentRelation: string | null;
  progress: number;
  total: number;
}

export interface SceneFocusState {
  active: boolean;
  mode: "spread" | "people" | "versions" | "timeline" | "source";
  currentTitle: string | null;
  contextLabel: string;
  detail: string;
}

export interface ExplorerOpenOptions {
  entryTab?: ExplorerTab | null;
}

const eraOrder: RiverEra[] = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"];
const eraYearRange: Record<RiverEra, { start: number; end: number }> = {
  "先秦": { start: -2000, end: -221 },
  "两汉": { start: -220, end: 220 },
  "魏晋": { start: 221, end: 589 },
  "隋唐": { start: 581, end: 907 },
  "宋元": { start: 960, end: 1368 },
  "明清": { start: 1369, end: 1911 },
  "近现代": { start: 1912, end: 9999 },
};

function inferEraFromYear(year: number): RiverEra {
  const matchedEra = eraOrder.find((era) => {
    const range = eraYearRange[era];
    return year >= range.start && year <= range.end;
  });

  return matchedEra ?? "近现代";
}

function relationTypeClass(type?: string) {
  switch (type) {
    case "著":
      return "bg-emerald-300/12 text-emerald-100";
    case "注":
      return "bg-sky-300/12 text-sky-100";
    case "校":
      return "bg-violet-300/12 text-violet-100";
    case "评":
      return "bg-amber-300/12 text-amber-100";
    default:
      return "bg-white/10 text-stone-200";
  }
}

function confidenceClass(label: string) {
  if (label === "高") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (label === "中") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  return "border-white/10 bg-white/10 text-stone-200";
}

function downstreamConfidenceCardClass(label: string) {
  if (label === "高") {
    return "border-emerald-300/14 bg-emerald-300/6";
  }

  if (label === "中") {
    return "border-amber-300/14 bg-amber-300/6";
  }

  return "border-dashed border-slate-300/18 bg-slate-300/8";
}

function inlineConfidenceClass(label: string) {
  if (label === "高") {
    return "rounded bg-emerald-300/18 px-1.5 py-0.5 text-emerald-100";
  }

  if (label === "中") {
    return "rounded bg-amber-300/18 px-1.5 py-0.5 text-amber-100";
  }

  return "rounded border border-dashed border-white/15 px-1.5 py-0.5 text-stone-300";
}

function passageHighlightClass(label: string, active: boolean) {
  if (label === "高") {
    return active
      ? "border-emerald-200/45 bg-emerald-300/30 text-emerald-50 shadow-[0_0_0_1px_rgba(167,243,208,0.32)]"
      : "border-emerald-300/22 bg-emerald-300/14 text-emerald-100";
  }

  if (label === "中") {
    return active
      ? "border-amber-200/45 bg-amber-300/30 text-amber-50 shadow-[0_0_0_1px_rgba(253,230,138,0.28)]"
      : "border-amber-300/22 bg-amber-300/14 text-amber-100";
  }

  return active
    ? "border-stone-200/35 bg-stone-300/20 text-stone-100 shadow-[0_0_0_1px_rgba(231,229,228,0.2)]"
    : "border-dashed border-white/14 bg-white/8 text-stone-300";
}

function splitPassageIntoSegments(original: string, linkCount: number) {
  if (linkCount <= 0) {
    return [original];
  }

  const punctuationSegments = original
    .split(/(?<=[，。？！；])/u)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (punctuationSegments.length >= linkCount) {
    return punctuationSegments;
  }

  const characters = Array.from(original);
  const chunkSize = Math.max(1, Math.ceil(characters.length / linkCount));
  const segments: string[] = [];

  for (let index = 0; index < characters.length; index += chunkSize) {
    segments.push(characters.slice(index, index + chunkSize).join(""));
  }

  return segments;
}

function versionTypeClass(type?: string) {
  switch (type) {
    case "祖本":
      return "bg-amber-300/12 text-amber-100";
    case "刻本":
      return "bg-sky-300/12 text-sky-100";
    case "抄本":
      return "bg-violet-300/12 text-violet-100";
    case "重刊本":
      return "bg-emerald-300/12 text-emerald-100";
    case "整理本":
      return "bg-cyan-300/12 text-cyan-100";
    default:
      return "bg-white/10 text-stone-200";
  }
}

function sourceBadgeClass(source: "real" | "curated" | "hybrid") {
  if (source === "real") {
    return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  }

  if (source === "hybrid") {
    return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  }

  return "border-white/10 bg-white/10 text-stone-300";
}

function spreadSourceMeta(hasVenueSignals: boolean) {
  if (hasVenueSignals) {
    return {
      label: "传播河势与场馆实录",
      tone: "hybrid" as const,
      detail: "传播河段已与场馆实录、活动线索合流，城与事会在同一卷面上显出扩散去向。",
    };
  }

  return {
    label: "传播河势",
    tone: "curated" as const,
    detail: "这一层先以传播河段与地理叙事托住主线，扩散路径会顺着河道自行铺开。",
  };
}

function versionSourceMeta(library: string) {
  if (library.includes("上海") || library.includes("图书馆") || library.includes("馆")) {
    return {
      label: "馆藏与书目实录",
      tone: "hybrid" as const,
      detail: "版本链已经落到具体馆藏与系统名录，流变位置会沿版本与馆藏双线显影。",
    };
  }

  return {
    label: "版本流变",
    tone: "curated" as const,
    detail: "这一层以版本先后与流变结构托住主线，祖本与后续分化会依次浮出。",
  };
}

function versionStatusMeta(status: VersionNode["status"]) {
  if (status === "存世") {
    return {
      badge: "今有存本",
      badgeClass: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
      detail: "这层版本今天仍可见实物或馆藏记录，是版本长链中的清晰落点。",
    };
  }

  return {
    badge: "仅见佚痕",
    badgeClass: "border-slate-300/18 bg-slate-300/10 text-slate-100",
    detail: "这层版本主要凭前后关系与文献记载显出佚痕，正好标记失传层与断裂处。",
  };
}

function formatVersionYear(year: number) {
  return year < 0 ? `前${Math.abs(year)}年` : `${year}年`;
}

function timelineSourceMeta(source?: "curated" | "cbdb") {
  if (source === "cbdb") {
    return {
      label: "人物纪传信号",
      tone: "real" as const,
      detail: "这条时间回声来自真实纪传中的时间与地点线索，足以托住传播叙事。",
    };
  }

  return {
    label: "叙事时间节点",
    tone: "curated" as const,
    detail: "该事件负责补齐典籍叙事主线，让整段年代脉络保持连贯。",
  };
}

export function BookExplorer({
  book,
  detail,
  forcedTab,
  activeEra,
  onRequestEraChange,
  onTraceFocusChange,
  onSceneFocusChange,
  onOpenBook,
}: {
  book: BookNode;
  detail: BookDetail;
  forcedTab?: ExplorerTab | null;
  activeEra: RiverEra;
  onRequestEraChange?: (era: RiverEra) => void;
  onTraceFocusChange?: (focus: TraceFocusState | null) => void;
  onSceneFocusChange?: (focus: SceneFocusState | null) => void;
  onOpenBook?: (slug: string, options?: ExplorerOpenOptions) => void;
}) {
  const [tab, setTab] = useState<ExplorerTab>(forcedTab ?? "spread");
  const [passageLayout, setPassageLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [selectedSpreadId, setSelectedSpreadId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [selectedSourceEvidenceId, setSelectedSourceEvidenceId] = useState<string | null>(null);
  const [selectedInstitutionRecordId, setSelectedInstitutionRecordId] = useState<string | null>(
    null,
  );
  const [traceStep, setTraceStep] = useState<number>(0);
  const [tracePlaying, setTracePlaying] = useState(false);
  const [showSecondaryPeople, setShowSecondaryPeople] = useState(false);

  const bookEraByTitle = useMemo(() => {
    return new Map<string, RiverEra>([
      ["诗经", "先秦"],
      ["尚书", "先秦"],
      ["周易", "先秦"],
      ["论语", "先秦"],
      ["礼记", "两汉"],
      ["孝经", "两汉"],
      ["大学", "两汉"],
      ["中庸", "两汉"],
      ["史记", "两汉"],
      ["春秋左传", "先秦"],
      ["左传", "先秦"],
      ["论语集注", "宋元"],
      ["四书章句集注", "宋元"],
      ["孟子", "先秦"],
      ["资治通鉴", "宋元"],
      ["日知录", "明清"],
      ["人间词话", "近现代"],
      ["明内府本四书章句", "明清"],
    ]);
  }, []);
  const bookSlugByTitle = useMemo(() => {
    return new Map<string, string>([
      ["诗经", "shijing"],
      ["尚书", "shangshu"],
      ["周易", "zhouyi"],
      ["论语", "lunyu"],
      ["礼记", "liji"],
      ["孝经", "xiaojing"],
      ["大学", "daxue"],
      ["中庸", "zhongyong"],
      ["史记", "shiji"],
      ["春秋左传", "zuozhuan"],
      ["左传", "zuozhuan"],
      ["论语集注", "lunyu-jizhu"],
      ["四书章句集注", "sishu-zhangju"],
      ["孟子", "mengzi"],
      ["资治通鉴", "zi-zhi-tong-jian"],
      ["日知录", "ri-zhi-lu"],
      ["人间词话", "ren-jian-ci-hua"],
    ]);
  }, []);
  const activeEraIndex = eraOrder.indexOf(activeEra);
  const activeEraRange = eraYearRange[activeEra];
  const visibleSpread = useMemo(
    () => detail.spread.filter((item) => item.startYear <= activeEraRange.end),
    [activeEraRange.end, detail.spread],
  );
  const visiblePeople = useMemo(() => {
    return detail.people.filter((person) => {
      if (person.birthYear || person.deathYear) {
        const first = person.birthYear ?? person.deathYear ?? activeEraRange.start;
        return first <= activeEraRange.end;
      }

      return eraOrder.findIndex((era) => person.era.includes(era)) <= activeEraIndex;
    });
  }, [activeEraIndex, activeEraRange.end, activeEraRange.start, detail.people]);
  const visibleVersions = useMemo(
    () => detail.versions.filter((version) => version.year <= activeEraRange.end),
    [activeEraRange.end, detail.versions],
  );
  const visibleTimeline = useMemo(
    () => detail.timeline.filter((item) => item.year <= activeEraRange.end),
    [activeEraRange.end, detail.timeline],
  );
  const visiblePassages = useMemo(() => {
    return detail.passages
      .map((passage) => {
        const links = passage.links.filter((link) => {
          const sourceEra = bookEraByTitle.get(link.sourceTitle);
          return sourceEra ? eraOrder.indexOf(sourceEra) <= activeEraIndex : true;
        });
        const tracePath = passage.tracePath?.filter((trace) => {
          const traceEra = bookEraByTitle.get(trace.title);
          return traceEra ? eraOrder.indexOf(traceEra) <= activeEraIndex : true;
        });
        const downstreamInfluence = passage.downstreamInfluence?.filter((item) => {
          const targetEra = bookEraByTitle.get(item.targetTitle);
          return targetEra ? eraOrder.indexOf(targetEra) <= activeEraIndex : true;
        });

        if (links.length === 0 && (tracePath?.length ?? 0) === 0 && (downstreamInfluence?.length ?? 0) === 0) {
          return null;
        }

        return {
          ...passage,
          links,
          tracePath,
          downstreamInfluence,
        };
      })
      .filter((passage): passage is NonNullable<typeof passage> => Boolean(passage));
  }, [activeEraIndex, bookEraByTitle, detail.passages]);
  const primaryPeople = visiblePeople.filter((person) => (person.relationTier ?? 2) === 1);
  const secondaryPeople = visiblePeople.filter((person) => (person.relationTier ?? 2) === 2);
  const resolvedSpreadId =
    selectedSpreadId && visibleSpread.some((item) => item.id === selectedSpreadId)
      ? selectedSpreadId
      : null;
  const resolvedVersionId =
    selectedVersionId && visibleVersions.some((item) => item.id === selectedVersionId)
      ? selectedVersionId
      : null;
  const resolvedTimelineId =
    selectedTimelineId && visibleTimeline.some((item) => item.id === selectedTimelineId)
      ? selectedTimelineId
      : null;
  const resolvedPersonId =
    selectedPersonId && visiblePeople.some((person) => person.id === selectedPersonId)
      ? selectedPersonId
      : null;
  const activePerson =
    visiblePeople.find((person) => person.id === resolvedPersonId) ?? visiblePeople[0];
  const activeSpread =
    visibleSpread.find((item) => item.id === resolvedSpreadId) ?? visibleSpread[0];
  const activeVersion =
    visibleVersions.find((item) => item.id === resolvedVersionId) ?? visibleVersions[0];
  const orderedVisibleVersions = useMemo(
    () => [...visibleVersions].sort((left, right) => left.year - right.year),
    [visibleVersions],
  );
  const activeVersionSequenceIndex = activeVersion
    ? orderedVisibleVersions.findIndex((version) => version.id === activeVersion.id)
    : -1;
  const activeTimelineItem =
    visibleTimeline.find((item) => item.id === resolvedTimelineId) ?? visibleTimeline[0];
  const activeTimelineIndex = activeTimelineItem
    ? visibleTimeline.findIndex((item) => item.id === activeTimelineItem.id)
    : -1;
  const activeTimelineWindow = activeTimelineItem
    ? visibleTimeline.slice(
        Math.max(0, activeTimelineIndex - 1),
        Math.min(visibleTimeline.length, activeTimelineIndex + 2),
      )
    : visibleTimeline.slice(0, 3);
  const activeSpreadPlaces = useMemo(() => {
    if (!activeSpread) {
      return null;
    }

    return {
      from: detail.places.find((place) => place.id === activeSpread.fromPlaceId),
      to: detail.places.find((place) => place.id === activeSpread.toPlaceId),
    };
  }, [activeSpread, detail.places]);
  const activeSpreadIndex = activeSpread
    ? visibleSpread.findIndex((item) => item.id === activeSpread.id)
    : -1;
  const activePassage = useMemo(() => {
    return visiblePassages.find((passage) => passage.id === selectedPassageId) ?? visiblePassages[0];
  }, [selectedPassageId, visiblePassages]);
  const activePassageId = activePassage?.id ?? null;
  const activePassageSequenceIndex = activePassage
    ? visiblePassages.findIndex((passage) => passage.id === activePassage.id)
    : -1;
  const activeLink = useMemo(() => {
    return activePassage?.links.find((link) => link.id === selectedLinkId) ?? activePassage?.links[0];
  }, [activePassage, selectedLinkId]);
  const activeLinkId = activeLink?.id ?? null;
  const activePassageSequenceWindow = activePassage
    ? visiblePassages.slice(
        Math.max(0, activePassageSequenceIndex - 1),
        Math.min(visiblePassages.length, activePassageSequenceIndex + 2),
      )
    : visiblePassages.slice(0, 3);
  const activePassageSegments = useMemo(() => {
    if (!activePassage) {
      return [];
    }

    const baseSegments = splitPassageIntoSegments(
      activePassage.original,
      activePassage.links.length,
    );

    return baseSegments.map((text, index) => ({
      text,
      link: activePassage.links[index] ?? null,
    }));
  }, [activePassage]);
  const activeTab = tab;
  const activeTraceFocus = useMemo<TraceFocusState | null>(() => {
    if (activeTab !== "passages" || !activePassage?.tracePath?.length || !tracePlaying) {
      return null;
    }

    const currentIndex = Math.min(traceStep, activePassage.tracePath.length - 1);
    const currentTrace = activePassage.tracePath[currentIndex];

    return {
      active: true,
      titles: [book.title, ...activePassage.tracePath.map((trace) => trace.title)],
      currentTitle: currentTrace?.title ?? null,
      currentRelation: currentTrace?.relation ?? null,
      progress: currentIndex + 1,
      total: activePassage.tracePath.length,
    };
  }, [activePassage, activeTab, book.title, tracePlaying, traceStep]);
  const activeSceneFocus = useMemo<SceneFocusState | null>(() => {
    if (activeTraceFocus?.active) {
      return null;
    }

    if (activeTab === "spread" && activeSpread && activeSpreadPlaces?.from && activeSpreadPlaces.to) {
      return {
        active: true,
        mode: "spread",
        currentTitle: book.title,
        contextLabel: `传播联动：${activeSpreadPlaces.from.name} 至 ${activeSpreadPlaces.to.name}`,
        detail: `${activeSpread.startYear} 至 ${activeSpread.endYear} 的传播河段已回灌主河主脉。`,
      };
    }

    if (activeTab === "people" && activePerson) {
      return {
        active: true,
        mode: "people",
        currentTitle: book.title,
        contextLabel: `人物联动：${activePerson.name}`,
        detail: `${activePerson.name} 的人物层级与角色正在牵引主河镜头回到这部典籍。`,
      };
    }

    if (activeTab === "versions" && activeVersion) {
      return {
        active: true,
        mode: "versions",
        currentTitle: book.title,
        contextLabel: `版本联动：${activeVersion.label}`,
        detail: `${activeVersion.year} 年的版本节点已映射回主河道，强化典籍在流变链中的位置。`,
      };
    }

    if (activeTab === "timeline" && activeTimelineItem) {
      return {
        active: true,
        mode: "timeline",
        currentTitle: book.title,
        contextLabel: `时间联动：${activeTimelineItem.title}`,
        detail: `${activeTimelineItem.year} 年的事件回声正把主河镜头重新引向这部典籍。`,
      };
    }

    return null;
  }, [
    activePerson,
    activeSpread,
    activeSpreadPlaces,
    activeTab,
    activeTimelineItem,
    activeTraceFocus?.active,
    activeVersion,
    book.title,
  ]);

  useEffect(() => {
    if (!activePassage?.tracePath?.length || !tracePlaying) {
      return;
    }

    const timer = window.setInterval(() => {
      setTraceStep((current) => {
        if (current >= activePassage.tracePath!.length - 1) {
          window.setTimeout(() => {
            setTracePlaying(false);
          }, 260);
          return current;
        }

        return current + 1;
      });
    }, 900);

    return () => window.clearInterval(timer);
  }, [activePassage?.id, activePassage?.tracePath, tracePlaying]);

  useEffect(() => {
    onTraceFocusChange?.(activeTraceFocus);

    return () => {
      onTraceFocusChange?.(null);
    };
  }, [activeTraceFocus, onTraceFocusChange]);

  useEffect(() => {
    onSceneFocusChange?.(activeSceneFocus);

    return () => {
      onSceneFocusChange?.(null);
    };
  }, [activeSceneFocus, onSceneFocusChange]);
  const sourceBadges = detail.realWorldSignals?.sourceLabel
    ? detail.realWorldSignals.sourceLabel.split("+").map((item) => item.trim()).filter(Boolean)
    : [];
  const sourceLabelDisplay = (() => {
    if (!sourceBadges.length) {
      return "";
    }

    if (sourceBadges.length === 1) {
      return sourceBadges[0] ?? "";
    }

    if (sourceBadges.length === 2) {
      return `${sourceBadges[0]}与${sourceBadges[1]}`;
    }

    return `${sourceBadges.slice(0, -1).join("、")}与${sourceBadges[sourceBadges.length - 1]}`;
  })();
  const sourceEvidence = useMemo(() => buildSourceEvidence(detail), [detail]);
  const institutionRecords = useMemo(
    () => detail.realWorldSignals?.institutionSamples ?? [],
    [detail.realWorldSignals?.institutionSamples],
  );
  const venuePreview = useMemo(
    () => detail.realWorldSignals?.venueSamples?.slice(0, 3) ?? [],
    [detail.realWorldSignals?.venueSamples],
  );
  const eventPreview = useMemo(
    () => detail.realWorldSignals?.eventSamples?.slice(0, 3) ?? [],
    [detail.realWorldSignals?.eventSamples],
  );
  const institutionPreview = useMemo(() => institutionRecords.slice(0, 3), [institutionRecords]);
  const dossierEntryCards = [
    {
      label: `${book.dynasty} · ${book.category}`,
      onClick: () => setTab("timeline"),
    },
    {
      label: book.school,
      onClick: () => setTab("people"),
    },
  ] as const;
  const eraLinkedSummary = {
    spread: visibleSpread.length,
    people: visiblePeople.length,
    versions: visibleVersions.length,
    timeline: visibleTimeline.length,
    passages: visiblePassages.length,
  };
  const handleSelectPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    setSelectedLinkId(null);
    setTraceStep(0);
    setTracePlaying(false);
  };

  const handleSelectLink = (linkId: string) => {
    setSelectedLinkId(linkId);
  };
  const handleFocusFirstLinkByConfidence = (confidenceLabel: "高" | "中" | "低") => {
    const targetLink = activePassage?.links.find((link) => link.confidenceLabel === confidenceLabel);

    if (!targetLink) {
      return;
    }

    handleSelectLink(targetLink.id);
  };
  const handleOpenLinkedBook = () => {
    if (!activeLink?.sourceBookId) {
      return;
    }

    onOpenBook?.(activeLink.sourceBookId, { entryTab: "passages" });
  };
  const handleOpenSpecificLinkedBook = (sourceBookId: string) => {
    onOpenBook?.(sourceBookId, { entryTab: "passages" });
  };
  const handleOpenDownstreamBook = (targetTitle: string) => {
    const targetSlug = bookSlugByTitle.get(targetTitle);

    if (!targetSlug) {
      return;
    }

    onOpenBook?.(targetSlug, { entryTab: "people" });
  };
  const handleOpenTraceBook = (traceTitle: string) => {
    const targetSlug = bookSlugByTitle.get(traceTitle);

    if (!targetSlug) {
      return;
    }

    onOpenBook?.(targetSlug, { entryTab: "passages" });
  };
  const handleSelectInstitutionRecord = (record: {
    institution: string;
    title: string;
    imageRef?: string;
    sourceText?: string;
  }) => {
    const recordId = `${record.institution}-${record.title}-${record.imageRef ?? record.sourceText ?? "trace"}`;
    setSelectedInstitutionRecordId(recordId);
    setSelectedSourceEvidenceId("institution-samples");
  };
  const handleFocusEventEvidence = () => {
    setSelectedSourceEvidenceId("event-samples");
  };
  const handleSelectTimelineItem = (timelineId: string) => {
    const targetTimeline = detail.timeline.find((item) => item.id === timelineId);

    if (targetTimeline) {
      onRequestEraChange?.(inferEraFromYear(targetTimeline.year));
    }

    setSelectedTimelineId(timelineId);
  };
  const handleSelectEventSample = (event: {
    venue: string;
    title: string;
    status: string;
    startTime: string;
  }) => {
    const matchedTimeline =
      visibleTimeline.find((item) => {
        return (
          event.startTime.includes(String(item.year)) ||
          item.title.includes(event.title) ||
          event.title.includes(item.title)
        );
      }) ?? null;

    if (matchedTimeline?.id) {
      handleSelectTimelineItem(matchedTimeline.id);
    }

    setSelectedSourceEvidenceId("event-samples");
  };
  const handleFocusCbdbEvidence = (personId?: string | null) => {
    setSelectedSourceEvidenceId("cbdb-people");

    if (personId) {
      setSelectedPersonId(personId);
    }
  };
  const handleOpenSourceEvidence = (evidenceId: string) => {
    setSelectedSourceEvidenceId(evidenceId);

    if (evidenceId === "cbdb-people") {
      if (visiblePeople[0]?.id) {
        setSelectedPersonId(visiblePeople[0].id);
      }
      setTab("people");
      return;
    }

    if (evidenceId === "venue-samples") {
      if (visibleSpread[0]?.id) {
        setSelectedSpreadId(visibleSpread[0].id);
      }
      setTab("spread");
      return;
    }

    if (evidenceId === "event-samples") {
      if (visibleTimeline[0]?.id) {
        handleSelectTimelineItem(visibleTimeline[0].id);
      }
      setTab("timeline");
      return;
    }

    if (evidenceId === "institution-samples") {
      const firstInstitutionRecord = institutionRecords[0];

      if (firstInstitutionRecord) {
        handleSelectInstitutionRecord(firstInstitutionRecord);
      }

      if (visibleVersions[0]?.id) {
        setSelectedVersionId(visibleVersions[0].id);
      }
      setTab("versions");
    }
  };
  const handleOpenSourceSample = (evidenceId: string, sample: { label: string; detail?: string }) => {
    if (evidenceId === "cbdb-people") {
      const targetPerson = sample.label.includes("纪传命中")
        ? visiblePeople.find((person) => person.source === "cbdb") ?? visiblePeople[0]
        : visiblePeople.find((person) => person.source !== "cbdb") ?? visiblePeople[0];

      if (targetPerson?.id) {
        setSelectedPersonId(targetPerson.id);
      }

      setSelectedSourceEvidenceId("cbdb-people");
      setTab("people");
      return;
    }

    if (evidenceId === "venue-samples") {
      const targetVenue = detail.realWorldSignals?.venueSamples?.find((item) => item.name === sample.label);
      const linkedSpread = targetVenue ? linkedVenueSpreadMap.get(targetVenue.name) : null;

      if (linkedSpread?.id) {
        setSelectedSpreadId(linkedSpread.id);
      }

      setSelectedSourceEvidenceId("venue-samples");
      setTab("spread");
      return;
    }

    if (evidenceId === "event-samples") {
      const targetEvent = detail.realWorldSignals?.eventSamples?.find((item) => item.title === sample.label);

      if (targetEvent) {
        handleSelectEventSample(targetEvent);
      } else {
        setSelectedSourceEvidenceId("event-samples");
      }

      setTab("timeline");
      return;
    }

    if (evidenceId === "institution-samples") {
      const targetRecord = institutionRecords.find((item) => item.title === sample.label);

      if (targetRecord) {
        handleSelectInstitutionRecord(targetRecord);
      }

      if (visibleVersions[0]?.id) {
        setSelectedVersionId(visibleVersions[0].id);
      }

      setTab("versions");
    }
  };
  const handleSelectSpreadIndex = (index: number) => {
    const nextSpread = visibleSpread[index];

    if (!nextSpread) {
      return;
    }

    setSelectedSpreadId(nextSpread.id);
  };
  const handleStartTrace = () => {
    if (!activePassage?.tracePath?.length) {
      return;
    }

    setTraceStep(0);
    setTracePlaying(true);
  };
  const spreadMeta = spreadSourceMeta(Boolean(detail.realWorldSignals?.venueSamples?.length));
  const activeVersionMeta = activeVersion ? versionSourceMeta(activeVersion.library) : null;
  const activeVersionStatusMeta = activeVersion
    ? versionStatusMeta(activeVersion.status)
    : null;
  const activeTimelineMeta = activeTimelineItem
    ? timelineSourceMeta(activeTimelineItem.source)
    : null;
  const activeSourceEvidence =
    sourceEvidence.find((item) => item.id === selectedSourceEvidenceId) ?? sourceEvidence[0] ?? null;
  const activeSourceEvidenceIndex = activeSourceEvidence
    ? sourceEvidence.findIndex((item) => item.id === activeSourceEvidence.id)
    : -1;
  const activeSourceEvidenceWindow = activeSourceEvidence
    ? sourceEvidence.slice(
        Math.max(0, activeSourceEvidenceIndex - 1),
        Math.min(sourceEvidence.length, activeSourceEvidenceIndex + 2),
      )
    : sourceEvidence.slice(0, 3);
  const activeInstitutionRecord =
    institutionRecords.find(
      (item) =>
        `${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}` ===
        selectedInstitutionRecordId,
    ) ??
    institutionRecords[0] ??
    null;
  const activeInstitutionRecordIndex = activeInstitutionRecord
    ? institutionRecords.findIndex((item) => {
        return (
          `${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}` ===
          `${activeInstitutionRecord.institution}-${activeInstitutionRecord.title}-${activeInstitutionRecord.imageRef ?? activeInstitutionRecord.sourceText ?? "trace"}`
        );
      })
    : -1;
  const activeVersionParent = activeVersion?.parentId
    ? visibleVersions.find((version) => version.id === activeVersion.parentId) ?? null
    : null;
  const activeVersionChildren = activeVersion
    ? visibleVersions
        .filter((version) => version.parentId === activeVersion.id)
        .sort((left, right) => left.year - right.year)
    : [];
  const activeVersionSequenceWindow = activeVersion
    ? orderedVisibleVersions.slice(
        Math.max(0, activeVersionSequenceIndex - 1),
        Math.min(orderedVisibleVersions.length, activeVersionSequenceIndex + 2),
      )
    : orderedVisibleVersions.slice(0, 3);
  const activeVersionTrail = activeVersion
    ? (() => {
        const trail: VersionNode[] = [];
        let cursor: VersionNode | null = activeVersion;

        while (cursor) {
          trail.unshift(cursor);
          cursor = cursor.parentId
            ? visibleVersions.find((version) => version.id === cursor?.parentId) ?? null
            : null;
        }

        return trail;
      })()
    : [];
  const versionEvidenceSamples = activeVersion
    ? (detail.realWorldSignals?.institutionSamples ?? [])
        .filter((item) => {
          const normalizedLibrary = activeVersion.library.toLowerCase();
          const normalizedPlace = activeVersion.place.toLowerCase();
          const normalizedInstitution = item.institution.toLowerCase();
          const normalizedTitle = item.title.toLowerCase();

          return (
            normalizedInstitution.includes(normalizedLibrary) ||
            normalizedLibrary.includes(normalizedInstitution) ||
            normalizedTitle.includes(book.title.toLowerCase()) ||
            normalizedInstitution.includes(normalizedPlace) ||
            item.year === String(activeVersion.year)
          );
        })
        .slice(0, 4)
    : [];
  const activeTimelineEventEchoes = activeTimelineItem
    ? eventPreview.filter((event) => event.startTime?.includes(String(activeTimelineItem.year))).slice(0, 2)
    : [];
  const activeTimelineInstitutionEchoes = activeTimelineItem
    ? institutionRecords
        .filter((item) => {
          if (!item.year) {
            return false;
          }

          return item.year.includes(String(activeTimelineItem.year));
        })
        .slice(0, 2)
    : [];
  const fallbackTimelineInstitutionEchoes = institutionPreview.slice(0, 2);
  const linkedVersionFromInstitution = activeInstitutionRecord
    ? visibleVersions.find((version) => {
        if (!activeInstitutionRecord.year) {
          return false;
        }

        const versionYear = String(version.year);
        const normalizedLibrary = version.library.toLowerCase();
        const normalizedInstitution = activeInstitutionRecord.institution.toLowerCase();

        return (
          activeInstitutionRecord.year.includes(versionYear) ||
          normalizedInstitution.includes(normalizedLibrary) ||
          normalizedLibrary.includes(normalizedInstitution)
        );
      }) ?? null
    : null;
  const linkedTimelineFromInstitution = activeInstitutionRecord
    ? visibleTimeline.find((item) => {
        if (!activeInstitutionRecord.year) {
          return false;
        }

        return activeInstitutionRecord.year.includes(String(item.year));
      }) ?? null
    : null;
  const activeInstitutionPreviewTone = activeInstitutionRecord?.imageRef
    ? "影像卷面"
    : activeInstitutionRecord?.sourceText
      ? "馆藏线索"
      : "馆藏摘记";
  const activeInstitutionPreviewText = activeInstitutionRecord
    ? activeInstitutionRecord.sourceText ??
      (activeInstitutionRecord.imageRef
        ? `影像号 ${activeInstitutionRecord.imageRef} 已与 ${activeInstitutionRecord.institution} 的馆藏线索相互扣合。`
        : "馆藏条目已经落到版本脉络中，卷内位置与流变先后彼此对应。")
    : null;
  const activeInstitutionPreviewWindow = activeInstitutionRecord
    ? institutionRecords
        .slice(
          Math.max(0, activeInstitutionRecordIndex - 1),
          Math.min(institutionRecords.length, activeInstitutionRecordIndex + 2),
        )
    : institutionPreview;
  const activeVersionPrimaryRecord =
    versionEvidenceSamples[0] ?? activeInstitutionRecord ?? institutionPreview[0] ?? null;
  const activeVersionGalleryRecords = (
    versionEvidenceSamples.length ? versionEvidenceSamples : activeInstitutionPreviewWindow
  ).slice(0, 3);
  const activeVersionVisualBadge = activeVersionPrimaryRecord?.imageRef
    ? `影像号 ${activeVersionPrimaryRecord.imageRef}`
    : activeVersionPrimaryRecord?.category ?? "馆藏卷录";
  const activeVersionArchiveSummary = activeVersionPrimaryRecord
    ? [
        activeVersionPrimaryRecord.institution,
        activeVersionPrimaryRecord.year,
        activeVersionPrimaryRecord.category,
      ]
        .filter(Boolean)
        .join(" · ")
    : `${activeVersion?.place ?? "版本河段"} · ${activeVersion?.library ?? "版本系统"}`;
  const linkedVenueEventMap = new Map(
    venuePreview.map((venue) => {
      const matchedEvents = (detail.realWorldSignals?.eventSamples ?? []).filter(
        (event) => event.venue === venue.name,
      );

      return [venue.name, matchedEvents] as const;
    }),
  );
  const linkedVenueSpreadMap = new Map(
    venuePreview.map((venue) => {
      const matchedSpread =
        visibleSpread.find((item) => {
          const fromPlace = detail.places.find((place) => place.id === item.fromPlaceId);
          const toPlace = detail.places.find((place) => place.id === item.toPlaceId);
          const target = venue.name.toLowerCase();

          return (
            fromPlace?.name.toLowerCase().includes(target) ||
            toPlace?.name.toLowerCase().includes(target) ||
            fromPlace?.note.toLowerCase().includes(target) ||
            toPlace?.note.toLowerCase().includes(target)
          );
        }) ??
        activeSpread ??
        visibleSpread[0] ??
        null;

      return [venue.name, matchedSpread] as const;
    }),
  );
  const linkedPersonSpread = activePerson?.activityPlaces?.length
    ? visibleSpread.find((item) => {
        const fromPlace = detail.places.find((place) => place.id === item.fromPlaceId);
        const toPlace = detail.places.find((place) => place.id === item.toPlaceId);

        return activePerson.activityPlaces?.some((place) => {
          const placeName = place.name.toLowerCase();

          return (
            fromPlace?.name.toLowerCase().includes(placeName) ||
            toPlace?.name.toLowerCase().includes(placeName) ||
            fromPlace?.note.toLowerCase().includes(placeName) ||
            toPlace?.note.toLowerCase().includes(placeName)
          );
        });
      }) ?? null
    : null;
  const secondaryPeopleExpanded =
    showSecondaryPeople || (activePerson?.relationTier ?? 2) === 2;
  const visibleSecondaryPeople = secondaryPeopleExpanded ? secondaryPeople : [];
  const activeTabMeta = tabs.find((item) => item.id === activeTab) ?? tabs[0];

  return (
    <div className="relative space-y-4">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(233,202,128,0.55),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 left-2 hidden w-px bg-[linear-gradient(180deg,transparent,rgba(180,136,53,0.22),transparent)] xl:block" />
      <div className="pointer-events-none absolute inset-y-0 right-2 hidden w-px bg-[linear-gradient(180deg,transparent,rgba(180,136,53,0.18),transparent)] xl:block" />
      <section className="overflow-hidden rounded-[28px] border border-[#d5b46f]/28 bg-[linear-gradient(180deg,rgba(247,235,200,0.98),rgba(232,208,151,0.96))] px-5 py-5 text-[#4a2c08] shadow-[inset_0_1px_0_rgba(255,255,255,0.26),0_18px_42px_rgba(79,52,16,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-[0.3em] text-[#8d6a2c]">
              卷首题签
            </p>
            <h2 className="mt-2 text-[clamp(1.7rem,3vw,2.5rem)] font-semibold text-[#4a2c08]">
              {book.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#6b4b1d]">{book.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("spread")}
                className="rounded-full border border-[#caa45b]/24 bg-white/35 px-3 py-1.5 text-xs text-[#6b4b1d] transition hover:bg-white/50"
              >
                传播河段
              </button>
              <button
                type="button"
                onClick={() => setTab("passages")}
                className="rounded-full border border-[#caa45b]/24 bg-white/35 px-3 py-1.5 text-xs text-[#6b4b1d] transition hover:bg-white/50"
              >
                文本溯源
              </button>
            </div>
          </div>
          <div className="grid gap-2 text-xs text-[#6b4b1d]">
            {dossierEntryCards.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="rounded-full border border-[#caa45b]/24 bg-white/30 px-3 py-1 text-left transition hover:bg-white/45"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#e1bd6e]/18 bg-[linear-gradient(180deg,rgba(214,170,84,0.2),rgba(98,65,20,0.24))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,245,215,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.2em] text-amber-100/75">
              卷中时代
            </div>
            <div className="mt-1 text-sm font-medium text-amber-50">
              卷中脉络已推至 {activeEra}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab("timeline")}
            className="rounded-full border border-[#d7b066]/24 bg-[rgba(252,220,124,0.12)] px-3 py-1 text-xs text-[#f7e4a7] transition hover:bg-[rgba(252,220,124,0.18)]"
          >
            可见年段 {eraLinkedSummary.timeline || 1} 条
          </button>
        </div>
        <div className="mt-3 rounded-[20px] border border-[#ead8a6]/12 bg-[linear-gradient(180deg,rgba(72,45,14,0.34),rgba(44,27,9,0.28))] px-3 py-3 text-sm leading-7 text-[#f6e8bd]">
          这一时代已显出 {eraLinkedSummary.spread} 段传播、{eraLinkedSummary.people} 位人物、{eraLinkedSummary.versions} 个版本节点与 {eraLinkedSummary.passages} 个文本片段，
          此刻卷心落在 {activeTabMeta.label}。
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-3 py-2 text-xs transition ${
                activeTab === item.id
                  ? "bg-[#f3dfab] text-[#42290a]"
                  : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {detail.realWorldSignals ? (
        <section className="rounded-[24px] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(183,129,39,0.14),rgba(77,49,15,0.16))] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.2em] text-amber-100/80">
                卷旁实证
              </div>
              <button
                type="button"
                onClick={() => handleOpenSourceEvidence(activeSourceEvidence?.id ?? "institution-samples")}
                className="mt-1 text-left text-sm font-medium text-amber-50 transition hover:text-[#fff2c7]"
              >
                {sourceLabelDisplay}
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSourceEvidence(activeSourceEvidence?.id ?? "institution-samples")}
              className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100 transition hover:bg-amber-300/18"
            >
              卷旁映照
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sourceBadges.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleOpenSourceEvidence("institution-samples")}
                className="rounded-full border border-amber-300/15 bg-black/15 px-3 py-1 text-xs text-amber-100 transition hover:bg-white/10"
              >
                {item}
              </button>
            ))}
          </div>
          {detail.realWorldSignals.venueSummary ? (
            <p className="mt-3 text-sm leading-7 text-amber-50/90">
              {detail.realWorldSignals.venueSummary}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleOpenSourceEvidence("cbdb-people")}
              className="rounded-2xl border border-amber-300/10 bg-black/15 px-3 py-3 text-left transition hover:bg-white/10"
            >
              <div className="text-xs tracking-[0.2em] text-amber-100/70">
                人物纪传
              </div>
              <div className="mt-2 text-sm text-stone-100">
                纪传库对照 {detail.realWorldSignals.cbdbMatchedPeople ?? 0} 人
              </div>
              <div className="mt-1 text-xs text-stone-400">
                旁支人物回声 {detail.realWorldSignals.cbdbFallbackPeople ?? 0} 人
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleOpenSourceEvidence("venue-samples")}
              className="rounded-2xl border border-amber-300/10 bg-black/15 px-3 py-3 text-left transition hover:bg-white/10"
            >
              <div className="text-xs tracking-[0.2em] text-amber-100/70">
                传播现场
              </div>
              <div className="mt-2 text-sm text-stone-100">
                {detail.realWorldSignals.venueSamples?.length
                  ? `上图场馆资料 ${detail.realWorldSignals.venueSamples.length} 组`
                  : "场馆实录"}
              </div>
              <div className="mt-1 text-xs text-stone-400">
                活动事件资料 {detail.realWorldSignals.eventSamples?.length ?? 0} 条
              </div>
            </button>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <div className="rounded-2xl border border-amber-300/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.2em] text-amber-100/75">
                  场馆来源
                </div>
                <div className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                  {detail.realWorldSignals.venueSamples?.length ?? 0} 组
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {venuePreview.length ? (
                  venuePreview.map((venue) => (
                    <button
                      key={venue.name}
                      type="button"
                      onClick={() =>
                        handleOpenSourceSample("venue-samples", {
                          label: venue.name,
                          detail: `卷中回声 ${venue.sampleCount}`,
                        })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm transition hover:bg-white/10"
                    >
                      <div className="font-medium text-stone-100">{venue.name}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        卷中回声 {venue.sampleCount}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4">
                    <div className="text-sm text-stone-200">这一层尚未落到具体场馆，时间与传播两条线仍在为现实去处保留回声。</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTab("timeline")}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                      >
                        时间回声
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("spread")}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        传播河势
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-300/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.2em] text-amber-100/75">
                  活动事件
                </div>
                <div className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                  {detail.realWorldSignals.eventSamples?.length ?? 0} 条
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {eventPreview.length ? (
                  eventPreview.map((event) => (
                    <button
                      key={`${event.venue}-${event.title}-${event.startTime}`}
                      type="button"
                      onClick={() => {
                        handleSelectEventSample(event);
                        setTab("timeline");
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm transition hover:bg-white/10"
                    >
                      <div className="font-medium text-stone-100">{event.title}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        {event.venue} · {event.startTime}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4">
                    <div className="text-sm text-stone-200">这一层尚未落到具体活动事件，传播与人物两条支流仍在托住扩散路径。</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTab("spread")}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                      >
                        传播河势
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("people")}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        人物网络
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-300/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
              <div className="text-xs tracking-[0.2em] text-amber-100/75">
                  馆藏落点
                </div>
                <div className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                  {detail.realWorldSignals.institutionSamples?.length ?? 0} 条
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {institutionPreview.length ? (
                  institutionPreview.map((item) => {
                    const recordId = `${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}`;
                    const isActive = selectedInstitutionRecordId === recordId;

                    return (
                    <button
                      key={`${item.institution}-${item.title}-${item.imageRef}`}
                      type="button"
                      onClick={() => handleSelectInstitutionRecord(item)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                        isActive
                          ? "border-amber-300/35 bg-amber-300/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="font-medium text-stone-100">{item.title}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        {item.institution}
                        {item.year ? ` · ${item.year}` : ""}
                      </div>
                      {item.imageRef || item.sourceText ? (
                        <div className="mt-2 text-[11px] text-amber-100/80">
                          {item.imageRef ?? item.sourceText}
                        </div>
                      ) : null}
                    </button>
                  );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4">
                    <div className="text-sm text-stone-200">这一层尚未落到更细馆藏，版本与来源两条线仍在为馆藏去处留出位置。</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTab("versions")}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                      >
                        版本流变
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSourceEvidenceId("institution-samples")}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        来源卷录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {activeInstitutionRecord ? (
            <div className="mt-4 rounded-2xl border border-amber-300/12 bg-[rgba(255,248,220,0.06)] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.2em] text-amber-100/75">
                    馆藏落点
                  </div>
                  <div className="mt-2 text-base font-semibold text-stone-50">
                    {activeInstitutionRecord.title}
                  </div>
                  <div className="mt-2 text-sm text-stone-300">
                    {activeInstitutionRecord.institution}
                    {activeInstitutionRecord.category
                      ? ` · ${activeInstitutionRecord.category}`
                      : ""}
                    {activeInstitutionRecord.year ? ` · ${activeInstitutionRecord.year}` : ""}
                  </div>
                </div>
                {activeInstitutionRecord.imageRef ? (
                  <div className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                    影像号 {activeInstitutionRecord.imageRef}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {linkedVersionFromInstitution ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVersionId(linkedVersionFromInstitution.id);
                      setTab("versions");
                    }}
                    className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                  >
                    版本节点
                  </button>
                ) : null}
                {linkedTimelineFromInstitution ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectTimelineItem(linkedTimelineFromInstitution.id);
                      setTab("timeline");
                    }}
                    className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-xs text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                  >
                    关联时间线
                  </button>
                ) : null}
              </div>
              <div className="mt-4 rounded-[24px] border border-[#d9bd79]/16 bg-[linear-gradient(180deg,rgba(244,230,188,0.94),rgba(226,201,146,0.9))] px-4 py-4 text-[#4a2c08] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] tracking-[0.22em] text-[#8d6a2c]">{activeInstitutionPreviewTone}</div>
                  <div className="rounded-full border border-[#b89247]/18 bg-[rgba(255,255,255,0.24)] px-3 py-1 text-[10px] text-[#7a571d]">
                    {activeInstitutionRecord.imageRef ? `影像号 ${activeInstitutionRecord.imageRef}` : activeInstitutionRecord.category ?? "馆藏条目"}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[#b89247]/14 bg-[rgba(255,255,255,0.18)] px-3 py-3">
                  <div>
                    <div className="text-[10px] tracking-[0.2em] text-[#8d6a2c]">馆藏序列</div>
                    <div className="mt-1 text-xs text-[#7a571d]">
                      第 {Math.max(activeInstitutionRecordIndex + 1, 1)} / {Math.max(institutionRecords.length, 1)} 卷
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const previousRecord = institutionRecords[activeInstitutionRecordIndex - 1];
                        if (previousRecord) {
                          handleSelectInstitutionRecord(previousRecord);
                        }
                      }}
                      disabled={activeInstitutionRecordIndex <= 0}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        activeInstitutionRecordIndex <= 0
                          ? "cursor-not-allowed border border-[#c9b68a]/20 bg-[rgba(201,182,138,0.14)] text-[#b09057]"
                          : "border border-[#b89247]/18 bg-[rgba(255,255,255,0.24)] text-[#7a571d] hover:bg-[rgba(255,255,255,0.32)]"
                      }`}
                    >
                      前一卷
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextRecord = institutionRecords[activeInstitutionRecordIndex + 1];
                        if (nextRecord) {
                          handleSelectInstitutionRecord(nextRecord);
                        }
                      }}
                      disabled={activeInstitutionRecordIndex >= institutionRecords.length - 1}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        activeInstitutionRecordIndex >= institutionRecords.length - 1
                          ? "cursor-not-allowed border border-[#c9b68a]/20 bg-[rgba(201,182,138,0.14)] text-[#b09057]"
                          : "border border-[#b89247]/18 bg-[rgba(255,255,255,0.24)] text-[#7a571d] hover:bg-[rgba(255,255,255,0.32)]"
                      }`}
                    >
                      后一卷
                    </button>
                  </div>
                </div>
                <div className="mt-4 rounded-[20px] border border-[#b89247]/14 bg-[rgba(255,255,255,0.24)] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] tracking-[0.2em] text-[#8d6a2c]">馆藏来源</div>
                      <div className="mt-2 text-base font-semibold text-[#5b3a11]">
                        {activeInstitutionRecord.institution}
                      </div>
                      <div className="mt-2 text-xs text-[#7a571d]">
                        {[activeInstitutionRecord.title, activeInstitutionRecord.year].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="rounded-full border border-[#b89247]/18 bg-[rgba(255,255,255,0.22)] px-3 py-1 text-[10px] text-[#7a571d]">
                      版本脉络
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm text-[#5b3a11]">
                    <div className="text-[#8d6a2c]">馆藏类型</div>
                    <div>{activeInstitutionRecord.category ?? "古籍馆藏 / 影像线索"}</div>
                    <div className="text-[#8d6a2c]">馆藏摘要</div>
                    <div className="leading-6">{activeInstitutionPreviewText}</div>
                  </div>
                </div>
                {activeInstitutionPreviewWindow.length > 1 ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {activeInstitutionPreviewWindow.map((item) => {
                      const recordId = `${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}`;
                      const isActive =
                        recordId ===
                        `${activeInstitutionRecord.institution}-${activeInstitutionRecord.title}-${activeInstitutionRecord.imageRef ?? activeInstitutionRecord.sourceText ?? "trace"}`;

                      return (
                        <button
                          key={`preview-window-${recordId}`}
                          type="button"
                          onClick={() => handleSelectInstitutionRecord(item)}
                          className={`rounded-[18px] border px-3 py-3 text-left transition ${
                            isActive
                              ? "border-[#b89247]/28 bg-[rgba(255,255,255,0.32)]"
                              : "border-[#b89247]/12 bg-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.26)]"
                          }`}
                        >
                          <div className="text-[10px] tracking-[0.18em] text-[#8d6a2c]">
                            {isActive ? "卷心条目" : "同列条目"}
                          </div>
                          <div className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-[#5b3a11]">
                            {item.title}
                          </div>
                          <div className="mt-1 text-[11px] text-[#7a571d]">
                            {[item.institution, item.year].filter(Boolean).join(" · ")}
                          </div>
                          <div className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#6b4a16]">
                            {item.imageRef ?? item.sourceText ?? item.category ?? "馆藏条目"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("institution-samples")}
                  className="rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4 text-left transition hover:bg-[rgba(255,244,214,0.12)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                    馆藏去处
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#eadfbc]">
                    {[
                      activeInstitutionRecord.institution,
                      activeInstitutionRecord.title,
                      activeInstitutionRecord.year,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className="mt-3 text-xs text-[#f0d79a]">
                    机构归录会继续把馆藏与版本脉络并列展开。
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("versions")}
                  className="rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4 text-left transition hover:bg-[rgba(255,244,214,0.12)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                    馆藏线索
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#eadfbc]">
                    {activeInstitutionRecord.sourceText ?? activeInstitutionRecord.imageRef ?? "这条馆藏条目已经成为此版的馆藏去处。"}
                  </div>
                  <div className="mt-3 text-xs text-[#f0d79a]">
                    版本流变会把这条馆藏线索重新挂回此版所在的位置。
                  </div>
                </button>
              </div>
            </div>
          ) : null}
          {sourceEvidence.length ? (
            <div className="mt-4 rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.2em] text-amber-100/75">
                    来源卷录
                  </div>
                  <div className="mt-1 text-sm text-stone-300">
                    将真实来源按人物、场馆、事件与馆藏线索归并成可核验的凭据条目。
                  </div>
                </div>
                <div className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                  {sourceEvidence.length} 类证据
                </div>
              </div>
              <div className="mt-4 grid gap-3 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="grid gap-3">
                  {sourceEvidence.map((item) => {
                    const isActive = activeSourceEvidence?.id === item.id;

                    return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedSourceEvidenceId(item.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-amber-300/28 bg-amber-300/10"
                        : "border-[#d8b56f]/18 bg-[rgba(255,244,214,0.06)] hover:bg-[rgba(255,244,214,0.1)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[#fbf3da]">
                          {item.source}
                        </div>
                        <div className="mt-1 text-xs text-[#cdb98d]">
                          {item.category}
                        </div>
                      </div>
                      <div className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                        {item.countLabel}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#eadfbc]">
                      {item.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-amber-100/80">
                      <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1">
                        路径摘要
                      </span>
                      <span className="rounded-full border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-1 text-[#eadfbc]">
                        {item.traceNote}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenSourceEvidence(item.id);
                        }}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        {item.id === "cbdb-people"
                          ? "查看人物关系"
                          : item.id === "venue-samples"
                            ? "查看地理传播"
                            : item.id === "event-samples"
                              ? "查看关联时间线"
                              : item.id === "institution-samples"
                                  ? "查看版本与馆藏"
                                : "转入相应层"}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {item.samples.map((sample) => (
                        <button
                          key={`${item.id}-${sample.label}-${sample.detail ?? "detail"}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenSourceSample(item.id, sample);
                          }}
                          className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-left transition hover:bg-white/10"
                        >
                          <div className="text-sm text-stone-100">{sample.label}</div>
                          {sample.detail ? (
                            <div className="mt-1 text-xs text-stone-400">{sample.detail}</div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </button>
                );
                  })}
                </div>
                {activeSourceEvidence ? (
                  <div className="rounded-2xl border border-amber-300/12 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs tracking-[0.2em] text-amber-100/75">
                          凭据细览
                        </div>
                        <div className="mt-2 text-base font-semibold text-stone-50">
                          {activeSourceEvidence.source}
                        </div>
                        <div className="mt-1 text-sm text-stone-300">
                          {activeSourceEvidence.category}
                        </div>
                      </div>
                      <div className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                        {activeSourceEvidence.countLabel}
                      </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs tracking-[0.2em] text-amber-100/75">
                          凭据卷轴
                          </div>
                          <div className="mt-1 text-sm text-stone-300">
                            卷中第 {Math.max(activeSourceEvidenceIndex + 1, 1)} 册，共 {Math.max(sourceEvidence.length, 1)} 册
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const previousEvidence = sourceEvidence[activeSourceEvidenceIndex - 1];
                              if (previousEvidence?.id) {
                                setSelectedSourceEvidenceId(previousEvidence.id);
                              }
                            }}
                            disabled={activeSourceEvidenceIndex <= 0}
                            className={`rounded-full px-3 py-1.5 text-xs transition ${
                              activeSourceEvidenceIndex <= 0
                                ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                            }`}
                          >
                            前一类
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextEvidence = sourceEvidence[activeSourceEvidenceIndex + 1];
                              if (nextEvidence?.id) {
                                setSelectedSourceEvidenceId(nextEvidence.id);
                              }
                            }}
                            disabled={activeSourceEvidenceIndex >= sourceEvidence.length - 1}
                            className={`rounded-full px-3 py-1.5 text-xs transition ${
                              activeSourceEvidenceIndex >= sourceEvidence.length - 1
                                ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                            }`}
                          >
                            后一类
                          </button>
                        </div>
                      </div>
                      {activeSourceEvidenceWindow.length > 1 ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          {activeSourceEvidenceWindow.map((item) => {
                            const isActive = item.id === activeSourceEvidence.id;

                            return (
                              <button
                                key={`source-window-${item.id}`}
                                type="button"
                                onClick={() => setSelectedSourceEvidenceId(item.id)}
                                className={`rounded-[18px] border px-3 py-3 text-left transition ${
                                  isActive
                                    ? "border-amber-300/30 bg-amber-300/10"
                                    : "border-white/10 bg-white/5 hover:bg-white/10"
                                }`}
                              >
                                <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">
                                  {isActive ? "当前凭据" : "相邻凭据"}
                                </div>
                                <div className="mt-2 text-sm font-medium text-stone-100">
                                  {item.source}
                                </div>
                                <div className="mt-1 text-[11px] text-stone-400">
                                  {item.category}
                                </div>
                                <div className="mt-2 text-[11px] leading-5 text-[#d8c9a3]">
                                  {item.countLabel}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-stone-300">
                      {activeSourceEvidence.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeSourceEvidence.samples.slice(0, 3).map((sample) => (
                        <button
                          key={`lead-sample-${activeSourceEvidence.id}-${sample.label}`}
                          type="button"
                          onClick={() => handleOpenSourceSample(activeSourceEvidence.id, sample)}
                          className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100 transition hover:bg-amber-300/15"
                        >
                          直达 {sample.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4">
                      <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                        回查线索
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm leading-6 text-[#eadfbc]">
                        <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                          回查路径
                        </span>
                        <span>{activeSourceEvidence.traceNote}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {activeSourceEvidence.samples.slice(0, 2).map((sample) => (
                          <button
                            key={`trace-entry-${activeSourceEvidence.id}-${sample.label}`}
                            type="button"
                            onClick={() => handleOpenSourceSample(activeSourceEvidence.id, sample)}
                            className="rounded-full border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-1.5 text-xs text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                          >
                            回查 {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenSourceEvidence(activeSourceEvidence.id)}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        {activeSourceEvidence.id === "cbdb-people"
                          ? "转入人物关系"
                          : activeSourceEvidence.id === "venue-samples"
                            ? "转入地理传播"
                            : activeSourceEvidence.id === "event-samples"
                              ? "转入关联时间线"
                              : activeSourceEvidence.id === "institution-samples"
                                ? "转入版本与馆藏线索"
                                : "前往相关视图"}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {activeSourceEvidence.samples.map((sample) => (
                        <button
                          key={`active-${activeSourceEvidence.id}-${sample.label}-${sample.detail ?? "detail"}`}
                          type="button"
                          onClick={() => handleOpenSourceSample(activeSourceEvidence.id, sample)}
                          className="rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-3 text-left transition hover:bg-[rgba(255,244,214,0.12)]"
                        >
                          <div className="text-sm text-[#fbf3da]">{sample.label}</div>
                          {sample.detail ? (
                            <div className="mt-1 text-xs leading-6 text-[#cdb98d]">
                              {sample.detail}
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          {detail.realWorldSignals.institutionSamples?.length ? (
            <div className="mt-4 rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.2em] text-amber-100/75">
                  馆藏图像与卷旁线索
                </div>
                <div className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                  {detail.realWorldSignals.institutionSamples.length} 条
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                {detail.realWorldSignals.institutionSamples.map((item) => {
                  const recordId = `${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}`;
                  const isActive =
                    activeInstitutionRecord === item ||
                    selectedInstitutionRecordId === recordId;

                  return (
                  <button
                    key={`${item.institution}-${item.title}-${item.imageRef}`}
                    type="button"
                    onClick={() => setSelectedInstitutionRecordId(recordId)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-amber-300/35 bg-amber-300/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-stone-50">{item.title}</div>
                        <div className="mt-1 text-xs text-stone-400">
                          {item.institution}
                          {item.category ? ` · ${item.category}` : ""}
                          {item.year ? ` · ${item.year}` : ""}
                        </div>
                      </div>
                      {item.imageRef ? (
                        <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] text-stone-300">
                          {item.imageRef}
                        </div>
                      ) : null}
                    </div>
                    {item.sourceText ? (
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        图像出处：{item.sourceText}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenSourceEvidence("institution-samples");
                        }}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        回到机构归录
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setTab("versions");
                        }}
                        className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/10"
                      >
                        转看版本流变
                      </button>
                    </div>
                  </button>
                );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "spread" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">地理传播</h3>
            <span className="text-xs text-[#d8c9a3]">河段显影</span>
          </div>
          {visibleSpread.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6">
              <div className="text-sm text-stone-200">这一时代河段还没有展开传播航段。</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab("timeline")}
                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                >
                  转看时间回声
                </button>
                <button
                  type="button"
                  onClick={() => setTab("people")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                >
                  转看人物网络
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(96,66,22,0.72),rgba(42,27,9,0.8))] p-4 shadow-[inset_0_1px_0_rgba(255,244,214,0.06)]">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(70,45,14,0.46),rgba(37,24,8,0.4))] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                          传播河段
                        </div>
                        <div className="mt-1 text-sm text-[#eadfbc]">
                          点任一航段即可落到对应传播阶段
                        </div>
                      </div>
                      <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                        {visibleSpread.length} 段航线
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 overflow-x-auto pb-2">
                      {visibleSpread.map((item, index) => {
                        const fromPlace = detail.places.find((place) => place.id === item.fromPlaceId);
                        const toPlace = detail.places.find((place) => place.id === item.toPlaceId);
                        const isActive = activeSpread?.id === item.id;

                        return (
                          <div key={item.id} className="flex min-w-max items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSpreadId(item.id)}
                              className={`rounded-[22px] border px-4 py-3 text-left transition ${
                                isActive
                                  ? "border-amber-300/35 bg-amber-300/12 shadow-lg shadow-amber-500/10"
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
                                航段 {index + 1}
                              </div>
                              <div className="mt-2 text-sm font-medium text-stone-50">
                                {fromPlace?.name ?? "未知"} → {toPlace?.name ?? "未知"}
                              </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
                              <span>{item.startYear} - {item.endYear}</span>
                              <span className="rounded-full bg-amber-300/10 px-2 py-1 text-amber-100">
                                流量 {item.volume}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-1 ${sourceBadgeClass(spreadMeta.tone)}`}
                              >
                                {spreadMeta.label}
                              </span>
                            </div>
                          </button>
                            {index < visibleSpread.length - 1 ? (
                              <div className="h-px w-8 bg-gradient-to-r from-amber-300/40 to-transparent" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {visibleSpread.length > 1 ? (
                      <div className="mt-4 rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3 text-[11px] tracking-[0.22em] text-stone-400">
                          <span>传播次第</span>
                          <span className="text-amber-100">
                            第 {Math.max(activeSpreadIndex + 1, 1)} / {visibleSpread.length} 段
                          </span>
                        </div>
                        <div className="mt-3 rounded-[18px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.04)] px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[10px] tracking-[0.2em] text-[#d8c9a3]">当前传播年代</div>
                              <div className="mt-1 text-sm font-medium text-[#f3e6c1]">
                                {activeSpread ? `${activeSpread.startYear} - ${activeSpread.endYear}` : "传播阶段"}
                              </div>
                            </div>
                            <div className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                              {activeSpreadPlaces?.from?.name ?? "起点"} → {activeSpreadPlaces?.to?.name ?? "终点"}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                            {visibleSpread.map((item, index) => {
                              const isActive = activeSpread?.id === item.id;

                              return (
                                <button
                                  key={`spread-era-chip-${item.id}`}
                                  type="button"
                                  onClick={() => handleSelectSpreadIndex(index)}
                                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] transition ${
                                    isActive
                                      ? "border-amber-300/35 bg-amber-300/14 text-amber-50"
                                      : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                                  }`}
                                >
                                  {item.startYear}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-3 h-1.5 rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#fcd34d)] transition-all duration-300"
                              style={{
                                width: `${visibleSpread.length <= 1 ? 100 : ((Math.max(activeSpreadIndex, 0) + 1) / visibleSpread.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={visibleSpread.length - 1}
                          step={1}
                          value={Math.max(activeSpreadIndex, 0)}
                          onChange={(event) =>
                            handleSelectSpreadIndex(Number(event.target.value))
                          }
                          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectSpreadIndex(
                                Math.max(Math.max(activeSpreadIndex, 0) - 1, 0),
                              )
                            }
                            disabled={activeSpreadIndex <= 0}
                            className={`rounded-full px-3 py-2 text-xs transition ${
                              activeSpreadIndex <= 0
                                ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                            }`}
                          >
                            回看上一段
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectSpreadIndex(
                                Math.min(
                                  Math.max(activeSpreadIndex, 0) + 1,
                                  visibleSpread.length - 1,
                                ),
                              )
                            }
                            disabled={
                              activeSpreadIndex === -1 ||
                              activeSpreadIndex >= visibleSpread.length - 1
                            }
                            className={`rounded-full px-3 py-2 text-xs transition ${
                              activeSpreadIndex === -1 ||
                              activeSpreadIndex >= visibleSpread.length - 1
                                ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                            }`}
                          >
                            进入下一段
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                          当前河段
                        </div>
                        <div className="mt-1 text-lg font-semibold text-[#fbf3da]">
                          {activeSpreadPlaces?.from?.name ?? "未知"} → {activeSpreadPlaces?.to?.name ?? "未知"}
                        </div>
                      </div>
                      {activeSpread ? (
                        <div className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                          流量 {activeSpread.volume}
                        </div>
                      ) : null}
                    </div>

                      {activeSpread ? (
                        <div className="mt-4 space-y-3">
                          <button
                            type="button"
                            onClick={() => setTab("timeline")}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium text-stone-50">
                                传播时间
                              </span>
                              <span className="text-xs text-stone-400">
                                {activeSpread.startYear} - {activeSpread.endYear}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${sourceBadgeClass(spreadMeta.tone)}`}
                              >
                                {spreadMeta.label}
                              </span>
                              <span className="text-xs text-stone-400">
                                {spreadMeta.detail}
                              </span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-white/5">
                              <div
                                className="h-2 rounded-full bg-[linear-gradient(90deg,#67e8f9,#34d399)]"
                                style={{ width: `${Math.min(activeSpread.volume, 100)}%` }}
                              />
                            </div>
                            <div className="mt-3 text-xs text-amber-100/80">
                              转看时间回声，把这段传播放回年代与事件里继续讲。
                            </div>
                          </button>

                          <div className="grid gap-3 md:grid-cols-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSourceEvidenceId("venue-samples");
                              }}
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                            >
                              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                                起点
                              </div>
                              <div className="mt-2 text-base font-semibold text-stone-50">
                                {activeSpreadPlaces?.from?.name ?? "未知地点"}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-stone-300">
                                {activeSpreadPlaces?.from?.note ?? "当前航段已落到这座城市，可结合年份与航线继续追看传播落点。"}
                              </p>
                              <div className="mt-3 text-xs text-amber-100/80">
                                打开场馆凭据，从起点城市继续核对真实传播落点。
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setTab("people")}
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                            >
                              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                                终点
                              </div>
                              <div className="mt-2 text-base font-semibold text-stone-50">
                                {activeSpreadPlaces?.to?.name ?? "未知地点"}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-stone-300">
                                {activeSpreadPlaces?.to?.note ?? "这座终点城市承接当前航段，可继续回到时间线或人物网络追看扩散回声。"}
                              </p>
                              <div className="mt-3 text-xs text-amber-100/80">
                                转看人物网络，继续讲清这段扩散在人物层如何接力。
                              </div>
                            </button>
                          </div>
                        </div>
                      ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(55,35,12,0.9),rgba(22,14,6,0.96))] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                      传播地球
                    </div>
                    <div className="mt-1 text-sm text-[#eadfbc]">
                      在卷面地球上查看典籍传播落点、航线抬升与流向
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                    {detail.places.length} 个地点
                  </div>
                </div>

                <div className="mt-4">
                  <SpreadGlobe
                    places={detail.places}
                    spreads={visibleSpread}
                    activeSpreadId={activeSpread?.id ?? null}
                    activePlaceIds={[
                      activeSpreadPlaces?.from?.id ?? "",
                      activeSpreadPlaces?.to?.id ?? "",
                    ].filter(Boolean)}
                    onSelectSpread={setSelectedSpreadId}
                  />
                </div>
              </div>
            </>
          )}
          <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeSpread?.id) {
                          setSelectedSpreadId(activeSpread.id);
                }
                    }}
                    className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                  >
              <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">传播河段</div>
              <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                {activeSpreadPlaces?.from?.name ?? "起点"} → {activeSpreadPlaces?.to?.name ?? "终点"}
              </div>
              <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                城市、年份与方向正在共同显出这段知识流动的路径。
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                if (detail.realWorldSignals?.venueSamples?.length) {
                  setSelectedSourceEvidenceId("venue-samples");
                  return;
                }

                setTab("timeline");
              }}
              className="rounded-[24px] border border-amber-300/14 bg-[linear-gradient(180deg,rgba(191,140,40,0.16),rgba(56,35,11,0.24))] px-4 py-4 text-left transition hover:bg-[linear-gradient(180deg,rgba(191,140,40,0.22),rgba(56,35,11,0.3))]"
            >
              <div className="text-xs tracking-[0.2em] text-amber-100/75">场馆落点</div>
              <div className="mt-2 text-sm font-medium text-amber-50">
                {detail.realWorldSignals?.venueSamples?.length ? "上图场馆落点" : "时间回声"}
              </div>
              <div className="mt-2 text-sm leading-7 text-amber-50/90">
                {detail.realWorldSignals?.venueSamples?.length
                  ? "场馆与活动信号已经把传播河段压到现实空间的具体落点上。"
                  : "这段传播尚未落到具体场馆，年代回声仍保留它的事件踪迹。"}
              </div>
            </button>
          </div>
          {detail.realWorldSignals?.venueSamples?.length ? (
            <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-stone-50">上图活动场馆资料</h4>
                <span className="text-xs text-stone-400">真实数据辅助</span>
              </div>
              <div className="mt-3 grid gap-2">
                {detail.realWorldSignals.venueSamples.map((venue) => (
                  <button
                    key={venue.name}
                    type="button"
                    onClick={() => {
                      const linkedSpread = linkedVenueSpreadMap.get(venue.name);

                      if (linkedSpread?.id) {
                        setSelectedSpreadId(linkedSpread.id);
                      }

                      setSelectedSourceEvidenceId("venue-samples");
                    }}
                    className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-left text-sm transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-stone-200">{venue.name}</span>
                      <span className="rounded-full bg-amber-300/10 px-2 py-1 text-xs text-amber-100">
                        采样 {venue.sampleCount}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const linkedSpread = linkedVenueSpreadMap.get(venue.name);

                          if (linkedSpread?.id) {
                            setSelectedSpreadId(linkedSpread.id);
                          }
                        }}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/10"
                      >
                        对应河段
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const linkedEvent = linkedVenueEventMap.get(venue.name)?.[0];

                          if (linkedEvent) {
                            const matchedTimeline = visibleTimeline.find((item) =>
                              linkedEvent.startTime.includes(String(item.year)),
                            );

                            if (matchedTimeline?.id) {
                              handleSelectTimelineItem(matchedTimeline.id);
                            }
                          }

                          handleFocusEventEvidence();
                          setTab("timeline");
                        }}
                        className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1.5 text-xs text-amber-100 transition hover:bg-amber-300/18"
                      >
                        活动回声
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSourceEvidenceId("venue-samples");
                        }}
                        className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                      >
                        场馆证据
                      </button>
                    </div>
                    {linkedVenueEventMap.get(venue.name)?.length ? (
                      <div className="mt-3 text-xs leading-6 text-stone-400">
                        已挂接 {linkedVenueEventMap.get(venue.name)!.length} 条活动事件，传播路径与现实时间已经彼此扣合。
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "people" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">人物关系</h3>
            <span className="text-xs text-[#d8c9a3]">人物显影</span>
          </div>
          {visiblePeople.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6">
              <div className="text-sm text-stone-200">这一时代河段里，人物关系尚未显影到卷面中心。</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("cbdb-people")}
                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                >
                  人物证据
                </button>
                <button
                  type="button"
                  onClick={() => setTab("spread")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                >
                  传播河段
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(96,66,22,0.72),rgba(42,27,9,0.8))] p-4 shadow-[inset_0_1px_0_rgba(255,244,214,0.06)]">
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(70,45,14,0.46),rgba(37,24,8,0.4))] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                          人物关系场
                        </div>
                        <div className="mt-1 text-sm text-[#eadfbc]">
                          核心人物与外扩支流分层浮现，关系场会保持清晰的主次秩序。
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                        核心 {primaryPeople.length} · 支流 {secondaryPeople.length}
                      </div>
                    </div>

                    <div className="mt-4">
                      <PersonNetwork3D
                        book={book}
                        primaryPeople={primaryPeople}
                        secondaryPeople={visibleSecondaryPeople}
                        activePersonId={activePerson?.id ?? null}
                        onSelectPerson={setSelectedPersonId}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                        <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                          一级关联
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {primaryPeople.map((person) => (
                            <button
                              key={person.id}
                              type="button"
                              onClick={() => setSelectedPersonId(person.id)}
                              className={`rounded-full px-3 py-2 text-xs transition ${
                                activePerson?.id === person.id
                                  ? "bg-emerald-300/12 text-emerald-100"
                                  : "border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] text-[#eadfbc]"
                              }`}
                            >
                              {person.name} · {person.role}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                            二级关联
                          </div>
                          {secondaryPeople.length ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  secondaryPeopleExpanded &&
                                  activePerson &&
                                  (activePerson.relationTier ?? 2) === 2
                                ) {
                                  setSelectedPersonId(primaryPeople[0]?.id ?? null);
                                }
                                setShowSecondaryPeople((current) => !current);
                              }}
                              className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] text-amber-100 transition hover:bg-amber-300/15"
                            >
                              {secondaryPeopleExpanded ? "收束支流人物" : "显出支流人物"}
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {secondaryPeople.length === 0 ? (
                            <div className="rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-3">
                              <div className="text-sm text-[#eadfbc]">此刻卷面仍停留在核心人物层。</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFocusCbdbEvidence(activePerson?.id)}
                                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                >
                                  人物证据
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTab("spread")}
                                  className="rounded-full border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-1.5 text-xs text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                                >
                                  传播河段
                                </button>
                              </div>
                            </div>
                          ) : secondaryPeopleExpanded ? (
                            secondaryPeople.map((person) => (
                              <button
                                key={person.id}
                                type="button"
                                onClick={() => setSelectedPersonId(person.id)}
                                className={`rounded-full px-3 py-2 text-xs transition ${
                                  activePerson?.id === person.id
                                    ? "bg-amber-300/12 text-amber-100"
                                    : "border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] text-[#eadfbc]"
                                }`}
                              >
                                {person.name} · {person.role}
                              </button>
                            ))
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowSecondaryPeople(true)}
                              className="rounded-2xl border border-dashed border-[#d8b56f]/24 bg-[rgba(255,244,214,0.04)] px-3 py-3 text-left text-sm leading-6 text-[#d8c9a3] transition hover:bg-[rgba(255,244,214,0.08)]"
                            >
                              作者、注者与编者稳住主干之后，引用者、评论者与校勘者会继续从支流浮现。
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                    {activePerson ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                              人物显影
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-[#fbf3da]">
                              {activePerson.name}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {activePerson.role} · {activePerson.era}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className={`rounded-full px-3 py-1 text-xs ${relationTypeClass(activePerson.relationType)}`}
                            >
                              {activePerson.relationType ?? "引"}
                            </div>
                            <div className="rounded-full bg-violet-300/10 px-3 py-1 text-xs text-violet-100">
                              {activePerson.birthYear ?? "?"} - {activePerson.deathYear ?? "?"}
                            </div>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-stone-300">
                          {activePerson.bio}
                        </p>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                            <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                              关系层级
                            </div>
                            <div className="mt-2 text-base font-semibold text-[#fbf3da]">
                              {(activePerson.relationTier ?? 2) === 1 ? "一级关联" : "二级关联"}
                            </div>
                            <div className="mt-2 text-sm text-[#eadfbc]">
                              {(activePerson.relationTier ?? 2) === 1
                                ? "该人物直接参与著述、注疏或核心编纂，是典籍关系网中的主干节点。"
                                : "该人物代表后续引用、评论、校勘或再传播，是典籍向外扩散的支流节点。"}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                            <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                              数据来源
                            </div>
                            <div className="mt-2 text-base font-semibold text-[#fbf3da]">
                              {activePerson.source === "cbdb" ? "纪传库已对照" : "馆内人物整理"}
                            </div>
                            <div className="mt-2 text-sm text-[#eadfbc]">
                              {activePerson.source === "cbdb"
                                ? `这位人物已经在真实纪传中显影${activePerson.matchedAlias ? `，匹配别名为 ${activePerson.matchedAlias}` : ""}。`
                                : "这一人物已先作为关系节点入网，人物轨迹会在传播与证据之间继续显影。"}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleFocusCbdbEvidence(activePerson.id)}
                                className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                              >
                                纪传证据
                              </button>
                              {linkedPersonSpread ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSpreadId(linkedPersonSpread.id);
                                    setTab("spread");
                                  }}
                                  className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100 transition hover:bg-amber-300/15"
                                >
                                  对应河段
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {activePerson.activityPlaces?.length ? (
                          <div className="mt-4 rounded-2xl border border-amber-300/10 bg-amber-300/5 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs tracking-[0.2em] text-amber-100/75">
                                人物活动地点信号
                              </div>
                              <div className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                                {activePerson.activityPlaces.length} 条地点
                              </div>
                            </div>
                            <div className="mt-3 grid gap-3">
                              {activePerson.activityPlaces.map((place) => (
                                <div
                                  key={`${activePerson.id}-${place.name}`}
                                  className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-base font-semibold text-stone-50">
                                      {place.name}
                                    </div>
                                    <div className="text-xs text-stone-400">
                                      {place.firstYear || place.lastYear
                                        ? `${place.firstYear ?? "?"} - ${place.lastYear ?? "?"}`
                                        : "年份未详"}
                                    </div>
                                  </div>
                                  {place.note ? (
                                    <p className="mt-2 text-sm leading-6 text-stone-300">
                                      {place.note}
                                    </p>
                                  ) : null}
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTab("spread")}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                    >
                                      传播河势
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleFocusCbdbEvidence(activePerson.id)}
                                      className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                    >
                                      人物证据
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {activePerson.source === "cbdb" && activePerson.matchedAlias ? (
                          <div className="mt-4 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1 text-xs text-emerald-100">
                            纪传库匹配别名：{activePerson.matchedAlias}
                          </div>
                        ) : null}
                        <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/6 px-4 py-4">
                          <div className="text-xs tracking-[0.2em] text-amber-100/75">
                            人物回响
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleFocusCbdbEvidence(activePerson.id);
                              }}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              证据归拢
                            </button>
                            {activePerson.activityPlaces?.[0] ? (
                              <button
                                type="button"
                                onClick={() => setTab("spread")}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                              >
                                人物河势
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                人物主干由 {primaryPeople[0]?.name ?? visiblePeople[0]?.name ?? "卷心人物"} 托住，
                {secondaryPeople.length
                  ? ` ${secondaryPeople[0]?.name ?? "支流人物"} 等支流人物继续把典籍关系向外推开。`
                  : " 外扩人物支流尚未在这一河段显影。"}
                {visiblePeople.find((person) => person.source === "cbdb")
                  ? ` 纪传材料也已与 ${visiblePeople.find((person) => person.source === "cbdb")?.name} 的人物线索相互校照。`
                  : " 纪传材料会在后续显影时继续补足人物线索。"}
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === "versions" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">版本流变</h3>
            <span className="text-xs text-[#d8c9a3]">版本显影</span>
          </div>
          {visibleVersions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6">
              <div className="text-sm text-stone-200">这一时代河段尚未浮出版本链路，馆藏与原文两条线仍在替这部典籍保留版本回声。</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("institution-samples")}
                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                >
                  机构归录
                </button>
                <button
                  type="button"
                  onClick={() => setTab("passages")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                >
                  原文证据
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(96,66,22,0.72),rgba(42,27,9,0.8))] p-4 shadow-[inset_0_1px_0_rgba(255,244,214,0.06)]">
                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <VersionTree
                    versions={visibleVersions}
                    activeVersionId={activeVersion?.id ?? null}
                    onSelectVersion={setSelectedVersionId}
                  />

                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                    {activeVersion ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                              版本显影
                              </div>
                            <div className="mt-2 text-xl font-semibold text-[#fbf3da]">
                              {activeVersion.label}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {activeVersion.year} · {activeVersion.place} · {activeVersion.library}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {activeVersion.editionType ? (
                              <span
                                className={`rounded-full px-3 py-1 text-xs ${versionTypeClass(activeVersion.editionType)}`}
                              >
                                {activeVersion.editionType}
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-3 py-1 text-xs ${
                                activeVersion.status === "存世"
                                  ? "bg-emerald-300/10 text-emerald-100"
                                  : "border border-slate-300/15 bg-slate-300/10 text-slate-100"
                              }`}
                            >
                              {activeVersion.status}
                            </span>
                            {activeVersionStatusMeta ? (
                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${activeVersionStatusMeta.badgeClass}`}
                              >
                                {activeVersionStatusMeta.badge}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {activeVersion.note ? (
                          <p className="mt-4 text-sm leading-7 text-stone-300">
                            {activeVersion.note}
                          </p>
                        ) : null}
                        <div className="mt-4 rounded-2xl border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">版本卷轴</div>
                              <div className="mt-1 text-sm text-[#eadfbc]">
                                第 {Math.max(activeVersionSequenceIndex + 1, 1)} / {Math.max(orderedVisibleVersions.length, 1)} 层
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const previousVersion = orderedVisibleVersions[activeVersionSequenceIndex - 1];
                                  if (previousVersion?.id) {
                                    setSelectedVersionId(previousVersion.id);
                                  }
                                }}
                                disabled={activeVersionSequenceIndex <= 0}
                                className={`rounded-full px-3 py-1.5 text-xs transition ${
                                  activeVersionSequenceIndex <= 0
                                    ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                    : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                                }`}
                              >
                                前一版
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextVersion = orderedVisibleVersions[activeVersionSequenceIndex + 1];
                                  if (nextVersion?.id) {
                                    setSelectedVersionId(nextVersion.id);
                                  }
                                }}
                                disabled={activeVersionSequenceIndex >= orderedVisibleVersions.length - 1}
                                className={`rounded-full px-3 py-1.5 text-xs transition ${
                                  activeVersionSequenceIndex >= orderedVisibleVersions.length - 1
                                    ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                    : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.06)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                                }`}
                              >
                                后一版
                              </button>
                            </div>
                          </div>
                          {activeVersionSequenceWindow.length > 1 ? (
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              {activeVersionSequenceWindow.map((version) => {
                                const isActive = version.id === activeVersion.id;

                                return (
                                  <button
                                    key={`version-window-${version.id}`}
                                    type="button"
                                    onClick={() => setSelectedVersionId(version.id)}
                                    className={`rounded-[18px] border px-3 py-3 text-left transition ${
                                      isActive
                                        ? "border-amber-300/30 bg-amber-300/10"
                                        : "border-white/10 bg-white/5 hover:bg-white/10"
                                    }`}
                                  >
                                    <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">
                                      {isActive ? "当前版本" : "相邻版本"}
                                    </div>
                                    <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                                      {version.label}
                                    </div>
                                    <div className="mt-2 text-[11px] text-stone-300">
                                      {version.year} · {version.place}
                                    </div>
                                    <div className="mt-2 text-[11px] leading-5 text-[#d8c9a3]">
                                      {version.library}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                        {activeVersionStatusMeta ? (
                          <div className="mt-4 rounded-2xl border border-slate-300/10 bg-slate-300/5 px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs tracking-[0.2em] text-slate-200/80">
                                存佚线索
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${activeVersionStatusMeta.badgeClass}`}
                              >
                                {activeVersionStatusMeta.badge}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-stone-300">
                              {activeVersionStatusMeta.detail}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const rootVersion = activeVersionTrail[0];

                                  if (rootVersion?.id) {
                                    setSelectedVersionId(rootVersion.id);
                                  }
                                }}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                              >
                                回到祖本
                              </button>
                              <button
                                type="button"
                                onClick={() => setTab("timeline")}
                                className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                              >
                                转看时间回声
                              </button>
                            </div>
                          </div>
                        ) : null}
                        {activeVersionMeta ? (
                          <div className="mt-4 rounded-2xl border border-amber-300/12 bg-amber-300/6 px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs ${sourceBadgeClass(activeVersionMeta.tone)}`}
                              >
                                {activeVersionMeta.label}
                              </span>
                              <span className="text-sm text-stone-300">
                                {activeVersionMeta.detail}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenSourceEvidence("institution-samples")}
                                className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                              >
                                打开机构归录
                              </button>
                              <button
                                type="button"
                                onClick={() => setTab("passages")}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                              >
                                转看原文证据
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleOpenSourceEvidence("institution-samples")}
                            className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                          >
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              版本位置
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activeVersion.place}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              藏馆题录：{activeVersion.library}
                            </div>
                            <div className="mt-3 text-xs text-amber-100/80">
                              打开机构归录，把这一版的位置重新挂回馆藏与影像线索。
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const rootVersion = activeVersionTrail[0];

                              if (rootVersion?.id) {
                                setSelectedVersionId(rootVersion.id);
                              }
                            }}
                            className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                          >
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              传承位置
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activeVersion.parentId ? "承接上一个版本" : "祖本起点"}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {activeVersion.parentId
                                ? "这层版本位于链路中段或后段，继续承接前一层文字流传。"
                                : "该节点作为版本流变链的起点，承担源头层标记。"}
                            </div>
                            <div className="mt-3 text-xs text-amber-100/80">
                              回到版本链起点，顺着祖本到当前节点重新讲清传承位置。
                            </div>
                          </button>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">馆藏卷录</div>
                              <div className="mt-2 text-base font-semibold text-[#fbf3da]">
                                {activeVersionPrimaryRecord?.title ?? activeVersion.label}
                              </div>
                              <div className="mt-2 text-sm text-stone-300">
                                {activeVersionArchiveSummary}
                              </div>
                            </div>
                            <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                              {activeVersionVisualBadge}
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
                            <div className="rounded-[22px] border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-xs tracking-[0.2em] text-stone-400">卷面图录</div>
                                <div className="text-[10px] text-stone-400">
                                  {activeVersionGalleryRecords.length} 条线索
                                </div>
                              </div>
                              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                {activeVersionGalleryRecords.map((item) => (
                                  <button
                                    key={`version-gallery-${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}`}
                                    type="button"
                                    onClick={() => handleSelectInstitutionRecord(item)}
                                    className="rounded-[18px] border border-white/10 bg-[rgba(255,255,255,0.05)] px-3 py-3 text-left transition hover:bg-[rgba(255,255,255,0.08)]"
                                  >
                                    <div className="flex h-28 items-end rounded-[14px] border border-amber-300/12 bg-[linear-gradient(180deg,rgba(245,229,188,0.16),rgba(77,51,18,0.28))] p-3">
                                      <div className="w-full">
                                        <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">
                                          {item.imageRef ? "影像卷面" : "馆藏卷面"}
                                        </div>
                                        <div className="mt-2 line-clamp-2 text-sm font-medium text-[#fbf3da]">
                                          {item.title}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-3 text-xs text-stone-300">
                                      {item.institution}
                                    </div>
                                    <div className="mt-1 text-[11px] text-stone-400">
                                      {item.imageRef ?? item.category ?? item.year ?? "馆藏条目"}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-[22px] border border-amber-300/12 bg-amber-300/6 px-4 py-4">
                              <div className="text-xs tracking-[0.2em] text-amber-100/75">藏馆落点</div>
                              <div className="mt-2 text-sm leading-7 text-stone-200">
                                {activeVersionPrimaryRecord?.sourceText ??
                                  "这一层版本已经挂到可回查的馆藏或专题记录，版本流变与机构落点可以在同一卷面上对照观看。"}
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSourceEvidence("institution-samples")}
                                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                >
                                  打开馆藏总录
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeVersionPrimaryRecord) {
                                      handleSelectInstitutionRecord(activeVersionPrimaryRecord);
                                    }
                                  }}
                                  disabled={!activeVersionPrimaryRecord}
                                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                                    activeVersionPrimaryRecord
                                      ? "border border-white/10 bg-white/5 text-stone-200 hover:bg-white/10"
                                      : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                  }`}
                                >
                                  卷心馆藏
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 xl:grid-cols-[0.92fr_1.08fr]">
                          <div className="rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                                传承链路
                              </div>
                              <div className="rounded-full bg-[rgba(255,244,214,0.08)] px-3 py-1 text-[10px] text-[#eadfbc]">
                                {activeVersionTrail.length} 层
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {activeVersionTrail.map((version, index) => (
                                <button
                                  key={`trail-${version.id}`}
                                  type="button"
                                  onClick={() => setSelectedVersionId(version.id)}
                                  className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                                    version.id === activeVersion.id
                                      ? "border-amber-300/30 bg-amber-300/10 text-amber-50"
                                      : "border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] text-[#eadfbc] hover:bg-[rgba(255,244,214,0.12)]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="font-medium">
                                      第{index + 1}层 · {version.label}
                                    </div>
                                    <div className="text-xs">
                                      {formatVersionYear(version.year)}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs text-[#cdb98d]">
                                    {version.place} · {version.library}
                                  </div>
                                </button>
                              ))}
                            </div>
                            {activeVersionParent ? (
                              <button
                                type="button"
                                onClick={() => setSelectedVersionId(activeVersionParent.id)}
                                className="mt-3 w-full rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-3 text-left text-sm text-[#eadfbc] transition hover:bg-[rgba(255,244,214,0.12)]"
                              >
                                上游承接：{activeVersionParent.label}
                              </button>
                            ) : (
                              <div className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/8 px-3 py-3">
                                <div className="text-sm text-amber-100">这层版本已经抵达源头。</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const targetRecord = versionEvidenceSamples[0] ?? institutionPreview[0];

                                      if (targetRecord) {
                                        handleSelectInstitutionRecord(targetRecord);
                                      }
                                    }}
                                    disabled={!versionEvidenceSamples.length && !institutionPreview.length}
                                    className={`rounded-full px-3 py-1.5 text-xs transition ${
                                      versionEvidenceSamples.length || institutionPreview.length
                                        ? "border border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20"
                                        : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                    }`}
                                  >
                                    馆藏线索
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTab("passages")}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                  >
                                    原文证据
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className="mt-3 rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-3">
                              <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                                下游分化
                              </div>
                              {activeVersionChildren.length ? (
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  {activeVersionChildren.map((version) => (
                                    <button
                                      key={`child-${version.id}`}
                                      type="button"
                                      onClick={() => setSelectedVersionId(version.id)}
                                      className="rounded-full border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-1.5 text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                                    >
                                      {version.label}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-3">
                                  <div className="text-sm text-[#eadfbc]">这一时代河段尚未浮出更晚的分化版本，时间、人物与原文仍在托住后续流变。</div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTab("timeline")}
                                      className="rounded-full border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-1.5 text-xs text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                                    >
                                      时间回声
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("people")}
                                      className="rounded-full border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-1.5 text-xs text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                                    >
                                      人物承接
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("passages")}
                                      className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                                    >
                                      原文证据
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-amber-300/12 bg-amber-300/6 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                              <div className="text-xs tracking-[0.2em] text-amber-100/75">
                                    影像与馆藏线索
                                  </div>
                                  <div className="mt-1 text-sm text-stone-200">
                                  顺着这一层版本，馆藏与影像线索会继续展开。
                                  </div>
                                </div>
                              <div className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                                {versionEvidenceSamples.length || institutionPreview.length} 条线索
                              </div>
                            </div>
                            <div className="mt-3 grid gap-3">
                              {(versionEvidenceSamples.length
                                ? versionEvidenceSamples
                                : institutionPreview
                              ).map((item) => (
                                <button
                                  key={`version-evidence-${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}`}
                                  type="button"
                                  onClick={() => handleSelectInstitutionRecord(item)}
                                  className="rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4 text-left transition hover:bg-[rgba(255,244,214,0.12)]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-medium text-[#fbf3da]">
                                        {item.title}
                                      </div>
                                      <div className="mt-1 text-xs text-[#cdb98d]">
                                        {item.institution}
                                        {item.category ? ` · ${item.category}` : ""}
                                        {item.year ? ` · ${item.year}` : ""}
                                      </div>
                                    </div>
                                    {item.imageRef ? (
                                      <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                                        影像号 {item.imageRef}
                                      </div>
                                    ) : null}
                                  </div>
                                  {item.sourceText ? (
                                    <div className="mt-3 rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-3 text-sm leading-6 text-[#eadfbc]">
                                      线索字段：{item.sourceText}
                                    </div>
                                  ) : null}
                                </button>
                              ))}
                              {!versionEvidenceSamples.length && !institutionPreview.length ? (
                                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4">
                                  <div className="text-sm text-stone-200">这一层版本尚未落到更细的影像或馆藏线索，机构、传播与时间仍在替它保留回声。</div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSourceEvidence("institution-samples")}
                                      className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                    >
                                      机构归录
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("spread")}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                    >
                                      传播河势
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("timeline")}
                                      className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                                    >
                                      时间回声
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-[#ead8a6]/12 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                              版本凭据
                            </div>
                            <div className="rounded-full bg-[rgba(255,244,214,0.08)] px-3 py-1 text-[10px] text-[#eadfbc]">
                              {activeVersion.editionType ?? "版本节点"}
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-stone-300">
                            <button
                              type="button"
                              onClick={() => {
                                const targetRecord = versionEvidenceSamples[0] ?? institutionPreview[0];

                                if (targetRecord) {
                                  handleSelectInstitutionRecord(targetRecord);
                                  return;
                                }

                                handleOpenSourceEvidence("institution-samples");
                              }}
                              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                            >
                              <div className="text-xs tracking-[0.2em] text-stone-400">馆藏题录</div>
                              <div className="mt-1 font-medium text-stone-100">{activeVersion.library}</div>
                              <div className="mt-2 text-sm leading-6 text-stone-300">
                                {versionEvidenceSamples.length || institutionPreview.length
                                  ? "这一层版本最贴近的馆藏线索或影像线索会在这里显影。"
                                  : "这一层尚未挂到更细线索，机构归录里仍保留馆藏去处。"}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (activeVersionParent?.id) {
                                  setSelectedVersionId(activeVersionParent.id);
                                  return;
                                }

                                const rootVersion = activeVersionTrail[0];
                                if (rootVersion?.id) {
                                  setSelectedVersionId(rootVersion.id);
                                }
                              }}
                              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                            >
                              <div className="text-xs tracking-[0.2em] text-stone-400">存佚状态</div>
                              <div className="mt-1 font-medium text-stone-100">{activeVersion.status}</div>
                              <div className="mt-2 text-sm leading-6 text-stone-300">
                                {activeVersionParent?.id
                                  ? "沿着上游承接，这层版本从何传下、如何保留都会在这里显影。"
                                  : "祖本源头会托出这条版本长链最早的留存起点。"}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (activeVersion.note) {
                                  setTab("timeline");
                                  return;
                                }

                                if (activeVersionChildren[0]?.id) {
                                  setSelectedVersionId(activeVersionChildren[0].id);
                                  return;
                                }

                                handleOpenSourceEvidence("institution-samples");
                              }}
                              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                            >
                              <div className="text-xs tracking-[0.2em] text-stone-400">版本记载</div>
                              <div className="mt-1 font-medium text-stone-100">
                                {activeVersion.note ?? "这一层版本用来标记流变位置。"}
                              </div>
                              <div className="mt-2 text-sm leading-6 text-stone-300">
                                {activeVersion.note
                                  ? "时间线会把这条版本记载重新落到年代与事件里。"
                                  : activeVersionChildren.length
                                    ? "这层暂无额外记载时，可顺着下游版本继续看流变。"
                                    : "没有下游分化时，来源证据里仍可看到与版本名最贴近的线索。"}
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                版本源头由 {activeVersionTrail[0]?.label ?? "祖本卷首"} 托出，
                {versionEvidenceSamples[0]?.title ?? institutionPreview[0]?.title
                  ? ` ${versionEvidenceSamples[0]?.title ?? institutionPreview[0]?.title} 已在卷旁显出馆藏落点。`
                  : " 这一层尚未落到更细的馆藏或影像线索。"}
                {activeVersionChildren.length
                  ? ` ${activeVersionChildren[0]?.label ?? "下游版本"} 正把后续分化继续向下游展开。`
                  : " 更晚的分化层在这一时代河段里尚未继续浮出。"}
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === "timeline" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">关联时间线</h3>
            <span className="text-xs text-[#d8c9a3]">时间显影</span>
          </div>
          {visibleTimeline.length > 0 ? (
            <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(96,66,22,0.72),rgba(42,27,9,0.8))] p-4 shadow-[inset_0_1px_0_rgba(255,244,214,0.06)]">
              <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(70,45,14,0.46),rgba(37,24,8,0.4))] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                      横向年脉
                    </div>
                    <div className="mt-1 text-sm text-[#eadfbc]">
                      成书、刊刻、注疏与现实回声正在同一条时间轨上前后相接
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                    {visibleTimeline.length} 个节点
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto pb-2">
                  <div className="flex min-w-max items-start gap-3">
                    {visibleTimeline.map((item, index) => {
                      const isActive = activeTimelineItem?.id === item.id;

                      return (
                        <div
                          key={`timeline-ribbon-${item.id}`}
                          className="flex items-center gap-3"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectTimelineItem(item.id)}
                            className={`w-52 rounded-[22px] border px-4 py-4 text-left transition ${
                              isActive
                                ? "border-amber-300/35 bg-amber-300/10 shadow-lg shadow-amber-500/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="text-xs text-amber-100">{item.year}</div>
                            <div className="mt-2 text-sm font-medium text-stone-50">
                              {item.title}
                            </div>
                            <div className="mt-2 text-[11px] text-stone-300">
                              {isActive ? "正在聚焦" : "同年回声"}
                            </div>
                          </button>
                          {index < visibleTimeline.length - 1 ? (
                            <div className="h-px w-10 shrink-0 bg-[linear-gradient(90deg,rgba(251,191,36,0.45),rgba(255,255,255,0.08))]" />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(70,45,14,0.46),rgba(37,24,8,0.4))] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                        年脉轨道
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeTimelineItem) {
                            handleFocusEventEvidence();
                            return;
                          }

                          const firstTimelineItem = visibleTimeline[0];
                          if (firstTimelineItem) {
                            handleSelectTimelineItem(firstTimelineItem.id);
                          }
                        }}
                        className="mt-1 text-left text-sm text-[#eadfbc] transition hover:text-[#fbf3da]"
                      >
                        {activeTimelineItem
                          ? "这一事件已经和现实材料彼此扣合。"
                          : "最早显影的事件会在这里托起整条时间脉络。"}
                      </button>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                      {visibleTimeline.length} 个事件
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {visibleTimeline.map((item, index) => {
                      const isActive = activeTimelineItem?.id === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTimelineItem(item.id)}
                          className={`flex w-full gap-3 rounded-[22px] border px-4 py-4 text-left transition ${
                            isActive
                              ? "border-amber-300/35 bg-amber-300/10 shadow-lg shadow-amber-500/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex w-10 flex-col items-center pt-1">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                isActive ? "bg-amber-300" : "bg-white/30"
                              }`}
                            />
                            {index < visibleTimeline.length - 1 ? (
                              <div className="mt-1 h-full w-px bg-white/10" />
                            ) : null}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-amber-100">{item.year}</div>
                              <span
                                className={`rounded-full border px-2 py-1 text-[10px] ${
                                  sourceBadgeClass(timelineSourceMeta(item.source).tone)
                                }`}
                              >
                                {timelineSourceMeta(item.source).label}
                              </span>
                            </div>
                            <div className="mt-1 font-medium text-stone-50">{item.title}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                  {activeTimelineItem ? (
                    <>
                      <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                        事件显影
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-2xl font-semibold text-[#fbf3da]">
                          {activeTimelineItem.title}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-amber-300/10 px-3 py-1 text-sm text-amber-100">
                            {activeTimelineItem.year}
                          </div>
                          {activeTimelineItem.source === "cbdb" ? (
                            <div className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                              真实活动信号
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const previous = visibleTimeline[activeTimelineIndex - 1];
                            if (previous) {
                              handleSelectTimelineItem(previous.id);
                            }
                          }}
                          disabled={activeTimelineIndex <= 0}
                          className={`rounded-full px-3 py-1.5 text-xs transition ${
                            activeTimelineIndex > 0
                              ? "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                              : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                          }`}
                        >
                          前一事
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = visibleTimeline[activeTimelineIndex + 1];
                            if (next) {
                              handleSelectTimelineItem(next.id);
                            }
                          }}
                          disabled={
                            activeTimelineIndex < 0 ||
                            activeTimelineIndex >= visibleTimeline.length - 1
                          }
                          className={`rounded-full px-3 py-1.5 text-xs transition ${
                            activeTimelineIndex >= 0 &&
                            activeTimelineIndex < visibleTimeline.length - 1
                              ? "border border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20"
                              : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                          }`}
                        >
                            后一事
                        </button>
                      </div>
                      <div className="mt-4 rounded-2xl border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">时间卷轴</div>
                            <div className="mt-1 text-sm text-[#eadfbc]">
                              第 {Math.max(activeTimelineIndex + 1, 1)} / {Math.max(visibleTimeline.length, 1)} 事
                            </div>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-stone-300">
                            顺时推看
                          </div>
                        </div>
                        {activeTimelineWindow.length > 1 ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {activeTimelineWindow.map((item) => {
                              const isActive = item.id === activeTimelineItem.id;

                              return (
                                <button
                                  key={`timeline-window-${item.id}`}
                                  type="button"
                                  onClick={() => handleSelectTimelineItem(item.id)}
                                  className={`rounded-[18px] border px-3 py-3 text-left transition ${
                                    isActive
                                      ? "border-amber-300/30 bg-amber-300/10"
                                      : "border-white/10 bg-white/5 hover:bg-white/10"
                                  }`}
                                >
                                  <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">
                                    {isActive ? "正在显影" : "邻近回声"}
                                  </div>
                                  <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                                    {item.title}
                                  </div>
                                  <div className="mt-2 text-[11px] text-amber-100">{item.year}</div>
                                  <div className="mt-2 line-clamp-2 text-[11px] leading-5 text-stone-300">
                                    {item.detail}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-4 text-sm leading-7 text-stone-300">
                        {activeTimelineItem.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            handleFocusEventEvidence();
                          }}
                          className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                        >
                          事件证据
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab("versions")}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                        >
                          版本流变
                        </button>
                      </div>
                      {activeTimelineMeta ? (
                        <div className="mt-4 rounded-2xl border border-amber-300/10 bg-amber-300/5 px-4 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs ${sourceBadgeClass(activeTimelineMeta.tone)}`}
                            >
                              {activeTimelineMeta.label}
                            </span>
                            <span className="text-sm text-stone-300">
                              {activeTimelineMeta.detail}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setTab("passages")}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                            >
                              文本溯源
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {activeTimelineEventEchoes.length || activeTimelineInstitutionEchoes.length ? (
                        <div className="mt-4 rounded-2xl border border-amber-300/10 bg-amber-300/5 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs tracking-[0.2em] text-amber-100/75">
                              现实回声
                            </div>
                            <div className="text-[10px] text-amber-100/70">
                              与此年最贴近
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3">
                            {activeTimelineEventEchoes.map((event) => (
                              <button
                                key={`timeline-event-echo-${event.venue}-${event.title}-${event.startTime}`}
                                type="button"
                                onClick={() => {
                                  handleSelectEventSample(event);
                                  handleFocusEventEvidence();
                                }}
                                className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4 text-left transition hover:bg-[rgba(255,255,255,0.08)]"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-medium text-stone-50">{event.title}</div>
                                  <div className="rounded-full bg-amber-300/10 px-2 py-1 text-[10px] text-amber-100">
                                    事件证据
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-stone-400">
                                  {event.venue} · {event.startTime}
                                </div>
                                <div className="mt-2 text-sm text-stone-300">
                                  {event.status}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                                    对应年份
                                  </span>
                                  <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] text-stone-300">
                                    事件证据
                                  </span>
                                </div>
                              </button>
                            ))}
                            {activeTimelineInstitutionEchoes.map((item) => (
                              <button
                                key={`timeline-institution-echo-${item.institution}-${item.title}-${item.year ?? "unknown"}`}
                                type="button"
                                onClick={() => handleSelectInstitutionRecord(item)}
                                className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4 text-left transition hover:bg-[rgba(255,255,255,0.08)]"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-medium text-stone-50">{item.title}</div>
                                  <div className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-stone-300">
                                    馆藏去处
                                  </div>
                                </div>
                                <div className="mt-2 text-xs text-stone-400">
                                  {item.institution}
                                  {item.category ? ` · ${item.category}` : ""}
                                  {item.year ? ` · ${item.year}` : ""}
                                </div>
                                {item.sourceText ? (
                                  <div className="mt-2 text-sm leading-6 text-stone-300">
                                    {item.sourceText}
                                  </div>
                                ) : null}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setTab("people");
                                    }}
                                    className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/10"
                                  >
                                    人物关系
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setTab("passages");
                                    }}
                                    className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                  >
                                    文本溯源
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleOpenSourceEvidence("institution-samples");
                                    }}
                                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                                  >
                                    机构卷录
                                  </button>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : fallbackTimelineInstitutionEchoes.length ? (
                        <div className="mt-4 rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                              现实回声
                            </div>
                            <div className="text-[10px] text-[#cdb98d]">机构回查线索</div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenSourceEvidence("institution-samples")}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              机构卷录
                            </button>
                            <button
                              type="button"
                              onClick={() => setTab("versions")}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                            >
                              版本流变
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3">
                            {fallbackTimelineInstitutionEchoes.map((item) => (
                              <button
                                key={`timeline-fallback-echo-${item.institution}-${item.title}-${item.year ?? "unknown"}`}
                                type="button"
                                onClick={() => handleSelectInstitutionRecord(item)}
                                className="rounded-2xl border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4 text-left transition hover:bg-[rgba(255,244,214,0.12)]"
                              >
                                <div className="text-sm font-medium text-[#fbf3da]">{item.title}</div>
                                <div className="mt-2 text-xs text-[#cdb98d]">
                                  {item.institution}
                                  {item.category ? ` · ${item.category}` : ""}
                                  {item.year ? ` · ${item.year}` : ""}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setTab("people");
                                    }}
                                    className="rounded-full border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-3 py-1.5 text-xs text-[#eadfbc] transition hover:bg-[rgba(255,244,214,0.12)]"
                                  >
                                    人物关系
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setTab("passages");
                                    }}
                                    className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                  >
                                    文本溯源
                                  </button>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 rounded-[22px] border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] px-4 py-4">
                        <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                          时间定位
                        </div>
                        <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2">
                          {visibleTimeline.map((item) => {
                            const isActive = item.id === activeTimelineItem.id;
                            return (
                              <div key={item.id} className="flex min-w-max items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleSelectTimelineItem(item.id)}
                                  className={`rounded-full px-3 py-2 text-xs ${
                                    isActive
                                      ? "bg-amber-300 text-stone-950"
                                      : "border border-[#d8b56f]/18 bg-[rgba(255,244,214,0.08)] text-[#eadfbc] hover:bg-[rgba(255,244,214,0.12)]"
                                  }`}
                                >
                                  {item.year}
                                </button>
                                {item.id !== visibleTimeline[visibleTimeline.length - 1]?.id ? (
                                  <div className="h-px w-8 bg-gradient-to-r from-amber-300/35 to-transparent" />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          {detail.realWorldSignals?.eventSamples?.length ? (
            <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-stone-50">上图活动时间资料</h4>
                <span className="text-xs text-stone-400">真实传播现场</span>
              </div>
              <div className="mt-3 space-y-2">
                {detail.realWorldSignals.eventSamples.map((event) => (
                  <button
                    key={`${event.venue}-${event.title}-${event.startTime}`}
                    type="button"
                    onClick={() => handleSelectEventSample(event)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-stone-100">
                        {event.title}
                      </span>
                      <span className="rounded-full bg-amber-300/10 px-2 py-1 text-xs text-amber-100">
                        {event.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-stone-400">
                      {event.venue} · {event.startTime}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectEventSample(event)}
                        className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1.5 text-xs text-amber-100 transition hover:bg-amber-300/18"
                      >
                        对应时间线
                      </button>
                      <button
                        type="button"
                        onClick={handleFocusEventEvidence}
                        className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                      >
                        事件证据
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const matchedSpread =
                            linkedVenueSpreadMap.get(event.venue) ?? activeSpread ?? visibleSpread[0] ?? null;

                          if (matchedSpread?.id) {
                            setSelectedSpreadId(matchedSpread.id);
                          }

                          setSelectedSourceEvidenceId("venue-samples");
                          setTab("spread");
                        }}
                        className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/10"
                      >
                        对应场馆传播
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "passages" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">文本对读与溯源</h3>
            <span className="text-xs text-stone-400">微观显影</span>
          </div>
          {visiblePassages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6">
              <div className="text-sm text-stone-200">这一时代河段尚未浮出可供逐字对读的片段，版本与时间两条线仍在替这一卷保留回声。</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab("versions")}
                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                >
                  版本流变
                </button>
                <button
                  type="button"
                  onClick={() => setTab("timeline")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                >
                  时间回声
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("institution-samples")}
                  className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                >
                  机构归录
                </button>
              </div>
            </div>
          ) : activePassage ? (
            <>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_248px]">
                <div className="rounded-[24px] border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                        文本片段
                      </div>
                      <div className="mt-1 text-lg font-semibold text-[#fbf3da]">
                        {activePassage.section}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassageLayout("horizontal")}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          passageLayout === "horizontal"
                            ? "bg-[#f3dfab] text-[#42290a]"
                            : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                        }`}
                      >
                        横排
                      </button>
                      <button
                        type="button"
                        onClick={() => setPassageLayout("vertical")}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          passageLayout === "vertical"
                            ? "bg-[#f3dfab] text-[#42290a]"
                            : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc]"
                        }`}
                      >
                        竖排
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visiblePassages.map((passage) => (
                      <button
                        key={passage.id}
                        type="button"
                        onClick={() => handleSelectPassage(passage.id)}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          activePassageId === passage.id
                            ? "bg-[#f3dfab] text-[#42290a]"
                            : "border border-[#ead8a6]/18 bg-[rgba(27,17,7,0.18)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.08)]"
                        }`}
                      >
                        {passage.section}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[20px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.05)] px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] tracking-[0.22em] text-[#d8c9a3]">
                          文本长卷
                        </div>
                        <div className="mt-1 text-sm text-[#eadfbc]">
                          第 {Math.max(activePassageSequenceIndex + 1, 1)} / {Math.max(visiblePassages.length, 1)} 段
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const previousPassage = visiblePassages[activePassageSequenceIndex - 1];
                            if (previousPassage?.id) {
                              handleSelectPassage(previousPassage.id);
                            }
                          }}
                          disabled={activePassageSequenceIndex <= 0}
                          className={`rounded-full px-3 py-1.5 text-xs transition ${
                            activePassageSequenceIndex <= 0
                              ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                          }`}
                        >
                          前一段
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const nextPassage = visiblePassages[activePassageSequenceIndex + 1];
                            if (nextPassage?.id) {
                              handleSelectPassage(nextPassage.id);
                            }
                          }}
                          disabled={activePassageSequenceIndex >= visiblePassages.length - 1}
                          className={`rounded-full px-3 py-1.5 text-xs transition ${
                            activePassageSequenceIndex >= visiblePassages.length - 1
                              ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                              : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                          }`}
                        >
                          后一段
                        </button>
                      </div>
                    </div>
                    {activePassageSequenceWindow.length > 1 ? (
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        {activePassageSequenceWindow.map((passage) => {
                          const isActive = passage.id === activePassage.id;

                          return (
                            <button
                              key={`passage-window-${passage.id}`}
                              type="button"
                              onClick={() => handleSelectPassage(passage.id)}
                              className={`rounded-[18px] border px-3 py-3 text-left transition ${
                                isActive
                                  ? "border-amber-300/30 bg-amber-300/10"
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div className="text-[10px] tracking-[0.18em] text-[#d8c9a3]">
                                {isActive ? "卷心片段" : "邻近片段"}
                              </div>
                              <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                                {passage.section}
                              </div>
                              <div className="mt-2 text-[11px] leading-5 text-[#d8c9a3]">
                                {passage.links.length} 条证据 · {passage.tracePath?.length ?? 0} 层上游
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-[20px] border border-[#ead8a6]/14 bg-[rgba(36,22,8,0.28)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.22em] text-[#d8c9a3]">
                      溯源判读图例
                    </div>
                    <div className="mt-3 grid gap-2 text-[11px] text-[#eadfbc] md:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-emerald-300/24 bg-emerald-300/14 px-2 py-1 text-emerald-100">
                          高
                        </span>
                        <span>显式引用：如“某书云”等直接引述</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-amber-300/24 bg-amber-300/14 px-2 py-1 text-amber-100">
                          中
                        </span>
                        <span>语义关联：文字相近而未明引</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-dashed border-white/18 bg-white/6 px-2 py-1 text-stone-300">
                          低
                        </span>
                        <span>间接影响：思想呼应但文本差异较大</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded border border-white/14 bg-white/8 px-2 py-1 text-stone-200">
                          书目
                        </span>
                        <span>书目关联：来自元数据与版本关系</span>
                      </div>
                    </div>
                  </div>
                </div>

              <div className="rounded-[24px] border border-[#e1bd6e]/18 bg-[linear-gradient(180deg,rgba(194,140,42,0.18),rgba(62,39,12,0.26))] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs tracking-[0.22em] text-amber-100/75">
                      微观探源台
                    </div>
                    <div className="mt-1 text-sm font-medium text-amber-50">
                      一段文字会同时牵出证据、上游源流与下游分化三条脉络
                    </div>
                  </div>
                  <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                    片段 · {activePassage.section}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeLink ? (
                    <button
                      type="button"
                      onClick={handleOpenLinkedBook}
                      className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-xs text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                    >
                      源典
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleStartTrace}
                    disabled={!activePassage?.tracePath?.length || tracePlaying}
                    className={`rounded-full px-3 py-1.5 text-xs transition ${
                      !activePassage?.tracePath?.length
                        ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                        : tracePlaying
                          ? "border border-amber-300/20 bg-amber-300/12 text-amber-100"
                          : "border border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20"
                    }`}
                  >
                    {tracePlaying ? "溯源进行中" : "启动溯源"}
                  </button>
                  {activePassage.tracePath?.[0] ? (
                    <button
                      type="button"
                      onClick={() => handleOpenTraceBook(activePassage.tracePath![0]!.title)}
                      disabled={!bookSlugByTitle.has(activePassage.tracePath[0].title)}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        bookSlugByTitle.has(activePassage.tracePath[0].title)
                          ? "border border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20"
                          : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                      }`}
                    >
                      上游源典
                    </button>
                  ) : null}
                  {activePassage.downstreamInfluence?.[0] ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDownstreamBook(activePassage.downstreamInfluence![0]!.targetTitle)}
                      disabled={!bookSlugByTitle.has(activePassage.downstreamInfluence[0].targetTitle)}
                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                        bookSlugByTitle.has(activePassage.downstreamInfluence[0].targetTitle)
                          ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15"
                          : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                      }`}
                    >
                      下游典籍
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setTab("timeline")}
                    className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                  >
                    时间回声
                  </button>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => {
                      const firstLink = activePassage.links[0];

                      if (firstLink) {
                        handleSelectLink(firstLink.id);
                      }
                    }}
                    className="rounded-[20px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                  >
                    <div className="text-[10px] tracking-[0.2em] text-[#d8c9a3]">第一步 · 对读判读</div>
                    <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                      {activeLink?.sourceTitle ?? activePassage.links[0]?.sourceTitle ?? "首条证据"}
                    </div>
                    <div className="mt-2 text-[11px] leading-5 text-[#eadfbc]">
                      {activeLink
                        ? `${activeLink.confidenceLabel} 置信度，这条证据已经在原文中被高亮照出。`
                        : `这一片段共显出 ${activePassage.links.length} 条证据。`}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleStartTrace}
                    disabled={!activePassage.tracePath?.length}
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      activePassage.tracePath?.length
                        ? "border-amber-300/18 bg-[rgba(255,248,220,0.06)] hover:bg-[rgba(255,248,220,0.1)]"
                        : "cursor-not-allowed border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="text-[10px] tracking-[0.2em] text-[#d8c9a3]">第二步 · 逆流回看</div>
                    <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                      {activePassage.tracePath?.[0]?.title ?? "等待上游链路"}
                    </div>
                    <div className="mt-2 text-[11px] leading-5 text-[#eadfbc]">
                      {activePassage.tracePath?.length
                        ? `已接出 ${activePassage.tracePath.length} 层上游，光线会沿链逐层回溯。`
                        : "更早的上游链路尚未在这一段显影。"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const firstDownstream = activePassage.downstreamInfluence?.[0];

                      if (!firstDownstream) {
                        return;
                      }

                      handleOpenDownstreamBook(firstDownstream.targetTitle);
                    }}
                    disabled={!activePassage.downstreamInfluence?.length}
                    className={`rounded-[20px] border px-4 py-4 text-left transition ${
                      activePassage.downstreamInfluence?.length
                        ? "border-emerald-300/18 bg-[rgba(18,68,50,0.16)] hover:bg-[rgba(18,68,50,0.24)]"
                        : "cursor-not-allowed border-white/10 bg-white/5"
                    }`}
                  >
                    <div className="text-[10px] tracking-[0.2em] text-[#cfe8dc]">第三步 · 下游分化</div>
                    <div className="mt-2 text-sm font-medium text-[#f3f0de]">
                      {activePassage.downstreamInfluence?.[0]?.targetTitle ?? "等待下游回声"}
                    </div>
                    <div className="mt-2 text-[11px] leading-5 text-[#dbe6d9]">
                      {activePassage.downstreamInfluence?.length
                        ? `可见 ${activePassage.downstreamInfluence.length} 条下游影响，后续典籍已经从这里分化而出。`
                        : "这一段的下游分化尚未在卷面继续浮出。"}
                    </div>
                  </button>
                </div>
              </div>
              </div>

              <div className="rounded-[24px] border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                <div className="mt-1 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(36,22,8,0.42)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                        原文对读
                      </div>
                      <span className="rounded-full border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.06)] px-3 py-1 text-xs text-[#eadfbc]">
                        {passageLayout === "vertical" ? "竖排模式" : "横排模式"}
                      </span>
                    </div>
                    <div
                      className={`mt-4 rounded-[24px] border border-[#d9bd79]/14 bg-[linear-gradient(180deg,rgba(243,228,186,0.96),rgba(226,201,146,0.92))] px-5 py-5 text-[#4a2c08] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)] ${
                        passageLayout === "vertical"
                          ? "max-h-[320px] overflow-x-auto [writing-mode:vertical-rl] text-lg leading-10 tracking-[0.25em]"
                          : "text-sm leading-9"
                      }`}
                    >
                      <div
                        className={
                          passageLayout === "vertical"
                            ? "flex flex-col gap-3"
                            : "flex flex-wrap gap-x-2 gap-y-3"
                        }
                      >
                        {activePassageSegments.map((segment, index) => {
                          const isActive = segment.link?.id === activeLinkId;

                          if (!segment.link) {
                            return (
                              <span key={`${activePassage.id}-plain-${index}`}>
                                {segment.text}
                              </span>
                            );
                          }

                          return (
                            <button
                              key={`${activePassage.id}-${segment.link.id}`}
                              type="button"
                              onClick={() => {
                                if (isActive && segment.link?.sourceBookId) {
                                  handleOpenSpecificLinkedBook(segment.link.sourceBookId);
                                  return;
                                }

                                handleSelectLink(segment.link!.id);
                              }}
                              className={`rounded-xl border px-2 py-1 text-left transition ${
                                passageHighlightClass(
                                  segment.link.confidenceLabel,
                                  isActive,
                                )
                              } ${
                                passageLayout === "vertical"
                                  ? "min-h-[7rem] min-w-[2.4rem]"
                                  : ""
                              }`}
                              title={`${segment.link.sourceTitle} · ${segment.link.confidenceLabel}置信度`}
                            >
                              {segment.text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone-400">
                      <button
                        type="button"
                        onClick={() => handleFocusFirstLinkByConfidence("高")}
                        disabled={!activePassage.links.some((link) => link.confidenceLabel === "高")}
                        className={`rounded-full px-3 py-1 text-left transition ${
                          activePassage.links.some((link) => link.confidenceLabel === "高")
                            ? "border border-emerald-300/18 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/16"
                            : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                        }`}
                      >
                        聚焦高置信证据
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFocusFirstLinkByConfidence("中")}
                        disabled={!activePassage.links.some((link) => link.confidenceLabel === "中")}
                        className={`rounded-full px-3 py-1 text-left transition ${
                          activePassage.links.some((link) => link.confidenceLabel === "中")
                            ? "border border-amber-300/18 bg-amber-300/10 text-amber-100 hover:bg-amber-300/16"
                            : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                        }`}
                      >
                        聚焦中置信证据
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFocusFirstLinkByConfidence("低")}
                        disabled={!activePassage.links.some((link) => link.confidenceLabel === "低")}
                        className={`rounded-full px-3 py-1 text-left transition ${
                          activePassage.links.some((link) => link.confidenceLabel === "低")
                            ? "border border-dashed border-white/14 bg-white/5 text-stone-300 hover:bg-white/10"
                            : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                        }`}
                      >
                        聚焦低置信回声
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const firstLink = activePassage.links[0];

                          if (!firstLink) {
                            return;
                          }

                          handleSelectLink(firstLink.id);
                        }}
                        disabled={!activePassage.links.length}
                        className={`rounded-full px-3 py-1 text-left transition ${
                          activePassage.links.length
                            ? "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                            : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                        }`}
                      >
                        首层证据
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activePassage.links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => {
                            if (activeLinkId === link.id) {
                              handleOpenSpecificLinkedBook(link.sourceBookId);
                              return;
                            }

                            handleSelectLink(link.id);
                          }}
                          className={`text-xs transition ${
                            activeLinkId === link.id
                              ? "rounded bg-amber-300 px-2 py-1 text-stone-950"
                              : inlineConfidenceClass(link.confidenceLabel)
                          }`}
                        >
                          {link.sourceTitle} · {link.confidenceLabel}置信度
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(36,22,8,0.42)] px-4 py-4">
                    <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">
                      引用证据
                    </div>
                    <div className="mt-3 space-y-2">
                      {activePassage.links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => {
                            if (activeLinkId === link.id) {
                              handleOpenSpecificLinkedBook(link.sourceBookId);
                              return;
                            }

                            handleSelectLink(link.id);
                          }}
                          className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                            activeLinkId === link.id
                              ? "border-amber-300/35 bg-amber-300/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="font-medium text-stone-50">
                                {link.sourceTitle}
                              </span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSelectLink(link.id)}
                                  className={`rounded-full px-3 py-1.5 text-xs transition ${
                                    activeLinkId === link.id
                                      ? "bg-amber-300 text-stone-950"
                                      : "border border-white/10 bg-black/15 text-stone-300 hover:bg-white/10"
                                  }`}
                                >
                                  {activeLinkId === link.id ? "卷心证据" : "照亮此证"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSpecificLinkedBook(link.sourceBookId)}
                                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                >
                                  源典原卷
                                </button>
                              </div>
                            </div>
                            <span
                              className={`rounded-full border px-2 py-1 text-xs ${confidenceClass(link.confidenceLabel)}`}
                            >
                              {link.confidenceLabel}置信度
                            </span>
                          </div>
                          <div className="mt-2 text-stone-200">{link.quote}</div>
                          <p className="mt-2 text-stone-300">{link.evidence}</p>
                        </button>
                      ))}
                    </div>

                    {activeLink ? (
                      <div className="mt-4 rounded-2xl border border-amber-300/10 bg-amber-300/5 px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs tracking-[0.2em] text-amber-100/75">
                              卷心证据
                            </div>
                            <div className="mt-2 text-sm font-medium text-amber-50">
                              {activeLink.sourceTitle}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenLinkedBook}
                            className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-2 text-xs text-amber-50 transition hover:bg-amber-300/20"
                          >
                            源典原卷
                          </button>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-amber-50/90">
                          {activeLink.evidence}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-amber-50">溯源光线链路</h4>
                      <span className="text-xs text-amber-100/70">
                        已推进 {tracePlaying ? Math.min(traceStep + 1, activePassage.tracePath?.length ?? 0) : 0} /
                        {activePassage.tracePath?.length ?? 0}
                      </span>
                    </div>
                    {activePassage.tracePath?.length ? (
                      <div className="mt-3 space-y-4">
                        <div className="overflow-hidden rounded-[24px] border border-amber-300/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),rgba(19,11,4,0.96))] px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs tracking-[0.2em] text-amber-100/70">
                              溯源场
                            </div>
                            <div className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                              逆流回溯
                            </div>
                          </div>
                          <div className="mt-4">
                            <TraceLightField
                              traces={activePassage.tracePath}
                              activeIndex={
                                tracePlaying
                                  ? Math.min(traceStep, activePassage.tracePath.length - 1)
                                  : 0
                              }
                              playing={tracePlaying}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          {activePassage.tracePath.map((trace, index) => {
                            const isActive = tracePlaying && index <= traceStep;
                            return (
                              <div key={trace.id} className="flex gap-3">
                                <div className="flex w-8 flex-col items-center pt-1">
                                  <div
                                    className={`h-3 w-3 rounded-full transition ${
                                      isActive ? "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.55)]" : "bg-white/20"
                                    }`}
                                  />
                                  {index < activePassage.tracePath!.length - 1 ? (
                                    <div
                                      className={`mt-1 h-full w-px transition ${
                                        isActive ? "bg-amber-300/35" : "bg-white/10"
                                      }`}
                                    />
                                  ) : null}
                                </div>
                                <div
                                  className={`flex-1 rounded-2xl px-3 py-3 transition ${
                                    isActive
                                      ? "bg-amber-300/10 ring-1 ring-amber-300/15"
                                      : "bg-black/15"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-medium text-stone-50">
                                      {trace.title}
                                    </span>
                                    <span className="rounded-full bg-amber-300/10 px-2 py-1 text-xs text-amber-100">
                                      {trace.relation}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-stone-300">
                                    {trace.note}
                                  </p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenTraceBook(trace.title)}
                                      disabled={!bookSlugByTitle.has(trace.title)}
                                      className={`rounded-full px-3 py-1.5 text-xs transition ${
                                        bookSlugByTitle.has(trace.title)
                                          ? "border border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20"
                                          : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                      }`}
                                    >
                                      {bookSlugByTitle.has(trace.title)
                                        ? "上游典籍"
                                        : "版本续脉"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                        <div className="text-sm text-stone-200">这一段尚未显出更早的上游链路，证据、版本与时间仍在卷中保留源头回声。</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeLink ? (
                            <button
                              type="button"
                              onClick={() => handleSelectLink(activeLink.id)}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              卷心证据
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setTab("versions")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            版本续脉
                          </button>
                          <button
                            type="button"
                            onClick={() => setTab("timeline")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            时间回声
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-amber-50">下游影响追踪</h4>
                      <span className="text-xs text-amber-100/70">反向查看</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-stone-400">
                      <span className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                        高：直接承继
                      </span>
                      <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-amber-100">
                        中：化用延展
                      </span>
                      <span className="rounded-full border border-dashed border-white/14 bg-white/5 px-3 py-1 text-stone-300">
                        低：参考性影响
                      </span>
                    </div>
                    {activePassage.downstreamInfluence?.length ? (
                      <div className="mt-3 space-y-2">
                        {activePassage.downstreamInfluence.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded-2xl border px-3 py-3 ${downstreamConfidenceCardClass(item.confidenceLabel)}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-stone-50">
                                {item.targetTitle}
                              </span>
                              <span
                                className={`rounded-full border px-2 py-1 text-xs ${confidenceClass(item.confidenceLabel)}`}
                              >
                                {item.confidenceLabel}置信度
                              </span>
                            </div>
                            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-stone-400">
                              {item.relation}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-stone-300">
                              {item.note}
                            </p>
                            {item.confidenceLabel === "低" ? (
                              <div className="mt-3 rounded-2xl border border-dashed border-white/14 bg-white/5 px-3 py-3">
                                <div className="text-xs tracking-[0.2em] text-stone-400">时间回声</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {activeLink ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectLink(activeLink.id)}
                                      className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                    >
                                      证据源头
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => setTab("timeline")}
                                  className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                >
                                    时间回声
                                  </button>
                                </div>
                              </div>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenDownstreamBook(item.targetTitle)}
                                disabled={!bookSlugByTitle.has(item.targetTitle)}
                                className={`rounded-full px-3 py-1.5 text-xs transition ${
                                  bookSlugByTitle.has(item.targetTitle)
                                    ? "border border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20"
                                    : "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                                }`}
                              >
                                {bookSlugByTitle.has(item.targetTitle)
                                  ? "下游典籍"
                                  : "人物余波"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                        <div className="text-sm text-stone-200">这一段更晚的承接脉络尚未在现有材料里浮出，但下游回声仍被卷面保留下来。</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeLink ? (
                            <button
                              type="button"
                              onClick={() => handleSelectLink(activeLink.id)}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              证据源头
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setTab("people")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            人物余波
                          </button>
                          <button
                            type="button"
                            onClick={() => setTab("spread")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            传播河势
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
