"use client";

import { useEffect, useMemo, useState } from "react";

import type { BookDetail, BookNode, RiverEra } from "@/types/domain";

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

function inlineConfidenceClass(label: string) {
  if (label === "高") {
    return "rounded bg-emerald-300/18 px-1.5 py-0.5 text-emerald-100";
  }

  if (label === "中") {
    return "rounded bg-amber-300/18 px-1.5 py-0.5 text-amber-100";
  }

  return "rounded border border-dashed border-white/15 px-1.5 py-0.5 text-stone-300";
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

function sourceBadgeClass(source: "real" | "demo" | "hybrid") {
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
      detail: "传播航段结合当前关系建模组织，场馆样本与活动信号来自上海图书馆开放数据。",
    };
  }

  return {
    label: "传播关系建模",
    tone: "demo" as const,
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
    tone: "demo" as const,
    detail: "当前版本节点用于说明流变结构，后续可继续接入更多真实馆藏或 IIIF 资源。",
  };
}

function timelineSourceMeta(source?: "demo" | "cbdb") {
  if (source === "cbdb") {
    return {
      label: "人物纪传信号",
      tone: "real" as const,
      detail: "该事件由真实人物纪传中的时间与地点线索派生，可用于支撑传播叙事。",
    };
  }

  return {
    label: "叙事时间节点",
    tone: "demo" as const,
    detail: "该事件用于补齐典籍叙事主线，目前仍以现有时间节点组织为主。",
  };
}

