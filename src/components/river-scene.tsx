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
const ERA_FLOW_PROFILE: Record<
  RiverEra,
  {
    fullness: number;
    mainOpacity: number;
    branchOpacity: number;
    branchVisibility: number;
    glowBoost: number;
    dryness: number;
    particleBoost: number;
  }
> = {
  "先秦": {
    fullness: 0.62,
    mainOpacity: 0.58,
    branchOpacity: 0.16,
    branchVisibility: 0.34,
    glowBoost: 0.02,
    dryness: 0.12,
    particleBoost: 0.84,
  },
  "两汉": {
    fullness: 0.76,
    mainOpacity: 0.66,
    branchOpacity: 0.24,
    branchVisibility: 0.48,
    glowBoost: 0.08,
    dryness: 0.08,
    particleBoost: 0.94,
  },
  "魏晋": {
    fullness: 0.83,
    mainOpacity: 0.7,
    branchOpacity: 0.29,
    branchVisibility: 0.6,
    glowBoost: 0.12,
    dryness: 0.1,
    particleBoost: 1,
  },
  "隋唐": {
    fullness: 0.9,
    mainOpacity: 0.74,
    branchOpacity: 0.34,
    branchVisibility: 0.68,
    glowBoost: 0.16,
    dryness: 0.09,
    particleBoost: 1.06,
  },
  "宋元": {
    fullness: 1.14,
    mainOpacity: 0.82,
    branchOpacity: 0.48,
    branchVisibility: 1.02,
    glowBoost: 0.24,
    dryness: 0.03,
    particleBoost: 1.2,
  },
  "明清": {
    fullness: 0.9,
    mainOpacity: 0.68,
    branchOpacity: 0.26,
    branchVisibility: 0.62,
    glowBoost: 0.11,
    dryness: 0.22,
    particleBoost: 0.92,
  },
  "近现代": {
    fullness: 0.98,
    mainOpacity: 0.72,
    branchOpacity: 0.3,
    branchVisibility: 0.74,
    glowBoost: 0.18,
    dryness: 0.14,
    particleBoost: 1.04,
  },
};
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
  sourceAtlasActiveRouteId?: string | null;
  riverStageBadges?: string[];
  sourceAtlasPathPoints?: Array<[number, number, number]>;
  sourceAtlasRoutes?: SourceAtlasRoute[];
  onOpenControlPanel?: (() => void) | null;
  onOpenEraPanel?: (() => void) | null;
  onAdvanceEra?: ((direction: -1 | 1) => void) | null;
  onToggleEraPlayback?: (() => void) | null;
  eraPlaybackActive?: boolean;
  onReturnToRiver?: (() => void) | null;
  mobilePanelOpen?: boolean;
  overlayBusy?: boolean;
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
  spotlightSlug?: string;
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
        <meshBasicMaterial color="#2f1d09" transparent opacity={0.94} />
      </mesh>
      <mesh ref={bedRef} rotation={[-Math.PI / 2, 0, 0]} position={[3.4, depth, 0]}>
        <planeGeometry args={[span * 1.6, span * 1.2, 48, 48]} />
        <meshStandardMaterial
          color="#87511c"
          emissive={new THREE.Color("#c07b2c")}
          emissiveIntensity={0.34}
          metalness={0.08}
          roughness={0.74}
          transparent
          opacity={0.98}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.4, depth + 0.01, 0]}>
        <planeGeometry args={[span * 1.55, span * 1.16, 1, 1]} />
        <meshBasicMaterial color="#f6c453" transparent opacity={0.14} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, depth + 0.03, 0]}>
        <planeGeometry args={[span * 1.28, span * 0.94, 1, 1]} />
        <meshBasicMaterial color="#fde7b0" transparent opacity={0.05} />
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

function DryRiverGhosts({
  dryness = 0.12,
}: {
  dryness?: number;
}) {
  const ghostRef = useRef<THREE.Group>(null);
  const ghostPaths = useMemo(
    () => [
      [
        new THREE.Vector3(-4.9, -0.82, 2.2),
        new THREE.Vector3(-1.6, -0.8, 2.6),
        new THREE.Vector3(2.1, -0.78, 2.34),
        new THREE.Vector3(5.8, -0.76, 1.82),
        new THREE.Vector3(9.8, -0.74, 1.5),
      ],
      [
        new THREE.Vector3(-4.2, -0.84, -1.8),
        new THREE.Vector3(-0.8, -0.82, -2.24),
        new THREE.Vector3(3, -0.8, -2.02),
        new THREE.Vector3(6.7, -0.78, -2.6),
        new THREE.Vector3(10.8, -0.76, -2.18),
      ],
      [
        new THREE.Vector3(-2.5, -0.85, 0.42),
        new THREE.Vector3(0.8, -0.83, 0.68),
        new THREE.Vector3(4.2, -0.81, 0.44),
        new THREE.Vector3(7.9, -0.79, -0.12),
      ],
    ],
    [],
  );

  useFrame((state) => {
    if (!ghostRef.current) {
      return;
    }

    ghostRef.current.children.forEach((child, index) => {
      const line = child as THREE.Line;
      const material = line.material;
      if (material instanceof THREE.LineBasicMaterial) {
        material.opacity =
          (0.04 + dryness * 0.24) +
          Math.max(0, Math.sin(state.clock.elapsedTime * 0.22 + index * 0.5)) * (0.02 + dryness * 0.08);
      }
    });
  });

  return (
    <group ref={ghostRef}>
      {ghostPaths.map((points, index) => (
        <Line
          key={`dry-river-${index}`}
          points={points}
          color={index === 1 ? "#9a6a2c" : "#b68741"}
          transparent
          opacity={0.05 + dryness * 0.24}
          lineWidth={index === 2 ? 1.4 : 1.8}
        />
      ))}
    </group>
  );
}

function RiverSandbars({
  dryness = 0.12,
}: {
  dryness?: number;
}) {
  const sandbarRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!sandbarRef.current) {
      return;
    }

    sandbarRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      mesh.rotation.z = (index % 2 === 0 ? 1 : -1) * Math.sin(state.clock.elapsedTime * 0.12 + index * 0.44) * 0.04;
      mesh.position.y =
        (-0.79 + index * 0.012) + Math.sin(state.clock.elapsedTime * 0.28 + index * 0.62) * 0.012;
    });
  });

  return (
    <group ref={sandbarRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0.12]} position={[-2.8, -0.79, 1.5]}>
        <planeGeometry args={[2.6, 0.62, 1, 1]} />
        <meshBasicMaterial color="#e8c774" transparent opacity={0.08 + dryness * 0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -0.08]} position={[1.4, -0.78, -1.08]}>
        <planeGeometry args={[2.1, 0.56, 1, 1]} />
        <meshBasicMaterial color="#f1d58e" transparent opacity={0.07 + dryness * 0.28} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.05]} position={[7.1, -0.77, 0.92]}>
        <planeGeometry args={[2.9, 0.72, 1, 1]} />
        <meshBasicMaterial color="#d8ab56" transparent opacity={0.06 + dryness * 0.26} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -0.11]} position={[10.2, -0.76, -1.62]}>
        <planeGeometry args={[1.9, 0.46, 1, 1]} />
        <meshBasicMaterial color="#f5dfab" transparent opacity={0.05 + dryness * 0.24} />
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

