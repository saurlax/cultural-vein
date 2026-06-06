"use client";

import { useEffect, useMemo, useState } from "react";

import { BookExplorer } from "@/components/book-explorer";
import { RiverScene } from "@/components/river-scene";
import { riverDataset } from "@/data/demo-graph";
import { useCulturalVeinStore } from "@/store/app-store";
import type { DatasetInsight } from "@/types/domain";

const eras = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"] as const;
const categories = ["全部", "经", "史", "子", "集"] as const;

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

  const filteredBooks = useMemo(() => {
    return riverDataset.books.filter((book) => {
      const matchesEra = eras.indexOf(book.dynasty) <= eras.indexOf(activeEra);
      const matchesCategory =
        categoryFilter === "全部" || book.category === categoryFilter;
      const normalized = `${book.title}${book.summary}${book.concepts.join("")}${book.school}`;
      const matchesSearch =
        searchTerm.trim().length === 0 || normalized.includes(searchTerm.trim());

      return matchesEra && matchesCategory && matchesSearch;
    });
  }, [activeEra, categoryFilter, searchTerm]);

  const activeEraIndex = eras.indexOf(activeEra);
  const visibleCitations = riverDataset.citations.filter((citation) => {
    return filteredBooks.some((book) => book.id === citation.source) &&
      filteredBooks.some((book) => book.id === citation.target);
  });
  const matchedBooks = filteredBooks.filter((book) =>
    searchTerm.trim().length > 0
      ? `${book.title}${book.summary}${book.concepts.join("")}${book.school}`.includes(
          searchTerm.trim(),
        )
      : true,
  );

  const selectedBook = riverDataset.books.find((book) => book.slug === selectedBookSlug);
  const selectedDetail = riverDataset.booksBySlug[selectedBookSlug];
  const cbdbSummary = insights?.cbdbSummary;

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
        // Keep the static shell usable even if the request fails.
      }
    };

    void loadInsights();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top,#214d46_0%,#102622_35%,#081512_65%,#050a09_100%)] text-stone-100">
      <header className="border-b border-white/10 bg-black/15 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300/80">
              Cultural Vein
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-50">
              文脉溯源
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-300">
              以三维河流隐喻重构典籍传承网络，先完成可演示的 MVP：宏观文脉总览、典籍钻入与文本溯源的统一框架。
            </p>
          </div>

          <div className="grid gap-3 text-sm text-stone-200 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">典籍节点</div>
              <div className="mt-2 text-2xl font-semibold">{riverDataset.books.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">关系边</div>
              <div className="mt-2 text-2xl font-semibold">{riverDataset.citations.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">示范域</div>
              <div className="mt-2 text-2xl font-semibold">四书五经 + 诗史支流</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-stone-400">状态</div>
              <div className="mt-2 text-2xl font-semibold">骨架已上线</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-6 py-6 lg:grid-cols-[320px_minmax(0,1fr)_380px]">
        <aside className="space-y-4 rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">宏观控制台</h2>
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-300 transition hover:bg-white/10"
                onClick={resetSelection}
                type="button"
              >
                回到河流
              </button>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-stone-400">
                概念搜索
              </span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索 仁 / 礼 / 诗 / 教化"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-50 outline-none placeholder:text-stone-500 focus:border-amber-300/50"
              />
            </label>

            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-400">
                类别筛选
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCategoryFilter(category)}
                    className={`rounded-full px-3 py-2 text-xs transition ${
                      categoryFilter === category
                        ? "bg-amber-300 text-stone-950"
                        : "border border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
            <div className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-400">
              时间轴
            </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-3">
                <input
                  type="range"
                  min={0}
                  max={eras.length - 1}
                  step={1}
                  value={activeEraIndex}
                  onChange={(event) => setActiveEra(eras[Number(event.target.value)])}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
                />
                <div className="mt-3 flex items-center justify-between text-[11px] text-stone-500">
                  <span>{eras[0]}</span>
                  <span>{eras[eras.length - 1]}</span>
                </div>
                <div className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                    当前断代
                  </div>
                  <div className="mt-1 text-lg font-semibold text-amber-50">{activeEra}</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    当前已显现 {filteredBooks.length} 条典籍河段与 {visibleCitations.length} 条关系边，
                    模拟文脉随时代逐步生长。
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                {eras.map((era, index) => (
                  <button
                    key={era}
                    type="button"
                    onClick={() => setActiveEra(era)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      activeEra === era
                        ? "border-amber-300/60 bg-amber-200/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-stone-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{era}</span>
                      <span className="text-xs text-stone-400">
                        {riverDataset.books.filter((book) => eras.indexOf(book.dynasty) <= index).length}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </aside>

        <main className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-400">
                第一阶段
              </p>
              <h2 className="text-2xl font-semibold">文脉河流数据骨架</h2>
            </div>
            <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
              {viewMode === "river" ? "河流总览" : "典籍钻入"}
            </div>
          </div>

          <RiverScene
            books={filteredBooks}
            citations={visibleCitations}
            selectedBookSlug={selectedBookSlug}
            onSelectBook={setSelectedBookSlug}
            activeEra={activeEra}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                主河段
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {eras[0]}至{activeEra}
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                以《诗经》《礼记》与《四书章句集注》构成知识主河道。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                支流
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {Array.from(new Set(filteredBooks.map((book) => book.school))).slice(0, 3).join(" / ") || "待显现"}
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                支流通过关系弧线与主河汇接，表达注疏、史法和影响扩散。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                关系编码
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                {new Set(visibleCitations.map((citation) => citation.layer)).size} 层已显现
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                白色元数据、绿色显式引用、黄色语义关联、灰色影响链。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                当前时间轴
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">{activeEra}</div>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                仅显示不晚于当前时代的河段与分支，模拟文脉逐步生长。
              </p>
            </div>
          </div>

          {cbdbSummary?.available ? (
            <div className="mt-4 rounded-[28px] border border-cyan-300/15 bg-cyan-300/5 px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-cyan-100/75">
                    Real Dataset Coverage
                  </div>
                  <div className="mt-1 text-lg font-semibold text-cyan-50">
                    CBDB 已接入 {cbdbSummary.personCount?.toLocaleString() ?? "未知"} 条人物记录
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(cbdbSummary.topDynasties ?? []).slice(0, 4).map((item) => (
                    <span
                      key={item.name}
                      className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-xs text-cyan-100"
                    >
                      {item.name} {item.count.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
              {insights?.shanghaiLibraryActivity?.available ? (
                <div className="mt-3 text-xs text-cyan-100/75">
                  活动样本源：{insights.shanghaiLibraryActivity.sourceWorkbook} · 表：
                  {insights.shanghaiLibraryActivity.sheetName}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
                方法说明
              </div>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                三层关系 + 三层交互
              </h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-sm font-medium text-stone-50">宏观层</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    用河流总览表达典籍主干、支流与时代推进。
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-sm font-medium text-stone-50">中观层</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    用传播、人物、版本、时间线展开关联叙事。
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="text-sm font-medium text-stone-50">微观层</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    用文本对读、证据切换和溯源链路解释引文关系。
                  </p>
                </div>
              </div>
              <div className="mt-4 text-sm leading-7 text-stone-300">
                当前界面把元数据关系、显式引用、语义关联与影响链统一组织到同一交互框架中，优先保证可演示性，再逐步扩大真实数据覆盖面。
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/15 px-5 py-5">
              <div className="text-xs uppercase tracking-[0.24em] text-stone-400">
                数据来源
              </div>
              <h3 className="mt-2 text-xl font-semibold text-stone-50">
                当前已接入的真实样本
              </h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                  <div className="text-sm font-medium text-cyan-50">CBDB</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    人物传记、活动地点、活动时间线线索。
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                  <div className="text-sm font-medium text-cyan-50">上海图书馆开放数据 2026</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    活动场馆样本与文化传播现场事件。
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/5 px-4 py-4">
                  <div className="text-sm font-medium text-cyan-50">南京图书馆 / 复旦大学图书馆</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">
                    图像资源样本、馆藏来源与手稿诗笺说明。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(8,17,16,0.92))] px-5 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs uppercase tracking-[0.24em] text-amber-100/75">
                  Review Mode
                </div>
                <h3 className="mt-2 text-2xl font-semibold text-stone-50">
                  评审视角下的作品亮点
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  当前版本已经把“河流隐喻 + 典籍多维钻入 + 真实数据样本接入”组织成一套完整演示路径，适合用来回答创新性、数据利用深度、学术严谨性和交互体验这四类核心评审问题。
                </p>
              </div>
              <div className="grid gap-2 text-xs text-stone-200 sm:grid-cols-2 xl:w-[360px]">
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">创新隐喻</div>
                  <div className="mt-2 font-medium text-stone-50">文脉 = 水脉</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">真实来源</div>
                  <div className="mt-2 font-medium text-stone-50">CBDB + 上图 + 馆藏样例</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">关系分层</div>
                  <div className="mt-2 font-medium text-stone-50">元数据 / 引用 / 语义 / 影响</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                  <div className="text-stone-400">演示路径</div>
                  <div className="mt-2 font-medium text-stone-50">总览 → 钻入 → 溯源</div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  1. 创新性
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  用三维河流替代传统知识图谱 hairball，把时间演化、主干支流与影响强弱压进同一视觉语言。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  2. 数据利用
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  不只展示示范域，还把 CBDB、上海图书馆、南京图书馆、复旦大学图书馆的样本信号接入到人物、时间线和机构来源里。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  3. 学术严谨性
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  关系按置信层级区分，不把推测包装成事实；真实样本统一带来源说明，方便答辩时解释“哪些是权威数据、哪些是示范补全”。
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.2em] text-amber-100/75">
                  4. 交互深度
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  宏观层负责看谱系，中观层负责找关系，微观层负责看证据，能支撑展览传播和学术研究两类场景。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredBooks.length === 0 ? (
              <div className="xl:col-span-3 rounded-[26px] border border-dashed border-white/10 bg-black/10 px-5 py-8 text-sm text-stone-400">
                当前筛选下没有匹配典籍。可以放宽时间轴、清空概念词，或切换类别后继续探索。
              </div>
            ) : null}
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                type="button"
                onClick={() => setSelectedBookSlug(book.slug)}
                className={`group rounded-[26px] border p-4 text-left transition ${
                  selectedBookSlug === book.slug
                    ? "border-amber-300/50 bg-amber-200/10 shadow-lg shadow-amber-500/10"
                    : "border-white/10 bg-black/10 hover:-translate-y-0.5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-400">
                      {book.dynasty} · {book.category}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-stone-50">
                      {book.title}
                    </h3>
                  </div>
                  <div className="rounded-full bg-white/8 px-3 py-1 text-xs text-amber-100">
                    {book.school}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-300">{book.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {book.concepts.map((concept) => (
                    <span
                      key={concept}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-stone-400">
                  <div className="rounded-2xl bg-white/5 px-3 py-2">
                    影响力 <span className="ml-2 text-stone-100">{book.influence}</span>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-3 py-2">
                    传播速率 <span className="ml-2 text-stone-100">{book.velocity.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-stone-500">
                  {matchedBooks.some((item) => item.id === book.id)
                    ? "命中当前文脉筛选"
                    : "位于当前时间层但未命中搜索"}
                </div>
              </button>
            ))}
          </div>
        </main>

        <aside className="space-y-4 rounded-[28px] border border-white/10 bg-black/20 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          {selectedBook && selectedDetail ? (
            <BookExplorer book={selectedBook} detail={selectedDetail} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
