"use client";

import { useEffect, useMemo, useState } from "react";

import type { BookDetail, BookNode } from "@/types/domain";

const tabs = [
  { id: "spread", label: "地理传播" },
  { id: "people", label: "人物关系" },
  { id: "versions", label: "版本流变" },
  { id: "timeline", label: "关联时间线" },
  { id: "passages", label: "文本溯源" },
] as const;

type ExplorerTab = (typeof tabs)[number]["id"];

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

export function BookExplorer({
  book,
  detail,
}: {
  book: BookNode;
  detail: BookDetail;
}) {
  const [tab, setTab] = useState<ExplorerTab>("spread");
  const [passageLayout, setPassageLayout] = useState<"horizontal" | "vertical">("horizontal");
  const [selectedSpreadId, setSelectedSpreadId] = useState<string | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [traceStep, setTraceStep] = useState<number>(0);
  const primaryPeople = detail.people.filter((person) => (person.relationTier ?? 2) === 1);
  const secondaryPeople = detail.people.filter((person) => (person.relationTier ?? 2) === 2);
  const activeSpread =
    detail.spread.find((item) => item.id === selectedSpreadId) ?? detail.spread[0];
  const activeSpreadPlaces = activeSpread
    ? {
        from: detail.places.find((place) => place.id === activeSpread.fromPlaceId),
        to: detail.places.find((place) => place.id === activeSpread.toPlaceId),
      }
    : null;
  const activePassage = useMemo(() => {
    return detail.passages.find((passage) => passage.id === selectedPassageId) ?? detail.passages[0];
  }, [detail.passages, selectedPassageId]);
  const activePassageId = activePassage?.id ?? null;
  const activeLink = useMemo(() => {
    return activePassage?.links.find((link) => link.id === selectedLinkId) ?? activePassage?.links[0];
  }, [activePassage, selectedLinkId]);
  const activeLinkId = activeLink?.id ?? null;

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

  const handleSelectPassage = (passageId: string) => {
    setSelectedPassageId(passageId);
    setSelectedLinkId(null);
    setTraceStep(0);
  };

  const handleSelectLink = (linkId: string) => {
    setSelectedLinkId(linkId);
  };

  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
          典籍钻入
        </p>
        <h2 className="mt-2 text-3xl font-semibold">{book.title}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-300">{book.summary}</p>
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

      <section>
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-3 py-2 text-xs transition ${
                tab === item.id
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
        <section className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/80">
                真实数据接入
              </div>
              <div className="mt-1 text-sm font-medium text-cyan-50">
                {detail.realWorldSignals.sourceLabel}
              </div>
            </div>
            <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              Live Sample
            </div>
          </div>
          {detail.realWorldSignals.venueSummary ? (
            <p className="mt-3 text-sm leading-7 text-cyan-50/90">
              {detail.realWorldSignals.venueSummary}
            </p>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-cyan-300/10 bg-black/15 px-3 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
                人物命中
              </div>
              <div className="mt-2 text-sm text-stone-100">
                CBDB 命中 {detail.realWorldSignals.cbdbMatchedPeople ?? 0} 人
              </div>
              <div className="mt-1 text-xs text-stone-400">
                示范补全 {detail.realWorldSignals.cbdbFallbackPeople ?? 0} 人
              </div>
            </div>
            <div className="rounded-2xl border border-cyan-300/10 bg-black/15 px-3 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
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
        </section>
      ) : null}

      {tab === "spread" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">地理传播图</h3>
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {detail.spread.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              该典籍尚未补充传播路径样例。
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.14),rgba(255,255,255,0.03))] p-4">
                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[24px] border border-white/10 bg-[#081110] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                          传播航线总览
                        </div>
                        <div className="mt-1 text-sm text-stone-300">
                          点击任意航段可聚焦当前传播阶段
                        </div>
                      </div>
                      <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                        {detail.spread.length} 段航线
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-2 overflow-x-auto pb-2">
                      {detail.spread.map((item, index) => {
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
                                  ? "border-cyan-300/35 bg-cyan-300/12 shadow-lg shadow-cyan-500/10"
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
                                <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-cyan-100">
                                  流量 {item.volume}
                                </span>
                              </div>
                            </button>
                            {index < detail.spread.length - 1 ? (
                              <div className="h-px w-8 bg-gradient-to-r from-cyan-300/40 to-transparent" />
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
                      {detail.spread.map((item) => {
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
                    <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
                      样本 {venue.sampleCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "people" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">人物关系网</h3>
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {detail.people.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              该典籍尚未补充关联人物样例。
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_220px_1fr] lg:items-start">
                  <div className="space-y-3">
                    <div className="text-xs uppercase tracking-[0.22em] text-stone-400">
                      一级关联
                    </div>
                    {primaryPeople.map((person) => (
                      <div
                        key={person.id}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
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
                            <div className="rounded-full bg-violet-300/10 px-3 py-1 text-xs text-violet-100">
                              {person.birthYear ?? "?"} - {person.deathYear ?? "?"}
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-stone-300">{person.bio}</p>
                        {person.source === "cbdb" && person.matchedAlias ? (
                          <div className="mt-3 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1 text-xs text-emerald-100">
                            CBDB 匹配别名：{person.matchedAlias}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center gap-4 py-2">
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
                      secondaryPeople.map((person) => (
                        <div
                          key={person.id}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
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
                                {person.source === "cbdb" ? "CBDB 已命中" : "示范补全"}
                              </div>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-stone-300">{person.bio}</p>
                          {person.source === "cbdb" && person.matchedAlias ? (
                            <div className="mt-3 rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1 text-xs text-emerald-100">
                              CBDB 匹配别名：{person.matchedAlias}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
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
                  绿色来源标记说明人物已从 CBDB 命中，灰色说明当前仍由示范域补全，便于后续逐步替换成真实图谱。
                </div>
              </div>
            </>
          )}
        </section>
      ) : null}

      {tab === "versions" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">版本流变树</h3>
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {detail.versions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              该典籍尚未补充版本链路样例。
            </div>
          ) : (
            <>
              <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                <div className="space-y-4">
                  {detail.versions.map((version, index) => (
                    <div key={version.id} className="flex gap-3">
                      <div className="flex w-8 flex-col items-center pt-2">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            version.status === "存世" ? "bg-emerald-300" : "bg-stone-400"
                          }`}
                        />
                        {index < detail.versions.length - 1 ? (
                          <div className="mt-1 h-full w-px bg-white/15" />
                        ) : null}
                      </div>
                      <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-stone-50">{version.label}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                              {version.year} · {version.place} · {version.library}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {version.editionType ? (
                              <span
                                className={`rounded-full px-3 py-1 text-xs ${versionTypeClass(version.editionType)}`}
                              >
                                {version.editionType}
                              </span>
                            ) : null}
                            <div
                              className={`rounded-full px-3 py-1 text-xs ${
                                version.status === "存世"
                                  ? "bg-emerald-300/10 text-emerald-100"
                                  : "bg-white/10 text-stone-300"
                              }`}
                            >
                              {version.status}
                            </div>
                          </div>
                        </div>

                        {version.note ? (
                          <p className="mt-3 text-sm leading-7 text-stone-300">
                            {version.note}
                          </p>
                        ) : null}

                        {version.parentId ? (
                          <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-stone-400">
                            承接上一个版本节点继续流传
                          </div>
                        ) : (
                          <div className="mt-3 inline-flex rounded-full border border-amber-300/15 bg-amber-300/8 px-3 py-1 text-xs text-amber-100">
                            版本链起点 / 祖本层
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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

      {tab === "timeline" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">关联时间线</h3>
            <span className="text-xs text-stone-400">中观视图</span>
          </div>
          {detail.timeline.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="text-sm text-amber-100">{item.year}</div>
              <div className="mt-1 font-medium text-stone-50">{item.title}</div>
              <p className="mt-2 text-sm leading-6 text-stone-300">{item.detail}</p>
            </div>
          ))}
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

      {tab === "passages" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">文本对读与溯源</h3>
            <span className="text-xs text-stone-400">微观视图</span>
          </div>
          {detail.passages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-stone-400">
              当前典籍尚未补充逐字对读样例，后续阶段会接入显式引用与语义关联证据。
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
                    {detail.passages.map((passage) => (
                      <button
                        key={passage.id}
                        type="button"
                        onClick={() => handleSelectPassage(passage.id)}
                        className={`rounded-full px-3 py-2 text-xs transition ${
                          activePassageId === passage.id
                            ? "bg-cyan-300 text-stone-950"
                            : "border border-white/10 bg-black/15 text-stone-300 hover:bg-white/10"
                        }`}
                      >
                        {passage.section}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">
                    交互说明
                  </div>
                  <p className="mt-3 text-sm leading-7 text-cyan-50/90">
                    点击证据卡可切换当前引文焦点；溯源链会按节奏逐步点亮，模拟方案中的“逆流而上”。
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
                      <div className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-cyan-100/75">
                          当前聚焦证据
                        </div>
                        <div className="mt-2 text-sm font-medium text-cyan-50">
                          {activeLink.sourceTitle}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-cyan-50/90">
                          {activeLink.evidence}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-cyan-50">溯源光线链路</h4>
                      <span className="text-xs text-cyan-100/70">
                        已推进 {Math.min(traceStep + 1, activePassage.tracePath?.length ?? 0)} /
                        {activePassage.tracePath?.length ?? 0}
                      </span>
                    </div>
                    {activePassage.tracePath?.length ? (
                      <div className="mt-3 space-y-3">
                        {activePassage.tracePath.map((trace, index) => {
                          const isActive = index <= traceStep;
                          return (
                            <div key={trace.id} className="flex gap-3">
                              <div className="flex w-8 flex-col items-center pt-1">
                                <div
                                  className={`h-3 w-3 rounded-full transition ${
                                    isActive ? "bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.65)]" : "bg-white/20"
                                  }`}
                                />
                                {index < activePassage.tracePath!.length - 1 ? (
                                  <div
                                    className={`mt-1 h-full w-px transition ${
                                      isActive ? "bg-cyan-300/35" : "bg-white/10"
                                    }`}
                                  />
                                ) : null}
                              </div>
                              <div
                                className={`flex-1 rounded-2xl px-3 py-3 transition ${
                                  isActive
                                    ? "bg-cyan-300/10 ring-1 ring-cyan-300/15"
                                    : "bg-black/15"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-medium text-stone-50">
                                    {trace.title}
                                  </span>
                                  <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">
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
                    ) : (
                      <div className="mt-3 text-sm text-stone-400">暂无溯源链路样例。</div>
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
                      <div className="mt-3 text-sm text-stone-400">暂无下游影响样例。</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4 text-sm leading-7 text-cyan-50">
            微观层现在已经支持横排/竖排切换、证据焦点切换、自动推进式溯源链路和下游影响追踪，更接近方案里的“逐字探源”交互。
          </div>
        </section>
      ) : null}
    </div>
  );
}
