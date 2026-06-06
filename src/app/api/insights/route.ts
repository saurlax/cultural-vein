import { NextResponse } from "next/server";

import realSupplements from "@/data/generated/real-supplements.json";
import type { DatasetInsight } from "@/types/domain";

export function GET() {
  const payload: DatasetInsight = {
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
        }
      : undefined,
    nanjingLibrarySample: realSupplements.nanjingLibrarySample
      ? {
          available: realSupplements.nanjingLibrarySample.available,
          institution: realSupplements.nanjingLibrarySample.institution,
          recordCount: realSupplements.nanjingLibrarySample.recordCount,
          sampleTitles: realSupplements.nanjingLibrarySample.sampleTitles,
        }
      : undefined,
    fudanArchiveSample: realSupplements.fudanArchiveSample
      ? {
          available: realSupplements.fudanArchiveSample.available,
          institution: realSupplements.fudanArchiveSample.institution,
          collectionTitle: realSupplements.fudanArchiveSample.collectionTitle,
        }
      : undefined,
    nanhuArchiveSample: realSupplements.nanhuArchiveSample
      ? {
          available: realSupplements.nanhuArchiveSample.available,
          institution: realSupplements.nanhuArchiveSample.institution,
          collectionTitle: realSupplements.nanhuArchiveSample.collectionTitle,
          documentCount: realSupplements.nanhuArchiveSample.documentCount,
          imageCount: realSupplements.nanhuArchiveSample.imageCount,
        }
      : undefined,
    videoTopicSample: realSupplements.videoTopicSample
      ? {
          available: realSupplements.videoTopicSample.available,
          institution: realSupplements.videoTopicSample.institution,
          collectionTitle: realSupplements.videoTopicSample.collectionTitle,
          sampleTitles: realSupplements.videoTopicSample.sampleTitles,
        }
      : undefined,
    shenzhenLibrarySample: realSupplements.shenzhenLibrarySample
      ? {
          available: realSupplements.shenzhenLibrarySample.available,
          institution: realSupplements.shenzhenLibrarySample.institution,
          collectionTitle: realSupplements.shenzhenLibrarySample.collectionTitle,
          sampleTitles: realSupplements.shenzhenLibrarySample.sampleTitles,
        }
      : undefined,
    taofenMuseumSample: realSupplements.taofenMuseumSample
      ? {
          available: realSupplements.taofenMuseumSample.available,
          institution: realSupplements.taofenMuseumSample.institution,
          collectionTitle: realSupplements.taofenMuseumSample.collectionTitle,
          sampleTitles: realSupplements.taofenMuseumSample.sampleTitles,
        }
      : undefined,
    soongLiteratureSample: realSupplements.soongLiteratureSample
      ? {
          available: realSupplements.soongLiteratureSample.available,
          institution: realSupplements.soongLiteratureSample.institution,
          collectionTitle: realSupplements.soongLiteratureSample.collectionTitle,
          sampleTitles: realSupplements.soongLiteratureSample.sampleTitles,
        }
      : undefined,
  };

  return NextResponse.json(payload);
}
