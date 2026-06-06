import { NextResponse } from "next/server";

import realSupplements from "@/data/generated/real-supplements.json";
import type { DatasetInsight } from "@/types/domain";

export function GET() {
  const sourceAtlas = [
    realSupplements.cbdbSummary?.available
      ? {
          id: "cbdb",
          name: "CBDB",
          summary: "纪传人物与朝代分布",
          stat: `${realSupplements.cbdbSummary.personCount?.toLocaleString() ?? "--"} 位人物`,
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
    realSupplements.nanjingLibrarySample?.available
      ? {
          id: "nanjing-library",
          name: "南京图书馆",
          summary: realSupplements.nanjingLibrarySample.institution,
          stat: `${realSupplements.nanjingLibrarySample.recordCount?.toLocaleString() ?? "--"} 条图像`,
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

  const payload: DatasetInsight = {
    sourceAtlas,
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

  return NextResponse.json(payload);
}
