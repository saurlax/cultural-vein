import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getInsightsPayload } from "@/server/payloads";
import { riverDataset } from "@/data/river-dataset";

type RiverEra = "先秦" | "两汉" | "魏晋" | "隋唐" | "宋元" | "明清" | "近现代";

const repoRoot = join(import.meta.dirname, "..");
const shellPath = join(repoRoot, "src", "components", "cultural-vein-shell.tsx");
const shellSource = readFileSync(shellPath, "utf8");

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function getSourceThemeLabel(name: string) {
  if (name.includes("红色") || name.includes("南湖")) {
    return "红色支流";
  }

  if (name.includes("搜韵")) {
    return "诗学支流";
  }

  if (name.includes("纪传")) {
    return "人物支流";
  }

  if (name.includes("借阅")) {
    return "公共流通";
  }

  if (name.includes("活动")) {
    return "城市现场";
  }

  if (name.includes("专题片")) {
    return "城市影像";
  }

  if (name.includes("报刊")) {
    return "近现代文献";
  }

  if (name.includes("Artlib") || name.includes("艺术")) {
    return "艺术图像";
  }

  if (name.includes("图书馆") || name.includes("馆藏") || name.includes("纪念馆")) {
    return "馆藏支流";
  }

  if (name.includes("宋庆龄") || name.includes("韬奋")) {
    return "近现代支流";
  }

  return "来源支流";
}

function inferSourceAtlasEra(
  entry: NonNullable<ReturnType<typeof getInsightsPayload>["sourceAtlas"]>[number],
): RiverEra | null {
  const yearText = entry.sampleRecords?.map((record) => record.year).find(Boolean);

  if (yearText) {
    const matched = yearText.match(/-?\d{3,4}/);

    if (matched) {
      const year = Number(matched[0]);

      if (!Number.isNaN(year)) {
        if (year <= -221) {
          return "先秦";
        }

        if (year <= 220) {
          return "两汉";
        }

        if (year <= 589) {
          return "魏晋";
        }

        if (year <= 907) {
          return "隋唐";
        }

        if (year <= 1368) {
          return "宋元";
        }

        if (year <= 1911) {
          return "明清";
        }

        return "近现代";
      }
    }
  }

  if (
    entry.name.includes("南湖") ||
    entry.name.includes("红色") ||
    entry.name.includes("韬奋") ||
    entry.name.includes("宋庆龄") ||
    entry.name.includes("报刊") ||
    entry.name.includes("专题片") ||
    entry.name.includes("图书馆") ||
    entry.name.includes("纪念馆")
  ) {
    return "近现代";
  }

  return null;
}

const insights = getInsightsPayload();
const schools = ["全部", ...new Set(riverDataset.books.map((book) => book.school))];
const relationLayers = [...new Set(riverDataset.citations.map((citation) => citation.layer))];
const sourceAtlasThemes = [
  "全部",
  ...new Set((insights.sourceAtlas ?? []).map((entry) => getSourceThemeLabel(entry.name))),
];
const sourceAtlasEras = [
  "全部",
  ...new Set(
    (insights.sourceAtlas ?? [])
      .map((entry) => inferSourceAtlasEra(entry))
      .filter((era): era is RiverEra => era !== null),
  ),
];

assert(shellSource.includes("eras.map((era) => ("), "Era controls should render the full era list.");
assert(
  !shellSource.includes("eras.slice(0, 6).map((era) => ("),
  "Era controls should not truncate the era list.",
);

assert(schools.length > 6, "UI audit expects more than six school filters in the dataset.");
assert(shellSource.includes("schools.map((school) => ("), "School controls should render the full school list.");
assert(
  !shellSource.includes("schools.slice(0, 6).map((school) => ("),
  "Desktop school controls should not truncate the school list.",
);
assert(
  !shellSource.includes("schools.slice(0, 4).map((school) => ("),
  "Mobile school controls should not truncate the school list.",
);

assert(relationLayers.length === 4, "UI audit expects four relation layers in the citation dataset.");
assert(
  shellSource.includes("const compactRelationSummary = relationSummary.filter(({ count }) => count > 0);"),
  "Relation layer controls should keep every non-empty layer.",
);
assert(
  !shellSource.includes("relationSummary.filter(({ count }) => count > 0).slice(0, 3)"),
  "Relation layer controls should not truncate visible layers.",
);

assert(sourceAtlasThemes.length > 4, "UI audit expects more than four source atlas themes.");
assert(
  shellSource.includes("const compactSourceThemeOptions = sourceAtlasThemeOptions;"),
  "Source atlas theme controls should render the full theme list.",
);
assert(
  !shellSource.includes("compactSourceThemeOptions.slice(0, 2).map((theme) => ("),
  "Source atlas theme controls should not truncate visible options.",
);

assert(sourceAtlasEras.length > 2, "UI audit expects more than two source atlas era options.");
assert(
  shellSource.includes("const compactSourceEraOptions = sourceAtlasEraOptions;"),
  "Source atlas era controls should render the full era list.",
);
assert(
  !shellSource.includes("compactSourceEraOptions.slice(0, 2).map((era) => ("),
  "Source atlas era controls should not truncate visible options.",
);

assert(
  shellSource.includes("resolvedSearchResult.hits.slice(0, 3).map((hit) => ("),
  "Search results should expose multiple direct entry points.",
);
assert(
  !shellSource.includes("resolvedSearchResult.hits.slice(0, 1).map((hit) => ("),
  "Search results should not collapse to a single entry.",
);

console.log(
  [
    `UI surface audit passed.`,
    `Eras: 7`,
    `Schools: ${schools.length}`,
    `Relation layers: ${relationLayers.length}`,
    `Source themes: ${sourceAtlasThemes.length}`,
    `Source eras: ${sourceAtlasEras.length}`,
  ].join(" "),
);
