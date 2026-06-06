import { NextResponse } from "next/server";

import { riverDataset } from "@/data/river-dataset";

export function GET() {
  return NextResponse.json({
    books: riverDataset.books,
    citations: riverDataset.citations,
  });
}
