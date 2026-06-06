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
      detail: "传播航段结合当前关系建模组织，场馆资料与活动信号来自上海图书馆开放数据。",
    };
  }

  return {
    label: "传播关系建模",
      tone: "curated" as const,
    detail: "当前传播路径以现有地理叙事和关系建模组织，后续可继续补入更完整的馆藏传播证据。",
  };
}

function versionSourceMeta(library: string) {
  if (library.includes("上海") || library.includes("图书馆") || library.includes("馆")) {
    return {
      label: "馆藏/书目来源",
      tone: "hybrid" as const,
      detail: "版本链以当前典籍流变结构组织，节点的馆藏与版本说明已尽量锚定到具体馆藏/系统名称。",
    };
  }

  return {
    label: "版本流变建模",
      tone: "curated" as const,
    detail: "当前版本节点用于说明流变结构，后续可继续接入更多真实馆藏或 IIIF 资源。",
  };
}

function versionStatusMeta(status: VersionNode["status"]) {
  if (status === "存世") {
    return {
      badge: "今有存本",
      badgeClass: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
      detail: "当前版本仍有明确流传记录，可作为版本链中的可见落点。",
    };
  }

  return {
    badge: "仅见佚痕",
    badgeClass: "border-slate-300/18 bg-slate-300/10 text-slate-100",
    detail: "当前版本主要通过前后版本关系或文献说明被间接复原，用于标记失传层。",
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
      detail: "该事件由真实人物纪传中的时间与地点线索派生，可用于支撑传播叙事。",
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
  const institutionRecords = detail.realWorldSignals?.institutionSamples ?? [];
  const venuePreview = detail.realWorldSignals?.venueSamples?.slice(0, 3) ?? [];
  const eventPreview = detail.realWorldSignals?.eventSamples?.slice(0, 3) ?? [];
  const institutionPreview = institutionRecords.slice(0, 3);
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
          </div>
          <div className="grid gap-2 text-xs text-[#6b4b1d]">
            <div className="rounded-full border border-[#caa45b]/24 bg-white/30 px-3 py-1">
              {book.dynasty} · {book.category}
            </div>
            <div className="rounded-full border border-[#caa45b]/24 bg-white/30 px-3 py-1">
              {book.school}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-[24px] border border-[#caa45b]/18 bg-[rgba(248,237,206,0.12)] px-3 py-3">
          <div className="text-[#c9b68a]">直接引用</div>
          <div className="mt-2 text-xl font-semibold text-[#fbf3da]">
            {detail.heroMetric.directCitations}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#caa45b]/18 bg-[rgba(248,237,206,0.12)] px-3 py-3">
          <div className="text-[#c9b68a]">下游影响</div>
          <div className="mt-2 text-xl font-semibold text-[#fbf3da]">
            {detail.heroMetric.downstreamInfluence}
          </div>
        </div>
        <div className="rounded-[24px] border border-[#caa45b]/18 bg-[rgba(248,237,206,0.12)] px-3 py-3">
          <div className="text-[#c9b68a]">传播区域</div>
          <div className="mt-2 text-xl font-semibold text-[#fbf3da]">
            {detail.heroMetric.coveredRegions}
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#e1bd6e]/18 bg-[linear-gradient(180deg,rgba(194,140,42,0.16),rgba(78,50,14,0.2))] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.2em] text-amber-100/75">
              时代联动
            </div>
            <div className="mt-1 text-sm font-medium text-amber-50">
              当前可见内容已联动到 {activeEra}
            </div>
          </div>
          <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
            可见阶段 {eraLinkedSummary.timeline || 1} 条
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-stone-200">
            传播 {eraLinkedSummary.spread} 段
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-stone-200">
            人物 {eraLinkedSummary.people} 人
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-stone-200">
            版本 {eraLinkedSummary.versions} 个
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-stone-200">
            事件 {eraLinkedSummary.timeline} 条
          </div>
        </div>
        <div className="mt-2 text-xs text-amber-100/75">微观文本当前显现 {eraLinkedSummary.passages} 个片段。</div>
      </section>

      <section className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(27,17,7,0.2)] px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] tracking-[0.24em] text-[#d8c9a3]">
              卷内分栏
            </div>
            <div className="mt-1 text-sm text-[#fbf3da]">
              当前停在 {activeTabMeta.label}
            </div>
          </div>
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
              <div className="mt-1 text-sm font-medium text-amber-50">
                {detail.realWorldSignals.sourceLabel}
              </div>
            </div>
            <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
              当前采样
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {sourceBadges.map((item) => (
              <span
                key={item}
                className="rounded-full border border-amber-300/15 bg-black/15 px-3 py-1 text-xs text-amber-100"
              >
                {item}
              </span>
            ))}
          </div>
          {detail.realWorldSignals.venueSummary ? (
            <p className="mt-3 text-sm leading-7 text-amber-50/90">
              {detail.realWorldSignals.venueSummary}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-300/10 bg-black/15 px-3 py-3">
              <div className="text-xs tracking-[0.2em] text-amber-100/70">
                人物线索
              </div>
              <div className="mt-2 text-sm text-stone-100">
                纪传库对照 {detail.realWorldSignals.cbdbMatchedPeople ?? 0} 人
              </div>
              <div className="mt-1 text-xs text-stone-400">
                整理人物 {detail.realWorldSignals.cbdbFallbackPeople ?? 0} 人
              </div>
            </div>
            <div className="rounded-2xl border border-amber-300/10 bg-black/15 px-3 py-3">
              <div className="text-xs tracking-[0.2em] text-amber-100/70">
                传播信号
              </div>
              <div className="mt-2 text-sm text-stone-100">
                {detail.realWorldSignals.venueSamples?.length
                  ? `上图场馆资料 ${detail.realWorldSignals.venueSamples.length} 组`
                  : "暂无场馆资料"}
              </div>
              <div className="mt-1 text-xs text-stone-400">
                活动事件资料 {detail.realWorldSignals.eventSamples?.length ?? 0} 条
              </div>
            </div>
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
                    <div
                      key={venue.name}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                    >
                      <div className="font-medium text-stone-100">{venue.name}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        活动记录 {venue.sampleCount}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-stone-400">
                    当前没有挂接场馆资料。
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
                    <div
                      key={`${event.venue}-${event.title}-${event.startTime}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
                    >
                      <div className="font-medium text-stone-100">{event.title}</div>
                      <div className="mt-1 text-xs text-stone-400">
                        {event.venue} · {event.startTime}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-stone-400">
                    当前没有挂接活动事件资料。
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
                    const isActive = activeInstitutionRecord === item;

                    return (
                    <button
                      key={`${item.institution}-${item.title}-${item.imageRef}`}
                      type="button"
                      onClick={() => setSelectedInstitutionRecordId(recordId)}
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
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-stone-400">
                    当前没有挂接机构资源资料。
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
                    当前资源细览
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
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                    资源落点
                  </div>
                  <div className="mt-2 text-sm leading-6 text-stone-300">
                    当前条目已经落到机构、题名与年份粒度，可用于现场说明具体资源挂接点。
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                    出处说明
                  </div>
                  <div className="mt-2 text-sm leading-6 text-stone-300">
                    {activeInstitutionRecord.sourceText ?? "当前条目暂无额外出处说明，但已保留机构与资源编号。 "}
                  </div>
                </div>
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
                    <div className="mt-2 text-xs leading-6 text-amber-100/75">
                      {item.traceNote}
                    </div>
                    <div className="mt-3 grid gap-2">
                      {item.samples.map((sample) => (
                        <div
                          key={`${item.id}-${sample.label}-${sample.detail ?? "detail"}`}
                          className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3"
                        >
                          <div className="text-sm text-stone-100">{sample.label}</div>
                          {sample.detail ? (
                            <div className="mt-1 text-xs text-stone-400">{sample.detail}</div>
                          ) : null}
                        </div>
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
                          当前证据细览
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
                    <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        回查提示
                      </div>
                      <div className="mt-2 text-sm leading-6 text-stone-300">
                        {activeSourceEvidence.traceNote}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {activeSourceEvidence.samples.map((sample) => (
                        <div
                          key={`active-${activeSourceEvidence.id}-${sample.label}-${sample.detail ?? "detail"}`}
                          className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3"
                        >
                          <div className="text-sm text-stone-100">{sample.label}</div>
                          {sample.detail ? (
                            <div className="mt-1 text-xs leading-6 text-stone-400">
                              {sample.detail}
                            </div>
                          ) : null}
                        </div>
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
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前时代层下尚未显现传播路径记录。
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
                          点击任意航段可聚焦当前传播阶段
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
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
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
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              起点
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activeSpreadPlaces?.from?.name ?? "未知地点"}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-stone-300">
                              {activeSpreadPlaces?.from?.note ?? "暂无地点说明。"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              终点
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activeSpreadPlaces?.to?.name ?? "未知地点"}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-stone-300">
                              {activeSpreadPlaces?.to?.note ?? "暂无地点说明。"}
                            </p>
                          </div>
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
          <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
            传播视图当前以 3D 地球、抬升航线与传播落点来呈现典籍在不同历史节点之间的空间流动，可直接对应方案中的地理传播层。
          </div>
          <div className="rounded-[24px] border border-amber-300/14 bg-[linear-gradient(180deg,rgba(191,140,40,0.16),rgba(56,35,11,0.24))] px-4 py-4 text-sm leading-7 text-amber-50/90">
            传播层当前采用“传播关系建模 + 上图活动场馆信号补强”的混合组织，既保持叙事连续，也明确区分真实接入与结构性补足。
          </div>
          {detail.realWorldSignals?.venueSamples?.length ? (
            <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-stone-50">上图活动场馆资料</h4>
                <span className="text-xs text-stone-400">真实数据辅助</span>
              </div>
              <div className="mt-3 grid gap-2">
                {detail.realWorldSignals.venueSamples.map((venue) => (
                  <div
                    key={venue.name}
                    className="flex items-center justify-between rounded-2xl bg-black/15 px-3 py-3 text-sm"
                  >
                    <span className="text-stone-200">{venue.name}</span>
                    <span className="rounded-full bg-amber-300/10 px-2 py-1 text-xs text-amber-100">
                      采样 {venue.sampleCount}
                    </span>
                  </div>
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
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前时代层下尚未显现关联人物记录。
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
                            <div className="text-sm text-stone-400">暂未补充二级关系人物。</div>
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
                            <div className="rounded-2xl border border-dashed border-white/10 px-3 py-3 text-sm leading-6 text-stone-400">
                              先查看作者、注者、编者等核心人物，再按需展开引用者、评论者、校勘者等支流角色。
                            </div>
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
                              当前焦点人物
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
                              {activePerson.source === "cbdb" ? "纪传库已对照" : "整理人物"}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {activePerson.source === "cbdb"
                                ? `当前人物已接入真实人物纪传数据${activePerson.matchedAlias ? `，匹配别名为 ${activePerson.matchedAlias}` : ""}。`
                                : "当前仍为整理人物，后续可继续补入更完整的真实人物图谱记录。"}
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
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                  一级关联优先表示作者、注者、核心编纂者，对应方案中的“中心为典籍，一级关联为作者/注者/编者”。
                </div>
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                  二级关联改为按需展开，先守住核心结构，再逐步放出引用者、评论者、校勘者等支流角色，更贴近“渐进式展开”的方案要求。
                </div>
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                  亮色来源标记说明人物已与纪传资料对照，灰色说明当前仍为整理节点，便于后续继续充实真实人物图谱。
                </div>
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
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前时代层下尚未显现版本链路记录。
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
                              当前版本焦点
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
                            <div className="text-xs tracking-[0.2em] text-slate-200/80">
                              存佚判断
                            </div>
                            <p className="mt-2 text-sm leading-7 text-stone-300">
                              {activeVersionStatusMeta.detail}
                            </p>
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
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              版本位置
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activeVersion.place}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              藏馆 / 系统：{activeVersion.library}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              传承位置
                            </div>
                            <div className="mt-2 text-base font-semibold text-stone-50">
                              {activeVersion.parentId ? "承接上一个版本" : "祖本起点"}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {activeVersion.parentId
                                ? "当前节点位于版本链中段或后段，继续承接前一层文字流传。"
                                : "该节点作为版本流变链的起点，承担源头层标记。"}
                            </div>
                          </div>
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
                              <div className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/8 px-3 py-3 text-sm text-amber-100">
                                当前节点即版本源头，暂无更早父节点。
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
                                <div className="mt-2 text-sm text-stone-400">
                                  当前时代层下未继续分化出更晚版本。
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
                                  结合当前版本节点，展开可直接讲述的馆藏与图像证据。
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
                                <div
                                  key={`version-evidence-${item.institution}-${item.title}-${item.imageRef ?? item.sourceText ?? "trace"}`}
                                  className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.05)] px-4 py-4"
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
                                      图像出处：{item.sourceText}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                              {!versionEvidenceSamples.length && !institutionPreview.length ? (
                                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-stone-400">
                                  当前版本尚未匹配到可直接展示的馆藏影像线索，但版本链与馆藏系统名称已可作为演示证据。
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
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                              馆藏 / 系统：{activeVersion.library}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                              存佚状态：{activeVersion.status}
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                              版本说明：{activeVersion.note ?? "当前节点用于说明版本流变位置。"}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                  版本链按“祖本 → 抄本/刻本 → 重刊/整理本”的方式组织，更接近方案中的版本流变树表达。
                </div>
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                  存世状态与版本类型同时编码，既能看传播链，也能看哪些层次已经失传或仅能间接复原。
                </div>
                <div className="rounded-[24px] border border-[#ead8a6]/14 bg-[rgba(255,248,220,0.06)] px-4 py-4 text-sm leading-7 text-[#eadfbc]">
                  当前版本卡已补入传承链和影像馆藏线索，现场既能讲版本演化，也能顺手展示可追溯的资料落点。
                </div>
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
                      <div className="mt-1 text-sm text-[#eadfbc]">
                        按时间顺序浏览该典籍的关键事件
                      </div>
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
                        当前事件焦点
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
                      <p className="mt-4 text-sm leading-7 text-stone-300">
                        {activeTimelineItem.detail}
                      </p>
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
                                <div
                                  className={`rounded-full px-3 py-2 text-xs ${
                                    isActive
                                      ? "bg-amber-300 text-stone-950"
                                      : "border border-white/10 bg-white/5 text-stone-300"
                                  }`}
                                >
                                  {item.year}
                                </div>
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
                  <div
                    key={`${event.venue}-${event.title}-${event.startTime}`}
                    className="rounded-2xl bg-white/5 px-3 py-3"
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
                  </div>
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
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前时代层下尚未显现逐字对读片段或相关证据链。
            </div>
          ) : activePassage ? (
            <>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_248px]">
                <div className="rounded-[24px] border border-[#ead8a6]/16 bg-[rgba(255,248,220,0.06)] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs tracking-[0.22em] text-[#d8c9a3]">
                        当前文本片段
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
                        交互说明
                      </div>
                      <p className="mt-3 text-sm leading-7 text-amber-50/90">
                        先选中文本片段与证据卡，再点击“启动溯源”，链路会沿当前文本逆流而上，并逐步停留在中间转引节点。
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartTrace}
                      disabled={!activePassage?.tracePath?.length || tracePlaying}
                      className={`rounded-full px-4 py-2 text-xs transition ${
                        !activePassage?.tracePath?.length
                          ? "cursor-not-allowed border border-white/10 bg-white/5 text-stone-500"
                          : tracePlaying
                            ? "border border-amber-300/20 bg-amber-300/12 text-amber-100"
                            : "border border-amber-300/25 bg-amber-300/15 text-amber-50 hover:bg-amber-300/20"
                      }`}
                    >
                      {tracePlaying ? "溯源进行中" : "启动溯源"}
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
                      <span className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                        绿色：显式引用 / 高置信度
                      </span>
                      <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-3 py-1 text-amber-100">
                        黄色：语义关联 / 中置信度
                      </span>
                      <span className="rounded-full border border-dashed border-white/14 bg-white/5 px-3 py-1 text-stone-300">
                        灰色虚线：间接影响 / 低置信度
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-stone-300">
                        首次点击聚焦证据，再点一次直达源典籍
                      </span>
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
                        <div
                          key={link.id}
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
                        </div>
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
                                        : "暂无典籍入口"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-stone-400">暂无溯源链路记录。</div>
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
                              <div className="mt-3 rounded-2xl border border-dashed border-white/14 bg-white/5 px-3 py-3 text-xs leading-6 text-stone-400">
                                此链路表示参考性间接影响，适合用于展示文脉回声，不宜等同于显式引述。
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
                                  : "暂无下游典籍入口"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-stone-400">暂无下游影响记录。</div>
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
