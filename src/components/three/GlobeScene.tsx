"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function generatePoints(count: number, radius: number) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    points.push(new THREE.Vector3().setFromSphericalCoords(radius, phi, theta));
  }
  return points;
}

function Wireframe() {
  return (
    <mesh>
      <icosahedronGeometry args={[1.6, 3]} />
      <meshBasicMaterial color="#4A90D9" wireframe transparent opacity={0.18} />
    </mesh>
  );
}

function DetectionPoints({ points }: { points: THREE.Vector3[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const state = useRef(points.map(() => ({ t: 0, delay: Math.random() * 5 + 0.5 })));

  useFrame((_, delta) => {
    state.current.forEach((p) => {
      if (p.delay > 0) {
        p.delay -= delta;
      } else {
        p.t += delta;
        if (p.t > 1.4) {
          p.t = 0;
          p.delay = Math.random() * 4 + 1;
        }
      }
    });

    groupRef.current?.children.forEach((child, i) => {
      const p = state.current[i];
      const scale = p.delay <= 0 ? Math.sin((p.t / 1.4) * Math.PI) : 0.001;
      child.scale.setScalar(Math.max(scale, 0.001));
    });
  });

  return (
    <group ref={groupRef}>
      {points.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#8fc4f5" />
        </mesh>
      ))}
    </group>
  );
}

function RotatingGlobe() {
  const ref = useRef<THREE.Group>(null);
  const points = useMemo(() => generatePoints(36, 1.62), []);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.12;
  });

  return (
    <group ref={ref}>
      <Wireframe />
      <DetectionPoints points={points} />
    </group>
  );
}

export function GlobeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 4.3], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.7} />
      <RotatingGlobe />
    </Canvas>
  );
}