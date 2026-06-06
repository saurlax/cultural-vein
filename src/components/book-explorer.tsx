"use client";

import { useState } from "react";

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
  const primaryPeople = detail.people.filter((person) => (person.relationTier ?? 2) === 1);
  const secondaryPeople = detail.people.filter((person) => (person.relationTier ?? 2) === 2);

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
            detail.spread.map((item) => {
              const fromPlace = detail.places.find((place) => place.id === item.fromPlaceId);
              const toPlace = detail.places.find((place) => place.id === item.toPlaceId);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-stone-50">
                      {fromPlace?.name ?? "未知"} → {toPlace?.name ?? "未知"}
                    </div>
                    <div className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      流量 {item.volume}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-stone-300">
                    {item.startYear} - {item.endYear}
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-[linear-gradient(90deg,#67e8f9,#34d399)]"
                      style={{ width: `${Math.min(item.volume, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
          <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-sm leading-7 text-stone-300">
            这一视图后续会接入 3D 地球与历史地名坐标。当前先用“航线卡片 + 流量条”稳定表达传播方向、时间和规模。
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
          ) : (
            detail.passages.map((passage) => (
              <div
                key={passage.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  {passage.section}
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      原文对读
                    </div>
                    <p className="mt-3 text-sm leading-8 text-stone-100">
                      {passage.original}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {passage.links.map((link) => (
                        <span
                          key={link.id}
                          className={`text-xs ${inlineConfidenceClass(link.confidenceLabel)}`}
                        >
                          {link.sourceTitle} · {link.confidenceLabel}置信度
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                      引用证据
                    </div>
                    <div className="mt-3 space-y-2">
                      {passage.links.map((link) => (
                        <div
                          key={link.id}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm"
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-cyan-50">溯源光线链路</h4>
                      <span className="text-xs text-cyan-100/70">上游追踪</span>
                    </div>
                    {passage.tracePath?.length ? (
                      <div className="mt-3 space-y-3">
                        {passage.tracePath.map((trace, index) => (
                          <div key={trace.id} className="flex gap-3">
                            <div className="flex w-8 flex-col items-center pt-1">
                              <div className="h-3 w-3 rounded-full bg-cyan-300" />
                              {index < passage.tracePath!.length - 1 ? (
                                <div className="mt-1 h-full w-px bg-cyan-300/25" />
                              ) : null}
                            </div>
                            <div className="flex-1 rounded-2xl bg-black/15 px-3 py-3">
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
                        ))}
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
                    {passage.downstreamInfluence?.length ? (
                      <div className="mt-3 space-y-2">
                        {passage.downstreamInfluence.map((item) => (
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
            ))
          )}
          <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4 text-sm leading-7 text-cyan-50">
            “溯源光线动画”和“影响追踪”下一步会从这些 passages 和 citations 数据直接生成。
          </div>
        </section>
      ) : null}
    </div>
  );
}
