import { NextResponse } from "next/server";

import { getSourceAtlasPayload } from "@/server/payloads";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitValue = searchParams.get("limit");
  const limit = limitValue ? Number(limitValue) : null;

  return NextResponse.json(
    getSourceAtlasPayload({
      q: searchParams.get("q") ?? undefined,
      era: searchParams.get("era"),
      theme: searchParams.get("theme"),
      limit: Number.isFinite(limit) ? limit : null,
    }),
  );
}