function ScrollRiverBackdrop({
  activeEra,
  traceFocus,
  sceneFocus,
}: Pick<RiverSceneProps, "activeEra" | "traceFocus" | "sceneFocus">) {
  const eraIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const warmth = eraIndex / Math.max(RIVER_ERA_ORDER.length - 1, 1);
  const focusBoost = traceFocus?.active ? 0.16 : sceneFocus?.active ? 0.1 : 0;
  const channelOpacity = 0.58 + warmth * 0.12 + focusBoost;
  const branchOpacity = 0.18 + warmth * 0.08 + focusBoost * 0.4;
  const confluences = [
    { left: "17%", top: "15%", size: "10rem" },
    { left: "24%", top: "44%", size: "14rem" },
    { left: "18%", top: "73%", size: "16rem" },
  ] as const;

  return (
    <div className="pointer-events-none absolute inset-[4%_3%_4%_3%] z-[2] overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 1600"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="scroll-river-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,251,237,0.98)" />
            <stop offset="22%" stopColor="rgba(252,228,166,0.95)" />
            <stop offset="54%" stopColor="rgba(243,197,90,0.9)" />
            <stop offset="100%" stopColor="rgba(182,116,34,0.42)" />
          </linearGradient>
          <linearGradient id="scroll-river-core" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,248,0.84)" />
            <stop offset="48%" stopColor="rgba(255,241,190,0.78)" />
            <stop offset="100%" stopColor="rgba(255,252,238,0.7)" />
          </linearGradient>
          <linearGradient id="scroll-river-branch" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,244,203,0.62)" />
            <stop offset="50%" stopColor="rgba(236,188,84,0.56)" />
            <stop offset="100%" stopColor="rgba(157,96,30,0.08)" />
          </linearGradient>
          <filter id="scroll-river-glow" x="-30%" y="-20%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="22" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 0.84 0 0 0  0 0 0.44 0 0  0 0 0 0.78 0"
            />
          </filter>
          <filter id="scroll-river-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        <path
          d="M150 120
             C300 90, 365 70, 470 118
             C555 156, 548 245, 448 274
             C334 308, 204 270, 122 330
             C48 384, 74 488, 196 506
             C365 531, 521 444, 656 485
             C754 514, 790 610, 716 676
             C633 750, 468 713, 316 748
             C183 779, 123 874, 174 947
             C232 1031, 386 1008, 539 1051
             C687 1092, 724 1221, 633 1286
             C547 1347, 382 1311, 238 1348
             C112 1381, 84 1486, 168 1532
             C242 1571, 410 1542, 528 1510"
          fill="none"
          stroke="url(#scroll-river-fill)"
          strokeWidth="110"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={channelOpacity}
          filter="url(#scroll-river-glow)"
        />
        <path
          d="M150 120
             C300 90, 365 70, 470 118
             C555 156, 548 245, 448 274
             C334 308, 204 270, 122 330
             C48 384, 74 488, 196 506
             C365 531, 521 444, 656 485
             C754 514, 790 610, 716 676
             C633 750, 468 713, 316 748
             C183 779, 123 874, 174 947
             C232 1031, 386 1008, 539 1051
             C687 1092, 724 1221, 633 1286
             C547 1347, 382 1311, 238 1348
             C112 1381, 84 1486, 168 1532
             C242 1571, 410 1542, 528 1510"
          fill="none"
          stroke="url(#scroll-river-fill)"
          strokeWidth="84"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={Math.min(0.96, channelOpacity + 0.18)}
        />
        <path
          d="M152 136
             C286 109, 355 94, 449 131
             C515 158, 503 225, 419 246
             C319 271, 207 243, 145 289
             C90 331, 112 404, 217 420
             C366 443, 514 372, 625 406
             C698 429, 725 500, 668 549
             C601 607, 457 580, 333 607
             C225 631, 182 712, 228 772
             C277 836, 409 815, 527 847
             C646 879, 681 981, 607 1034
             C534 1086, 393 1058, 275 1084
             C173 1108, 136 1188, 185 1239
             C241 1299, 390 1277, 488 1248"
          fill="none"
          stroke="url(#scroll-river-core)"
          strokeWidth="38"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.82 + warmth * 0.08}
        />

        <path
          d="M472 292 C548 236, 612 202, 692 218"
          fill="none"
          stroke="url(#scroll-river-branch)"
          strokeWidth="34"
          strokeLinecap="round"
          opacity={branchOpacity}
          filter="url(#scroll-river-soft)"
        />
        <path
          d="M587 665 C701 645, 790 678, 844 745"
          fill="none"
          stroke="url(#scroll-river-branch)"
          strokeWidth="30"
          strokeLinecap="round"
          opacity={branchOpacity + 0.04}
          filter="url(#scroll-river-soft)"
        />
        <path
          d="M224 845 C147 835, 102 877, 86 949"
          fill="none"
          stroke="url(#scroll-river-branch)"
          strokeWidth="28"
          strokeLinecap="round"
          opacity={branchOpacity - 0.03}
          filter="url(#scroll-river-soft)"
        />
        <path
          d="M518 1198 C634 1230, 706 1284, 759 1372"
          fill="none"
          stroke="url(#scroll-river-branch)"
          strokeWidth="32"
          strokeLinecap="round"
          opacity={branchOpacity}
          filter="url(#scroll-river-soft)"
        />
      </svg>
      {confluences.map((pool, index) => (
        <div
          key={`scroll-river-pool-${index}`}
          className="absolute rounded-full blur-[2px]"
          style={{
            left: pool.left,
            top: pool.top,
            width: pool.size,
            height: pool.size,
            opacity: 0.24 + warmth * 0.08 + focusBoost * 0.4,
            background:
              "radial-gradient(circle, rgba(255,248,223,0.92) 0%, rgba(250,219,140,0.64) 36%, rgba(213,151,56,0.2) 72%, rgba(213,151,56,0) 100%)",
          }}
        />
      ))}
    </div>
  );
}

