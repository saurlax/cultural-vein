"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { BookNode, CitationEdge } from "@/types/domain";

interface RiverSceneProps {
  books: BookNode[];
  citations: CitationEdge[];
  selectedBookSlug: string;
  onSelectBook: (slug: string) => void;
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
}: {
  points: THREE.Vector3[];
  color: string;
}) {
  const particleRef = useRef<THREE.Points>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const positions = useMemo(() => {
    const values = new Float32Array(180 * 3);

    for (let index = 0; index < 180; index += 1) {
      const t = index / 179;
      const point = curve.getPointAt(t);
      values[index * 3] = point.x + (pseudoNoise(index + 1.37) - 0.5) * 0.12;
      values[index * 3 + 1] =
        point.y + (pseudoNoise(index * 2.13 + 4.2) - 0.5) * 0.12;
      values[index * 3 + 2] =
        point.z + (pseudoNoise(index * 0.73 + 9.4) - 0.5) * 0.12;
    }

    return values;
  }, [curve]);

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
}: {
  books: BookNode[];
  selectedBookSlug: string;
  onSelectBook: (slug: string) => void;
}) {
  return (
    <>
      {books.map((book) => {
        const isSelected = book.slug === selectedBookSlug;
        const markerColor = isSelected ? "#fcd34d" : "#d6fff6";
        const emissive = isSelected ? "#f59e0b" : "#6ee7b7";

        return (
          <group key={book.id} position={book.coordinates}>
            <mesh onClick={() => onSelectBook(book.slug)}>
              <sphereGeometry args={[isSelected ? 0.22 : 0.16, 24, 24]} />
              <meshStandardMaterial
                color={markerColor}
                emissive={new THREE.Color(emissive)}
                emissiveIntensity={0.8}
              />
            </mesh>
            <Text
              position={[0, 0.38, 0]}
              fontSize={0.17}
              color={isSelected ? "#fde68a" : "#e7e5e4"}
              anchorX="center"
              anchorY="middle"
            >
              {book.shortTitle}
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

function RiverWorld({
  books,
  citations,
  selectedBookSlug,
  onSelectBook,
}: RiverSceneProps) {
  const mainStream = useMemo(
    () =>
      books
        .filter((book) => book.branchLevel === 0)
        .sort((left, right) => left.year - right.year)
        .map((book) => new THREE.Vector3(...book.coordinates)),
    [books],
  );

  const branchStreams = useMemo(() => {
    return [1, 2].map((branchLevel) =>
      books
        .filter((book) => book.branchLevel === branchLevel)
        .sort((left, right) => left.year - right.year)
        .map((book) => new THREE.Vector3(...book.coordinates)),
    );
  }, [books]);

  return (
    <>
      <color attach="background" args={["#091110"]} />
      <fog attach="fog" args={["#091110", 8, 22]} />
      <PerspectiveCamera makeDefault position={[3.5, 3.8, 11]} fov={42} />
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
          <RiverParticleStream points={mainStream} color="#cffafe" />
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
            />
          </group>
        ) : null,
      )}

      <CitationArcs books={books} citations={citations} />
      <BookMarkers
        books={books}
        selectedBookSlug={selectedBookSlug}
        onSelectBook={onSelectBook}
      />
      <OrbitControls
        enablePan={false}
        maxDistance={16}
        minDistance={6}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export function RiverScene(props: RiverSceneProps) {
  return (
    <div className="relative h-[480px] overflow-hidden rounded-[28px] border border-white/10 bg-[#091110]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 text-xs tracking-[0.24em] text-stone-300">
        <span>Fly Over The Vein</span>
        <span>拖拽旋转 · 点击节点钻入</span>
      </div>
      <Canvas dpr={[1, 1.8]}>
        <RiverWorld {...props} />
      </Canvas>
    </div>
  );
}
