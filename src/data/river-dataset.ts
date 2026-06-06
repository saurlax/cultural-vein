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

interface RealSupplementVideoTopicSample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  summary?: string;
  accessNote?: string;
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

interface RealSupplementShenzhenLibrarySample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  summary?: string;
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

interface RealSupplementTaofenMuseumSample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  summary?: string;
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

interface RealSupplementSoongLiteratureSample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  summary?: string;
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

interface RealSupplementSouyunKnowledgeGraphSample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  summary?: string;
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

interface RealSupplementPeriodicalIndexSample {
  available?: boolean;
  institution?: string;
  collectionTitle?: string;
  summary?: string;
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

interface RealSupplementCbdbSummary {
  available?: boolean;
  personCount?: number;
  topDynasties?: Array<{
    name: string;
    count: number;
  }>;
}

interface RealSupplementPayload {
  curatedBooks?: RealSupplementBook[];
  demoBooks?: RealSupplementBook[];
  curatedCitations?: RealSupplementCitation[];
  demoCitations?: RealSupplementCitation[];
  curatedBookDetails?: Record<string, BookDetail>;
  demoBookDetails?: Record<string, BookDetail>;
  cbdbPeople?: RealSupplementPerson[];
  cbdbSummary?: RealSupplementCbdbSummary;
  shanghaiLibraryActivity?: RealSupplementActivity;
  nanjingLibrarySample?: RealSupplementInstitutionSample;
  fudanArchiveSample?: RealSupplementArchiveSample;
  nanhuArchiveSample?: RealSupplementNanhuSample;
  videoTopicSample?: RealSupplementVideoTopicSample;
  shenzhenLibrarySample?: RealSupplementShenzhenLibrarySample;
  taofenMuseumSample?: RealSupplementTaofenMuseumSample;
  soongLiteratureSample?: RealSupplementSoongLiteratureSample;
  souyunKnowledgeGraphSample?: RealSupplementSouyunKnowledgeGraphSample;
  periodicalIndexSample?: RealSupplementPeriodicalIndexSample;
}

const supplementPayload = realSupplements as unknown as RealSupplementPayload;

const coreClassicExtensions: RealSupplementBook[] = [
  {
    id: "book-lunyu",
    slug: "lunyu",
    title: "论语",
    shortTitle: "论语",
    dynasty: "先秦",
    year: -450,
    category: "经",
    school: "儒家经典",
    influence: 94,
    velocity: 0.31,
    branchLevel: 0,
    summary: "记录孔门言行与伦理政治核心命题，是四书体系与后世修身论述的源头支柱。",
    concepts: ["仁", "礼", "君子", "修身"],
    coordinates: [-1.2, 0.95, 0.25],
  },
  {
    id: "book-daxue",
    slug: "daxue",
    title: "大学",
    shortTitle: "大学",
    dynasty: "两汉",
    year: 80,
    category: "经",
    school: "儒家经典",
    influence: 87,
    velocity: 0.39,
    branchLevel: 1,
    summary: "由《礼记》析出的修身治国纲领文本，成为宋代理学组织心性与政治秩序的重要门户。",
    concepts: ["明明德", "亲民", "格物", "修齐治平"],
    coordinates: [1.45, 0.75, 0.78],
  },
  {
    id: "book-zhongyong",
    slug: "zhongyong",
    title: "中庸",
    shortTitle: "中庸",
    dynasty: "两汉",
    year: 80,
    category: "经",
    school: "儒家经典",
    influence: 86,
    velocity: 0.37,
    branchLevel: 1,
    summary: "由《礼记》析出的义理枢纽文本，把诚、性与天道关系转化为后世理学的关键支点。",
    concepts: ["中和", "诚", "天命", "性道"],
    coordinates: [2.55, 0.92, -0.22],
  },
  {
    id: "book-zhouyi",
    slug: "zhouyi",
    title: "周易",
    shortTitle: "周易",
    dynasty: "先秦",
    year: -300,
    category: "经",
    school: "儒家经典",
    influence: 91,
    velocity: 0.29,
    branchLevel: 0,
    summary: "以卦象与系辞组织天道、人事与变化观，是经学主干中最适合承接义理分流和术数外拓的枢纽经典。",
    concepts: ["阴阳", "变易", "象数", "天道"],
    coordinates: [-2.45, 1.15, -0.42],
  },
  {
    id: "book-xiaojing",
    slug: "xiaojing",
    title: "孝经",
    shortTitle: "孝经",
    dynasty: "两汉",
    year: 50,
    category: "经",
    school: "儒家经典",
    influence: 82,
    velocity: 0.35,
    branchLevel: 1,
    summary: "以孝治与伦理秩序贯穿家国关系，是礼教传播、家族叙事和教化体系中极具代表性的经典节点。",
    concepts: ["孝", "教化", "家国", "伦理"],
    coordinates: [0.72, 0.82, 1.46],
  },
];

const coreClassicCitationExtensions: RealSupplementCitation[] = [
  {
    id: "edge-lunyu-1",
    source: "book-lunyu-jizhu",
    target: "book-lunyu",
    layer: "metadata",
    confidence: 1,
    label: "集注承源",
    evidence: "《论语集注》直接以《论语》原文为底本组织章句与义理阐释。",
  },
  {
    id: "edge-lunyu-2",
    source: "book-sishu-zhangju",
    target: "book-lunyu",
    layer: "metadata",
    confidence: 1,
    label: "四书汇入",
    evidence: "《论语》作为四书核心之一，被纳入统一教材与解释体系。",
  },
  {
    id: "edge-daxue-1",
    source: "book-daxue",
    target: "book-liji",
    layer: "metadata",
    confidence: 1,
    label: "礼记析出",
    evidence: "《大学》原为《礼记》篇章，后世独立成书并进入四书体系。",
  },
  {
    id: "edge-zhongyong-1",
    source: "book-zhongyong",
    target: "book-liji",
    layer: "metadata",
    confidence: 1,
    label: "礼记析出",
    evidence: "《中庸》原为《礼记》篇章，后世独立成书并成为理学义理中枢。",
  },
  {
    id: "edge-daxue-2",
    source: "book-sishu-zhangju",
    target: "book-daxue",
    layer: "explicit",
    confidence: 0.95,
    label: "章句定型",
    evidence: "朱熹章句将《大学》重写为四书学习路径的起点文本。",
  },
  {
    id: "edge-zhongyong-2",
    source: "book-sishu-zhangju",
    target: "book-zhongyong",
    layer: "explicit",
    confidence: 0.94,
    label: "义理定型",
    evidence: "《四书章句集注》把《中庸》推到心性义理与天道论的核心位置。",
  },
  {
    id: "edge-daxue-3",
    source: "book-daxue",
    target: "book-lunyu",
    layer: "semantic",
    confidence: 0.78,
    label: "修身互证",
    evidence: "《大学》的修身治平路径与《论语》君子修德论高度呼应。",
  },
  {
    id: "edge-zhongyong-3",
    source: "book-zhongyong",
    target: "book-mengzi",
    layer: "semantic",
    confidence: 0.73,
    label: "心性互证",
    evidence: "《中庸》的性命与诚论为《孟子》性善与尽心论提供后世互证框架。",
  },
  {
    id: "edge-zhouyi-1",
    source: "book-shangshu",
    target: "book-zhouyi",
    layer: "metadata",
    confidence: 0.96,
    label: "经典并流",
    evidence: "《周易》与《尚书》同处上古经典主干，后世经学常将其并置为政教与天道两条核心解释线。",
  },
  {
    id: "edge-zhouyi-2",
    source: "book-zhongyong",
    target: "book-zhouyi",
    layer: "semantic",
    confidence: 0.79,
    label: "天道互证",
    evidence: "《中庸》的天命与诚论吸收《周易》关于变化、天道与人事贯通的解释框架。",
  },
  {
    id: "edge-zhouyi-3",
    source: "book-sishu-zhangju",
    target: "book-zhouyi",
    layer: "influence",
    confidence: 0.66,
    label: "理学外拓",
    evidence: "四书理学虽不直接属于《周易》注疏，但其义理建构长期与《易》学天道论互相支撑。",
  },
  {
    id: "edge-xiaojing-1",
    source: "book-xiaojing",
    target: "book-lunyu",
    layer: "explicit",
    confidence: 0.91,
    label: "孔门教化承续",
    evidence: "《孝经》以孔门问答体展开孝治与教化，延续《论语》的师弟子语录结构与伦理核心。",
  },
  {
    id: "edge-xiaojing-2",
    source: "book-xiaojing",
    target: "book-liji",
    layer: "semantic",
    confidence: 0.77,
    label: "礼教互证",
    evidence: "《孝经》的家国伦理与《礼记》的礼治秩序在后世教化系统中长期并行互证。",
  },
  {
    id: "edge-xiaojing-3",
    source: "book-daxue",
    target: "book-xiaojing",
    layer: "influence",
    confidence: 0.68,
    label: "修齐互通",
    evidence: "《大学》修齐治平结构与《孝经》家国教化逻辑在宋后教材系统中形成互补。",
  },
];

const coreClassicDetailExtensions: Record<string, BookDetail> = {
  lunyu: {
    bookId: "book-lunyu",
    heroMetric: {
      directCitations: 92,
      downstreamInfluence: 318,
      coveredRegions: 8,
    },
    spread: [
      {
        id: "spread-ly-1",
        fromPlaceId: "place-qufu",
        toPlaceId: "place-luoyang",
        startYear: -200,
        endYear: 100,
        volume: 82,
      },
      {
        id: "spread-ly-2",
        fromPlaceId: "place-luoyang",
        toPlaceId: "place-kaifeng",
        startYear: 960,
        endYear: 1127,
        volume: 90,
      },
      {
        id: "spread-ly-3",
        fromPlaceId: "place-kaifeng",
        toPlaceId: "place-wuyishan",
        startYear: 1130,
        endYear: 1200,
        volume: 94,
      },
    ],
    people: [
      {
        id: "person-kongzi",
        name: "孔子",
        role: "作者",
        birthYear: -551,
        deathYear: -479,
        era: "先秦",
        bio: "孔门学统核心人物，其言行被后世编纂为《论语》，成为儒家修身与政治伦理的源头文本。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "著",
      },
      {
        id: "person-zhuxi-lunyu",
        name: "朱熹",
        role: "注者",
        birthYear: 1130,
        deathYear: 1200,
        era: "宋",
        bio: "以《论语集注》重整孔门语录的义理结构，把《论语》纳入四书学习主轴。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-chengyi-lunyu",
        name: "程颐",
        role: "评论者",
        birthYear: 1033,
        deathYear: 1107,
        era: "宋",
        bio: "北宋理学家，二程学脉经由《论语》重新组织心性与礼法论述。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-qufu",
        name: "曲阜",
        lat: 35.6005,
        lng: 116.9919,
        note: "孔门学统与鲁地经典记忆的原点。",
      },
      {
        id: "place-luoyang",
        name: "洛阳",
        lat: 34.6197,
        lng: 112.454,
        note: "汉魏经典传授与注疏汇聚节点。",
      },
      {
        id: "place-kaifeng",
        name: "开封",
        lat: 34.7972,
        lng: 114.3076,
        note: "北宋经学传播与书院教育中心。",
      },
      {
        id: "place-wuyishan",
        name: "武夷山",
        lat: 27.7566,
        lng: 118.0314,
        note: "朱熹讲学与理学章句体系成熟的重要空间。",
      },
    ],
    versions: [
      {
        id: "version-ly-1",
        label: "《论语》古传本系",
        year: -100,
        place: "鲁地",
        library: "经学传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "两汉以前《论语》文本流传复杂，古文今文系统并行。",
      },
      {
        id: "version-ly-2",
        label: "《论语正义》刻本",
        year: 653,
        place: "长安",
        library: "国子监",
        status: "存世",
        parentId: "version-ly-1",
        editionType: "刻本",
        note: "唐代正义系统稳定《论语》解释框架。",
      },
      {
        id: "version-ly-3",
        label: "《论语集注》讲本",
        year: 1170,
        place: "武夷山",
        library: "书院系统",
        status: "存世",
        parentId: "version-ly-2",
        editionType: "重刊本",
        note: "朱熹集注推动《论语》进入四书化与教材化阶段。",
      },
    ],
    timeline: [
      {
        id: "tl-ly-1",
        year: -450,
        title: "孔门语录逐步成编",
        detail: "孔门弟子与再传弟子整理言行，形成《论语》文本雏形。",
      },
      {
        id: "tl-ly-2",
        year: 653,
        title: "《论语正义》进入官学体系",
        detail: "唐代官方义疏系统稳定了《论语》的注释主线。",
      },
      {
        id: "tl-ly-3",
        year: 1170,
        title: "《论语集注》流布",
        detail: "宋代理学将《论语》重新编码为四书学习主轴。",
      },
    ],
    passages: [
      {
        id: "passage-ly-1",
        section: "学而",
        original: "学而时习之，不亦说乎？有朋自远方来，不亦乐乎？",
        links: [
          {
            id: "passage-ly-1-link-1",
            quote: "学问工夫由内而外展开",
            sourceBookId: "book-daxue",
            sourceTitle: "大学",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《大学》把《论语》的学习工夫扩展为明德、亲民、止于至善的路径。",
          },
        ],
        tracePath: [
          {
            id: "trace-ly-1",
            title: "论语",
            relation: "源头",
            note: "孔门语录确立后世修身与学习论述的原型。",
          },
          {
            id: "trace-ly-2",
            title: "大学",
            relation: "展开",
            note: "把个人学习工夫转写为修齐治平的结构化纲领。",
          },
          {
            id: "trace-ly-3",
            title: "四书章句集注",
            relation: "定型",
            note: "朱熹将《论语》与《大学》整合为统一教材体系。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-ly-1",
            targetTitle: "论语集注",
            relation: "显式注释",
            note: "直接以《论语》原文为底本建立后世集注框架。",
            confidenceLabel: "高",
          },
        ],
      },
      {
        id: "passage-ly-2",
        section: "颜渊",
        original: "克己复礼为仁。一日克己复礼，天下归仁焉。",
        links: [
          {
            id: "passage-ly-2-link-1",
            quote: "自诚明与礼的内在化",
            sourceBookId: "book-zhongyong",
            sourceTitle: "中庸",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《中庸》将礼的外在秩序转化为诚与中和的内在工夫。",
          },
        ],
        tracePath: [
          {
            id: "trace-ly-4",
            title: "论语",
            relation: "源头",
            note: "提出“克己复礼为仁”的经典命题。",
          },
          {
            id: "trace-ly-5",
            title: "中庸",
            relation: "义理化",
            note: "把仁与礼的实践转换为诚与中和的形上论述。",
          },
          {
            id: "trace-ly-6",
            title: "论语集注",
            relation: "再诠释",
            note: "朱熹将其纳入心性论与工夫论框架中重新解释。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-ly-2",
            targetTitle: "论语集注",
            relation: "注疏承继",
            note: "理学传统围绕“仁”“礼”关系展开更细密解释。",
            confidenceLabel: "高",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "CBDB 人物 + 上图活动样本 + 搜韵知识图谱 API 样本",
      venueSummary: "补入《论语》后，四书主干从孔门语录源头一直连到宋代理学教材化阶段，增强“主河道不是单节点”的展示力度。",
    },
  },
  daxue: {
    bookId: "book-daxue",
    heroMetric: {
      directCitations: 84,
      downstreamInfluence: 246,
      coveredRegions: 6,
    },
    spread: [
      {
        id: "spread-dx-1",
        fromPlaceId: "place-changan",
        toPlaceId: "place-kaifeng",
        startYear: 80,
        endYear: 1000,
        volume: 72,
      },
      {
        id: "spread-dx-2",
        fromPlaceId: "place-kaifeng",
        toPlaceId: "place-wuyishan-dx",
        startYear: 1030,
        endYear: 1200,
        volume: 92,
      },
    ],
    people: [
      {
        id: "person-zengzi",
        name: "曾子",
        role: "作者",
        era: "先秦",
        bio: "后世常将《大学》学脉追溯至曾子系统，是修身治国纲领的重要思想祖线。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "著",
      },
      {
        id: "person-zhuxi-daxue",
        name: "朱熹",
        role: "注者",
        birthYear: 1130,
        deathYear: 1200,
        era: "宋",
        bio: "将《大学》定为四书起首，使格物致知与修齐治平路径标准化。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-chenghao",
        name: "程颢",
        role: "评论者",
        birthYear: 1032,
        deathYear: 1085,
        era: "宋",
        bio: "二程学脉经由《大学》重述德性与政治秩序的连通关系。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-changan",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "汉唐礼学与经典编纂的核心中心。",
      },
      {
        id: "place-kaifeng",
        name: "开封",
        lat: 34.7972,
        lng: 114.3076,
        note: "北宋理学与学校教育传播枢纽。",
      },
      {
        id: "place-wuyishan-dx",
        name: "武夷山",
        lat: 27.7566,
        lng: 118.0314,
        note: "朱熹整合《大学》章句与理学工夫论的重要讲学空间。",
      },
    ],
    versions: [
      {
        id: "version-dx-1",
        label: "《礼记》大学篇旧本",
        year: 80,
        place: "长安",
        library: "礼记传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "作为《礼记》篇章流传的早期文本基础。",
      },
      {
        id: "version-dx-2",
        label: "北宋《大学章句》写本系",
        year: 1050,
        place: "开封",
        library: "书院系统",
        status: "佚失",
        parentId: "version-dx-1",
        editionType: "抄本",
        note: "二程以来围绕《大学》重订义理框架的早期传播层。",
      },
      {
        id: "version-dx-3",
        label: "朱熹《大学章句》刻本",
        year: 1189,
        place: "武夷山",
        library: "书院系统",
        status: "存世",
        parentId: "version-dx-2",
        editionType: "刻本",
        note: "四书章句体系中的核心定型版本。",
      },
    ],
    timeline: [
      {
        id: "tl-dx-1",
        year: 80,
        title: "《大学》作为《礼记》篇章流传",
        detail: "《大学》以礼学文本形式嵌入《礼记》系统。",
      },
      {
        id: "tl-dx-2",
        year: 1050,
        title: "北宋理学重提《大学》",
        detail: "二程学脉开始将《大学》凸显为修身工夫核心文本。",
      },
      {
        id: "tl-dx-3",
        year: 1189,
        title: "《大学章句》定型",
        detail: "朱熹将《大学》置于四书学习路径之首，完成教材化改写。",
      },
    ],
    passages: [
      {
        id: "passage-dx-1",
        section: "三纲领",
        original: "大学之道，在明明德，在亲民，在止于至善。",
        links: [
          {
            id: "passage-dx-1-link-1",
            quote: "《礼记》大学篇",
            sourceBookId: "book-liji",
            sourceTitle: "礼记",
            layer: "explicit",
            confidenceLabel: "高",
            evidence: "《大学》原为《礼记》篇章，这一表述直接保留礼学根基。",
          },
        ],
        tracePath: [
          {
            id: "trace-dx-1",
            title: "礼记",
            relation: "母体",
            note: "《大学》原本嵌在《礼记》系统之中。",
          },
          {
            id: "trace-dx-2",
            title: "大学",
            relation: "析出",
            note: "从礼学篇章转为独立修身治国纲领文本。",
          },
          {
            id: "trace-dx-3",
            title: "四书章句集注",
            relation: "教材化",
            note: "朱熹将其推为四书学习起点，形成标准化学习路径。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-dx-1",
            targetTitle: "四书章句集注",
            relation: "显式纳入",
            note: "成为四书章句体系中起首的纲领性文本。",
            confidenceLabel: "高",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "CBDB 人物 + 上海图书馆活动样本",
      venueSummary: "补入《大学》后，可以更清楚地展示《礼记》篇章如何被析出并重组进四书教材体系。",
    },
  },
  zhongyong: {
    bookId: "book-zhongyong",
    heroMetric: {
      directCitations: 82,
      downstreamInfluence: 238,
      coveredRegions: 6,
    },
    spread: [
      {
        id: "spread-zy-1",
        fromPlaceId: "place-luoyang-zy",
        toPlaceId: "place-kaifeng-zy",
        startYear: 80,
        endYear: 1000,
        volume: 70,
      },
      {
        id: "spread-zy-2",
        fromPlaceId: "place-kaifeng-zy",
        toPlaceId: "place-wuyishan-zy",
        startYear: 1030,
        endYear: 1200,
        volume: 90,
      },
    ],
    people: [
      {
        id: "person-zisi",
        name: "子思",
        role: "作者",
        era: "先秦",
        bio: "后世常将《中庸》义理系谱追溯至子思学脉，是孔门向形上义理展开的关键节点。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "著",
      },
      {
        id: "person-zhuxi-zy",
        name: "朱熹",
        role: "注者",
        birthYear: 1130,
        deathYear: 1200,
        era: "宋",
        bio: "通过章句把《中庸》的诚与中和论推进为理学心性论的关键入口。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-chengyi-zy",
        name: "程颐",
        role: "评论者",
        birthYear: 1033,
        deathYear: 1107,
        era: "宋",
        bio: "北宋理学家，经由《中庸》强化天理与工夫论的连动解释。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-luoyang-zy",
        name: "洛阳",
        lat: 34.6197,
        lng: 112.454,
        note: "汉唐经学体系中《礼记》与相关义理传承的重要据点。",
      },
      {
        id: "place-kaifeng-zy",
        name: "开封",
        lat: 34.7972,
        lng: 114.3076,
        note: "北宋理学网络推动《中庸》从经学向心性论转型。",
      },
      {
        id: "place-wuyishan-zy",
        name: "武夷山",
        lat: 27.7566,
        lng: 118.0314,
        note: "朱熹整合《中庸》章句与四书系统的关键讲学空间。",
      },
    ],
    versions: [
      {
        id: "version-zy-1",
        label: "《礼记》中庸篇旧本",
        year: 80,
        place: "洛阳",
        library: "礼记传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "《中庸》作为《礼记》篇章存在的早期文本层。",
      },
      {
        id: "version-zy-2",
        label: "北宋《中庸》讲义写本系",
        year: 1060,
        place: "开封",
        library: "书院系统",
        status: "佚失",
        parentId: "version-zy-1",
        editionType: "抄本",
        note: "理学家围绕诚、中和与性命论展开再解释的过渡层。",
      },
      {
        id: "version-zy-3",
        label: "朱熹《中庸章句》刻本",
        year: 1189,
        place: "武夷山",
        library: "书院系统",
        status: "存世",
        parentId: "version-zy-2",
        editionType: "刻本",
        note: "朱熹章句使《中庸》成为四书体系中的义理核心。",
      },
    ],
    timeline: [
      {
        id: "tl-zy-1",
        year: 80,
        title: "《中庸》作为《礼记》篇章流传",
        detail: "《中庸》最初作为礼学文本的一部分被保存和传授。",
      },
      {
        id: "tl-zy-2",
        year: 1060,
        title: "北宋理学重释《中庸》",
        detail: "中和、诚与性命关系被重新拉到心性论前台。",
      },
      {
        id: "tl-zy-3",
        year: 1189,
        title: "《中庸章句》进入四书体系",
        detail: "朱熹通过章句系统完成《中庸》的教材化与理学化。",
      },
    ],
    passages: [
      {
        id: "passage-zy-1",
        section: "天命之谓性",
        original: "天命之谓性，率性之谓道，修道之谓教。",
        links: [
          {
            id: "passage-zy-1-link-1",
            quote: "尽心知性，以知天",
            sourceBookId: "book-mengzi",
            sourceTitle: "孟子",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《孟子》的尽心知性论为《中庸》性道论提供后世互证语境。",
          },
        ],
        tracePath: [
          {
            id: "trace-zy-1",
            title: "礼记",
            relation: "母体",
            note: "《中庸》原本依附于《礼记》礼学体系。",
          },
          {
            id: "trace-zy-2",
            title: "中庸",
            relation: "析出",
            note: "逐步被后世作为独立义理文本来阅读和讲授。",
          },
          {
            id: "trace-zy-3",
            title: "四书章句集注",
            relation: "定型",
            note: "章句系统将其推到四书义理核心位置。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-zy-1",
            targetTitle: "四书章句集注",
            relation: "显式纳入",
            note: "《中庸》被重写为四书体系中的形上义理支点。",
            confidenceLabel: "高",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "CBDB 人物 + 上海图书馆活动样本",
      venueSummary: "补入《中庸》后，四书主干中的心性义理层得到明确落点，不再只停留在《礼记》与《四书章句集注》的跳跃连接。",
    },
  },
  zhouyi: {
    bookId: "book-zhouyi",
    heroMetric: {
      directCitations: 88,
      downstreamInfluence: 274,
      coveredRegions: 7,
    },
    spread: [
      {
        id: "spread-zyi-1",
        fromPlaceId: "place-luoyi-zyi",
        toPlaceId: "place-changan-zyi",
        startYear: -200,
        endYear: 200,
        volume: 76,
      },
      {
        id: "spread-zyi-2",
        fromPlaceId: "place-changan-zyi",
        toPlaceId: "place-kaifeng-zyi",
        startYear: 220,
        endYear: 1100,
        volume: 84,
      },
      {
        id: "spread-zyi-3",
        fromPlaceId: "place-kaifeng-zyi",
        toPlaceId: "place-wuyishan-zyi",
        startYear: 1100,
        endYear: 1200,
        volume: 91,
      },
    ],
    people: [
      {
        id: "person-wangbi",
        name: "王弼",
        role: "注者",
        birthYear: 226,
        deathYear: 249,
        era: "魏晋",
        bio: "魏晋玄学代表人物，以义理化诠释重塑《周易》，成为后世《易》学的重要转折点。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-kongyingda-zhouyi",
        name: "孔颖达",
        role: "注者",
        birthYear: 574,
        deathYear: 648,
        era: "隋唐",
        bio: "主持《五经正义》体系，使《周易》进入更稳定的官学解释框架。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-zhuxi-zhouyi",
        name: "朱熹",
        role: "评论者",
        birthYear: 1130,
        deathYear: 1200,
        era: "宋",
        bio: "在理学系统中持续借《易》学资源重述天道、性命与工夫论。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-luoyi-zyi",
        name: "洛邑",
        lat: 34.679,
        lng: 112.453,
        note: "早期《易》学记忆与王官典籍传统的重要象征空间。",
      },
      {
        id: "place-changan-zyi",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "汉唐经学汇聚与正义体系形成中心。",
      },
      {
        id: "place-kaifeng-zyi",
        name: "开封",
        lat: 34.7972,
        lng: 114.3076,
        note: "北宋义理化《易》学的重要传播节点。",
      },
      {
        id: "place-wuyishan-zyi",
        name: "武夷山",
        lat: 27.7566,
        lng: 118.0314,
        note: "宋代理学重新整合《易》学与四书义理的讲学空间。",
      },
    ],
    versions: [
      {
        id: "version-zyi-1",
        label: "《周易》古经本系",
        year: -150,
        place: "洛邑",
        library: "经学传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "先秦两汉间古经系统长期构成《易》学解释的底本。",
      },
      {
        id: "version-zyi-2",
        label: "王弼注《周易》写本系",
        year: 240,
        place: "洛阳",
        library: "魏晋注疏系统",
        status: "佚失",
        parentId: "version-zyi-1",
        editionType: "抄本",
        note: "玄学化诠释改变后世《易》学阅读路径。",
      },
      {
        id: "version-zyi-3",
        label: "《周易正义》刻本",
        year: 653,
        place: "长安",
        library: "国子监",
        status: "存世",
        parentId: "version-zyi-2",
        editionType: "刻本",
        note: "唐代官学系统确立《周易》义疏主线。",
      },
    ],
    timeline: [
      {
        id: "tl-zyi-1",
        year: -300,
        title: "《周易》经典形态稳定",
        detail: "卦象、卦辞与系辞逐步汇入统一经典结构，形成后世《易》学起点。",
      },
      {
        id: "tl-zyi-2",
        year: 240,
        title: "王弼义理化诠释成型",
        detail: "魏晋玄学把《周易》从象数阅读进一步转向义理阅读。",
      },
      {
        id: "tl-zyi-3",
        year: 653,
        title: "《周易正义》进入官学",
        detail: "唐代正义系统稳固了《周易》在五经体系中的解释地位。",
      },
    ],
    passages: [
      {
        id: "passage-zyi-1",
        section: "系辞上",
        original: "一阴一阳之谓道，继之者善也，成之者性也。",
        links: [
          {
            id: "passage-zyi-1-link-1",
            quote: "天命之谓性",
            sourceBookId: "book-zhongyong",
            sourceTitle: "中庸",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《中庸》的性道论与《周易》阴阳变化框架共同支撑后世心性哲学。",
          },
        ],
        tracePath: [
          {
            id: "trace-zyi-1",
            title: "周易",
            relation: "源头",
            note: "以阴阳变化论述天道人事关系。",
          },
          {
            id: "trace-zyi-2",
            title: "中庸",
            relation: "义理转写",
            note: "把变化之道进一步转为性、诚与中和的工夫结构。",
          },
          {
            id: "trace-zyi-3",
            title: "四书章句集注",
            relation: "理学吸纳",
            note: "宋代理学在四书体系内持续吸纳《易》学的天道资源。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-zyi-1",
            targetTitle: "中庸",
            relation: "义理继承",
            note: "后世心性论持续借《易》学变化观来解释天命与性道。",
            confidenceLabel: "中",
          },
        ],
      },
      {
        id: "passage-zyi-2",
        section: "乾卦",
        original: "天行健，君子以自强不息。",
        links: [
          {
            id: "passage-zyi-2-link-1",
            quote: "修身工夫外化为政治人格",
            sourceBookId: "book-daxue",
            sourceTitle: "大学",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《大学》把君子人格的持续工夫转化为修齐治平的阶次结构。",
          },
        ],
        tracePath: [
          {
            id: "trace-zyi-4",
            title: "周易",
            relation: "源头",
            note: "提出“自强不息”的君子工夫原型。",
          },
          {
            id: "trace-zyi-5",
            title: "大学",
            relation: "展开",
            note: "将君子工夫扩写为面向家国秩序的修齐治平路径。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-zyi-2",
            targetTitle: "大学",
            relation: "工夫转写",
            note: "从自强不息到格物致知，形成更可教学化的德性结构。",
            confidenceLabel: "中",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "CBDB 人物 + 上海图书馆活动样本 + 搜韵知识图谱 API 样本",
      venueSummary: "补入《周易》后，主河道不再只覆盖四书内部，而能向五经义理与天道论方向继续展开。",
    },
  },
  xiaojing: {
    bookId: "book-xiaojing",
    heroMetric: {
      directCitations: 73,
      downstreamInfluence: 208,
      coveredRegions: 6,
    },
    spread: [
      {
        id: "spread-xj-1",
        fromPlaceId: "place-changan-xj",
        toPlaceId: "place-luoyang-xj",
        startYear: 50,
        endYear: 220,
        volume: 68,
      },
      {
        id: "spread-xj-2",
        fromPlaceId: "place-luoyang-xj",
        toPlaceId: "place-kaifeng-xj",
        startYear: 650,
        endYear: 1100,
        volume: 79,
      },
      {
        id: "spread-xj-3",
        fromPlaceId: "place-kaifeng-xj",
        toPlaceId: "place-quzhou-xj",
        startYear: 1100,
        endYear: 1250,
        volume: 83,
      },
    ],
    people: [
      {
        id: "person-kongan-guo-xj",
        name: "孔安国",
        role: "注者",
        era: "两汉",
        bio: "后世《孝经》传授常借孔门后学名义建立权威，强化经典教化属性。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-xuanzong-xj",
        name: "唐玄宗",
        role: "评论者",
        birthYear: 685,
        deathYear: 762,
        era: "隋唐",
        bio: "御注《孝经》推动其进入国家教化与学校教育更核心的位置。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "评",
      },
      {
        id: "person-zhuxi-xj",
        name: "朱熹",
        role: "评论者",
        birthYear: 1130,
        deathYear: 1200,
        era: "宋",
        bio: "宋代理学继续以《孝经》回应家国伦理与德性秩序问题。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-changan-xj",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "汉唐《孝经》教化系统与官学传播中心。",
      },
      {
        id: "place-luoyang-xj",
        name: "洛阳",
        lat: 34.6197,
        lng: 112.454,
        note: "东汉经学与礼教传播的重要节点。",
      },
      {
        id: "place-kaifeng-xj",
        name: "开封",
        lat: 34.7972,
        lng: 114.3076,
        note: "宋代学校教育与经典训释的集散地。",
      },
      {
        id: "place-quzhou-xj",
        name: "衢州",
        lat: 28.9701,
        lng: 118.8595,
        note: "南宋以来宗族教化、家学传播与儒学教育的重要空间。",
      },
    ],
    versions: [
      {
        id: "version-xj-1",
        label: "《孝经》古注本系",
        year: 50,
        place: "长安",
        library: "经学传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "两汉间《孝经》形成较稳定教化经典形态。",
      },
      {
        id: "version-xj-2",
        label: "唐玄宗御注《孝经》本",
        year: 730,
        place: "长安",
        library: "官学系统",
        status: "存世",
        parentId: "version-xj-1",
        editionType: "刻本",
        note: "国家教化与学校教育体系中的核心传播版本。",
      },
      {
        id: "version-xj-3",
        label: "南宋书院讲本",
        year: 1180,
        place: "衢州",
        library: "书院系统",
        status: "佚失",
        parentId: "version-xj-2",
        editionType: "抄本",
        note: "配合四书与家礼教育体系继续流布。",
      },
    ],
    timeline: [
      {
        id: "tl-xj-1",
        year: 50,
        title: "《孝经》成为教化经典",
        detail: "两汉经学体系中，《孝经》逐渐稳定为家国伦理教育的重要文本。",
      },
      {
        id: "tl-xj-2",
        year: 730,
        title: "唐玄宗御注推动官学传播",
        detail: "《孝经》进入更强的国家教化与学校教学系统。",
      },
      {
        id: "tl-xj-3",
        year: 1180,
        title: "宋代书院继续讲习《孝经》",
        detail: "与四书、家礼一起构成更完整的伦理教育组合。",
      },
    ],
    passages: [
      {
        id: "passage-xj-1",
        section: "开宗明义",
        original: "夫孝，德之本也，教之所由生也。",
        links: [
          {
            id: "passage-xj-1-link-1",
            quote: "仁礼教化的家国起点",
            sourceBookId: "book-lunyu",
            sourceTitle: "论语",
            layer: "explicit",
            confidenceLabel: "高",
            evidence: "《孝经》的孔门问答体与德性论述直接承接《论语》孔门伦理核心。",
          },
        ],
        tracePath: [
          {
            id: "trace-xj-1",
            title: "论语",
            relation: "源头",
            note: "孔门伦理话语提供《孝经》问答体与德性核心。",
          },
          {
            id: "trace-xj-2",
            title: "孝经",
            relation: "聚焦",
            note: "将仁礼话语聚焦为以孝治与教化秩序。",
          },
          {
            id: "trace-xj-3",
            title: "大学",
            relation: "扩写",
            note: "把家国伦理进一步展开为修齐治平的层次结构。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-xj-1",
            targetTitle: "大学",
            relation: "教化互补",
            note: "从德之本到修齐治平，形成更系统的伦理教育链路。",
            confidenceLabel: "中",
          },
        ],
      },
      {
        id: "passage-xj-2",
        section: "广要道",
        original: "教民亲爱，莫善于孝。教民礼顺，莫善于悌。",
        links: [
          {
            id: "passage-xj-2-link-1",
            quote: "礼治秩序的家内化",
            sourceBookId: "book-liji",
            sourceTitle: "礼记",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《礼记》的礼治秩序在《孝经》中被进一步转写为家庭伦理与日用教化。",
          },
        ],
        tracePath: [
          {
            id: "trace-xj-4",
            title: "礼记",
            relation: "制度背景",
            note: "礼学秩序为《孝经》的教民路径提供制度性框架。",
          },
          {
            id: "trace-xj-5",
            title: "孝经",
            relation: "伦理转写",
            note: "把礼治结构压缩到家内教化与亲爱秩序中。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-xj-2",
            targetTitle: "四书章句集注",
            relation: "教材互补",
            note: "虽不属四书，但长期与四书教学共同构成伦理训育环境。",
            confidenceLabel: "低",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "CBDB 人物 + 上海图书馆活动样本",
      venueSummary: "补入《孝经》后，主河道可以更自然地延伸到家礼、教化与家族传播叙事，为后续接家谱数据预留落点。",
    },
  },
};

const books = [
  ...((supplementPayload.curatedBooks ?? supplementPayload.demoBooks ?? []) as RealSupplementBook[]),
  ...coreClassicExtensions,
] as RealSupplementBook[];
const citations = [
  ...((supplementPayload.curatedCitations ?? supplementPayload.demoCitations ?? []) as RealSupplementCitation[]),
  ...coreClassicCitationExtensions,
] as RealSupplementCitation[];
const generatedDetails = ((supplementPayload.curatedBookDetails ?? supplementPayload.demoBookDetails) ?? {}) as Record<string, BookDetail>;

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
for (const [slug, detail] of Object.entries(coreClassicDetailExtensions)) {
  details[slug] = cloneDetail(detail);
}

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

const cbdbPeople = (supplementPayload.cbdbPeople ?? []) as RealSupplementPerson[];
const cbdbSummary = (supplementPayload.cbdbSummary ?? {}) as RealSupplementCbdbSummary;
const shanghaiLibraryActivity = (supplementPayload.shanghaiLibraryActivity ??
  {}) as RealSupplementActivity;
const nanjingLibrarySample = (supplementPayload.nanjingLibrarySample ??
  {}) as RealSupplementInstitutionSample;
const fudanArchiveSample = (supplementPayload.fudanArchiveSample ??
  {}) as RealSupplementArchiveSample;
const nanhuArchiveSample = (supplementPayload.nanhuArchiveSample ??
  {}) as RealSupplementNanhuSample;
const videoTopicSample = (supplementPayload.videoTopicSample ??
  {}) as RealSupplementVideoTopicSample;
const shenzhenLibrarySample = (supplementPayload.shenzhenLibrarySample ??
  {}) as RealSupplementShenzhenLibrarySample;
const taofenMuseumSample = (supplementPayload.taofenMuseumSample ??
  {}) as RealSupplementTaofenMuseumSample;
const soongLiteratureSample = (supplementPayload.soongLiteratureSample ??
  {}) as RealSupplementSoongLiteratureSample;
const souyunKnowledgeGraphSample = (supplementPayload.souyunKnowledgeGraphSample ??
  {}) as RealSupplementSouyunKnowledgeGraphSample;
const periodicalIndexSample = (supplementPayload.periodicalIndexSample ??
  {}) as RealSupplementPeriodicalIndexSample;

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
        source: person.foundInCbdb ? "cbdb" : "curated",
        sourceStatus: person.foundInCbdb ? "matched" : "curated",
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
  shangshu: ["孔颖达", "蔡沈"],
  lunyu: ["朱熹"],
  daxue: ["朱熹"],
  zhongyong: ["朱熹"],
  zhouyi: ["孔颖达", "朱熹"],
  xiaojing: ["朱熹"],
  "sishu-zhangju": ["朱熹"],
  shiji: ["司马迁"],
  mengzi: ["孟子", "朱熹"],
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

  for (const slug of ["shijing", "shangshu", "mengzi", "sishu-zhangju", "lunyu", "daxue", "zhongyong", "zhouyi", "xiaojing"] as const) {
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

if (videoTopicSample.available) {
  const institutionSamples = (videoTopicSample.sampleRecords ?? []).slice(0, 4);
  const detail = details["ren-jian-ci-hua"];
  detail.realWorldSignals = {
    ...detail.realWorldSignals,
    sourceLabel: detail.realWorldSignals?.sourceLabel
      ? `${detail.realWorldSignals.sourceLabel} + 近代上海城市文化专题片`
      : "近代上海城市文化专题片",
    institutionSamples: [
      ...(detail.realWorldSignals?.institutionSamples ?? []),
      ...institutionSamples,
    ],
    venueSummary:
      detail.realWorldSignals?.venueSummary ??
      videoTopicSample.summary ??
      "已接入近代上海城市文化专题片样本。",
  };
}

if (shenzhenLibrarySample.available) {
  const institutionSamples = (shenzhenLibrarySample.sampleRecords ?? []).slice(0, 2);
  for (const slug of ["ren-jian-ci-hua", "zi-zhi-tong-jian"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: detail.realWorldSignals?.sourceLabel
        ? `${detail.realWorldSignals.sourceLabel} + 深圳图书馆专题接口样本`
        : "深圳图书馆专题接口样本",
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        shenzhenLibrarySample.summary ??
        "已接入深圳图书馆专题文化接口样本。",
    };
  }
}

if (taofenMuseumSample.available) {
  const institutionSamples = (taofenMuseumSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["ren-jian-ci-hua", "ri-zhi-lu"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: detail.realWorldSignals?.sourceLabel
        ? `${detail.realWorldSignals.sourceLabel} + 韬奋纪念馆 API 样本`
        : "韬奋纪念馆 API 样本",
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        taofenMuseumSample.summary ??
        "已接入韬奋纪念馆近现代出版文化 API 样本。",
    };
  }
}

if (soongLiteratureSample.available) {
  const institutionSamples = (soongLiteratureSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["ren-jian-ci-hua", "shiji"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: detail.realWorldSignals?.sourceLabel
        ? `${detail.realWorldSignals.sourceLabel} + 宋庆龄文献 API 样本`
        : "宋庆龄文献 API 样本",
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        soongLiteratureSample.summary ??
        "已接入宋庆龄文献人物与事件字段 API 样本。",
    };
  }
}

if (souyunKnowledgeGraphSample.available) {
  const institutionSamples = (souyunKnowledgeGraphSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["shijing", "lunyu", "daxue", "zhongyong", "zhouyi", "mengzi", "sishu-zhangju", "ren-jian-ci-hua"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: detail.realWorldSignals?.sourceLabel
        ? `${detail.realWorldSignals.sourceLabel} + 搜韵知识图谱 API 样本`
        : "搜韵知识图谱 API 样本",
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary: detail.realWorldSignals?.venueSummary
        ? `${detail.realWorldSignals.venueSummary} 同时已挂接搜韵知识图谱接口样本，可继续外推到诗文库、古籍库和文本比对能力。`
        : souyunKnowledgeGraphSample.summary ??
          "已接入搜韵网古典诗词知识图谱 API 样本。",
    };
  }
}

if (periodicalIndexSample.available) {
  const institutionSamples = (periodicalIndexSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["ren-jian-ci-hua", "ri-zhi-lu"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: detail.realWorldSignals?.sourceLabel
        ? `${detail.realWorldSignals.sourceLabel} + 全国报刊索引 API 样本`
        : "全国报刊索引 API 样本",
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        periodicalIndexSample.summary ??
        "已接入全国报刊索引近现代研究文献 API 样本。",
    };
  }
}

if (cbdbSummary.available) {
  const topDynastyLine = (cbdbSummary.topDynasties ?? [])
    .slice(0, 3)
    .map((item) => `${item.name} ${item.count.toLocaleString()}`)
    .join(" / ");

  for (const slug of [
    "shijing",
    "shangshu",
    "lunyu",
    "daxue",
    "zhongyong",
    "zhouyi",
    "xiaojing",
    "mengzi",
    "sishu-zhangju",
    "shiji",
    "zi-zhi-tong-jian",
  ] as const) {
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
