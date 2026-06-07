"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { BookDetail, PlaceNode } from "@/types/domain";

type SpreadSegment = BookDetail["spread"][number];

interface SpreadGlobeProps {
  places: PlaceNode[];
  spreads: SpreadSegment[];
  activeSpreadId?: string | null;
  highlightedSpreadIds?: string[];
  activePlaceIds?: string[];
  settledPlaceIds?: string[];
  stageLabel?: string;
  stageDetail?: string;
  onSelectSpread?: (spreadId: string) => void;
}

function FlowArc({
  points,
  spreadId,
  phase,
  flowStrength,
  onSelect,
}: {
  points: THREE.Vector3[];
  spreadId: string;
  phase: "active" | "settled" | "idle";
  flowStrength: number;
  onSelect?: (spreadId: string) => void;
}) {
  const particlesRef = useRef<THREE.Group>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);
  const particleOffsets = useMemo(() => [0.08, 0.3, 0.52, 0.74, 0.9], []);
  const isActive = phase === "active";
  const isSettled = phase === "settled";
  const lineColor = isActive ? "#fde68a" : isSettled ? "#f6c453" : "#f59e0b";
  const lineOpacity = isActive ? 0.95 : isSettled ? 0.64 : 0.22;
  const lineWidth = isActive ? 2.4 : isSettled ? 1.8 : 1;
  const particleOpacity = isActive ? 0.95 : isSettled ? 0.76 : 0.34;
  const particleScale = isActive ? 1.1 : isSettled ? 0.98 : 0.88;

  useFrame((state) => {
    if (!particlesRef.current) {
      return;
    }

    particlesRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const speed = (isActive ? 0.035 : isSettled ? 0.024 : 0.014) + flowStrength / 2400;
      const t = (state.clock.elapsedTime * speed + particleOffsets[index]!) % 1;
      const point = curve.getPointAt(t);
      mesh.position.copy(point);
      const scale = particleScale + (isActive ? Math.sin(state.clock.elapsedTime * 3 + index) * 0.12 : 0);
      mesh.scale.setScalar(scale);
    });
  });

  return (
    <group>
      <Line
        points={points}
        color={lineColor}
        transparent
        opacity={lineOpacity}
        lineWidth={lineWidth}
        onClick={() => onSelect?.(spreadId)}
      />
      <group ref={particlesRef}>
        {particleOffsets.map((offset, index) => {
          const point = curve.getPointAt(offset);
          return (
            <mesh key={`${spreadId}-particle-${index}`} position={point} onClick={() => onSelect?.(spreadId)}>
              <sphereGeometry args={[isActive ? 0.055 : 0.04, 10, 10]} />
              <meshBasicMaterial
                color={isActive ? "#fff7d6" : isSettled ? "#fde68a" : "#f6c453"}
                transparent
                opacity={particleOpacity}
              />
            </mesh>
          );
        })}
      </group>
      <mesh position={points[points.length - 1] ?? [0, 0, 0]} onClick={() => onSelect?.(spreadId)}>
        <coneGeometry args={[0.06, 0.18, 10]} />
        <meshBasicMaterial color={lineColor} transparent opacity={isActive ? 1 : isSettled ? 0.82 : 0.4} />
      </mesh>
    </group>
  );
}

