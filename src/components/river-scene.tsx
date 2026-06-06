"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { type ElementRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { TraceFocusState } from "@/components/book-explorer";
import type { BookNode, CitationEdge } from "@/types/domain";
import type { RiverEra, ViewMode } from "@/types/domain";

type OrbitControlsInstance = ElementRef<typeof OrbitControls>;

export interface RiverBranchAnnotation {
  id: string;
  label: string;
  description: string;
  targetSlug: string;
  accentColor: string;
  position: [number, number, number];
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
  hoveredBranchId?: string | null;
  onHoverBranch?: (branchId: string | null) => void;
  traceFocus?: TraceFocusState | null;
  visibleNodeCount?: number;
  totalNodeCount?: number;
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

function AtmosphereField() {
  const fieldRef = useRef<THREE.Group>(null);

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
        <meshBasicMaterial color="#164e63" transparent opacity={0.08} />
      </mesh>
      <mesh position={[8.7, 2.5, -6.5]} scale={[7.4, 3.4, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.05} />
      </mesh>
      <mesh position={[-1.8, 2.4, -5.8]} scale={[5.8, 2.6, 1]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.06} />
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
          color="#0b2320"
          emissive={new THREE.Color("#0f3c38")}
          emissiveIntensity={0.22}
          metalness={0.08}
          roughness={0.72}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.4, depth + 0.01, 0]}>
        <planeGeometry args={[span * 1.55, span * 1.16, 1, 1]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.03} />
      </mesh>
    </group>
  );
}

function RiverParticleStream({
  points,
  color,
  density = 180,
}: {
  points: THREE.Vector3[];
  color: string;
  density?: number;
}) {
  const particleRef = useRef<THREE.Points>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const positions = useMemo(() => {
    const values = new Float32Array(density * 3);

    for (let index = 0; index < density; index += 1) {
      const t = density === 1 ? 0 : index / (density - 1);
      const point = curve.getPointAt(t);
      values[index * 3] = point.x + (pseudoNoise(index + 1.37) - 0.5) * 0.12;
      values[index * 3 + 1] =
        point.y + (pseudoNoise(index * 2.13 + 4.2) - 0.5) * 0.12;
      values[index * 3 + 2] =
        point.z + (pseudoNoise(index * 0.73 + 9.4) - 0.5) * 0.12;
    }

    return values;
  }, [curve, density]);

  useFrame((state) => {
    if (!particleRef.current) {
      return;
    }

    particleRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.15;
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
  const eraOrder: RiverEra[] = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"];
  const activeIndex = eraOrder.indexOf(activeEra);
  const latestBooks = books
    .filter((book) => eraOrder.indexOf(book.dynasty) === activeIndex)
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
          <meshBasicMaterial color="#a7f3d0" transparent opacity={0.24} />
        </mesh>
      ))}
    </group>
  );
}

