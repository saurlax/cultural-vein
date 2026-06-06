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

interface SimulationNode {
  id: string;
  person: PersonNode;
  tier: 1 | 2;
  anchorIndex: number;
  position: THREE.Vector3;
}

interface SimulationEdge {
  sourceId: string;
  targetId: string;
  type: "core" | "orbit";
  relationType?: PersonNode["relationType"];
}

const CORE_ID = "book-core";
const SIMULATION_STEPS = 260;
const CORE_PULL = 0.028;
const PRIMARY_PULL = 0.02;
const SECONDARY_PULL = 0.016;
const REPULSION = 0.034;
const EDGE_STRENGTH = 0.024;
const DAMPING = 0.92;

function seededNoise(seed: number) {
  const value = Math.sin(seed * 127.1) * 43758.5453123;
  return value - Math.floor(value);
}

function buildInitialNodes(primaryPeople: PersonNode[], secondaryPeople: PersonNode[]) {
  const nodes: SimulationNode[] = [];

  primaryPeople.forEach((person, index) => {
    const angle = (index / Math.max(primaryPeople.length, 1)) * Math.PI * 2;
    nodes.push({
      id: person.id,
      person,
      tier: 1,
      anchorIndex: index,
      position: new THREE.Vector3(
        Math.cos(angle) * 1.85 + (seededNoise(index + 1.1) - 0.5) * 0.35,
        (seededNoise(index + 2.2) - 0.5) * 0.75,
        Math.sin(angle) * 1.85 + (seededNoise(index + 3.7) - 0.5) * 0.35,
      ),
    });
  });

  secondaryPeople.forEach((person, index) => {
    const anchorIndex = primaryPeople.length ? index % primaryPeople.length : 0;
    const angle = (index / Math.max(secondaryPeople.length, 1)) * Math.PI * 2 + Math.PI / 6;
    nodes.push({
      id: person.id,
      person,
      tier: 2,
      anchorIndex,
      position: new THREE.Vector3(
        Math.cos(angle) * 3.2 + (seededNoise(index + 4.4) - 0.5) * 0.55,
        (seededNoise(index + 5.5) - 0.5) * 1.1,
        Math.sin(angle) * 3.2 + (seededNoise(index + 6.6) - 0.5) * 0.55,
      ),
    });
  });

  return nodes;
}

function buildEdges(nodes: SimulationNode[], primaryPeople: PersonNode[]) {
  const edges: SimulationEdge[] = [];
  const primaryIds = primaryPeople.map((person) => person.id);

  nodes.forEach((node) => {
    if (node.tier === 1) {
      edges.push({
        sourceId: CORE_ID,
        targetId: node.id,
        type: "core",
        relationType: node.person.relationType,
      });
      return;
    }

    const anchorId = primaryIds[node.anchorIndex] ?? primaryIds[0];
    if (anchorId) {
      edges.push({
        sourceId: anchorId,
        targetId: node.id,
        type: "orbit",
        relationType: node.person.relationType,
      });
    } else {
      edges.push({
        sourceId: CORE_ID,
        targetId: node.id,
        type: "core",
        relationType: node.person.relationType,
      });
    }
  });

  return edges;
}

function relationEdgeStyle(relationType?: PersonNode["relationType"]) {
  switch (relationType) {
    case "著":
      return {
        color: "#34d399",
        activeColor: "#bbf7d0",
        lineWidth: 1.7,
        opacity: 0.84,
        label: "著述",
      };
    case "注":
      return {
        color: "#38bdf8",
        activeColor: "#bae6fd",
        lineWidth: 1.58,
        opacity: 0.8,
        label: "注疏",
      };
    case "校":
      return {
        color: "#c084fc",
        activeColor: "#e9d5ff",
        lineWidth: 1.45,
        opacity: 0.76,
        label: "校勘",
      };
    case "评":
      return {
        color: "#f59e0b",
        activeColor: "#fde68a",
        lineWidth: 1.34,
        opacity: 0.74,
        label: "评议",
      };
    case "承":
      return {
        color: "#fb7185",
        activeColor: "#fecdd3",
        lineWidth: 1.3,
        opacity: 0.72,
        label: "承续",
      };
    case "藏":
      return {
        color: "#a78bfa",
        activeColor: "#ddd6fe",
        lineWidth: 1.24,
        opacity: 0.68,
        label: "收藏",
      };
    case "引":
    default:
      return {
        color: "#d6d3d1",
        activeColor: "#f5f5f4",
        lineWidth: 1.08,
        opacity: 0.5,
        label: "引用",
      };
  }
}

