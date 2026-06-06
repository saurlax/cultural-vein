import { NextResponse } from "next/server";

import { riverDataset } from "@/data/demo-graph";

export function GET() {
  return NextResponse.json({
    books: riverDataset.books,
    citations: riverDataset.citations,
  });
}
