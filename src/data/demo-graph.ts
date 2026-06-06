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

const books: BookNode[] = [
  {
    id: "book-shijing",
    slug: "shijing",
    title: "诗经",
    shortTitle: "诗经",
    dynasty: "先秦",
    year: -700,
    category: "经",
    school: "儒家经典",
    influence: 98,
    velocity: 0.28,
    branchLevel: 0,
    summary: "中国最早的诗歌总集，是后世经学、诗学与礼乐思想的重要源头。",
    concepts: ["诗", "礼", "兴观群怨", "教化"],
    coordinates: [-10, 0.8, 0],
  },
  {
    id: "book-liji",
    slug: "liji",
    title: "礼记",
    shortTitle: "礼记",
    dynasty: "两汉",
    year: 80,
    category: "经",
    school: "儒家经典",
    influence: 84,
    velocity: 0.36,
    branchLevel: 0,
    summary: "系统呈现礼制与思想传统，是宋代理学重新诠释经典的重要入口。",
    concepts: ["礼", "大学", "中庸", "教化"],
    coordinates: [-5, 0.4, 0.6],
  },
  {
    id: "book-shiji",
    slug: "shiji",
    title: "史记",
    shortTitle: "史记",
    dynasty: "两汉",
    year: -91,
    category: "史",
    school: "纪传史学",
    influence: 88,
    velocity: 0.22,
    branchLevel: 1,
    summary: "纪传体通史奠基之作，影响史学叙述与人物书写传统。",
    concepts: ["史", "人物", "叙事", "纪传"],
    coordinates: [-4, -0.6, -0.8],
  },
  {
    id: "book-lunyu-jizhu",
    slug: "lunyu-jizhu",
    title: "论语集注",
    shortTitle: "论语集注",
    dynasty: "宋元",
    year: 1170,
    category: "经",
    school: "理学",
    influence: 93,
    velocity: 0.52,
    branchLevel: 1,
    summary: "朱熹重构四书诠释秩序的核心典籍，代表宋代理学分流的主河段。",
    concepts: ["仁", "礼", "理学", "四书"],
    coordinates: [2, 0.2, 0.9],
  },
  {
    id: "book-sishu-zhangju",
    slug: "sishu-zhangju",
    title: "四书章句集注",
    shortTitle: "四书章句",
    dynasty: "宋元",
    year: 1189,
    category: "经",
    school: "理学",
    influence: 96,
    velocity: 0.58,
    branchLevel: 0,
    summary: "整合《大学》《中庸》《论语》《孟子》的经典解释框架，形成千年主流教材。",
    concepts: ["仁", "礼", "大学", "中庸", "修身"],
    coordinates: [4, 0.6, 0.1],
  },
  {
    id: "book-zi-zhi-tong-jian",
    slug: "zi-zhi-tong-jian",
    title: "资治通鉴",
    shortTitle: "资治通鉴",
    dynasty: "宋元",
    year: 1084,
    category: "史",
    school: "编年史学",
    influence: 85,
    velocity: 0.34,
    branchLevel: 1,
    summary: "编年通史典范，连接政治史叙述与注释、续编传统。",
    concepts: ["史", "治道", "鉴戒", "编年"],
    coordinates: [1, -0.4, -0.7],
  },
  {
    id: "book-ri-zhi-lu",
    slug: "ri-zhi-lu",
    title: "日知录",
    shortTitle: "日知录",
    dynasty: "明清",
    year: 1670,
    category: "子",
    school: "考据学",
    influence: 72,
    velocity: 0.42,
    branchLevel: 2,
    summary: "顾炎武以经史考据回应时代问题，承接宋学又开清代朴学支流。",
    concepts: ["经世", "考据", "治学", "礼"],
    coordinates: [7, -0.15, 0.7],
  },
  {
    id: "book-ren-jian-ci-hua",
    slug: "ren-jian-ci-hua",
    title: "人间词话",
    shortTitle: "人间词话",
    dynasty: "近现代",
    year: 1908,
    category: "集",
    school: "近代诗学",
    influence: 64,
    velocity: 0.49,
    branchLevel: 2,
    summary: "以近代视角重释古典诗学，把经典意象与现代审美重新接续。",
    concepts: ["境界", "诗学", "词", "审美"],
    coordinates: [10, 0.1, -0.3],
  },
];

