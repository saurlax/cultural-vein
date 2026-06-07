"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { type ElementRef, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { SceneFocusState, TraceFocusState } from "@/components/book-explorer";
import type { BookNode, CitationEdge } from "@/types/domain";
import type { RiverEra, ViewMode } from "@/types/domain";

type OrbitControlsInstance = ElementRef<typeof OrbitControls>;
const RIVER_ERA_ORDER: RiverEra[] = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"];
const touchModeLabel = "单指拖河巡看，双指缩放卷面";
const RIVER_ERA_STORIES: Record<
  RiverEra,
  {
    lead: string;
    trunk: string;
  }
> = {
  "先秦": {
    lead: "主河仍在上游聚束，经典原点与最初的思想定型正在成势。",
    trunk: "主干以《诗经》《尚书》《周易》《论语》为轴，奠定后世经学源头。",
  },
  "两汉": {
    lead: "河道开始放宽，整理、篇章析出与训诂系统同步成形。",
    trunk: "《礼记》《大学》《中庸》《孝经》重编礼治与修身秩序，主河开始稳固。",
  },
  "魏晋": {
    lead: "主河进入重释与转写阶段，经学资源向文论与总集扩散。",
    trunk: "《文心雕龙》《昭明文选》把经典源流转译成新的诗文阅读传统。",
  },
  "隋唐": {
    lead: "河势转入官学整理期，正义、疏解与制度化讲授让主流更稳定。",
    trunk: "《尚书正义》代表的经疏，把原典固定为更大范围的教学主线。",
  },
  "宋元": {
    lead: "这是支流爆发的一层，理学重组与通史编纂让整条河强烈分流。",
    trunk: "《四书章句集注》《论语集注》《资治通鉴》把教材化与义理化推到高峰。",
  },
  "明清": {
    lead: "河道进入考据、反思与再整理阶段，旧支流收束，新支流转深。",
    trunk: "《日知录》把经世批评、训诂回流与制度反思重新压回主线。",
  },
  "近现代": {
    lead: "河面抵达近现代，古典资源被改写成新的出版与公共文化话语。",
    trunk: "《人间词话》把古典诗学转译为现代审美判断，让整条河重新发光。",
  },
};

export interface RiverBranchAnnotation {
  id: string;
  label: string;
  description: string;
  sourceSlug: string;
  targetSlug: string;
  accentColor: string;
  position: [number, number, number];
}

export interface RiverDockMarker {
  id: string;
  label: string;
  note?: string;
  accentColor?: string;
  position: [number, number, number];
}

interface SourceAtlasRoute {
  id: string;
  label: string;
  color: string;
  points: Array<[number, number, number]>;
}

interface RiverSceneProps {
  books: BookNode[];
  citations: CitationEdge[];
  selectedBookSlug: string;
  onSelectBook: (slug: string) => void;
  activeEra: RiverEra;
  viewMode: ViewMode;
  cinematicState?: "idle" | "diving" | "settling" | "returning";
  branchAnnotations?: RiverBranchAnnotation[];
  dockMarkers?: RiverDockMarker[];
  hoveredBranchId?: string | null;
  onHoverBranch?: (branchId: string | null) => void;
  traceFocus?: TraceFocusState | null;
  sceneFocus?: SceneFocusState | null;
  visibleNodeCount?: number;
  totalNodeCount?: number;
  highlightedBookSlugs?: string[];
  searchFocusSlug?: string | null;
  hoveredBookSlug?: string | null;
  onHoverBook?: (slug: string | null) => void;
  hoveredDockId?: string | null;
  onHoverDock?: (dockId: string | null) => void;
  selectedDockId?: string | null;
  onSelectDock?: (dockId: string | null) => void;
  sourceAtlasLabel?: string | null;
  sourceAtlasSummary?: string | null;
  sourceAtlasPathPoints?: Array<[number, number, number]>;
  sourceAtlasRoutes?: SourceAtlasRoute[];
  onOpenControlPanel?: (() => void) | null;
  onOpenEraPanel?: (() => void) | null;
  onReturnToRiver?: (() => void) | null;
  mobilePanelOpen?: boolean;
}

interface CruiseSnapshot {
  point: THREE.Vector3;
  tangent: THREE.Vector3;
}

interface CruiseAnchorMoment {
  id: string;
  progress: number;
  label: string;
  detail: string;
  emphasis: number;
  kind: "era" | "book" | "branch";
  era?: RiverEra;
}

interface RiverRibbonProps {
  points: THREE.Vector3[];
  width: number;
  color: string;
  glow: string;
  animated?: boolean;
  opacity?: number;
  glowOpacity?: number;
  emissiveIntensity?: number;
}

function pseudoNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function RiverRibbon({
  points,
  width,
  color,
  glow,
  animated = false,
  opacity = 0.85,
  glowOpacity = 0.08,
  emissiveIntensity = 0.45,
}: RiverRibbonProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 120, width, 20, false),
    [curve, width],
  );

  useFrame((state) => {
    if (!animated || !meshRef.current) {
      return;
    }

    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.05;
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.22}
          metalness={0.08}
          emissive={new THREE.Color(glow)}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh geometry={geometry} scale={[1.02, 1.02, 1.02]}>
        <meshBasicMaterial color={glow} transparent opacity={glowOpacity} />
      </mesh>
    </group>
  );
}

function AtmosphereField({
  activeEra,
  traceFocus,
  sceneFocus,
}: Pick<RiverSceneProps, "activeEra" | "traceFocus" | "sceneFocus">) {
  const fieldRef = useRef<THREE.Group>(null);
  const eraIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const warmth = eraIndex / Math.max(RIVER_ERA_ORDER.length - 1, 1);
  const focusBoost = traceFocus?.active ? 0.16 : sceneFocus?.active ? 0.09 : 0;
  const primaryOpacity = 0.08 + warmth * 0.04 + focusBoost;
  const secondaryOpacity = 0.06 + warmth * 0.035 + focusBoost * 0.72;
  const tertiaryOpacity = 0.04 + warmth * 0.03 + focusBoost * 0.6;
  const primaryColor = traceFocus?.active
    ? "#f59e0b"
    : sceneFocus?.active
      ? "#fde68a"
      : warmth > 0.68
        ? "#facc15"
        : "#d97706";
  const secondaryColor = warmth > 0.5 ? "#f6c453" : "#d6a33d";
  const tertiaryColor = warmth > 0.72 ? "#fef3c7" : "#b7791f";

  useFrame((state) => {
    if (!fieldRef.current) {
      return;
    }

    fieldRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.04) * 0.08;
    fieldRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.04;
  });

  return (
    <group ref={fieldRef}>
      <mesh position={[2.8, 3.6, -7]} scale={[9.5, 4.2, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={primaryColor} transparent opacity={primaryOpacity} />
      </mesh>
      <mesh position={[8.7, 2.5, -6.5]} scale={[7.4, 3.4, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={secondaryColor} transparent opacity={secondaryOpacity} />
      </mesh>
      <mesh position={[-1.8, 2.4, -5.8]} scale={[5.8, 2.6, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={tertiaryColor} transparent opacity={tertiaryOpacity} />
      </mesh>
    </group>
  );
}

function RiverBed({
  span = 24,
  depth = -1.14,
}: {
  span?: number;
  depth?: number;
}) {
  const bedRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!bedRef.current) {
      return;
    }

    bedRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.03) * 0.01;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.4, depth - 0.12, 0]}>
        <circleGeometry args={[span, 80]} />
        <meshBasicMaterial color="#040908" transparent opacity={0.96} />
      </mesh>
      <mesh ref={bedRef} rotation={[-Math.PI / 2, 0, 0]} position={[3.4, depth, 0]}>
        <planeGeometry args={[span * 1.6, span * 1.2, 48, 48]} />
        <meshStandardMaterial
          color="#6b4315"
          emissive={new THREE.Color("#9a6623")}
          emissiveIntensity={0.28}
          metalness={0.08}
          roughness={0.68}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.4, depth + 0.01, 0]}>
        <planeGeometry args={[span * 1.55, span * 1.16, 1, 1]} />
        <meshBasicMaterial color="#f6c453" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function RiverBanks() {
  const bankRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!bankRef.current) {
      return;
    }

    bankRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material;

      if (material instanceof THREE.MeshStandardMaterial) {
        material.emissiveIntensity =
          0.12 + Math.max(0, Math.sin(state.clock.elapsedTime * 0.3 + index * 0.35)) * 0.08;
      }
    });
  });

  return (
    <group ref={bankRef}>
      <mesh rotation={[-Math.PI / 2.02, 0, 0.14]} position={[3.05, -1.03, 4.15]}>
        <planeGeometry args={[23.2, 2.2, 1, 1]} />
        <meshStandardMaterial
          color="#8a5e21"
          emissive={new THREE.Color("#d0a04d")}
          emissiveIntensity={0.12}
          roughness={0.92}
          metalness={0.02}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2.08, 0, 0.11]} position={[3.2, -0.96, 3.45]}>
        <planeGeometry args={[21.5, 6.8, 1, 1]} />
        <meshStandardMaterial
          color="#7b511d"
          emissive={new THREE.Color("#b67a2f")}
          emissiveIntensity={0.2}
          roughness={0.94}
          metalness={0.02}
          transparent
          opacity={0.98}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2.02, 0, -0.12]} position={[3.7, -1.04, -4.2]}>
        <planeGeometry args={[24, 2.4, 1, 1]} />
        <meshStandardMaterial
          color="#7b4f1f"
          emissive={new THREE.Color("#be8534")}
          emissiveIntensity={0.12}
          roughness={0.92}
          metalness={0.02}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2.06, 0, -0.09]} position={[3.5, -0.98, -3.55]}>
        <planeGeometry args={[22.8, 7.6, 1, 1]} />
        <meshStandardMaterial
          color="#6d461c"
          emissive={new THREE.Color("#a66a24")}
          emissiveIntensity={0.18}
          roughness={0.95}
          metalness={0.02}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.35, -0.9, 4.45]}>
        <planeGeometry args={[18.5, 1.4, 1, 1]} />
        <meshBasicMaterial color="#f0cf84" transparent opacity={0.14} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.05]} position={[3.15, -0.88, 5.05]}>
        <planeGeometry args={[17.8, 0.42, 1, 1]} />
        <meshBasicMaterial color="#fff0c7" transparent opacity={0.18} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.55, -0.92, -4.6]}>
        <planeGeometry args={[19.4, 1.6, 1, 1]} />
        <meshBasicMaterial color="#e3b45b" transparent opacity={0.11} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -0.05]} position={[3.72, -0.9, -5.24]}>
        <planeGeometry args={[18.2, 0.44, 1, 1]} />
        <meshBasicMaterial color="#f1d187" transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

