import { NextResponse } from "next/server";

import { getSourceAtlasPayload } from "@/server/payloads";

export function GET() {
  return NextResponse.json(getSourceAtlasPayload());
}
