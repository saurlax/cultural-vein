import realSupplements from "@/data/generated/real-supplements.json";
import type {
  BookDetail,
  BookNode,
  CitationEdge,
  PersonNode,
  RiverDataset,
} from "@/types/domain";

interface RealSupplementPerson {
  id?: string;
  name: string;
  role: string;
  birthYear?: number | null;
  deathYear?: number | null;
  era?: string;
  bio?: string;
  foundInCbdb?: boolean;
  matchedAlias?: string;
  aliasesTried?: string[];
  activityPlaces?: Array<{
    name: string;
    firstYear?: number | null;
    lastYear?: number | null;
    note?: string;
  }>;
}

interface RealSupplementBook {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  dynasty: BookNode["dynasty"];
  year: number;
  category: BookNode["category"];
  school: string;
  influence: number;
  velocity: number;
  branchLevel: number;
  summary: string;
  concepts: string[];
  coordinates: [number, number, number];
}

interface RealSupplementCitation {
  id: string;
  source: string;
  target: string;
  layer: CitationEdge["layer"];
  confidence: number;
  label: string;
  evidence: string;
}

interface RealSupplementActivity {
  available?: boolean;
  topVenues?: Array<{
    name: string;
    sampleCount: number;
  }>;
  sampleRecords?: Array<{
    场馆名称?: string;
    活动名称?: string;
    预约状态?: string;
    预约开始时间?: string;
  }>;
}

interface RealSupplementInstitutionSample {
  available?: boolean;
  institution?: string;
  recordCount?: number;
  sampleTitles?: string[];
  sampleRecords?: Array<{
    institution: string;
    title: string;
    category?: string;
    year?: string;
    imageRef?: string;
    sourceText?: string;
  }>;
}

interface RealSupplementArchiveSample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  summary?: string;
  sampleRecords?: Array<{
    institution: string;
    title: string;
    category?: string;
    year?: string;
    imageRef?: string;
    sourceText?: string;
  }>;
}

interface RealSupplementNanhuSample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  documentCount?: number;
  imageCount?: number;
  summary?: string;
  sampleRecords?: Array<{
    institution: string;
    title: string;
    category?: string;
    year?: string;
    imageRef?: string;
    sourceText?: string;
  }>;
}

interface RealSupplementCbdbSummary {
  available?: boolean;
  personCount?: number;
  topDynasties?: Array<{
    name: string;
    count: number;
  }>;
}

const books = (realSupplements.demoBooks ?? []) as RealSupplementBook[];
const citations = (realSupplements.demoCitations ?? []) as RealSupplementCitation[];
const generatedDetails = (realSupplements.demoBookDetails ?? {}) as Record<string, BookDetail>;

const cloneDetail = (detail: BookDetail): BookDetail => ({
  ...detail,
  heroMetric: { ...detail.heroMetric },
  spread: detail.spread.map((item) => ({ ...item })),
  people: detail.people.map((person) => ({ ...person })),
  places: detail.places.map((place) => ({ ...place })),
  versions: detail.versions.map((version) => ({ ...version })),
  timeline: detail.timeline.map((event) => ({ ...event })),
  passages: detail.passages.map((passage) => ({
    ...passage,
    links: passage.links.map((link) => ({ ...link })),
    tracePath: passage.tracePath?.map((item) => ({ ...item })),
    downstreamInfluence: passage.downstreamInfluence?.map((item) => ({ ...item })),
  })),
  realWorldSignals: detail.realWorldSignals
    ? {
        ...detail.realWorldSignals,
        venueSamples: detail.realWorldSignals.venueSamples?.map((item) => ({ ...item })),
        eventSamples: detail.realWorldSignals.eventSamples?.map((item) => ({ ...item })),
      }
    : undefined,
});

const details: Record<string, BookDetail> = Object.fromEntries(
  Object.entries(generatedDetails).map(([slug, detail]) => [slug, cloneDetail(detail)]),
);

const placeholderDetail = (book: BookNode): BookDetail => ({
  bookId: book.id,
  heroMetric: {
    directCitations: Math.round(book.influence * 0.8),
    downstreamInfluence: Math.round(book.influence * 2.4),
    coveredRegions: Math.max(2, book.branchLevel + 3),
  },
  spread: [],
  people: [],
  places: [],
  versions: [],
  timeline: [
    {
      id: `${book.id}-timeline-1`,
      year: book.year,
      title: `${book.title}成书`,
      detail: book.summary,
    },
  ],
  passages: [],
});

for (const book of books) {
  if (!details[book.slug]) {
    details[book.slug] = placeholderDetail(book);
  }
}

const cbdbPeople = (realSupplements.cbdbPeople ?? []) as RealSupplementPerson[];
const cbdbSummary = (realSupplements.cbdbSummary ?? {}) as RealSupplementCbdbSummary;
const shanghaiLibraryActivity = (realSupplements.shanghaiLibraryActivity ??
  {}) as RealSupplementActivity;
const nanjingLibrarySample = (realSupplements.nanjingLibrarySample ??
  {}) as RealSupplementInstitutionSample;
const fudanArchiveSample = (realSupplements.fudanArchiveSample ??
  {}) as RealSupplementArchiveSample;
const nanhuArchiveSample = (realSupplements.nanhuArchiveSample ??
  {}) as RealSupplementNanhuSample;

const personByName = new Map(cbdbPeople.map((person) => [person.name, person]));