function BookMarkers({
  books,
  selectedBookSlug,
  onSelectBook,
  activeEra,
  traceFocus,
}: {
  books: BookNode[];
  selectedBookSlug: string;
  onSelectBook: (slug: string) => void;
  activeEra: RiverEra;
  traceFocus?: TraceFocusState | null;
}) {
  const eraOrder: RiverEra[] = ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"];
  const activeIndex = eraOrder.indexOf(activeEra);
  const traceTitleSet = useMemo(
    () => new Set(traceFocus?.titles ?? []),
    [traceFocus?.titles],
  );
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
        const bookEraIndex = eraOrder.indexOf(book.dynasty);
        const isNewestVisible = bookEraIndex === activeIndex;
        const isTraceLinked = traceTitleSet.has(book.title);
        const isTraceCurrent = traceFocus?.currentTitle === book.title;
        const markerColor = isTraceCurrent
          ? "#67e8f9"
          : isSelected
            ? "#fcd34d"
            : isTraceLinked
              ? "#bbf7d0"
              : "#d6fff6";
        const emissive = isTraceCurrent
          ? "#22d3ee"
          : isSelected
            ? "#f59e0b"
            : isTraceLinked
              ? "#34d399"
              : isNewestVisible
                ? "#a7f3d0"
                : "#6ee7b7";
        const markerSize = isTraceCurrent
          ? 0.25
          : isSelected
            ? 0.22
            : isTraceLinked
              ? 0.19
              : isNewestVisible
                ? 0.18
                : 0.16;

        return (
          <group key={book.id} position={book.coordinates}>
            <mesh onClick={() => onSelectBook(book.slug)}>
              <sphereGeometry args={[markerSize, 24, 24]} />
              <meshStandardMaterial
                color={markerColor}
                emissive={new THREE.Color(emissive)}
                emissiveIntensity={isTraceCurrent ? 1.7 : isTraceLinked ? 1.1 : isNewestVisible ? 1 : 0.8}
              />
            </mesh>
            {isTraceLinked ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <ringGeometry
                  args={[markerSize + 0.08, markerSize + (isTraceCurrent ? 0.2 : 0.15), 32]}
                />
                <meshBasicMaterial
                  color={isTraceCurrent ? "#67e8f9" : "#34d399"}
                  transparent
                  opacity={isTraceCurrent ? 0.65 : 0.28}
                />
              </mesh>
            ) : null}
            <Text
              position={[0, isTraceLinked ? 0.44 : 0.38, 0]}
              fontSize={isTraceCurrent ? 0.19 : 0.17}
              color={
                isTraceCurrent
                  ? "#cffafe"
                  : isSelected
                    ? "#fde68a"
                    : isTraceLinked
                      ? "#dcfce7"
                      : "#e7e5e4"
              }
              anchorX="center"
              anchorY="middle"
            >
              {isTraceCurrent
                ? `${book.shortTitle} · 当前溯源`
                : isTraceLinked
                  ? `${book.shortTitle} · 溯源链`
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
}: {
  books: BookNode[];
  citations: CitationEdge[];
}) {
  const bookMap = useMemo(
    () => new Map(books.map((book) => [book.id, book])),
    [books],
  );

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
        const color =
          citation.layer === "metadata"
            ? "#f8fafc"
            : citation.layer === "explicit"
              ? "#86efac"
              : citation.layer === "semantic"
                ? "#fde047"
                : "#cbd5e1";

        return (
          <Line
            key={citation.id}
            points={points}
            color={color}
            transparent
            opacity={0.65}
            lineWidth={1.2}
          />
        );
      })}
    </>
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
              color={isHovered || isSelected ? "#fef3c7" : "#cbd5e1"}
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