function EraRiverZones({
  books,
  activeEra,
  eraTransitionProgress = 1,
}: {
  books: BookNode[];
  activeEra: RiverEra;
  eraTransitionProgress?: number;
}) {
  const activeIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
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
      const zone = zones[index];
      const isActive = zone?.index === activeIndex;
      const isPast = (zone?.index ?? 0) < activeIndex;
      const basePulse = isActive ? 0.06 : isPast ? 0.03 : 0.018;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * (isActive ? 0.7 : 0.42) + index * 0.38) * basePulse;
      mesh.scale.set(pulse, 1, pulse);
      const material = mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = isActive
          ? 0.14 + eraTransitionProgress * 0.08 + Math.max(0, Math.sin(state.clock.elapsedTime * 0.95 + index * 0.55)) * 0.07
          : isPast
            ? 0.06 + Math.max(0, Math.sin(state.clock.elapsedTime * 0.48 + index * 0.4)) * 0.03
            : 0.022 + Math.max(0, Math.sin(state.clock.elapsedTime * 0.36 + index * 0.32)) * 0.018;
      }
    });
  });

  return (
    <group ref={zoneRef}>
      {zones.map((zone) => {
        const isActive = zone.index === activeIndex;
        const isPast = zone.index < activeIndex;

        return (
          <group
            key={`era-zone-${zone.era}`}
            position={zone.position}
          >
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              scale={zone.scale}
            >
              <planeGeometry args={[1, 1, 1, 1]} />
              <meshBasicMaterial
                color={isActive ? "#f6cf71" : zone.color}
                transparent
                opacity={isActive ? 0.18 + eraTransitionProgress * 0.06 : isPast ? 0.07 : 0.028}
              />
            </mesh>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.012, 0]}
              scale={[zone.scale[0] * 0.72, 1, zone.scale[2] * 0.58]}
            >
              <planeGeometry args={[1, 1, 1, 1]} />
              <meshBasicMaterial
                color={isActive ? "#fff0bf" : "#f5d486"}
                transparent
                opacity={isActive ? 0.08 + eraTransitionProgress * 0.06 : isPast ? 0.03 : 0.012}
              />
            </mesh>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.02, 0]}
              scale={[zone.scale[0] * 0.84, 1, Math.max(0.2, zone.scale[2] * 0.08)]}
            >
              <planeGeometry args={[1, 1, 1, 1]} />
              <meshBasicMaterial
                color={isActive ? "#fff3c7" : "#e8c774"}
                transparent
                opacity={isActive ? 0.16 + eraTransitionProgress * 0.05 : isPast ? 0.05 : 0.016}
              />
            </mesh>
          </group>
        );
      })}
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
  spotlightSlugs = [],
}: {
  books: BookNode[];
  activeEra: RiverEra;
  spotlightSlugs?: string[];
}) {
  const beaconRef = useRef<THREE.Group>(null);
  const activeIndex = RIVER_ERA_ORDER.indexOf(activeEra);
  const spotlightSet = useMemo(() => new Set(spotlightSlugs), [spotlightSlugs]);
  const latestBooks = useMemo(() => {
    const spotlightBooks = books.filter((book) => spotlightSet.has(book.slug));

    if (spotlightBooks.length) {
      return spotlightBooks.slice(0, 4);
    }

    return books
      .filter((book) => RIVER_ERA_ORDER.indexOf(book.dynasty) === activeIndex)
      .slice(0, 4);
  }, [activeIndex, books, spotlightSet]);

  useFrame((state) => {
    if (!beaconRef.current) {
      return;
    }

    beaconRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4 + index * 0.85) * 0.26;
      mesh.scale.setScalar(pulse);
      const material = mesh.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.22 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.4 + index * 0.85)) * 0.22;
      }
    });
  });

  return (
    <group ref={beaconRef}>
      {latestBooks.map((book, index) => (
        <group
          key={`beacon-${book.id}`}
          position={[book.coordinates[0], book.coordinates[1] - 0.03, book.coordinates[2]]}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.28, 0.46, 40]} />
            <meshBasicMaterial color="#fde68a" transparent opacity={0.24} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]}>
            <circleGeometry args={[0.18, 28]} />
            <meshBasicMaterial color="#fff5cf" transparent opacity={0.14} />
          </mesh>
          {[
            [-0.18, 0.02, 0.09],
            [0.16, 0.018, -0.08],
            [0.08, 0.014, 0.19],
          ].map((offset, lightIndex) => (
            <mesh
              key={`beacon-light-${book.id}-${lightIndex}`}
              position={[offset[0], offset[1], offset[2]]}
            >
              <sphereGeometry args={[index === 0 ? 0.038 : 0.03, 12, 12]} />
              <meshStandardMaterial
                color="#fef3c7"
                emissive={new THREE.Color(lightIndex === 1 ? "#fbbf24" : "#fde68a")}
                emissiveIntensity={1.3 + lightIndex * 0.18}
                transparent
                opacity={0.9}
              />
            </mesh>
          ))}
        </group>
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

