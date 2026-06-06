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
      label: "传播建模 + 上图场馆信号",
      tone: "hybrid" as const,
      detail: "传播航段已经与上图场馆资料和活动信号合流，可顺着城市与事件继续追看扩散路径。",
    };
  }

  return {
    label: "传播关系建模",
    tone: "curated" as const,
    detail: "这一层先以传播航段和地理叙事立住主线，可直接顺着河道讲清扩散路径。",
  };
}

function versionSourceMeta(library: string) {
  if (library.includes("上海") || library.includes("图书馆") || library.includes("馆")) {
    return {
      label: "馆藏/书目来源",
      tone: "hybrid" as const,
      detail: "版本链已经落到具体馆藏或系统名称，可直接顺着版本与馆藏双线讲清流变位置。",
    };
  }

  return {
    label: "版本流变建模",
    tone: "curated" as const,
    detail: "这一层先以版本先后和流变结构立住主线，适合直接回看祖本与下游分化。",
  };
}

function versionStatusMeta(status: VersionNode["status"]) {
  if (status === "存世") {
    return {
      badge: "今有存本",
      badgeClass: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
      detail: "这层版本今天仍能见到实物或馆藏记录，可直接作为版本链中的落点。",
    };
  }

  return {
    badge: "仅见佚痕",
    badgeClass: "border-slate-300/18 bg-slate-300/10 text-slate-100",
    detail: "这层版本主要凭前后版本关系和文献记载回看出来，适合标记失传层与断裂处。",
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
      detail: "这条时间回声来自真实纪传中的时间与地点线索，可直接托住传播叙事。",
    };
  }

  return {
    label: "叙事时间节点",
    tone: "curated" as const,
    detail: "该事件用于补齐典籍叙事主线，目前仍以现有时间节点组织为主。",
  };
}

