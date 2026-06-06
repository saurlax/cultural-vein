"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { TraceFocusState } from "@/components/book-explorer";
import type { BookNode, CitationEdge } from "@/types/domain";
import type { RiverEra } from "@/types/domain";

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
  branchAnnotations?: RiverBranchAnnotation[];
  hoveredBranchId?: string | null;
  onHoverBranch?: (branchId: string | null) => void;
  traceFocus?: TraceFocusState | null;
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

  return (
    <>
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
              position={[0, 0.38, 0]}
              fontSize={0.17}
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
    </>
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
  return (
    <>
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
    </>
  );
}

function RiverWorld({
  books,
  citations,
  selectedBookSlug,
  onSelectBook,
  activeEra,
  branchAnnotations = [],
  hoveredBranchId,
  onHoverBranch,
  traceFocus,
}: RiverSceneProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
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

  const branchStreams = useMemo(() => {
    return [1, 2].map((branchLevel) =>
      books
        .filter((book) => book.branchLevel === branchLevel)
        .sort((left, right) => left.year - right.year)
        .map((book) => new THREE.Vector3(...book.coordinates)),
    );
  }, [books]);

  useEffect(() => {
    if (!cameraRef.current) {
      return;
    }

    const focusBook =
      books.find((book) => book.title === traceFocus?.currentTitle) ??
      books.find((book) => book.slug === selectedBookSlug);
    const nextPosition =
      traceFocus?.active && focusBook
        ? new THREE.Vector3(...focusBook.coordinates).add(new THREE.Vector3(1.65, 1.25, 3.2))
        : new THREE.Vector3(3.5, 3.8, 11);

    cameraRef.current.position.copy(nextPosition);
    cameraRef.current.lookAt(cameraTarget);
  }, [books, cameraTarget, selectedBookSlug, traceFocus]);

  return (
    <>
      <color attach="background" args={["#091110"]} />
      <fog attach="fog" args={["#091110", 8, 22]} />
      <PerspectiveCamera ref={cameraRef} makeDefault position={[3.5, 3.8, 11]} fov={42} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 8, 6]} intensity={1.8} color="#fff7d6" />
      <pointLight position={[-6, 4, -2]} intensity={1.5} color="#7dd3fc" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <circleGeometry args={[18, 80]} />
        <meshBasicMaterial color="#07100f" transparent opacity={0.9} />
      </mesh>

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
        enablePan={false}
        maxDistance={16}
        minDistance={6}
        maxPolarAngle={Math.PI / 2.1}
        target={cameraTarget}
      />
    </>
  );
}

export function RiverScene(props: RiverSceneProps) {
  return (
    <div className="relative h-[480px] overflow-hidden rounded-[28px] border border-white/10 bg-[#091110]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 text-xs tracking-[0.24em] text-stone-300">
        <span>Fly Over The Vein</span>
        <span>
          {props.traceFocus?.active
            ? `溯源联动 ${props.traceFocus.progress}/${props.traceFocus.total} · ${props.traceFocus.currentTitle ?? "当前节点"}`
            : `${props.activeEra} · 拖拽旋转 · 点击节点钻入`}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-center gap-2 px-5 py-4 text-[11px] text-stone-300">
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">
          关系图例
        </span>
        <span className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-cyan-100">
          分支标注 = 悬停查看说明 / 点击直达典籍
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          白色 = 元数据
        </span>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-100">
          绿色 = 显式引用
        </span>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-amber-100">
          黄色 = 语义关联
        </span>
        <span className="rounded-full border border-slate-300/20 bg-slate-300/10 px-3 py-1 text-slate-100">
          灰色 = 间接影响
        </span>
      </div>
      <Canvas dpr={[1, 1.8]}>
        <RiverWorld {...props} />
      </Canvas>
    </div>
  );
}
