import { NextRequest, NextResponse } from "next/server";

import { getSearchPayload } from "@/server/payloads";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const result = getSearchPayload(query);

  return NextResponse.json(result);
}