function ScrollContourLines() {
  const contourPaths = useMemo(
    () => [
      [
        new THREE.Vector3(-4.8, -0.72, 3.5),
        new THREE.Vector3(-0.8, -0.7, 3.85),
        new THREE.Vector3(3.6, -0.68, 3.72),
        new THREE.Vector3(8.5, -0.66, 3.38),
        new THREE.Vector3(12.2, -0.64, 3.55),
      ],
      [
        new THREE.Vector3(-5.1, -0.73, -3.85),
        new THREE.Vector3(-0.9, -0.71, -4.08),
        new THREE.Vector3(3.8, -0.69, -3.94),
        new THREE.Vector3(8.8, -0.67, -4.16),
        new THREE.Vector3(12.4, -0.65, -3.9),
      ],
      [
        new THREE.Vector3(-3.6, -0.7, 2.64),
        new THREE.Vector3(0.8, -0.69, 2.94),
        new THREE.Vector3(4.8, -0.68, 2.82),
        new THREE.Vector3(9.6, -0.66, 2.58),
      ],
      [
        new THREE.Vector3(-4.4, -0.69, 4.86),
        new THREE.Vector3(-0.2, -0.67, 5.08),
        new THREE.Vector3(4.2, -0.65, 4.92),
        new THREE.Vector3(8.9, -0.63, 4.76),
        new THREE.Vector3(12.1, -0.62, 4.98),
      ],
      [
        new THREE.Vector3(-4.8, -0.7, -5.14),
        new THREE.Vector3(-0.4, -0.69, -5.28),
        new THREE.Vector3(4.4, -0.67, -5.08),
        new THREE.Vector3(9.1, -0.65, -5.26),
        new THREE.Vector3(12.5, -0.64, -5.02),
      ],
    ],
    [],
  );

  return (
    <group>
      {contourPaths.map((points, index) => (
        <Line
          key={`scroll-contour-${index}`}
          points={points}
          color={index === 1 || index === 4 ? "#b88a34" : "#d7b567"}
          transparent
          opacity={index >= 3 ? 0.14 : index === 2 ? 0.18 : 0.24}
          lineWidth={1.2}
        />
      ))}
    </group>
  );
}