function EraCurrentWash({
  books,
  activeEra,
  eraTransitionProgress = 1,
}: {
  books: BookNode[];
  activeEra: RiverEra;
  eraTransitionProgress?: number;
}) {
  const washRef = useRef<THREE.Group>(null);
  const activeBooks = useMemo(
    () =>
      books
        .filter((book) => book.dynasty === activeEra && book.branchLevel === 0)
        .sort((left, right) => left.year - right.year),
    [activeEra, books],
  );
  const washPosition = useMemo(() => {
    if (!activeBooks.length) {
      return null;
    }

    const totals = activeBooks.reduce(
      (accumulator, book) => {
        accumulator.x += book.coordinates[0];
        accumulator.y += book.coordinates[1];
        accumulator.z += book.coordinates[2];
        return accumulator;
      },
      { x: 0, y: 0, z: 0 },
    );
    const count = Math.max(activeBooks.length, 1);

    return new THREE.Vector3(
      totals.x / count,
      totals.y / count - 0.12,
      totals.z / count,
    );
  }, [activeBooks]);
  const washScale = useMemo(() => {
    if (!activeBooks.length) {
      return null;
    }

    const xValues = activeBooks.map((book) => book.coordinates[0]);
    const zValues = activeBooks.map((book) => book.coordinates[2]);
    const width = Math.max(...xValues) - Math.min(...xValues);
    const depth = Math.max(...zValues) - Math.min(...zValues);

    return {
      x: Math.max(2.8, width * 1.18 + 1.6),
      z: Math.max(2.2, depth * 1.5 + 2.1),
    };
  }, [activeBooks]);
  const washFlowPoints = useMemo(
    () => activeBooks.map((book) => new THREE.Vector3(...book.coordinates)),
    [activeBooks],
  );

  useFrame((state) => {
    if (!washRef.current || !washPosition) {
      return;
    }

    washRef.current.position.y =
      washPosition.y + Math.sin(state.clock.elapsedTime * 0.34) * 0.03;
    washRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const material = mesh.material;

      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity =
          (index === 0 ? 0.1 : 0.07) * (0.45 + eraTransitionProgress * 0.55) +
          Math.max(0, Math.sin(state.clock.elapsedTime * (0.72 + index * 0.18))) * 0.06;
      }
    });
  });

  if (!washPosition || !washScale) {
    return null;
  }

  return (
    <group>
      <group ref={washRef} position={[washPosition.x, washPosition.y, washPosition.z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[washScale.x, 1, washScale.z]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial color="#f6cf71" transparent opacity={0.1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} scale={[washScale.x * 0.72, 1, washScale.z * 0.62]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial color="#fff0c2" transparent opacity={0.07} />
        </mesh>
      </group>
      {washFlowPoints.length >= 2 ? (
        <group>
          <Line
            points={washFlowPoints}
            color="#fde68a"
            transparent
            opacity={0.38 + eraTransitionProgress * 0.24}
            lineWidth={4.6}
          />
          <Line
            points={washFlowPoints}
            color="#fff4c7"
            transparent
            opacity={0.12 + eraTransitionProgress * 0.1}
            lineWidth={9.2}
          />
          <RiverParticleStream
            points={washFlowPoints}
            color="#fff0b8"
            density={72}
            flowSpeed={0.08 + eraTransitionProgress * 0.05}
            spread={0.045}
          />
        </group>
      ) : null}
    </group>
  );
}

function BackgroundBranchField({
  books,
  activeEra,
  vitality = 1,
  dryness = 0.1,
}: {
  books: BookNode[];
  activeEra: RiverEra;
  vitality?: number;
  dryness?: number;
}) {
  const activeIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const fieldRef = useRef<THREE.Group>(null);
  const fieldStreams = useMemo(() => {
    const candidates = books
      .filter((book) => {
        const eraIndex = RIVER_ERA_ORDER.indexOf(book.dynasty);
        return eraIndex <= activeIndex && (book.branchLevel >= 1 || book.influence < 65);
      })
      .sort((left, right) => left.year - right.year);

    const upperBank = candidates
      .filter((_, index) => index % 3 === 0)
      .slice(0, 10)
      .map(
        (book, index) =>
          new THREE.Vector3(
            book.coordinates[0] - 0.35 + index * 0.06,
            book.coordinates[1] - 0.08,
            book.coordinates[2] + 2.2 + (index % 2) * 0.42,
          ),
      );
    const lowerBank = candidates
      .filter((_, index) => index % 3 === 1)
      .slice(0, 10)
      .map(
        (book, index) =>
          new THREE.Vector3(
            book.coordinates[0] - 0.18 + index * 0.04,
            book.coordinates[1] - 0.1,
            book.coordinates[2] - 2.25 - (index % 2) * 0.38,
          ),
      );
    const midField = candidates
      .filter((_, index) => index % 4 === 0)
      .slice(0, 8)
      .map(
        (book, index) =>
          new THREE.Vector3(
            book.coordinates[0] + 0.12,
            book.coordinates[1] - 0.12,
            book.coordinates[2] + (index % 2 === 0 ? 1.3 : -1.34),
          ),
      );

    return [upperBank, lowerBank, midField].filter((stream) => stream.length >= 2);
  }, [activeIndex, books]);

  const opacity = Math.max(0.04, 0.12 * vitality - dryness * 0.04);
  const glowOpacity = Math.max(0.015, 0.05 * vitality - dryness * 0.012);
  const particleDensity = Math.max(18, Math.round(44 * vitality));
  const particleSpread = 0.08 + dryness * 0.06;

  useFrame((state) => {
    if (!fieldRef.current) {
      return;
    }

    fieldRef.current.children.forEach((child, index) => {
      child.position.y = Math.sin(state.clock.elapsedTime * 0.16 + index * 0.7) * 0.018;
      child.position.z = Math.sin(state.clock.elapsedTime * 0.12 + index * 0.45) * 0.05;
    });
  });

  return (
    <group ref={fieldRef}>
      {fieldStreams.map((stream, index) => (
        <group key={`background-field-${index}`}>
          <RiverRibbon
            points={stream}
            width={0.038 + vitality * 0.018 - index * 0.003}
            color={index === 2 ? "#8b5a21" : "#a66a24"}
            glow={index === 1 ? "#f5d486" : "#eac268"}
            opacity={opacity}
            glowOpacity={glowOpacity}
            emissiveIntensity={0.04 + vitality * 0.12}
          />
          <RiverParticleStream
            points={stream}
            color={index === 1 ? "#f8e3af" : "#f1cf84"}
            density={particleDensity - index * 6}
            flowSpeed={0.022 + vitality * 0.03 + index * 0.004}
            spread={particleSpread}
          />
        </group>
      ))}
    </group>
  );
}

function RiverbankLandmarks({
  books,
  activeEra,
  selectedBookSlug,
  highlightedBookSlugs = [],
}: {
  books: BookNode[];
  activeEra: RiverEra;
  selectedBookSlug: string;
  highlightedBookSlugs?: string[];
}) {
  const activeIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const landmarkRef = useRef<THREE.Group>(null);
  const highlightedSet = useMemo(() => new Set(highlightedBookSlugs), [highlightedBookSlugs]);
  const landmarks = useMemo(() => {
    const visibleBooks = books.filter((book) => RIVER_ERA_ORDER.indexOf(book.dynasty) <= activeIndex);
    const prioritized = visibleBooks
      .filter((book) => book.slug === selectedBookSlug || highlightedSet.has(book.slug) || book.branchLevel === 0)
      .sort((left, right) => {
        const leftScore =
          (left.slug === selectedBookSlug ? 1000 : 0) +
          (highlightedSet.has(left.slug) ? 400 : 0) +
          left.influence;
        const rightScore =
          (right.slug === selectedBookSlug ? 1000 : 0) +
          (highlightedSet.has(right.slug) ? 400 : 0) +
          right.influence;
        return rightScore - leftScore;
      });
    const seen = new Set<string>();

    return prioritized
      .filter((book) => {
        const bucket = `${Math.round(book.coordinates[0])}:${book.coordinates[2] >= 0 ? "north" : "south"}`;
        if (seen.has(bucket)) {
          return false;
        }
        seen.add(bucket);
        return true;
      })
      .slice(0, 6)
      .map((book, index) => {
        const northBank = book.coordinates[2] >= 0;
        const bankOffset = northBank ? 1.36 : -1.38;
        const lateralOffset = northBank ? 0.12 : -0.16;
        return {
          id: book.slug,
          title: book.shortTitle,
          northBank,
          emphasized: book.slug === selectedBookSlug || highlightedSet.has(book.slug),
          position: [
            book.coordinates[0] + (index % 2 === 0 ? -0.18 : 0.22),
            book.coordinates[1] - 0.02,
            book.coordinates[2] + bankOffset,
          ] as [number, number, number],
          stackHeight: 0.24 + (book.slug === selectedBookSlug ? 0.18 : highlightedSet.has(book.slug) ? 0.12 : 0),
          quayWidth: 0.42 + (index % 3) * 0.08,
          lateralOffset,
        };
      });
  }, [activeIndex, books, highlightedSet, selectedBookSlug]);

  useFrame((state) => {
    if (!landmarkRef.current) {
      return;
    }

    landmarkRef.current.children.forEach((child, index) => {
      const group = child as THREE.Group;
      const baseY = landmarks[index]?.position[1] ?? 0;
      group.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.62 + index * 0.45) * 0.012;
    });
  });

  if (!landmarks.length) {
    return null;
  }

  return (
    <group ref={landmarkRef}>
      {landmarks.map((landmark, index) => (
        <group key={`riverbank-landmark-${landmark.id}`} position={landmark.position}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[landmark.quayWidth + 0.18, 30]} />
            <meshBasicMaterial
              color={landmark.emphasized ? "#f8deb0" : "#d5a553"}
              transparent
              opacity={landmark.emphasized ? 0.18 : 0.1}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, landmark.northBank ? 0.18 : -0.18]} position={[0, -0.015, 0]}>
            <planeGeometry args={[landmark.quayWidth + 0.32, 0.24, 1, 1]} />
            <meshStandardMaterial
              color={landmark.northBank ? "#8f6326" : "#7d531f"}
              emissive={new THREE.Color(landmark.emphasized ? "#d69c44" : "#a66a24")}
              emissiveIntensity={landmark.emphasized ? 0.42 : 0.24}
              roughness={0.88}
              metalness={0.02}
              transparent
              opacity={0.92}
            />
          </mesh>
          <mesh position={[landmark.lateralOffset, 0.13, 0]}>
            <boxGeometry args={[0.16, landmark.stackHeight, 0.16]} />
            <meshStandardMaterial
              color="#f6deb0"
              emissive={new THREE.Color(landmark.emphasized ? "#fbbf24" : "#d8a24b")}
              emissiveIntensity={landmark.emphasized ? 0.54 : 0.28}
              roughness={0.64}
              metalness={0.05}
            />
          </mesh>
          <mesh position={[landmark.lateralOffset, 0.25 + landmark.stackHeight * 0.52, 0]}>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial
              color="#fff1cf"
              emissive={new THREE.Color("#fcd34d")}
              emissiveIntensity={landmark.emphasized ? 0.88 : 0.48}
              roughness={0.52}
              metalness={0.08}
            />
          </mesh>
          <mesh position={[-landmark.lateralOffset * 0.75, 0.08, 0.06]}>
            <cylinderGeometry args={[0.03, 0.03, 0.16, 10]} />
            <meshStandardMaterial
              color="#e8c774"
              emissive={new THREE.Color("#f59e0b")}
              emissiveIntensity={landmark.emphasized ? 0.8 : 0.45}
            />
          </mesh>
          <mesh position={[-landmark.lateralOffset * 0.75, 0.2, 0.06]}>
            <sphereGeometry args={[0.036, 12, 12]} />
            <meshStandardMaterial
              color="#fff6de"
              emissive={new THREE.Color("#fde68a")}
              emissiveIntensity={landmark.emphasized ? 1.2 : 0.72}
            />
          </mesh>
          {index < 4 ? (
            <Text
              position={[0, 0.48 + landmark.stackHeight * 0.4, 0]}
              fontSize={0.1}
              color={landmark.emphasized ? "#fef3c7" : "#eadfbc"}
              fillOpacity={landmark.emphasized ? 0.86 : 0.42}
              anchorX="center"
              anchorY="middle"
            >
              {landmark.title}
            </Text>
          ) : null}
        </group>
      ))}
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
  opacityFactor = 1,
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
  opacityFactor?: number;
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
            {isSelected || isHovered || isSearchHighlighted || isTraceLinked || isCruiseStrong ? (
              <>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]}>
                  <circleGeometry args={[markerSize + 0.18, 32]} />
                  <meshBasicMaterial
                    color={isSelected || isHovered ? "#fff3c5" : "#f7d987"}
                    transparent
                    opacity={(isHovered || isSelected ? 0.2 : isCruiseStrong ? 0.12 + revealBlend * 0.1 : 0.11) * opacityFactor}
                  />
                </mesh>
                {[
                  [-0.16, 0.015, 0.11],
                  [0.14, 0.023, -0.1],
                  [0.06, 0.03, 0.19],
                ].map((offset, lightIndex) => (
                  <mesh
                    key={`book-harbor-light-${book.id}-${lightIndex}`}
                    position={[offset[0], offset[1], offset[2]]}
                  >
                    <sphereGeometry args={[isHovered || isSelected ? 0.026 : 0.02, 10, 10]} />
                    <meshStandardMaterial
                      color="#fef3c7"
                      emissive={new THREE.Color(lightIndex === 1 ? "#f59e0b" : "#fde68a")}
                      emissiveIntensity={
                        isHovered || isSelected
                          ? 1.55 + lightIndex * 0.12
                          : 0.88 + lightIndex * 0.08
                      }
                      transparent
                      opacity={0.92}
                    />
                  </mesh>
                ))}
              </>
            ) : null}
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
                  (shouldDim
                    ? 0.14
                    : isHovered || isSearchHighlighted || isSelected || isTraceLinked || isSceneFocused
                      ? 1
                      : isCruiseStrong
                        ? 0.38 + revealBlend * 0.48
                      : isCruiseSoft
                        ? 0.16 + revealBlend * 0.2
                        : isNewestVisible
                          ? 0.34
                          : 0.16) * opacityFactor
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
                  opacity={(isTraceCurrent ? 0.65 : isHovered ? 0.52 : isSearchHighlighted ? 0.4 : isCruiseStrong ? 0.24 + revealBlend * 0.22 : 0.28) * opacityFactor}
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
                (isTraceCurrent || isHovered || isSelected || isSearchHighlighted || isTraceLinked || isSceneFocused
                  ? 1
                  : isCruiseStrong
                    ? 0.44 + revealBlend * 0.46
                  : isCruiseSoft
                    ? 0.12 + revealBlend * 0.16
                    : isNewestVisible
                      ? 0.28
                      : 0.1) * opacityFactor
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

