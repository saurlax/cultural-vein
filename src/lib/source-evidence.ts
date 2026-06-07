import type { BookDetail } from "@/types/domain";

export interface SourceEvidenceItem {
  id: string;
  source: string;
  category: string;
  countLabel: string;
  summary: string;
  traceNote: string;
  samples: Array<{
    label: string;
    detail?: string;
  }>;
}

export function buildSourceEvidence(detail: BookDetail): SourceEvidenceItem[] {
  const signals = detail.realWorldSignals;

  if (!signals) {
    return [];
  }

  const items: SourceEvidenceItem[] = [];

  if (
    (signals.cbdbMatchedPeople ?? 0) > 0 ||
    (signals.cbdbFallbackPeople ?? 0) > 0
  ) {
    items.push({
      id: "cbdb-people",
      source: "CBDB",
      category: "人物纪传",
      countLabel: `命中 ${signals.cbdbMatchedPeople ?? 0} 人 / 整理 ${signals.cbdbFallbackPeople ?? 0} 人`,
      summary: "用于支撑人物身份、活动地点和人物传播线索的真实纪传来源。",
      traceNote: "可回查到人物纪传命中数量与整理人数两类线索。",
      samples: [
        {
          label: `纪传命中 ${signals.cbdbMatchedPeople ?? 0} 人`,
          detail: "对应已匹配到 CBDB 的人物节点。",
        },
        {
          label: `整理人物 ${signals.cbdbFallbackPeople ?? 0} 人`,
          detail: "对应当前仍以人工整理方式保留的人物节点。",
        },
      ],
    });
  }

  if (signals.venueSamples?.length) {
    items.push({
      id: "venue-samples",
      source: "上海图书馆开放数据",
      category: "场馆传播",
      countLabel: `${signals.venueSamples.length} 组场馆`,
      summary: "以活动场馆分布补强典籍在近现代公共文化空间中的传播现场。",
      traceNote: "样本可回查到场馆名称与对应活动记录数。",
      samples: signals.venueSamples.slice(0, 3).map((item) => ({
        label: item.name,
        detail: `活动记录 ${item.sampleCount}`,
      })),
    });
  }

  if (signals.eventSamples?.length) {
    items.push({
      id: "event-samples",
      source: "上海图书馆开放数据",
      category: "活动事件",
      countLabel: `${signals.eventSamples.length} 条事件`,
      summary: "把活动名称、场馆与时间信号整理成可回查的传播事件样本。",
      traceNote: "样本包含活动标题、场馆与时间，可直接用于现场说明传播落点。",
      samples: signals.eventSamples
        .slice(0, 3)
        .map((item) => ({
          label: item.title,
          detail: `${item.venue} · ${item.startTime}`,
      })),
    });
  }

  if (signals.borrowLibraries?.length || signals.borrowSamples?.length) {
    items.push({
      id: "borrow-samples",
      source: "上海图书馆开放数据",
      category: "公共流通",
      countLabel: `${signals.borrowLibraries?.length ?? 0} 组流通馆 / ${signals.borrowSamples?.length ?? 0} 条借阅`,
      summary: "把分馆借阅、流通操作与现实书目样本压成公共阅读传播证据，说明经典议题如何落到今天的城市借阅网络。",
      traceNote: "样本可回查到流通馆、借阅操作、题名、作者与出版年等字段。",
      samples: [
        ...(signals.borrowLibraries ?? []).slice(0, 2).map((item) => ({
          label: item.name,
          detail: `流通记录 ${item.sampleCount}`,
        })),
        ...(signals.borrowSamples ?? []).slice(0, 2).map((item) => ({
          label: item.title,
          detail: [item.library, item.action, item.author, item.publishYear]
            .filter(Boolean)
            .join(" · "),
        })),
      ].slice(0, 4),
    });
  }

  if (signals.institutionSamples?.length) {
    const institutionGroups = Array.from(
      new Set(signals.institutionSamples.map((item) => item.institution)),
    );

    items.push({
      id: "institution-samples",
      source: institutionGroups.join(" / "),
      category: "机构资源",
      countLabel: `${signals.institutionSamples.length} 条机构记录`,
      summary: "将图像、馆藏、专题接口与资源出处归并成可核验的机构级证据。",
      traceNote: "样本会同时保留机构名、年份与图像出处/字段说明中的至少一项。",
      samples: signals.institutionSamples
        .slice(0, 4)
        .map((item) => ({
          label: item.title,
          detail: [
            item.institution,
            item.year,
            item.imageRef || item.sourceText,
          ]
            .filter(Boolean)
            .join(" · "),
        })),
    });
  }

  return items;
}
