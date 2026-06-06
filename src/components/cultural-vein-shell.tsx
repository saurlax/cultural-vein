"use client";

import { useMemo } from "react";

import { BookExplorer } from "@/components/book-explorer";
import { RiverScene } from "@/components/river-scene";
import { riverDataset } from "@/data/demo-graph";
import { useCulturalVeinStore } from "@/store/app-store";

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

  const selectedBook = riverDataset.books.find((book) => book.slug === selectedBookSlug);
  const selectedDetail = riverDataset.booksBySlug[selectedBookSlug];

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
              <div className="grid gap-2">
                {eras.map((era) => (
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
                    {era}
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
            citations={riverDataset.citations.filter((citation) => {
              return filteredBooks.some((book) => book.id === citation.source) &&
                filteredBooks.some((book) => book.id === citation.target);
            })}
            selectedBookSlug={selectedBookSlug}
            onSelectBook={setSelectedBookSlug}
          />

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/15 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.2em] text-stone-400">
                主河段
              </div>
              <div className="mt-2 text-lg font-semibold text-stone-50">
                先秦至宋元
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
                史学 / 考据 / 近代诗学
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
                4 层置信度
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

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