function CruiseCurrentAura({
  focusPosition,
  tailPoints,
  color,
}: {
  focusPosition: THREE.Vector3 | null;
  tailPoints: THREE.Vector3[];
  color: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const primaryPulse = 1 + Math.sin(state.clock.elapsedTime * 1.45) * 0.1;
    const secondaryPulse = 1 + Math.sin(state.clock.elapsedTime * 1.1 + 0.5) * 0.14;

    if (ringRef.current) {
      ringRef.current.scale.set(primaryPulse, primaryPulse, primaryPulse);
      const material = ringRef.current.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.16 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.45)) * 0.12;
      }
    }

    if (glowRef.current) {
      glowRef.current.scale.set(secondaryPulse, secondaryPulse, secondaryPulse);
      const material = glowRef.current.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.08 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.1 + 0.5)) * 0.08;
      }
    }
  });

  if (!focusPosition) {
    return null;
  }

  return (
    <group>
      {tailPoints.length >= 2 ? (
        <group>
          <Line
            points={tailPoints}
            color={color}
            transparent
            opacity={0.42}
            lineWidth={5.8}
          />
          <Line
            points={tailPoints}
            color="#fff4c7"
            transparent
            opacity={0.16}
            lineWidth={10.2}
          />
          <RiverParticleStream
            points={tailPoints}
            color="#fde68a"
            density={54}
            flowSpeed={0.18}
            spread={0.035}
          />
        </group>
      ) : null}
      <mesh
        ref={glowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[focusPosition.x, focusPosition.y - 0.08, focusPosition.z]}
      >
        <circleGeometry args={[0.82, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[focusPosition.x, focusPosition.y - 0.05, focusPosition.z]}
      >
        <ringGeometry args={[0.46, 0.8, 48]} />
        <meshBasicMaterial color="#fff4c7" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function BranchConfluenceAura({
  focusPosition,
  color,
}: {
  focusPosition: THREE.Vector3 | null;
  color: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const washRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.7) * 0.12;
    const outerPulse = 1 + Math.sin(state.clock.elapsedTime * 1.08 + 0.45) * 0.18;

    if (ringRef.current) {
      ringRef.current.scale.set(pulse, pulse, pulse);
      const material = ringRef.current.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.2 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.7)) * 0.16;
      }
    }

    if (outerRef.current) {
      outerRef.current.scale.set(outerPulse, outerPulse, outerPulse);
      const material = outerRef.current.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.08 + Math.max(0, Math.sin(state.clock.elapsedTime * 1.08 + 0.45)) * 0.08;
      }
    }

    if (washRef.current) {
      washRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
      const material = washRef.current.material;
      if (material instanceof THREE.MeshBasicMaterial) {
        material.opacity = 0.09 + Math.max(0, Math.sin(state.clock.elapsedTime * 0.9)) * 0.05;
      }
    }
  });

  if (!focusPosition) {
    return null;
  }

  return (
    <group position={[focusPosition.x, focusPosition.y, focusPosition.z]}>
      <mesh
        ref={washRef}
        rotation={[-Math.PI / 2, 0, 0.16]}
        position={[0, -0.06, 0]}
        scale={[1.52, 1, 0.96]}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      <mesh
        ref={outerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
      >
        <ringGeometry args={[0.52, 0.92, 56]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} />
      </mesh>
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.035, 0]}
      >
        <ringGeometry args={[0.24, 0.46, 48]} />
        <meshBasicMaterial color="#fff3c4" transparent opacity={0.22} />
      </mesh>
      {[0, Math.PI / 3, -Math.PI / 3].map((rotation, index) => (
        <mesh
          key={`branch-fan-${index}`}
          rotation={[0, rotation, 0]}
          position={[0, 0.12, 0]}
          scale={[0.16, 0.7 + index * 0.06, 0.9]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color={index === 0 ? "#fde68a" : color} transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      ))}
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
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
            <circleGeometry
              args={[
                hoveredDockId === dock.id || selectedDockId === dock.id ? 0.26 : 0.2,
                28,
              ]}
            />
            <meshBasicMaterial
              color="#fff1c7"
              transparent
              opacity={hoveredDockId === dock.id || selectedDockId === dock.id ? 0.18 : 0.1}
            />
          </mesh>
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
          {[
            [-0.11, 0.08, 0.08],
            [0.12, 0.06, -0.06],
          ].map((offset, lightIndex) => (
            <mesh
              key={`dock-light-${dock.id}-${lightIndex}`}
              position={[offset[0], offset[1], offset[2]]}
            >
              <sphereGeometry args={[0.026, 10, 10]} />
              <meshStandardMaterial
                color="#fff7dc"
                emissive={new THREE.Color(dock.accentColor ?? activeColor)}
                emissiveIntensity={
                  hoveredDockId === dock.id || selectedDockId === dock.id ? 1.28 : 0.82
                }
              />
            </mesh>
          ))}
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
  sourceAtlasActiveRouteId,
  sourceAtlasRoutes = [],
  eraTransitionProgress = 1,
  onInteractionStart,
  onInteractionEnd,
}: RiverSceneProps & {
  cruiseProgress: number;
  eraTransitionProgress?: number;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsInstance>(null);
  const userInteractingRef = useRef(false);
  const resumeAutoFrameRef = useRef<number | null>(null);
  const [allowOrbitRotate, setAllowOrbitRotate] = useState(false);
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
  const cruiseBranchAnnotation = useMemo(() => {
    if (
      branchAnnotations.length === 0 ||
      selectedBookSlug ||
      traceFocus?.active ||
      sceneFocus?.active ||
      searchFocusSlug
    ) {
      return null;
    }

    return branchAnnotations.reduce<RiverBranchAnnotation | null>((closest, annotation) => {
      if (!closest) {
        return annotation;
      }

      const closestProgress = THREE.MathUtils.clamp((closest.position[0] + 6.8) / 16.8, 0.08, 0.92);
      const nextProgress = THREE.MathUtils.clamp((annotation.position[0] + 6.8) / 16.8, 0.08, 0.92);
      const closestDistance = Math.abs(closestProgress - cruiseProgress);
      const nextDistance = Math.abs(nextProgress - cruiseProgress);

      return nextDistance < closestDistance ? annotation : closest;
    }, null);
  }, [
    branchAnnotations,
    cruiseProgress,
    sceneFocus?.active,
    searchFocusSlug,
    selectedBookSlug,
    traceFocus?.active,
  ]);
  const resolvedBranchAnnotation = activeBranchAnnotation ?? cruiseBranchAnnotation;
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
  const cruiseTailPoints = useMemo(() => {
    if (!mainStreamCurve) {
      return [];
    }

    const center = THREE.MathUtils.clamp(cruiseProgress, 0.06, 0.98);
    const steps = [-0.16, -0.11, -0.065, -0.025, 0];

    return steps.map((offset) =>
      mainStreamCurve.getPointAt(THREE.MathUtils.clamp(center + offset, 0.001, 0.999)),
    );
  }, [cruiseProgress, mainStreamCurve]);
  const cruiseFocusPosition = useMemo(() => {
    if (!cruiseSnapshot) {
      return null;
    }

    return cruiseSnapshot.point.clone();
  }, [cruiseSnapshot]);
  const cruiseVisualRunning =
    viewMode === "river" &&
    !traceFocus?.active &&
    !sceneFocus?.active &&
    !searchFocusSlug;
  const openingSpotlightSlugs = useMemo(
    () =>
      books
        .filter((book) => book.branchLevel === 0)
        .sort((left, right) => {
          if (left.dynasty !== right.dynasty) {
            return RIVER_ERA_ORDER.indexOf(left.dynasty) - RIVER_ERA_ORDER.indexOf(right.dynasty);
          }

          return right.influence - left.influence;
        })
        .slice(0, 3)
        .map((book) => book.slug),
    [books],
  );
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(min-width: 768px)");
    const syncViewportMode = () => setAllowOrbitRotate(media.matches);

    syncViewportMode();
    media.addEventListener("change", syncViewportMode);

    return () => media.removeEventListener("change", syncViewportMode);
  }, []);
  const sourceAtlasFlowPoints = useMemo(
    () => sourceAtlasPathPoints.map((point) => new THREE.Vector3(...point)),
    [sourceAtlasPathPoints],
  );
  const activeBranchFlowPoints = useMemo(() => {
    if (!resolvedBranchAnnotation) {
      return [];
    }

    const sourceBook = books.find((book) => book.slug === resolvedBranchAnnotation.sourceSlug) ?? null;
    const targetBook = books.find((book) => book.slug === resolvedBranchAnnotation.targetSlug) ?? null;

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
  }, [books, resolvedBranchAnnotation]);
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
  const ambientSourceAtlasRouteCurves = useMemo(
    () => sourceAtlasRouteCurves.slice(0, 4),
    [sourceAtlasRouteCurves],
  );
  const activeSourceAtlasRoute = useMemo(
    () =>
      sourceAtlasActiveRouteId
        ? sourceAtlasRouteCurves.find((route) => route.id === sourceAtlasActiveRouteId) ?? null
        : null,
    [sourceAtlasActiveRouteId, sourceAtlasRouteCurves],
  );
  const eraIndex = Math.max(0, RIVER_ERA_ORDER.indexOf(activeEra));
  const eraWarmth = eraIndex / Math.max(RIVER_ERA_ORDER.length - 1, 1);
  const eraFlowProfile = ERA_FLOW_PROFILE[activeEra];
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
    const revealFactor = 0.3 + eraTransitionProgress * 0.7;
    const fullness = eraFlowProfile.fullness * (0.94 + eraWarmth * 0.12);
    const mainOpacity = eraFlowProfile.mainOpacity * revealFactor;
    const branchOpacity = eraFlowProfile.branchOpacity * revealFactor;
    const branchVisibility = eraFlowProfile.branchVisibility * revealFactor;
    const glowStrength = 0.16 + eraWarmth * 0.24 + eraFlowProfile.glowBoost + scenePulse * 0.08;
    const nodeOpacityFactor = 0.42 + eraTransitionProgress * 0.58;
    const dryness = eraFlowProfile.dryness * (0.6 + (1 - eraTransitionProgress) * 0.4 + eraWarmth * 0.2);
    const particleDensityBoost = eraFlowProfile.particleBoost;

    return {
      fullness,
      mainOpacity,
      branchOpacity,
      branchVisibility,
      glowStrength,
      nodeOpacityFactor,
      dryness,
      particleDensityBoost,
    };
  }, [eraFlowProfile, eraTransitionProgress, eraWarmth, scenePulse]);
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
      <RiverSandbars dryness={eraRiverMood.dryness} />
      <DryRiverGhosts dryness={eraRiverMood.dryness} />
      <ScrollContourLines />
      <EraRiverZones
        books={books}
        activeEra={activeEra}
        eraTransitionProgress={eraTransitionProgress}
      />
      <BackgroundBranchField
        books={books}
        activeEra={activeEra}
        vitality={eraRiverMood.branchVisibility}
        dryness={eraRiverMood.dryness}
      />
      <RiverbankLandmarks
        books={books}
        activeEra={activeEra}
        selectedBookSlug={selectedBookSlug}
        highlightedBookSlugs={highlightedBookSlugs}
      />

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
              Math.round(
                (180 + mainStreamStats.averageInfluence * 0.9) *
                  eraRiverMood.fullness *
                  eraRiverMood.particleDensityBoost,
              ),
            )}
            flowSpeed={(0.032 + mainStreamStats.averageVelocity * 0.16) * (0.82 + eraWarmth * 0.42)}
            spread={Math.max(0.05, 0.14 - eraWarmth * 0.035 + eraRiverMood.dryness * 0.06)}
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
                    eraRiverMood.branchVisibility *
                    eraRiverMood.particleDensityBoost,
                ),
              )}
              flowSpeed={(0.038 + branchStreamStats[index]!.averageVelocity * 0.18) * (0.78 + eraWarmth * 0.48)}
              spread={Math.max(0.04, 0.11 - eraWarmth * 0.026 + eraRiverMood.dryness * 0.05)}
            />
          </group>
        ) : null,
      )}

      <FlowBeacons
        books={books}
        activeEra={activeEra}
        spotlightSlugs={!selectedBookSlug && !traceFocus?.active && !sceneFocus?.active ? openingSpotlightSlugs : []}
      />
      <EraCurrentWash
        books={books}
        activeEra={activeEra}
        eraTransitionProgress={eraTransitionProgress}
      />
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
      cruiseVisualRunning &&
      !searchFocusSlug ? (
        <CruiseCurrentAura
          focusPosition={cruiseFocusPosition}
          tailPoints={cruiseTailPoints}
          color="#fcd34d"
        />
      ) : null}
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
          <BranchConfluenceAura
            focusPosition={resolvedBranchAnnotation ? new THREE.Vector3(...resolvedBranchAnnotation.position) : null}
            color={resolvedBranchAnnotation?.accentColor ?? "#fcd34d"}
          />
          <Line
            points={activeBranchFlowPoints}
            color={resolvedBranchAnnotation?.accentColor ?? "#fcd34d"}
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
            color={resolvedBranchAnnotation?.accentColor ?? "#fde68a"}
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
          {ambientSourceAtlasRouteCurves.map((route, index) => (
            <group key={route.id}>
              <Line
                points={route.points}
                color={route.color}
                transparent
                opacity={route.id === sourceAtlasActiveRouteId ? 0.4 : 0.2}
                lineWidth={route.id === sourceAtlasActiveRouteId ? 2.2 : 1.2}
              />
              <Line
                points={route.points}
                color="#fef3c7"
                transparent
                opacity={route.id === sourceAtlasActiveRouteId ? 0.12 : 0.06}
                lineWidth={route.id === sourceAtlasActiveRouteId ? 4.8 : 3.4}
              />
              <RiverParticleStream
                points={route.points}
                color={route.id === sourceAtlasActiveRouteId ? "#fde68a" : route.color}
                density={route.id === sourceAtlasActiveRouteId ? 64 : Math.max(18, 32 - index * 4)}
                flowSpeed={0.048 + index * 0.008}
                spread={route.id === sourceAtlasActiveRouteId ? 0.045 : 0.032}
              />
            </group>
          ))}
        </group>
      ) : null}
      {!selectedBookSlug && activeSourceAtlasRoute ? (
        <group>
          <Line
            points={activeSourceAtlasRoute.points}
            color="#fff3bf"
            transparent
            opacity={0.16}
            lineWidth={7.2}
          />
          <RiverParticleStream
            points={activeSourceAtlasRoute.points}
            color="#fff0b3"
            density={92}
            flowSpeed={0.082}
            spread={0.04}
          />
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
        opacityFactor={eraRiverMood.nodeOpacityFactor}
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
        panSpeed={allowOrbitRotate ? 0.94 : 1.32}
        rotateSpeed={0.34}
        zoomSpeed={0.82}
        maxDistance={15}
        minDistance={6.4}
        minAzimuthAngle={allowOrbitRotate ? -0.62 : -0.18}
        maxAzimuthAngle={allowOrbitRotate ? 0.62 : 0.18}
        minPolarAngle={allowOrbitRotate ? Math.PI / 2.95 : Math.PI / 2.55}
        maxPolarAngle={allowOrbitRotate ? Math.PI / 2.02 : Math.PI / 2.18}
        enableRotate={allowOrbitRotate}
        enableZoom
        target={initialControlsTarget}
        mouseButtons={{
          LEFT: allowOrbitRotate ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: allowOrbitRotate ? THREE.TOUCH.ROTATE : THREE.TOUCH.PAN,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </>
  );
}

export function RiverScene(props: RiverSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cruiseProgress, setCruiseProgress] = useState(0.18);
  const [autoCruise, setAutoCruise] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [eraTransitionProgress, setEraTransitionProgress] = useState(1);
  const previousEraRef = useRef<RiverEra>(props.activeEra);
  const activeEraStory = RIVER_ERA_STORIES[props.activeEra];
  const canCruise =
    props.viewMode === "river" &&
    !props.traceFocus?.active &&
    !props.sceneFocus?.active &&
    !props.searchFocusSlug;
  const cruiseRunning = canCruise && autoCruise;
  const riverStageLead = props.selectedBookSlug
    ? "文卷已入河心，可沿右侧卷内继续细读。"
    : props.sourceAtlasLabel
      ? `${props.sourceAtlasLabel} 这股来源支流正映入主河。`
      : activeEraStory.lead;
  const riverStageDetail = props.selectedBookSlug
    ? props.traceFocus?.active
      ? `溯源光线已推进 ${props.traceFocus.progress}/${props.traceFocus.total} 层，主河镜头正随卷内回看源头。`
      : props.sceneFocus?.active
        ? `${props.sceneFocus.contextLabel} 已与主河镜头相接。`
        : "右侧文卷与主河已保持联动，读卷时不会再挤占整幅河面。"
    : props.sourceAtlasSummary ?? activeEraStory.trunk;
  const riverStageModeLabel = props.traceFocus?.active
    ? "逆流溯源"
    : props.sceneFocus?.active
      ? "场景联动"
      : props.selectedBookSlug
        ? "入卷细览"
        : props.eraPlaybackActive
          ? "时代顺演"
        : cruiseRunning
          ? "顺河巡航"
          : "河面驻看";
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
        spotlightSlug: book.slug,
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
  const activeCruiseAnchor = useMemo(() => {
    if (!cruiseAnchorMoments.length) {
      return null;
    }

    return cruiseAnchorMoments.reduce<CruiseAnchorMoment | null>((closest, anchor) => {
      if (!closest) {
        return anchor;
      }

      const closestDistance = Math.abs(closest.progress - cruiseProgress);
      const nextDistance = Math.abs(anchor.progress - cruiseProgress);
      return nextDistance < closestDistance ? anchor : closest;
    }, null);
  }, [cruiseAnchorMoments, cruiseProgress]);
  const activeEraCruiseAnchor = useMemo(() => {
    if (!props.eraPlaybackActive) {
      return null;
    }

    return (
      cruiseAnchorMoments.find(
        (anchor) => anchor.kind === "era" && anchor.era === props.activeEra,
      ) ?? null
    );
  }, [cruiseAnchorMoments, props.activeEra, props.eraPlaybackActive]);
  const stageLead =
    !props.selectedBookSlug && cruiseRunning && activeCruiseAnchor
      ? activeCruiseAnchor.kind === "book"
        ? `巡航正掠过《${activeCruiseAnchor.label}》，可顺势入卷细看这一段主干。`
        : activeCruiseAnchor.kind === "branch"
          ? `${activeCruiseAnchor.label} 正临近镜头，这股文脉支流正在河面显影。`
          : `${activeCruiseAnchor.label} 正在眼前铺开，可沿这一段河势继续巡看。`
      : riverStageLead;
  const stageDetail =
    !props.selectedBookSlug && cruiseRunning && activeCruiseAnchor
      ? activeCruiseAnchor.detail
      : riverStageDetail;
  const handleCruiseToggle = () => {
    if (!canCruise) {
      return;
    }

    setAutoCruise((current) => !current);
  };
  const handleCruiseJump = (direction: -1 | 1) => {
    if (!cruiseAnchorMoments.length) {
      return;
    }

    const currentIndex = activeCruiseAnchor
      ? cruiseAnchorMoments.findIndex((anchor) => anchor.id === activeCruiseAnchor.id)
      : -1;
    const fallbackIndex = direction > 0 ? 0 : cruiseAnchorMoments.length - 1;
    const baseIndex = currentIndex >= 0 ? currentIndex : fallbackIndex;
    const nextIndex = THREE.MathUtils.clamp(baseIndex + direction, 0, cruiseAnchorMoments.length - 1);
    const nextAnchor = cruiseAnchorMoments[nextIndex];

    if (!nextAnchor) {
      return;
    }

    setAutoCruise(false);
    setCruiseProgress(nextAnchor.progress);
  };
  useEffect(() => {
    if (!activeEraCruiseAnchor) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setCruiseProgress((current) => {
        const gap = Math.abs(current - activeEraCruiseAnchor.progress);

        if (gap < 0.01) {
          return activeEraCruiseAnchor.progress;
        }

        return THREE.MathUtils.lerp(current, activeEraCruiseAnchor.progress, 0.72);
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeEraCruiseAnchor]);

  useEffect(() => {
    if (previousEraRef.current === props.activeEra) {
      return;
    }

    previousEraRef.current = props.activeEra;
    setEraTransitionProgress(0);

    const start = performance.now();
    let frame = 0;
    const duration = 720;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setEraTransitionProgress(eased);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [props.activeEra]);

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

  return (
    <div
      ref={containerRef}
      onContextMenu={(event) => event.preventDefault()}
      className="relative h-full min-h-screen select-none overflow-hidden rounded-[32px] border border-[#cc9d49]/46 bg-[radial-gradient(circle_at_50%_38%,#fbf0c8_0%,#efd48e_20%,#d7a54f_50%,#925a1d_100%)] shadow-[0_0_140px_rgba(107,68,18,0.16)] [touch-action:none]"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-[linear-gradient(90deg,rgba(255,244,210,0.94),rgba(255,244,210,0.2),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-[linear-gradient(270deg,rgba(233,193,101,0.86),rgba(233,193,101,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 left-2 z-10 w-[4px] rounded-full bg-[linear-gradient(180deg,rgba(255,247,218,0.98),rgba(219,176,82,0.56),rgba(255,247,218,0.92))]" />
      <div className="pointer-events-none absolute inset-y-0 right-2 z-10 w-[4px] rounded-full bg-[linear-gradient(180deg,rgba(255,241,201,0.96),rgba(201,145,49,0.56),rgba(255,241,201,0.9))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-[linear-gradient(180deg,rgba(255,247,219,0.54),rgba(221,171,71,0.12),rgba(211,154,58,0))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-[linear-gradient(0deg,rgba(140,92,27,0.48),rgba(157,104,29,0.08),rgba(157,104,29,0))]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_44%,rgba(255,241,189,0.24),transparent_38%),radial-gradient(circle_at_50%_78%,rgba(112,68,18,0.14),transparent_34%),linear-gradient(90deg,rgba(250,228,160,0.1),transparent_14%,transparent_86%,rgba(250,228,160,0.1))]" />
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-35 [background-image:linear-gradient(rgba(132,86,28,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(132,86,28,0.05)_1px,transparent_1px)] [background-size:100%_42px,56px_100%]" />
      <div className="pointer-events-none absolute inset-0 z-[1] opacity-25 [background-image:radial-gradient(rgba(133,88,27,0.18)_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
      <ScrollRiverBackdrop
        activeEra={props.activeEra}
        traceFocus={props.traceFocus}
        sceneFocus={props.sceneFocus}
      />
      <Canvas
        dpr={[1, 1.8]}
        onPointerDown={() => {
          setAutoCruise(false);
          setIsInteracting(true);
        }}
        onPointerUp={() => setIsInteracting(false)}
        onPointerLeave={() => setIsInteracting(false)}
        className={isInteracting ? "cursor-grabbing [touch-action:none]" : "cursor-grab [touch-action:none]"}
      >
        <RiverWorld
          {...props}
          cruiseProgress={cruiseProgress}
          eraTransitionProgress={eraTransitionProgress}
          onInteractionStart={() => {
            setAutoCruise(false);
            setIsInteracting(true);
          }}
          onInteractionEnd={() => setIsInteracting(false)}
        />
      </Canvas>
      <div
        className={`pointer-events-none absolute bottom-3 right-3 z-20 hidden transition-all duration-500 sm:block sm:bottom-4 sm:right-4 ${
          props.mobilePanelOpen ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="pointer-events-auto w-[min(26rem,calc(100vw-3rem))] rounded-[20px] border border-[#e6c77f]/18 bg-[linear-gradient(180deg,rgba(88,56,18,0.68),rgba(48,30,8,0.78))] px-3 py-3 shadow-[0_14px_30px_rgba(53,31,7,0.16)] backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-amber-300/18 bg-amber-300/10 px-2.5 py-1 text-[10px] tracking-[0.24em] text-amber-100">
                  河势题签
                </span>
                <span className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.08)] px-2.5 py-1 text-[10px] text-[#f1e0b4]">
                  {props.activeEra}
                </span>
                <span className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.08)] px-2.5 py-1 text-[10px] text-[#f1e0b4]">
                  {riverStageModeLabel}
                </span>
                {(props.riverStageBadges ?? []).slice(0, 3).map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.08)] px-2.5 py-1 text-[10px] text-[#f1e0b4]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <div className="mt-2 line-clamp-2 text-[12px] font-medium leading-5 text-[#fbf3da]">
                {stageLead}
              </div>
              <div className="mt-1 line-clamp-2 text-[10px] leading-5 text-[#e8d7a9]">
                {stageDetail}
              </div>
              {!props.selectedBookSlug && activeCruiseAnchor ? (
                <div className="mt-2 text-[10px] text-[#dcbc7b]">
                  当前锚点 · {activeCruiseAnchor.label}
                  {activeCruiseAnchor.era ? ` · ${activeCruiseAnchor.era}` : ""}
                </div>
              ) : null}
            </div>
            <div className="flex w-[8.8rem] shrink-0 flex-wrap justify-end gap-1.5">
              {!props.selectedBookSlug && canCruise ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCruiseJump(-1)}
                    className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.06)] px-2.5 py-1 text-[10px] text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                  >
                    上一段
                  </button>
                  <button
                    type="button"
                    onClick={handleCruiseToggle}
                    className="rounded-full border border-amber-300/18 bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-50 transition hover:bg-amber-300/16"
                  >
                    {cruiseRunning ? "停舟" : "续航"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCruiseJump(1)}
                    className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.06)] px-2.5 py-1 text-[10px] text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                  >
                    下一段
                  </button>
                </>
              ) : null}
              {!props.selectedBookSlug && props.onOpenEraPanel ? (
                <button
                  type="button"
                  onClick={props.onOpenEraPanel}
                  className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.06)] px-2.5 py-1 text-[10px] text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                >
                  时代
                </button>
              ) : null}
              {!props.selectedBookSlug && props.onAdvanceEra ? (
                <button
                  type="button"
                  onClick={() => props.onAdvanceEra?.(-1)}
                  className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.06)] px-2.5 py-1 text-[10px] text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                >
                  前朝
                </button>
              ) : null}
              {!props.selectedBookSlug && props.onToggleEraPlayback ? (
                <button
                  type="button"
                  onClick={props.onToggleEraPlayback}
                  className="rounded-full border border-amber-300/18 bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-50 transition hover:bg-amber-300/16"
                >
                  {props.eraPlaybackActive ? "停演" : "顺演"}
                </button>
              ) : null}
              {!props.selectedBookSlug && props.onAdvanceEra ? (
                <button
                  type="button"
                  onClick={() => props.onAdvanceEra?.(1)}
                  className="rounded-full border border-[#e6c77f]/14 bg-[rgba(255,244,214,0.06)] px-2.5 py-1 text-[10px] text-[#fbf3da] transition hover:bg-[rgba(255,244,214,0.12)]"
                >
                  后朝
                </button>
              ) : null}
              {props.onOpenControlPanel ? (
                <button
                  type="button"
                  onClick={props.onOpenControlPanel}
                  className="rounded-full border border-amber-300/18 bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-50 transition hover:bg-amber-300/16"
                >
                  {props.selectedBookSlug ? "河册" : "来源"}
                </button>
              ) : null}
              {props.selectedBookSlug && props.onReturnToRiver ? (
                <button
                  type="button"
                  onClick={props.onReturnToRiver}
                  className="rounded-full border border-emerald-300/14 bg-emerald-300/8 px-2.5 py-1 text-[10px] text-emerald-100 transition hover:bg-emerald-300/14"
                >
                  归河巡看
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
