"use client";
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BrightColors = ['#ff2a2a', '#2a7fff', '#2aff2a', '#ffea2a', '#ff2a7f', '#2affea', '#a02aff'];

const SolarSystemAtom = () => {
  const group = useRef<THREE.Group>(null);
  
  // We will create multiple rings with electrons on them
  const ringCount = 7;
  const rings = Array.from({ length: ringCount }).map((_, i) => {
    const radius = 2 + i * 1.5;
    const speed = 0.2 + Math.random() * 0.3;
    const startAngle = Math.random() * Math.PI * 2;
    const tiltX = (Math.random() - 0.5) * Math.PI;
    const tiltY = (Math.random() - 0.5) * Math.PI;
    const color = BrightColors[i % BrightColors.length];
    return { radius, speed, startAngle, tiltX, tiltY, color };
  });

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.05;
      group.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <group ref={group}>
      {/* Central Sun / Nucleus */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial emissive="#fbbf24" emissiveIntensity={1.5} color="#fbbf24" />
      </mesh>
      <pointLight intensity={3} distance={50} color="#fbbf24" />

      {/* Orbital Rings & Electrons */}
      {rings.map((ring, i) => (
        <group key={i} rotation={[ring.tiltX, ring.tiltY, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ring.radius, 0.015, 16, 100]} />
            <meshStandardMaterial emissive={ring.color} emissiveIntensity={0.5} color={ring.color} transparent opacity={0.3} />
          </mesh>
          <ElectronOrbit radius={ring.radius} speed={ring.speed} startAngle={ring.startAngle} color={ring.color} />
        </group>
      ))}
    </group>
  );
};

const ElectronOrbit = ({ radius, speed, startAngle, color }: { radius: number, speed: number, startAngle: number, color: string }) => {
  const electronRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (electronRef.current) {
      const t = state.clock.getElapsedTime() * speed + startAngle;
      electronRef.current.position.x = Math.cos(t) * radius;
      electronRef.current.position.z = Math.sin(t) * radius;
    }
  });

  return (
    <mesh ref={electronRef}>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial emissive={color} emissiveIntensity={2.5} color={color} />
    </mesh>
  );
};

export default function BackgroundAtoms() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-black">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.1} />
        <SolarSystemAtom />
      </Canvas>
    </div>
  );
}
