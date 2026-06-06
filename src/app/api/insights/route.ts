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
  };

  return NextResponse.json(payload);
}