const citations: CitationEdge[] = [
  {
    id: "edge-1",
    source: "book-liji",
    target: "book-shijing",
    layer: "metadata",
    confidence: 1,
    label: "经学承续",
    evidence: "《礼记》多篇引《诗》以明礼乐教化。",
  },
  {
    id: "edge-2",
    source: "book-lunyu-jizhu",
    target: "book-liji",
    layer: "explicit",
    confidence: 0.92,
    label: "显式引礼",
    evidence: "引《大学》《中庸》并以礼学框架重释论语义理。",
  },
  {
    id: "edge-3",
    source: "book-sishu-zhangju",
    target: "book-lunyu-jizhu",
    layer: "metadata",
    confidence: 1,
    label: "注疏汇流",
    evidence: "四书系统化整合《论语集注》核心解释。",
  },
  {
    id: "edge-4",
    source: "book-sishu-zhangju",
    target: "book-shijing",
    layer: "semantic",
    confidence: 0.74,
    label: "诗教化用",
    evidence: "关于教化与修身的表述与《诗经》训诂传统相互呼应。",
  },
  {
    id: "edge-5",
    source: "book-zi-zhi-tong-jian",
    target: "book-shiji",
    layer: "metadata",
    confidence: 1,
    label: "史法承继",
    evidence: "纪传与叙事判断延续《史记》史学传统。",
  },
  {
    id: "edge-6",
    source: "book-ri-zhi-lu",
    target: "book-sishu-zhangju",
    layer: "semantic",
    confidence: 0.68,
    label: "经世反思",
    evidence: "以考据之学回应理学训释，形成批评性继承。",
  },
  {
    id: "edge-7",
    source: "book-ren-jian-ci-hua",
    target: "book-shijing",
    layer: "influence",
    confidence: 0.56,
    label: "诗学影响",
    evidence: "境界说吸收诗教与比兴传统。",
  },
];

