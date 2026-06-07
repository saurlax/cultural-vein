import { NextResponse } from "next/server";

import { getBookPayload } from "@/server/payloads";

interface Params {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const payload = getBookPayload(slug);

  if (!payload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