function runForceSimulation(primaryPeople: PersonNode[], secondaryPeople: PersonNode[]) {
  const nodes = buildInitialNodes(primaryPeople, secondaryPeople);
  const edges = buildEdges(nodes, primaryPeople);
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const velocities = new Map(nodes.map((node) => [node.id, new THREE.Vector3()]));
  const core = new THREE.Vector3(0, -0.12, 0);

  for (let step = 0; step < SIMULATION_STEPS; step += 1) {
    nodes.forEach((node) => {
      const velocity = velocities.get(node.id) ?? new THREE.Vector3();
      const pullStrength = node.tier === 1 ? PRIMARY_PULL : SECONDARY_PULL;
      const targetRadius = node.tier === 1 ? 2.05 : 3.5;
      const anchorAngle =
        node.tier === 1
          ? (node.anchorIndex / Math.max(primaryPeople.length, 1)) * Math.PI * 2
          : (node.anchorIndex / Math.max(primaryPeople.length || secondaryPeople.length, 1)) *
            Math.PI *
            2;
      const anchor = new THREE.Vector3(
        Math.cos(anchorAngle) * targetRadius,
        node.tier === 1 ? 0.12 : -0.18 + Math.sin(anchorAngle * 1.3) * 0.28,
        Math.sin(anchorAngle) * targetRadius,
      );

      velocity.add(core.clone().sub(node.position).multiplyScalar(CORE_PULL));
      velocity.add(anchor.clone().sub(node.position).multiplyScalar(pullStrength));
      velocity.add(node.position.clone().normalize().multiplyScalar(0.002));

      velocities.set(node.id, velocity);
    });

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const left = nodes[i];
        const right = nodes[j];

        if (!left || !right) {
          continue;
        }

        const delta = left.position.clone().sub(right.position);
        const distance = Math.max(delta.length(), 0.18);
        const direction = delta.normalize();
        const tierFactor = left.tier === right.tier ? 1 : 0.82;
        const repulsionForce = (REPULSION * tierFactor) / (distance * distance);

        const leftVelocity = velocities.get(left.id) ?? new THREE.Vector3();
        const rightVelocity = velocities.get(right.id) ?? new THREE.Vector3();
        leftVelocity.add(direction.clone().multiplyScalar(repulsionForce));
        rightVelocity.add(direction.clone().multiplyScalar(-repulsionForce));
        velocities.set(left.id, leftVelocity);
        velocities.set(right.id, rightVelocity);
      }
    }

    edges.forEach((edge) => {
      const source = edge.sourceId === CORE_ID ? { position: core } : nodeMap.get(edge.sourceId);
      const target = nodeMap.get(edge.targetId);

      if (!source || !target) {
        return;
      }

      const desiredDistance = edge.type === "core" ? 2.25 : 1.95;
      const delta = target.position.clone().sub(source.position);
      const distance = Math.max(delta.length(), 0.001);
      const offset = distance - desiredDistance;
      const direction = delta.normalize();
      const force = direction.multiplyScalar(offset * EDGE_STRENGTH);
      const targetVelocity = velocities.get(target.id) ?? new THREE.Vector3();
      targetVelocity.add(force.multiplyScalar(-1));
      velocities.set(target.id, targetVelocity);

      if (edge.sourceId !== CORE_ID) {
        const sourceVelocity = velocities.get(edge.sourceId) ?? new THREE.Vector3();
        sourceVelocity.add(force);
        velocities.set(edge.sourceId, sourceVelocity);
      }
    });

    nodes.forEach((node) => {
      const velocity = velocities.get(node.id) ?? new THREE.Vector3();
      velocity.multiplyScalar(DAMPING);
      node.position.add(velocity);
      node.position.y = THREE.MathUtils.clamp(
        node.position.y,
        node.tier === 1 ? -0.8 : -1.15,
        node.tier === 1 ? 0.95 : 0.72,
      );
      const radiusLimit = node.tier === 1 ? 2.75 : 4.35;
      if (node.position.length() > radiusLimit) {
        node.position.setLength(radiusLimit);
      }
      velocities.set(node.id, velocity);
    });
  }

  return {
    core,
    nodes,
    edges,
  };
}

