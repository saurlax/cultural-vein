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
const touchModeLabel = "单指拖移河面 · 双指缩放并旋看";

export interface RiverBranchAnnotation {
  id: string;
  label: string;
  description: string;
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

interface RiverRibbonProps {
  points: THREE.Vector3[];
  width: number;
  color: string;
  glow: string;
  animated?: boolean;
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
          opacity={0.85}
          roughness={0.22}
          metalness={0.08}
          emissive={new THREE.Color(glow)}
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh geometry={geometry} scale={[1.02, 1.02, 1.02]}>
        <meshBasicMaterial color={glow} transparent opacity={0.08} />
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
          color="#352313"
          emissive={new THREE.Color("#6b4b1d")}
          emissiveIntensity={0.22}
          metalness={0.08}
          roughness={0.72}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.4, depth + 0.01, 0]}>
        <planeGeometry args={[span * 1.55, span * 1.16, 1, 1]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.04} />
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
      <mesh rotation={[-Math.PI / 2.08, 0, 0.11]} position={[3.2, -0.96, 3.45]}>
        <planeGeometry args={[21.5, 6.8, 1, 1]} />
        <meshStandardMaterial
          color="#5b3b17"
          emissive={new THREE.Color("#8b5a21")}
          emissiveIntensity={0.16}
          roughness={0.94}
          metalness={0.02}
          transparent
          opacity={0.98}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2.06, 0, -0.09]} position={[3.5, -0.98, -3.55]}>
        <planeGeometry args={[22.8, 7.6, 1, 1]} />
        <meshStandardMaterial
          color="#4a2f14"
          emissive={new THREE.Color("#7b4b18")}
          emissiveIntensity={0.14}
          roughness={0.95}
          metalness={0.02}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.35, -0.9, 4.45]}>
        <planeGeometry args={[18.5, 1.4, 1, 1]} />
        <meshBasicMaterial color="#e2bd73" transparent opacity={0.07} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.55, -0.92, -4.6]}>
        <planeGeometry args={[19.4, 1.6, 1, 1]} />
        <meshBasicMaterial color="#d6a54a" transparent opacity={0.06} />
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
    ],
    [],
  );

  return (
    <group>
      {contourPaths.map((points, index) => (
        <Line
          key={`scroll-contour-${index}`}
          points={points}
          color={index === 1 ? "#b88a34" : "#d7b567"}
          transparent
          opacity={index === 2 ? 0.18 : 0.24}
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
      <mesh position={[2.6, 0.32, -5.4]} scale={[11.6, 2.3, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#f3d58b" transparent opacity={0.045} />
      </mesh>
      <mesh position={[8.4, 0.5, -4.9]} scale={[8.8, 1.9, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#fde7b0" transparent opacity={0.04} />
      </mesh>
      <mesh position={[-1.6, 0.68, -4.2]} scale={[7.4, 1.6, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#e7bf63" transparent opacity={0.034} />
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
              : isNewestVisible
                ? 0.18
                : shouldDim
                  ? 0.12
                  : 0.16;

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
                    ? 0.22
                    : isHovered || isSearchHighlighted
                      ? 1
                      : shouldUseCruiseReveal
                        ? 0.24 + revealBlend * 0.74
                        : 0.94
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
                        : shouldUseCruiseReveal
                          ? 0.5 + revealBlend * 0.92
                        : isNewestVisible
                          ? 1
                          : 0.8
                }
              />
            </mesh>
            {isTraceLinked || isSearchHighlighted || isHovered || isSelected ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <ringGeometry
                  args={[markerSize + 0.08, markerSize + (isTraceCurrent ? 0.2 : isHovered ? 0.18 : 0.15), 32]}
                />
                <meshBasicMaterial
                  color={
                    isTraceCurrent
                      ? "#fbbf24"
                      : isHovered
                        ? "#fde68a"
                        : isSearchHighlighted
                          ? "#fde68a"
                          : "#f59e0b"
                  }
                  transparent
                  opacity={isTraceCurrent ? 0.65 : isHovered ? 0.52 : isSearchHighlighted ? 0.4 : 0.28}
                />
              </mesh>
            ) : null}
            <Text
              position={[0, isTraceLinked || isSearchHighlighted || isHovered ? 0.46 : 0.38, 0]}
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
                    : shouldUseCruiseReveal && revealBlend > 0.78
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
}: {
  annotations: RiverBranchAnnotation[];
  selectedBookSlug: string;
  onSelectBook: (slug: string) => void;
  hoveredBranchId?: string | null;
  onHoverBranch?: (branchId: string | null) => void;
}) {
  const branchRef = useRef<THREE.Group>(null);

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

        return (
          <group key={annotation.id} position={annotation.position}>
            <mesh
              onClick={() => onSelectBook(annotation.targetSlug)}
              onPointerOver={() => onHoverBranch?.(annotation.id)}
              onPointerOut={() => onHoverBranch?.(null)}
            >
              <sphereGeometry args={[isHovered || isSelected ? 0.14 : 0.11, 18, 18]} />
              <meshStandardMaterial
                color={isSelected ? "#fde68a" : annotation.accentColor}
                emissive={new THREE.Color(annotation.accentColor)}
                emissiveIntensity={isHovered ? 1.5 : 1.1}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
              <ringGeometry args={[0.18, isHovered || isSelected ? 0.31 : 0.27, 40]} />
              <meshBasicMaterial
                color={annotation.accentColor}
                transparent
                opacity={isHovered || isSelected ? 0.75 : 0.42}
              />
            </mesh>
            <Text
              position={[0, 0.3, 0]}
              fontSize={0.12}
              maxWidth={1.6}
              color={isHovered || isSelected ? "#fef3c7" : "#e7e5e4"}
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
      books.find((book) => book.slug === selectedBookSlug);

    return traceCurrentBook
      ? new THREE.Vector3(...traceCurrentBook.coordinates)
      : new THREE.Vector3(3.5, 0, 0);
  }, [books, selectedBookSlug, traceFocus?.currentTitle]);
  const selectedBookPosition = useMemo(() => {
    const selectedBook = books.find((book) => book.slug === selectedBookSlug);
    return selectedBook
      ? new THREE.Vector3(...selectedBook.coordinates)
      : null;
  }, [books, selectedBookSlug]);
  const selectedBookNode = useMemo(
    () => books.find((book) => book.slug === selectedBookSlug) ?? null,
    [books, selectedBookSlug],
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
  const sourceAtlasFlowPoints = useMemo(
    () => sourceAtlasPathPoints.map((point) => new THREE.Vector3(...point)),
    [sourceAtlasPathPoints],
  );
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
            width={0.16 + mainStreamStats.averageInfluence / 420}
            color="#b45309"
            glow="#fbbf24"
            animated
          />
          <RiverParticleStream
            points={mainStream}
            color="#fde68a"
            density={180 + Math.round(mainStreamStats.averageInfluence * 0.9)}
            flowSpeed={0.045 + mainStreamStats.averageVelocity * 0.18}
            spread={0.1}
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
                  0.08 + branchStreamStats[index]!.averageInfluence / 520 - index * 0.012,
                )
              }
              color={index === 0 ? "#d97706" : "#92400e"}
              glow={index === 0 ? "#fcd34d" : "#fef3c7"}
            />
            <RiverParticleStream
              points={stream}
              color={index === 0 ? "#fde68a" : "#fef3c7"}
              density={Math.round(
                (index === 0 ? 120 : 92) + branchStreamStats[index]!.averageInfluence * 0.56,
              )}
              flowSpeed={0.05 + branchStreamStats[index]!.averageVelocity * 0.2}
              spread={0.09}
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
  const [eventSource, setEventSource] = useState<HTMLElement | null>(null);
  const [cruiseProgress, setCruiseProgress] = useState(0.1);
  const [autoCruise, setAutoCruise] = useState(true);
  const [isInteracting, setIsInteracting] = useState(false);
  const [showMobileTouchHint, setShowMobileTouchHint] = useState(true);
  const canCruise =
    props.viewMode === "river" && !props.traceFocus?.active && !props.sceneFocus?.active;
  const cruiseRunning = canCruise && autoCruise;
  const mobilePanelOpen = props.mobilePanelOpen ?? false;
  const hoveredBook = props.books.find((book) => book.slug === props.hoveredBookSlug) ?? null;
  const hoveredDock = props.dockMarkers?.find((dock) => dock.id === props.hoveredDockId) ?? null;
  const hoveredBranch = props.branchAnnotations?.find(
    (annotation) => annotation.id === props.hoveredBranchId,
  ) ?? null;
  const sceneHint = props.traceFocus?.active
    ? `逆流正经过 ${props.traceFocus.currentTitle ?? "此处节点"}，沿链回看文脉源头。`
    : props.sceneFocus?.active
      ? props.sceneFocus.detail
      : isInteracting
        ? "长河正在掌中转景，松手后可继续点选典籍与码头。"
      : hoveredDock
        ? `${hoveredDock.label} 正从河面浮起。${hoveredDock.note ? ` ${hoveredDock.note}` : ""}`
      : props.sourceAtlasLabel && props.dockMarkers?.length
        ? `${props.sourceAtlasLabel} 的样本已映入河道，可沿码头顺流检阅。${props.sourceAtlasSummary ? ` ${props.sourceAtlasSummary}` : ""}`
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
    setEventSource(containerRef.current);
  }, []);

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

    const cruiseAnchors = [0.12, 0.24, 0.38, 0.54, 0.71, 0.86];
    const timer = window.setInterval(() => {
      setCruiseProgress((current) => {
        const slowFactor = cruiseAnchors.reduce((factor, anchor) => {
          const distance = Math.abs(current - anchor);

          if (distance > 0.06) {
            return factor;
          }

          const easing = 1 - distance / 0.06;
          return Math.min(factor, 1 - easing * 0.55);
        }, 1);
        const next = current + 0.0065 * slowFactor;
        return next >= 0.99 ? 0.04 : next;
      });
    }, 120);

    return () => window.clearInterval(timer);
  }, [cruiseRunning]);

  const nudgeCruise = (delta: number) => {
    setCruiseProgress((current) => THREE.MathUtils.clamp(current + delta, 0.02, 0.98));
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(event) => event.preventDefault()}
      className="relative h-full min-h-screen select-none overflow-hidden rounded-[32px] border border-[#edd08a]/45 bg-[#3a2208] shadow-[0_0_80px_rgba(0,0,0,0.42)] [touch-action:none]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-[linear-gradient(180deg,rgba(146,102,36,0.4),rgba(78,51,15,0))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-[linear-gradient(0deg,rgba(44,26,8,0.74),rgba(44,26,8,0))]" />
      <div className="pointer-events-none absolute left-4 top-4 z-10 hidden max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-[#ead8a6]/22 bg-[rgba(113,75,24,0.52)] px-4 py-2 text-[10px] text-[#f7edd1] sm:left-5 sm:top-5 sm:flex sm:max-w-none sm:text-[11px]">
        <span className="tracking-[0.28em] text-[#fff0c2]">黄河文脉长卷</span>
        <span className="hidden h-3 w-px bg-[#ead8a6]/24 sm:block" />
        <span className="truncate text-[#f1e3bd]">
          {props.traceFocus?.active
            ? `溯源联动 ${props.traceFocus.progress}/${props.traceFocus.total}`
            : props.sceneFocus?.active
              ? props.sceneFocus.contextLabel
              : props.cinematicState === "diving"
                ? "镜头俯冲中"
                : props.cinematicState === "returning"
                  ? "镜头拉回中"
                  : `${props.activeEra} 水位`}
        </span>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-16 z-10 hidden w-[min(420px,calc(100vw-2.5rem))] -translate-x-1/2 px-3 lg:block lg:top-20">
        <div className="rounded-[26px] border border-[#f2dfab]/18 bg-[linear-gradient(180deg,rgba(115,78,27,0.78),rgba(70,45,14,0.72))] px-5 py-3 text-center shadow-lg shadow-black/20 backdrop-blur-md">
          <div className="text-[10px] tracking-[0.34em] text-[#f4e2b0]">卷首题签</div>
          <div className="mt-2 text-[11px] leading-6 text-[#fbf1d2] sm:text-xs">
            {sceneHint}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute left-4 top-16 z-10 hidden rounded-full border border-[#ead8a6]/16 bg-[rgba(79,52,16,0.42)] px-4 py-2 text-[10px] tracking-[0.22em] text-[#f3e5be] backdrop-blur-md xl:flex">
        {isInteracting ? "正在拖动画卷" : "拖移河面巡看文脉"}
      </div>
      <div
        className={`pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2 transition-all duration-500 md:hidden ${
          showMobileTouchHint || isInteracting ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="rounded-full border border-[#ead8a6]/18 bg-[rgba(79,52,16,0.5)] px-3 py-1.5 text-[10px] text-[#f6e8bd] backdrop-blur-md">
          {isInteracting ? "正在拖移河面" : touchModeLabel}
        </div>
      </div>
      {canCruise ? (
        <div
          className={`absolute bottom-4 left-1/2 z-20 w-[min(240px,calc(100vw-2.5rem))] -translate-x-1/2 transition-opacity duration-300 sm:bottom-5 sm:left-auto sm:right-5 sm:w-[min(300px,calc(100vw-2.5rem))] sm:translate-x-0 ${
            mobilePanelOpen ? "pointer-events-none opacity-0 sm:pointer-events-auto sm:opacity-100" : ""
          }`}
        >
          <div className="pointer-events-auto rounded-[26px] border border-[#ead8a6]/18 bg-[linear-gradient(180deg,rgba(92,61,19,0.82),rgba(66,42,12,0.82))] px-4 py-3 text-[#f1e2bb] shadow-xl shadow-black/20 backdrop-blur-md sm:px-4 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-[0.26em] text-[#e5d1a1]">巡河题签</div>
                <div className="mt-1 text-xs text-[#fbf3da] sm:text-sm">
                  从上游缓缓入画
                </div>
                <div className="mt-2 hidden text-[10px] leading-5 text-[#e8d6aa] sm:block">
                  让镜头顺着黄河文脉徐徐铺展，再停到要讲的节点附近。
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoCruise((current) => !current)}
                className={`rounded-full px-3 py-2 text-xs transition ${
                  cruiseRunning
                    ? "bg-[#f3dfab] text-[#42290a]"
                    : "border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] text-[#eadfbc] hover:bg-[rgba(255,248,220,0.1)]"
                }`}
              >
                {cruiseRunning ? "暂停巡航" : "自动巡航"}
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
                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-2 text-[11px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
              >
                回溯上游
              </button>
              <button
                type="button"
                onClick={() => nudgeCruise(0.08)}
                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-2 text-[11px] text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
              >
                顺流下看
              </button>
            </div>
            <div className="mt-3 hidden flex-wrap gap-2 text-[10px] sm:flex">
              <button
                type="button"
                onClick={() => props.onOpenControlPanel?.()}
                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
              >
                打开河上题签
              </button>
              <button
                type="button"
                onClick={() => props.onOpenEraPanel?.()}
                className="rounded-full border border-[#ead8a6]/18 bg-[rgba(255,248,220,0.05)] px-3 py-1.5 text-[#eadfbc] transition hover:bg-[rgba(255,248,220,0.1)]"
              >
                改看别的时代
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Canvas
        dpr={[1, 1.8]}
        eventSource={eventSource ?? undefined}
        eventPrefix="client"
        className={isInteracting ? "cursor-grabbing touch-none" : "cursor-grab touch-none"}
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