function latLngToVector(lat: number, lng: number, radius = 2.4) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function SpreadGlobeScene({
  places,
  spreads,
  activeSpreadId,
  highlightedSpreadIds = [],
  activePlaceIds = [],
  settledPlaceIds = [],
  onSelectSpread,
}: SpreadGlobeProps) {
  const globeRef = useRef<THREE.Group>(null);
  const placeMap = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const activePlaceIdSet = useMemo(() => new Set(activePlaceIds), [activePlaceIds]);
  const settledPlaceIdSet = useMemo(() => new Set(settledPlaceIds), [settledPlaceIds]);
  const highlightedSpreadIdSet = useMemo(
    () => new Set(highlightedSpreadIds.filter((id) => id !== activeSpreadId)),
    [activeSpreadId, highlightedSpreadIds],
  );

  useFrame((state) => {
    if (!globeRef.current) {
      return;
    }

    globeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
  });

  return (
    <>
      <color attach="background" args={["#120b05"]} />
      <fog attach="fog" args={["#120b05", 5.5, 11]} />
      <PerspectiveCamera makeDefault position={[0, 0.8, 6.6]} fov={34} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[4, 5, 6]} intensity={1.8} color="#fff4d0" />
      <pointLight position={[-4, -2, 3]} intensity={1.1} color="#f59e0b" />

      <group ref={globeRef}>
        <mesh>
          <sphereGeometry args={[2.4, 48, 48]} />
          <meshStandardMaterial
            color="#3b2a18"
            emissive={new THREE.Color("#7c5a1f")}
            emissiveIntensity={0.24}
            roughness={0.88}
            metalness={0.04}
          />
        </mesh>
        <mesh scale={[1.05, 1.05, 1.05]}>
          <sphereGeometry args={[2.4, 48, 48]} />
          <meshBasicMaterial color="#fcd34d" transparent opacity={0.05} />
        </mesh>

        {spreads.map((spread) => {
          const fromPlace = placeMap.get(spread.fromPlaceId);
          const toPlace = placeMap.get(spread.toPlaceId);

          if (!fromPlace || !toPlace) {
            return null;
          }

          const from = latLngToVector(fromPlace.lat, fromPlace.lng);
          const to = latLngToVector(toPlace.lat, toPlace.lng);
          const mid = from
            .clone()
            .lerp(to, 0.5)
            .normalize()
            .multiplyScalar(3 + spread.volume / 110);
          const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
          const points = curve.getPoints(48);
          const phase =
            spread.id === activeSpreadId
              ? "active"
              : highlightedSpreadIdSet.has(spread.id)
                ? "settled"
                : "idle";
          const isActive = phase === "active";

          return (
            <group key={spread.id}>
              <FlowArc
                points={points}
                spreadId={spread.id}
                phase={phase}
                flowStrength={spread.volume}
                onSelect={onSelectSpread}
              />
              <mesh position={mid} onClick={() => onSelectSpread?.(spread.id)}>
                <sphereGeometry args={[isActive ? 0.08 : phase === "settled" ? 0.06 : 0.045, 12, 12]} />
                <meshBasicMaterial color={isActive ? "#fde68a" : phase === "settled" ? "#f6c453" : "#f59e0b"} />
              </mesh>
            </group>
          );
        })}

        {places.map((place) => {
          const isActive = activePlaceIdSet.has(place.id);
          const isSettled = settledPlaceIdSet.has(place.id);
          const position = latLngToVector(place.lat, place.lng, isActive ? 2.48 : isSettled ? 2.45 : 2.43);

          return (
            <group key={place.id} position={position}>
              <mesh>
                <sphereGeometry args={[isActive ? 0.1 : isSettled ? 0.082 : 0.07, 16, 16]} />
                <meshStandardMaterial
                  color={isActive ? "#fde68a" : isSettled ? "#f3d48b" : "#f8e7b2"}
                  emissive={new THREE.Color(isActive ? "#f59e0b" : isSettled ? "#f6c453" : "#d97706")}
                  emissiveIntensity={isActive ? 1.4 : isSettled ? 0.95 : 0.7}
                />
              </mesh>
              {isActive || isSettled ? (
                <mesh>
                  <sphereGeometry args={[isActive ? 0.16 : 0.13, 16, 16]} />
                  <meshBasicMaterial color={isActive ? "#fde68a" : "#f6c453"} transparent opacity={isActive ? 0.14 : 0.08} />
                </mesh>
              ) : null}
            </group>
          );
        })}
      </group>

      <OrbitControls enablePan={false} minDistance={4.8} maxDistance={8.5} />
    </>
  );
}

export function SpreadGlobe(props: SpreadGlobeProps) {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-[#ead8a6]/16 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),rgba(92,62,20,0.84)_34%,rgba(38,24,8,0.92))]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-[#ead8a6]/16 bg-[rgba(94,64,21,0.62)] px-3 py-1 text-[11px] text-[#f5ecd3]">
        {props.stageLabel ?? "地理传播卷面"}
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-[#ead8a6]/16 bg-[rgba(94,64,21,0.58)] px-3 py-1 text-[11px] text-[#eadfbc]">
        拖卷换向 · 点航线聚焦
      </div>
      {props.stageDetail ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-[18px] border border-[#ead8a6]/12 bg-[rgba(44,28,9,0.56)] px-3 py-2 text-[11px] leading-5 text-[#eadfbc]">
          {props.stageDetail}
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-[linear-gradient(0deg,rgba(51,31,10,0.56),rgba(51,31,10,0))]" />
      <Canvas dpr={[1, 1.8]}>
        <SpreadGlobeScene {...props} />
      </Canvas>
    </div>
  );
}
