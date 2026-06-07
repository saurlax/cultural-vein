import { NextResponse } from "next/server";

import { getSourceAtlasEntryPayload } from "@/server/payloads";

export function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return context.params.then(({ id }) => {
    const payload = getSourceAtlasEntryPayload(decodeURIComponent(id));

    if (!payload) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  });
}