function RiverWorld({
  books,
  citations,
  selectedBookSlug,
  onSelectBook,
  activeEra,
  viewMode,
  cinematicState = "idle",
  branchAnnotations = [],
  hoveredBranchId,
  onHoverBranch,
  traceFocus,
}: RiverSceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const controlsRef = useRef<OrbitControlsInstance>(null);
  const desiredCameraPosition = useRef(new THREE.Vector3(3.5, 3.8, 11));
  const desiredCameraTarget = useRef(new THREE.Vector3(3.5, 0, 0));
  const initialControlsTarget = useMemo(() => new THREE.Vector3(3.5, 0, 0), []);
  const mainStream = useMemo(
    () =>
      books
        .filter((book) => book.branchLevel === 0)
        .sort((left, right) => left.year - right.year)
        .map((book) => new THREE.Vector3(...book.coordinates)),
    [books],
  );
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

  const branchStreams = useMemo(() => {
    return [1, 2].map((branchLevel) =>
      books
        .filter((book) => book.branchLevel === branchLevel)
        .sort((left, right) => left.year - right.year)
        .map((book) => new THREE.Vector3(...book.coordinates)),
    );
  }, [books]);
  useEffect(() => {
    const focusPoint = traceFocus?.active
      ? cameraTarget.clone()
      : selectedBookPosition ?? new THREE.Vector3(3.5, 0, 0);

    let nextTarget = new THREE.Vector3(3.5, 0, 0);
    let nextPosition = new THREE.Vector3(3.5, 3.8, 11);

    if (traceFocus?.active) {
      nextTarget = focusPoint;
      nextPosition = focusPoint.clone().add(new THREE.Vector3(1.65, 1.25, 3.2));
    } else if (cinematicState === "diving" && selectedBookPosition) {
      nextTarget = focusPoint.clone().add(new THREE.Vector3(0.18, 0.12, 0));
      nextPosition = focusPoint.clone().add(new THREE.Vector3(0.45, 3.2, 6.4));
    } else if ((viewMode === "book" || cinematicState === "settling") && selectedBookPosition) {
      nextTarget = focusPoint;
      nextPosition = focusPoint.clone().add(new THREE.Vector3(1.35, 1.6, 4.25));
    } else if (cinematicState === "returning") {
      nextTarget = new THREE.Vector3(3.5, 0.15, 0);
      nextPosition = new THREE.Vector3(4.5, 5.3, 13.4);
    }

    desiredCameraPosition.current.copy(nextPosition);
    desiredCameraTarget.current.copy(nextTarget);
  }, [cameraTarget, cinematicState, selectedBookPosition, traceFocus, viewMode]);

  useFrame((_, delta) => {
    if (!cameraRef.current) {
      return;
    }

    const positionEase =
      traceFocus?.active ? 5.6 : cinematicState === "diving" ? 6.8 : cinematicState === "returning" ? 4.8 : 3.8;
    const targetEase =
      traceFocus?.active ? 6.2 : cinematicState === "diving" ? 7.4 : cinematicState === "returning" ? 5 : 4.2;
    const positionAlpha = 1 - Math.exp(-positionEase * delta);
    const targetAlpha = 1 - Math.exp(-targetEase * delta);

    cameraRef.current.position.lerp(desiredCameraPosition.current, positionAlpha);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(desiredCameraTarget.current, targetAlpha);
      controlsRef.current.update();
    } else {
      cameraRef.current.lookAt(desiredCameraTarget.current);
    }
  });

  return (
    <>
      <color attach="background" args={["#091110"]} />
      <fog attach="fog" args={["#091110", 8, 22]} />
      <PerspectiveCamera ref={cameraRef} makeDefault position={[3.5, 3.8, 11]} fov={42} />
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 8, 6]} intensity={1.8} color="#fff7d6" />
      <pointLight position={[-6, 4, -2]} intensity={1.5} color="#7dd3fc" />
      <pointLight position={[9, 3, -4]} intensity={1.2} color="#f59e0b" />
      <spotLight
        position={[2.5, 8, 8]}
        angle={0.38}
        penumbra={0.7}
        intensity={2.4}
        color="#d9f99d"
      />

      <AtmosphereField />
      <RiverBed />

      {mainStream.length >= 2 ? (
        <>
          <RiverRibbon
            points={mainStream}
            width={0.21}
            color="#14b8a6"
            glow="#67e8f9"
            animated
          />
          <RiverParticleStream points={mainStream} color="#cffafe" density={220} />
        </>
      ) : null}

      {branchStreams.map((stream, index) =>
        stream.length >= 2 ? (
          <group key={`branch-${index}`}>
            <RiverRibbon
              points={stream}
              width={0.12 - index * 0.02}
              color={index === 0 ? "#10b981" : "#f59e0b"}
              glow={index === 0 ? "#bbf7d0" : "#fde68a"}
            />
            <RiverParticleStream
              points={stream}
              color={index === 0 ? "#dcfce7" : "#fef3c7"}
              density={index === 0 ? 150 : 120}
            />
          </group>
        ) : null,
      )}

      <FlowBeacons books={books} activeEra={activeEra} />
      {tracePathPoints.length >= 2 ? (
        <group>
          <Line
            points={tracePathPoints}
            color="#67e8f9"
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

      <CitationArcs books={books} citations={citations} />
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
        traceFocus={traceFocus}
      />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        maxDistance={16}
        minDistance={6}
        maxPolarAngle={Math.PI / 2.1}
        enableRotate={cinematicState === "idle"}
        enableZoom={cinematicState === "idle" || Boolean(traceFocus?.active)}
        target={initialControlsTarget}
      />
    </>
  );
}