export function BookExplorer({
  book,
  detail,
  forcedTab,
  activeEra,
  onTraceFocusChange,
}: {
  book: BookNode;
  detail: BookDetail;
  forcedTab?: ExplorerTab | null;
  activeEra: RiverEra;
  onTraceFocusChange?: (focus: TraceFocusState | null) => void;
}) {
  const [tab, setTab] = useState<ExplorerTab>("spread");
  const [passageLayout, setPassageLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [selectedSpreadId, setSelectedSpreadId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [traceStep, setTraceStep] = useState<number>(0);
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
  const activeSpreadPlaces = activeSpread
    ? {
        from: detail.places.find((place) => place.id === activeSpread.fromPlaceId),
        to: detail.places.find((place) => place.id === activeSpread.toPlaceId),
      }
    : null;
  const activePassage = useMemo(() => {
    return visiblePassages.find((passage) => passage.id === selectedPassageId) ?? visiblePassages[0];
  }, [selectedPassageId, visiblePassages]);
  const activePassageId = activePassage?.id ?? null;
  const activeLink = useMemo(() => {
    return activePassage?.links.find((link) => link.id === selectedLinkId) ?? activePassage?.links[0];
  }, [activePassage, selectedLinkId]);
  const activeLinkId = activeLink?.id ?? null;
  const activeTab = forcedTab ?? tab;
  const activeTraceFocus = useMemo<TraceFocusState | null>(() => {
    if (activeTab !== "passages" || !activePassage?.tracePath?.length) {
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
  }, [activePassage, activeTab, book.title, traceStep]);

  useEffect(() => {
    if (!activePassage?.tracePath?.length) {
      return;
    }

    const timer = window.setInterval(() => {
      setTraceStep((current) =>
        current >= activePassage.tracePath!.length - 1 ? current : current + 1,
      );
    }, 900);

    return () => window.clearInterval(timer);
  }, [activePassage?.id, activePassage?.tracePath]);

  useEffect(() => {
    onTraceFocusChange?.(activeTraceFocus);

    return () => {
      onTraceFocusChange?.(null);
    };
  }, [activeTraceFocus, onTraceFocusChange]);
  const sourceBadges = detail.realWorldSignals?.sourceLabel
    ? detail.realWorldSignals.sourceLabel.split("+").map((item) => item.trim()).filter(Boolean)
    : [];
  const venuePreview = detail.realWorldSignals?.venueSamples?.slice(0, 3) ?? [];
  const eventPreview = detail.realWorldSignals?.eventSamples?.slice(0, 3) ?? [];
  const institutionPreview = detail.realWorldSignals?.institutionSamples?.slice(0, 3) ?? [];
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
  };

  const handleSelectLink = (linkId: string) => {
    setSelectedLinkId(linkId);
  };
  const spreadMeta = spreadSourceMeta(Boolean(detail.realWorldSignals?.venueSamples?.length));
  const activeVersionMeta = activeVersion ? versionSourceMeta(activeVersion.library) : null;
  const activeTimelineMeta = activeTimelineItem
    ? timelineSourceMeta(activeTimelineItem.source)
    : null;

  return (
    <div className="space-y-4">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-[0.25em] text-stone-400">
              典籍焦点
            </p>
            <h2 className="mt-2 text-3xl font-semibold">{book.title}</h2>
            <p className="mt-3 text-sm leading-7 text-stone-300">{book.summary}</p>
          </div>
          <div className="grid gap-2 text-xs text-stone-300">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {book.dynasty} · {book.category}
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {book.school}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="text-stone-400">直接引用</div>
          <div className="mt-2 text-xl font-semibold text-stone-50">
            {detail.heroMetric.directCitations}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="text-stone-400">下游影响</div>
          <div className="mt-2 text-xl font-semibold text-stone-50">
            {detail.heroMetric.downstreamInfluence}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
          <div className="text-stone-400">传播区域</div>
          <div className="mt-2 text-xl font-semibold text-stone-50">
            {detail.heroMetric.coveredRegions}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-300/15 bg-amber-300/6 px-4 py-4">
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

      <section>
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-3 py-2 text-xs transition ${
                activeTab === item.id
                  ? "bg-amber-300 text-stone-950"
                  : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
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
                待补人物 {detail.realWorldSignals.cbdbFallbackPeople ?? 0} 人
              </div>
            </div>
            <div className="rounded-2xl border border-amber-300/10 bg-black/15 px-3 py-3">
              <div className="text-xs tracking-[0.2em] text-amber-100/70">
                传播信号
              </div>
              <div className="mt-2 text-sm text-stone-100">
                {detail.realWorldSignals.venueSamples?.length
                  ? `上图场馆样本 ${detail.realWorldSignals.venueSamples.length} 组`
                  : "暂无场馆样本"}
              </div>
              <div className="mt-1 text-xs text-stone-400">
                活动事件样本 {detail.realWorldSignals.eventSamples?.length ?? 0} 条
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
                        活动样本 {venue.sampleCount}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-stone-400">
                    当前没有挂接场馆样本。
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
                    当前没有挂接活动事件样本。
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
                  institutionPreview.map((item) => (
                    <div
                      key={`${item.institution}-${item.title}-${item.imageRef}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
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
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-stone-400">
                    当前没有挂接机构资源样本。
                  </div>
                )}
              </div>
            </div>
          </div>
          {detail.realWorldSignals.institutionSamples?.length ? (
            <div className="mt-4 rounded-2xl border border-amber-300/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.2em] text-amber-100/75">
                  机构图像资源样本
                </div>
                <div className="rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                  {detail.realWorldSignals.institutionSamples.length} 条
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                {detail.realWorldSignals.institutionSamples.map((item) => (
                  <div
                    key={`${item.institution}-${item.title}-${item.imageRef}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
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
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "spread" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">地理传播图</h3>
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {visibleSpread.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前时代层下尚未显现传播路径记录。
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),rgba(255,255,255,0.03))] p-4">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-white/10 bg-[#1a1208] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                          传播航线总览
                        </div>
                        <div className="mt-1 text-sm text-stone-300">
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
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                          当前焦点
                        </div>
                        <div className="mt-1 text-lg font-semibold text-stone-50">
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

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,16,0.92),rgba(3,9,8,0.96))] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                      传播节点地图
                    </div>
                    <div className="mt-1 text-sm text-stone-300">
                      用位置投影模拟 3D 地球上的传播落点与航线
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                    {detail.places.length} 个地点
                  </div>
                </div>

                <div className="relative mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),rgba(6,12,12,0.95))]">
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_24px,rgba(255,255,255,0.04)_25px),linear-gradient(90deg,transparent_24px,rgba(255,255,255,0.04)_25px)] bg-[length:100%_25%,25%_100%] opacity-40" />
                  <div className="relative h-[320px]">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      {visibleSpread.map((item) => {
                        const fromPlace = detail.places.find((place) => place.id === item.fromPlaceId);
                        const toPlace = detail.places.find((place) => place.id === item.toPlaceId);
                        if (!fromPlace || !toPlace) {
                          return null;
                        }

                        const fromX = ((fromPlace.lng + 180) / 360) * 100;
                        const fromY = ((90 - fromPlace.lat) / 180) * 100;
                        const toX = ((toPlace.lng + 180) / 360) * 100;
                        const toY = ((90 - toPlace.lat) / 180) * 100;
                        const midX = (fromX + toX) / 2;
                        const midY = Math.min(fromY, toY) - 10;
                        const isActive = activeSpread?.id === item.id;

                        return (
                          <g key={item.id} onClick={() => setSelectedSpreadId(item.id)} className="cursor-pointer">
                            <path
                              d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
                              fill="none"
                              stroke={isActive ? "#67e8f9" : "rgba(255,255,255,0.28)"}
                              strokeWidth={isActive ? 1.2 : 0.6}
                              strokeDasharray={isActive ? "0" : "2 2"}
                            />
                          </g>
                        );
                      })}

                      {detail.places.map((place) => {
                        const x = ((place.lng + 180) / 360) * 100;
                        const y = ((90 - place.lat) / 180) * 100;
                        const isActive =
                          place.id === activeSpreadPlaces?.from?.id || place.id === activeSpreadPlaces?.to?.id;

                        return (
                          <g key={place.id}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isActive ? 2.2 : 1.35}
                              fill={isActive ? "#fcd34d" : "#d6fff6"}
                            />
                            <text
                              x={x + 1.8}
                              y={y - 1.8}
                              fill={isActive ? "#fde68a" : "#e7e5e4"}
                              fontSize="3.1"
                            >
                              {place.name}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
            当前传播视图已经具备“航线聚焦 + 地点投影 + 阶段切换”的中观交互骨架，后续再把这套坐标映射接入真正的 3D 地球即可。
          </div>
          <div className="rounded-2xl border border-amber-300/10 bg-amber-300/5 px-4 py-4 text-sm leading-7 text-amber-50/90">
            传播层当前采用“传播关系建模 + 上图活动场馆信号补强”的混合组织，既保持叙事连续，也明确区分真实接入与结构性补足。
          </div>
          {detail.realWorldSignals?.venueSamples?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-stone-50">上图活动场馆样本</h4>
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
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {visiblePeople.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前时代层下尚未显现关联人物记录。
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[24px] border border-white/10 bg-[#1a1208] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                          人物关系场
                        </div>
                        <div className="mt-1 text-sm text-stone-300">
                          点击节点切换焦点人物，关系线区分一级 / 二级关联
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                        {visiblePeople.length} 个节点
                      </div>
                    </div>

                    <div className="relative mt-4 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),rgba(8,17,16,0.95))] px-4 py-6">
                      <div className="absolute inset-0 opacity-30">
                        <svg viewBox="0 0 100 100" className="h-full w-full">
                          {primaryPeople.map((person, index) => {
                            const x = 22;
                            const y = 24 + index * (52 / Math.max(primaryPeople.length, 1));
                            return (
                              <line
                                key={`primary-line-${person.id}`}
                                x1="50"
                                y1="50"
                                x2={x}
                                y2={y}
                                stroke="rgba(110,231,183,0.6)"
                                strokeWidth="1.4"
                              />
                            );
                          })}
                          {secondaryPeople.map((person, index) => {
                            const x = 78;
                            const y = 24 + index * (52 / Math.max(secondaryPeople.length, 1));
                            return (
                              <line
                                key={`secondary-line-${person.id}`}
                                x1="50"
                                y1="50"
                                x2={x}
                                y2={y}
                                stroke="rgba(148,163,184,0.45)"
                                strokeWidth="1"
                                strokeDasharray="2 2"
                              />
                            );
                          })}
                        </svg>
                      </div>

                      <div className="relative grid min-h-[340px] grid-cols-[1fr_220px_1fr] gap-4">
                        <div className="space-y-3">
                          <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                            一级关联
                          </div>
                          {primaryPeople.map((person) => {
                            const isActive = activePerson?.id === person.id;
                            return (
                              <button
                                key={person.id}
                                type="button"
                                onClick={() => setSelectedPersonId(person.id)}
                                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                  isActive
                                    ? "border-emerald-300/30 bg-emerald-300/10 shadow-lg shadow-emerald-500/10"
                                    : "border-white/10 bg-white/5 hover:bg-white/10"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-lg font-semibold text-stone-50">
                                      {person.name}
                                    </div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                                      {person.role} · {person.era}
                                    </div>
                                  </div>
                                  <div
                                    className={`rounded-full px-3 py-1 text-xs ${relationTypeClass(person.relationType)}`}
                                  >
                                    {person.relationType ?? "引"}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-col items-center justify-center gap-4 py-2">
                          <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                            中心典籍
                          </div>
                          <div className="w-full rounded-[28px] border border-amber-300/25 bg-amber-300/10 px-5 py-6 text-center shadow-lg shadow-amber-500/10">
                            <div className="text-xs uppercase tracking-[0.22em] text-amber-100/80">
                              {book.dynasty} · {book.category}
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-stone-50">
                              {book.title}
                            </div>
                            <div className="mt-3 text-sm leading-7 text-stone-300">
                              {book.school}
                            </div>
                          </div>
                          <div className="flex w-full items-center justify-center gap-2 text-stone-500">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] uppercase tracking-[0.24em]">
                              注 / 引 / 评
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                            二级关联
                          </div>
                          {secondaryPeople.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
                              暂未补充二级关系人物。
                            </div>
                          ) : (
                            secondaryPeople.map((person) => {
                              const isActive = activePerson?.id === person.id;
                              return (
                                <button
                                  key={person.id}
                                  type="button"
                                  onClick={() => setSelectedPersonId(person.id)}
                                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                    isActive
                                      ? "border-amber-300/30 bg-amber-300/10 shadow-lg shadow-amber-500/10"
                                      : "border-white/10 bg-white/5 hover:bg-white/10"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-lg font-semibold text-stone-50">
                                        {person.name}
                                      </div>
                                      <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                                        {person.role} · {person.era}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <div
                                        className={`rounded-full px-3 py-1 text-xs ${relationTypeClass(person.relationType)}`}
                                      >
                                        {person.relationType ?? "引"}
                                      </div>
                                      <div
                                        className={`rounded-full px-3 py-1 text-xs ${
                                          person.source === "cbdb"
                                            ? "bg-emerald-300/10 text-emerald-100"
                                            : "bg-white/10 text-stone-300"
                                        }`}
                                      >
                                        {person.source === "cbdb" ? "纪传库已对照" : "待补人物"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    {activePerson ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              当前焦点人物
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-stone-50">
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
                              {activePerson.source === "cbdb" ? "纪传库已对照" : "待补人物"}
                            </div>
                            <div className="mt-2 text-sm text-stone-300">
                              {activePerson.source === "cbdb"
                                ? `当前人物已接入真实人物纪传数据${activePerson.matchedAlias ? `，匹配别名为 ${activePerson.matchedAlias}` : ""}。`
                                : "当前仍为待补人物，后续可继续替换为更完整的真实人物图谱记录。"}
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
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
                  一级关联优先表示作者、注者、核心编纂者，对应方案中的“中心为典籍，一级关联为作者/注者/编者”。
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
                  二级关联承载引用者、评论者、校勘者等辅助角色，帮助用户理解文脉在后世如何扩散和再解释。
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
                  亮色来源标记说明人物已与纪传资料对照，灰色说明当前仍待补入，便于后续继续充实真实人物图谱。
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
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {visibleVersions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前时代层下尚未显现版本链路记录。
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[24px] border border-white/10 bg-black/15 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                          版本轨道
                        </div>
                        <div className="mt-1 text-sm text-stone-300">
                          点击节点切换当前版本焦点
                        </div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                        {visibleVersions.length} 个版本
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
                      {visibleVersions.map((version, index) => {
                        const isActive = activeVersion?.id === version.id;
                        return (
                          <div key={version.id} className="flex min-w-max items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedVersionId(version.id)}
                              className={`rounded-[24px] border px-4 py-4 text-left transition ${
                                isActive
                                  ? "border-amber-300/35 bg-amber-300/10 shadow-lg shadow-amber-500/10"
                                  : "border-white/10 bg-white/5 hover:bg-white/10"
                              }`}
                            >
                              <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
                                {version.editionType ?? "版本节点"}
                              </div>
                              <div className="mt-2 text-sm font-medium text-stone-50">
                                {version.label}
                              </div>
                              <div className="mt-2 text-xs text-stone-400">
                                {version.year} · {version.place}
                              </div>
                              <div className="mt-2">
                                <span
                                  className={`rounded-full border px-2 py-1 text-[10px] ${sourceBadgeClass(versionSourceMeta(version.library).tone)}`}
                                >
                                  {versionSourceMeta(version.library).label}
                                </span>
                              </div>
                            </button>
                            {index < visibleVersions.length - 1 ? (
                              <div className="h-px w-8 bg-gradient-to-r from-amber-300/35 to-transparent" />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                    {activeVersion ? (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                              当前版本焦点
                            </div>
                            <div className="mt-2 text-xl font-semibold text-stone-50">
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
                                  : "bg-white/10 text-stone-300"
                              }`}
                            >
                              {activeVersion.status}
                            </span>
                          </div>
                        </div>

                        {activeVersion.note ? (
                          <p className="mt-4 text-sm leading-7 text-stone-300">
                            {activeVersion.note}
                          </p>
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
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
                  版本链按“祖本 → 抄本/刻本 → 重刊/整理本”的方式组织，更接近方案中的版本流变树表达。
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
                  存世状态与版本类型同时编码，既能看传播链，也能看哪些层次已经失传或仅能间接复原。
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
                  下一步可以把这组节点进一步接到真正的树图或 IIIF 页面浏览入口上。
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
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {visibleTimeline.length > 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),rgba(255,255,255,0.03))] p-4">
              <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] border border-white/10 bg-black/15 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                        时间轨道
                      </div>
                      <div className="mt-1 text-sm text-stone-300">
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

                <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                  {activeTimelineItem ? (
                    <>
                      <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        当前事件焦点
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="text-2xl font-semibold text-stone-50">
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
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-stone-50">上图活动时间样本</h4>
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
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        当前文本片段
                      </div>
                      <div className="mt-1 text-lg font-semibold text-stone-50">
                        {activePassage.section}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPassageLayout("horizontal")}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          passageLayout === "horizontal"
                            ? "bg-amber-300 text-stone-950"
                            : "border border-white/10 bg-white/5 text-stone-300"
                        }`}
                      >
                        横排
                      </button>
                      <button
                        type="button"
                        onClick={() => setPassageLayout("vertical")}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          passageLayout === "vertical"
                            ? "bg-amber-300 text-stone-950"
                            : "border border-white/10 bg-white/5 text-stone-300"
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
                            ? "bg-amber-300 text-stone-950"
                            : "border border-white/10 bg-black/15 text-stone-300 hover:bg-white/10"
                        }`}
                      >
                        {passage.section}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 px-4 py-4">
                  <div className="text-xs tracking-[0.2em] text-amber-100/75">
                    交互说明
                  </div>
                  <p className="mt-3 text-sm leading-7 text-amber-50/90">
                    点击证据卡可切换当前引文焦点；当前时代以前已显现的证据链、溯源路径和下游影响会逐步点亮，模拟方案中的“逆流而上”。
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div className="mt-1 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                        原文对读
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-stone-300">
                        {passageLayout === "vertical" ? "竖排模式" : "横排模式"}
                      </span>
                    </div>
                    <div
                      className={`mt-4 rounded-2xl border border-white/10 bg-[#090f0f] px-5 py-5 text-stone-100 ${
                        passageLayout === "vertical"
                          ? "max-h-[320px] overflow-x-auto [writing-mode:vertical-rl] text-lg leading-10 tracking-[0.25em]"
                          : "text-sm leading-9"
                      }`}
                    >
                      {activePassage.original}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {activePassage.links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => handleSelectLink(link.id)}
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

                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      引用证据
                    </div>
                    <div className="mt-3 space-y-2">
                      {activePassage.links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => handleSelectLink(link.id)}
                          className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition ${
                            activeLinkId === link.id
                              ? "border-amber-300/35 bg-amber-300/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-stone-50">
                              {link.sourceTitle}
                            </span>
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
                        <div className="text-xs tracking-[0.2em] text-amber-100/75">
                          当前聚焦证据
                        </div>
                        <div className="mt-2 text-sm font-medium text-amber-50">
                          {activeLink.sourceTitle}
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
                        已推进 {Math.min(traceStep + 1, activePassage.tracePath?.length ?? 0)} /
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
                          <div className="relative mt-4 h-[180px] rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(28,18,7,0.92),rgba(12,7,3,0.98))]">
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_39px,rgba(255,255,255,0.04)_40px),linear-gradient(90deg,transparent_39px,rgba(255,255,255,0.04)_40px)] bg-[length:100%_40px,40px_100%] opacity-20" />
                            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                              <defs>
                                <linearGradient id="trace-line" x1="0%" x2="100%" y1="0%" y2="0%">
                                  <stop offset="0%" stopColor="rgba(245,158,11,0.9)" />
                                  <stop offset="55%" stopColor="rgba(252,211,77,0.95)" />
                                  <stop offset="100%" stopColor="rgba(254,243,199,0.9)" />
                                </linearGradient>
                                <filter id="trace-glow">
                                  <feGaussianBlur stdDeviation="1.6" result="coloredBlur" />
                                  <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              {activePassage.tracePath.map((trace, index) => {
                                const total = Math.max(activePassage.tracePath!.length - 1, 1);
                                const x = 12 + (index / total) * 76;
                                const y = 62 - Math.sin((index / total) * Math.PI) * 22;
                                const isActive = index <= traceStep;
                                const next = activePassage.tracePath?.[index + 1];
                                const nextX = next ? 12 + ((index + 1) / total) * 76 : null;
                                const nextY = next
                                  ? 62 - Math.sin(((index + 1) / total) * Math.PI) * 22
                                  : null;

                                return (
                                  <g key={trace.id}>
                                    {nextX !== null && nextY !== null ? (
                                      <>
                                        <path
                                          d={`M ${x} ${y} C ${x + 7} ${y - 12}, ${nextX - 7} ${nextY + 12}, ${nextX} ${nextY}`}
                                          fill="none"
                                          stroke="rgba(255,255,255,0.12)"
                                          strokeWidth="1.2"
                                        />
                                        <path
                                          d={`M ${x} ${y} C ${x + 7} ${y - 12}, ${nextX - 7} ${nextY + 12}, ${nextX} ${nextY}`}
                                          fill="none"
                                          stroke="url(#trace-line)"
                                          strokeWidth={isActive ? "2.4" : "0"}
                                          filter={isActive ? "url(#trace-glow)" : undefined}
                                          strokeLinecap="round"
                                        />
                                      </>
                                    ) : null}
                                    <circle
                                      cx={x}
                                      cy={y}
                                      r={isActive ? 3.6 : 2.4}
                                      fill={isActive ? "#fcd34d" : "rgba(255,255,255,0.22)"}
                                      filter={isActive ? "url(#trace-glow)" : undefined}
                                    />
                                    <text
                                      x={x}
                                      y={y - 7}
                                      textAnchor="middle"
                                      fill={isActive ? "#fef3c7" : "rgba(231,229,228,0.72)"}
                                      fontSize="4"
                                    >
                                      {trace.title}
                                    </text>
                                  </g>
                                );
                              })}
                              {activePassage.tracePath[traceStep] ? (() => {
                                const total = Math.max(activePassage.tracePath!.length - 1, 1);
                                const x = 12 + (traceStep / total) * 76;
                                const y = 62 - Math.sin((traceStep / total) * Math.PI) * 22;
                                return (
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r="6"
                                    fill="rgba(252,211,77,0.18)"
                                    stroke="rgba(252,211,77,0.92)"
                                    strokeWidth="0.8"
                                  />
                                );
                              })() : null}
                            </svg>
                            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-stone-400">
                              <span>当前文本</span>
                              <span>中间转引</span>
                              <span>源头典籍</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {activePassage.tracePath.map((trace, index) => {
                            const isActive = index <= traceStep;
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
                    {activePassage.downstreamInfluence?.length ? (
                      <div className="mt-3 space-y-2">
                        {activePassage.downstreamInfluence.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/10 bg-black/15 px-3 py-3"
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
