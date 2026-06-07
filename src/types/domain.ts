export type ConfidenceLayer = "metadata" | "explicit" | "semantic" | "influence";

export type ViewMode = "river" | "book";

export type BookCategory = "经" | "史" | "子" | "集";

export type RiverEra =
  | "先秦"
  | "两汉"
  | "魏晋"
  | "隋唐"
  | "宋元"
  | "明清"
  | "近现代";

export interface BookNode {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  dynasty: RiverEra;
  year: number;
  category: BookCategory;
  school: string;
  influence: number;
  velocity: number;
  branchLevel: number;
  summary: string;
  concepts: string[];
  coordinates: [number, number, number];
}

export interface CitationEdge {
  id: string;
  source: string;
  target: string;
  layer: ConfidenceLayer;
  confidence: number;
  label: string;
  evidence: string;
}

export interface PersonNode {
  id: string;
  name: string;
  role: string;
  birthYear?: number | null;
  deathYear?: number | null;
  era: string;
  bio: string;
  source?: "curated" | "cbdb";
  sourceStatus?: "matched" | "curated";
  matchedAlias?: string;
  relationTier?: 1 | 2;
  relationType?: "著" | "注" | "校" | "藏" | "引" | "评" | "承";
  activityPlaces?: Array<{
    name: string;
    firstYear?: number | null;
    lastYear?: number | null;
    note?: string;
  }>;
}

export interface PlaceNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  note: string;
}

export interface VersionNode {
  id: string;
  label: string;
  year: number;
  place: string;
  library: string;
  status: "存世" | "佚失";
  parentId?: string;
  note?: string;
  editionType?: "祖本" | "刻本" | "抄本" | "重刊本" | "整理本";
}

export interface TimelineEvent {
  id: string;
  year: number;
  title: string;
  detail: string;
  source?: "curated" | "cbdb";
}

export interface PassageLink {
  id: string;
  quote: string;
  sourceBookId: string;
  sourceTitle: string;
  layer: ConfidenceLayer;
  confidenceLabel: string;
  evidence: string;
}

export interface TextPassage {
  id: string;
  section: string;
  original: string;
  links: PassageLink[];
  tracePath?: Array<{
    id: string;
    title: string;
    relation: string;
    note: string;
  }>;
  downstreamInfluence?: Array<{
    id: string;
    targetTitle: string;
    relation: string;
    note: string;
    confidenceLabel: string;
  }>;
}

export interface BookDetail {
  bookId: string;
  heroMetric: {
    directCitations: number;
    downstreamInfluence: number;
    coveredRegions: number;
  };
  spread: Array<{
    id: string;
    fromPlaceId: string;
    toPlaceId: string;
    startYear: number;
    endYear: number;
    volume: number;
  }>;
  people: PersonNode[];
  places: PlaceNode[];
  versions: VersionNode[];
  timeline: TimelineEvent[];
  passages: TextPassage[];
  realWorldSignals?: {
    sourceLabel: string;
    venueSummary?: string;
    venueSamples?: Array<{
      name: string;
      sampleCount: number;
    }>;
    eventSamples?: Array<{
      venue: string;
      title: string;
      status: string;
      startTime: string;
    }>;
    institutionSamples?: Array<{
      institution: string;
      title: string;
      category?: string;
      year?: string;
      imageRef?: string;
      sourceText?: string;
    }>;
    cbdbMatchedPeople?: number;
    cbdbFallbackPeople?: number;
  };
}

export interface DatasetInsight {
  sourceAtlas?: Array<{
    id: string;
    name: string;
    summary?: string;
    stat?: string;
    magnitude?: number;
    evidenceLabel?: string;
    evidenceNote?: string;
    sampleTitles?: string[];
    sampleRecords?: Array<{
      title: string;
      category?: string;
      year?: string;
      note?: string;
    }>;
  }>;
  atlasMeta?: {
    demoBookCount: number;
    totalBookCount: number;
    totalCitationCount: number;
    activeSources: number;
    plannedLayers: string[];
    expansionNote: string;
    coverageLayers?: Array<{
      id: string;
      label: string;
      status: "已接入" | "示范接入" | "待扩展";
      scope: string;
      usage: string;
    }>;
  };
  cbdbSummary?: {
    available?: boolean;
    personCount?: number;
    topDynasties?: Array<{
      name: string;
      count: number;
    }>;
  };
  cbdbPeople?: Array<{
    name: string;
    foundInCbdb?: boolean;
    matchedAlias?: string;
  }>;
  shanghaiLibraryActivity?: {
    available?: boolean;
    sourceWorkbook?: string;
    sheetName?: string;
    sampleRecords?: Array<{
      venue?: string;
      title?: string;
      status?: string;
      startTime?: string;
    }>;
    topVenues?: Array<{
      name: string;
      sampleCount: number;
    }>;
  };
  shanghaiLibraryBorrow?: {
    available?: boolean;
    sourceWorkbook?: string;
    sheetName?: string;
    sampleRecords?: Array<{
      library?: string;
      title?: string;
      action?: string;
      publishYear?: string;
      author?: string;
    }>;
    topLibraries?: Array<{
      name: string;
      sampleCount: number;
    }>;
  };
  nanjingLibrarySample?: {
    available?: boolean;
    institution?: string;
    recordCount?: number;
    summary?: string;
    sampleTitles?: string[];
  };
  fudanArchiveSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    summary?: string;
  };
  nanhuArchiveSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    documentCount?: number;
    imageCount?: number;
    summary?: string;
  };
  videoTopicSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    summary?: string;
    sampleTitles?: string[];
  };
  shenzhenLibrarySample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    summary?: string;
    sampleTitles?: string[];
  };
  taofenMuseumSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    summary?: string;
    sampleTitles?: string[];
  };
  soongLiteratureSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    summary?: string;
    sampleTitles?: string[];
  };
  souyunKnowledgeGraphSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    summary?: string;
    sampleTitles?: string[];
  };
  periodicalIndexSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
    summary?: string;
    sampleTitles?: string[];
  };
}

export interface RiverDataset {
  books: BookNode[];
  citations: CitationEdge[];
  booksBySlug: Record<string, BookDetail>;
}