function ScrollMistBands() {
  const bandRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!bandRef.current) {
      return;
    }

    bandRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      mesh.position.y =
        0.32 + index * 0.18 + Math.sin(state.clock.elapsedTime * 0.24 + index * 0.62) * 0.03;
      mesh.rotation.z = Math.sin(state.clock.elapsedTime * 0.08 + index * 0.4) * 0.04;
    });
  });

  return (
    <group ref={bandRef}>
      <mesh position={[2.6, 0.32, -5.4]} scale={[13.6, 2.8, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#f2d38b" transparent opacity={0.08} />
      </mesh>
      <mesh position={[8.4, 0.5, -4.9]} scale={[10.4, 2.2, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#fde7b0" transparent opacity={0.075} />
      </mesh>
      <mesh position={[-1.6, 0.68, -4.2]} scale={[8.8, 1.9, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#e7bf63" transparent opacity={0.06} />
      </mesh>
      <mesh position={[4.6, 0.9, -6.2]} scale={[15.2, 2.6, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#f6deb0" transparent opacity={0.045} />
      </mesh>
    </group>
  );
}

function ScrollCanopy({
  activeEra,
  traceFocus,
  sceneFocus,
}: Pick<RiverSceneProps, "activeEra" | "traceFocus" | "sceneFocus">) {
  const canopyRef = useRef<THREE.Group>(null);
  const eraIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const warmth = eraIndex / Math.max(RIVER_ERA_ORDER.length - 1, 1);
  const focusBoost = traceFocus?.active ? 0.08 : sceneFocus?.active ? 0.05 : 0;
  const scrollGold = warmth > 0.55 ? "#f4d389" : "#d8ab56";
  const scrollPaper = warmth > 0.65 ? "#f7e7bf" : "#ead19a";
  const shadowTone = warmth > 0.7 ? "#6f4718" : "#55340f";

  useFrame((state) => {
    if (!canopyRef.current) {
      return;
    }

    canopyRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      mesh.position.y =
        (index === 0 ? 5.4 : index === 1 ? 4.7 : 4.05) +
        Math.sin(state.clock.elapsedTime * (0.07 + index * 0.015) + index * 0.8) * 0.08;
      mesh.rotation.z = Math.sin(state.clock.elapsedTime * 0.05 + index * 0.45) * 0.03;
    });
  });

  return (
    <group ref={canopyRef}>
      <mesh position={[3.2, 5.4, -8.2]} scale={[20.2, 7.4, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={scrollPaper} transparent opacity={0.11 + warmth * 0.06 + focusBoost} />
      </mesh>
      <mesh position={[8.8, 4.7, -7.6]} scale={[15.6, 5.8, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={scrollGold} transparent opacity={0.08 + warmth * 0.05 + focusBoost * 0.75} />
      </mesh>
      <mesh position={[-1.5, 4.05, -7.1]} scale={[11.4, 4.5, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={shadowTone} transparent opacity={0.07 + warmth * 0.035 + focusBoost * 0.65} />
      </mesh>
      <mesh position={[3.5, 5.9, -8.8]} scale={[20.4, 0.34, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#fff3cc" transparent opacity={0.08 + warmth * 0.03} />
      </mesh>
      <mesh position={[3.6, 3.28, -8.55]} scale={[19.6, 0.26, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#8b5a21" transparent opacity={0.07 + warmth * 0.03} />
      </mesh>
    </group>
  );
}

function ForegroundScrollVeil({
  activeEra,
  traceFocus,
  sceneFocus,
}: Pick<RiverSceneProps, "activeEra" | "traceFocus" | "sceneFocus">) {
  const veilRef = useRef<THREE.Group>(null);
  const eraIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const warmth = eraIndex / Math.max(RIVER_ERA_ORDER.length - 1, 1);
  const focusBoost = traceFocus?.active ? 0.08 : sceneFocus?.active ? 0.05 : 0;
  const edgeGold = warmth > 0.6 ? "#f3cf82" : "#cf9d46";
  const paperShadow = warmth > 0.6 ? "#7b4d1a" : "#5f3811";

  useFrame((state) => {
    if (!veilRef.current) {
      return;
    }

    veilRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      mesh.position.y =
        (index === 0 ? -0.42 : index === 1 ? -0.18 : 0.24) +
        Math.sin(state.clock.elapsedTime * (0.14 + index * 0.03) + index * 0.9) * 0.025;
      mesh.rotation.z = Math.sin(state.clock.elapsedTime * 0.08 + index * 0.35) * 0.025;
    });
  });

  return (
    <group ref={veilRef}>
      <mesh position={[3.5, -0.58, 6.9]} scale={[19.6, 2.74, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#4f2f0f" transparent opacity={0.18 + warmth * 0.04 + focusBoost * 0.4} />
      </mesh>
      <mesh position={[3.5, -0.42, 6.6]} scale={[18.4, 2.15, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={paperShadow} transparent opacity={0.13 + warmth * 0.04 + focusBoost * 0.5} />
      </mesh>
      <mesh position={[3.1, -0.18, 6.2]} scale={[16.8, 0.22, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={edgeGold} transparent opacity={0.2 + warmth * 0.05 + focusBoost * 0.6} />
      </mesh>
      <mesh position={[7.8, 0.24, 5.8]} scale={[7.2, 1.3, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#f8e8bc" transparent opacity={0.05 + warmth * 0.03 + focusBoost * 0.4} />
      </mesh>
      <mesh position={[-0.8, 0.16, 5.6]} scale={[6.4, 1.1, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#dba94e" transparent opacity={0.045 + warmth * 0.02 + focusBoost * 0.35} />
      </mesh>
      <mesh position={[-7.1, 0.28, 5.2]} scale={[1.18, 7.8, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#f5dd9f" transparent opacity={0.09 + warmth * 0.04} />
      </mesh>
      <mesh position={[14.2, 0.36, 5.2]} scale={[1.18, 7.8, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#ddb35b" transparent opacity={0.08 + warmth * 0.04} />
      </mesh>
      <mesh position={[-7.34, 0.34, 5.28]} scale={[0.22, 8.1, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#fff2cb" transparent opacity={0.14 + warmth * 0.03} />
      </mesh>
      <mesh position={[14.42, 0.4, 5.24]} scale={[0.22, 8.1, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#fff1c0" transparent opacity={0.12 + warmth * 0.03} />
      </mesh>
    </group>
  );
}

function EraRiverZones({
  books,
}: {
  books: BookNode[];
}) {
  const zoneRef = useRef<THREE.Group>(null);
  const zones = useMemo(
    () =>
      RIVER_ERA_ORDER
        .map((era, index) => {
          const eraBooks = books.filter((book) => book.dynasty === era);

          if (!eraBooks.length) {
            return null;
          }

          const xValues = eraBooks.map((book) => book.coordinates[0]);
          const zValues = eraBooks.map((book) => book.coordinates[2]);
          const minX = Math.min(...xValues);
          const maxX = Math.max(...xValues);
          const minZ = Math.min(...zValues);
          const maxZ = Math.max(...zValues);
          const centerX = (minX + maxX) / 2;
          const centerZ = (minZ + maxZ) / 2;

          return {
            era,
            index,
            position: [centerX, -1.02 - index * 0.008, centerZ] as [number, number, number],
            scale: [
              Math.max(1.8, maxX - minX + 2.2),
              1,
              Math.max(1.5, maxZ - minZ + 1.6),
            ] as [number, number, number],
            color:
              index % 3 === 0
                ? "#f59e0b"
                : index % 3 === 1
                  ? "#fcd34d"
                  : "#fb923c",
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [books],
  );

  useFrame((state) => {
    if (!zoneRef.current) {
      return;
    }

    zoneRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.42 + index * 0.38) * 0.035;
      mesh.scale.set(pulse, 1, pulse);
      const material = mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.05 + Math.max(0, Math.sin(state.clock.elapsedTime * 0.55 + index * 0.45)) * 0.035;
      }
    });
  });

  return (
    <group ref={zoneRef}>
      {zones.map((zone) => (
        <mesh
          key={`era-zone-${zone.era}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={zone.position}
          scale={zone.scale}
        >
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial color={zone.color} transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

function RiverParticleStream({
  points,
  color,
  density = 180,
  flowSpeed = 0.08,
  spread = 0.12,
}: {
  points: THREE.Vector3[];
  color: string;
  density?: number;
  flowSpeed?: number;
  spread?: number;
}) {
  const particleRef = useRef<THREE.Points>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const particleOffsets = useMemo(
    () => Array.from({ length: density }, (_, index) => density === 1 ? 0 : index / (density - 1)),
    [density],
  );
  const noiseOffsets = useMemo(
    () =>
      Array.from({ length: density }, (_, index) => ({
        x: (pseudoNoise(index + 1.37) - 0.5) * spread,
        y: (pseudoNoise(index * 2.13 + 4.2) - 0.5) * spread,
        z: (pseudoNoise(index * 0.73 + 9.4) - 0.5) * spread,
      })),
    [density, spread],
  );
  const positions = useMemo(() => {
    const values = new Float32Array(density * 3);

    for (let index = 0; index < density; index += 1) {
      const t = particleOffsets[index] ?? 0;
      const point = curve.getPointAt(t);
      const noise = noiseOffsets[index] ?? { x: 0, y: 0, z: 0 };
      values[index * 3] = point.x + noise.x;
      values[index * 3 + 1] = point.y + noise.y;
      values[index * 3 + 2] = point.z + noise.z;
    }

    return values;
  }, [curve, density, noiseOffsets, particleOffsets]);

  useFrame((state) => {
    const geometry = particleRef.current?.geometry;
    const positionAttribute = geometry?.getAttribute("position");

    if (!particleRef.current || !positionAttribute) {
      return;
    }

    for (let index = 0; index < density; index += 1) {
      const baseOffset = particleOffsets[index] ?? 0;
      const noise = noiseOffsets[index] ?? { x: 0, y: 0, z: 0 };
      const t = (state.clock.elapsedTime * flowSpeed + baseOffset) % 1;
      const point = curve.getPointAt(t);

      positionAttribute.setXYZ(
        index,
        point.x + noise.x,
        point.y + noise.y,
        point.z + noise.z,
      );
    }

    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={particleRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.06} transparent opacity={0.75} />
    </points>
  );
}

function FlowBeacons({
  books,
  activeEra,
}: {
  books: BookNode[];
  activeEra: RiverEra;
}) {
  const beaconRef = useRef<THREE.Group>(null);
  const activeIndex = RIVER_ERA_ORDER.indexOf(activeEra);
  const latestBooks = books
    .filter((book) => RIVER_ERA_ORDER.indexOf(book.dynasty) === activeIndex)
    .slice(0, 4);

  useFrame((state) => {
    if (!beaconRef.current) {
      return;
    }

    beaconRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4 + index * 0.85) * 0.18;
      mesh.scale.setScalar(pulse);
      const material = mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.18 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.4 + index * 0.85)) * 0.18;
      }
    });
  });

  return (
    <group ref={beaconRef}>
      {latestBooks.map((book) => (
        <mesh
          key={`beacon-${book.id}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[book.coordinates[0], book.coordinates[1] - 0.03, book.coordinates[2]]}
        >
          <ringGeometry args={[0.26, 0.4, 40]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.24} />
        </mesh>
      ))}
    </group>
  );
}

function EraMilestones({
  books,
  activeEra,
}: {
  books: BookNode[];
  activeEra: RiverEra;
}) {
  const activeIndex = RIVER_ERA_ORDER.indexOf(activeEra);
  const milestoneRef = useRef<THREE.Group>(null);
  const milestones = useMemo(
    () =>
      RIVER_ERA_ORDER
        .map((era, index) => {
          const eraBooks = books.filter((book) => book.dynasty === era);

          if (!eraBooks.length) {
            return null;
          }

          const center = eraBooks.reduce(
            (accumulator, book) => {
              accumulator.x += book.coordinates[0];
              accumulator.y += book.coordinates[1];
              accumulator.z += book.coordinates[2];
              return accumulator;
            },
            { x: 0, y: 0, z: 0 },
          );

          const count = eraBooks.length;
          return {
            era,
            index,
            position: [
              center.x / count,
              center.y / count + 0.34 + index * 0.015,
              center.z / count,
            ] as [number, number, number],
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [books],
  );

  useFrame((state) => {
    if (!milestoneRef.current) {
      return;
    }

    milestoneRef.current.children.forEach((child, index) => {
      const group = child as THREE.Group;
      const baseY = milestones[index]?.position[1] ?? 0;
      group.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.75 + index * 0.42) * 0.025;
    });
  });

  return (
    <group ref={milestoneRef}>
      {milestones.map((milestone) => {
        const isActive = milestone.index <= activeIndex;

        return (
          <group
            key={`era-milestone-${milestone.era}`}
            position={milestone.position}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.14, 0.24, 32]} />
              <meshBasicMaterial
                color={isActive ? "#fde68a" : "#78716c"}
                transparent
                opacity={isActive ? 0.45 : 0.16}
              />
            </mesh>
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.32, 12]} />
              <meshBasicMaterial
                color={isActive ? "#fbbf24" : "#57534e"}
                transparent
                opacity={isActive ? 0.72 : 0.24}
              />
            </mesh>
            <Text
              position={[0, 0.34, 0]}
              fontSize={0.14}
              maxWidth={1.2}
              color={isActive ? "#fef3c7" : "#a8a29e"}
              anchorX="center"
              anchorY="middle"
            >
              {milestone.era}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function BookMarkers({
  books,
  selectedBookSlug,
  onSelectBook,
  activeEra,
  viewMode,
  traceFocus,
  sceneFocus,
  cruiseProgress,
  cruiseRunning,
  highlightedBookSlugs = [],
  hoveredBookSlug,
  onHoverBook,
}: {
  books: BookNode[];
  selectedBookSlug: string;
  onSelectBook: (slug: string) => void;
  activeEra: RiverEra;
  viewMode: ViewMode;
  traceFocus?: TraceFocusState | null;
  sceneFocus?: SceneFocusState | null;
  cruiseProgress: number;
  cruiseRunning: boolean;
  highlightedBookSlugs?: string[];
  hoveredBookSlug?: string | null;
  onHoverBook?: (slug: string | null) => void;
}) {
  const activeIndex = RIVER_ERA_ORDER.indexOf(activeEra);
  const traceTitleSet = useMemo(
    () => new Set(traceFocus?.titles ?? []),
    [traceFocus?.titles],
  );
  const highlightedSlugSet = useMemo(
    () => new Set(highlightedBookSlugs),
    [highlightedBookSlugs],
  );
  const bookProgressMap = useMemo(() => {
    const orderedBooks = [...books].sort((left, right) => left.year - right.year);
    return new Map(
      orderedBooks.map((book, index) => [
        book.slug,
        orderedBooks.length <= 1 ? 0 : index / (orderedBooks.length - 1),
      ]),
    );
  }, [books]);
  const hasSearchHighlight = highlightedBookSlugs.length > 0;
  const markerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!markerRef.current) {
      return;
    }

    markerRef.current.children.forEach((child, index) => {
      const group = child as THREE.Group;
      group.position.y = books[index]?.coordinates[1] + Math.sin(state.clock.elapsedTime * 0.8 + index * 0.35) * 0.02;
    });
  });

  return (
    <group ref={markerRef}>
      {books.map((book) => {
        const isSelected = book.slug === selectedBookSlug;
        const isHovered = hoveredBookSlug === book.slug;
        const bookEraIndex = RIVER_ERA_ORDER.indexOf(book.dynasty);
        const isNewestVisible = bookEraIndex === activeIndex;
        const isTraceLinked = traceTitleSet.has(book.title);
        const isTraceCurrent = traceFocus?.currentTitle === book.title;
        const isSceneFocused =
          sceneFocus?.active === true && sceneFocus.currentTitle === book.title;
        const isSearchHighlighted = highlightedSlugSet.has(book.slug);
        const bookProgress = bookProgressMap.get(book.slug) ?? 0;
        const revealDistance = Math.abs(bookProgress - cruiseProgress);
        const revealBlend = THREE.MathUtils.clamp(1 - revealDistance / 0.2, 0, 1);
        const shouldUseCruiseReveal =
          viewMode === "river" &&
          cruiseRunning &&
          !selectedBookSlug &&
          !traceFocus?.active &&
          !sceneFocus?.active &&
          !hasSearchHighlight;
        const isCruiseStrong = shouldUseCruiseReveal && revealBlend > 0.66;
        const isCruiseSoft = shouldUseCruiseReveal && revealBlend > 0.42;
        const shouldDim =
          ((viewMode === "book" || Boolean(traceFocus?.active) || Boolean(sceneFocus?.active)) &&
          !isSelected &&
          !isTraceLinked &&
          !isSceneFocused &&
          !isNewestVisible) ||
          (hasSearchHighlight && !isSearchHighlighted && !isSelected && !isTraceLinked && !isSceneFocused);
        const markerColor = isTraceCurrent
          ? "#fbbf24"
          : isSceneFocused
            ? "#fde68a"
          : isHovered
            ? "#fde68a"
          : isSelected
            ? "#fcd34d"
            : isSearchHighlighted
              ? "#fde68a"
            : isTraceLinked
              ? "#fde68a"
              : "#f8e7b2";
        const emissive = isTraceCurrent
          ? "#f59e0b"
          : isSceneFocused
            ? "#f59e0b"
          : isHovered
            ? "#fbbf24"
          : isSelected
            ? "#f59e0b"
            : isSearchHighlighted
              ? "#f59e0b"
            : isTraceLinked
              ? "#d97706"
              : isNewestVisible
                ? "#facc15"
                : "#eab308";
        const markerSize = isTraceCurrent
          ? 0.25
          : isSceneFocused
            ? 0.22
          : isHovered
            ? 0.21
          : isSelected
            ? 0.22
            : isSearchHighlighted
              ? 0.2
            : isTraceLinked
              ? 0.19
              : isCruiseStrong
                ? 0.18
              : isCruiseSoft
                ? 0.16
              : isNewestVisible
                ? 0.155
                : shouldDim
                  ? 0.12
                  : 0.135;

        return (
          <group key={book.id} position={book.coordinates}>
            <mesh
              onClick={() => onSelectBook(book.slug)}
              onPointerOver={() => onHoverBook?.(book.slug)}
              onPointerOut={() => onHoverBook?.(null)}
            >
              <sphereGeometry args={[markerSize, 24, 24]} />
              <meshStandardMaterial
                color={markerColor}
                transparent
                opacity={
                  shouldDim
                    ? 0.14
                    : isHovered || isSearchHighlighted || isSelected || isTraceLinked || isSceneFocused
                      ? 1
                      : isCruiseStrong
                        ? 0.38 + revealBlend * 0.48
                      : isCruiseSoft
                        ? 0.16 + revealBlend * 0.2
                        : isNewestVisible
                          ? 0.34
                          : 0.16
                }
                emissive={new THREE.Color(emissive)}
                emissiveIntensity={
                  isTraceCurrent
                    ? 1.7
                    : isHovered
                      ? 1.45
                    : isSearchHighlighted
                      ? 1.25
                      : isTraceLinked
                        ? 1.1
                        : isCruiseStrong
                          ? 0.48 + revealBlend * 0.68
                        : isCruiseSoft
                          ? 0.22 + revealBlend * 0.24
                        : isNewestVisible
                          ? 0.7
                          : 0.28
                }
              />
            </mesh>
            {isTraceLinked || isSearchHighlighted || isHovered || isSelected || isCruiseStrong ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <ringGeometry
                  args={[markerSize + 0.08, markerSize + (isTraceCurrent ? 0.2 : isHovered ? 0.18 : isCruiseStrong ? 0.16 : 0.15), 32]}
                />
                <meshBasicMaterial
                  color={
                    isTraceCurrent
                      ? "#fbbf24"
                      : isHovered
                        ? "#fde68a"
                        : isSearchHighlighted
                          ? "#fde68a"
                          : isCruiseStrong
                            ? "#facc15"
                            : "#f59e0b"
                  }
                  transparent
                  opacity={isTraceCurrent ? 0.65 : isHovered ? 0.52 : isSearchHighlighted ? 0.4 : isCruiseStrong ? 0.24 + revealBlend * 0.22 : 0.28}
                />
              </mesh>
            ) : null}
            <Text
              position={[0, isTraceLinked || isSearchHighlighted || isHovered || isCruiseStrong ? 0.46 : 0.38, 0]}
              fontSize={isTraceCurrent ? 0.19 : isHovered ? 0.18 : 0.17}
              color={
                isTraceCurrent
                  ? "#fef3c7"
                  : isHovered
                    ? "#fde68a"
                  : isSelected
                    ? "#fde68a"
                    : isSearchHighlighted
                      ? "#fef3c7"
                    : isTraceLinked
                      ? "#fef3c7"
                      : shouldDim
                        ? "#78716c"
                        : "#e7e5e4"
              }
              fillOpacity={
                isTraceCurrent || isHovered || isSelected || isSearchHighlighted || isTraceLinked || isSceneFocused
                  ? 1
                  : isCruiseStrong
                    ? 0.44 + revealBlend * 0.46
                  : isCruiseSoft
                    ? 0.12 + revealBlend * 0.16
                    : isNewestVisible
                      ? 0.28
                      : 0.1
              }
              anchorX="center"
              anchorY="middle"
            >
              {isTraceCurrent
                ? `${book.shortTitle} · 正在溯源`
                : isSceneFocused
                  ? `${book.shortTitle} · 场景联动`
                  : isHovered
                    ? `${book.shortTitle} · 点此入卷`
                  : isSearchHighlighted
                    ? `${book.shortTitle} · 概念命中`
                  : isTraceLinked
                    ? `${book.shortTitle} · 溯源链`
                    : isCruiseStrong
                      ? `${book.shortTitle} · 河段正显`
                    : isNewestVisible
                      ? `${book.shortTitle} · 新显现`
                    : book.shortTitle}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function CitationArcs({
  books,
  citations,
  selectedBookSlug,
  traceFocus,
  sceneFocus,
  highlightedBookSlugs = [],
}: {
  books: BookNode[];
  citations: CitationEdge[];
  selectedBookSlug: string;
  traceFocus?: TraceFocusState | null;
  sceneFocus?: SceneFocusState | null;
  highlightedBookSlugs?: string[];
}) {
  const bookMap = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );
  const traceTitleSet = useMemo(
    () => new Set(traceFocus?.titles ?? []),
    [traceFocus?.titles],
  );
  const highlightedSlugSet = useMemo(
    () => new Set(highlightedBookSlugs),
    [highlightedBookSlugs],
  );
  const hasSearchHighlight = highlightedBookSlugs.length > 0;

  return (
    <>
      {citations.map((citation) => {
        const source = bookMap.get(citation.source);
        const target = bookMap.get(citation.target);

        if (!source || !target) {
          return null;
        }

        const start = new THREE.Vector3(...source.coordinates);
        const end = new THREE.Vector3(...target.coordinates);
        const middle = start
          .clone()
          .lerp(end, 0.5)
          .add(new THREE.Vector3(0, 0.5 + citation.confidence * 0.35, 0));
        const curve = new THREE.CatmullRomCurve3([start, middle, end]);
        const points = curve.getPoints(32);
        const sourceSelected = source.slug === selectedBookSlug;
        const targetSelected = target.slug === selectedBookSlug;
        const traceLinked = traceTitleSet.has(source.title) || traceTitleSet.has(target.title);
        const sceneLinked =
          sceneFocus?.active === true &&
          (source.title === sceneFocus.currentTitle || target.title === sceneFocus.currentTitle);
        const searchLinked =
          highlightedSlugSet.has(source.slug) || highlightedSlugSet.has(target.slug);
        const isFocusedArc = sourceSelected || targetSelected || traceLinked || sceneLinked;
        const searchFlowColor =
          citation.layer === "explicit"
            ? "#6ee7b7"
            : citation.layer === "semantic"
              ? "#fde68a"
              : citation.layer === "influence"
                ? "#cbd5e1"
                : "#fef3c7";
        const style =
          citation.layer === "metadata"
            ? {
                color: "#f8fafc",
                dashed: false,
                dashSize: 0,
                gapSize: 0,
                lineWidth: isFocusedArc ? 1.85 : 1.1,
              }
            : citation.layer === "explicit"
              ? {
                  color: "#34d399",
                  dashed: false,
                  dashSize: 0,
                  gapSize: 0,
                  lineWidth: isFocusedArc ? 2 : 1.2,
                }
              : citation.layer === "semantic"
                ? {
                    color: "#fcd34d",
                    dashed: true,
                    dashSize: 0.28,
                    gapSize: 0.16,
                    lineWidth: isFocusedArc ? 2.05 : 1.35,
                  }
                : {
                    color: "#94a3b8",
                    dashed: true,
                    dashSize: 0.06,
                    gapSize: 0.14,
                    lineWidth: isFocusedArc ? 1.8 : 1.1,
                  };

        return (
          <group key={citation.id}>
            <Line
              points={points}
              color={style.color}
              transparent
              opacity={
                isFocusedArc
                  ? 0.94
                  : hasSearchHighlight
                    ? searchLinked
                      ? 0.78
                      : 0.08
                    : selectedBookSlug
                      ? 0.2
                      : 0.68
              }
              lineWidth={style.lineWidth}
              dashed={style.dashed}
              dashSize={style.dashSize}
              gapSize={style.gapSize}
            />
            {citation.layer !== "metadata" ? (
              <Line
                points={points}
                color={style.color}
                transparent
                opacity={
                  isFocusedArc
                    ? 0.16
                    : hasSearchHighlight
                      ? searchLinked
                        ? 0.12
                        : 0.02
                      : selectedBookSlug
                        ? 0.04
                        : 0.08
                }
                lineWidth={style.lineWidth + 3.2}
                dashed={style.dashed}
                dashSize={style.dashSize}
                gapSize={style.gapSize}
              />
            ) : null}
            {hasSearchHighlight && searchLinked && !isFocusedArc ? (
              <Line
                points={points}
                color={searchFlowColor}
                transparent
                opacity={0.18}
                lineWidth={style.lineWidth + 5.2}
                dashed={style.dashed}
                dashSize={style.dashSize}
                gapSize={style.gapSize}
              />
            ) : null}
          </group>
        );
      })}
    </>
  );
}

function FocusHalo({
  selectedBookPosition,
  traceFocus,
  sceneFocus,
}: {
  selectedBookPosition: THREE.Vector3 | null;
  traceFocus?: TraceFocusState | null;
  sceneFocus?: SceneFocusState | null;
}) {
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!haloRef.current || !selectedBookPosition) {
      return;
    }

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.6) * 0.08;
    haloRef.current.scale.set(pulse, pulse, pulse);
    const material = haloRef.current.material;
    if (material instanceof THREE.MeshBasicMaterial) {
      material.opacity = traceFocus?.active ? 0.24 : sceneFocus?.active ? 0.22 : 0.16;
    }
  });

  if (!selectedBookPosition) {
    return null;
  }

  return (
    <mesh
      ref={haloRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[selectedBookPosition.x, selectedBookPosition.y - 0.05, selectedBookPosition.z]}
    >
      <ringGeometry args={[0.36, 0.62, 48]} />
      <meshBasicMaterial
        color={traceFocus?.active ? "#f59e0b" : sceneFocus?.active ? "#fde68a" : "#fcd34d"}
        transparent
        opacity={0.16}
      />
    </mesh>
  );
}

function FocusCurrentAura({
  focusPosition,
  color,
}: {
  focusPosition: THREE.Vector3 | null;
  color: string;
}) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const beamGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!focusPosition) {
      return;
    }

    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.12;
    const outerPulse = 1 + Math.sin(state.clock.elapsedTime * 1.15 + 0.4) * 0.18;

    if (outerRingRef.current) {
      outerRingRef.current.scale.set(outerPulse, outerPulse, outerPulse);
      const material = outerRingRef.current.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.18 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.15)) * 0.12;
      }
    }

    if (innerRingRef.current) {
      innerRingRef.current.scale.set(pulse, pulse, pulse);
      const material = innerRingRef.current.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.24 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.8 + 0.6)) * 0.16;
      }
    }

    if (beamGroupRef.current) {
      beamGroupRef.current.position.y = focusPosition.y + 0.58 + Math.sin(state.clock.elapsedTime * 1.3) * 0.06;
      beamGroupRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        mesh.rotation.y = state.clock.elapsedTime * (0.12 + index * 0.04);
      });
    }
  });

  if (!focusPosition) {
    return null;
  }

  return (
    <group position={[focusPosition.x, focusPosition.y, focusPosition.z]}>
      <mesh
        ref={outerRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.06, 0]}
      >
        <ringGeometry args={[0.72, 1.12, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} />
      </mesh>
      <mesh
        ref={innerRingRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.04, 0]}
      >
        <ringGeometry args={[0.38, 0.68, 48]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.28} />
      </mesh>
      <group ref={beamGroupRef} position={[0, 0.58, 0]}>
        <mesh scale={[0.28, 1.5, 0.28]}>
          <cylinderGeometry args={[1, 1, 1, 24, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.07} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, Math.PI / 4, 0]} scale={[0.18, 1.25, 1.1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.09} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, -Math.PI / 4, 0]} scale={[0.18, 1.25, 1.1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function BranchMarkers({
  annotations,
  selectedBookSlug,
  onSelectBook,
  hoveredBranchId,
  onHoverBranch,
  cruiseProgress,
  cruiseRunning,
}: {
  annotations: RiverBranchAnnotation[];
  selectedBookSlug: string;
  onSelectBook: (slug: string) => void;
  hoveredBranchId?: string | null;
  onHoverBranch?: (branchId: string | null) => void;
  cruiseProgress: number;
  cruiseRunning: boolean;
}) {
  const branchRef = useRef<THREE.Group>(null);
  const branchProgressMap = useMemo(() => {
    const orderedAnnotations = [...annotations].sort(
      (left, right) => left.position[0] - right.position[0],
    );

    return new Map(
      orderedAnnotations.map((annotation, index) => [
        annotation.id,
        orderedAnnotations.length <= 1 ? 0 : index / (orderedAnnotations.length - 1),
      ]),
    );
  }, [annotations]);

  useFrame((state) => {
    if (!branchRef.current) {
      return;
    }

    branchRef.current.children.forEach((child, index) => {
      const group = child as THREE.Group;
      group.position.y = annotations[index]!.position[1] + Math.sin(state.clock.elapsedTime * 1.1 + index * 0.65) * 0.03;
    });
  });

  return (
    <group ref={branchRef}>
      {annotations.map((annotation) => {
        const isHovered = hoveredBranchId === annotation.id;
        const isSelected = selectedBookSlug === annotation.targetSlug;
        const branchProgress = branchProgressMap.get(annotation.id) ?? 0;
        const revealDistance = Math.abs(branchProgress - cruiseProgress);
        const revealBlend = THREE.MathUtils.clamp(1 - revealDistance / 0.16, 0, 1);
        const shouldUseCruiseReveal = cruiseRunning && !selectedBookSlug && !hoveredBranchId;
        const isCruiseNearby = shouldUseCruiseReveal && revealBlend > 0.34;
        const markerRadius = isHovered || isSelected ? 0.14 : isCruiseNearby ? 0.125 : 0.1;
        const markerOpacity = isHovered || isSelected ? 0.92 : isCruiseNearby ? 0.28 + revealBlend * 0.34 : 0.1;
        const labelOpacity = isHovered || isSelected ? 1 : isCruiseNearby ? 0.24 + revealBlend * 0.44 : 0.04;

        return (
          <group key={annotation.id} position={annotation.position}>
            <mesh
              onClick={() => onSelectBook(annotation.targetSlug)}
              onPointerOver={() => onHoverBranch?.(annotation.id)}
              onPointerOut={() => onHoverBranch?.(null)}
            >
              <sphereGeometry args={[markerRadius, 18, 18]} />
              <meshStandardMaterial
                color={isSelected ? "#fde68a" : annotation.accentColor}
                transparent
                opacity={markerOpacity}
                emissive={new THREE.Color(annotation.accentColor)}
                emissiveIntensity={
                  isHovered ? 1.5 : isSelected ? 1.3 : isCruiseNearby ? 0.56 + revealBlend * 0.54 : 0.22
                }
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
              <ringGeometry args={[0.18, isHovered || isSelected ? 0.31 : isCruiseNearby ? 0.29 : 0.24, 40]} />
              <meshBasicMaterial
                color={annotation.accentColor}
                transparent
                opacity={isHovered || isSelected ? 0.75 : isCruiseNearby ? 0.18 + revealBlend * 0.24 : 0.04}
              />
            </mesh>
            <Text
              position={[0, 0.3, 0]}
              fontSize={0.12}
              maxWidth={1.6}
              color={isHovered || isSelected ? "#fef3c7" : "#e7e5e4"}
              fillOpacity={labelOpacity}
              anchorX="center"
              anchorY="middle"
            >
              {annotation.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function DockMarkers({
  dockMarkers,
  activeColor,
  hoveredDockId,
  onHoverDock,
  selectedDockId,
  onSelectDock,
}: {
  dockMarkers: RiverDockMarker[];
  activeColor: string;
  hoveredDockId?: string | null;
  onHoverDock?: (dockId: string | null) => void;
  selectedDockId?: string | null;
  onSelectDock?: (dockId: string | null) => void;
}) {
  const dockRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!dockRef.current) {
      return;
    }

    dockRef.current.children.forEach((child, index) => {
      const group = child as THREE.Group;
      group.position.y = dockMarkers[index]!.position[1] + Math.sin(state.clock.elapsedTime * 0.95 + index * 0.55) * 0.02;
    });
  });

  if (dockMarkers.length === 0) {
    return null;
  }

  return (
    <group ref={dockRef}>
      {dockMarkers.map((dock, index) => (
        <group key={dock.id} position={dock.position}>
          {/** Selected or hovered data docks should feel anchored and readable. */}
          <mesh
            position={[0, 0.12, 0]}
            onPointerOver={() => onHoverDock?.(dock.id)}
            onPointerOut={() => onHoverDock?.(null)}
            onClick={() => onSelectDock?.(selectedDockId === dock.id ? null : dock.id)}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.28, 12]} />
            <meshStandardMaterial
              color="#e7c97c"
              emissive={new THREE.Color(dock.accentColor ?? "#d97706")}
              emissiveIntensity={
                hoveredDockId === dock.id || selectedDockId === dock.id ? 0.92 : 0.55
              }
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
            <ringGeometry
              args={[
                0.08,
                hoveredDockId === dock.id || selectedDockId === dock.id ? 0.19 : 0.15,
                28,
              ]}
            />
            <meshBasicMaterial
              color={dock.accentColor ?? activeColor}
              transparent
              opacity={
                (hoveredDockId === dock.id || selectedDockId === dock.id ? 0.62 : 0.34) +
                index * 0.03
              }
            />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <sphereGeometry
              args={[
                hoveredDockId === dock.id || selectedDockId === dock.id ? 0.06 : 0.045,
                16,
                16,
              ]}
            />
            <meshStandardMaterial
              color="#fde68a"
              emissive={new THREE.Color(dock.accentColor ?? activeColor)}
              emissiveIntensity={
                hoveredDockId === dock.id || selectedDockId === dock.id ? 1.8 : 1.25
              }
            />
          </mesh>
          <Text
            position={[0, 0.48, 0]}
            fontSize={0.1}
            maxWidth={1.3}
            color={
              hoveredDockId === dock.id || selectedDockId === dock.id ? "#fff7dc" : "#fef3c7"
            }
            anchorX="center"
            anchorY="middle"
          >
            {dock.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

function RiverWorld({
  books,
  citations,
  selectedBookSlug,
  onSelectBook,
  activeEra,
  viewMode,
  cinematicState = "idle",
  branchAnnotations = [],
  dockMarkers = [],
  hoveredBranchId,
  onHoverBranch,
  traceFocus,
  sceneFocus,
  cruiseProgress,
  highlightedBookSlugs = [],
  searchFocusSlug,
  hoveredBookSlug,
  onHoverBook,
  hoveredDockId,
  onHoverDock,
  selectedDockId,
  onSelectDock,
  sourceAtlasLabel,
  sourceAtlasPathPoints = [],
  sourceAtlasRoutes = [],
  onInteractionStart,
  onInteractionEnd,
}: RiverSceneProps & {
  cruiseProgress: number;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsInstance>(null);
  const userInteractingRef = useRef(false);
  const resumeAutoFrameRef = useRef<number | null>(null);
  const desiredCameraPosition = useRef(new THREE.Vector3(2.3, 5.6, 13.8));
  const desiredCameraTarget = useRef(new THREE.Vector3(3.8, 0.3, 0.9));
  const initialControlsTarget = useMemo(() => new THREE.Vector3(3.8, 0.3, 0.9), []);
  const mainStream = useMemo(
    () =>
      books
        .filter((book) => book.branchLevel === 0)
        .sort((left, right) => left.year - right.year)
        .map((book) => new THREE.Vector3(...book.coordinates)),
    [books],
  );
  const mainStreamCurve = useMemo(
    () => (mainStream.length >= 2 ? new THREE.CatmullRomCurve3(mainStream) : null),
    [mainStream],
  );
  const cruiseSnapshot = useMemo<CruiseSnapshot | null>(() => {
    if (!mainStreamCurve) {
      return null;
    }

    const clampedProgress = THREE.MathUtils.clamp(cruiseProgress, 0, 0.999);
    return {
      point: mainStreamCurve.getPointAt(clampedProgress),
      tangent: mainStreamCurve.getTangentAt(clampedProgress).normalize(),
    };
  }, [cruiseProgress, mainStreamCurve]);
  const traceBooks = useMemo(() => {
    const traceTitles = traceFocus?.titles ?? [];

    if (traceTitles.length === 0) {
      return [];
    }

    return traceTitles
      .map((title) => books.find((book) => book.title === title))
      .filter((book): book is BookNode => Boolean(book));
  }, [books, traceFocus?.titles]);
  const tracePathPoints = useMemo(
    () => traceBooks.map((book) => new THREE.Vector3(...book.coordinates)),
    [traceBooks],
  );
  const cameraTarget = useMemo(() => {
    const traceCurrentBook =
      books.find((book) => book.title === traceFocus?.currentTitle) ??
      (searchFocusSlug ? books.find((book) => book.slug === searchFocusSlug) : null) ??
      books.find((book) => book.slug === selectedBookSlug);

    return traceCurrentBook
      ? new THREE.Vector3(...traceCurrentBook.coordinates)
      : new THREE.Vector3(3.5, 0, 0);
  }, [books, searchFocusSlug, selectedBookSlug, traceFocus?.currentTitle]);
  const selectedBookPosition = useMemo(() => {
    const selectedBook = books.find((book) => book.slug === selectedBookSlug);
    return selectedBook
      ? new THREE.Vector3(...selectedBook.coordinates)
      : null;
  }, [books, selectedBookSlug]);
  const searchFocusNode = useMemo(
    () => (searchFocusSlug ? books.find((book) => book.slug === searchFocusSlug) ?? null : null),
    [books, searchFocusSlug],
  );
  const searchFocusPosition = useMemo(
    () => (searchFocusNode ? new THREE.Vector3(...searchFocusNode.coordinates) : null),
    [searchFocusNode],
  );
  const selectedBookNode = useMemo(
    () => books.find((book) => book.slug === selectedBookSlug) ?? null,
    [books, selectedBookSlug],
  );
  const activeBranchAnnotation = useMemo(
    () =>
      branchAnnotations.find((annotation) => annotation.id === hoveredBranchId) ??
      branchAnnotations.find((annotation) => annotation.targetSlug === selectedBookSlug) ??
      null,
    [branchAnnotations, hoveredBranchId, selectedBookSlug],
  );
  const conceptFlowPoints = useMemo(() => {
    if (highlightedBookSlugs.length < 2) {
      return [];
    }

    const highlightedSet = new Set(highlightedBookSlugs);
    return books
      .filter((book) => highlightedSet.has(book.slug))
      .sort((left, right) => left.year - right.year)
      .map((book) => new THREE.Vector3(...book.coordinates));
  }, [books, highlightedBookSlugs]);
  const focusStreamPoints = useMemo(() => {
    if (tracePathPoints.length >= 2) {
      return tracePathPoints;
    }

    const sceneBook = sceneFocus?.currentTitle
      ? books.find((book) => book.title === sceneFocus.currentTitle) ?? null
      : null;
    const baseBook = sceneBook ?? selectedBookNode;

    if (!baseBook) {
      return [];
    }

    const orderedBooks = books
      .filter((book) => book.branchLevel === baseBook.branchLevel)
      .sort((left, right) => left.year - right.year);
    const currentIndex = orderedBooks.findIndex((book) => book.id === baseBook.id);

    if (currentIndex === -1) {
      return [new THREE.Vector3(...baseBook.coordinates)];
    }

    return orderedBooks
      .slice(Math.max(0, currentIndex - 1), Math.min(orderedBooks.length, currentIndex + 2))
      .map((book) => new THREE.Vector3(...book.coordinates));
  }, [books, sceneFocus, selectedBookNode, tracePathPoints]);
  const focusAuraColor =
    traceFocus?.active
      ? "#f59e0b"
      : sceneFocus?.active
        ? "#fde68a"
        : "#fcd34d";
  const sourceAtlasFlowPoints = useMemo(
    () => sourceAtlasPathPoints.map((point) => new THREE.Vector3(...point)),
    [sourceAtlasPathPoints],
  );
  const activeBranchFlowPoints = useMemo(() => {
    if (!activeBranchAnnotation) {
      return [];
    }

    const sourceBook = books.find((book) => book.slug === activeBranchAnnotation.sourceSlug) ?? null;
    const targetBook = books.find((book) => book.slug === activeBranchAnnotation.targetSlug) ?? null;

    if (!sourceBook || !targetBook) {
      return [];
    }

    const sourcePoint = new THREE.Vector3(...sourceBook.coordinates);
    const targetPoint = new THREE.Vector3(...targetBook.coordinates);
    const midpoint = sourcePoint
      .clone()
      .lerp(targetPoint, 0.5)
      .add(
        new THREE.Vector3(
          0,
          0.34 + Math.abs(sourceBook.branchLevel - targetBook.branchLevel) * 0.08,
          sourcePoint.z >= targetPoint.z ? 0.26 : -0.26,
        ),
      );

    return [sourcePoint, midpoint, targetPoint];
  }, [activeBranchAnnotation, books]);
  const sourceAtlasRouteCurves = useMemo(
    () =>
      sourceAtlasRoutes
        .map((route) => ({
          ...route,
          points: route.points.map((point) => new THREE.Vector3(...point)),
        }))
        .filter((route) => route.points.length >= 2),
    [sourceAtlasRoutes],
  );
  const eraIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const eraWarmth = eraIndex / Math.max(RIVER_ERA_ORDER.length - 1, 1);
  const scenePulse = traceFocus?.active ? 1 : sceneFocus?.active ? 0.72 : 0;
  const fogColor = traceFocus?.active
    ? "#2b1806"
    : sceneFocus?.active
      ? "#3c250a"
      : eraWarmth > 0.68
        ? "#38210b"
        : "#201408";
  const backgroundColor = traceFocus?.active
    ? "#150d05"
    : eraWarmth > 0.68
      ? "#261708"
      : "#1a1108";

  const branchStreams = useMemo(() => {
    return [1, 2].map((branchLevel) =>
      books
        .filter((book) => book.branchLevel === branchLevel)
        .sort((left, right) => left.year - right.year)
        .map((book) => new THREE.Vector3(...book.coordinates)),
    );
  }, [books]);
  const mainStreamStats = useMemo(() => {
    const mainBooks = books.filter((book) => book.branchLevel === 0);
    const averageInfluence =
      mainBooks.reduce((sum, book) => sum + book.influence, 0) / Math.max(mainBooks.length, 1);
    const averageVelocity =
      mainBooks.reduce((sum, book) => sum + book.velocity, 0) / Math.max(mainBooks.length, 1);

    return { averageInfluence, averageVelocity };
  }, [books]);
  const branchStreamStats = useMemo(
    () =>
      [1, 2].map((branchLevel) => {
        const branchBooks = books.filter((book) => book.branchLevel === branchLevel);
        const averageInfluence =
          branchBooks.reduce((sum, book) => sum + book.influence, 0) /
          Math.max(branchBooks.length, 1);
        const averageVelocity =
          branchBooks.reduce((sum, book) => sum + book.velocity, 0) /
          Math.max(branchBooks.length, 1);

        return { averageInfluence, averageVelocity };
      }),
    [books],
  );
  const eraRiverMood = useMemo(() => {
    const fullness = 0.58 + eraWarmth * 0.5;
    const mainOpacity = 0.5 + eraWarmth * 0.3;
    const branchOpacity = 0.22 + eraWarmth * 0.46;
    const branchVisibility = 0.38 + eraWarmth * 0.84;
    const glowStrength = 0.18 + eraWarmth * 0.42 + scenePulse * 0.08;

    return {
      fullness,
      mainOpacity,
      branchOpacity,
      branchVisibility,
      glowStrength,
    };
  }, [eraWarmth, scenePulse]);
  useEffect(() => {
    const focusPoint = traceFocus?.active || sceneFocus?.active
      ? cameraTarget.clone()
      : selectedBookPosition ?? new THREE.Vector3(3.5, 0, 0);

    let nextTarget = new THREE.Vector3(3.8, 0.3, 0.9);
    let nextPosition = new THREE.Vector3(2.3, 5.6, 13.8);

    if (traceFocus?.active) {
      nextTarget = focusPoint;
      nextPosition = focusPoint.clone().add(new THREE.Vector3(1.65, 1.25, 3.2));
    } else if (sceneFocus?.active) {
      nextTarget = focusPoint.clone().add(new THREE.Vector3(0, 0.08, 0));
      nextPosition = focusPoint.clone().add(new THREE.Vector3(1.75, 1.9, 4.75));
    } else if (viewMode === "river" && searchFocusPosition && !selectedBookPosition) {
      nextTarget = searchFocusPosition.clone().add(new THREE.Vector3(0, 0.08, 0));
      nextPosition = searchFocusPosition.clone().add(new THREE.Vector3(1.8, 2.05, 5.05));
    } else if (cinematicState === "diving" && selectedBookPosition) {
      nextTarget = focusPoint.clone().add(new THREE.Vector3(0.18, 0.12, 0));
      nextPosition = focusPoint.clone().add(new THREE.Vector3(0.45, 3.2, 6.4));
    } else if ((viewMode === "book" || cinematicState === "settling") && selectedBookPosition) {
      nextTarget = focusPoint;
      nextPosition = focusPoint.clone().add(new THREE.Vector3(1.35, 1.6, 4.25));
    } else if (cinematicState === "returning") {
      nextTarget = new THREE.Vector3(3.5, 0.15, 0);
      nextPosition = new THREE.Vector3(4.5, 5.3, 13.4);
    } else if (viewMode === "river" && cruiseSnapshot) {
      const up = new THREE.Vector3(0, 1, 0);
      const side = new THREE.Vector3()
        .crossVectors(up, cruiseSnapshot.tangent)
        .normalize()
        .multiplyScalar(3.15);
      const back = cruiseSnapshot.tangent.clone().multiplyScalar(-6.4);
      const lift = new THREE.Vector3(0, 3.05, 0);

      nextTarget = cruiseSnapshot.point
        .clone()
        .add(cruiseSnapshot.tangent.clone().multiplyScalar(2.35))
        .add(new THREE.Vector3(0, 0.22, 0));
      nextPosition = cruiseSnapshot.point.clone().add(side).add(back).add(lift);
    }

    desiredCameraPosition.current.copy(nextPosition);
    desiredCameraTarget.current.copy(nextTarget);
  }, [
    cameraTarget,
    cinematicState,
    cruiseSnapshot,
    sceneFocus,
    searchFocusPosition,
    selectedBookPosition,
    traceFocus,
    viewMode,
  ]);

  useFrame((_, delta) => {
    if (!cameraRef.current) {
      return;
    }

    const positionEase =
      traceFocus?.active
        ? 5.6
        : sceneFocus?.active
          ? 5
          : cinematicState === "diving"
            ? 6.8
            : cinematicState === "returning"
              ? 4.8
              : 3.8;
    const targetEase =
      traceFocus?.active
        ? 6.2
        : sceneFocus?.active
          ? 5.4
          : cinematicState === "diving"
            ? 7.4
            : cinematicState === "returning"
              ? 5
              : 4.2;
    const positionAlpha = 1 - Math.exp(-positionEase * delta);
    const targetAlpha = 1 - Math.exp(-targetEase * delta);

    if (!userInteractingRef.current) {
      cameraRef.current.position.lerp(desiredCameraPosition.current, positionAlpha);
    }

    if (controlsRef.current && !userInteractingRef.current) {
      controlsRef.current.target.lerp(desiredCameraTarget.current, targetAlpha);
      controlsRef.current.update();
    } else if (!controlsRef.current) {
      cameraRef.current.lookAt(desiredCameraTarget.current);
    }
  });

  useEffect(() => {
    const controls = controlsRef.current;

    if (!controls) {
      return;
    }

    const pauseAuto = () => {
      userInteractingRef.current = true;
      if (resumeAutoFrameRef.current !== null) {
        window.clearTimeout(resumeAutoFrameRef.current);
      }
    };

    const resumeAuto = () => {
      if (resumeAutoFrameRef.current !== null) {
        window.clearTimeout(resumeAutoFrameRef.current);
      }
      resumeAutoFrameRef.current = window.setTimeout(() => {
        userInteractingRef.current = false;
      }, 900);
    };

    controls.addEventListener("start", pauseAuto);
    controls.addEventListener("end", resumeAuto);

    return () => {
      controls.removeEventListener("start", pauseAuto);
      controls.removeEventListener("end", resumeAuto);
      if (resumeAutoFrameRef.current !== null) {
        window.clearTimeout(resumeAutoFrameRef.current);
      }
    };
  }, []);

  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <fog attach="fog" args={[fogColor, 7.5 - scenePulse * 0.35, 22 - scenePulse * 2.4]} />
      <PerspectiveCamera ref={cameraRef} makeDefault position={[2.3, 5.6, 13.8]} fov={38} />
      <ambientLight
        intensity={1.14 + eraWarmth * 0.34 + scenePulse * 0.18}
        color={eraWarmth > 0.55 ? "#fff1c7" : "#f4e0aa"}
      />
      <directionalLight
        position={[4, 8, 6]}
        intensity={1.45 + eraWarmth * 0.42 + scenePulse * 0.34}
        color={traceFocus?.active ? "#ffe7b0" : "#fff5d9"}
      />
      <pointLight
        position={[-6, 4, -2]}
        intensity={1 + eraWarmth * 0.42 + scenePulse * 0.26}
        color={sceneFocus?.active ? "#fde68a" : "#f6c453"}
      />
      <pointLight
        position={[9, 3, -4]}
        intensity={1.02 + eraWarmth * 0.5 + scenePulse * 0.22}
        color={traceFocus?.active ? "#f59e0b" : "#d97706"}
      />
      <spotLight
        position={[2.5, 8, 8]}
        angle={0.38}
        penumbra={0.7}
        intensity={1.95 + eraWarmth * 0.48 + scenePulse * 0.42}
        color={traceFocus?.active ? "#ffd27a" : "#fde68a"}
      />

      <ScrollCanopy activeEra={activeEra} traceFocus={traceFocus} sceneFocus={sceneFocus} />
      <AtmosphereField activeEra={activeEra} traceFocus={traceFocus} sceneFocus={sceneFocus} />
      <ScrollMistBands />
      <RiverBed />
      <RiverBanks />
      <ScrollContourLines />
      <EraRiverZones books={books} />

      {mainStream.length >= 2 ? (
        <>
          <RiverRibbon
            points={mainStream}
            width={(0.16 + mainStreamStats.averageInfluence / 420) * eraRiverMood.fullness}
            color="#b45309"
            glow="#fbbf24"
            animated
            opacity={eraRiverMood.mainOpacity}
            glowOpacity={0.03 + eraWarmth * 0.09}
            emissiveIntensity={eraRiverMood.glowStrength}
          />
          <RiverParticleStream
            points={mainStream}
            color="#fde68a"
            density={Math.max(
              84,
              Math.round((180 + mainStreamStats.averageInfluence * 0.9) * eraRiverMood.fullness),
            )}
            flowSpeed={(0.032 + mainStreamStats.averageVelocity * 0.16) * (0.82 + eraWarmth * 0.42)}
            spread={0.12 - eraWarmth * 0.04}
          />
        </>
      ) : null}

      {branchStreams.map((stream, index) =>
        stream.length >= 2 ? (
          <group key={`branch-${index}`}>
            <RiverRibbon
              points={stream}
              width={
                Math.max(
                  0.07,
                  (0.08 + branchStreamStats[index]!.averageInfluence / 520 - index * 0.012) *
                    eraRiverMood.branchVisibility,
                )
              }
              color={index === 0 ? "#d97706" : "#92400e"}
              glow={index === 0 ? "#fcd34d" : "#fef3c7"}
              opacity={eraRiverMood.branchOpacity}
              glowOpacity={0.02 + eraWarmth * 0.07}
              emissiveIntensity={0.12 + eraWarmth * 0.34}
            />
            <RiverParticleStream
              points={stream}
              color={index === 0 ? "#fde68a" : "#fef3c7"}
              density={Math.max(
                28,
                Math.round(
                  ((index === 0 ? 120 : 92) + branchStreamStats[index]!.averageInfluence * 0.56) *
                    eraRiverMood.branchVisibility,
                ),
              )}
              flowSpeed={(0.038 + branchStreamStats[index]!.averageVelocity * 0.18) * (0.78 + eraWarmth * 0.48)}
              spread={0.1 - eraWarmth * 0.03}
            />
          </group>
        ) : null,
      )}

      <FlowBeacons books={books} activeEra={activeEra} />
      <EraMilestones books={books} activeEra={activeEra} />
      {tracePathPoints.length >= 2 ? (
        <group>
          <Line
            points={tracePathPoints}
            color="#f59e0b"
            transparent
            opacity={0.95}
            lineWidth={2.8}
          />
          <Line
            points={tracePathPoints}
            color="#fcd34d"
            transparent
            opacity={0.25}
            lineWidth={6.4}
          />
        </group>
      ) : null}

      <CitationArcs
        books={books}
        citations={citations}
        selectedBookSlug={selectedBookSlug}
        traceFocus={traceFocus}
        sceneFocus={sceneFocus}
        highlightedBookSlugs={highlightedBookSlugs}
      />
      <FocusHalo
        selectedBookPosition={selectedBookPosition}
        traceFocus={traceFocus}
        sceneFocus={sceneFocus}
      />
      {!selectedBookSlug &&
      !traceFocus?.active &&
      !sceneFocus?.active &&
      conceptFlowPoints.length >= 2 ? (
        <group>
          <Line
            points={conceptFlowPoints}
            color="#fde68a"
            transparent
            opacity={0.88}
            lineWidth={3}
          />
          <Line
            points={conceptFlowPoints}
            color="#f59e0b"
            transparent
            opacity={0.2}
            lineWidth={7}
          />
          <RiverParticleStream
            points={conceptFlowPoints}
            color="#fde68a"
            density={84}
            flowSpeed={0.14}
            spread={0.06}
          />
        </group>
      ) : null}
      {focusStreamPoints.length >= 2 ? (
        <group>
          <Line
            points={focusStreamPoints}
            color={focusAuraColor}
            transparent
            opacity={0.9}
            lineWidth={3.4}
          />
          <Line
            points={focusStreamPoints}
            color="#fef3c7"
            transparent
            opacity={0.22}
            lineWidth={7.2}
          />
          <RiverParticleStream
            points={focusStreamPoints}
            color={traceFocus?.active ? "#fbbf24" : "#fde68a"}
            density={96}
            flowSpeed={traceFocus?.active ? 0.16 : 0.11}
            spread={0.08}
          />
        </group>
      ) : null}
      {!traceFocus?.active &&
      !sceneFocus?.active &&
      activeBranchFlowPoints.length >= 2 ? (
        <group>
          <Line
            points={activeBranchFlowPoints}
            color={activeBranchAnnotation?.accentColor ?? "#fcd34d"}
            transparent
            opacity={0.94}
            lineWidth={2.8}
          />
          <Line
            points={activeBranchFlowPoints}
            color="#fef3c7"
            transparent
            opacity={0.18}
            lineWidth={6.6}
          />
          <RiverParticleStream
            points={activeBranchFlowPoints}
            color={activeBranchAnnotation?.accentColor ?? "#fde68a"}
            density={64}
            flowSpeed={0.11}
            spread={0.05}
          />
        </group>
      ) : null}
      {!selectedBookSlug && sourceAtlasLabel && sourceAtlasFlowPoints.length >= 2 ? (
        <group>
          <Line
            points={sourceAtlasFlowPoints}
            color="#fbbf24"
            transparent
            opacity={0.86}
            lineWidth={2.4}
          />
          <Line
            points={sourceAtlasFlowPoints}
            color="#fef3c7"
            transparent
            opacity={0.18}
            lineWidth={6.2}
          />
          <RiverParticleStream
            points={sourceAtlasFlowPoints}
            color="#fde68a"
            density={72}
            flowSpeed={0.095}
            spread={0.06}
          />
        </group>
      ) : null}
      {!selectedBookSlug && sourceAtlasRouteCurves.length ? (
        <group>
          {sourceAtlasRouteCurves.map((route) => (
            <group key={route.id}>
              <Line
                points={route.points}
                color={route.color}
                transparent
                opacity={0.2}
                lineWidth={1.2}
              />
              <Line
                points={route.points}
                color="#fef3c7"
                transparent
                opacity={0.06}
                lineWidth={3.4}
              />
            </group>
          ))}
        </group>
      ) : null}
      <FocusCurrentAura focusPosition={selectedBookPosition} color={focusAuraColor} />
      <DockMarkers
        dockMarkers={dockMarkers}
        activeColor={focusAuraColor}
        hoveredDockId={hoveredDockId}
        onHoverDock={onHoverDock}
        selectedDockId={selectedDockId}
        onSelectDock={onSelectDock}
      />
      <BranchMarkers
        annotations={branchAnnotations}
        selectedBookSlug={selectedBookSlug}
        onSelectBook={onSelectBook}
        hoveredBranchId={hoveredBranchId}
        onHoverBranch={onHoverBranch}
        cruiseProgress={cruiseProgress}
        cruiseRunning={viewMode === "river" && !traceFocus?.active && !sceneFocus?.active}
      />
      <BookMarkers
        books={books}
        selectedBookSlug={selectedBookSlug}
        onSelectBook={onSelectBook}
        activeEra={activeEra}
        viewMode={viewMode}
        traceFocus={traceFocus}
        sceneFocus={sceneFocus}
        cruiseProgress={cruiseProgress}
        cruiseRunning={viewMode === "river" && !traceFocus?.active && !sceneFocus?.active}
        highlightedBookSlugs={highlightedBookSlugs}
        hoveredBookSlug={hoveredBookSlug}
        onHoverBook={onHoverBook}
      />
      <ForegroundScrollVeil activeEra={activeEra} traceFocus={traceFocus} sceneFocus={sceneFocus} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        onStart={onInteractionStart}
        onEnd={onInteractionEnd}
        enablePan
        screenSpacePanning
        enableDamping
        dampingFactor={0.08}
        panSpeed={1.1}
        rotateSpeed={0.72}
        zoomSpeed={0.9}
        maxDistance={16}
        minDistance={6}
        maxPolarAngle={Math.PI / 2.1}
        enableRotate={cinematicState !== "diving"}
        enableZoom
        target={initialControlsTarget}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        touches={{
          ONE: THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </>
  );
}

export function RiverScene(props: RiverSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cruiseProgress, setCruiseProgress] = useState(0.1);
  const [autoCruise, setAutoCruise] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showMobileTouchHint, setShowMobileTouchHint] = useState(true);
  const canCruise =
    props.viewMode === "river" &&
    !props.traceFocus?.active &&
    !props.sceneFocus?.active &&
    !props.searchFocusSlug;
  const cruiseRunning = canCruise && autoCruise;
  const mobilePanelOpen = props.mobilePanelOpen ?? false;
  const searchFocusBook =
    props.searchFocusSlug
      ? props.books.find((book) => book.slug === props.searchFocusSlug) ?? null
      : null;
  const hoveredBook = props.books.find((book) => book.slug === props.hoveredBookSlug) ?? null;
  const hoveredDock = props.dockMarkers?.find((dock) => dock.id === props.hoveredDockId) ?? null;
  const hoveredBranch = props.branchAnnotations?.find(
    (annotation) => annotation.id === props.hoveredBranchId,
  ) ?? null;
  const cruiseAnchorMoments = useMemo<CruiseAnchorMoment[]>(() => {
    const eraAnchors = RIVER_ERA_ORDER.map((era) => {
      const eraBooks = props.books
        .filter((book) => book.dynasty === era && book.branchLevel === 0)
        .sort((left, right) => left.year - right.year);

      if (!eraBooks.length) {
        return null;
      }

      const averageX =
        eraBooks.reduce((sum, book) => sum + book.coordinates[0], 0) / Math.max(eraBooks.length, 1);
      const progress = THREE.MathUtils.clamp((averageX + 6.8) / 16.8, 0.08, 0.92);
      const story = RIVER_ERA_STORIES[era];

      return {
        id: `era-${era}`,
        progress,
        label: `${era}河段`,
        detail: `${story.lead} ${story.trunk}`,
        emphasis: 0.95,
        kind: "era" as const,
        era,
      };
    }).filter((anchor): anchor is NonNullable<typeof anchor> => anchor !== null);

    const bookAnchors = props.books
      .filter((book) => book.branchLevel === 0)
      .sort((left, right) => left.year - right.year)
      .map((book, index, orderedBooks) => ({
        id: `book-${book.slug}`,
        progress:
          orderedBooks.length <= 1 ? 0.1 : 0.08 + (index / (orderedBooks.length - 1)) * 0.84,
        label: book.shortTitle,
        detail: `${book.shortTitle} 正浮出主河道，可顺势入卷查看这一段文脉主干。`,
        emphasis: 1,
        kind: "book" as const,
        era: book.dynasty,
      }));
    const branchAnchors = (props.branchAnnotations ?? [])
      .map((annotation) => ({
        id: `branch-${annotation.id}`,
        progress: THREE.MathUtils.clamp((annotation.position[0] + 6.8) / 16.8, 0.08, 0.92),
        label: annotation.label,
        detail: `${annotation.label} 已临近镜头，${annotation.description}`,
        emphasis: 0.72,
        kind: "branch" as const,
      }))
      .sort((left, right) => left.progress - right.progress);

    return [...eraAnchors, ...bookAnchors, ...branchAnchors]
      .sort((left, right) => left.progress - right.progress)
      .filter((anchor, index, anchors) => {
        if (index === 0) {
          return true;
        }

        return Math.abs(anchor.progress - anchors[index - 1]!.progress) > 0.045;
      })
      .slice(0, 10);
  }, [props.books, props.branchAnnotations]);
  const activeCruiseMoment =
    cruiseAnchorMoments.find((anchor) => Math.abs(anchor.progress - cruiseProgress) <= 0.045) ??
    null;
  const activeCruiseStory =
    activeCruiseMoment?.era ? RIVER_ERA_STORIES[activeCruiseMoment.era] : null;
  const sceneHint = props.traceFocus?.active
    ? `逆流正经过 ${props.traceFocus.currentTitle ?? "此处节点"}，沿链回看文脉源头。`
    : props.sceneFocus?.active
      ? props.sceneFocus.detail
      : searchFocusBook
        ? `概念检索已把镜头带到 ${searchFocusBook.shortTitle} 所在河段，可顺势入卷继续追看这条文脉。`
      : isInteracting
        ? "长河正在掌中转景，松手后可继续点选典籍与码头。"
      : activeCruiseMoment
        ? activeCruiseMoment.detail
      : hoveredDock
        ? `${hoveredDock.label} 正从河面浮起。${hoveredDock.note ? ` ${hoveredDock.note}` : ""}`
      : props.sourceAtlasLabel && props.dockMarkers?.length
        ? `${props.sourceAtlasLabel} 的来源线索已映入河道，可沿码头顺流检阅。${props.sourceAtlasSummary ? ` ${props.sourceAtlasSummary}` : ""}`
        : hoveredBook
        ? `${hoveredBook.shortTitle} 已浮出河心，点击即可入卷。`
      : hoveredBranch
          ? `${hoveredBranch.label} 正在显现，顺着支流便能入卷追看。`
          : props.selectedBookSlug
            ? "典籍已经停驻岸边，可续展文卷，亦可归河巡看。"
            : cruiseRunning
              ? "长河正自上游缓缓展开，镜头会顺水带你进入文脉世界。"
              : "拖动长河巡看文脉起伏，点中节点便可入卷。";

  useEffect(() => {
    if (!showMobileTouchHint) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowMobileTouchHint(false);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [showMobileTouchHint]);

  useEffect(() => {
    if (!cruiseRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setCruiseProgress((current) => {
        const slowFactor = cruiseAnchorMoments.reduce((factor, anchor) => {
          const distance = Math.abs(current - anchor.progress);

          if (distance > 0.06) {
            return factor;
          }

          const easing = 1 - distance / 0.06;
          return Math.min(factor, 1 - easing * (0.45 + anchor.emphasis * 0.2));
        }, 1);
        const next = current + 0.0065 * slowFactor;
        return next >= 0.99 ? 0.04 : next;
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [cruiseAnchorMoments, cruiseRunning]);

  const nudgeCruise = (delta: number) => {
    setCruiseProgress((current) => THREE.MathUtils.clamp(current + delta, 0.02, 0.98));
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(event) => event.preventDefault()}
      className="relative h-full min-h-screen select-none overflow-hidden rounded-[32px] border border-[#d7ab56]/60 bg-[#c98b34] shadow-[0_0_110px_rgba(107,68,18,0.2)] [touch-action:pan-x_pinch-zoom]"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(90deg,rgba(253,236,187,0.84),rgba(253,236,187,0.2),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-[linear-gradient(270deg,rgba(228,183,86,0.82),rgba(228,183,86,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 left-2 z-10 w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(255,244,205,0.95),rgba(218,173,78,0.55),rgba(255,244,205,0.9))]" />
      <div className="pointer-events-none absolute inset-y-0 right-2 z-10 w-[3px] rounded-full bg-[linear-gradient(180deg,rgba(255,239,196,0.92),rgba(198,143,48,0.55),rgba(255,239,196,0.88))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-[linear-gradient(180deg,rgba(255,243,202,0.5),rgba(211,154,58,0))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 bg-[linear-gradient(0deg,rgba(157,104,29,0.44),rgba(157,104,29,0))]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_46%,rgba(254,233,166,0.2),transparent_42%),linear-gradient(90deg,rgba(250,228,160,0.08),transparent_18%,transparent_82%,rgba(250,228,160,0.08))]" />
      <div className="pointer-events-none absolute left-4 top-4 z-10 hidden max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-[#efd38f]/28 bg-[rgba(150,104,31,0.22)] px-3 py-1.5 text-[10px] text-[#fff3d0] md:left-5 md:top-5 md:flex md:max-w-none md:text-[11px]">
        <span className="tracking-[0.28em] text-[#fff0c2]">黄河文脉长卷</span>
        <span className="hidden h-3 w-px bg-[#ead8a6]/24 sm:block" />
        <span className="truncate text-[#f1e3bd]/86">
          {props.traceFocus?.active
            ? `溯源 ${props.traceFocus.progress}/${props.traceFocus.total}`
            : props.sceneFocus?.active
              ? props.sceneFocus.contextLabel
              : props.cinematicState === "diving"
                ? "入卷中"
                : props.cinematicState === "returning"
                  ? "归河中"
                  : props.activeEra}
        </span>
      </div>
      <div
        className={`pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 transition-all duration-500 md:hidden ${
          showMobileTouchHint || isInteracting ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="rounded-full border border-[#e7c97b]/18 bg-[rgba(150,108,35,0.28)] px-3 py-1.5 text-[10px] text-[#f6e8bd] backdrop-blur-md">
          {isInteracting ? "正在拖移长河" : touchModeLabel}
        </div>
      </div>
      {canCruise ? (
        <div
        className={`absolute bottom-5 left-5 z-20 hidden w-[min(220px,calc(100vw-2.5rem))] transition-opacity duration-300 xl:block ${
          mobilePanelOpen ? "pointer-events-none opacity-0 sm:pointer-events-auto sm:opacity-100" : ""
        }`}
      >
          <div className="pointer-events-auto rounded-[24px] border border-[#e7c97b]/14 bg-[linear-gradient(180deg,rgba(187,142,59,0.48),rgba(124,84,28,0.42))] px-3 py-3 text-[#f1e2bb] shadow-xl shadow-black/10 backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 truncate text-[11px] text-[#fbf3da]">
                {activeCruiseMoment ? activeCruiseMoment.label : "上游入画"}
              </div>
              <button
                type="button"
                onClick={() => setAutoCruise((current) => !current)}
                className={`rounded-full px-3 py-1.5 text-[11px] transition ${
                  cruiseRunning
                    ? "bg-[#f3dfab] text-[#42290a]"
                    : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                }`}
              >
                {cruiseRunning ? "暂停" : "巡航"}
              </button>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#b45309,#fcd34d)]"
                style={{ width: `${Math.max(6, cruiseProgress * 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => nudgeCruise(-0.08)}
                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-[10px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
              >
                上游
              </button>
              <button
                type="button"
                onClick={() => nudgeCruise(0.08)}
                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-[10px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
              >
                下游
              </button>
            </div>
            <div className="mt-3 text-[10px] leading-5 text-[#e8d6aa]">
              {activeCruiseStory?.trunk ?? sceneHint}
            </div>
          </div>
        </div>
      ) : null}
      <Canvas
        dpr={[1, 1.8]}
        onPointerDown={() => {
          setAutoCruise(false);
          setIsInteracting(true);
        }}
        onPointerUp={() => setIsInteracting(false)}
        onPointerLeave={() => setIsInteracting(false)}
        className={isInteracting ? "cursor-grabbing [touch-action:pan-x_pinch-zoom]" : "cursor-grab [touch-action:pan-x_pinch-zoom]"}
      >
        <RiverWorld
          {...props}
          cruiseProgress={cruiseProgress}
          onInteractionStart={() => {
            setAutoCruise(false);
            setIsInteracting(true);
          }}
          onInteractionEnd={() => setIsInteracting(false)}
        />
      </Canvas>
    </div>
  );
}
