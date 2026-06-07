import realSupplements from "@/data/generated/real-supplements.json";
import { riverDataset } from "@/data/river-dataset";
import { searchConcepts } from "@/lib/concept-search";
import { buildSourceEvidence } from "@/lib/source-evidence";
import type { DatasetInsight } from "@/types/domain";

type SourceAtlasEntry = NonNullable<DatasetInsight["sourceAtlas"]>[number];

interface SourceAtlasQueryOptions {
  q?: string;
  era?: string | null;
  theme?: string | null;
  limit?: number | null;
}

export function getGraphPayload() {
  return {
    books: riverDataset.books,
    citations: riverDataset.citations,
  };
}

export function getBookPayload(slug: string) {
  const book = riverDataset.books.find((item) => item.slug === slug);
  const detail = riverDataset.booksBySlug[slug];

  if (!book || !detail) {
    return null;
  }

  return {
    book,
    detail,
    sourceEvidence: buildSourceEvidence(detail),
    related: riverDataset.citations.filter(
      (edge) => edge.source === book.id || edge.target === book.id,
    ),
  };
}

export function getSearchPayload(query: string) {
  return searchConcepts(query);
}

function inferSourceAtlasEra(entry: SourceAtlasEntry) {
  const yearText = entry.sampleRecords?.map((record) => record.year).find(Boolean);

  if (yearText) {
    const matched = yearText.match(/-?\d{3,4}/);

    if (matched) {
      const year = Number(matched[0]);

      if (!Number.isNaN(year)) {
        if (year <= -221) {
          return "先秦";
        }

        if (year <= 220) {
          return "两汉";
        }

        if (year <= 589) {
          return "魏晋";
        }

        if (year <= 907) {
          return "隋唐";
        }

        if (year <= 1368) {
          return "宋元";
        }

        if (year <= 1911) {
          return "明清";
        }

        return "近现代";
      }
    }
  }

  if (
    entry.name.includes("南湖") ||
    entry.name.includes("红色") ||
    entry.name.includes("韬奋") ||
    entry.name.includes("宋庆龄") ||
    entry.name.includes("报刊") ||
    entry.name.includes("专题片") ||
    entry.name.includes("图书馆") ||
    entry.name.includes("纪念馆")
  ) {
    return "近现代";
  }

  return null;
}

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

  if (name.includes("报刊")) {
    return "近现代文献";
  }

  if (name.includes("Artlib") || name.includes("艺术")) {
    return "艺术图像";
  }

  if (name.includes("图书馆") || name.includes("馆藏") || name.includes("纪念馆")) {
    return "馆藏支流";
  }

  if (name.includes("宋庆龄") || name.includes("韬奋")) {
    return "近现代支流";
  }

  return "来源支流";
}

function enrichSourceAtlasEntry(entry: SourceAtlasEntry) {
  return {
    ...entry,
    era: inferSourceAtlasEra(entry),
    theme: getSourceThemeLabel(entry.name),
  };
}

export function getSourceAtlasPayload(options?: SourceAtlasQueryOptions) {
  const insights = getInsightsPayload();
  const normalizedQuery = options?.q?.trim() ?? "";
  const normalizedEra = options?.era?.trim() ?? "";
  const normalizedTheme = options?.theme?.trim() ?? "";
  const normalizedLimit =
    typeof options?.limit === "number" && Number.isFinite(options.limit) && options.limit > 0
      ? Math.floor(options.limit)
      : null;
  const sourceAtlas = (insights.sourceAtlas ?? []).map(enrichSourceAtlasEntry);
  const filteredSourceAtlas = sourceAtlas.filter((entry) => {
    const matchesQuery =
      !normalizedQuery ||
      [
        entry.id,
        entry.name,
        entry.summary,
        entry.stat,
        entry.evidenceLabel,
        entry.evidenceNote,
        entry.theme,
        entry.era,
        ...(entry.sampleTitles ?? []),
        ...(entry.sampleRecords ?? []).flatMap((record) => [
          record.title,
          record.category,
          record.year,
          record.note,
        ]),
      ]
        .filter(Boolean)
        .some((value) => value?.includes(normalizedQuery));
    const matchesEra = !normalizedEra || entry.era === normalizedEra;
    const matchesTheme = !normalizedTheme || entry.theme === normalizedTheme;

    return matchesQuery && matchesEra && matchesTheme;
  });
  const limitedSourceAtlas = normalizedLimit
    ? filteredSourceAtlas.slice(0, normalizedLimit)
    : filteredSourceAtlas;

  return {
    sourceAtlas: limitedSourceAtlas,
    atlasMeta: insights.atlasMeta ?? null,
    query: {
      q: normalizedQuery || null,
      era: normalizedEra || null,
      theme: normalizedTheme || null,
      limit: normalizedLimit,
      total: sourceAtlas.length,
      matched: filteredSourceAtlas.length,
    },
  };
}

