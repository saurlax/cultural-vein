import type { BookDetail } from "@/types/domain";

export interface SourceEvidenceItem {
  id: string;
  source: string;
  category: string;
  countLabel: string;
  summary: string;
  samples: string[];
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
      samples: [
        `纪传命中 ${signals.cbdbMatchedPeople ?? 0} 人`,
        `整理人物 ${signals.cbdbFallbackPeople ?? 0} 人`,
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
      samples: signals.venueSamples.slice(0, 3).map((item) => `${item.name} · 记录 ${item.sampleCount}`),
    });
  }

  if (signals.eventSamples?.length) {
    items.push({
      id: "event-samples",
      source: "上海图书馆开放数据",
      category: "活动事件",
      countLabel: `${signals.eventSamples.length} 条事件`,
      summary: "把活动名称、场馆与时间信号整理成可回查的传播事件样本。",
      samples: signals.eventSamples
        .slice(0, 3)
        .map((item) => `${item.title} · ${item.venue} · ${item.startTime}`),
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
      samples: signals.institutionSamples
        .slice(0, 4)
        .map((item) => `${item.title} · ${item.institution}${item.year ? ` · ${item.year}` : ""}`),
    });
  }

  return items;
}
