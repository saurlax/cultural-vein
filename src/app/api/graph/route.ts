import { NextResponse } from "next/server";

import { getGraphPayload } from "@/server/payloads";

export function GET() {
  return NextResponse.json(getGraphPayload());
}
