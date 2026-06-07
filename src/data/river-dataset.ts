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
    id: "book-liji",
    slug: "liji",
    title: "礼记",
    shortTitle: "礼记",
    dynasty: "两汉",
    year: 80,
    category: "经",
    school: "礼学经典",
    influence: 89,
    velocity: 0.34,
    branchLevel: 0,
    summary: "汇聚先秦至两汉礼学篇章，是《大学》《中庸》析出之前的制度与教化母体，也构成礼治秩序的主河段底座。",
    concepts: ["礼治", "教化", "制度", "家国秩序"],
    coordinates: [0.25, 0.98, 0.96],
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
  {
    id: "book-shangshu-zhengyi",
    slug: "shangshu-zhengyi",
    title: "尚书正义",
    shortTitle: "尚书正义",
    dynasty: "隋唐",
    year: 653,
    category: "经",
    school: "唐代经疏",
    influence: 83,
    velocity: 0.41,
    branchLevel: 1,
    summary: "唐代官学经疏代表，把《尚书》政教传统重新整理为可讲授、可校雠的制度化经典文本。",
    concepts: ["政教", "经疏", "典章", "正义"],
    coordinates: [-6.3, 0.88, -0.72],
  },
  {
    id: "book-gongyang-zhuan",
    slug: "gongyang-zhuan",
    title: "春秋公羊传",
    shortTitle: "公羊传",
    dynasty: "两汉",
    year: 90,
    category: "经",
    school: "春秋公羊学",
    influence: 78,
    velocity: 0.3,
    branchLevel: 2,
    summary: "以义例与微言大义阐释《春秋》，和《左传》共同构成后世春秋学分流的重要支脉。",
    concepts: ["春秋", "公羊学", "大义", "经世"],
    coordinates: [-1.55, -0.02, -1.62],
  },
  {
    id: "book-shuowen",
    slug: "shuowen",
    title: "说文解字",
    shortTitle: "说文解字",
    dynasty: "两汉",
    year: 121,
    category: "子",
    school: "小学训诂",
    influence: 81,
    velocity: 0.33,
    branchLevel: 1,
    summary: "以字形、字义为经籍注解立下基础，使经学、考据和版本校勘都获得更稳定的字训支撑。",
    concepts: ["文字", "训诂", "小学", "考据"],
    coordinates: [-3.25, 0.08, 1.26],
  },
  {
    id: "book-chuci-zhangju",
    slug: "chuci-zhangju",
    title: "楚辞章句",
    shortTitle: "楚辞章句",
    dynasty: "两汉",
    year: 158,
    category: "集",
    school: "楚辞学",
    influence: 75,
    velocity: 0.34,
    branchLevel: 2,
    summary: "王逸章句为骚体传统建立注释秩序，把《楚辞》重新接入后世诗学与总集编纂脉络。",
    concepts: ["楚辞", "骚体", "注释", "比兴"],
    coordinates: [5.58, 0.34, -0.92],
  },
  {
    id: "book-wenxin-diaolong",
    slug: "wenxin-diaolong",
    title: "文心雕龙",
    shortTitle: "文心雕龙",
    dynasty: "魏晋",
    year: 500,
    category: "集",
    school: "文论",
    influence: 79,
    velocity: 0.43,
    branchLevel: 2,
    summary: "系统总结古典文体、风格与创作论，是从经学源头走向诗文批评的一条关键理论支流。",
    concepts: ["文论", "风骨", "比兴", "体裁"],
    coordinates: [7.18, 0.62, -0.76],
  },
  {
    id: "book-wenxuan",
    slug: "wenxuan",
    title: "昭明文选",
    shortTitle: "文选",
    dynasty: "魏晋",
    year: 530,
    category: "集",
    school: "诗文总集",
    influence: 82,
    velocity: 0.39,
    branchLevel: 1,
    summary: "以总集方式重编先秦两汉魏晋文章诗赋，为后世诗文阅读、科举与批评提供共同底本。",
    concepts: ["总集", "诗赋", "选本", "文体"],
    coordinates: [8.1, 0.18, -0.1],
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
  {
    id: "edge-shangshu-zhengyi-1",
    source: "book-shangshu-zhengyi",
    target: "book-shangshu",
    layer: "metadata",
    confidence: 1,
    label: "官学经疏",
    evidence: "《尚书正义》以唐代义疏形式重整《尚书》经文与政教传统，形成后世讲授底本。",
  },
  {
    id: "edge-gongyang-1",
    source: "book-gongyang-zhuan",
    target: "book-zuozhuan",
    layer: "semantic",
    confidence: 0.71,
    label: "春秋分流",
    evidence: "《公羊传》与《左传》共同围绕《春秋》展开，却形成义例与叙事两条截然不同的解释支流。",
  },
  {
    id: "edge-shuowen-1",
    source: "book-shuowen",
    target: "book-shangshu",
    layer: "explicit",
    confidence: 0.9,
    label: "字训释经",
    evidence: "《说文解字》通过文字训释为《尚书》等上古经典的经文解释提供稳定字义依据。",
  },
  {
    id: "edge-shuowen-2",
    source: "book-shuowen",
    target: "book-zhouyi",
    layer: "semantic",
    confidence: 0.74,
    label: "象义训释",
    evidence: "《周易》象数与辞义解释长期借助小学训诂系统，《说文解字》成为其关键支撑节点。",
  },
  {
    id: "edge-chuci-1",
    source: "book-chuci-zhangju",
    target: "book-shijing",
    layer: "semantic",
    confidence: 0.72,
    label: "比兴转写",
    evidence: "《楚辞章句》把《诗经》的比兴传统进一步转写为骚体抒情与注释系统。",
  },
  {
    id: "edge-wenxuan-1",
    source: "book-wenxuan",
    target: "book-chuci-zhangju",
    layer: "metadata",
    confidence: 0.87,
    label: "总集纳入",
    evidence: "《昭明文选》以总集编选方式承接《楚辞》传统，使骚体文本进入更广泛的阅读与批评链路。",
  },
  {
    id: "edge-wenxin-1",
    source: "book-wenxin-diaolong",
    target: "book-shijing",
    layer: "semantic",
    confidence: 0.76,
    label: "风雅立论",
    evidence: "《文心雕龙》大量以风雅传统为文论起点，把经学中的诗教资源转化为系统文体论。",
  },
  {
    id: "edge-wenxin-2",
    source: "book-wenxin-diaolong",
    target: "book-chuci-zhangju",
    layer: "semantic",
    confidence: 0.73,
    label: "骚体评述",
    evidence: "《文心雕龙》对骚体、风骨与辞采的总结，与《楚辞章句》的注释脉络构成诗学双支流。",
  },
  {
    id: "edge-rjch-2",
    source: "book-ren-jian-ci-hua",
    target: "book-wenxin-diaolong",
    layer: "influence",
    confidence: 0.61,
    label: "诗论回响",
    evidence: "《人间词话》的境界论虽已近代化，但仍延续古典文论中关于风格、体性与抒情的核心问题。",
  },
  {
    id: "edge-rjch-3",
    source: "book-ren-jian-ci-hua",
    target: "book-wenxuan",
    layer: "influence",
    confidence: 0.58,
    label: "总集回读",
    evidence: "近代词学批评重新回读《文选》以来的选本阅读传统，把古典诗文资源转化为现代审美判断。",
  },
  {
    id: "edge-rizhilu-2",
    source: "book-ri-zhi-lu",
    target: "book-shuowen",
    layer: "semantic",
    confidence: 0.69,
    label: "考据回流",
    evidence: "《日知录》的经世考据与小学训诂传统互相支撑，使文字学重新回流到制度与经义讨论中。",
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
      sourceLabel: "纪传人物库 + 上图活动资料 + 搜韵知识图谱资料",
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
      sourceLabel: "纪传人物库 + 上海图书馆活动资料",
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
      {
        id: "passage-zy-2",
        section: "中和",
        original: "喜怒哀乐之未发谓之中，发而皆中节谓之和。中也者，天下之大本也；和也者，天下之达道也。",
        links: [
          {
            id: "passage-zy-2-link-1",
            quote: "礼之节文转为中和秩序",
            sourceBookId: "book-liji",
            sourceTitle: "礼记",
            layer: "explicit",
            confidenceLabel: "高",
            evidence: "《中庸》原出《礼记》，关于“中节”的论述直接承接礼学中的节文与秩序观。",
          },
          {
            id: "passage-zy-2-link-2",
            quote: "变化与中和的天道人事联动",
            sourceBookId: "book-zhouyi",
            sourceTitle: "周易",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《周易》强调阴阳变化与人事秩序的贯通，《中庸》则把这种关系转写为中和工夫与达道结构。",
          },
        ],
        tracePath: [
          {
            id: "trace-zy-4",
            title: "礼记",
            relation: "礼学背景",
            note: "“中节”首先来自礼学对节文与秩序的组织。 ",
          },
          {
            id: "trace-zy-5",
            title: "中庸",
            relation: "工夫提炼",
            note: "将礼学秩序提升为中和与诚的修养结构。",
          },
          {
            id: "trace-zy-6",
            title: "周易",
            relation: "天道互证",
            note: "后世理学再以《易》学天道论为《中庸》中和结构提供形上支撑。",
          },
          {
            id: "trace-zy-7",
            title: "四书章句集注",
            relation: "教材定型",
            note: "朱熹再把这一结构稳定为四书学习中的核心义理层。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-zy-2",
            targetTitle: "周易",
            relation: "天道互释",
            note: "理学传统不断让《中庸》中和论与《周易》变化论互相解释。",
            confidenceLabel: "中",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "纪传人物库 + 上海图书馆活动资料",
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
      sourceLabel: "纪传人物库 + 上海图书馆活动资料 + 搜韵知识图谱资料",
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
      sourceLabel: "纪传人物库 + 上海图书馆活动资料",
      venueSummary: "补入《孝经》后，主河道可以更自然地延伸到家礼、教化与家族传播叙事，为后续接家谱数据预留落点。",
    },
  },
  "shangshu-zhengyi": {
    bookId: "book-shangshu-zhengyi",
    heroMetric: {
      directCitations: 68,
      downstreamInfluence: 186,
      coveredRegions: 5,
    },
    spread: [
      {
        id: "spread-sszy-1",
        fromPlaceId: "place-changan-sszy",
        toPlaceId: "place-luoyang-sszy",
        startYear: 653,
        endYear: 900,
        volume: 74,
      },
      {
        id: "spread-sszy-2",
        fromPlaceId: "place-luoyang-sszy",
        toPlaceId: "place-kaifeng-sszy",
        startYear: 900,
        endYear: 1100,
        volume: 80,
      },
    ],
    people: [
      {
        id: "person-kongyingda-sszy",
        name: "孔颖达",
        role: "注者",
        birthYear: 574,
        deathYear: 648,
        era: "隋唐",
        bio: "唐代经疏体系的核心编纂者，以《尚书正义》把上古政教经典整理为官学讲授主线。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-jia-gongyan-sszy",
        name: "贾公彦",
        role: "评论者",
        birthYear: 650,
        deathYear: 725,
        era: "隋唐",
        bio: "唐代礼学与经疏系统的重要人物，与孔颖达共同构成官学经释整理的时代背景。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-changan-sszy",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "唐代国子监与《五经正义》编纂中心。",
      },
      {
        id: "place-luoyang-sszy",
        name: "洛阳",
        lat: 34.6197,
        lng: 112.454,
        note: "唐后经学流布与士人讲习的重要节点。",
      },
      {
        id: "place-kaifeng-sszy",
        name: "开封",
        lat: 34.7972,
        lng: 114.3076,
        note: "宋代经义教学继续接续唐代正义系统。",
      },
    ],
    versions: [
      {
        id: "version-sszy-1",
        label: "唐写《尚书正义》本系",
        year: 653,
        place: "长安",
        library: "国子监",
        status: "佚失",
        editionType: "祖本",
        note: "唐代五经正义系统中形成的《尚书正义》早期官学底本。",
      },
      {
        id: "version-sszy-2",
        label: "北宋监本《尚书正义》",
        year: 1000,
        place: "开封",
        library: "国子监",
        status: "存世",
        parentId: "version-sszy-1",
        editionType: "刻本",
        note: "宋代经义教育沿用唐代义疏结构，形成更稳定的流布本系。",
      },
    ],
    timeline: [
      {
        id: "tl-sszy-1",
        year: 653,
        title: "《尚书正义》进入官学体系",
        detail: "唐代以义疏方式重整《尚书》，使其成为可统一讲授的政教经典。",
      },
      {
        id: "tl-sszy-2",
        year: 1000,
        title: "宋代监本继续流布",
        detail: "北宋承接唐代经疏传统，把《尚书正义》继续纳入学校教育主线。",
      },
    ],
    passages: [
      {
        id: "passage-sszy-1",
        section: "尧典义疏",
        original: "正义重在疏通经旨，使典章政教之义可讲、可授、可校。",
        links: [
          {
            id: "passage-sszy-1-link-1",
            quote: "上古政教源流",
            sourceBookId: "book-shangshu",
            sourceTitle: "尚书",
            layer: "explicit",
            confidenceLabel: "高",
            evidence: "《尚书正义》直接以《尚书》经文为底本，围绕典章政教语义做系统疏解。",
          },
        ],
        tracePath: [
          {
            id: "trace-sszy-1",
            title: "尚书",
            relation: "源典",
            note: "上古政教经典提供全部经文与问题意识。",
          },
          {
            id: "trace-sszy-2",
            title: "尚书正义",
            relation: "官学定型",
            note: "将经文转写为可统一讲授的义疏层。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-sszy-1",
            targetTitle: "资治通鉴",
            relation: "治道回响",
            note: "唐宋政教解释传统继续影响后世历史叙述中的治道判断。",
            confidenceLabel: "中",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "纪传人物库 + 南京图书馆馆藏资料",
      venueSummary: "补入《尚书正义》后，主河道里的《尚书》不再只是源头节点，而是多出一个能讲清官学经疏化的中继层。",
    },
  },
  "gongyang-zhuan": {
    bookId: "book-gongyang-zhuan",
    heroMetric: {
      directCitations: 64,
      downstreamInfluence: 172,
      coveredRegions: 5,
    },
    spread: [
      {
        id: "spread-gyz-1",
        fromPlaceId: "place-changan-gyz",
        toPlaceId: "place-luoyang-gyz",
        startYear: 90,
        endYear: 220,
        volume: 66,
      },
      {
        id: "spread-gyz-2",
        fromPlaceId: "place-luoyang-gyz",
        toPlaceId: "place-kaifeng-gyz",
        startYear: 950,
        endYear: 1100,
        volume: 74,
      },
    ],
    people: [
      {
        id: "person-he-xiu-gyz",
        name: "何休",
        role: "注者",
        birthYear: 129,
        deathYear: 182,
        era: "两汉",
        bio: "东汉公羊学代表人物，以《春秋公羊解诂》强化义例和微言大义的解释传统。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-dong-zhongshu-gyz",
        name: "董仲舒",
        role: "评论者",
        birthYear: -179,
        deathYear: -104,
        era: "两汉",
        bio: "汉代公羊学与经世政治结合的重要人物，使《春秋》义例走向制度与王道论述。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-changan-gyz",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "两汉今文经学与春秋公羊学的重要传播中心。",
      },
      {
        id: "place-luoyang-gyz",
        name: "洛阳",
        lat: 34.6197,
        lng: 112.454,
        note: "东汉经学辩论与注疏传统继续汇聚的节点。",
      },
      {
        id: "place-kaifeng-gyz",
        name: "开封",
        lat: 34.7972,
        lng: 114.3076,
        note: "宋代理学与春秋学重新回看义例传统的枢纽空间。",
      },
    ],
    versions: [
      {
        id: "version-gyz-1",
        label: "《春秋公羊传》汉写本系",
        year: 90,
        place: "长安",
        library: "今文经学传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "两汉今文经学背景下形成较稳定的公羊学文本层。",
      },
      {
        id: "version-gyz-2",
        label: "何休《公羊解诂》本",
        year: 180,
        place: "洛阳",
        library: "经学注释系统",
        status: "存世",
        parentId: "version-gyz-1",
        editionType: "重刊本",
        note: "以注释方式强化公羊义例与微言大义的阐释路线。",
      },
      {
        id: "version-gyz-3",
        label: "宋刊《公羊传注疏》本",
        year: 1050,
        place: "开封",
        library: "国子监",
        status: "存世",
        parentId: "version-gyz-2",
        editionType: "刻本",
        note: "宋代将公羊学重新纳入经义教学与校勘系统，使其不止停留在汉代旧注层。",
      },
    ],
    timeline: [
      {
        id: "tl-gyz-1",
        year: 90,
        title: "《公羊传》进入两汉今文主线",
        detail: "今文经学把《春秋公羊传》推为政治义例和王道论述的重要依据。",
      },
      {
        id: "tl-gyz-2",
        year: 180,
        title: "何休《公羊解诂》成型",
        detail: "东汉注释传统进一步把公羊学稳定为一条可讲授、可辩论的春秋支流。",
      },
      {
        id: "tl-gyz-3",
        year: 1050,
        title: "宋刊注疏再度激活公羊学",
        detail: "两宋经义教育与校勘传统重新回看公羊义例，使其在春秋学内部继续保持可讨论性。",
      },
    ],
    passages: [
      {
        id: "passage-gyz-1",
        section: "隐公元年",
        original: "春王正月，微言大义寓于例中，褒贬之旨不尽在叙事。",
        links: [
          {
            id: "passage-gyz-1-link-1",
            quote: "叙事与义例的春秋双分流",
            sourceBookId: "book-zuozhuan",
            sourceTitle: "春秋左传",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《左传》重叙事铺陈，《公羊传》重义例发明，两者共同构成后世春秋学的双支流。",
          },
        ],
        tracePath: [
          {
            id: "trace-gyz-1",
            title: "春秋左传",
            relation: "并行参照",
            note: "叙事化春秋解释与公羊义例传统长期并置。 ",
          },
          {
            id: "trace-gyz-2",
            title: "春秋公羊传",
            relation: "义例深化",
            note: "把《春秋》转读为微言大义与制度判断的经典文本。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-gyz-1",
            targetTitle: "日知录",
            relation: "经世回响",
            note: "经世议论对春秋大义的回看，仍能追溯到公羊学的制度判断传统。",
            confidenceLabel: "低",
          },
        ],
      },
      {
        id: "passage-gyz-2",
        section: "解诂例义",
        original: "大一统与王道褒贬之说，使春秋不只是记事之书，更成为制度与政治判断之书。",
        links: [
          {
            id: "passage-gyz-2-link-1",
            quote: "治道判断的经义化",
            sourceBookId: "book-shangshu",
            sourceTitle: "尚书",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《尚书》的政教话语与《公羊传》的王道义例在两汉经世讨论中长期互相借力。",
          },
        ],
        tracePath: [
          {
            id: "trace-gyz-3",
            title: "尚书",
            relation: "政教背景",
            note: "上古政教经典提供王道与制度讨论的语言资源。",
          },
          {
            id: "trace-gyz-4",
            title: "春秋公羊传",
            relation: "义例转写",
            note: "把政治判断压缩到春秋笔法与义例结构之中。",
          },
          {
            id: "trace-gyz-5",
            title: "日知录",
            relation: "经世回看",
            note: "后世经世论述继续从春秋大义与制度判断中寻找资源。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-gyz-2",
            targetTitle: "日知录",
            relation: "制度回响",
            note: "经世议论持续回看春秋大义，把义例判断转入现实制度讨论。",
            confidenceLabel: "低",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "纪传人物库 + 上海图书馆活动资料",
      venueSummary: "补入《公羊传》后，春秋学不再只有《左传》叙事一支，而能直接展示“叙事—义例”双分流。",
    },
  },
  shuowen: {
    bookId: "book-shuowen",
    heroMetric: {
      directCitations: 71,
      downstreamInfluence: 194,
      coveredRegions: 5,
    },
    spread: [
      {
        id: "spread-sw-1",
        fromPlaceId: "place-luoyang-sw",
        toPlaceId: "place-changan-sw",
        startYear: 121,
        endYear: 650,
        volume: 70,
      },
      {
        id: "spread-sw-2",
        fromPlaceId: "place-changan-sw",
        toPlaceId: "place-suzhou-sw",
        startYear: 900,
        endYear: 1750,
        volume: 82,
      },
    ],
    people: [
      {
        id: "person-xushen-sw",
        name: "许慎",
        role: "作者",
        birthYear: 58,
        deathYear: 147,
        era: "两汉",
        bio: "以六书体系组织字形与字义，为经籍训诂、校勘与考据奠定长期基础。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "著",
      },
      {
        id: "person-duanyu-cai-sw",
        name: "段玉裁",
        role: "评论者",
        birthYear: 1735,
        deathYear: 1815,
        era: "明清",
        bio: "清代小学与考据学代表人物，通过《说文解字注》重新激活文字训诂传统。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-luoyang-sw",
        name: "洛阳",
        lat: 34.6197,
        lng: 112.454,
        note: "东汉经学与文字学整理的重要中心。",
      },
      {
        id: "place-changan-sw",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "唐代经义与训诂系统继续汇合的节点。",
      },
      {
        id: "place-suzhou-sw",
        name: "苏州",
        lat: 31.2989,
        lng: 120.5853,
        note: "清代小学、考据与校勘传统活跃地区。",
      },
    ],
    versions: [
      {
        id: "version-sw-1",
        label: "《说文解字》东汉写本系",
        year: 121,
        place: "洛阳",
        library: "经学传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "许慎原书奠定以文字学支撑经学解释的基础。",
      },
      {
        id: "version-sw-2",
        label: "《说文解字注》清刻本",
        year: 1815,
        place: "苏州",
        library: "清代学人刊本系统",
        status: "存世",
        parentId: "version-sw-1",
        editionType: "重刊本",
        note: "段玉裁注本使《说文》重新进入考据与校勘主线。",
      },
    ],
    timeline: [
      {
        id: "tl-sw-1",
        year: 121,
        title: "《说文解字》成书",
        detail: "许慎系统整理字形、字义与六书理论，使经学获得更稳定的文字学支撑。",
      },
      {
        id: "tl-sw-2",
        year: 1815,
        title: "清代《说文解字注》流布",
        detail: "小学与考据学回流到经典解释与版本校勘，重建《说文》的中心地位。",
      },
    ],
    passages: [
      {
        id: "passage-sw-1",
        section: "叙",
        original: "文字者，经艺之本，王政之始，前人所以垂后，后人所以识古。",
        links: [
          {
            id: "passage-sw-1-link-1",
            quote: "以文字训诂通经",
            sourceBookId: "book-shangshu",
            sourceTitle: "尚书",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《说文》并不直接引《尚书》，但它为《尚书》等古经疑难字词的解释提供基础工具。",
          },
        ],
        tracePath: [
          {
            id: "trace-sw-1",
            title: "尚书",
            relation: "释经需求",
            note: "古经中的疑难字词推动文字学工具成长。",
          },
          {
            id: "trace-sw-2",
            title: "说文解字",
            relation: "训诂定型",
            note: "把释经需求沉淀为更稳定的文字学底座。",
          },
          {
            id: "trace-sw-3",
            title: "日知录",
            relation: "考据回流",
            note: "清代经世考据重新把文字学带回制度与经义讨论。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-sw-1",
            targetTitle: "日知录",
            relation: "考据支撑",
            note: "清代朴学通过《说文》重建经义、制度与文字之间的可证性。",
            confidenceLabel: "中",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "纪传人物库 + 复旦馆藏资料",
      venueSummary: "补入《说文解字》后，经学主河道与训诂、考据支流之间有了可见的中继节点，不再只是抽象的“考据学”标签。",
    },
  },
  "chuci-zhangju": {
    bookId: "book-chuci-zhangju",
    heroMetric: {
      directCitations: 69,
      downstreamInfluence: 188,
      coveredRegions: 5,
    },
    spread: [
      {
        id: "spread-cczj-1",
        fromPlaceId: "place-luoyang-cczj",
        toPlaceId: "place-jiankang-cczj",
        startYear: 158,
        endYear: 500,
        volume: 68,
      },
      {
        id: "spread-cczj-2",
        fromPlaceId: "place-jiankang-cczj",
        toPlaceId: "place-hangzhou-cczj",
        startYear: 500,
        endYear: 1200,
        volume: 78,
      },
    ],
    people: [
      {
        id: "person-wangyi-cczj",
        name: "王逸",
        role: "注者",
        birthYear: 89,
        deathYear: 158,
        era: "两汉",
        bio: "《楚辞章句》编注者，使骚体传统第一次以较完整的注释秩序进入后世阅读系统。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-xie-lingyun-cczj",
        name: "谢灵运",
        role: "评论者",
        birthYear: 385,
        deathYear: 433,
        era: "魏晋",
        bio: "山水诗传统持续回读骚体资源，使《楚辞》从注释系统进入更广阔的诗学实践场。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-luoyang-cczj",
        name: "洛阳",
        lat: 34.6197,
        lng: 112.454,
        note: "东汉注释与文体整理的重要据点。",
      },
      {
        id: "place-jiankang-cczj",
        name: "建康",
        lat: 32.0603,
        lng: 118.7969,
        note: "魏晋六朝诗文批评与总集编纂持续吸纳《楚辞》传统。",
      },
      {
        id: "place-hangzhou-cczj",
        name: "杭州",
        lat: 30.2741,
        lng: 120.1551,
        note: "宋以后诗学阅读继续通过选本、评点重估骚体资源。",
      },
    ],
    versions: [
      {
        id: "version-cczj-1",
        label: "《楚辞章句》东汉写本系",
        year: 158,
        place: "洛阳",
        library: "文献注释系统",
        status: "佚失",
        editionType: "祖本",
        note: "东汉注释系统为《楚辞》建立相对稳定的阅读入口。",
      },
      {
        id: "version-cczj-2",
        label: "宋刻《楚辞章句》本",
        year: 1100,
        place: "杭州",
        library: "书院刊刻系统",
        status: "存世",
        parentId: "version-cczj-1",
        editionType: "刻本",
        note: "宋代刊本使骚体注释重新进入更广泛的诗学阅读网络。",
      },
      {
        id: "version-cczj-3",
        label: "明刊《楚辞章句》评点本",
        year: 1580,
        place: "杭州",
        library: "诗文评点系统",
        status: "存世",
        parentId: "version-cczj-2",
        editionType: "重刊本",
        note: "明清评点把骚体传统继续带入选本阅读、诗学批评与案头讲习环境。",
      },
    ],
    timeline: [
      {
        id: "tl-cczj-1",
        year: 158,
        title: "《楚辞章句》形成注释秩序",
        detail: "王逸通过章句让骚体文本第一次以成体系的注释状态流布。",
      },
      {
        id: "tl-cczj-2",
        year: 1100,
        title: "宋刻本继续放大骚体影响",
        detail: "诗学批评、总集阅读与书院刊刻共同延续《楚辞》传统。",
      },
      {
        id: "tl-cczj-3",
        year: 1580,
        title: "明清评点延长骚体生命",
        detail: "评点与重刊使《楚辞》不只作为古注保存，更作为持续可讨论的诗学资源被重新激活。",
      },
    ],
    passages: [
      {
        id: "passage-cczj-1",
        section: "离骚义脉",
        original: "比兴之辞与骚体抒情，在章句系统中被整理为可读、可注、可续写的诗学资源。",
        links: [
          {
            id: "passage-cczj-1-link-1",
            quote: "风雅比兴的再转写",
            sourceBookId: "book-shijing",
            sourceTitle: "诗经",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《楚辞章句》通过注释把《诗经》的比兴资源进一步转写为骚体抒情和象征系统。",
          },
        ],
        tracePath: [
          {
            id: "trace-cczj-1",
            title: "诗经",
            relation: "风雅源头",
            note: "比兴传统提供最早的诗性资源。",
          },
          {
            id: "trace-cczj-2",
            title: "楚辞章句",
            relation: "骚体定型",
            note: "通过章句把骚体资源整理成更稳定的注释与阅读系统。",
          },
          {
            id: "trace-cczj-3",
            title: "昭明文选",
            relation: "总集纳入",
            note: "骚体随后被重新纳入更大的诗文总集谱系。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-cczj-1",
            targetTitle: "昭明文选",
            relation: "总集承接",
            note: "《文选》把骚体重新接入更广阔的诗文阅读与批评环境。",
            confidenceLabel: "高",
          },
        ],
      },
      {
        id: "passage-cczj-2",
        section: "骚体义脉",
        original: "章句之功，不止释词句，更在把抒情、象征与历史怨愤整理为后世可继承的诗学结构。",
        links: [
          {
            id: "passage-cczj-2-link-1",
            quote: "文论系统继续接手骚体资源",
            sourceBookId: "book-wenxin-diaolong",
            sourceTitle: "文心雕龙",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《文心雕龙》把《楚辞》中的风骨、辞采与抒情结构进一步纳入系统文论。",
          },
        ],
        tracePath: [
          {
            id: "trace-cczj-4",
            title: "楚辞章句",
            relation: "注释定型",
            note: "先把骚体资源整理成稳定注释层。",
          },
          {
            id: "trace-cczj-5",
            title: "文心雕龙",
            relation: "理论接手",
            note: "文论进一步把骚体资源转译为风格、风骨与辞采问题。",
          },
          {
            id: "trace-cczj-6",
            title: "昭明文选",
            relation: "总集扩散",
            note: "骚体资源随后进入更广的选本传播与公共阅读环境。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-cczj-2",
            targetTitle: "文心雕龙",
            relation: "理论回收",
            note: "骚体注释系统为六朝文论提供了可抽象化的诗学对象。",
            confidenceLabel: "中",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "南湖文献 + 搜韵知识图谱资料",
      venueSummary: "补入《楚辞章句》后，诗学支流从风雅源头到总集编排之间多了一个可见的“骚体注释中继层”。",
    },
  },
  "wenxin-diaolong": {
    bookId: "book-wenxin-diaolong",
    heroMetric: {
      directCitations: 72,
      downstreamInfluence: 196,
      coveredRegions: 6,
    },
    spread: [
      {
        id: "spread-wxdl-1",
        fromPlaceId: "place-jiankang-wxdl",
        toPlaceId: "place-changan-wxdl",
        startYear: 500,
        endYear: 700,
        volume: 74,
      },
      {
        id: "spread-wxdl-2",
        fromPlaceId: "place-changan-wxdl",
        toPlaceId: "place-hangzhou-wxdl",
        startYear: 900,
        endYear: 1900,
        volume: 84,
      },
    ],
    people: [
      {
        id: "person-liuxie-wxdl",
        name: "刘勰",
        role: "作者",
        birthYear: 465,
        deathYear: 522,
        era: "魏晋",
        bio: "系统总结古典文体、风格与创作论，把经学诗教资源转写为完整文论体系。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "著",
      },
      {
        id: "person-zhong-rong-wxdl",
        name: "钟嵘",
        role: "评论者",
        birthYear: 468,
        deathYear: 518,
        era: "魏晋",
        bio: "《诗品》与《文心雕龙》共同构成六朝诗文批评高峰，使风格、体性与比兴论更系统化。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
      {
        id: "person-wangguowei-wxdl",
        name: "王国维",
        role: "评论者",
        birthYear: 1877,
        deathYear: 1927,
        era: "近现代",
        bio: "近代审美批评不断回读刘勰的文体、风格与抒情问题，使古典文论继续进入现代讨论。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-jiankang-wxdl",
        name: "建康",
        lat: 32.0603,
        lng: 118.7969,
        note: "六朝文论与诗文批评系统成熟的重要中心。",
      },
      {
        id: "place-changan-wxdl",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "唐代文章学与总集阅读继续吸纳六朝文论资源。",
      },
      {
        id: "place-hangzhou-wxdl",
        name: "杭州",
        lat: 30.2741,
        lng: 120.1551,
        note: "宋以后诗文评点和近代审美回读的持续发生地。",
      },
    ],
    versions: [
      {
        id: "version-wxdl-1",
        label: "《文心雕龙》六朝写本系",
        year: 500,
        place: "建康",
        library: "文论传抄系统",
        status: "佚失",
        editionType: "祖本",
        note: "六朝文论资源在写本层逐步稳定。",
      },
      {
        id: "version-wxdl-2",
        label: "明刊《文心雕龙》本",
        year: 1550,
        place: "杭州",
        library: "文集刊刻系统",
        status: "存世",
        parentId: "version-wxdl-1",
        editionType: "重刊本",
        note: "明清重刊使《文心雕龙》重新进入诗文批评与学术整理主线。",
      },
      {
        id: "version-wxdl-3",
        label: "清校《文心雕龙》评注本",
        year: 1750,
        place: "杭州",
        library: "学术整理系统",
        status: "存世",
        parentId: "version-wxdl-2",
        editionType: "整理本",
        note: "清代校勘与评注进一步把《文心雕龙》推入文章学、诗学与目录学整理链路。",
      },
    ],
    timeline: [
      {
        id: "tl-wxdl-1",
        year: 500,
        title: "《文心雕龙》成书",
        detail: "六朝文论把经学诗教、骚体资源和文章分类统一到更完整的理论系统中。",
      },
      {
        id: "tl-wxdl-2",
        year: 1550,
        title: "明清重刊推动再传播",
        detail: "《文心雕龙》继续被用于文体论、风格论和古典审美重估。",
      },
      {
        id: "tl-wxdl-3",
        year: 1750,
        title: "清校评注本进入学术整理主线",
        detail: "校勘、评注与目录学整理使《文心雕龙》从案头文论资源转为更稳定的学术经典。",
      },
    ],
    passages: [
      {
        id: "passage-wxdl-1",
        section: "明诗",
        original: "论文之要，在辨体、审风、明兴寄，使古典诗文资源能够被系统理解与再度创造。",
        links: [
          {
            id: "passage-wxdl-1-link-1",
            quote: "风雅与比兴的理论化",
            sourceBookId: "book-shijing",
            sourceTitle: "诗经",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《文心雕龙》不断把风雅、比兴和教化资源理论化，回应《诗经》以来的诗教传统。",
          },
          {
            id: "passage-wxdl-1-link-2",
            quote: "骚体与风骨的并入",
            sourceBookId: "book-chuci-zhangju",
            sourceTitle: "楚辞章句",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《文心雕龙》以更理论化的方式总结骚体、风骨与辞采问题，使《楚辞》资源进入系统文论。",
          },
        ],
        tracePath: [
          {
            id: "trace-wxdl-1",
            title: "诗经",
            relation: "风雅源头",
            note: "风雅与比兴提供最早的诗学资源。",
          },
          {
            id: "trace-wxdl-2",
            title: "楚辞章句",
            relation: "骚体注释",
            note: "骚体资源先被注释系统整理出来。",
          },
          {
            id: "trace-wxdl-3",
            title: "文心雕龙",
            relation: "理论统摄",
            note: "刘勰把风雅、骚体和文章体类统一进文论框架。",
          },
          {
            id: "trace-wxdl-4",
            title: "人间词话",
            relation: "近代回响",
            note: "近代审美批评继续回看古典文论中的风格与抒情问题。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-wxdl-1",
            targetTitle: "人间词话",
            relation: "审美回响",
            note: "近代词学批评对境界、风格和抒情问题的思考，仍与六朝文论保持隐性对话。",
            confidenceLabel: "低",
          },
        ],
      },
      {
        id: "passage-wxdl-2",
        section: "辨骚",
        original: "骚体之能，在于以风骨、辞采与抒情结构打开古典诗文的另一条高张支路。",
        links: [
          {
            id: "passage-wxdl-2-link-1",
            quote: "总集编排继续放大文论影响",
            sourceBookId: "book-wenxuan",
            sourceTitle: "昭明文选",
            layer: "semantic",
            confidenceLabel: "中",
            evidence: "《昭明文选》把《文心雕龙》所讨论的体类与风格问题继续沉到选本阅读与公共传播环境中。",
          },
        ],
        tracePath: [
          {
            id: "trace-wxdl-5",
            title: "楚辞章句",
            relation: "对象形成",
            note: "骚体先在注释系统中被稳定下来。",
          },
          {
            id: "trace-wxdl-6",
            title: "文心雕龙",
            relation: "理论升格",
            note: "将骚体资源上升为可反复调用的文论范畴。",
          },
          {
            id: "trace-wxdl-7",
            title: "昭明文选",
            relation: "阅读扩散",
            note: "总集编排把文论背后的体类秩序扩散到更大阅读共同体中。",
          },
          {
            id: "trace-wxdl-8",
            title: "人间词话",
            relation: "近代回响",
            note: "近代审美继续从古典文论问题中提炼境界与风格判断。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-wxdl-2",
            targetTitle: "昭明文选",
            relation: "选本放大",
            note: "文论中抽象出的体类与风格判断，最终被选本系统带入更广泛的阅读传播中。",
            confidenceLabel: "中",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "南湖文献 + 全国报刊索引资料",
      venueSummary: "补入《文心雕龙》后，诗学支流从“骚体注释”到“近代词论”之间有了完整的六朝文论中段，不再只靠首尾跳接。",
    },
  },
  wenxuan: {
    bookId: "book-wenxuan",
    heroMetric: {
      directCitations: 77,
      downstreamInfluence: 205,
      coveredRegions: 6,
    },
    spread: [
      {
        id: "spread-wx-1",
        fromPlaceId: "place-jiankang-wx",
        toPlaceId: "place-changan-wx",
        startYear: 530,
        endYear: 700,
        volume: 78,
      },
      {
        id: "spread-wx-2",
        fromPlaceId: "place-changan-wx",
        toPlaceId: "place-hangzhou-wx",
        startYear: 900,
        endYear: 1250,
        volume: 88,
      },
    ],
    people: [
      {
        id: "person-xiao-tong-wx",
        name: "萧统",
        role: "编者",
        birthYear: 501,
        deathYear: 531,
        era: "魏晋",
        bio: "昭明太子，通过《文选》把先秦两汉魏晋文章诗赋重新编排为共享阅读底本。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "校",
      },
      {
        id: "person-li-shan-wx",
        name: "李善",
        role: "注者",
        birthYear: 630,
        deathYear: 689,
        era: "隋唐",
        bio: "《文选注》代表人物，使总集阅读进一步进入注释化、考据化轨道。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 1,
        relationType: "注",
      },
      {
        id: "person-wangguowei-wx",
        name: "王国维",
        role: "评论者",
        birthYear: 1877,
        deathYear: 1927,
        era: "近现代",
        bio: "近代诗词批评不断回读《文选》以来的总集传统，把古典资源转化为现代审美判断。",
        source: "curated",
        sourceStatus: "curated",
        relationTier: 2,
        relationType: "评",
      },
    ],
    places: [
      {
        id: "place-jiankang-wx",
        name: "建康",
        lat: 32.0603,
        lng: 118.7969,
        note: "南朝总集编纂与文体整理的重要中心。",
      },
      {
        id: "place-changan-wx",
        name: "长安",
        lat: 34.3416,
        lng: 108.9398,
        note: "唐代《文选》注释与科举阅读传统继续放大其影响力。",
      },
      {
        id: "place-hangzhou-wx",
        name: "杭州",
        lat: 30.2741,
        lng: 120.1551,
        note: "宋以后诗文批评与选本阅读的重要空间。",
      },
    ],
    versions: [
      {
        id: "version-wx-1",
        label: "南朝《文选》编本系",
        year: 530,
        place: "建康",
        library: "宫廷编纂系统",
        status: "佚失",
        editionType: "祖本",
        note: "总集编选形态奠定后世诗文阅读共同底本。",
      },
      {
        id: "version-wx-2",
        label: "李善注《文选》本",
        year: 680,
        place: "长安",
        library: "士人注释系统",
        status: "存世",
        parentId: "version-wx-1",
        editionType: "重刊本",
        note: "李善注使《文选》兼具选本与注本双重经典地位。",
      },
    ],
    timeline: [
      {
        id: "tl-wx-1",
        year: 530,
        title: "《昭明文选》编成",
        detail: "诗文总集把先秦两汉魏晋文章纳入统一阅读谱系。",
      },
      {
        id: "tl-wx-2",
        year: 680,
        title: "李善注形成稳定传播层",
        detail: "《文选》从总集进一步进入注释化、教学化和科举化轨道。",
      },
    ],
    passages: [
      {
        id: "passage-wx-1",
        section: "选本之义",
        original: "总集之功，在于为后学重定可读、可传、可评之文脉次序。",
        links: [
          {
            id: "passage-wx-1-link-1",
            quote: "骚体与总集重新接续",
            sourceBookId: "book-chuci-zhangju",
            sourceTitle: "楚辞章句",
            layer: "explicit",
            confidenceLabel: "高",
            evidence: "《文选》将《楚辞》传统纳入更大的诗文阅读序列，使骚体不再孤立存在。",
          },
        ],
        tracePath: [
          {
            id: "trace-wx-1",
            title: "楚辞章句",
            relation: "注释前驱",
            note: "先有对骚体文本的注释整理，后有总集式再编排。",
          },
          {
            id: "trace-wx-2",
            title: "昭明文选",
            relation: "总集重组",
            note: "把分散文本重新纳入统一诗文谱系。",
          },
          {
            id: "trace-wx-3",
            title: "人间词话",
            relation: "近代回读",
            note: "近代审美判断继续通过选本传统回看古典资源。",
          },
        ],
        downstreamInfluence: [
          {
            id: "down-wx-1",
            targetTitle: "人间词话",
            relation: "选本回响",
            note: "总集阅读方式为近代词学批评提供长期的古典资源组织框架。",
            confidenceLabel: "低",
          },
        ],
      },
    ],
    realWorldSignals: {
      sourceLabel: "南湖文献 + 城市专题片资料",
      venueSummary: "补入《昭明文选》后，诗学支流不再只停在《诗经》与近代词话之间，而能清楚看见“注释—总集—近代回读”的中段链路。",
    },
  },
};

const books = Array.from(
  new Map(
    [
      ...((supplementPayload.curatedBooks ?? supplementPayload.demoBooks ?? []) as RealSupplementBook[]),
      ...coreClassicExtensions,
    ].map((book) => [book.slug, book]),
  ).values(),
) as RealSupplementBook[];
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

const mergeById = <T extends { id: string }>(existing: T[], additions: T[]) => {
  const merged = new Map(existing.map((item) => [item.id, item]));
  for (const item of additions) {
    merged.set(item.id, item);
  }
  return Array.from(merged.values());
};

const appendSourceLabel = (current: string | undefined, next: string) => {
  const normalizeSourceToken = (token: string) => {
    const normalized = token.trim();
    if (normalized === "上图活动资料") {
      return "上海图书馆活动资料";
    }
    if (normalized === "南京图书馆馆藏资料") {
      return "南京图书馆图像资料";
    }
    if (normalized === "复旦大学图书馆馆藏资料") {
      return "复旦馆藏资料";
    }
    return normalized;
  };
  const tokens = [...(current ? current.split("+") : []), next]
    .map((item) => normalizeSourceToken(item))
    .filter(Boolean);
  return Array.from(new Set(tokens)).join(" + ");
};

const appendVenueSummary = (current: string | undefined, next: string) => {
  if (!current) {
    return next;
  }
  return current.includes(next) ? current : `${current} ${next}`;
};

for (const book of books) {
  if (!details[book.slug]) {
    details[book.slug] = placeholderDetail(book);
  }
}

const lijiDetail = details.liji;
if (lijiDetail) {
  lijiDetail.heroMetric = {
    directCitations: Math.max(lijiDetail.heroMetric.directCitations, 88),
    downstreamInfluence: Math.max(lijiDetail.heroMetric.downstreamInfluence, 274),
    coveredRegions: Math.max(lijiDetail.heroMetric.coveredRegions, 7),
  };
  lijiDetail.places = mergeById(lijiDetail.places, [
    {
      id: "place-changan-lj",
      name: "长安",
      lat: 34.3416,
      lng: 108.9398,
      note: "《礼记》礼学整理与官学讲授的重要中心。",
    },
    {
      id: "place-luoyang-lj",
      name: "洛阳",
      lat: 34.6197,
      lng: 112.454,
      note: "汉唐礼学讲习与注疏流播的关键节点。",
    },
    {
      id: "place-quzhou-lj",
      name: "衢州",
      lat: 28.9701,
      lng: 118.8595,
      note: "南宋书院与家礼讲习把《礼记》重新带回日常教化场景。",
    },
  ]);
  lijiDetail.spread = mergeById(lijiDetail.spread, [
    {
      id: "spread-lj-1",
      fromPlaceId: "place-changan-lj",
      toPlaceId: "place-luoyang-lj",
      startYear: 80,
      endYear: 650,
      volume: 74,
    },
    {
      id: "spread-lj-2",
      fromPlaceId: "place-luoyang-lj",
      toPlaceId: "place-quzhou-lj",
      startYear: 960,
      endYear: 1200,
      volume: 82,
    },
  ]);
  lijiDetail.people = mergeById(lijiDetail.people, [
    {
      id: "person-dai-sheng-liji",
      name: "戴圣",
      role: "编者",
      era: "两汉",
      bio: "后世通行《礼记》多归于戴圣整理，使礼学篇章得以进入更稳定的经籍秩序。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "编" as never,
    } as PersonNode,
    {
      id: "person-zhengxuan-liji",
      name: "郑玄",
      role: "注者",
      birthYear: 127,
      deathYear: 200,
      era: "两汉",
      bio: "东汉经学家，以注释系统重整《礼记》篇章秩序，成为后世礼学解释的重要底座。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-kongyingda-liji",
      name: "孔颖达",
      role: "疏者",
      birthYear: 574,
      deathYear: 648,
      era: "隋唐",
      bio: "《礼记正义》使《礼记》进入唐代官学正义系统，稳定礼学教学主线。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    },
  ]);
  lijiDetail.versions = mergeById(lijiDetail.versions, [
    {
      id: "version-lj-1",
      label: "《礼记》汉代整理本系",
      year: 80,
      place: "长安",
      library: "经学传抄系统",
      status: "佚失",
      editionType: "祖本",
      note: "《礼记》诸篇经西汉整理后形成较稳定的传写底本。",
    },
    {
      id: "version-lj-2",
      label: "郑玄注《礼记》写本系",
      year: 190,
      place: "洛阳",
      library: "经师注释系统",
      status: "佚失",
      parentId: "version-lj-1",
      editionType: "抄本",
      note: "郑玄注为后世礼学阅读提供统一入口。",
    },
    {
      id: "version-lj-3",
      label: "《礼记正义》官学本",
      year: 653,
      place: "长安",
      library: "国子监",
      status: "存世",
      parentId: "version-lj-2",
      editionType: "刻本",
      note: "唐代正义系统将《礼记》纳入官方教学与科举阅读体系。",
    },
  ]);
  lijiDetail.timeline = mergeById(lijiDetail.timeline, [
    {
      id: "tl-lj-1",
      year: 80,
      title: "《礼记》篇章次序逐步稳定",
      detail: "汉代经学整理把分散礼学材料重组为可传授、可诵习的经典形态。",
    },
    {
      id: "tl-lj-2",
      year: 190,
      title: "郑玄注重建礼学阅读底座",
      detail: "注释系统让《礼记》从篇章汇编进一步进入稳定解释框架。",
    },
    {
      id: "tl-lj-3",
      year: 653,
      title: "《礼记正义》进入官学主线",
      detail: "唐代正义把《礼记》推进到更大范围的学校、考试与礼制讨论网络中。",
    },
  ]);
  lijiDetail.passages = mergeById(lijiDetail.passages, [
    {
      id: "passage-lj-1",
      section: "大学母体",
      original: "《大学》《中庸》原本俱在《礼记》之中，礼学框架为后世义理化重组提供了母体。",
      links: [
        {
          id: "passage-lj-1-link-1",
          quote: "《大学》由礼学篇章析出",
          sourceBookId: "book-daxue",
          sourceTitle: "大学",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "《大学》原为《礼记》篇章，这条链路说明四书教材化之前已有礼学母体。",
        },
        {
          id: "passage-lj-1-link-2",
          quote: "《中庸》承接礼学内在化",
          sourceBookId: "book-zhongyong",
          sourceTitle: "中庸",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "《中庸》同样出自《礼记》，其后发展为独立义理文本。",
        },
      ],
      tracePath: [
        {
          id: "trace-lj-1",
          title: "礼记",
          relation: "母体",
          note: "提供四书内部若干核心篇章的制度与礼学背景。",
        },
        {
          id: "trace-lj-2",
          title: "大学",
          relation: "析出",
          note: "修身治国纲领从礼学篇章转为独立学习入口。",
        },
        {
          id: "trace-lj-3",
          title: "四书章句集注",
          relation: "重组",
          note: "宋代理学将礼学母体重新编码为四书教材体系。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-lj-1",
          targetTitle: "大学",
          relation: "篇章母体",
          note: "《礼记》为《大学》提供直接文本来源与礼学背景。",
          confidenceLabel: "高",
        },
      ],
    },
    {
      id: "passage-lj-2",
      section: "礼治秩序",
      original: "礼不仅是制度条文，更是把家国秩序、身体实践与教化结构连成一体的运行框架。",
      links: [
        {
          id: "passage-lj-2-link-1",
          quote: "家内教化向《孝经》延伸",
          sourceBookId: "book-xiaojing",
          sourceTitle: "孝经",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《孝经》把《礼记》中的礼治秩序进一步压缩为家内教化与亲爱结构。",
        },
      ],
      tracePath: [
        {
          id: "trace-lj-4",
          title: "礼记",
          relation: "制度框架",
          note: "从冠婚丧祭到修身次第，构成礼治世界的基础语言。",
        },
        {
          id: "trace-lj-5",
          title: "孝经",
          relation: "家内转写",
          note: "将礼治秩序转化为更易传播的孝悌教化结构。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-lj-2",
          targetTitle: "孝经",
          relation: "伦理转写",
          note: "《孝经》长期承担《礼记》礼治秩序的通俗化与教化化传播功能。",
          confidenceLabel: "中",
        },
      ],
    },
  ]);
  lijiDetail.realWorldSignals = {
    ...lijiDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(lijiDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      lijiDetail.realWorldSignals?.venueSummary,
      "补厚《礼记》后，首页主河道能更清楚地展示“四书母体”与礼治秩序的源头层，不再只剩一个抽象名称。",
    ),
  };
}

const lunyuJizhuDetail = details["lunyu-jizhu"];
if (lunyuJizhuDetail) {
  lunyuJizhuDetail.heroMetric = {
    directCitations: Math.max(lunyuJizhuDetail.heroMetric.directCitations, 76),
    downstreamInfluence: Math.max(lunyuJizhuDetail.heroMetric.downstreamInfluence, 226),
    coveredRegions: Math.max(lunyuJizhuDetail.heroMetric.coveredRegions, 6),
  };
  lunyuJizhuDetail.places = mergeById(lunyuJizhuDetail.places, [
    {
      id: "place-wuyishan-lyjz",
      name: "武夷山",
      lat: 27.7566,
      lng: 118.0314,
      note: "朱熹讲学与《论语集注》定型的重要空间。",
    },
    {
      id: "place-kaifeng-lyjz",
      name: "开封",
      lat: 34.7972,
      lng: 114.3076,
      note: "北宋义理讨论为《论语集注》的成形提供前序背景。",
    },
    {
      id: "place-hangzhou-lyjz",
      name: "杭州",
      lat: 30.2741,
      lng: 120.1551,
      note: "南宋以后书院与科举阅读继续放大《论语集注》的教材影响力。",
    },
  ]);
  lunyuJizhuDetail.spread = mergeById(lunyuJizhuDetail.spread, [
    {
      id: "spread-lyjz-1",
      fromPlaceId: "place-kaifeng-lyjz",
      toPlaceId: "place-wuyishan-lyjz",
      startYear: 1030,
      endYear: 1170,
      volume: 84,
    },
    {
      id: "spread-lyjz-2",
      fromPlaceId: "place-wuyishan-lyjz",
      toPlaceId: "place-hangzhou-lyjz",
      startYear: 1170,
      endYear: 1300,
      volume: 92,
    },
  ]);
  lunyuJizhuDetail.people = mergeById(lunyuJizhuDetail.people, [
    {
      id: "person-zhuxi-lyjz",
      name: "朱熹",
      role: "注者",
      birthYear: 1130,
      deathYear: 1200,
      era: "宋",
      bio: "以《论语集注》重整孔门语录阅读路径，使之进入更统一的四书教材结构。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-chengyi-lyjz",
      name: "程颐",
      role: "思想前驱",
      birthYear: 1033,
      deathYear: 1107,
      era: "宋",
      bio: "二程理学提供《论语》义理化再解释的前置框架，为朱熹集注铺路。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-lvzuqian-lyjz",
      name: "吕祖谦",
      role: "传播者",
      birthYear: 1137,
      deathYear: 1181,
      era: "宋",
      bio: "与朱熹所处书院网络一起推动理学经典的讲会、刊刻与流布。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    },
  ]);
  lunyuJizhuDetail.versions = mergeById(lunyuJizhuDetail.versions, [
    {
      id: "version-lyjz-1",
      label: "《论语集注》书院写本系",
      year: 1170,
      place: "武夷山",
      library: "书院系统",
      status: "佚失",
      editionType: "抄本",
      note: "讲会与书院教学环境中的早期流传层。",
    },
    {
      id: "version-lyjz-2",
      label: "南宋《论语集注》刊本",
      year: 1190,
      place: "杭州",
      library: "书院刊刻系统",
      status: "存世",
      parentId: "version-lyjz-1",
      editionType: "刻本",
      note: "进入更大范围的士人阅读与考试训练体系。",
    },
    {
      id: "version-lyjz-3",
      label: "元明四书讲本系",
      year: 1320,
      place: "杭州",
      library: "四书讲习系统",
      status: "存世",
      parentId: "version-lyjz-2",
      editionType: "重刊本",
      note: "《论语集注》作为四书教材长期占据中心地位。",
    },
  ]);
  lunyuJizhuDetail.timeline = mergeById(lunyuJizhuDetail.timeline, [
    {
      id: "tl-lyjz-1",
      year: 1100,
      title: "北宋理学重释《论语》",
      detail: "二程学脉把孔门语录引入更系统的心性与工夫论框架。",
    },
    {
      id: "tl-lyjz-2",
      year: 1170,
      title: "朱熹完成《论语集注》重组",
      detail: "《论语》被重新编码为四书学习路径中的稳定入口之一。",
    },
    {
      id: "tl-lyjz-3",
      year: 1313,
      title: "四书体系进入官方教学轨道",
      detail: "《论语集注》与四书讲义长期成为学校和考试阅读的基础文本。",
    },
  ]);
  lunyuJizhuDetail.passages = mergeById(lunyuJizhuDetail.passages, [
    {
      id: "passage-lyjz-1",
      section: "集注之义",
      original: "《论语集注》不是简单注释，而是把孔门语录重新排入理学工夫、心性与教材秩序之中。",
      links: [
        {
          id: "passage-lyjz-1-link-1",
          quote: "四书化后的统一入口",
          sourceBookId: "book-sishu-zhangju",
          sourceTitle: "四书章句集注",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "《论语集注》是四书章句体系中的关键组成部分，与《大学》《中庸》《孟子》共同构成统一教材结构。",
        },
      ],
      tracePath: [
        {
          id: "trace-lyjz-1",
          title: "论语",
          relation: "原典",
          note: "孔门语录提供源文本。",
        },
        {
          id: "trace-lyjz-2",
          title: "论语集注",
          relation: "重释",
          note: "理学化与教材化重组改变了阅读入口。",
        },
        {
          id: "trace-lyjz-3",
          title: "四书章句集注",
          relation: "并入",
          note: "进入统一四书学习框架后，影响进一步放大。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-lyjz-1",
          targetTitle: "四书章句集注",
          relation: "教材组成",
          note: "作为四书体系中的关键组成部分长期发挥教学作用。",
          confidenceLabel: "高",
        },
      ],
    },
    {
      id: "passage-lyjz-2",
      section: "仁礼重释",
      original: "孔门原有的仁、礼、学问命题，在集注中被重新压入心性工夫与义理秩序。",
      links: [
        {
          id: "passage-lyjz-2-link-1",
          quote: "诚与中和的心性入口",
          sourceBookId: "book-zhongyong",
          sourceTitle: "中庸",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《论语集注》对仁礼关系的解释长期与《中庸》的诚、中和论互相支撑。",
        },
      ],
      tracePath: [
        {
          id: "trace-lyjz-4",
          title: "论语",
          relation: "伦理命题",
          note: "原典提出“仁”“礼”“学”的经典组合。",
        },
        {
          id: "trace-lyjz-5",
          title: "中庸",
          relation: "形上支撑",
          note: "提供更稳定的心性与中和框架。",
        },
        {
          id: "trace-lyjz-6",
          title: "论语集注",
          relation: "再编码",
          note: "把孔门伦理命题重新放回理学解释秩序中。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-lyjz-2",
          targetTitle: "中庸",
          relation: "义理互证",
          note: "《论语集注》与《中庸》共同构成宋代理学心性论的阅读入口。",
          confidenceLabel: "中",
        },
      ],
    },
  ]);
  lunyuJizhuDetail.realWorldSignals = {
    ...lunyuJizhuDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(lunyuJizhuDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      lunyuJizhuDetail.realWorldSignals?.venueSummary,
      "补入《论语集注》后，《论语》不再只是源头节点，而能继续点进“理学化、教材化”的中段河道。",
    ),
  };
}

const zuozhuanDetail = details.zuozhuan;
if (zuozhuanDetail) {
  zuozhuanDetail.spread = mergeById(zuozhuanDetail.spread, [
    {
      id: "spread-zz-3",
      fromPlaceId: "place-luoyang-zz",
      toPlaceId: "place-lin'an-zz",
      startYear: 1080,
      endYear: 1250,
      volume: 76,
    },
  ]);
  zuozhuanDetail.people = mergeById(zuozhuanDetail.people, [
    {
      id: "person-duyu-zz",
      name: "杜预",
      role: "注者",
      birthYear: 222,
      deathYear: 285,
      era: "魏晋",
      bio: "《春秋左氏经传集解》为《左传》提供稳定注释入口，使其史法与经义并进。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
  ]);
  zuozhuanDetail.timeline = mergeById(zuozhuanDetail.timeline, [
    {
      id: "tl-zz-4",
      year: 1180,
      title: "宋代理学与史法阅读重新接续《左传》",
      detail: "《左传》不仅保留在经学次序中，也继续向史学叙事与政治判断回流。",
    },
  ]);
  zuozhuanDetail.passages = mergeById(zuozhuanDetail.passages, [
    {
      id: "passage-zz-2",
      section: "史法转写",
      original: "编年叙事、因果线索与人物褒贬在《左传》中形成可被后世史家继承的方法感。",
      links: [
        {
          id: "passage-zz-2-link-1",
          quote: "纪传体与通史写作的前驱",
          sourceBookId: "book-shiji",
          sourceTitle: "史记",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《左传》的叙事组织与史法意识为《史记》及后世通史写作提供重要参照。",
        },
      ],
      tracePath: [
        {
          id: "trace-zz-7",
          title: "左传",
          relation: "史法源头",
          note: "形成经史交界处最具叙事性的书写方式。",
        },
        {
          id: "trace-zz-8",
          title: "史记",
          relation: "改造",
          note: "纪传体通史吸收并改造了《左传》的史法资源。",
        },
        {
          id: "trace-zz-9",
          title: "资治通鉴",
          relation: "回流",
          note: "编年体通史重新把《左传》的史法意识拉回主河道。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-zz-2",
          targetTitle: "资治通鉴",
          relation: "史法回流",
          note: "《通鉴》重新激活《左传》式的编年史法与政治判断资源。",
          confidenceLabel: "中",
        },
      ],
    },
  ]);
  zuozhuanDetail.realWorldSignals = {
    ...zuozhuanDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(zuozhuanDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      zuozhuanDetail.realWorldSignals?.venueSummary,
      "《左传》补入真实来源信号后，经史互证这条支流在现场演示时不再显得孤立。",
    ),
  };
}

const shijiDetail = details.shiji;
if (shijiDetail) {
  shijiDetail.places = mergeById(shijiDetail.places, [
    {
      id: "place-changan-sj",
      name: "长安",
      lat: 34.3416,
      lng: 108.9398,
      note: "《史记》成书与汉代史官制度背景的重要中心。",
    },
    {
      id: "place-luoyang-sj",
      name: "洛阳",
      lat: 34.6197,
      lng: 112.454,
      note: "东汉以降纪传体史学继续讲习与流布的重要节点。",
    },
  ]);
  shijiDetail.spread = mergeById(shijiDetail.spread, [
    {
      id: "spread-sj-1",
      fromPlaceId: "place-changan-sj",
      toPlaceId: "place-luoyang-sj",
      startYear: -90,
      endYear: 200,
      volume: 72,
    },
    {
      id: "spread-sj-2",
      fromPlaceId: "place-luoyang-sj",
      toPlaceId: "place-hangzhou",
      startYear: 960,
      endYear: 1250,
      volume: 66,
    },
  ]);
  shijiDetail.people = mergeById(shijiDetail.people, [
    {
      id: "person-banbiao-sj",
      name: "班彪",
      role: "继承者",
      birthYear: 3,
      deathYear: 54,
      era: "两汉",
      bio: "班氏史学承接《史记》而重开《汉书》系统，使纪传体成为更稳定的正史写作框架。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-simazhen-sj",
      name: "司马贞",
      role: "注者",
      birthYear: 679,
      deathYear: 732,
      era: "隋唐",
      bio: "《史记索隐》代表唐代学者继续整理《史记》文本与义例。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "注",
    },
  ]);
  shijiDetail.versions = mergeById(shijiDetail.versions, [
    {
      id: "version-sj-3",
      label: "《史记三家注》本",
      year: 720,
      place: "长安",
      library: "史学注释系统",
      status: "存世",
      parentId: "version-sj-2",
      editionType: "重刊本",
      note: "裴骃集解、司马贞索隐、张守节正义共同构成后世最稳定的《史记》阅读层。",
    },
    {
      id: "version-sj-4",
      label: "明南监《史记评林》本",
      year: 1565,
      place: "南京",
      library: "评点刊刻系统",
      status: "存世",
      parentId: "version-sj-3",
      editionType: "重刊本",
      note: "明代评点本把《史记》重新压回案头阅读、文章批评与史法赏析三条并行线索。",
    },
  ]);
  shijiDetail.timeline = mergeById(shijiDetail.timeline, [
    {
      id: "tl-sj-2",
      year: 80,
      title: "班氏史学接续纪传体通史方法",
      detail: "《史记》所开启的纪传体写作，被班氏进一步制度化为更稳定的正史书写范式。",
    },
    {
      id: "tl-sj-3",
      year: 720,
      title: "《史记》注释系统稳定",
      detail: "三家注使《史记》长期保持在注释化、教学化与案头研读的中心位置。",
    },
    {
      id: "tl-sj-4",
      year: 1565,
      title: "《史记》进入评点与史法赏鉴网络",
      detail: "明代评点刊本让《史记》既是史学底本，也是文章学、人物论与史法批评的常用资源库。",
    },
  ]);
  shijiDetail.passages = mergeById(shijiDetail.passages, [
    {
      id: "passage-sj-1",
      section: "究天人之际",
      original: "《史记》把人物、制度与时代起伏并置，形成“纪传体”式的历史解释结构。",
      links: [
        {
          id: "passage-sj-1-link-1",
          quote: "《左传》史法资源的再编排",
          sourceBookId: "book-zuozhuan",
          sourceTitle: "左传",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《史记》虽体例不同，但其叙事张力、人物褒贬与史法意识可回溯到《左传》传统。",
        },
        {
          id: "passage-sj-1-link-2",
          quote: "通史写作向《资治通鉴》回流",
          sourceBookId: "book-zi-zhi-tong-jian",
          sourceTitle: "资治通鉴",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《通鉴》重新以编年体组织广域历史，但其人物与制度观察始终与《史记》保持对话。",
        },
      ],
      tracePath: [
        {
          id: "trace-sj-1",
          title: "左传",
          relation: "史法前驱",
          note: "叙事史法与褒贬意识提供重要先导资源。",
        },
        {
          id: "trace-sj-2",
          title: "史记",
          relation: "纪传定型",
          note: "把历史书写重组为人物、世家、列传并行的通史结构。",
        },
        {
          id: "trace-sj-3",
          title: "资治通鉴",
          relation: "通史回流",
          note: "后世通史继续与《史记》展开体例与方法对话。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-sj-1",
          targetTitle: "资治通鉴",
          relation: "通史互证",
          note: "《资治通鉴》在编年结构之外持续回应《史记》的人物与制度观察。",
          confidenceLabel: "中",
        },
      ],
    },
    {
      id: "passage-sj-2",
      section: "本纪与列传互照",
      original: "《史记》将帝王本纪、世家与列传并列铺开，使制度秩序与个人命运能够在同一部通史中相互照见。",
      links: [
        {
          id: "passage-sj-2-link-1",
          quote: "《尚书》的政治叙事母题被移入人物史书写",
          sourceBookId: "book-shangshu",
          sourceTitle: "尚书",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《尚书》中的君臣政治叙事与治乱框架，在《史记》里被重组为人物传记与制度史并行的观察方式。",
        },
        {
          id: "passage-sj-2-link-2",
          quote: "《资治通鉴》继续把人物与制度并观",
          sourceBookId: "book-zi-zhi-tong-jian",
          sourceTitle: "资治通鉴",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "后世通史虽改采编年结构，但仍持续沿着《史记》的人物与制度双重视角组织历史判断。",
        },
      ],
      tracePath: [
        {
          id: "trace-sj-4",
          title: "尚书",
          relation: "政治叙事源头",
          note: "提供王政、君臣与治乱叙事的原始模板。",
        },
        {
          id: "trace-sj-5",
          title: "史记",
          relation: "纪传扩写",
          note: "把政治叙事改写为本纪、世家、列传并行的通史系统。",
        },
        {
          id: "trace-sj-6",
          title: "资治通鉴",
          relation: "制度回看",
          note: "后世继续把人物抉择与制度得失压到通史镜面中反复回看。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-sj-2",
          targetTitle: "日知录",
          relation: "制度回读",
          note: "明清经世学常借《史记》的人物与制度观察回看国家治理与历史因果。",
          confidenceLabel: "低",
        },
      ],
    },
  ]);
  shijiDetail.realWorldSignals = {
    ...shijiDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(shijiDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      shijiDetail.realWorldSignals?.venueSummary,
      "补厚《史记》后，经史转写这段河道终于有了从《左传》到《通鉴》的中继节点。",
    ),
  };
}

const zztjDetail = details["zi-zhi-tong-jian"];
if (zztjDetail) {
  zztjDetail.places = mergeById(zztjDetail.places, [
    {
      id: "place-kaifeng-zztj",
      name: "开封",
      lat: 34.7972,
      lng: 114.3076,
      note: "北宋政治与史学讨论网络为《通鉴》编修提供制度背景。",
    },
    {
      id: "place-luoyang-zztj",
      name: "洛阳",
      lat: 34.6197,
      lng: 112.454,
      note: "司马光退居讲修与编年史阅读的重要空间。",
    },
    {
      id: "place-hangzhou-zztj",
      name: "杭州",
      lat: 30.2741,
      lng: 120.1551,
      note: "南宋以后史学与治道讨论继续把《通鉴》推向更广的讲习网络。",
    },
  ]);
  zztjDetail.spread = mergeById(zztjDetail.spread, [
    {
      id: "spread-zztj-1",
      fromPlaceId: "place-kaifeng-zztj",
      toPlaceId: "place-luoyang-zztj",
      startYear: 1065,
      endYear: 1084,
      volume: 78,
    },
    {
      id: "spread-zztj-2",
      fromPlaceId: "place-luoyang-zztj",
      toPlaceId: "place-hangzhou-zztj",
      startYear: 1084,
      endYear: 1250,
      volume: 84,
    },
  ]);
  zztjDetail.versions = mergeById(zztjDetail.versions, [
    {
      id: "version-zztj-4",
      label: "南宋《资治通鉴》刊本系",
      year: 1150,
      place: "杭州",
      library: "史学刊刻系统",
      status: "存世",
      parentId: "version-zztj-3",
      editionType: "重刊本",
      note: "《通鉴》持续进入史学训练、政治议论与书院讲习环境。",
    },
    {
      id: "version-zztj-5",
      label: "明嘉靖《资治通鉴纲目》通行本",
      year: 1530,
      place: "建阳",
      library: "书坊讲读系统",
      status: "存世",
      parentId: "version-zztj-4",
      editionType: "重刊本",
      note: "纲目化与讲读化版本把《通鉴》进一步转成启蒙、治道与史学训练共用的阅读入口。",
    },
  ]);
  zztjDetail.timeline = mergeById(zztjDetail.timeline, [
    {
      id: "tl-zztj-3",
      year: 1150,
      title: "南宋继续扩大《通鉴》治道阅读",
      detail: "《通鉴》不止是史书，也成为议论政治得失与制度教训的常用底本。",
    },
    {
      id: "tl-zztj-4",
      year: 1530,
      title: "《通鉴》进入纲目化讲读网络",
      detail: "明代以来，围绕《通鉴》的纲目化、节要化与讲章化阅读进一步放大其启蒙与治道双重用途。",
    },
  ]);
  zztjDetail.passages = mergeById(zztjDetail.passages, [
    {
      id: "passage-zztj-1",
      section: "资治之义",
      original: "编年不是单纯排列年代，而是把制度得失、人物抉择与治乱因果组织成可供后人回看的历史镜面。",
      links: [
        {
          id: "passage-zztj-1-link-1",
          quote: "《左传》编年史法的再激活",
          sourceBookId: "book-zuozhuan",
          sourceTitle: "左传",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《通鉴》以更大规模重新激活《左传》式编年史法与政治判断传统。",
        },
        {
          id: "passage-zztj-1-link-2",
          quote: "通史视野与《史记》持续对话",
          sourceBookId: "book-shiji",
          sourceTitle: "史记",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《通鉴》在人物与制度观察上始终与《史记》形成通史层面的互证关系。",
        },
      ],
      tracePath: [
        {
          id: "trace-zztj-1",
          title: "左传",
          relation: "编年前驱",
          note: "提供史法与政治判断资源。",
        },
        {
          id: "trace-zztj-2",
          title: "史记",
          relation: "通史参照",
          note: "提供广域历史组织的另一极体例。",
        },
        {
          id: "trace-zztj-3",
          title: "资治通鉴",
          relation: "重构",
          note: "把编年、治道与制度镜鉴重新压到一条主河道上。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-zztj-1",
          targetTitle: "日知录",
          relation: "治道回读",
          note: "晚明清学者经常借《通鉴》与正史材料回看制度得失。",
          confidenceLabel: "低",
        },
      ],
    },
    {
      id: "passage-zztj-2",
      section: "治乱镜鉴",
      original: "《资治通鉴》将政治得失拆解成可逐年回看的因果链，使后世读者能够从时间推进中直接看见制度选择如何累积成治乱结果。",
      links: [
        {
          id: "passage-zztj-2-link-1",
          quote: "《尚书》政教判断被改写为编年镜鉴",
          sourceBookId: "book-shangshu",
          sourceTitle: "尚书",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《通鉴》把《尚书》传统中的政教判断推进到连续历史时间中，形成逐年检视制度得失的镜鉴结构。",
        },
        {
          id: "passage-zztj-2-link-2",
          quote: "《日知录》继续借史反推制度讨论",
          sourceBookId: "book-ri-zhi-lu",
          sourceTitle: "日知录",
          layer: "influence",
          confidenceLabel: "低",
          evidence: "明清经世学者常通过《通鉴》与正史材料重建制度讨论的证据链，这种回读方式可直接下接《日知录》。",
        },
      ],
      tracePath: [
        {
          id: "trace-zztj-4",
          title: "尚书",
          relation: "政教源头",
          note: "提供王政得失与历史判断的最早母题层。",
        },
        {
          id: "trace-zztj-5",
          title: "资治通鉴",
          relation: "编年镜鉴",
          note: "将政教判断放进连续年代序列，形成可供治理回看的历史镜面。",
        },
        {
          id: "trace-zztj-6",
          title: "日知录",
          relation: "经世回流",
          note: "后世把《通鉴》重新拉回制度批评与现实经世讨论。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-zztj-2",
          targetTitle: "人间词话",
          relation: "历史感回声",
          note: "近现代读史传统中的历史纵深感与兴亡意识，仍可远距离回听《通鉴》式时间镜鉴结构的影响。",
          confidenceLabel: "低",
        },
      ],
    },
  ]);
  zztjDetail.realWorldSignals = {
    ...zztjDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(zztjDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      zztjDetail.realWorldSignals?.venueSummary,
      "补厚《资治通鉴》后，经史支流能完整落到“史法回流为治道镜鉴”的演示叙事上。",
    ),
  };
}

const rizhiluDetail = details["ri-zhi-lu"];
if (rizhiluDetail) {
  rizhiluDetail.heroMetric = {
    directCitations: Math.max(rizhiluDetail.heroMetric.directCitations, 74),
    downstreamInfluence: Math.max(rizhiluDetail.heroMetric.downstreamInfluence, 214),
    coveredRegions: Math.max(rizhiluDetail.heroMetric.coveredRegions, 6),
  };
  rizhiluDetail.places = mergeById(rizhiluDetail.places, [
    {
      id: "place-suzhou-rzl",
      name: "苏州",
      lat: 31.2989,
      lng: 120.5853,
      note: "顾炎武成长与明清学术回流的重要江南文化空间。",
    },
    {
      id: "place-kunshan-rzl",
      name: "昆山",
      lat: 31.3856,
      lng: 120.9807,
      note: "家国之变与地方社会观察共同构成《日知录》的经验底色。",
    },
    {
      id: "place-beijing-rzl",
      name: "北京",
      lat: 39.9042,
      lng: 116.4074,
      note: "清代学术整理与经世讨论继续放大《日知录》的制度批评意义。",
    },
  ]);
  rizhiluDetail.spread = mergeById(rizhiluDetail.spread, [
    {
      id: "spread-rzl-1",
      fromPlaceId: "place-kunshan-rzl",
      toPlaceId: "place-suzhou-rzl",
      startYear: 1660,
      endYear: 1680,
      volume: 70,
    },
    {
      id: "spread-rzl-2",
      fromPlaceId: "place-suzhou-rzl",
      toPlaceId: "place-beijing-rzl",
      startYear: 1680,
      endYear: 1820,
      volume: 82,
    },
  ]);
  rizhiluDetail.people = mergeById(rizhiluDetail.people, [
    {
      id: "person-guyanwu-rzl",
      name: "顾炎武",
      role: "作者",
      birthYear: 1613,
      deathYear: 1682,
      era: "明清",
      bio: "以经世考据方法重估制度、礼制与学术传统，使《日知录》成为清初经世思潮的重要入口。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "著",
    },
    {
      id: "person-yanruoju-rzl",
      name: "阎若璩",
      role: "承继者",
      birthYear: 1636,
      deathYear: 1704,
      era: "明清",
      bio: "清初考据学者，经由辨伪与校勘继续推进《日知录》所代表的实证治学方向。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-dai-zhen-rzl",
      name: "戴震",
      role: "承继者",
      birthYear: 1724,
      deathYear: 1777,
      era: "明清",
      bio: "朴学高峰人物之一，把经学、训诂与制度考证进一步推向系统化，也让《日知录》的问题意识长期回响。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ]);
  rizhiluDetail.versions = mergeById(rizhiluDetail.versions, [
    {
      id: "version-rzl-1",
      label: "顾炎武《日知录》稿本系",
      year: 1670,
      place: "苏州",
      library: "学人稿抄系统",
      status: "佚失",
      editionType: "抄本",
      note: "经世考据笔记在士人圈层中先以稿抄与摘录方式流布。",
    },
    {
      id: "version-rzl-2",
      label: "清刊《日知录》本",
      year: 1720,
      place: "北京",
      library: "学术刊刻系统",
      status: "存世",
      parentId: "version-rzl-1",
      editionType: "刻本",
      note: "进入更稳定的清代学术整理与经世议论网络。",
    },
    {
      id: "version-rzl-3",
      label: "清校《日知录集释》本系",
      year: 1810,
      place: "北京",
      library: "考据整理系统",
      status: "存世",
      parentId: "version-rzl-2",
      editionType: "整理本",
      note: "通过校勘、集释与引证继续放大其制度批评与考据意义。",
    },
  ]);
  rizhiluDetail.timeline = mergeById(rizhiluDetail.timeline, [
    {
      id: "tl-rzl-1",
      year: 1670,
      title: "《日知录》逐步成编",
      detail: "顾炎武把亡国反思、制度观察与经学考据压入随札式条目结构中。",
    },
    {
      id: "tl-rzl-2",
      year: 1720,
      title: "清代刊本进入更大阅读网络",
      detail: "《日知录》从私人笔记转为清代学术与经世论述的重要案头书。",
    },
    {
      id: "tl-rzl-3",
      year: 1810,
      title: "考据整理继续放大《日知录》影响",
      detail: "集释与校勘让《日知录》长期处在制度、经义与文字考证的交汇处。",
    },
  ]);
  rizhiluDetail.passages = mergeById(rizhiluDetail.passages, [
    {
      id: "passage-rzl-1",
      section: "经世之学",
      original: "学术不止为章句存续，更要回到制度、礼制与天下治理的真实问题中去。",
      links: [
        {
          id: "passage-rzl-1-link-1",
          quote: "春秋义例回到现实制度判断",
          sourceBookId: "book-gongyang-zhuan",
          sourceTitle: "春秋公羊传",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《日知录》的经世判断长期承接春秋学中的制度义例与政治批评传统。",
        },
        {
          id: "passage-rzl-1-link-2",
          quote: "训诂与制度考证互相支撑",
          sourceBookId: "book-shuowen",
          sourceTitle: "说文解字",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《日知录》式考据并不止于制度议论，其文字训诂工作也与《说文》系统长期互证。",
        },
      ],
      tracePath: [
        {
          id: "trace-rzl-1",
          title: "春秋公羊传",
          relation: "义例前驱",
          note: "经世批评中的制度判断可回溯到春秋义例传统。",
        },
        {
          id: "trace-rzl-2",
          title: "说文解字",
          relation: "训诂底座",
          note: "文字学与小学资源让经世考据具有更强的可证性。",
        },
        {
          id: "trace-rzl-3",
          title: "日知录",
          relation: "经世回收",
          note: "把义例、训诂与制度批评重新拉回同一条河道。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-rzl-1",
          targetTitle: "说文解字",
          relation: "考据互证",
          note: "清代实证学风使《说文》与《日知录》共同成为经世考据的常用资源。",
          confidenceLabel: "中",
        },
      ],
    },
    {
      id: "passage-rzl-2",
      section: "通史镜鉴",
      original: "观察制度成败与世变兴衰时，历史材料不是死文本，而是现实反思的镜面。",
      links: [
        {
          id: "passage-rzl-2-link-1",
          quote: "通史材料回到现实制度反思",
          sourceBookId: "book-zi-zhi-tong-jian",
          sourceTitle: "资治通鉴",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《日知录》的经世视角常与《通鉴》式历史镜鉴互相呼应，把史事转化为现实制度反思资源。",
        },
      ],
      tracePath: [
        {
          id: "trace-rzl-4",
          title: "资治通鉴",
          relation: "史鉴资源",
          note: "广域史事为制度反思提供持续镜鉴。",
        },
        {
          id: "trace-rzl-5",
          title: "日知录",
          relation: "现实回看",
          note: "把史鉴重新导回现实制度和天下治理问题。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-rzl-2",
          targetTitle: "资治通鉴",
          relation: "治道回读",
          note: "《日知录》强化了后世从《通鉴》等史书中寻找制度镜鉴的阅读方式。",
          confidenceLabel: "低",
        },
      ],
    },
  ]);
  rizhiluDetail.realWorldSignals = {
    ...rizhiluDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(rizhiluDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      rizhiluDetail.realWorldSignals?.venueSummary,
      "补厚《日知录》后，晚明清的经世考据支流终于不再只是一张薄卡，而能继续点到制度、训诂与史鉴三层内容。",
    ),
  };
}

const renjianciHuaDetail = details["ren-jian-ci-hua"];
if (renjianciHuaDetail) {
  renjianciHuaDetail.heroMetric = {
    directCitations: Math.max(renjianciHuaDetail.heroMetric.directCitations, 79),
    downstreamInfluence: Math.max(renjianciHuaDetail.heroMetric.downstreamInfluence, 232),
    coveredRegions: Math.max(renjianciHuaDetail.heroMetric.coveredRegions, 6),
  };
  renjianciHuaDetail.places = mergeById(renjianciHuaDetail.places, [
    {
      id: "place-haining-rjch",
      name: "海宁",
      lat: 30.5255,
      lng: 120.6888,
      note: "王国维学术成长的重要江南空间，也是古典资源进入近代学术转写的起点之一。",
    },
    {
      id: "place-shanghai-rjch",
      name: "上海",
      lat: 31.2304,
      lng: 121.4737,
      note: "近代出版、报刊与学术网络使《人间词话》能够进入更广阔的公共阅读场。",
    },
    {
      id: "place-beijing-rjch",
      name: "北京",
      lat: 39.9042,
      lng: 116.4074,
      note: "近代学术整理与新旧文学讨论继续放大《人间词话》的审美影响力。",
    },
  ]);
  renjianciHuaDetail.spread = mergeById(renjianciHuaDetail.spread, [
    {
      id: "spread-rjch-1",
      fromPlaceId: "place-haining-rjch",
      toPlaceId: "place-shanghai-rjch",
      startYear: 1908,
      endYear: 1915,
      volume: 72,
    },
    {
      id: "spread-rjch-2",
      fromPlaceId: "place-shanghai-rjch",
      toPlaceId: "place-beijing-rjch",
      startYear: 1915,
      endYear: 1935,
      volume: 80,
    },
  ]);
  renjianciHuaDetail.people = mergeById(renjianciHuaDetail.people, [
    {
      id: "person-wangguowei-rjch",
      name: "王国维",
      role: "作者",
      birthYear: 1877,
      deathYear: 1927,
      era: "近现代",
      bio: "以“境界”说重组古典词学与近代审美批评语言，使《人间词话》成为传统诗学近代转写的核心节点。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "著",
    },
    {
      id: "person-yejia-ying-rjch",
      name: "叶嘉莹",
      role: "阐释者",
      birthYear: 1924,
      deathYear: 2024,
      era: "近现代",
      bio: "现代古典诗词研究者，长期通过教学与阐释让《人间词话》继续进入公共审美教育场域。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    },
    {
      id: "person-zhu-guangqian-rjch",
      name: "朱光潜",
      role: "阐释者",
      birthYear: 1897,
      deathYear: 1986,
      era: "近现代",
      bio: "现代美学家，古典审美与现代美学之间的对话常与《人间词话》的问题意识形成呼应。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    },
  ]);
  renjianciHuaDetail.versions = mergeById(renjianciHuaDetail.versions, [
    {
      id: "version-rjch-1",
      label: "《人间词话》初刊稿本系",
      year: 1908,
      place: "上海",
      library: "近代报刊出版系统",
      status: "佚失",
      editionType: "抄本",
      note: "初期文本多依托近代出版媒介与学术圈层流通。",
    },
    {
      id: "version-rjch-2",
      label: "民国《人间词话》整理本",
      year: 1926,
      place: "上海",
      library: "近代出版系统",
      status: "存世",
      parentId: "version-rjch-1",
      editionType: "整理本",
      note: "使零散词话条目逐步形成更稳定的案头读本。",
    },
    {
      id: "version-rjch-3",
      label: "现代校注本系",
      year: 1980,
      place: "北京",
      library: "现代学术整理系统",
      status: "存世",
      parentId: "version-rjch-2",
      editionType: "整理本",
      note: "校注本使《人间词话》长期处于古典诗词教育与现代审美讨论交界处。",
    },
  ]);
  renjianciHuaDetail.timeline = mergeById(renjianciHuaDetail.timeline, [
    {
      id: "tl-rjch-1",
      year: 1908,
      title: "《人间词话》开始进入近代出版场",
      detail: "王国维以词话形式重组古典词学判断，使传统诗学开始直接对接近代审美语汇。",
    },
    {
      id: "tl-rjch-2",
      year: 1926,
      title: "整理本稳定词话阅读形态",
      detail: "《人间词话》从零散文本逐步成为近代古典审美判断的稳定读本。",
    },
    {
      id: "tl-rjch-3",
      year: 1980,
      title: "现代校注继续扩大公共影响",
      detail: "它不再只是词学小书，而成为古典文学课堂、研究与大众阅读反复回看的入口。",
    },
  ]);
  renjianciHuaDetail.passages = mergeById(renjianciHuaDetail.passages, [
    {
      id: "passage-rjch-1",
      section: "境界说",
      original: "词以境界为最上。有境界则自成高格，自有名句。",
      links: [
        {
          id: "passage-rjch-1-link-1",
          quote: "六朝文论中的风格与抒情问题在近代重生",
          sourceBookId: "book-wenxin-diaolong",
          sourceTitle: "文心雕龙",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《人间词话》的境界、风格与抒情判断，与《文心雕龙》以来的古典文论问题保持长期对话。",
        },
        {
          id: "passage-rjch-1-link-2",
          quote: "总集传统提供古典资源库",
          sourceBookId: "book-wenxuan",
          sourceTitle: "昭明文选",
          layer: "semantic",
          confidenceLabel: "低",
          evidence: "近代古典审美判断并不直接出自《文选》，但总集阅读传统为其组织古典资源提供了长期背景。",
        },
      ],
      tracePath: [
        {
          id: "trace-rjch-1",
          title: "文心雕龙",
          relation: "文论前驱",
          note: "风格、抒情与文体判断构成更早的问题框架。",
        },
        {
          id: "trace-rjch-2",
          title: "昭明文选",
          relation: "资源库",
          note: "总集传统长期积累古典诗文的可读秩序。",
        },
        {
          id: "trace-rjch-3",
          title: "人间词话",
          relation: "近代转写",
          note: "王国维以近代语言重新编码古典审美判断。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-rjch-1",
          targetTitle: "文心雕龙",
          relation: "近代回读",
          note: "《人间词话》的成功让古典文论被重新放回现代审美教育场中理解。",
          confidenceLabel: "低",
        },
      ],
    },
    {
      id: "passage-rjch-2",
      section: "词学回流",
      original: "近代词学不是与古典割裂，而是在新的语言里重新回看风雅、骚体、文论与选本所累积的全部传统。",
      links: [
        {
          id: "passage-rjch-2-link-1",
          quote: "骚体与抒情传统的远源回声",
          sourceBookId: "book-chuci-zhangju",
          sourceTitle: "楚辞章句",
          layer: "semantic",
          confidenceLabel: "低",
          evidence: "《人间词话》并不直接注解《楚辞》，但近代抒情审美判断的深层背景仍可回溯到骚体传统。",
        },
      ],
      tracePath: [
        {
          id: "trace-rjch-4",
          title: "楚辞章句",
          relation: "抒情远源",
          note: "骚体资源为后世抒情美学提供深层传统背景。",
        },
        {
          id: "trace-rjch-5",
          title: "文心雕龙",
          relation: "理论中段",
          note: "六朝文论把古典抒情与风格问题抽象出来。",
        },
        {
          id: "trace-rjch-6",
          title: "人间词话",
          relation: "近代再说",
          note: "王国维以更现代的语言重新组织古典诗词的审美判断。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-rjch-2",
          targetTitle: "昭明文选",
          relation: "传统回看",
          note: "近代词学重估也反过来强化了人们对总集传统和古典资源组织方式的再认识。",
          confidenceLabel: "低",
        },
      ],
    },
  ]);
  renjianciHuaDetail.realWorldSignals = {
    ...renjianciHuaDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(renjianciHuaDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      renjianciHuaDetail.realWorldSignals?.venueSummary,
      "补厚《人间词话》后，诗学支流可以自然收束到近代审美回读，而不是只停在一张近现代来源卡上。",
    ),
  };
}

const shangshuZhengyiDetail = details["shangshu-zhengyi"];
if (shangshuZhengyiDetail) {
  shangshuZhengyiDetail.heroMetric = {
    directCitations: Math.max(shangshuZhengyiDetail.heroMetric.directCitations, 76),
    downstreamInfluence: Math.max(shangshuZhengyiDetail.heroMetric.downstreamInfluence, 218),
    coveredRegions: Math.max(shangshuZhengyiDetail.heroMetric.coveredRegions, 6),
  };
  shangshuZhengyiDetail.places = mergeById(shangshuZhengyiDetail.places, [
    {
      id: "place-hangzhou-sszy",
      name: "杭州",
      lat: 30.2741,
      lng: 120.1551,
      note: "南宋以后经义讲习与选本整理继续把《尚书正义》带入更广的阅读网络。",
    },
  ]);
  shangshuZhengyiDetail.spread = mergeById(shangshuZhengyiDetail.spread, [
    {
      id: "spread-sszy-3",
      fromPlaceId: "place-kaifeng-sszy",
      toPlaceId: "place-hangzhou-sszy",
      startYear: 1100,
      endYear: 1250,
      volume: 76,
    },
  ]);
  shangshuZhengyiDetail.people = mergeById(shangshuZhengyiDetail.people, [
    {
      id: "person-cai-shen-sszy",
      name: "蔡沈",
      role: "承继者",
      birthYear: 1167,
      deathYear: 1230,
      era: "宋元",
      bio: "《书集传》代表宋代理学重释《尚书》的路径，使唐代正义系统之后又多出一层义理解读中继。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-yan-shigu-sszy",
      name: "颜师古",
      role: "校订者",
      birthYear: 581,
      deathYear: 645,
      era: "隋唐",
      bio: "唐代注释与校勘传统中的代表人物，其时代语境说明《五经正义》并非孤立编成，而是依托更大的官学整理工程。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "校",
    },
  ]);
  shangshuZhengyiDetail.versions = mergeById(shangshuZhengyiDetail.versions, [
    {
      id: "version-sszy-3",
      label: "南宋书院讲本《尚书正义》",
      year: 1180,
      place: "杭州",
      library: "书院系统",
      status: "存世",
      parentId: "version-sszy-2",
      editionType: "重刊本",
      note: "《尚书正义》不只停留在官学底本，也进入南宋经义与书院讲习环境。",
    },
  ]);
  shangshuZhengyiDetail.timeline = mergeById(shangshuZhengyiDetail.timeline, [
    {
      id: "tl-sszy-3",
      year: 1180,
      title: "南宋经义讲习继续回读《尚书正义》",
      detail: "唐代正义系统在宋代并未失效，而是与新的义理解释共同构成《尚书》阅读的双重底座。",
    },
    {
      id: "tl-sszy-4",
      year: 1230,
      title: "宋代理学重释补出第二层中继",
      detail: "《书集传》等路径让《尚书》在官学义疏之外，继续进入理学化与书院化的解释链路。",
    },
  ]);
  shangshuZhengyiDetail.passages = mergeById(shangshuZhengyiDetail.passages, [
    {
      id: "passage-sszy-2",
      section: "经疏之用",
      original: "正义并非终点，它把原典、官学训释与后世治道阅读之间搭起一层可反复进出的中继桥。 ",
      links: [
        {
          id: "passage-sszy-2-link-1",
          quote: "官学义疏之后仍有理学重释",
          sourceBookId: "book-shangshu",
          sourceTitle: "尚书",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "《尚书正义》直接以《尚书》为底本，并为后世不同解释路径提供了统一的阅读入口。",
        },
        {
          id: "passage-sszy-2-link-2",
          quote: "治道镜鉴向通史回流",
          sourceBookId: "book-zi-zhi-tong-jian",
          sourceTitle: "资治通鉴",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "官学政教解释传统会回流到后世史学的制度判断中，使《尚书正义》与《通鉴》在治道问题上形成间接共振。",
        },
      ],
      tracePath: [
        {
          id: "trace-sszy-3",
          title: "尚书",
          relation: "原典",
          note: "上古政教与典章语言提供全部问题意识。",
        },
        {
          id: "trace-sszy-4",
          title: "尚书正义",
          relation: "官学经疏",
          note: "将原典压缩进稳定可授的义疏层。",
        },
        {
          id: "trace-sszy-5",
          title: "资治通鉴",
          relation: "治道回流",
          note: "经疏里的政教解释会继续回到历史判断与制度镜鉴中。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-sszy-2",
          targetTitle: "资治通鉴",
          relation: "治道参照",
          note: "《通鉴》式史学判断吸收了经疏传统中稳定的政教解释资源。",
          confidenceLabel: "中",
        },
      ],
    },
  ]);
  shangshuZhengyiDetail.realWorldSignals = {
    ...shangshuZhengyiDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(shangshuZhengyiDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      shangshuZhengyiDetail.realWorldSignals?.venueSummary,
      "补厚《尚书正义》后，《尚书》主河道终于能看见“原典—官学经疏—治道回流”的完整中段，不再只是一条细支流。",
    ),
  };
}

const shuowenDetail = details.shuowen;
if (shuowenDetail) {
  shuowenDetail.heroMetric = {
    directCitations: Math.max(shuowenDetail.heroMetric.directCitations, 78),
    downstreamInfluence: Math.max(shuowenDetail.heroMetric.downstreamInfluence, 228),
    coveredRegions: Math.max(shuowenDetail.heroMetric.coveredRegions, 6),
  };
  shuowenDetail.places = mergeById(shuowenDetail.places, [
    {
      id: "place-beijing-sw",
      name: "北京",
      lat: 39.9042,
      lng: 116.4074,
      note: "清代考据、目录与经学整理继续放大《说文》的学术核心地位。",
    },
  ]);
  shuowenDetail.spread = mergeById(shuowenDetail.spread, [
    {
      id: "spread-sw-3",
      fromPlaceId: "place-suzhou-sw",
      toPlaceId: "place-beijing-sw",
      startYear: 1815,
      endYear: 1900,
      volume: 74,
    },
  ]);
  shuowenDetail.people = mergeById(shuowenDetail.people, [
    {
      id: "person-duan-yucai-sw",
      name: "段玉裁",
      role: "注者",
      birthYear: 1735,
      deathYear: 1815,
      era: "明清",
      bio: "《说文解字注》使《说文》重新回到清代经学、校勘与训诂主线，是文字学回流经义的重要枢纽。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-zhu-junsheng-sw",
      name: "朱骏声",
      role: "承继者",
      birthYear: 1788,
      deathYear: 1858,
      era: "明清",
      bio: "小学与声音训诂研究继续扩大《说文》在晚清学术中的解释能力。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ]);
  shuowenDetail.versions = mergeById(shuowenDetail.versions, [
    {
      id: "version-sw-3",
      label: "《说文解字注》晚清整理本",
      year: 1850,
      place: "北京",
      library: "经学整理系统",
      status: "存世",
      parentId: "version-sw-2",
      editionType: "整理本",
      note: "晚清整理继续把《说文》推向经义、声音与目录学交叉地带。",
    },
  ]);
  shuowenDetail.timeline = mergeById(shuowenDetail.timeline, [
    {
      id: "tl-sw-3",
      year: 1850,
      title: "晚清小学整理继续扩张《说文》影响",
      detail: "《说文》不再只是古书，而成为经学、音韵、目录与制度考证反复调用的基础工具。",
    },
    {
      id: "tl-sw-4",
      year: 1900,
      title: "文字学底座继续进入现代学术转写",
      detail: "近现代古籍整理与语言研究仍不断回到《说文》建立的文字解释框架。",
    },
  ]);
  shuowenDetail.passages = mergeById(shuowenDetail.passages, [
    {
      id: "passage-sw-2",
      section: "训诂回流",
      original: "文字学之功，不止辨字形、明字义，更在为经义、制度与校勘提供可追溯、可证实的底座。",
      links: [
        {
          id: "passage-sw-2-link-1",
          quote: "经义需要稳定的文字学底盘",
          sourceBookId: "book-shangshu-zhengyi",
          sourceTitle: "尚书正义",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "像《尚书正义》这样的经疏系统，需要更稳定的疑难字解释与训诂资源，而《说文》正是长期底座之一。",
        },
        {
          id: "passage-sw-2-link-2",
          quote: "考据经世会把小学重新拉回现实问题",
          sourceBookId: "book-ri-zhi-lu",
          sourceTitle: "日知录",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "清代经世考据把训诂、小学和制度讨论重新拉到同一条河道上，《说文》因此再次成为案头工具书。",
        },
      ],
      tracePath: [
        {
          id: "trace-sw-4",
          title: "尚书正义",
          relation: "释经需求",
          note: "经疏系统不断提出对字义、古文与训诂的稳定需求。",
        },
        {
          id: "trace-sw-5",
          title: "说文解字",
          relation: "文字底座",
          note: "通过六书与字义组织方式建立较稳定的释字框架。",
        },
        {
          id: "trace-sw-6",
          title: "日知录",
          relation: "考据回流",
          note: "清代经世考据把文字学重新拉回制度与现实问题场。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-sw-2",
          targetTitle: "日知录",
          relation: "经世工具",
          note: "《说文》使《日知录》式考据工作拥有更强的文字与训诂支撑。",
          confidenceLabel: "中",
        },
      ],
    },
  ]);
  shuowenDetail.realWorldSignals = {
    ...shuowenDetail.realWorldSignals,
    sourceLabel: appendSourceLabel(shuowenDetail.realWorldSignals?.sourceLabel, "纪传人物库"),
    venueSummary: appendVenueSummary(
      shuowenDetail.realWorldSignals?.venueSummary,
      "补厚《说文》后，训诂与考据支流终于不再只是一块工具性标签，而能继续点到释经、考据和经世回流三层内容。",
    ),
  };
}

const daxueDetail = details.daxue;
if (daxueDetail) {
  daxueDetail.heroMetric = {
    directCitations: Math.max(daxueDetail.heroMetric.directCitations, 88),
    downstreamInfluence: Math.max(daxueDetail.heroMetric.downstreamInfluence, 258),
    coveredRegions: Math.max(daxueDetail.heroMetric.coveredRegions, 7),
  };
  daxueDetail.places = mergeById(daxueDetail.places, [
    {
      id: "place-hangzhou-dx",
      name: "杭州",
      lat: 30.2741,
      lng: 120.1551,
      note: "南宋以后四书教学与书院刊刻继续巩固《大学》的教材地位。",
    },
  ]);
  daxueDetail.spread = mergeById(daxueDetail.spread, [
    {
      id: "spread-dx-3",
      fromPlaceId: "place-wuyishan-dx",
      toPlaceId: "place-hangzhou-dx",
      startYear: 1189,
      endYear: 1300,
      volume: 86,
    },
  ]);
  daxueDetail.people = mergeById(daxueDetail.people, [
    {
      id: "person-chengyi-daxue",
      name: "程颐",
      role: "评论者",
      birthYear: 1033,
      deathYear: 1107,
      era: "宋",
      bio: "二程理学把《大学》从礼学篇章进一步推到修身工夫与政治秩序的核心位置。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    },
    {
      id: "person-zhen-de-xiu-daxue",
      name: "真德秀",
      role: "承继者",
      birthYear: 1178,
      deathYear: 1235,
      era: "宋元",
      bio: "南宋学者，以四书讲习与政治实践继续放大《大学》的修齐治平话语。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ]);
  daxueDetail.versions = mergeById(daxueDetail.versions, [
    {
      id: "version-dx-4",
      label: "南宋书院《大学章句》讲本",
      year: 1210,
      place: "杭州",
      library: "书院系统",
      status: "存世",
      parentId: "version-dx-3",
      editionType: "重刊本",
      note: "《大学》持续以四书起首文本身份进入更大范围的书院教学网络。",
    },
  ]);
  daxueDetail.timeline = mergeById(daxueDetail.timeline, [
    {
      id: "tl-dx-4",
      year: 1210,
      title: "南宋书院进一步巩固《大学》起首地位",
      detail: "《大学》在四书路径中不再只是义理文本，而是被固定为入门与工夫展开的教学起点。",
    },
  ]);
  daxueDetail.passages = mergeById(daxueDetail.passages, [
    {
      id: "passage-dx-2",
      section: "格物致知",
      original: "格物、致知、诚意、正心，构成由内向外展开的工夫序列，也为后世四书学习建立了稳定路径。",
      links: [
        {
          id: "passage-dx-2-link-1",
          quote: "孔门学习工夫的外展",
          sourceBookId: "book-lunyu",
          sourceTitle: "论语",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《大学》把《论语》中的学习工夫系统化，转换为层次分明的修身路径。",
        },
        {
          id: "passage-dx-2-link-2",
          quote: "四书秩序的课程化入口",
          sourceBookId: "book-sishu-zhangju",
          sourceTitle: "四书章句集注",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "《大学》在四书体系中长期承担课程起点的角色，其格物致知路径被稳定编入教材秩序。",
        },
      ],
      tracePath: [
        {
          id: "trace-dx-4",
          title: "论语",
          relation: "学习原型",
          note: "孔门语录提供工夫论的最初话语模板。",
        },
        {
          id: "trace-dx-5",
          title: "大学",
          relation: "路径化",
          note: "将零散工夫论组织成层次分明的纲领。",
        },
        {
          id: "trace-dx-6",
          title: "四书章句集注",
          relation: "课程化",
          note: "四书体系进一步把《大学》固化为入门路径。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-dx-2",
          targetTitle: "四书章句集注",
          relation: "课程起点",
          note: "《大学》长期作为四书学习中最具路径感的起首文本存在。",
          confidenceLabel: "高",
        },
      ],
    },
  ]);
}

const mengziDetail = details.mengzi;
if (mengziDetail) {
  mengziDetail.heroMetric = {
    directCitations: Math.max(mengziDetail.heroMetric.directCitations, 86),
    downstreamInfluence: Math.max(mengziDetail.heroMetric.downstreamInfluence, 266),
    coveredRegions: Math.max(mengziDetail.heroMetric.coveredRegions, 7),
  };
  mengziDetail.people = mergeById(mengziDetail.people, [
    {
      id: "person-zhaoqi-mengzi",
      name: "赵岐",
      role: "注者",
      birthYear: 108,
      deathYear: 201,
      era: "两汉",
      bio: "东汉《孟子章句》系统长期构成《孟子》阅读的重要底座，为后世义理化与教材化提供注释前驱。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-zhangzai-mengzi",
      name: "张载",
      role: "承继者",
      birthYear: 1020,
      deathYear: 1077,
      era: "宋",
      bio: "宋代理学家，经由气论与性善论的再阐释，使《孟子》重新进入理学核心地带。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ]);
  mengziDetail.timeline = mergeById(mengziDetail.timeline, [
    {
      id: "tl-mz-4",
      year: 180,
      title: "赵岐《孟子章句》稳定早期注释层",
      detail: "《孟子》不仅以原典流布，也通过章句传统长期维持可讲授、可节录的解释入口。",
    },
  ]);
  mengziDetail.passages = mergeById(mengziDetail.passages, [
    {
      id: "passage-mz-2",
      section: "尽心知性",
      original: "尽其心者，知其性也。知其性，则知天矣。",
      links: [
        {
          id: "passage-mz-2-link-1",
          quote: "性道结构向《中庸》汇流",
          sourceBookId: "book-zhongyong",
          sourceTitle: "中庸",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《孟子》心性论与《中庸》性道论在宋代理学中长期互相支撑，构成四书内部的形上义理层。",
        },
        {
          id: "passage-mz-2-link-2",
          quote: "四书教材化再编码",
          sourceBookId: "book-sishu-zhangju",
          sourceTitle: "四书章句集注",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "朱熹四书体系使《孟子》的心性与王道论被统一编入课程化阅读次序。",
        },
      ],
      tracePath: [
        {
          id: "trace-mz-4",
          title: "孟子",
          relation: "心性源流",
          note: "确立性善、尽心与王道政治的基本话语。",
        },
        {
          id: "trace-mz-5",
          title: "中庸",
          relation: "义理互证",
          note: "性道与中和结构在后世理学中反复互释。",
        },
        {
          id: "trace-mz-6",
          title: "四书章句集注",
          relation: "教材编排",
          note: "心性与王道论被统一纳入四书义理秩序中。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-mz-2",
          targetTitle: "四书章句集注",
          relation: "义理入编",
          note: "《孟子》在四书体系中承担心性与王道论的重要终段支撑。",
          confidenceLabel: "高",
        },
      ],
    },
  ]);
}

const shangshuDetail = details.shangshu;
if (shangshuDetail) {
  shangshuDetail.heroMetric = {
    directCitations: Math.max(shangshuDetail.heroMetric.directCitations, 90),
    downstreamInfluence: Math.max(shangshuDetail.heroMetric.downstreamInfluence, 276),
    coveredRegions: Math.max(shangshuDetail.heroMetric.coveredRegions, 7),
  };
  shangshuDetail.people = mergeById(shangshuDetail.people, [
    {
      id: "person-fusheng-shangshu",
      name: "伏生",
      role: "传者",
      birthYear: -260,
      deathYear: -161,
      era: "两汉",
      bio: "汉初今文《尚书》传承的重要人物，说明《尚书》主河道在两汉已形成强烈的经学传播层。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-mei-ze-shangshu",
      name: "梅赜",
      role: "校传者",
      era: "魏晋",
      bio: "古文《尚书》流传与真伪争议长期伴随《尚书》主河道，使文本史本身也成为可讲的重要层次。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "校",
    },
  ]);
  shangshuDetail.timeline = mergeById(shangshuDetail.timeline, [
    {
      id: "tl-ss-4",
      year: -170,
      title: "两汉《尚书》传承层逐步稳定",
      detail: "今文《尚书》在经师传授与王官典籍记忆之间逐步形成可辨识的流布主线。",
    },
  ]);
  shangshuDetail.passages = mergeById(shangshuDetail.passages, [
    {
      id: "passage-ss-2",
      section: "典章政教",
      original: "《尚书》不只是上古记言材料，更是后世不断回看政教秩序、制度设计与治道判断的源头典籍。",
      links: [
        {
          id: "passage-ss-2-link-1",
          quote: "官学经疏提供稳定讲授层",
          sourceBookId: "book-shangshu-zhengyi",
          sourceTitle: "尚书正义",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "《尚书正义》直接把《尚书》政教语言转写为官学可授的义疏层，放大了它的传播范围。",
        },
        {
          id: "passage-ss-2-link-2",
          quote: "治道镜鉴向通史回流",
          sourceBookId: "book-zi-zhi-tong-jian",
          sourceTitle: "资治通鉴",
          layer: "influence",
          confidenceLabel: "中",
          evidence: "《尚书》的政教判断与典章语言长期回流到后世史学的制度镜鉴之中。",
        },
      ],
      tracePath: [
        {
          id: "trace-ss-4",
          title: "尚书",
          relation: "政教源典",
          note: "上古政教与典章语言在此汇聚。",
        },
        {
          id: "trace-ss-5",
          title: "尚书正义",
          relation: "经疏中继",
          note: "提供稳定的官学讲授层与义疏解释层。",
        },
        {
          id: "trace-ss-6",
          title: "资治通鉴",
          relation: "史鉴回流",
          note: "政教语言继续回到历史判断与制度镜鉴之中。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-ss-2",
          targetTitle: "尚书正义",
          relation: "经疏定型",
          note: "《尚书》主河道借助正义系统获得更稳定的教学与传播中继层。",
          confidenceLabel: "高",
        },
      ],
    },
  ]);
}

const sishuZhangjuDetail = details["sishu-zhangju"];
if (sishuZhangjuDetail) {
  sishuZhangjuDetail.heroMetric = {
    directCitations: Math.max(sishuZhangjuDetail.heroMetric.directCitations, 94),
    downstreamInfluence: Math.max(sishuZhangjuDetail.heroMetric.downstreamInfluence, 302),
    coveredRegions: Math.max(sishuZhangjuDetail.heroMetric.coveredRegions, 8),
  };
  sishuZhangjuDetail.people = mergeById(sishuZhangjuDetail.people, [
    {
      id: "person-lvzuqian-szj",
      name: "吕祖谦",
      role: "传播者",
      birthYear: 1137,
      deathYear: 1181,
      era: "宋",
      bio: "南宋书院讲会与刊刻网络共同推动四书体系扩散，吕祖谦所处学术环境正是这层传播中继的重要代表。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-xu-heng-szj",
      name: "许衡",
      role: "承继者",
      birthYear: 1209,
      deathYear: 1281,
      era: "宋元",
      bio: "元代儒者，继续推动四书义理与教学系统进入更稳定的官学与书院秩序。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ]);
  sishuZhangjuDetail.timeline = mergeById(sishuZhangjuDetail.timeline, [
    {
      id: "tl-szj-4",
      year: 1313,
      title: "四书体系进入更稳定的官学与考试秩序",
      detail: "四书章句不再只是私人讲学成果，而是被纳入更广阔的教学和阅读制度之中。",
    },
  ]);
  sishuZhangjuDetail.passages = mergeById(sishuZhangjuDetail.passages, [
    {
      id: "passage-szj-3",
      section: "教材重组",
      original: "四书章句之功，在于把原本分散的经典义理重排为一条可循序推进、可教学传授、可反复回读的学习河道。",
      links: [
        {
          id: "passage-szj-3-link-1",
          quote: "《大学》承担起首纲领",
          sourceBookId: "book-daxue",
          sourceTitle: "大学",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "四书路径中，《大学》长期承担学习起点和工夫纲领角色。",
        },
        {
          id: "passage-szj-3-link-2",
          quote: "《孟子》承担义理终段支撑",
          sourceBookId: "book-mengzi",
          sourceTitle: "孟子",
          layer: "explicit",
          confidenceLabel: "高",
          evidence: "《孟子》在四书体系中长期承担心性与王道论的压轴位置。",
        },
      ],
      tracePath: [
        {
          id: "trace-szj-7",
          title: "大学",
          relation: "起首",
          note: "以纲领化路径提供入门次第。",
        },
        {
          id: "trace-szj-8",
          title: "四书章句集注",
          relation: "重组",
          note: "把四书各自的义理与工夫压成统一课程。",
        },
        {
          id: "trace-szj-9",
          title: "孟子",
          relation: "压轴",
          note: "以心性与王道论收束整条四书学习河道。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-szj-3",
          targetTitle: "大学",
          relation: "课程起点",
          note: "四书结构进一步巩固了《大学》的纲领性地位。",
          confidenceLabel: "高",
        },
      ],
    },
  ]);
}

const wenxuanDetail = details.wenxuan;
if (wenxuanDetail) {
  wenxuanDetail.heroMetric = {
    directCitations: Math.max(wenxuanDetail.heroMetric.directCitations, 82),
    downstreamInfluence: Math.max(wenxuanDetail.heroMetric.downstreamInfluence, 222),
    coveredRegions: Math.max(wenxuanDetail.heroMetric.coveredRegions, 7),
  };
  wenxuanDetail.people = mergeById(wenxuanDetail.people, [
    {
      id: "person-xiao-yi-wx",
      name: "萧绎",
      role: "承继者",
      birthYear: 508,
      deathYear: 555,
      era: "魏晋",
      bio: "南朝总集与文体整理传统并非由《文选》孤立完成，萧梁文化网络共同构成其编纂背景和早期传播环境。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-yu-jiaxi-wx",
      name: "余嘉锡",
      role: "近代整理者",
      birthYear: 1884,
      deathYear: 1955,
      era: "近现代",
      bio: "现代目录学与文献整理继续回读《文选》传统，让总集不只是古典读本，也成为现代学术资源。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    },
  ]);
  wenxuanDetail.versions = mergeById(wenxuanDetail.versions, [
    {
      id: "version-wx-3",
      label: "宋刊《文选》本",
      year: 1100,
      place: "杭州",
      library: "书院刊刻系统",
      status: "存世",
      parentId: "version-wx-2",
      editionType: "刻本",
      note: "《文选》继续从唐代注本进入更大的书院、诗文批评与科举阅读网络。",
    },
  ]);
  wenxuanDetail.timeline = mergeById(wenxuanDetail.timeline, [
    {
      id: "tl-wx-3",
      year: 1100,
      title: "宋刊本继续放大总集阅读影响",
      detail: "《文选》作为选本与注本双重经典，继续在宋代诗文学习与公共阅读中维持中心地位。",
    },
  ]);
  wenxuanDetail.passages = mergeById(wenxuanDetail.passages, [
    {
      id: "passage-wx-2",
      section: "选本秩序",
      original: "总集之所以重要，不在于单篇保存，而在于重排古典资源的次序，使后世形成共同的阅读入口与审美记忆。",
      links: [
        {
          id: "passage-wx-2-link-1",
          quote: "六朝文论提供体类判断背景",
          sourceBookId: "book-wenxin-diaolong",
          sourceTitle: "文心雕龙",
          layer: "semantic",
          confidenceLabel: "中",
          evidence: "《文心雕龙》所抽象的体类与风格问题，为《文选》式总集阅读提供了更强的理论背景。",
        },
        {
          id: "passage-wx-2-link-2",
          quote: "近代词学继续回看总集传统",
          sourceBookId: "book-ren-jian-ci-hua",
          sourceTitle: "人间词话",
          layer: "influence",
          confidenceLabel: "低",
          evidence: "近代古典审美判断常以更大的总集传统为资源库，说明《文选》并未只停留在六朝与唐宋。",
        },
      ],
      tracePath: [
        {
          id: "trace-wx-4",
          title: "文心雕龙",
          relation: "理论背景",
          note: "体类、风格与辞采问题构成总集排序的深层前提。",
        },
        {
          id: "trace-wx-5",
          title: "昭明文选",
          relation: "总集编排",
          note: "将分散文本压入共享的阅读次序中。",
        },
        {
          id: "trace-wx-6",
          title: "人间词话",
          relation: "近代回看",
          note: "近代审美判断继续从总集传统中回看古典资源。",
        },
      ],
      downstreamInfluence: [
        {
          id: "down-wx-2",
          targetTitle: "人间词话",
          relation: "资源背景",
          note: "总集传统为近代古典审美提供了长期组织古典文本的方式。",
          confidenceLabel: "低",
        },
      ],
    },
  ]);
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
  liji: ["郑玄", "孔颖达"],
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

const curatedPeopleSupplements: Partial<Record<string, PersonNode[]>> = {
  shijing: [
    {
      id: "person-mao-heng-shijing",
      name: "毛亨",
      role: "传者",
      era: "两汉",
      bio: "《毛诗》系统把《诗经》从先秦歌辞传统接入两汉经学讲习，成为后世主河道最稳定的一条训释支脉。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "承",
    },
    {
      id: "person-zheng-xuan-shijing",
      name: "郑玄",
      role: "注者",
      birthYear: 127,
      deathYear: 200,
      era: "两汉",
      bio: "郑玄综合今古文训释资源，为《诗经》提供了可长期回用的注释框架，放大了它在礼学与经学中的通行能力。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "注",
    } as PersonNode,
    {
      id: "person-kong-yingda-shijing",
      name: "孔颖达",
      role: "疏解者",
      birthYear: 574,
      deathYear: 648,
      era: "隋唐",
      bio: "《毛诗正义》将《诗经》重新固定进官学讲授体系，使其在唐以后继续作为主河道核心节点稳定传播。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "注",
    } as PersonNode,
  ],
  lunyu: [
    {
      id: "person-he-yan-lunyu",
      name: "何晏",
      role: "注者",
      birthYear: 190,
      deathYear: 249,
      era: "魏晋",
      bio: "《论语集解》把汉魏以来多家解释压缩成一条可教学、可流通的注释主线，是《论语》再度稳定成势的重要中继。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-xing-bing-lunyu",
      name: "邢昺",
      role: "疏解者",
      birthYear: 932,
      deathYear: 1010,
      era: "宋元",
      bio: "北宋《论语正义》延续经疏传统，将《论语》重新压回官学秩序，与理学解释层形成双线并行的河道结构。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "注",
    } as PersonNode,
  ],
  zhongyong: [
    {
      id: "person-zi-si-zhongyong",
      name: "子思",
      role: "承传者",
      birthYear: -483,
      deathYear: -402,
      era: "先秦",
      bio: "传统上《中庸》与子思学派相系，这条线索让其从孔门心性工夫一路延展到后世义理重构。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "承",
    },
    {
      id: "person-kong-yingda-zhongyong",
      name: "孔颖达",
      role: "疏解者",
      birthYear: 574,
      deathYear: 648,
      era: "隋唐",
      bio: "唐代经疏传统为《中庸》提供了制度化讲授的桥梁，使其不只停留于礼学篇章，而能继续进入后世核心教材层。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "注",
    } as PersonNode,
  ],
  zhouyi: [
    {
      id: "person-wang-bi-zhouyi",
      name: "王弼",
      role: "注者",
      birthYear: 226,
      deathYear: 249,
      era: "魏晋",
      bio: "王弼的义理解《易》使《周易》从象数与经学并行处转向玄学阐释，明显改变了这段河道的水势与方向。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-cheng-yi-zhouyi",
      name: "程颐",
      role: "评论者",
      birthYear: 1033,
      deathYear: 1107,
      era: "宋元",
      bio: "理学《易》学将《周易》重新接回修身与天理论述主线，是宋代理学扩张时最关键的支流之一。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    } as PersonNode,
  ],
  xiaojing: [
    {
      id: "person-xuanzong-xiaojing",
      name: "唐玄宗",
      role: "注者",
      birthYear: 685,
      deathYear: 762,
      era: "隋唐",
      bio: "御注《孝经》把这部经典牢牢压进国家教化与官学传播主线，令其在礼制与伦理秩序中占据稳定位置。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-xing-bing-xiaojing",
      name: "邢昺",
      role: "疏解者",
      birthYear: 932,
      deathYear: 1010,
      era: "宋元",
      bio: "北宋经疏整理继续扩大《孝经》的教学覆盖面，使其能在家礼、官学与启蒙阅读之间反复回流。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "注",
    } as PersonNode,
  ],
  daxue: [
    {
      id: "person-chengyi-daxue",
      name: "程颐",
      role: "评论者",
      birthYear: 1033,
      deathYear: 1107,
      era: "宋",
      bio: "二程理学把《大学》从礼学篇章进一步推到修身工夫与政治秩序的核心位置。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "评",
    },
    {
      id: "person-zhen-de-xiu-daxue",
      name: "真德秀",
      role: "承继者",
      birthYear: 1178,
      deathYear: 1235,
      era: "宋元",
      bio: "南宋学者，以四书讲习与政治实践继续放大《大学》的修齐治平话语。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ],
  mengzi: [
    {
      id: "person-zhaoqi-mengzi",
      name: "赵岐",
      role: "注者",
      birthYear: 108,
      deathYear: 201,
      era: "两汉",
      bio: "东汉《孟子章句》系统长期构成《孟子》阅读的重要底座，为后世义理化与教材化提供注释前驱。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "注",
    },
    {
      id: "person-zhangzai-mengzi",
      name: "张载",
      role: "承继者",
      birthYear: 1020,
      deathYear: 1077,
      era: "宋",
      bio: "宋代理学家，经由气论与性善论的再阐释，使《孟子》重新进入理学核心地带。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ],
  shangshu: [
    {
      id: "person-fusheng-shangshu",
      name: "伏生",
      role: "传者",
      birthYear: -260,
      deathYear: -161,
      era: "两汉",
      bio: "汉初今文《尚书》传承的重要人物，说明《尚书》主河道在两汉已形成强烈的经学传播层。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 1,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-mei-ze-shangshu",
      name: "梅赜",
      role: "校传者",
      era: "魏晋",
      bio: "古文《尚书》流传与真伪争议长期伴随《尚书》主河道，使文本史本身也成为可讲的重要层次。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "校",
    },
  ],
  "sishu-zhangju": [
    {
      id: "person-lvzuqian-szj",
      name: "吕祖谦",
      role: "传播者",
      birthYear: 1137,
      deathYear: 1181,
      era: "宋",
      bio: "南宋书院讲会与刊刻网络共同推动四书体系扩散，吕祖谦所处学术环境正是这层传播中继的重要代表。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
    {
      id: "person-xu-heng-szj",
      name: "许衡",
      role: "承继者",
      birthYear: 1209,
      deathYear: 1281,
      era: "宋元",
      bio: "元代儒者，继续推动四书义理与教学系统进入更稳定的官学与书院秩序。",
      source: "curated",
      sourceStatus: "curated",
      relationTier: 2,
      relationType: "承",
    } as PersonNode,
  ],
};

for (const [slug, people] of Object.entries(curatedPeopleSupplements)) {
  const detail = details[slug];
  if (!detail || !people) {
    continue;
  }
  detail.people = mergeById(detail.people, people);
}

if (shanghaiLibraryActivity.available) {
  const venueSamples = shanghaiLibraryActivity.topVenues ?? [];
  const eventSamples = (shanghaiLibraryActivity.sampleRecords ?? []).map((record) => ({
    venue: record["场馆名称"] ?? "未知场馆",
    title: record["活动名称"] ?? "未知活动",
    status: record["预约状态"] ?? "未知状态",
    startTime: record["预约开始时间"] ?? "",
  }));

  for (const slug of ["shijing", "shangshu", "mengzi", "sishu-zhangju", "lunyu", "liji", "daxue", "zhongyong", "zhouyi", "xiaojing", "gongyang-zhuan", "chuci-zhangju", "wenxin-diaolong", "wenxuan"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel ?? "纪传人物库",
        "上海图书馆活动资料",
      ),
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        (venueSamples.length > 0
          ? `上图活动资料当前集中在 ${venueSamples[0].name}，可作为“文化传播现场”辅助信号。`
          : "上海图书馆活动资料已映入这段河面。"),
      venueSamples,
      eventSamples: eventSamples.slice(0, 3),
    };
  }
}

if (nanjingLibrarySample.available) {
  const institutionSamples = (nanjingLibrarySample.sampleRecords ?? []).slice(0, 4);
  for (const slug of ["ren-jian-ci-hua", "ri-zhi-lu", "shangshu-zhengyi", "wenxuan"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel ?? "纪传人物库",
        "南京图书馆图像资料",
      ),
      institutionSamples,
    };
  }
}

if (fudanArchiveSample.available) {
  const institutionSamples = (fudanArchiveSample.sampleRecords ?? []).slice(0, 2);
  for (const slug of ["ren-jian-ci-hua", "shuowen"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "复旦馆藏资料",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        fudanArchiveSample.summary ??
        "复旦大学图书馆馆藏资料已映入这段河面。",
    };
  }

  const genealogySamples = (fudanArchiveSample.sampleRecords ?? []).slice(0, 1).map((record) => ({
    ...record,
    category: "家学 / 递藏 / 地方书楼",
  }));
  const genealogySummary =
    "复旦馆藏中的周氏族裔、来雨楼递藏与地方藏书线索，已经把家学、家礼与家族传播正式挂进这段河面。";

  for (const slug of ["xiaojing", "liji", "daxue"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "家谱文献线索",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...genealogySamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary
          ? `${detail.realWorldSignals.venueSummary} 复旦馆藏中的家学与族裔递藏线索，也已把家族传播支流接入当前河段。`
          : genealogySummary,
    };
  }
}

if (nanhuArchiveSample.available) {
  const institutionSamples = (nanhuArchiveSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["zi-zhi-tong-jian", "chuci-zhangju", "wenxuan"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "南湖专题文献资料",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        nanhuArchiveSample.summary ??
        "南湖专题文献资料已映入这段河面。",
    };
  }
}

if (videoTopicSample.available) {
  const institutionSamples = (videoTopicSample.sampleRecords ?? []).slice(0, 4);
  for (const slug of ["ren-jian-ci-hua", "wenxuan", "wenxin-diaolong"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "近代上海城市文化专题片",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        videoTopicSample.summary ??
        "近代上海城市文化专题片资料已映入这段河面。",
    };
  }
}

if (shenzhenLibrarySample.available) {
  const institutionSamples = (shenzhenLibrarySample.sampleRecords ?? []).slice(0, 2);
  for (const slug of ["ren-jian-ci-hua", "zi-zhi-tong-jian", "shangshu-zhengyi"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "深圳图书馆专题资料",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        shenzhenLibrarySample.summary ??
        "深圳图书馆专题文化资料已映入这段河面。",
    };
  }
}

if (taofenMuseumSample.available) {
  const institutionSamples = (taofenMuseumSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["ren-jian-ci-hua", "ri-zhi-lu"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "韬奋纪念馆出版资料",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        taofenMuseumSample.summary ??
        "韬奋纪念馆近现代出版资料已映入这段河面。",
    };
  }
}

if (soongLiteratureSample.available) {
  const institutionSamples = (soongLiteratureSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["ren-jian-ci-hua", "shiji", "wenxuan"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "宋庆龄人物文献资料",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        soongLiteratureSample.summary ??
        "宋庆龄人物与事件资料已映入这段河面。",
    };
  }
}

if (souyunKnowledgeGraphSample.available) {
  const institutionSamples = (souyunKnowledgeGraphSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["shijing", "lunyu", "liji", "daxue", "zhongyong", "zhouyi", "mengzi", "sishu-zhangju", "ren-jian-ci-hua", "chuci-zhangju", "wenxin-diaolong", "wenxuan"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "搜韵知识图谱资料",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary: detail.realWorldSignals?.venueSummary
        ? `${detail.realWorldSignals.venueSummary} 同时已挂接搜韵知识图谱资料，可继续外推到诗文库、古籍库和文本比对能力。`
        : souyunKnowledgeGraphSample.summary ??
          "搜韵网古典诗词知识图谱资料已映入这段河面。",
    };
  }
}

if (periodicalIndexSample.available) {
  const institutionSamples = (periodicalIndexSample.sampleRecords ?? []).slice(0, 3);
  for (const slug of ["ren-jian-ci-hua", "ri-zhi-lu", "wenxin-diaolong"] as const) {
    const detail = details[slug];
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel,
        "全国报刊索引资料",
      ),
      institutionSamples: [
        ...(detail.realWorldSignals?.institutionSamples ?? []),
        ...institutionSamples,
      ],
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        periodicalIndexSample.summary ??
        "全国报刊索引近现代研究文献资料已映入这段河面。",
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
    "shangshu-zhengyi",
    "lunyu",
    "liji",
    "daxue",
    "zhongyong",
    "zhouyi",
    "xiaojing",
    "mengzi",
    "gongyang-zhuan",
    "shuowen",
    "sishu-zhangju",
    "shiji",
    "zi-zhi-tong-jian",
    "chuci-zhangju",
    "wenxin-diaolong",
    "wenxuan",
  ] as const) {
    const detail = details[slug];
    const matchedCount = detail.people.filter((person) => person.source === "cbdb").length;
    const fallbackCount = detail.people.filter((person) => person.source !== "cbdb").length;
    detail.realWorldSignals = {
      ...detail.realWorldSignals,
      sourceLabel: appendSourceLabel(
        detail.realWorldSignals?.sourceLabel ?? "上图数据",
        "纪传人物库",
      ),
      venueSummary:
        detail.realWorldSignals?.venueSummary ??
        `纪传人物库当前可用人物 ${cbdbSummary.personCount?.toLocaleString() ?? "未知"} 条；高频朝代分布为 ${topDynastyLine}。`,
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
