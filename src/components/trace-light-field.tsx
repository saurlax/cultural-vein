"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, PerspectiveCamera, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface TraceLightFieldNode {
  id: string;
  title: string;
  relation: string;
}

interface TraceLightFieldProps {
  traces: TraceLightFieldNode[];
  activeIndex: number;
  playing: boolean;
}

function seededNoise(seed: number) {
  const value = Math.sin(seed * 91.17) * 43758.5453123;
  return value - Math.floor(value);
}

function buildTracePositions(length: number) {
  const total = Math.max(length - 1, 1);

  return Array.from({ length }, (_, index) => {
    const progress = index / total;

    return new THREE.Vector3(
      3.6 - progress * 7.2,
      Math.sin(progress * Math.PI) * 1.45 - 0.2 + (seededNoise(index + 0.7) - 0.5) * 0.18,
      Math.cos(progress * Math.PI * 1.4) * 1.1 + (seededNoise(index + 2.1) - 0.5) * 0.24,
    );
  });
}

function FlowParticles({
  curve,
  activeIndex,
  total,
  playing,
}: {
  curve: THREE.CatmullRomCurve3;
  activeIndex: number;
  total: number;
  playing: boolean;
}) {
  const particleRef = useRef<THREE.Group>(null);
  const offsets = useMemo(() => [0.04, 0.16, 0.3, 0.42, 0.58, 0.74, 0.88], []);

  useFrame((state) => {
    if (!particleRef.current) {
      return;
    }

    const progressCap = total > 1 ? activeIndex / (total - 1) : 1;

    particleRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      const flowOffset = playing
        ? (state.clock.elapsedTime * 0.12 + offsets[index]!) % 1
        : Math.min(progressCap + offsets[index]! * 0.04, 1);
      const t = playing ? Math.min(flowOffset, Math.max(progressCap, 0.04)) : flowOffset;
      const point = curve.getPointAt(t);
      mesh.position.copy(point);
      const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 3.2 + index * 0.8) * 0.18;
      mesh.scale.setScalar(pulse);
    });
  });

  return (
    <group ref={particleRef}>
      {offsets.map((offset, index) => (
        <mesh key={`particle-${offset}-${index}`}>
          <sphereGeometry args={[0.08 + index * 0.004, 16, 16]} />
          <meshBasicMaterial color={index % 2 === 0 ? "#fcd34d" : "#fde68a"} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function TraceScene({ traces, activeIndex, playing }: TraceLightFieldProps) {
  const positions = useMemo(() => buildTracePositions(traces.length), [traces.length]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(positions), [positions]);
  const linePoints = useMemo(() => curve.getPoints(96), [curve]);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.14) * 0.12;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.03;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.05;
  });

  return (
    <>
      <color attach="background" args={["#0f0904"]} />
      <fog attach="fog" args={["#0f0904", 7, 14]} />
      <PerspectiveCamera makeDefault position={[0, 1.6, 8.6]} fov={32} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#fff4d0" />
      <pointLight position={[-4, 1, 3]} intensity={1.2} color="#f59e0b" />
      <pointLight position={[4, 2, -3]} intensity={1} color="#fde68a" />

      <group ref={groupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]}>
          <circleGeometry args={[5.8, 48]} />
          <meshBasicMaterial color="#2b1b0b" transparent opacity={0.72} />
        </mesh>

        <Line points={linePoints} color="#7c2d12" transparent opacity={0.42} lineWidth={7.4} />
        <Line points={linePoints} color="#f59e0b" transparent opacity={0.94} lineWidth={2.6} />
        <Line points={linePoints} color="#fde68a" transparent opacity={0.3} lineWidth={5} />

        <FlowParticles curve={curve} activeIndex={activeIndex} total={traces.length} playing={playing} />

        {traces.map((trace, index) => {
          const position = positions[index] ?? new THREE.Vector3();
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <group key={trace.id} position={position}>
              <mesh>
                <sphereGeometry args={[isCurrent ? 0.22 : isActive ? 0.16 : 0.11, 20, 20]} />
                <meshStandardMaterial
                  color={isCurrent ? "#fcd34d" : isActive ? "#fde68a" : "#78716c"}
                  emissive={new THREE.Color(isCurrent ? "#f59e0b" : isActive ? "#d97706" : "#44403c")}
                  emissiveIntensity={isCurrent ? 1.3 : isActive ? 0.8 : 0.2}
                />
              </mesh>
              {isCurrent ? (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
                  <ringGeometry args={[0.28, 0.42, 28]} />
                  <meshBasicMaterial color="#fcd34d" transparent opacity={0.42} />
                </mesh>
              ) : null}
              <Text
                position={[0, isCurrent ? 0.52 : 0.38, 0]}
                fontSize={0.16}
                maxWidth={1.7}
                color={isCurrent ? "#fef3c7" : isActive ? "#fde68a" : "#a8a29e"}
                anchorX="center"
                anchorY="middle"
              >
                {trace.title}
              </Text>
              <Text
                position={[0, isCurrent ? -0.42 : -0.3, 0]}
                fontSize={0.1}
                maxWidth={1.5}
                color={isCurrent ? "#fbbf24" : "#a8a29e"}
                anchorX="center"
                anchorY="middle"
              >
                {trace.relation}
              </Text>
            </group>
          );
        })}
      </group>
    </>
  );
}

export function TraceLightField({ traces, activeIndex, playing }: TraceLightFieldProps) {
  return (
    <div className="relative h-[220px] overflow-hidden rounded-[20px] border border-[#ead8a6]/16 bg-[linear-gradient(180deg,rgba(92,62,20,0.86),rgba(34,21,8,0.96))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.18),transparent_45%)]" />
      <div className="pointer-events-none absolute left-4 top-3 z-10 text-[10px] tracking-[0.22em] text-amber-100/78">
        3D 溯源光场
      </div>
      <div className="pointer-events-none absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[10px] tracking-[0.22em] text-[#d8c9a3]">
        <span>当前文本</span>
        <span>中间转引</span>
        <span>源头典籍</span>
      </div>
      <Canvas dpr={[1, 1.8]}>
        <TraceScene traces={traces} activeIndex={activeIndex} playing={playing} />
      </Canvas>
    </div>
  );
}