const details: Record<string, BookDetail> = {
  shijing: {
    bookId: "book-shijing",
    heroMetric: {
      directCitations: 124,
      downstreamInfluence: 410,
      coveredRegions: 6,
    },
    spread: [
      {
        id: "spread-1",
        fromPlaceId: "place-changan",
        toPlaceId: "place-luoyang",
        startYear: -100,
        endYear: 80,
        volume: 86,
      },
      {
        id: "spread-2",
        fromPlaceId: "place-luoyang",
        toPlaceId: "place-kaifeng",
        startYear: 960,
        endYear: 1127,
        volume: 91,
      },
      {
        id: "spread-3",
        fromPlaceId: "place-kaifeng",
        toPlaceId: "place-linan",
        startYear: 1127,
        endYear: 1279,
        volume: 88,
      },
    ],
    people: [],
    places: [
      { id: "place-changan", name: "长安", lat: 34.3416, lng: 108.9398, note: "汉唐经学传播中心" },
      { id: "place-luoyang", name: "洛阳", lat: 34.6197, lng: 112.454, note: "东汉学术与典籍汇聚地" },
      { id: "place-kaifeng", name: "开封", lat: 34.7972, lng: 114.3076, note: "北宋刻书与学校传播节点" },
      { id: "place-linan", name: "临安", lat: 30.2741, lng: 120.1551, note: "南宋书院系统中的重要传播终点" },
    ],
    versions: [
      { id: "version-sj-1", label: "毛诗故训传祖本", year: -150, place: "长安", library: "传抄系统", status: "佚失" },
      { id: "version-sj-2", label: "唐《毛诗正义》刻本", year: 653, place: "长安", library: "国子监", status: "存世", parentId: "version-sj-1" },
      { id: "version-sj-3", label: "南宋监本", year: 1175, place: "临安", library: "两浙路书局", status: "存世", parentId: "version-sj-2" },
    ],
    timeline: [
      { id: "tl-sj-1", year: -700, title: "诗篇成编", detail: "西周至春秋诗歌逐步汇聚为经典文本。" },
      { id: "tl-sj-2", year: 653, title: "《毛诗正义》刊行", detail: "唐代官方经学注疏系统成形。" },
      { id: "tl-sj-3", year: 1175, title: "南宋监本传播", detail: "书院教学推动《诗经》南迁传播。" },
    ],
    passages: [
      {
        id: "passage-sj-1",
        section: "关雎",
        original: "关关雎鸠，在河之洲。窈窕淑女，君子好逑。",
        links: [
          {
            id: "passage-sj-1-link-1",
            quote: "兴于《诗》，立于礼",
            sourceBookId: "book-liji",
            sourceTitle: "礼记",
            layer: "explicit",
            confidenceLabel: "高",
            evidence: "后世礼学引用《诗》阐释教化次序。",
          },
        ],
      },
      {
        id: "passage-sj-2",
        section: "大雅",
        original: "周虽旧邦，其命维新。",
        links: [
          {
            id: "passage-sj-2-link-1",
            quote: "革故鼎新与修身进德",
            sourceBookId: "book-sishu-zhangju",
            sourceTitle: "四书章句集注",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "理学语境中对“维新”精神作义理化继承。",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "CBDB 人物 + 上图活动样本",
    },
  },
  "sishu-zhangju": {
    bookId: "book-sishu-zhangju",
    heroMetric: {
      directCitations: 97,
      downstreamInfluence: 288,
      coveredRegions: 9,
    },
    spread: [
      {
        id: "spread-ss-1",
        fromPlaceId: "place-wuyuan",
        toPlaceId: "place-kaifeng",
        startYear: 1190,
        endYear: 1250,
        volume: 80,
      },
      {
        id: "spread-ss-2",
        fromPlaceId: "place-kaifeng",
        toPlaceId: "place-beijing",
        startYear: 1315,
        endYear: 1644,
        volume: 96,
      },
    ],
    people: [],
    places: [
      { id: "place-wuyuan", name: "婺源", lat: 29.247, lng: 117.8622, note: "朱熹学脉活动地" },
      { id: "place-kaifeng", name: "开封", lat: 34.7972, lng: 114.3076, note: "北方学宫转译节点" },
      { id: "place-beijing", name: "北京", lat: 39.9042, lng: 116.4074, note: "明清科举教材集散地" },
    ],
    versions: [
      { id: "version-ss-1", label: "淳熙刊本", year: 1189, place: "建阳", library: "书坊", status: "佚失" },
      { id: "version-ss-2", label: "元学宫本", year: 1315, place: "大都", library: "国子学", status: "存世", parentId: "version-ss-1" },
      { id: "version-ss-3", label: "明内府本", year: 1468, place: "北京", library: "内府", status: "存世", parentId: "version-ss-2" },
    ],
    timeline: [
      { id: "tl-ss-1", year: 1189, title: "四书体系定型", detail: "《四书章句集注》成书并广泛流传。" },
      { id: "tl-ss-2", year: 1315, title: "进入科举体系", detail: "元代以四书义理为官方考试核心。" },
      { id: "tl-ss-3", year: 1468, title: "内府重刊", detail: "明代形成覆盖全国的标准教材版本。" },
    ],
    passages: [
      {
        id: "passage-ss-1",
        section: "大学章句",
        original: "大学之道，在明明德，在亲民，在止于至善。",
        links: [
          {
            id: "passage-ss-1-link-1",
            quote: "《礼记》大学篇",
            sourceBookId: "book-liji",
            sourceTitle: "礼记",
            layer: "explicit",
            confidenceLabel: "高",
            evidence: "直接承接《礼记》篇目并加章句诠释。",
          },
        ],
      },
      {
        id: "passage-ss-2",
        section: "论语集注汇入",
        original: "仁者，以天地万物为一体。",
        links: [
          {
            id: "passage-ss-2-link-1",
            quote: "理学心性论扩展",
            sourceBookId: "book-lunyu-jizhu",
            sourceTitle: "论语集注",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "由论语义理延伸出系统化心性论表达。",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "CBDB 人物 + 上图活动样本",
    },
  },
  shiji: {
    bookId: "book-shiji",
    heroMetric: {
      directCitations: 82,
      downstreamInfluence: 236,
      coveredRegions: 5,
    },
    spread: [],
    people: [],
    places: [],
    versions: [],
    timeline: [
      { id: "tl-shiji-1", year: -91, title: "《史记》定稿", detail: "司马迁完成纪传体通史的历史叙述框架。" },
    ],
    passages: [],
  },
  "zi-zhi-tong-jian": {
    bookId: "book-zi-zhi-tong-jian",
    heroMetric: {
      directCitations: 90,
      downstreamInfluence: 260,
      coveredRegions: 6,
    },
    spread: [],
    people: [],
    places: [],
    versions: [],
    timeline: [
      { id: "tl-zz-1", year: 1084, title: "《资治通鉴》成书", detail: "编年体通史完成，形成治道鉴戒的核心文本。" },
    ],
    passages: [],
  },
  "ri-zhi-lu": {
    bookId: "book-ri-zhi-lu",
    heroMetric: {
      directCitations: 61,
      downstreamInfluence: 154,
      coveredRegions: 4,
    },
    spread: [],
    people: [],
    places: [],
    versions: [],
    timeline: [
      { id: "tl-rzl-1", year: 1670, title: "《日知录》成书", detail: "顾炎武以札记体展开经世与考据思考。" },
    ],
    passages: [],
  },
  "ren-jian-ci-hua": {
    bookId: "book-ren-jian-ci-hua",
    heroMetric: {
      directCitations: 48,
      downstreamInfluence: 118,
      coveredRegions: 3,
    },
    spread: [],
    people: [],
    places: [],
    versions: [],
    timeline: [
      { id: "tl-rjch-1", year: 1908, title: "《人间词话》问世", detail: "以境界说重塑近代诗词批评话语。" },
    ],
    passages: [],
  },
};

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

const cbdbPeople = (realSupplements.cbdbPeople ?? []) as RealSupplementPerson[];
const shanghaiLibraryActivity = (realSupplements.shanghaiLibraryActivity ??
  {}) as RealSupplementActivity;

const personByName = new Map(cbdbPeople.map((person) => [person.name, person]));

function mergePeople(
  names: string[],
  fallback: PersonNode[],
): PersonNode[] {
  const resolved: PersonNode[] = names
    .map((name) => {
      const person = personByName.get(name);
      if (!person || !person.name) {
        return null;
      }

      return {
        id: person.id ?? `fallback-${person.name}`,
        name: person.name,
        role: person.role,
        birthYear: person.birthYear ?? null,
        deathYear: person.deathYear ?? null,
        era: person.era ?? "未详",
        bio: person.bio ?? "",
        source: person.foundInCbdb ? "cbdb" : "demo",
        sourceStatus: person.foundInCbdb ? "matched" : "fallback",
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

const booksBySlug = Object.fromEntries(
  books.map((book) => [book.slug, details[book.slug] ?? placeholderDetail(book)]),
);

export const riverDataset: RiverDataset = {
  books,
  citations,
  booksBySlug,
};
