"use client";

import type { VersionNode } from "@/types/domain";

interface VersionTreeProps {
  versions: VersionNode[];
  activeVersionId?: string | null;
  onSelectVersion?: (versionId: string) => void;
}

interface VersionTreeItem extends VersionNode {
  depth: number;
}

function buildVersionTree(versions: VersionNode[]) {
  const map = new Map(versions.map((version) => [version.id, version]));
  const roots = versions.filter((version) => !version.parentId || !map.has(version.parentId));
  const ordered: VersionTreeItem[] = [];

  const walk = (node: VersionNode, depth: number) => {
    ordered.push({ ...node, depth });
    versions
      .filter((version) => version.parentId === node.id)
      .sort((left, right) => left.year - right.year)
      .forEach((child) => walk(child, depth + 1));
  };

  roots.sort((left, right) => left.year - right.year).forEach((root) => walk(root, 0));
  return ordered;
}

export function VersionTree({
  versions,
  activeVersionId,
  onSelectVersion,
}: VersionTreeProps) {
  const items = buildVersionTree(versions);

  return (
    <div className="rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.12),rgba(16,10,5,0.96))] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-stone-400">版本流变树</div>
          <div className="mt-1 text-sm text-stone-300">按祖本、传抄、刊刻与重刊关系展开版本链</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
          {versions.length} 个版本
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((version, index) => {
          const isActive = version.id === activeVersionId;
          const nextDepth = items[index + 1]?.depth ?? -1;

          return (
            <div key={version.id} className="flex gap-3">
              <div className="flex w-14 justify-center">
                <div className="relative flex w-full justify-center">
                  <div
                    className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] text-amber-100"
                    style={{ marginLeft: `${version.depth * 10}px` }}
                  >
                    第{version.depth + 1}层
                  </div>
                  <div
                    className={`mt-8 h-3 w-3 rounded-full ${
                      isActive ? "bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.45)]" : "bg-white/30"
                    }`}
                    style={{ marginLeft: `${version.depth * 20}px` }}
                  />
                  {index < items.length - 1 ? (
                    <div
                      className="absolute top-12 h-[calc(100%-2rem)] w-px bg-white/10"
                      style={{ left: `calc(50% + ${version.depth * 20}px)` }}
                    />
                  ) : null}
                  {version.depth > 0 ? (
                    <div
                      className="absolute top-11 h-px bg-white/10"
                      style={{
                        left: `calc(50% + ${(version.depth - 1) * 20}px)`,
                        width: "20px",
                      }}
                    />
                  ) : null}
                  {nextDepth > version.depth ? (
                    <div
                      className="absolute top-11 h-7 w-px bg-white/10"
                      style={{ left: `calc(50% + ${version.depth * 20}px + 20px)` }}
                    />
                  ) : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectVersion?.(version.id)}
                className={`flex-1 rounded-[22px] border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-amber-300/35 bg-amber-300/10 shadow-lg shadow-amber-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
                      {version.editionType ?? "版本节点"}
                    </div>
                    <div className="mt-2 text-sm font-medium text-stone-50">{version.label}</div>
                    <div className="mt-2 text-xs text-stone-400">
                      {version.year} · {version.place} · {version.library}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] ${
                        version.status === "存世"
                          ? "bg-emerald-300/10 text-emerald-100"
                          : "bg-white/10 text-stone-300"
                      }`}
                    >
                      {version.status}
                    </span>
                    {version.parentId ? (
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-stone-300">
                        承自上一层
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[10px] text-amber-100">
                        祖本起点
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