function RelationField({
  primaryCount,
  secondaryCount,
}: {
  primaryCount: number;
  secondaryCount: number;
}) {
  const fieldRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!fieldRef.current) {
      return;
    }

    fieldRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.16;
    fieldRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.03;
    fieldRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.28) * 0.04;
    fieldRef.current.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.position) {
        return;
      }
      mesh.position.y += Math.sin(state.clock.elapsedTime * 0.75 + index * 0.45) * 0.0008;
    });
  });

  return (
    <group ref={fieldRef}>
      <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.25, 4.9, 72]} />
        <meshBasicMaterial color="#6b4b1d" transparent opacity={0.13} />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshStandardMaterial
          color="#fcd34d"
          emissive={new THREE.Color("#f59e0b")}
          emissiveIntensity={0.78}
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>
      <mesh position={[0, -0.24, 0]} scale={[1.42, 1.42, 1.42]}>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.09} />
      </mesh>
      <Text
        position={[0, 1.06, 0]}
        fontSize={0.24}
        maxWidth={2.5}
        color="#fef3c7"
        anchorX="center"
        anchorY="middle"
      >
        {`中心典籍 · 一级 ${primaryCount} · 二级 ${secondaryCount}`}
      </Text>
    </group>
  );
}

function PersonNetworkScene({
  book,
  primaryPeople,
  secondaryPeople,
  activePersonId,
  onSelectPerson,
}: PersonNetwork3DProps) {
  const simulation = useMemo(
    () => runForceSimulation(primaryPeople, secondaryPeople),
    [primaryPeople, secondaryPeople],
  );
  const nodeMap = useMemo(
    () => new Map(simulation.nodes.map((node) => [node.id, node])),
    [simulation.nodes],
  );

  return (
    <>
      <color attach="background" args={["#140d06"]} />
      <fog attach="fog" args={["#140d06", 6, 12]} />
      <PerspectiveCamera makeDefault position={[0, 1.45, 8.8]} fov={34} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[5, 6, 5]} intensity={1.7} color="#fff4d0" />
      <pointLight position={[-5, -1, 3]} intensity={1.2} color="#f59e0b" />
      <pointLight position={[4, 2, -4]} intensity={1} color="#fcd34d" />

      <RelationField
        primaryCount={primaryPeople.length}
        secondaryCount={secondaryPeople.length}
      />

      <Text
        position={[0, 1.7, 0]}
        fontSize={0.28}
        maxWidth={2.6}
        color="#fef3c7"
        anchorX="center"
        anchorY="middle"
      >
        {book.shortTitle}
      </Text>

      {simulation.edges.map((edge) => {
        const source =
          edge.sourceId === CORE_ID ? simulation.core : nodeMap.get(edge.sourceId)?.position;
        const target = nodeMap.get(edge.targetId)?.position;
        const targetNode = nodeMap.get(edge.targetId);
        const edgeStyle = relationEdgeStyle(edge.relationType);
        const isActive =
          activePersonId === edge.targetId || (edge.sourceId !== CORE_ID && activePersonId === edge.sourceId);

        if (!source || !target || !targetNode) {
          return null;
        }

        const midpoint = source
          .clone()
          .lerp(target, 0.5)
          .add(new THREE.Vector3(0, edge.type === "core" ? 0.22 : 0.12, 0));
        const curve = new THREE.CatmullRomCurve3([source, midpoint, target]);
        const points = curve.getPoints(24);

        return (
          <Line
            key={`${edge.sourceId}-${edge.targetId}`}
            points={points}
            color={isActive ? edgeStyle.activeColor : edgeStyle.color}
            transparent
            opacity={isActive ? 0.96 : edgeStyle.opacity}
            lineWidth={isActive ? Math.max(edgeStyle.lineWidth + 0.42, 1.6) : edgeStyle.lineWidth}
          />
        );
      })}

      {simulation.nodes.map((node) => {
        const isActive = node.id === activePersonId;
        const isPrimary = node.tier === 1;
        const markerSize = isActive ? (isPrimary ? 0.24 : 0.21) : isPrimary ? 0.19 : 0.15;

        return (
          <group key={node.id} position={node.position}>
            <mesh onClick={() => onSelectPerson?.(node.id)}>
              <sphereGeometry args={[markerSize, 22, 22]} />
              <meshStandardMaterial
                color={
                  isPrimary
                    ? isActive
                      ? "#fde68a"
                      : "#a7f3d0"
                    : isActive
                      ? "#fde68a"
                      : "#e7e5e4"
                }
                emissive={
                  new THREE.Color(
                    isActive ? "#f59e0b" : isPrimary ? "#10b981" : "#94a3b8",
                  )
                }
                emissiveIntensity={isActive ? 1.15 : isPrimary ? 0.8 : 0.45}
              />
            </mesh>
            {isActive ? (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <ringGeometry args={[markerSize + 0.08, markerSize + 0.18, 28]} />
                <meshBasicMaterial color="#fcd34d" transparent opacity={0.45} />
              </mesh>
            ) : null}
            <Text
              position={[0, isPrimary ? 0.38 : 0.32, 0]}
              fontSize={isPrimary ? 0.15 : 0.13}
              maxWidth={1.6}
              color={isActive ? "#fef3c7" : isPrimary ? "#ecfdf5" : "#e7e5e4"}
              anchorX="center"
              anchorY="middle"
            >
              {node.person.name}
            </Text>
          </group>
        );
      })}

      <OrbitControls enablePan={false} minDistance={5.8} maxDistance={10.2} />
    </>
  );
}

export function PersonNetwork3D(props: PersonNetwork3DProps) {
  const relationLegend = [
    relationEdgeStyle("著"),
    relationEdgeStyle("注"),
    relationEdgeStyle("校"),
    relationEdgeStyle("评"),
    relationEdgeStyle("引"),
  ];

  return (
    <div className="relative h-[360px] overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),rgba(20,13,6,0.96))]">
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-amber-300/15 bg-[#2d1d0c]/70 px-3 py-1 text-[11px] text-stone-200">
        3D 力导人物关系场
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-amber-300/15 bg-[#2d1d0c]/70 px-3 py-1 text-[11px] text-stone-300">
        拖拽旋转 · 点击人物聚焦
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex flex-wrap gap-2">
        {relationLegend.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 rounded-full border border-amber-300/10 bg-[#2d1d0c]/72 px-3 py-1 text-[10px] text-stone-200"
          >
            <span
              className="h-[2px] w-5 rounded-full"
              style={{
                backgroundColor: item.color,
                opacity: item.opacity,
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <Canvas dpr={[1, 1.8]}>
        <PersonNetworkScene {...props} />
      </Canvas>
    </div>
  );
}
