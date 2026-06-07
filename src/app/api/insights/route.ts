import { NextResponse } from "next/server";

import { getInsightsPayload } from "@/server/payloads";

export function GET() {
  return NextResponse.json(getInsightsPayload());
}