export function BookExplorer({
  book,
  detail,
  forcedTab,
  activeEra,
  onTraceFocusChange,
  onSceneFocusChange,
  onOpenBook,
}: {
  book: BookNode;
  detail: BookDetail;
  forcedTab?: ExplorerTab | null;
  activeEra: RiverEra;
  onTraceFocusChange?: (focus: TraceFocusState | null) => void;
  onSceneFocusChange?: (focus: SceneFocusState | null) => void;
  onOpenBook?: (slug: string) => void;
}) {
  const [tab, setTab] = useState<ExplorerTab>("spread");
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
  const activeTimelineItem =
    visibleTimeline.find((item) => item.id === resolvedTimelineId) ?? visibleTimeline[0];
  const activeTimelineIndex = activeTimelineItem
    ? visibleTimeline.findIndex((item) => item.id === activeTimelineItem.id)
    : -1;
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
  const activeLink = useMemo(() => {
    return activePassage?.links.find((link) => link.id === selectedLinkId) ?? activePassage?.links[0];
  }, [activePassage, selectedLinkId]);
  const activeLinkId = activeLink?.id ?? null;
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
  const activeTab = forcedTab ?? tab;
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
        detail: `${activeSpread.startYear} 至 ${activeSpread.endYear} 的传播航段已回灌到主河道焦点。`,
      };
    }

    if (activeTab === "people" && activePerson) {
      return {
        active: true,
        mode: "people",
        currentTitle: book.title,
        contextLabel: `人物联动：${activePerson.name}`,
        detail: `${activePerson.name} 的关系层级与人物角色正在驱动主河道聚焦当前典籍及其直接关系。`,
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
        detail: `${activeTimelineItem.year} 年事件正驱动主河道对当前典籍的镜头聚焦。`,
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
  const heroEntryCards = [
    {
      label: "直接引用",
      value: detail.heroMetric.directCitations,
      hint: "切到文本溯源",
      onClick: () => setTab("passages"),
    },
    {
      label: "下游影响",
      value: detail.heroMetric.downstreamInfluence,
      hint: "切到人物关系",
      onClick: () => setTab("people"),
    },
    {
      label: "传播区域",
      value: detail.heroMetric.coveredRegions,
      hint: "切到地理传播",
      onClick: () => setTab("spread"),
    },
  ] as const;
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
  const eraEntryCards = [
    {
      label: "传播",
      value: `${eraLinkedSummary.spread} 段`,
      onClick: () => setTab("spread"),
    },
    {
      label: "人物",
      value: `${eraLinkedSummary.people} 人`,
      onClick: () => setTab("people"),
    },
    {
      label: "版本",
      value: `${eraLinkedSummary.versions} 个`,
      onClick: () => setTab("versions"),
    },
    {
      label: "事件",
      value: `${eraLinkedSummary.timeline} 条`,
      onClick: () => setTab("timeline"),
    },
  ] as const;

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

    onOpenBook?.(activeLink.sourceBookId);
  };
  const handleOpenSpecificLinkedBook = (sourceBookId: string) => {
    onOpenBook?.(sourceBookId);
  };
  const handleOpenDownstreamBook = (targetTitle: string) => {
    const targetSlug = bookSlugByTitle.get(targetTitle);

    if (!targetSlug) {
      return;
    }

    onOpenBook?.(targetSlug);
  };
  const handleOpenTraceBook = (traceTitle: string) => {
    const targetSlug = bookSlugByTitle.get(traceTitle);

    if (!targetSlug) {
      return;
    }

    onOpenBook?.(targetSlug);
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
      setSelectedTimelineId(matchedTimeline.id);
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
        setSelectedTimelineId(visibleTimeline[0].id);
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
  const activeInstitutionRecord =
    institutionRecords.find(
      (item) =>
        `${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}` ===
        selectedInstitutionRecordId,
    ) ??
    institutionRecords[0] ??
    null;
  const activeVersionParent = activeVersion?.parentId
    ? visibleVersions.find((version) => version.id === activeVersion.parentId) ?? null
    : null;
  const activeVersionChildren = activeVersion
    ? visibleVersions
        .filter((version) => version.parentId === activeVersion.id)
        .sort((left, right) => left.year - right.year)
    : [];
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
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-[#caa45b]/24 bg-[linear-gradient(180deg,rgba(246,232,191,0.94),rgba(224,197,138,0.92))] px-5 py-5 text-[#4a2c08] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
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
                顺着长河看传播
              </button>
              <button
                type="button"
                onClick={() => setTab("passages")}
                className="rounded-full border border-[#caa45b]/24 bg-white/35 px-3 py-1.5 text-xs text-[#6b4b1d] transition hover:bg-white/50"
              >
                直接入文本溯源
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

      <section className="grid grid-cols-3 gap-3 text-center text-sm">
        {heroEntryCards.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="rounded-[24px] border border-[#caa45b]/18 bg-[rgba(248,237,206,0.12)] px-3 py-3 text-center transition hover:border-[#d7b066]/30 hover:bg-[rgba(248,237,206,0.18)]"
          >
            <div className="text-[#8d6a2c]">{item.label}</div>
            <div className="mt-2 text-xl font-semibold text-[#4a2c08]">{item.value}</div>
            <div className="mt-2 text-[11px] text-[#9d7631]">{item.hint}</div>
          </button>
        ))}
      </section>

      <section className="rounded-[24px] border border-[#e1bd6e]/18 bg-[linear-gradient(180deg,rgba(194,140,42,0.16),rgba(78,50,14,0.2))] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.2em] text-amber-100/75">
              时代联动
            </div>
            <div className="mt-1 text-sm font-medium text-amber-50">
              卷内内容已联动到 {activeEra}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab("timeline")}
            className="rounded-full border border-[#d7b066]/24 bg-[rgba(252,220,124,0.12)] px-3 py-1 text-xs text-[#f7e4a7] transition hover:bg-[rgba(252,220,124,0.18)]"
          >
            可见阶段 {eraLinkedSummary.timeline || 1} 条
          </button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {eraEntryCards.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="rounded-2xl border border-[#ead8a6]/12 bg-[rgba(54,33,10,0.28)] px-3 py-3 text-left text-sm text-[#f6e8bd] transition hover:bg-[rgba(84,54,18,0.4)]"
            >
              <div className="text-[11px] tracking-[0.18em] text-[#d8c9a3]">{item.label}</div>
              <div className="mt-2">{item.value}</div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setTab("passages")}
          className="mt-2 text-xs text-amber-100/75 transition hover:text-amber-50"
        >
          微观文本已显出 {eraLinkedSummary.passages} 个片段，继续入文本溯源细看。
        </button>
      </section>

      <section className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(27,17,7,0.2)] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">
              卷内分栏
            </div>
            <div className="mt-1 text-sm text-[#fbf3da]">
              落在 {activeTabMeta.label}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTab(activeTabMeta.id)}
            className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1 text-[11px] text-[#f2dfab] transition hover:bg-[rgba(255,248,220,0.1)]"
          >
            继续展开
          </button>
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
        <section className="rounded-2xl border border-amber-300/15 bg-amber-300/6 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.2em] text-amber-100/80">
                真实来源信号
              </div>
              <button
                type="button"
                onClick={() => handleOpenSourceEvidence(activeSourceEvidence?.id ?? "institution-samples")}
                className="mt-1 text-left text-sm font-medium text-amber-50 transition hover:text-[#fff2c7]"
              >
                {detail.realWorldSignals.sourceLabel}
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSourceEvidence(activeSourceEvidence?.id ?? "institution-samples")}
              className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100 transition hover:bg-amber-300/18"
            >
              正在映照
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
                人物线索
              </div>
              <div className="mt-2 text-sm text-stone-100">
                纪传库对照 {detail.realWorldSignals.cbdbMatchedPeople ?? 0} 人
              </div>
              <div className="mt-1 text-xs text-stone-400">
                待续人物 {detail.realWorldSignals.cbdbFallbackPeople ?? 0} 人
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleOpenSourceEvidence("venue-samples")}
              className="rounded-2xl border border-amber-300/10 bg-black/15 px-3 py-3 text-left transition hover:bg-white/10"
            >
              <div className="text-xs tracking-[0.2em] text-amber-100/70">
                传播信号
              </div>
              <div className="mt-2 text-sm text-stone-100">
                {detail.realWorldSignals.venueSamples?.length
                  ? `上图场馆资料 ${detail.realWorldSignals.venueSamples.length} 组`
                  : "转看场馆证据"}
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
                          detail: `活动记录 ${venue.sampleCount}`,
                        })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm transition hover:bg-white/10"
                    >
                      <div className="font-medium text-stone-100">{venue.name}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        活动记录 {venue.sampleCount}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4">
                    <div className="text-sm text-stone-200">这一层暂时没有落到场馆样本时，先去时间回声或传播航段继续追看现实落点。</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTab("timeline")}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                      >
                        转看时间回声
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("spread")}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        转看传播航段
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
                    <div className="text-sm text-stone-200">这一层暂时没有落到活动事件样本时，先去传播航段或人物网络继续把扩散路径接起来。</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTab("spread")}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                      >
                        转看传播航段
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("people")}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        转看人物网络
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-amber-300/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.2em] text-amber-100/75">
                  机构资源
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
                    <div className="text-sm text-stone-200">这一层暂时没有落到机构资源样本时，先回版本流变或来源证据总表继续补资源挂接点。</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setTab("versions")}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                      >
                        转看版本流变
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSourceEvidenceId("institution-samples")}
                        className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                      >
                        打开来源总表
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
                    资源细览
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
                    回到版本节点
                  </button>
                ) : null}
                {linkedTimelineFromInstitution ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTimelineId(linkedTimelineFromInstitution.id);
                      setTab("timeline");
                    }}
                    className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-xs text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                  >
                    回到关联时间线
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("institution-samples")}
                  className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-left transition hover:bg-white/10"
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                    资源落点
                  </div>
                  <div className="mt-2 text-sm leading-6 text-stone-300">
                    {[
                      activeInstitutionRecord.institution,
                      activeInstitutionRecord.title,
                      activeInstitutionRecord.year,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className="mt-3 text-xs text-amber-100/80">
                    回到机构总表，继续沿馆藏与版本资源线追看。
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("versions")}
                  className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-left transition hover:bg-white/10"
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                    资源线索
                  </div>
                  <div className="mt-2 text-sm leading-6 text-stone-300">
                    {activeInstitutionRecord.sourceText ?? activeInstitutionRecord.imageRef ?? "已落到馆藏条目，可直接作为当前版本的资源挂接点。"}
                  </div>
                  <div className="mt-3 text-xs text-amber-100/80">
                    转看版本流变，把这条资源线索重新挂回当前版本节点。
                  </div>
                </button>
              </div>
            </div>
          ) : null}
          {sourceEvidence.length ? (
            <div className="mt-4 rounded-2xl border border-amber-300/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.2em] text-amber-100/75">
                    来源证据总表
                  </div>
                  <div className="mt-1 text-sm text-stone-300">
                    将真实来源按人物、场馆、事件与机构资源归并成可核验的证据条目。
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
                        ? "border-amber-300/30 bg-amber-300/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-stone-50">
                          {item.source}
                        </div>
                        <div className="mt-1 text-xs text-stone-400">
                          {item.category}
                        </div>
                      </div>
                      <div className="rounded-full bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                        {item.countLabel}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-stone-300">
                      {item.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-amber-100/80">
                      <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1">
                        路径摘要
                      </span>
                      <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-stone-300">
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
                                ? "查看版本与资源"
                                : "查看相关分栏"}
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
                          证据细览
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
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        回查入口
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm leading-6 text-stone-300">
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
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
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
                          ? "前往人物关系视图"
                          : activeSourceEvidence.id === "venue-samples"
                            ? "前往地理传播视图"
                            : activeSourceEvidence.id === "event-samples"
                              ? "前往关联时间线"
                              : activeSourceEvidence.id === "institution-samples"
                                ? "前往版本与资源线索"
                                : "前往相关视图"}
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {activeSourceEvidence.samples.map((sample) => (
                        <button
                          key={`active-${activeSourceEvidence.id}-${sample.label}-${sample.detail ?? "detail"}`}
                          type="button"
                          onClick={() => handleOpenSourceSample(activeSourceEvidence.id, sample)}
                          className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-left transition hover:bg-white/10"
                        >
                          <div className="text-sm text-stone-100">{sample.label}</div>
                          {sample.detail ? (
                            <div className="mt-1 text-xs leading-6 text-stone-400">
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
            <div className="mt-4 rounded-2xl border border-amber-300/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.2em] text-amber-100/75">
                  机构图像资源资料
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
                        回到机构总表
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
            <h3 className="text-lg font-medium">地理传播图</h3>
            <span className="text-xs text-[#d8c9a3]">中观视图</span>
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
              <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(79,53,18,0.82),rgba(33,21,8,0.92))] p-4">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(37,24,8,0.52)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                          传播航线总览
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
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                        <div className="flex items-center justify-between gap-3 text-[11px] tracking-[0.22em] text-stone-400">
                          <span>传播阶段巡览</span>
                          <span className="text-amber-100">
                            第 {Math.max(activeSpreadIndex + 1, 1)} / {visibleSpread.length} 段
                          </span>
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
                          当前焦点
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
                                打开场馆证据，从起点城市继续核对真实传播样本。
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
                      在 3D 地球上查看典籍传播落点、航线抬升与方向
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
              <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">航段入口</div>
              <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                {activeSpreadPlaces?.from?.name ?? "起点"} → {activeSpreadPlaces?.to?.name ?? "终点"}
              </div>
              <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                回到正在查看的传播航段，顺着城市与年份继续追看知识南迁、北上与分流路径。
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
              <div className="text-xs tracking-[0.2em] text-amber-100/75">场馆入口</div>
              <div className="mt-2 text-sm font-medium text-amber-50">
                {detail.realWorldSignals?.venueSamples?.length ? "上图场馆样本" : "转看时间回声"}
              </div>
              <div className="mt-2 text-sm leading-7 text-amber-50/90">
                {detail.realWorldSignals?.venueSamples?.length
                  ? "沿着上图场馆与活动信号继续回查传播落点，让结构航段和真实样本在同一层合流。"
                  : "这一层暂时没有场馆样本时，直接转看时间回声继续顺着传播事件走。"}
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
                        对应当前航段
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
                              setSelectedTimelineId(matchedTimeline.id);
                            }
                          }

                          handleFocusEventEvidence();
                          setTab("timeline");
                        }}
                        className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1.5 text-xs text-amber-100 transition hover:bg-amber-300/18"
                      >
                        回查活动事件
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSourceEvidenceId("venue-samples");
                        }}
                        className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                      >
                        打开场馆证据
                      </button>
                    </div>
                    {linkedVenueEventMap.get(venue.name)?.length ? (
                      <div className="mt-3 text-xs leading-6 text-stone-400">
                        已挂接 {linkedVenueEventMap.get(venue.name)!.length} 条活动事件，可继续回查时间线。
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
            <h3 className="text-lg font-medium">人物关系网</h3>
            <span className="text-xs text-[#d8c9a3]">中观视图</span>
          </div>
          {visiblePeople.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6">
              <div className="text-sm text-stone-200">这一时代河段暂时没有展开关联人物时，先回查纪传证据或转看传播航段，把人物线索从别的层重新带回当前典籍。</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("cbdb-people")}
                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                >
                  打开人物证据
                </button>
                <button
                  type="button"
                  onClick={() => setTab("spread")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                >
                  转看传播航段
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(79,53,18,0.82),rgba(33,21,8,0.92))] p-4">
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(37,24,8,0.52)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                          人物关系场
                        </div>
                        <div className="mt-1 text-sm text-[#eadfbc]">
                          默认先显现核心人物，按需展开二级支流，避免关系场一次性过载。
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
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
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
                                  : "border border-white/10 bg-black/15 text-stone-300"
                              }`}
                            >
                              {person.name} · {person.role}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
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
                              {secondaryPeopleExpanded ? "收起支流人物" : "展开支流人物"}
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {secondaryPeople.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3">
                              <div className="text-sm text-stone-200">当前人物关系先停在核心人物层。</div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleFocusCbdbEvidence(activePerson?.id)}
                                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                >
                                  打开人物证据
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTab("spread")}
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                >
                                  转看传播航段
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
                                    : "border border-white/10 bg-black/15 text-stone-300"
                                }`}
                              >
                                {person.name} · {person.role}
                              </button>
                            ))
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowSecondaryPeople(true)}
                              className="rounded-2xl border border-dashed border-white/10 px-3 py-3 text-left text-sm leading-6 text-stone-400 transition hover:bg-white/5"
                            >
                              先查看作者、注者、编者等核心人物，再按需展开引用者、评论者、校勘者等支流角色。
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
                              人物焦点
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
                          <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              关系层级
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {(activePerson.relationTier ?? 2) === 1 ? "一级关联" : "二级关联"}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {(activePerson.relationTier ?? 2) === 1
                                ? "该人物直接参与著述、注疏或核心编纂，是典籍关系网中的主干节点。"
                                : "该人物代表后续引用、评论、校勘或再传播，是典籍向外扩散的支流节点。"}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              数据来源
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activePerson.source === "cbdb" ? "纪传库已对照" : "馆内人物整理"}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {activePerson.source === "cbdb"
                                ? `这位人物已接入真实人物纪传数据${activePerson.matchedAlias ? `，匹配别名为 ${activePerson.matchedAlias}` : ""}。`
                                : "这一人物先作为关系节点入网，可顺着传播与证据继续补全人物轨迹。"}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleFocusCbdbEvidence(activePerson.id)}
                                className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                              >
                                回查纪传证据
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
                                  对应传播航段
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
                                  className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4"
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
                                      转看传播航段
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleFocusCbdbEvidence(activePerson.id)}
                                      className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                    >
                                      回查人物证据
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
                            人物回查入口
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleFocusCbdbEvidence(activePerson.id);
                              }}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              打开证据总表
                            </button>
                            {activePerson.activityPlaces?.[0] ? (
                              <button
                                type="button"
                                onClick={() => setTab("spread")}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                              >
                                转看人物传播
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    const primaryTarget = primaryPeople[0] ?? visiblePeople[0] ?? null;

                    if (primaryTarget?.id) {
                      setSelectedPersonId(primaryTarget.id);
                    }
                  }}
                  className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">核心人物入口</div>
                  <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                    {primaryPeople[0]?.name ?? visiblePeople[0]?.name ?? "当前核心人物"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                    直接回到作者、注者、编纂者等核心人物节点，顺着人物主线讲清典籍中心关系。
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (secondaryPeople.length) {
                      setShowSecondaryPeople(true);
                      setSelectedPersonId(secondaryPeople[0]?.id ?? null);
                      return;
                    }

                    setTab("spread");
                  }}
                  className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">支流人物入口</div>
                  <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                    {secondaryPeople[0]?.name ?? "当前转看传播航段"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                    {secondaryPeople.length
                      ? "展开引用者、评论者、校勘者等支流人物，继续把典籍的外扩关系往下讲。"
                      : "这一层暂时没有支流人物时，直接转看传播航段继续顺着外扩路径走。"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("cbdb-people")}
                  className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">纪传入口</div>
                  <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                    {visiblePeople.find((person) => person.source === "cbdb")?.name ?? "打开人物证据总表"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                    直接回到纪传对照证据，核对已匹配人物与馆内整理人物，再折返到当前网络继续讲。
                  </div>
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === "versions" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">版本流变树</h3>
            <span className="text-xs text-[#d8c9a3]">中观视图</span>
          </div>
          {visibleVersions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6">
              <div className="text-sm text-stone-200">这一时代河段暂时没有展开版本链路时，先回机构总表或原文证据，把版本与馆藏线索从别的层重新挂回当前典籍。</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("institution-samples")}
                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                >
                  打开机构总表
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
          ) : (
            <>
              <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(79,53,18,0.82),rgba(33,21,8,0.92))] p-4">
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
                              版本焦点卷
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
                        {activeVersionStatusMeta ? (
                          <div className="mt-4 rounded-2xl border border-slate-300/10 bg-slate-300/5 px-4 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs tracking-[0.2em] text-slate-200/80">
                                存佚入口
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
                                打开机构总表
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
                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-left transition hover:bg-white/10"
                          >
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              版本位置
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activeVersion.place}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              藏馆 / 系统：{activeVersion.library}
                            </div>
                            <div className="mt-3 text-xs text-amber-100/80">
                              打开机构总表，把这一版的位置重新挂回馆藏与影像线索。
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
                            className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-left transition hover:bg-white/10"
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

                        <div className="mt-4 grid gap-3 xl:grid-cols-[0.92fr_1.08fr]">
                          <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                                传承链路
                              </div>
                              <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] text-stone-300">
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
                                      : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
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
                                  <div className="mt-1 text-xs text-stone-400">
                                    {version.place} · {version.library}
                                  </div>
                                </button>
                              ))}
                            </div>
                            {activeVersionParent ? (
                              <button
                                type="button"
                                onClick={() => setSelectedVersionId(activeVersionParent.id)}
                                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-stone-300 transition hover:bg-white/10"
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
                                    打开馆藏线索
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
                            )}
                            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                                下游分化
                              </div>
                              {activeVersionChildren.length ? (
                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  {activeVersionChildren.map((version) => (
                                    <button
                                      key={`child-${version.id}`}
                                      type="button"
                                      onClick={() => setSelectedVersionId(version.id)}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-stone-200 transition hover:bg-white/10"
                                    >
                                      {version.label}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-2 rounded-2xl border border-white/10 bg-black/15 px-3 py-3">
                                  <div className="text-sm text-stone-200">这一时代河段暂时没有更晚分化版本时，先回时间线、人物承接或原文证据继续把流变叙事往后讲。</div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setTab("timeline")}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                    >
                                      转看时间回声
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("people")}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                    >
                                      转看人物承接
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("passages")}
                                      className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                                    >
                                      转看原文证据
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-amber-300/12 bg-amber-300/6 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                                    影像与馆藏线索
                                  </div>
                                  <div className="mt-1 text-sm text-stone-200">
                                  顺着这一层版本继续展开馆藏与影像线索。
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
                                  className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4 text-left transition hover:bg-[rgba(255,255,255,0.08)]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-medium text-stone-50">
                                        {item.title}
                                      </div>
                                      <div className="mt-1 text-xs text-stone-400">
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
                                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-sm leading-6 text-stone-300">
                                      线索字段：{item.sourceText}
                                    </div>
                                  ) : null}
                                </button>
                              ))}
                              {!versionEvidenceSamples.length && !institutionPreview.length ? (
                                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4">
                                  <div className="text-sm text-stone-200">这一层版本暂时没有更细的影像或馆藏样本时，先回机构总表、传播航段或时间回声继续补资源落点。</div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenSourceEvidence("institution-samples")}
                                      className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                    >
                                      打开机构总表
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("spread")}
                                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                    >
                                      转看传播航段
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setTab("timeline")}
                                      className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                                    >
                                      转看时间回声
                                    </button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              版本证据卡
                            </div>
                            <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] text-stone-300">
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
                              <div className="text-xs tracking-[0.2em] text-stone-400">馆藏 / 系统</div>
                              <div className="mt-1 font-medium text-stone-100">{activeVersion.library}</div>
                              <div className="mt-2 text-sm leading-6 text-stone-300">
                                {versionEvidenceSamples.length || institutionPreview.length
                                  ? "顺手打开这一层版本最贴近的馆藏样本或影像线索。"
                                  : "这一层暂未挂到更细样本时，先回机构总表继续追馆藏。"}
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
                                  ? "沿着上游承接回查这层版本从哪里传下、如何保留下来。"
                                  : "直接回到祖本入口，看这条版本链最早的留存起点。"}
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
                                  ? "转看时间线，把这条版本记载落到年代与事件里继续讲。"
                                  : activeVersionChildren.length
                                    ? "这层暂无额外记载时，顺着下游版本继续看流变。"
                                    : "没有下游分化时，回查来源证据里与版本名称最接近的线索。"}
                              </div>
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => {
                    const rootVersion = activeVersionTrail[0];

                    if (rootVersion?.id) {
                      setSelectedVersionId(rootVersion.id);
                    }
                  }}
                  className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">祖本入口</div>
                  <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                    {activeVersionTrail[0]?.label ?? "祖本卷首"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                    直接回到版本链起点，看这部典籍最早显现的版本源头。
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetRecord = versionEvidenceSamples[0] ?? institutionPreview[0];

                    if (targetRecord) {
                      handleSelectInstitutionRecord(targetRecord);
                    }
                  }}
                  className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">馆藏入口</div>
                  <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                    {versionEvidenceSamples[0]?.title ?? institutionPreview[0]?.title ?? "就近馆藏线索"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                    {versionEvidenceSamples.length || institutionPreview.length
                      ? "直接打开当前版本最贴近的一条馆藏或影像资源，顺手讲清资料落点。"
                      : "这层暂时没有更细样本时，先回机构总表继续顺着馆藏线索走。"}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextVersion = activeVersionChildren[0];

                    if (nextVersion?.id) {
                      setSelectedVersionId(nextVersion.id);
                    }
                  }}
                  className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-left transition hover:bg-[rgba(255,248,220,0.1)]"
                >
                  <div className="text-xs tracking-[0.2em] text-[#d8c9a3]">下游入口</div>
                  <div className="mt-2 text-sm font-medium text-[#fbf3da]">
                    {activeVersionChildren[0]?.label ?? "这一时代未再分化更晚版本"}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[#eadfbc]">
                    {activeVersionChildren.length
                      ? "顺着当前版本继续进入下一层分化版本，直接演示版本流变向后推进。"
                      : "这一时代河段里还没有更晚分化版本，可停留在此处讲清版本位置。"}
                  </div>
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {activeTab === "timeline" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">关联时间线</h3>
            <span className="text-xs text-[#d8c9a3]">中观视图</span>
          </div>
          {visibleTimeline.length > 0 ? (
            <div className="rounded-[28px] border border-[#ead8a6]/14 bg-[linear-gradient(180deg,rgba(79,53,18,0.82),rgba(33,21,8,0.92))] p-4">
              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(37,24,8,0.52)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                        时间轨道
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
                            setSelectedTimelineId(firstTimelineItem.id);
                          }
                        }}
                        className="mt-1 text-left text-sm text-[#eadfbc] transition hover:text-[#fbf3da]"
                      >
                        {activeTimelineItem
                          ? "打开当前事件证据，顺着这条时间节点继续回查现实材料。"
                          : "按时间顺序切入典籍关键事件，先从最早节点开始讲。"}
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
                          onClick={() => setSelectedTimelineId(item.id)}
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
                        事件焦点
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
                              setSelectedTimelineId(previous.id);
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
                              setSelectedTimelineId(next.id);
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
                          打开事件证据
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab("versions")}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                        >
                          转看版本流变
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
                              转看文本溯源
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
                                    回查事件证据
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
                                    定位当前年份
                                  </span>
                                  <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] text-stone-300">
                                    打开事件证据
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
                                    定位资源细览
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
                                    转看人物关系
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setTab("passages");
                                    }}
                                    className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                  >
                                    转看文本溯源
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleOpenSourceEvidence("institution-samples");
                                    }}
                                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                                  >
                                    打开机构总表
                                  </button>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : fallbackTimelineInstitutionEchoes.length ? (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs tracking-[0.2em] text-stone-400">
                              现实回声
                            </div>
                            <div className="text-[10px] text-stone-500">机构回查入口</div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenSourceEvidence("institution-samples")}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              打开机构总表
                            </button>
                            <button
                              type="button"
                              onClick={() => setTab("versions")}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                            >
                              转看版本流变
                            </button>
                          </div>
                          <div className="mt-3 grid gap-3">
                            {fallbackTimelineInstitutionEchoes.map((item) => (
                              <button
                                key={`timeline-fallback-echo-${item.institution}-${item.title}-${item.year ?? "unknown"}`}
                                type="button"
                                onClick={() => handleSelectInstitutionRecord(item)}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:bg-white/10"
                              >
                                <div className="text-sm font-medium text-stone-50">{item.title}</div>
                                <div className="mt-2 text-xs text-stone-400">
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
                                    className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-300 transition hover:bg-white/10"
                                  >
                                    转看人物关系
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setTab("passages");
                                    }}
                                    className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                  >
                                    转看文本溯源
                                  </button>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-5 rounded-[22px] border border-white/10 bg-black/15 px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                          时间定位
                        </div>
                        <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-2">
                          {visibleTimeline.map((item) => {
                            const isActive = item.id === activeTimelineItem.id;
                            return (
                              <div key={item.id} className="flex min-w-max items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTimelineId(item.id)}
                                  className={`rounded-full px-3 py-2 text-xs ${
                                    isActive
                                      ? "bg-amber-300 text-stone-950"
                                      : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
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
                        定位当前时间线
                      </button>
                      <button
                        type="button"
                        onClick={handleFocusEventEvidence}
                        className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                      >
                        打开事件证据
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
            <span className="text-xs text-stone-400">微观视图</span>
          </div>
          {visiblePassages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6">
              <div className="text-sm text-stone-200">这一时代河段暂时没有展开逐字对读片段时，先回版本流变或时间回声，把文本证据从年代和版本两条线重新带回当前典籍。</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTab("versions")}
                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                >
                  转看版本流变
                </button>
                <button
                  type="button"
                  onClick={() => setTab("timeline")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                >
                  转看时间回声
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSourceEvidence("institution-samples")}
                  className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-300/15"
                >
                  打开机构总表
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
                </div>

                <div className="rounded-[24px] border border-amber-300/15 bg-[linear-gradient(180deg,rgba(191,140,40,0.16),rgba(56,35,11,0.24))] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs tracking-[0.2em] text-amber-100/75">
                        微观导引
                      </div>
                      <p className="mt-3 text-sm leading-7 text-amber-50/90">
                        从当前片段直接切证据、逆流、下游三条线，适合把现场讲解一口气带到底。
                      </p>
                    </div>
                    <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                      片段 {activePassage.section}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeLink ? (
                      <button
                        type="button"
                        onClick={handleOpenLinkedBook}
                        className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-xs text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
                      >
                        打开当前证据源典
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
                        钻入最早上游典籍
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
                        继续进入下游典籍
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const firstLink = activePassage.links[0];

                        if (firstLink) {
                          handleSelectLink(firstLink.id);
                        }
                      }}
                      className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-left transition hover:bg-white/10"
                    >
                      <div className="text-xs tracking-[0.2em] text-amber-100/75">证据入口</div>
                      <div className="mt-2 text-sm text-stone-100">
                        {activePassage.links[0]?.sourceTitle ?? "先看当前首条证据"}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab("timeline")}
                      className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-left transition hover:bg-white/10"
                    >
                      <div className="text-xs tracking-[0.2em] text-amber-100/75">回声入口</div>
                      <div className="mt-2 text-sm text-stone-100">
                        转看时间回声，把当前片段重新挂回事件和年代。
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
                        先看当前首条证据
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
                                  {activeLinkId === link.id ? "当前聚焦" : "聚焦证据"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSpecificLinkedBook(link.sourceBookId)}
                                  className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                                >
                                  跳转源典籍
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
                              当前聚焦证据
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
                            跳转源典籍
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
                                        ? "钻入此上游典籍"
                                        : "转看版本承接"}
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
                        <div className="text-sm text-stone-200">这一段暂时没有更早上游链路时，先回到当前证据或切去版本、时间继续补足源头叙事。</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeLink ? (
                            <button
                              type="button"
                              onClick={() => handleSelectLink(activeLink.id)}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              回到当前证据
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setTab("versions")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            转看版本承接
                          </button>
                          <button
                            type="button"
                            onClick={() => setTab("timeline")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            转看时间回声
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
                                <div className="text-xs tracking-[0.2em] text-stone-400">回声入口</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {activeLink ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectLink(activeLink.id)}
                                      className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                    >
                                      查看当前证据
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => setTab("timeline")}
                                    className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                                  >
                                    转到时间回声
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
                                  ? "继续钻入下游典籍"
                                  : "转看人物传播"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                        <div className="text-sm text-stone-200">这一段暂时没有更晚下游承接时，先折回当前证据，或者切到人物、传播层继续追扩散回声。</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeLink ? (
                            <button
                              type="button"
                              onClick={() => handleSelectLink(activeLink.id)}
                              className="rounded-full border border-amber-300/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-50 transition hover:bg-amber-300/20"
                            >
                              回到当前证据
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setTab("people")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            转看人物传播
                          </button>
                          <button
                            type="button"
                            onClick={() => setTab("spread")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-stone-200 transition hover:bg-white/10"
                          >
                            转看传播航段
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
