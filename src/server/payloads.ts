import realSupplements from "@/data/generated/real-supplements.json";
import { riverDataset } from "@/data/river-dataset";
import { searchConcepts } from "@/lib/concept-search";
import { buildSourceEvidence } from "@/lib/source-evidence";
import type { DatasetInsight } from "@/types/domain";

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

export function getInsightsPayload(): DatasetInsight {
  const sourceAtlas = [
    realSupplements.cbdbSummary?.available
      ? {
          id: "cbdb",
          name: "CBDB",
          summary: "纪传人物与朝代分布",
          stat: `${realSupplements.cbdbSummary.personCount?.toLocaleString() ?? "--"} 位人物`,
          magnitude: realSupplements.cbdbSummary.personCount ?? 0,
          evidenceLabel: "CBDB 纪传统计",
          evidenceNote: "依据朝代分布与人物总量字段，当前用于人物关系与时间线补证。",
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
          summary: "场馆活动与预约样本",
          stat: `${realSupplements.shanghaiLibraryActivity.topVenues?.length ?? 0} 组场馆`,
          magnitude:
            realSupplements.shanghaiLibraryActivity.sampleRecords?.length ??
            realSupplements.shanghaiLibraryActivity.topVenues?.length ??
            0,
          evidenceLabel: realSupplements.shanghaiLibraryActivity.sheetName ?? "活动预约字段",
          evidenceNote: "原始字段包含活动名称、场馆名称、预约状态与预约开始时间。",
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
          evidenceNote: "原始样本保留题名、分类、年代与图像出处说明。",
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
    realSupplements.shenzhenLibrarySample?.available
      ? {
          id: "shenzhen-library",
          name: "深圳图书馆",
          summary: realSupplements.shenzhenLibrarySample.summary,
          stat: `${realSupplements.shenzhenLibrarySample.sampleTitles?.length ?? 0} 组接口`,
          magnitude:
            realSupplements.shenzhenLibrarySample.sampleRecords?.length ??
            realSupplements.shenzhenLibrarySample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.shenzhenLibrarySample.collectionTitle ?? "接口资料",
          evidenceNote: "当前保留专题库接口名称、类别、年代与来源文本。",
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
          evidenceLabel: realSupplements.taofenMuseumSample.collectionTitle ?? "馆方接口条目",
          evidenceNote: "原始资料包含机构年表、人物年表与图书列表等接口方向。",
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
          stat: `${realSupplements.souyunKnowledgeGraphSample.sampleTitles?.length ?? 0} 组接口`,
          magnitude:
            realSupplements.souyunKnowledgeGraphSample.sampleRecords?.length ??
            realSupplements.souyunKnowledgeGraphSample.sampleTitles?.length ??
            0,
          evidenceLabel: realSupplements.souyunKnowledgeGraphSample.collectionTitle ?? "OpenAPI / 古籍库",
          evidenceNote: "原始资料保留开放接口、诗文库与古籍库的字段说明。",
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
      ],
      expansionNote:
        "首页长卷已将主线典籍、真实来源与样本码头汇成一河，能够直接顺流检索、入卷、回查来源。",
      coverageLayers: [
        {
          id: "core-classics",
          label: "古籍循证",
          status: "已接入",
          scope: "主线典籍域",
          usage: "主河道节点、引用关系与文本溯源基础",
        },
        {
          id: "cbdb-people",
          label: "人名规范 / CBDB",
          status: "已接入",
          scope: "人物命中与纪传地点",
          usage: "人物关系、活动地点、时间线补证",
        },
        {
          id: "bibliography",
          label: "书目版本",
          status: "已接入",
          scope: "版本链与馆藏样本",
          usage: "版本流变树、馆藏落点与资源回查",
        },
        {
          id: "geo-events",
          label: "地名事件",
          status: "已接入",
          scope: "场馆、活动、专题片与事件样本",
          usage: "地理传播、时间回声与真实场景挂接",
        },
        {
          id: "special-archives",
          label: "专题文献",
          status: "已接入",
          scope: "南湖、宋庆龄、韬奋等专题资料",
          usage: "近现代支流、机构样本与来源证据总表",
        },
        {
          id: "poetry-graph",
          label: "诗词图谱",
          status: "已接入",
          scope: "搜韵接口与古典诗学外推",
          usage: "诗学支流、文本比对与古籍关联外推",
        },
        {
          id: "genealogy",
          label: "家谱文献",
          status: "示范接入",
          scope: "家礼、家学与家族传播落点",
          usage: "已在《孝经》等河段预留家族传播叙事接口，可继续挂接家谱样本。",
        },
        {
          id: "red-archives",
          label: "红色文献",
          status: "示范接入",
          scope: "近现代专题文献支流",
          usage: "已由南湖等专题资料托住近现代支流，后续可继续扩到红色文献全域。",
        },
        {
          id: "full-atlas",
          label: "全域扩展",
          status: "待扩展",
          scope: "130 万种古籍与更大关系网",
          usage: "当前以前景示范域为主，后续可沿统一装配链增量扩入更大规模书目与关系。",
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
  };
}
