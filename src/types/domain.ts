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
  source?: "demo" | "cbdb";
  sourceStatus?: "matched" | "fallback";
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
  source?: "demo" | "cbdb";
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
    topVenues?: Array<{
      name: string;
      sampleCount: number;
    }>;
  };
  nanjingLibrarySample?: {
    available?: boolean;
    institution?: string;
    recordCount?: number;
    sampleTitles?: string[];
  };
  fudanArchiveSample?: {
    available?: boolean;
    institution?: string;
    collectionTitle?: string;
  };
}

export interface RiverDataset {
  books: BookNode[];
  citations: CitationEdge[];
  booksBySlug: Record<string, BookDetail>;
}