export function RiverScene(props: RiverSceneProps) {
  const eraProgress = props.activeEra
    ? ["先秦", "两汉", "魏晋", "隋唐", "宋元", "明清", "近现代"].indexOf(props.activeEra) / 6
    : 0;
  const visibilityRatio =
    props.totalNodeCount && props.totalNodeCount > 0
      ? (props.visibleNodeCount ?? 0) / props.totalNodeCount
      : 0;

  return (
    <div className="relative h-full min-h-screen overflow-hidden rounded-[32px] border border-white/10 bg-[#091110] shadow-[0_0_80px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-[linear-gradient(180deg,rgba(3,8,8,0.72),rgba(3,8,8,0))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-[linear-gradient(0deg,rgba(3,8,8,0.88),rgba(3,8,8,0))]" />
      <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-stone-300">
        Fly Over The Vein
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-10 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] text-stone-300">
        {props.traceFocus?.active
          ? `溯源联动 ${props.traceFocus.progress}/${props.traceFocus.total}`
          : props.cinematicState === "diving"
            ? "镜头俯冲中"
            : props.cinematicState === "returning"
              ? "镜头拉回中"
              : `${props.activeEra} 水位`}
      </div>
      <div className="pointer-events-none absolute left-5 top-20 z-10 max-w-[320px] rounded-[24px] border border-white/10 bg-black/18 px-4 py-3 text-sm text-stone-300 backdrop-blur-md">
        <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
          River State
        </div>
        <div className="mt-2 leading-6">
          {props.traceFocus?.active
            ? `镜头正沿着 ${props.traceFocus.currentTitle ?? "当前节点"} 的溯源链逆流而上。`
            : props.cinematicState === "diving"
              ? "镜头正在切入典籍局部脉络。"
              : props.cinematicState === "returning"
                ? "镜头正在回到整条河流的总览。"
                : "拖拽旋转河流，点击节点或支流标注即可进入细部。"}
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-stone-500">
              <span>Era Fill</span>
              <span>{Math.round(eraProgress * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#67e8f9)]"
                style={{ width: `${Math.max(10, eraProgress * 100)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-stone-500">
              <span>Visible Basin</span>
              <span>{Math.round(visibilityRatio * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#bbf7d0)]"
                style={{ width: `${Math.max(8, visibilityRatio * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute left-5 bottom-5 z-10 rounded-[24px] border border-white/10 bg-black/18 px-4 py-3 text-[11px] text-stone-300 backdrop-blur-md">
        <div className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
          Basin Scan
        </div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <div>
            <div className="text-stone-500">节点</div>
            <div className="mt-1 text-sm text-stone-100">{props.visibleNodeCount ?? 0}</div>
          </div>
          <div>
            <div className="text-stone-500">总量</div>
            <div className="mt-1 text-sm text-stone-100">{props.totalNodeCount ?? 0}</div>
          </div>
          <div>
            <div className="text-stone-500">模式</div>
            <div className="mt-1 text-sm text-stone-100">
              {props.traceFocus?.active ? "逆流" : props.viewMode === "book" ? "钻入" : "巡航"}
            </div>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute right-5 bottom-5 z-10 flex max-w-[520px] flex-wrap justify-end gap-2 text-[11px] text-stone-300">
        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
          支流标注可直接跳转
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          白色 元数据
        </span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-100">
          绿色 显式引用
        </span>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-100">
          黄色 语义关联
        </span>
        <span className="rounded-full border border-slate-300/20 bg-slate-300/10 px-3 py-1 text-slate-100">
          灰色 间接影响
        </span>
      </div>
      <Canvas dpr={[1, 1.8]}>
        <RiverWorld {...props} />
      </Canvas>
    </div>
  );
}
