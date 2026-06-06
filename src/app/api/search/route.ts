import { NextRequest, NextResponse } from "next/server";

import { searchConcepts } from "@/lib/concept-search";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const result = searchConcepts(query);

  return NextResponse.json(result);
}