export function getSourceAtlasEntryPayload(id: string) {
  const atlas = getSourceAtlasPayload();
  const entry = atlas.sourceAtlas.find((item) => item.id === id);

  if (!entry) {
    return null;
  }

  return {
    entry,
    atlasMeta: atlas.atlasMeta,
    relatedBooks: riverDataset.books
      .filter((book) => entry.relatedBookSlugs?.includes(book.slug))
      .slice(0, 6)
      .map((book) => ({
        id: book.id,
        slug: book.slug,
        title: book.title,
        dynasty: book.dynasty,
        category: book.category,
      })),
  };
}

export function getInsightsPayload(): DatasetInsight {
  const nanhuRecords = realSupplements.nanhuArchiveSample?.sampleRecords ?? [];
  const redArchiveRecords = nanhuRecords
    .filter((item) => {
      const text = `${item.title ?? ""} ${item.sourceText ?? ""}`;
      return (
        text.includes("一大") ||
        text.includes("南湖会议") ||
        text.includes("题字") ||
        text.includes("题诗") ||
        text.includes("题词") ||
        text.includes("代表简介")
      );
    })
    .slice(0, 3);
  const sourceAtlas = [
    realSupplements.cbdbSummary?.available
      ? {
          id: "cbdb",
          name: "纪传人物库",
          summary: "纪传人物与朝代分布",
          stat: `${realSupplements.cbdbSummary.personCount?.toLocaleString() ?? "--"} 位人物`,
          magnitude: realSupplements.cbdbSummary.personCount ?? 0,
          evidenceLabel: "纪传人物统计",
          evidenceNote: "依据朝代分布与人物总量字段，当前用于人物关系与时间线补证。",
          relatedBookSlugs: ["shiji", "zi-zhi-tong-jian", "lunyu", "mengzi", "shijing"],
          sampleTitles: (realSupplements.cbdbSummary.topDynasties ?? [])
            .slice(0, 3)
            .map((item) => `${item.name} ${item.count}`),
          sampleRecords: (realSupplements.cbdbSummary.topDynasties ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.name,
              category: "朝代分布",
              year: "",
              note: `收录人物 ${item.count} 位`,
            })),
        }
      : null,
    realSupplements.shanghaiLibraryActivity?.available
      ? {
          id: "shanghai-library",
          name: "上图活动",
          summary: "场馆活动与预约实录",
          stat: `${realSupplements.shanghaiLibraryActivity.topVenues?.length ?? 0} 组场馆`,
          magnitude:
            realSupplements.shanghaiLibraryActivity.sampleRecords?.length ??
            realSupplements.shanghaiLibraryActivity.topVenues?.length ??
            0,
          evidenceLabel: realSupplements.shanghaiLibraryActivity.sheetName ?? "活动预约字段",
          evidenceNote: "原始字段包含活动名称、场馆名称、预约状态与预约开始时间。",
          relatedBookSlugs: ["lunyu", "liji", "daxue", "zhongyong", "xiaojing", "sishu-zhangju"],
          sampleTitles: (realSupplements.shanghaiLibraryActivity.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => item.活动名称 ?? item.场馆名称 ?? "活动资料"),
          sampleRecords: (realSupplements.shanghaiLibraryActivity.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.活动名称 ?? "活动资料",
              category: item.场馆名称,
              year: item.预约开始时间,
              note: item.预约状态,
            })),
        }
      : null,
    realSupplements.shanghaiLibraryBorrow?.available
      ? {
          id: "shanghai-library-borrow",
          name: "上图借阅",
          summary: "公共阅读流通与现实馆际落点",
          stat: `${realSupplements.shanghaiLibraryBorrow.topLibraries?.length ?? 0} 组流通馆`,
          magnitude:
            realSupplements.shanghaiLibraryBorrow.sampleRecords?.length ??
            realSupplements.shanghaiLibraryBorrow.topLibraries?.length ??
            0,
          evidenceLabel: realSupplements.shanghaiLibraryBorrow.sheetName ?? "借阅流通字段",
          evidenceNote: "原始字段包含流通馆、流通操作、馆藏类型、书名、作者、出版社与出版年。",
          relatedBookSlugs: ["shijing", "lunyu", "liji", "daxue", "zhongyong", "xiaojing"],
          sampleTitles: (realSupplements.shanghaiLibraryBorrow.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => item.书名 ?? item.流通馆 ?? "借阅记录"),
          sampleRecords: (realSupplements.shanghaiLibraryBorrow.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.书名 ?? "借阅记录",
              category: item.流通馆 ?? item.流通操作,
              year: item.出版年,
              note: [item.作者, item.出版社, item.流通操作].filter(Boolean).join(" · "),
            })),
        }
      : null,
    realSupplements.nanjingLibrarySample?.available
      ? {
          id: "nanjing-library",
          name: "南京图书馆",
          summary: realSupplements.nanjingLibrarySample.institution,
          stat: `${realSupplements.nanjingLibrarySample.recordCount?.toLocaleString() ?? "--"} 条图像`,
          magnitude: realSupplements.nanjingLibrarySample.recordCount ?? 0,
          evidenceLabel: realSupplements.nanjingLibrarySample.institution ?? "图像资源条目",
          evidenceNote: "原始条目保留题名、分类、年代与图像出处说明。",
          relatedBookSlugs: ["ren-jian-ci-hua", "ri-zhi-lu", "shangshu-zhengyi", "wenxuan"],
          sampleTitles: realSupplements.nanjingLibrarySample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.nanjingLibrarySample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.fudanArchiveSample?.available
      ? {
          id: "fudan-archive",
          name: "复旦馆藏",
          summary: realSupplements.fudanArchiveSample.summary,
          stat: realSupplements.fudanArchiveSample.collectionTitle ?? "近代手稿资料",
          magnitude: realSupplements.fudanArchiveSample.sampleRecords?.length ?? 0,
          evidenceLabel: realSupplements.fudanArchiveSample.collectionTitle ?? "馆藏说明",
          evidenceNote: "当前保留馆藏题名、类别、年代与资料出处。",
          relatedBookSlugs: ["ren-jian-ci-hua", "shuowen"],
          sampleTitles: (realSupplements.fudanArchiveSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => item.title),
          sampleRecords: (realSupplements.fudanArchiveSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.fudanArchiveSample?.available
      ? {
          id: "genealogy-archive",
          name: "家谱文献",
          summary:
            "以上海地方藏书与族裔递藏线索为引，把家学、藏书楼与家礼传播牵成一股可回查的家族支流。",
          stat: "家族传播线索已显河面",
          magnitude: realSupplements.fudanArchiveSample.sampleRecords?.length ?? 0,
          evidenceLabel: "族裔递藏与家学线索",
          evidenceNote:
            "依据复旦馆藏摘要中的周氏族裔、藏书递藏与地方书楼叙述，当前已把家族传播落点挂入《孝经》《礼记》《大学》《朱子家礼》等河段。",
          relatedBookSlugs: ["xiaojing", "liji", "daxue", "zhuzi-jiali"],
          sampleTitles: (realSupplements.fudanArchiveSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => item.title),
          sampleRecords: (realSupplements.fudanArchiveSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: "家学 / 递藏 / 地方藏书",
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.nanhuArchiveSample?.available
      ? {
          id: "nanhu-archive",
          name: "南湖文献",
          summary: realSupplements.nanhuArchiveSample.summary,
          stat: `${realSupplements.nanhuArchiveSample.documentCount?.toLocaleString() ?? "--"} 篇文献 / ${realSupplements.nanhuArchiveSample.imageCount?.toLocaleString() ?? "--"} 张图像`,
          magnitude:
            (realSupplements.nanhuArchiveSample.documentCount ?? 0) +
            (realSupplements.nanhuArchiveSample.imageCount ?? 0),
          evidenceLabel: realSupplements.nanhuArchiveSample.collectionTitle ?? "文献 / 图像统计",
          evidenceNote: "原始资料可回查文献数量、图像数量与专题条目摘记。",
          relatedBookSlugs: ["zi-zhi-tong-jian", "chuci-zhangju", "wenxuan", "nanhu-jinian"],
          sampleTitles: (realSupplements.nanhuArchiveSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => item.title),
          sampleRecords: (realSupplements.nanhuArchiveSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.nanhuArchiveSample?.available
      ? {
          id: "red-archive",
          name: "红色文献",
          summary:
            "以南湖专题资料为锚点，把中共“一大”、代表人物与近现代纪念书写单独牵成一股红色支流。",
          stat: `${redArchiveRecords.length} 组红色线索`,
          magnitude: redArchiveRecords.length,
          evidenceLabel: "南湖红色专题",
          evidenceNote: "直接取自南湖文献数据库中的中共“一大”、题词题诗与代表人物资料。",
          relatedBookSlugs: ["shiji", "zi-zhi-tong-jian", "ren-jian-ci-hua", "nanhu-jinian"],
          sampleTitles: redArchiveRecords.map((item) => item.title),
          sampleRecords: redArchiveRecords.map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.shenzhenLibrarySample?.available
      ? {
          id: "shenzhen-library",
          name: "深圳图书馆",
          summary: realSupplements.shenzhenLibrarySample.summary,
          stat: `${realSupplements.shenzhenLibrarySample.sampleTitles?.length ?? 0} 组专题线索`,
          magnitude:
            realSupplements.shenzhenLibrarySample.sampleRecords?.length ??
            realSupplements.shenzhenLibrarySample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.shenzhenLibrarySample.collectionTitle ?? "专题库线索",
          evidenceNote: "当前保留专题库名称、类别、年代与来源文本。",
          relatedBookSlugs: ["ren-jian-ci-hua", "zi-zhi-tong-jian", "shangshu-zhengyi"],
          sampleTitles: realSupplements.shenzhenLibrarySample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.shenzhenLibrarySample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.taofenMuseumSample?.available
      ? {
          id: "taofen-museum",
          name: "韬奋纪念馆",
          summary: realSupplements.taofenMuseumSample.summary,
          stat: `${realSupplements.taofenMuseumSample.sampleTitles?.length ?? 0} 组出版资料`,
          magnitude:
            realSupplements.taofenMuseumSample.sampleRecords?.length ??
            realSupplements.taofenMuseumSample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.taofenMuseumSample.collectionTitle ?? "馆方资料条目",
          evidenceNote: "原始资料包含机构年表、人物年表与图书列表等线索。",
          relatedBookSlugs: ["ren-jian-ci-hua", "ri-zhi-lu"],
          sampleTitles: realSupplements.taofenMuseumSample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.taofenMuseumSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.soongLiteratureSample?.available
      ? {
          id: "soong-literature",
          name: "宋庆龄文献",
          summary: realSupplements.soongLiteratureSample.summary,
          stat: `${realSupplements.soongLiteratureSample.sampleTitles?.length ?? 0} 组人物事件字段`,
          magnitude:
            realSupplements.soongLiteratureSample.sampleRecords?.length ??
            realSupplements.soongLiteratureSample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.soongLiteratureSample.collectionTitle ?? "人物事件字段",
          evidenceNote: "原始字段覆盖文中人名、事件组织、写作地点与题词对象。",
          relatedBookSlugs: ["ren-jian-ci-hua", "shiji", "wenxuan"],
          sampleTitles: realSupplements.soongLiteratureSample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.soongLiteratureSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.videoTopicSample?.available
      ? {
          id: "video-topic",
          name: "城市专题片",
          summary: realSupplements.videoTopicSample.summary,
          stat: `${realSupplements.videoTopicSample.sampleTitles?.length ?? 0} 组影像`,
          magnitude:
            realSupplements.videoTopicSample.sampleRecords?.length ??
            realSupplements.videoTopicSample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.videoTopicSample.collectionTitle ?? "专题片资料",
          evidenceNote: "当前保留片名、类别、年代与专题说明文本。",
          relatedBookSlugs: ["ren-jian-ci-hua", "wenxuan", "wenxin-diaolong"],
          sampleTitles: realSupplements.videoTopicSample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.videoTopicSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.souyunKnowledgeGraphSample?.available
      ? {
          id: "souyun",
          name: "搜韵图谱",
          summary: realSupplements.souyunKnowledgeGraphSample.summary,
          stat: `${realSupplements.souyunKnowledgeGraphSample.sampleTitles?.length ?? 0} 组图谱线索`,
          magnitude:
            realSupplements.souyunKnowledgeGraphSample.sampleRecords?.length ??
            realSupplements.souyunKnowledgeGraphSample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.souyunKnowledgeGraphSample.collectionTitle ?? "诗文图谱 / 古籍库",
          evidenceNote: "原始资料保留诗文库与古籍库的字段说明。",
          relatedBookSlugs: [
            "shijing",
            "lunyu",
            "liji",
            "daxue",
            "zhongyong",
            "zhouyi",
            "mengzi",
            "sishu-zhangju",
            "ren-jian-ci-hua",
            "chuci-zhangju",
            "wenxin-diaolong",
            "wenxuan",
          ],
          sampleTitles: realSupplements.souyunKnowledgeGraphSample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.souyunKnowledgeGraphSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.periodicalIndexSample?.available
      ? {
          id: "periodical-index",
          name: "报刊索引",
          summary: realSupplements.periodicalIndexSample.summary,
          stat: `${realSupplements.periodicalIndexSample.sampleTitles?.length ?? 0} 组期刊`,
          magnitude:
            realSupplements.periodicalIndexSample.sampleRecords?.length ??
            realSupplements.periodicalIndexSample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.periodicalIndexSample.collectionTitle ?? "期刊检索字段",
          evidenceNote: "原始资料可回查题名、主题词、摘要与全文路径等字段。",
          relatedBookSlugs: ["ren-jian-ci-hua", "ri-zhi-lu", "wenxin-diaolong"],
          sampleTitles: realSupplements.periodicalIndexSample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.periodicalIndexSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
    realSupplements.artlibSample?.available
      ? {
          id: "artlib",
          name: "世界艺术鉴赏库",
          summary: realSupplements.artlibSample.summary,
          stat: `${realSupplements.artlibSample.sampleTitles?.length ?? 0} 组艺术资源`,
          magnitude:
            realSupplements.artlibSample.sampleRecords?.length ??
            realSupplements.artlibSample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.artlibSample.collectionTitle ?? "艺术家 / 艺术品接口",
          evidenceNote: "原始资料保留艺术家列表、艺术家详情、艺术品类目、列表与详情接口说明。",
          relatedBookSlugs: ["ren-jian-ci-hua", "wenxin-diaolong", "wenxuan"],
          sampleTitles: realSupplements.artlibSample.sampleTitles?.slice(0, 3),
          sampleRecords: (realSupplements.artlibSample.sampleRecords ?? [])
            .slice(0, 3)
            .map((item) => ({
              title: item.title,
              category: item.category,
              year: item.year,
              note: item.sourceText,
            })),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    sourceAtlas,
    atlasMeta: {
      demoBookCount: riverDataset.books.length,
      totalBookCount: 1300000,
      totalCitationCount: riverDataset.citations.length,
      activeSources: sourceAtlas.length,
      plannedLayers: [
        "古籍循证",
        "人名规范",
        "书目版本",
        "地名事件",
        "专题文献",
        "诗词图谱",
        "家谱文献",
        "红色文献",
        "艺术图像",
      ],
      expansionNote:
        "首页长卷已将主线典籍、真实来源与河上落点汇成一河，能够直接顺流检索、入卷、回查来源。",
      coverageLayers: [
        {
          id: "core-classics",
          label: "古籍循证",
          status: "已显河面",
          scope: "主线典籍域",
          usage: "主河道节点、引用关系与文本溯源基础",
        },
        {
          id: "cbdb-people",
          label: "人名规范 / 纪传人物库",
          status: "已显河面",
          scope: "人物命中与纪传地点",
          usage: "人物关系、活动地点、时间线补证",
        },
        {
          id: "bibliography",
          label: "书目版本",
          status: "已显河面",
          scope: "版本链与馆藏落点",
          usage: "版本流变树、馆藏落点与资源回查",
        },
        {
          id: "geo-events",
          label: "地名事件",
          status: "已显河面",
          scope: "场馆、活动、专题片与事件线索",
          usage: "地理传播、时间回声与真实场景挂接",
        },
        {
          id: "public-circulation",
          label: "公共流通",
          status: "已显河面",
          scope: "上图借阅流通记录",
          usage: "现实阅读传播、馆际落点与公共借阅证据",
        },
        {
          id: "special-archives",
          label: "专题文献",
          status: "已显河面",
          scope: "南湖、宋庆龄、韬奋等专题资料",
          usage: "近现代支流、机构落点与来源证据总表",
        },
        {
          id: "poetry-graph",
          label: "诗词图谱",
          status: "已显河面",
          scope: "搜韵图谱与古典诗学外推",
          usage: "诗学支流、文本比对与古籍关联外推",
        },
        {
          id: "art-image",
          label: "艺术图像",
          status: "已显河面",
          scope: "世界艺术鉴赏库",
          usage: "近现代审美传播、人物图像与艺术品资源补充，可继续外推到展陈与图像叙事场景。",
        },
        {
          id: "genealogy",
          label: "家谱文献",
          status: "已显河面",
          scope: "家礼、家学与家族传播落点",
          usage: "已由复旦馆藏中的族裔递藏与地方书楼线索接入《孝经》《礼记》《大学》等河段，形成可回查的家族传播支流。",
        },
        {
          id: "red-archives",
          label: "红色文献",
          status: "已显河面",
          scope: "近现代专题文献支流",
          usage: "已由南湖专题中的中共“一大”、代表人物与题词题诗线索接入《史记》《资治通鉴》《人间词话》等近现代回望河段，形成可回查的红色支流。",
        },
        {
          id: "full-atlas",
          label: "全域扩展",
          status: "后续可扩",
          scope: "130 万种古籍与更大关系网",
          usage: "当前已先托住核心河段，后续可沿统一装配链增量扩入更大规模书目与关系。",
        },
      ],
    },
    cbdbSummary: realSupplements.cbdbSummary,
    cbdbPeople: (realSupplements.cbdbPeople ?? []).map((person) => ({
      name: person.name,
      foundInCbdb: person.foundInCbdb,
      matchedAlias: "matchedAlias" in person ? person.matchedAlias : undefined,
    })),
    shanghaiLibraryActivity: realSupplements.shanghaiLibraryActivity
      ? {
          available: realSupplements.shanghaiLibraryActivity.available,
          sourceWorkbook: realSupplements.shanghaiLibraryActivity.sourceWorkbook,
          sheetName: realSupplements.shanghaiLibraryActivity.sheetName,
          topVenues: realSupplements.shanghaiLibraryActivity.topVenues,
          sampleRecords: (realSupplements.shanghaiLibraryActivity.sampleRecords ?? [])
            .slice(0, 4)
            .map((item) => ({
              venue: item.场馆名称,
              title: item.活动名称,
              status: item.预约状态,
              startTime: item.预约开始时间,
            })),
        }
      : undefined,
    shanghaiLibraryBorrow: realSupplements.shanghaiLibraryBorrow
      ? {
          available: realSupplements.shanghaiLibraryBorrow.available,
          sourceWorkbook: realSupplements.shanghaiLibraryBorrow.sourceWorkbook,
          sheetName: realSupplements.shanghaiLibraryBorrow.sheetName,
          topLibraries: realSupplements.shanghaiLibraryBorrow.topLibraries,
          sampleRecords: (realSupplements.shanghaiLibraryBorrow.sampleRecords ?? [])
            .slice(0, 4)
            .map((item) => ({
              library: item.流通馆,
              title: item.书名,
              action: item.流通操作,
              publishYear: item.出版年,
              author: item.作者,
            })),
        }
      : undefined,
    nanjingLibrarySample: realSupplements.nanjingLibrarySample
      ? {
          available: realSupplements.nanjingLibrarySample.available,
          institution: realSupplements.nanjingLibrarySample.institution,
          recordCount: realSupplements.nanjingLibrarySample.recordCount,
          summary: realSupplements.nanjingLibrarySample.sampleRecords?.[0]?.sourceText,
          sampleTitles: realSupplements.nanjingLibrarySample.sampleTitles,
        }
      : undefined,
    fudanArchiveSample: realSupplements.fudanArchiveSample
      ? {
          available: realSupplements.fudanArchiveSample.available,
          institution: realSupplements.fudanArchiveSample.institution,
          collectionTitle: realSupplements.fudanArchiveSample.collectionTitle,
          summary: realSupplements.fudanArchiveSample.summary,
        }
      : undefined,
    nanhuArchiveSample: realSupplements.nanhuArchiveSample
      ? {
          available: realSupplements.nanhuArchiveSample.available,
          institution: realSupplements.nanhuArchiveSample.institution,
          collectionTitle: realSupplements.nanhuArchiveSample.collectionTitle,
          documentCount: realSupplements.nanhuArchiveSample.documentCount,
          imageCount: realSupplements.nanhuArchiveSample.imageCount,
          summary: realSupplements.nanhuArchiveSample.summary,
        }
      : undefined,
    videoTopicSample: realSupplements.videoTopicSample
      ? {
          available: realSupplements.videoTopicSample.available,
          institution: realSupplements.videoTopicSample.institution,
          collectionTitle: realSupplements.videoTopicSample.collectionTitle,
          summary: realSupplements.videoTopicSample.summary,
          sampleTitles: realSupplements.videoTopicSample.sampleTitles,
        }
      : undefined,
    shenzhenLibrarySample: realSupplements.shenzhenLibrarySample
      ? {
          available: realSupplements.shenzhenLibrarySample.available,
          institution: realSupplements.shenzhenLibrarySample.institution,
          collectionTitle: realSupplements.shenzhenLibrarySample.collectionTitle,
          summary: realSupplements.shenzhenLibrarySample.summary,
          sampleTitles: realSupplements.shenzhenLibrarySample.sampleTitles,
        }
      : undefined,
    taofenMuseumSample: realSupplements.taofenMuseumSample
      ? {
          available: realSupplements.taofenMuseumSample.available,
          institution: realSupplements.taofenMuseumSample.institution,
          collectionTitle: realSupplements.taofenMuseumSample.collectionTitle,
          summary: realSupplements.taofenMuseumSample.summary,
          sampleTitles: realSupplements.taofenMuseumSample.sampleTitles,
        }
      : undefined,
    soongLiteratureSample: realSupplements.soongLiteratureSample
      ? {
          available: realSupplements.soongLiteratureSample.available,
          institution: realSupplements.soongLiteratureSample.institution,
          collectionTitle: realSupplements.soongLiteratureSample.collectionTitle,
          summary: realSupplements.soongLiteratureSample.summary,
          sampleTitles: realSupplements.soongLiteratureSample.sampleTitles,
        }
      : undefined,
    souyunKnowledgeGraphSample: realSupplements.souyunKnowledgeGraphSample
      ? {
          available: realSupplements.souyunKnowledgeGraphSample.available,
          institution: realSupplements.souyunKnowledgeGraphSample.institution,
          collectionTitle: realSupplements.souyunKnowledgeGraphSample.collectionTitle,
          summary: realSupplements.souyunKnowledgeGraphSample.summary,
          sampleTitles: realSupplements.souyunKnowledgeGraphSample.sampleTitles,
        }
      : undefined,
    periodicalIndexSample: realSupplements.periodicalIndexSample
      ? {
          available: realSupplements.periodicalIndexSample.available,
          institution: realSupplements.periodicalIndexSample.institution,
          collectionTitle: realSupplements.periodicalIndexSample.collectionTitle,
          summary: realSupplements.periodicalIndexSample.summary,
          sampleTitles: realSupplements.periodicalIndexSample.sampleTitles,
        }
      : undefined,
    artlibSample: realSupplements.artlibSample
      ? {
          available: realSupplements.artlibSample.available,
          institution: realSupplements.artlibSample.institution,
          collectionTitle: realSupplements.artlibSample.collectionTitle,
          summary: realSupplements.artlibSample.summary,
          sampleTitles: realSupplements.artlibSample.sampleTitles,
        }
      : undefined,
  };
}
