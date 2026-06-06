"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, PerspectiveCamera, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { BookNode, PersonNode } from "@/types/domain";

interface PersonNetwork3DProps {
  book: BookNode;
  primaryPeople: PersonNode[];
  secondaryPeople: PersonNode[];
  activePersonId?: string | null;
  onSelectPerson?: (personId: string) => void;
}

function buildRingPositions(count: number, radius: number, y: number, phase = 0) {
  if (count === 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => {
    const angle = phase + (index / count) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  });
}

function PersonNetworkScene({
  book,
  primaryPeople,
  secondaryPeople,
  activePersonId,
  onSelectPerson,
}: PersonNetwork3DProps) {
  const rootRef = useRef<THREE.Group>(null);
  const center = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const primaryPositions = useMemo(
    () => buildRingPositions(primaryPeople.length, 2.45, 0.2, Math.PI / 5),
    [primaryPeople.length],
  );
  const secondaryPositions = useMemo(
    () => buildRingPositions(secondaryPeople.length, 3.75, -0.15, -Math.PI / 7),
    [secondaryPeople.length],
  );

  useFrame((state) => {
    if (!rootRef.current) {
      return;
    }

    rootRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.14;
    rootRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.04;
  });

  return (
    <>
      <color attach="background" args={["#140d06"]} />
      <fog attach="fog" args={["#140d06", 6, 11]} />
      <PerspectiveCamera makeDefault position={[0, 1.8, 8.2]} fov={34} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[5, 6, 5]} intensity={1.7} color="#fff4d0" />
      <pointLight position={[-5, -1, 3]} intensity={1.2} color="#f59e0b" />

      <group ref={rootRef}>
        <mesh position={[0, -0.24, 0]}>
          <sphereGeometry args={[0.68, 32, 32]} />
          <meshStandardMaterial
            color="#fcd34d"
            emissive={new THREE.Color("#f59e0b")}
            emissiveIntensity={0.7}
            roughness={0.45}
            metalness={0.08}
          />
        </mesh>
        <mesh position={[0, -0.24, 0]} scale={[1.35, 1.35, 1.35]}>
          <sphereGeometry args={[0.68, 32, 32]} />
          <meshBasicMaterial color="#fde68a" transparent opacity={0.08} />
        </mesh>
        <Text
          position={[0, 0.95, 0]}
          fontSize={0.25}
          maxWidth={2.2}
          color="#fef3c7"
          anchorX="center"
          anchorY="middle"
        >
          {book.shortTitle}
        </Text>

        {primaryPeople.map((person, index) => {
          const position = primaryPositions[index] ?? new THREE.Vector3(0, 0, 0);
          const isActive = person.id === activePersonId;

          return (
            <group key={person.id}>
              <Line
                points={[center, position]}
                color={isActive ? "#fde68a" : "#34d399"}
                transparent
                opacity={isActive ? 0.95 : 0.6}
                lineWidth={isActive ? 2.1 : 1.3}
              />
              <mesh position={position} onClick={() => onSelectPerson?.(person.id)}>
                <sphereGeometry args={[isActive ? 0.24 : 0.19, 22, 22]} />
                <meshStandardMaterial
                  color={isActive ? "#fde68a" : "#a7f3d0"}
                  emissive={new THREE.Color(isActive ? "#f59e0b" : "#10b981")}
                  emissiveIntensity={isActive ? 1.1 : 0.8}
                />
              </mesh>
              <Text
                position={position.clone().add(new THREE.Vector3(0, 0.42, 0))}
                fontSize={0.15}
                color={isActive ? "#fef3c7" : "#ecfdf5"}
                anchorX="center"
                anchorY="middle"
              >
                {person.name}
              </Text>
            </group>
          );
        })}

        {secondaryPeople.map((person, index) => {
          const position = secondaryPositions[index] ?? new THREE.Vector3(0, 0, 0);
          const isActive = person.id === activePersonId;
          const nearestPrimary =
            primaryPositions[index % Math.max(primaryPositions.length, 1)] ??
            new THREE.Vector3(1.6, 0.2, 0);

          return (
            <group key={person.id}>
              <Line
                points={[center, position]}
                color="rgba(255,255,255,0.18)"
                transparent
                opacity={0.22}
                lineWidth={0.8}
              />
              <Line
                points={[nearestPrimary, position]}
                color={isActive ? "#fde68a" : "#cbd5e1"}
                transparent
                opacity={isActive ? 0.8 : 0.42}
                lineWidth={isActive ? 1.5 : 0.9}
              />
              <mesh position={position} onClick={() => onSelectPerson?.(person.id)}>
                <sphereGeometry args={[isActive ? 0.2 : 0.15, 20, 20]} />
                <meshStandardMaterial
                  color={isActive ? "#fde68a" : "#e7e5e4"}
                  emissive={new THREE.Color(isActive ? "#f59e0b" : "#94a3b8")}
                  emissiveIntensity={isActive ? 1 : 0.45}
                />
              </mesh>
              <Text
                position={position.clone().add(new THREE.Vector3(0, 0.34, 0))}
                fontSize={0.13}
                color={isActive ? "#fef3c7" : "#e7e5e4"}
                anchorX="center"
                anchorY="middle"
              >
                {person.name}
              </Text>
            </group>
          );
        })}
      </group>

      <OrbitControls enablePan={false} minDistance={5.8} maxDistance={10.2} />
    </>
  );
}

export function PersonNetwork3D(props: PersonNetwork3DProps) {
  return (
    <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),rgba(20,13,6,0.96))]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-amber-300/15 bg-[#2d1d0c]/70 px-3 py-1 text-[11px] text-stone-200">
        3D 人物关系场
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-amber-300/15 bg-[#2d1d0c]/70 px-3 py-1 text-[11px] text-stone-300">
        拖拽旋转 · 点击人物聚焦
      </div>
      <Canvas dpr={[1, 1.8]}>
        <PersonNetworkScene {...props} />
      </Canvas>
    </div>
  );
}
