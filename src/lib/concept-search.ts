import { riverDataset } from "@/data/river-dataset";
import type { BookNode } from "@/types/domain";

export interface ConceptSearchHit {
  book: BookNode;
  score: number;
  matchedConcepts: string[];
  matchedFields: string[];
}

export interface ConceptSearchResponse {
  query: string;
  total: number;
  hits: Array<{
    id: string;
    slug: string;
    title: string;
    shortTitle: string;
    dynasty: BookNode["dynasty"];
    category: BookNode["category"];
    school: string;
    summary: string;
    concepts: string[];
    score: number;
    matchedConcepts: string[];
    matchedFields: string[];
  }>;
  relatedConcepts: string[];
}

function normalizeInput(value: string) {
  return value.trim().toLowerCase();
}

function includesNormalized(source: string, query: string) {
  return source.toLowerCase().includes(query);
}

export function searchConcepts(query: string): ConceptSearchResponse {
  const normalizedQuery = normalizeInput(query);

  if (!normalizedQuery) {
    return {
      query,
      total: 0,
      hits: [],
      relatedConcepts: [],
    };
  }

  const hits: ConceptSearchHit[] = riverDataset.books
    .map((book) => {
      let score = 0;
      const matchedFields = new Set<string>();
      const matchedConcepts = new Set<string>();

      if (includesNormalized(book.title, normalizedQuery)) {
        score += book.title === query.trim() ? 30 : 20;
        matchedFields.add("题名");
      }

      if (includesNormalized(book.shortTitle, normalizedQuery)) {
        score += 16;
        matchedFields.add("简称");
      }

      if (includesNormalized(book.school, normalizedQuery)) {
        score += 10;
        matchedFields.add("学派");
      }

      if (includesNormalized(book.summary, normalizedQuery)) {
        score += 8;
        matchedFields.add("摘要");
      }

      if (includesNormalized(book.category, normalizedQuery)) {
        score += 6;
        matchedFields.add("类别");
      }

      book.concepts.forEach((concept) => {
        if (includesNormalized(concept, normalizedQuery)) {
          score += concept === query.trim() ? 22 : 14;
          matchedConcepts.add(concept);
          matchedFields.add("概念");
        }
      });

      if (score === 0) {
        return null;
      }

      score += Math.min(book.influence / 40, 6);
      score += Math.min(book.velocity / 50, 4);

      return {
        book,
        score,
        matchedConcepts: Array.from(matchedConcepts),
        matchedFields: Array.from(matchedFields),
      } satisfies ConceptSearchHit;
    })
    .filter((item): item is ConceptSearchHit => Boolean(item))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.book.year - right.book.year;
    });

  const topRelatedConcepts = Array.from(
    hits
      .slice(0, 8)
      .flatMap((hit) => hit.book.concepts)
      .reduce((map, concept) => {
        if (concept.toLowerCase() === normalizedQuery) {
          return map;
        }

        map.set(concept, (map.get(concept) ?? 0) + 1);
        return map;
      }, new Map<string, number>())
      .entries(),
  )
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))
    .slice(0, 6)
    .map(([concept]) => concept);

  return {
    query,
    total: hits.length,
    hits: hits.map((hit) => ({
      id: hit.book.id,
      slug: hit.book.slug,
      title: hit.book.title,
      shortTitle: hit.book.shortTitle,
      dynasty: hit.book.dynasty,
      category: hit.book.category,
      school: hit.book.school,
      summary: hit.book.summary,
      concepts: hit.book.concepts,
      score: Number(hit.score.toFixed(2)),
      matchedConcepts: hit.matchedConcepts,
      matchedFields: hit.matchedFields,
    })),
    relatedConcepts: topRelatedConcepts,
  };
}