function mergePeople(names: string[], fallback: PersonNode[]): PersonNode[] {
  const resolved: PersonNode[] = names
    .map((name) => {
      const person = personByName.get(name);
      if (!person || !person.name) {
        return null;
      }

      return {
        id: person.id ?? `fallback-${person.name}`,
        name,
        role: person.role,
        birthYear: person.birthYear ?? null,
        deathYear: person.deathYear ?? null,
        era: person.era ?? "未详",
        bio: person.bio ?? "",
        source: person.foundInCbdb ? "cbdb" : "demo",
        sourceStatus: person.foundInCbdb ? "matched" : "fallback",
        matchedAlias: person.matchedAlias,
        activityPlaces: person.activityPlaces?.map((place) => ({ ...place })),
        relationTier: 1,
        relationType:
          person.role === "作者"
            ? "著"
            : person.role === "注者"
              ? "注"
              : person.role === "评论者"
                ? "评"
                : "引",
      } satisfies PersonNode;
    })
    .filter((person): person is NonNullable<typeof person> => Boolean(person));

  return resolved.length > 0 ? resolved : fallback;
}

const peopleMergePlan: Partial<Record<string, string[]>> = {
  shijing: ["孔颖达", "朱熹", "王国维"],
  "sishu-zhangju": ["朱熹"],
  shiji: ["司马迁"],
  "zi-zhi-tong-jian": ["司马光", "刘恕"],
  "ri-zhi-lu": ["顾炎武"],
  "ren-jian-ci-hua": ["王国维"],
};

for (const [slug, names] of Object.entries(peopleMergePlan)) {
  const detail = details[slug];
  if (!detail) {
    continue;
  }
  detail.people = mergePeople(names ?? [], detail.people);
}

if (shanghaiLibraryActivity.available) {
  const venueSamples = shanghaiLibraryActivity.topVenues ?? [];
  const eventSamples = (shanghaiLibraryActivity.sampleRecords ?? []).map((record) => ({
    venue: record["场馆名称"] ?? "未知场馆",
    title: record["活动名称"] ?? "未知活动",
    status: record["预约状态"] ?? "未知状态",
    startTime: record["预约开始时间"] ?? "",
  }));

  for (const slug of ["shijing", "sishu-zhangju"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      sourceLabel: "CBDB 人物 + 上海图书馆活动样本",
      venueSummary:
        venueSamples.length > 0
          ? `上图活动样本当前集中在 ${venueSamples[0].name}，可作为“文化传播现场”辅助信号。`
          : "已接入上海图书馆活动样本。",
      venueSamples,
      eventSamples: eventSamples.slice(0, 3),
    };
  }
}

if (nanjingLibrarySample.available) {
  const institutionSamples = (nanjingLibrarySample.sampleRecords ?? []).slice(0, 4);
  for (const slug of ["ren-jian-ci-hua", "ri-zhi-lu"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: detail.realWorldSignals?.sourceLabel
        ? `${detail.realWorldSignals.sourceLabel} + 南京图书馆图像样本`
        : "CBDB + 南京图书馆图像样本",
      institutionSamples,
    };
  }
}

if (fudanArchiveSample.available) {
  const institutionSamples = (fudanArchiveSample.sampleRecords ?? []).slice(0, 2);
  const detail = details["ren-jian-ci-hua"];
  detail.realWorldSignals = {
    ...detail.realWorldSignals,
    sourceLabel: detail.realWorldSignals?.sourceLabel
      ? `${detail.realWorldSignals.sourceLabel} + 复旦馆藏样例`
      : "复旦大学图书馆馆藏样例",
    institutionSamples: [
      ...(detail.realWorldSignals?.institutionSamples ?? []),
      ...institutionSamples,
    ],
    venueSummary:
      detail.realWorldSignals?.venueSummary ??
      fudanArchiveSample.summary ??
      "已接入复旦大学图书馆馆藏样例。",
  };
}

if (nanhuArchiveSample.available) {
  const institutionSamples = (nanhuArchiveSample.sampleRecords ?? []).slice(0, 3);
  const detail = details["zi-zhi-tong-jian"];
  detail.realWorldSignals = {
    ...detail.realWorldSignals,
    sourceLabel: detail.realWorldSignals?.sourceLabel
      ? `${detail.realWorldSignals.sourceLabel} + 南湖专题文献样本`
      : "南湖专题文献样本",
    institutionSamples: [
      ...(detail.realWorldSignals?.institutionSamples ?? []),
      ...institutionSamples,
    ],
    venueSummary:
      detail.realWorldSignals?.venueSummary ??
      nanhuArchiveSample.summary ??
      "已接入南湖文献数据库专题样本。",
  };
}

if (cbdbSummary.available) {
  const topDynastyLine = (cbdbSummary.topDynasties ?? [])
    .slice(0, 3)
    .map((item) => `${item.name} ${item.count.toLocaleString()}`)
    .join(" / ");

  for (const slug of ["shijing", "sishu-zhangju", "shiji", "zi-zhi-tong-jian"] as const) {
    const detail = details[slug];
    const matchedCount = detail.people.filter((person) => person.source === "cbdb").length;
    const fallbackCount = detail.people.filter((person) => person.source !== "cbdb").length;
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: detail.realWorldSignals?.sourceLabel ?? "CBDB + 上图数据",
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        `CBDB 当前可用人物 ${cbdbSummary.personCount?.toLocaleString() ?? "未知"} 条；高频朝代样本为 ${topDynastyLine}。`,
      cbdbMatchedPeople: matchedCount,
      cbdbFallbackPeople: fallbackCount,
    };
  }
}

const booksBySlug = Object.fromEntries(
  books.map((book) => [book.slug, details[book.slug] ?? placeholderDetail(book)]),
);

export const riverDataset: RiverDataset = {
  books,
  citations,
  booksBySlug,
};
