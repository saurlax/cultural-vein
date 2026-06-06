import { NextResponse } from "next/server";

import { riverDataset } from "@/data/demo-graph";

interface Params {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(_: Request, { params }: Params) {
  const { slug } = await params;
  const book = riverDataset.books.find((item) => item.slug === slug);
  const detail = riverDataset.booksBySlug[slug];

  if (!book || !detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    book,
    detail,
    related: riverDataset.citations.filter(
      (edge) => edge.source === book.id || edge.target === book.id,
    ),
  });
}
