// ============================================================
// CompletionExplosion — InstancedMesh particle burst
// 1000 particles, custom vertex displacement, additive blending
// Triggered via the global celebration event bus
// ============================================================

"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Custom shader for shimmer particles ─────────────────────
const PARTICLE_VERTEX = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  attribute vec3 aVelocity;
  attribute float aPhase;

  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uOrigin;

  varying float vLife;
  varying float vPhase;

  void main() {
    vLife = aLife;
    vPhase = aPhase;

    // Position: origin + velocity * time, with gravity pull
    float t = uProgress * 2.0;
    vec3 pos = uOrigin
      + aVelocity * t
      + vec3(0.0, -1.8 * t * t, 0.0); // gravity

    // Crystal shimmer: vertex displacement
    float shimmer = sin(uTime * 6.0 + aPhase * 6.28) * 0.04 * (1.0 - uProgress);
    pos += normalize(aVelocity) * shimmer;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Size attenuation with distance
    float sizeScale = aSize * (1.0 - uProgress * 0.7);
    gl_PointSize = sizeScale * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgress;

  varying float vLife;
  varying float vPhase;

  void main() {
    // Soft circle shape
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    // Radial falloff for soft glow
    float alpha = smoothstep(0.5, 0.0, d);

    // Fade out over lifetime
    float fade = 1.0 - uProgress;
    fade *= fade; // quadratic falloff for smoother end

    // Shimmer color variation
    vec3 col = uColor + 0.15 * sin(vPhase * 6.28 + vec3(0.0, 2.09, 4.18));

    // Hot core: brighter at start
    float core = smoothstep(0.3, 0.0, d) * (1.0 - uProgress) * 0.5;
    col += core;

    gl_FragColor = vec4(col, alpha * fade * vLife);
  }
`;

// ── Constants ───────────────────────────────────────────────
const PARTICLE_COUNT = 1000;
const DURATION = 1.6; // seconds

export interface ExplosionInstance {
  id: string;
  origin: THREE.Vector3;
  color: string;
  streak: number;
  startTime: number;
}

interface CompletionExplosionProps {
  explosion: ExplosionInstance;
  onComplete: (id: string) => void;
}

/**
 * Single explosion burst using ShaderMaterial on a Points geometry.
 * 1000 particles with custom vertex displacement shimmer.
 */
export default function CompletionExplosion({
  explosion,
  onComplete,
}: CompletionExplosionProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  // Generate particle attributes once
  const { geometry } = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    const life = new Float32Array(PARTICLE_COUNT);
    const size = new Float32Array(PARTICLE_COUNT);
    const velocity = new Float32Array(PARTICLE_COUNT * 3);
    const phase = new Float32Array(PARTICLE_COUNT);
    // Dummy position (all at origin; shader moves them)
    const position = new Float32Array(PARTICLE_COUNT * 3);

    // Streak scales intensity: more particles go farther
    const streakBoost = Math.min(1 + explosion.streak * 0.05, 2.0);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Life: some particles die sooner for variation
      life[i] = 0.4 + Math.random() * 0.6;

      // Size: range 0.6-2.0
      size[i] = 0.6 + Math.random() * 1.4;

      // Velocity: spherical burst
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = (0.8 + Math.random() * 2.2) * streakBoost;
      velocity[i * 3]     = Math.sin(phi) * Math.cos(theta) * speed;
      velocity[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 0.8;
      velocity[i * 3 + 2] = Math.cos(phi) * speed;

      // Phase: for shimmer variation
      phase[i] = Math.random();

      // Position: all zero (shader uses uOrigin)
      position[i * 3] = 0;
      position[i * 3 + 1] = 0;
      position[i * 3 + 2] = 0;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aVelocity", new THREE.BufferAttribute(velocity, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

    return { geometry: geo };
  }, [explosion.streak]);

  // Shader material uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uOrigin: { value: explosion.origin.clone() },
      uColor: { value: new THREE.Color(explosion.color) },
    }),
    [explosion.origin, explosion.color]
  );

  // Animate and auto-remove
  useFrame((state) => {
    if (!materialRef.current) return;
    const elapsed = state.clock.elapsedTime - explosion.startTime;
    const progress = Math.min(elapsed / DURATION, 1);

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uProgress.value = progress;

    if (progress >= 1) {
      onComplete(explosion.id);
    }
  });

  // Clean up geometry on unmount
  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  return (
    <points ref={pointsRef}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={PARTICLE_VERTEX}
        fragmentShader={PARTICLE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}


// ════════════════════════════════════════════════════════════
// SECONDARY: Shockwave ring that expands after burst
// ════════════════════════════════════════════════════════════
interface ShockwaveProps {
  origin: THREE.Vector3;
  color: string;
  startTime: number;
  onComplete: () => void;
}

const RING_VERTEX = /* glsl */ `
  uniform float uProgress;
  uniform float uRadius;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // Scale ring outward
    pos.xz *= uRadius;
    // Flatten to a disc
    pos.y *= max(0.01, 1.0 - uProgress);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uProgress;
  varying vec2 vUv;
  void main() {
    // Ring shape from torus UV
    float alpha = smoothstep(1.0, 0.6, uProgress);
    alpha *= 0.4;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function CompletionShockwave({
  origin,
  color,
  startTime,
  onComplete,
}: ShockwaveProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const RING_DURATION = 0.8;

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uRadius: { value: 0.1 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color]
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const elapsed = state.clock.elapsedTime - startTime;
    const progress = Math.min(elapsed / RING_DURATION, 1);

    matRef.current.uniforms.uProgress.value = progress;
    matRef.current.uniforms.uRadius.value = 0.1 + progress * 3.5;

    if (progress >= 1) onComplete();
  });

  return (
    <mesh ref={meshRef} position={origin} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.08, 8, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={RING_VERTEX}
        fragmentShader={RING_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
