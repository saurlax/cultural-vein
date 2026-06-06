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

details.shijing.people = mergePeople(["孔颖达", "朱熹", "王国维"], [
  {
    id: "person-kongyingda",
    name: "孔颖达",
    role: "注者",
    birthYear: 574,
    deathYear: 648,
    era: "唐",
    bio: "奉诏撰《毛诗正义》，奠定经学义疏传统。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 1,
    relationType: "注",
  },
  {
    id: "person-zhuxi",
    name: "朱熹",
    role: "引用者",
    birthYear: 1130,
    deathYear: 1200,
    era: "宋",
    bio: "以理学视角重新解释诗教，强化修身与教化内核。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 2,
    relationType: "引",
  },
  {
    id: "person-wangguowei",
    name: "王国维",
    role: "影响者",
    birthYear: 1877,
    deathYear: 1927,
    era: "清末民初",
    bio: "近代诗学家，以境界论回接《诗经》传统。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 2,
    relationType: "评",
  },
]);

details["sishu-zhangju"].people = mergePeople(["朱熹"], [
  {
    id: "person-zhuxi-main",
    name: "朱熹",
    role: "作者",
    birthYear: 1130,
    deathYear: 1200,
    era: "南宋",
    bio: "以四书为核心重新组织儒学经典秩序。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 1,
    relationType: "著",
  },
  {
    id: "person-huxian",
    name: "胡炫",
    role: "校者",
    birthYear: 1230,
    deathYear: 1295,
    era: "元",
    bio: "参与元代学宫刻本的校勘整理。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 2,
    relationType: "校",
  },
]);

details.shiji.people = [
  {
    id: "person-simaqian",
    name: "司马迁",
    role: "作者",
    birthYear: -145,
    deathYear: -86,
    era: "西汉",
    bio: "纪传体史学奠基者，以人物书写重构历史叙述。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 1,
    relationType: "著",
  },
];

details["zi-zhi-tong-jian"].people = [
  {
    id: "person-simaguang",
    name: "司马光",
    role: "作者",
    birthYear: 1019,
    deathYear: 1086,
    era: "宋",
    bio: "主持编纂《资治通鉴》，以编年体方式重塑治道叙事。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 1,
    relationType: "著",
  },
  {
    id: "person-liushu",
    name: "刘恕",
    role: "编纂者",
    birthYear: 1032,
    deathYear: 1078,
    era: "宋",
    bio: "通鉴局重要助手，负责资料搜辑与校勘。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 2,
    relationType: "校",
  },
];

details["ri-zhi-lu"].people = [
  {
    id: "person-guyanwu",
    name: "顾炎武",
    role: "作者",
    birthYear: 1613,
    deathYear: 1682,
    era: "明清",
    bio: "以考据与经世之学贯通经史，开启清代朴学风气。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 1,
    relationType: "著",
  },
];

details["ren-jian-ci-hua"].people = [
  {
    id: "person-wangguowei-main",
    name: "王国维",
    role: "作者",
    birthYear: 1877,
    deathYear: 1927,
    era: "清末民初",
    bio: "以境界论重释古典诗学，连接近代审美与经史传统。",
    source: "demo",
    sourceStatus: "fallback",
    relationTier: 1,
    relationType: "著",
  },
];

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
