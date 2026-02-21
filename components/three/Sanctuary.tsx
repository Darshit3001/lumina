// ============================================================
// Sanctuary — Living 3D Habit Island
// InstancedMesh particles, custom shimmer shaders,
// celebration event integration, mobile-friendly orbit
// ============================================================

"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Float,
  Stars,
  OrbitControls,
  MeshDistortMaterial,
  Html,
} from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  ChromaticAberration,
  Vignette,
  DepthOfField,
  Noise,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import CompletionExplosion, {
  CompletionShockwave,
  type ExplosionInstance,
} from "./CompletionExplosion";
import { onCelebration, type CelebrationEvent } from "@/stores/habitStore";

// ── Types ───────────────────────────────────────────────────
export interface CrystalData {
  id: string;
  name: string;
  category: string;
  color: string;
  streak: number;
  completed: boolean;
  position: [number, number, number];
}

interface SanctuarySceneProps {
  crystals: CrystalData[];
  onCrystalClick?: (id: string) => void;
}

// ── Category → default color map ────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  wellness:    "#a78bfa",
  fitness:     "#22d3ee",
  learning:    "#6366f1",
  mindfulness: "#d946ef",
  creativity:  "#f472b6",
  general:     "#a78bfa",
};

function getCrystalColor(category: string, customColor?: string): string {
  if (customColor && customColor !== "#a855f7") return customColor;
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general;
}

// ── Default crystal layout (max 8 positions in a ring) ──────
const DEFAULT_POSITIONS: [number, number, number][] = [
  [-2.2,  1.0, -0.5],
  [ 1.8,  1.4,  0.8],
  [-0.5,  1.8, -2.0],
  [ 2.5,  0.8, -1.5],
  [-1.8,  1.2,  1.8],
  [ 0.8,  2.0,  1.5],
  [-2.8,  0.6,  0.5],
  [ 0.0,  1.6, -1.0],
];

/** Compute circular positions for N crystals */
function computeRingPositions(count: number): [number, number, number][] {
  if (count <= DEFAULT_POSITIONS.length) {
    return DEFAULT_POSITIONS.slice(0, count);
  }
  // For > 8 crystals, generate a circle
  const radius = 2.5;
  const positions: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const y = 1.0 + Math.sin(angle * 2) * 0.4; // slight vertical variation
    positions.push([
      Math.cos(angle) * radius,
      y,
      Math.sin(angle) * radius,
    ]);
  }
  return positions;
}

// ── Demo crystals when user has no habits ───────────────────
const DEMO_CRYSTALS: CrystalData[] = [
  { id: "demo-1", name: "Meditate",       category: "mindfulness", color: "#d946ef", streak: 7,  completed: false, position: DEFAULT_POSITIONS[0] },
  { id: "demo-2", name: "Exercise",       category: "fitness",     color: "#22d3ee", streak: 12, completed: true,  position: DEFAULT_POSITIONS[1] },
  { id: "demo-3", name: "Read",           category: "learning",    color: "#6366f1", streak: 5,  completed: false, position: DEFAULT_POSITIONS[2] },
  { id: "demo-4", name: "Journal",        category: "wellness",    color: "#a78bfa", streak: 3,  completed: false, position: DEFAULT_POSITIONS[3] },
  { id: "demo-5", name: "Drink Water",    category: "wellness",    color: "#34d399", streak: 20, completed: true,  position: DEFAULT_POSITIONS[4] },
  { id: "demo-6", name: "Practice Music", category: "creativity",  color: "#f472b6", streak: 2,  completed: false, position: DEFAULT_POSITIONS[5] },
];

// ── Custom crystal shimmer shader ───────────────────────────
const CRYSTAL_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uCompleted;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vFresnel;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);

    // Vertex displacement shimmer
    float wave = sin(position.y * 4.0 + uTime * 3.0) * 0.03;
    wave += sin(position.x * 3.0 + uTime * 2.5) * 0.02;
    float displaceStrength = 0.5 + uCompleted * 0.5;
    vec3 displaced = position + normal * wave * displaceStrength;

    // Fresnel for rim glow
    vFresnel = 1.0 - abs(dot(vNormal, vViewDir));
    vFresnel = pow(vFresnel, 2.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const CRYSTAL_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uCompleted;
  uniform float uEmissive;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vFresnel;

  void main() {
    // Base color with slight facet variation
    vec3 col = uColor;

    // Fresnel rim glow
    vec3 rimColor = uColor * 1.4 + vec3(0.1);
    col = mix(col, rimColor, vFresnel * 0.6);

    // Emissive pulse when completed
    float pulse = uCompleted * (0.3 + 0.2 * sin(uTime * 3.0));
    col += uColor * pulse;

    // Specular highlight
    vec3 halfDir = normalize(vViewDir + vec3(0.3, 0.8, 0.2));
    float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
    col += vec3(spec) * 0.4;

    // Overall emissive intensity
    col += uColor * uEmissive * 0.3;

    float alpha = 0.85 + vFresnel * 0.15;
    gl_FragColor = vec4(col, alpha);
  }
`;


// ════════════════════════════════════════════════════════════
// FLOATING ISLAND BASE
// ════════════════════════════════════════════════════════════
function IslandBase() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      meshRef.current.position.y =
        -0.6 + Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, -0.6, 0]} scale={[2.5, 0.4, 2.5]}>
        <torusKnotGeometry args={[1, 0.35, 128, 32, 2, 3]} />
        <MeshDistortMaterial
          color="#0d0d1a"
          emissive="#1a0a2e"
          emissiveIntensity={0.15}
          roughness={0.85}
          metalness={0.3}
          distort={0.15}
          speed={0.8}
        />
      </mesh>

      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4, 64]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.03}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight
        position={[0, -1.2, 0]}
        intensity={0.6}
        color="#7c3aed"
        distance={6}
        decay={2}
      />
    </group>
  );
}


// ════════════════════════════════════════════════════════════
// HABIT CRYSTAL — Custom shimmer shader
// ════════════════════════════════════════════════════════════
interface HabitCrystalProps {
  data: CrystalData;
  onClick?: () => void;
}

function HabitCrystal({ data, onClick }: HabitCrystalProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const color = getCrystalColor(data.category, data.color);
  const streakScale = Math.min(0.6 + data.streak * 0.08, 2.0);

  // Hover cursor
  const { gl } = useThree();
  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "auto";
    return () => { gl.domElement.style.cursor = "auto"; };
  }, [hovered, gl]);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uCompleted: { value: data.completed ? 1.0 : 0.0 },
      uEmissive: { value: data.completed ? 1.2 : 0.4 },
    }),
    [color, data.completed]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Update shader time
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
    }

    // Glow pulse
    if (glowRef.current) {
      const glowScale = data.completed
        ? 1.6 + Math.sin(t * 2) * 0.15
        : 1.3 + Math.sin(t * 1.5) * 0.08;
      glowRef.current.scale.setScalar(glowScale);
    }

    // Hover lift (spring-like)
    if (groupRef.current) {
      const targetY = hovered ? 0.18 : 0;
      groupRef.current.position.y +=
        (targetY - groupRef.current.position.y) * 0.08;
    }
  });

  const handleClick = useCallback(() => {
    setPulsing(true);
    setTimeout(() => setPulsing(false), 500);
    onClick?.();
  }, [onClick]);

  return (
    <Float
      speed={1.5 + Math.random() * 0.5}
      rotationIntensity={0.2}
      floatIntensity={0.5 + Math.random() * 0.3}
    >
      <group
        ref={groupRef}
        position={data.position}
        onClick={handleClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        {/* Crystal body — custom shimmer shader */}
        <mesh
          scale={[
            0.35 * (hovered ? 1.12 : 1),
            0.35 * streakScale * (pulsing ? 1.3 : 1),
            0.35 * (hovered ? 1.12 : 1),
          ]}
          castShadow
        >
          <icosahedronGeometry args={[1, 1]} />
          <shaderMaterial
            ref={matRef}
            vertexShader={CRYSTAL_VERTEX}
            fragmentShader={CRYSTAL_FRAGMENT}
            uniforms={uniforms}
            transparent
          />
        </mesh>

        {/* Inner energy core */}
        <mesh scale={0.18}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} />
        </mesh>

        {/* Outer glow */}
        <mesh ref={glowRef} scale={1.3}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={data.completed ? 0.12 : 0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Per-crystal point light */}
        <pointLight
          color={color}
          intensity={data.completed ? 1.5 : 0.4}
          distance={3}
          decay={2}
        />

        {/* Floating crystal name label */}
        <Html
          position={[0, 0.55 * streakScale, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap text-center">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
              style={{
                color: data.completed ? color : "rgba(255,255,255,0.45)",
                backgroundColor: "rgba(0,0,0,0.35)",
                border: `1px solid ${data.completed ? color + "40" : "rgba(255,255,255,0.06)"}`,
                textShadow: data.completed ? `0 0 8px ${color}80` : "none",
              }}
            >
              {data.name}
            </span>
          </div>
        </Html>
      </group>
    </Float>
  );
}


// ════════════════════════════════════════════════════════════
// ORBITAL RINGS — InstancedMesh for performance
// ════════════════════════════════════════════════════════════
function OrbitalRings() {
  const ring1Ref = useRef<THREE.InstancedMesh>(null!);
  const ring2Ref = useRef<THREE.InstancedMesh>(null!);
  const RING_COUNT = 200;

  // Pre-compute base positions
  const { ring1Data, ring2Data } = useMemo(() => {
    const r1: { angle: number; radius: number; y: number }[] = [];
    const r2: { angle: number; radius: number; y: number }[] = [];
    for (let i = 0; i < RING_COUNT; i++) {
      const a1 = (i / RING_COUNT) * Math.PI * 2;
      r1.push({
        angle: a1,
        radius: 4.2 + (Math.random() - 0.5) * 0.4,
        y: Math.sin(a1 * 3) * 0.3,
      });
      const a2 = (i / RING_COUNT) * Math.PI * 2;
      r2.push({
        angle: a2,
        radius: 5.0 + (Math.random() - 0.5) * 0.5,
        y: Math.cos(a2 * 4) * 0.25,
      });
    }
    return { ring1Data: r1, ring2Data: r2 };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Ring 1: violet, rotate forward
    if (ring1Ref.current) {
      ring1Data.forEach((d, i) => {
        const angle = d.angle + t * 0.06;
        dummy.position.set(
          Math.cos(angle) * d.radius,
          d.y + Math.sin(t * 0.5 + i * 0.3) * 0.05,
          Math.sin(angle) * d.radius
        );
        dummy.scale.setScalar(0.015 + Math.sin(t + i) * 0.003);
        dummy.updateMatrix();
        ring1Ref.current.setMatrixAt(i, dummy.matrix);
      });
      ring1Ref.current.instanceMatrix.needsUpdate = true;
    }

    // Ring 2: cyan, rotate backward
    if (ring2Ref.current) {
      ring2Data.forEach((d, i) => {
        const angle = d.angle - t * 0.04;
        dummy.position.set(
          Math.cos(angle) * d.radius,
          d.y + Math.sin(t * 0.4 + i * 0.2) * 0.04,
          Math.sin(angle) * d.radius
        );
        dummy.scale.setScalar(0.012 + Math.sin(t * 0.7 + i) * 0.002);
        dummy.updateMatrix();
        ring2Ref.current.setMatrixAt(i, dummy.matrix);
      });
      ring2Ref.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={ring1Ref} args={[undefined, undefined, RING_COUNT]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
      <instancedMesh ref={ring2Ref} args={[undefined, undefined, RING_COUNT]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
}


// ════════════════════════════════════════════════════════════
// AMBIENT DUST — InstancedMesh (500 particles)
// ════════════════════════════════════════════════════════════
function AmbientDust() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const COUNT = 500;

  const dustData = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number; offset: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 16,
        speed: 0.2 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    dustData.forEach((d, i) => {
      dummy.position.set(
        d.x + Math.sin(t * d.speed + d.offset) * 0.1,
        d.y + Math.sin(t * 0.3 + i) * 0.003 * t,
        d.z + Math.cos(t * d.speed * 0.5 + d.offset) * 0.08
      );
      dummy.scale.setScalar(0.01 + Math.sin(t + d.offset) * 0.003);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.rotation.y = t * 0.008;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color="#c4b5fd"
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}


// ════════════════════════════════════════════════════════════
// SANCTUARY SCENE — Main exported component (no Canvas)
// ════════════════════════════════════════════════════════════
export default function SanctuaryScene({
  crystals: externalCrystals,
  onCrystalClick,
}: SanctuarySceneProps) {
  // Use real crystals if available; fall back to demo for unauthenticated/marketing view
  const activeCrystals = externalCrystals.length > 0 ? externalCrystals : DEMO_CRYSTALS;

  // Dynamic ring positions based on crystal count
  const positions = useMemo(
    () => computeRingPositions(activeCrystals.length),
    [activeCrystals.length]
  );

  const clockRef = useRef<THREE.Clock | null>(null);

  // Get clock from Three.js state for explosion start times
  const { clock } = useThree();
  clockRef.current = clock;

  // ── Explosion state ───────────────────────────────────────
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);
  const [shockwaves, setShockwaves] = useState<
    { id: string; origin: THREE.Vector3; color: string; startTime: number }[]
  >([]);

  // Spawn explosion at a position
  const spawnExplosion = useCallback(
    (position: [number, number, number], color: string, streak: number) => {
      const now = clockRef.current?.elapsedTime ?? 0;
      const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setExplosions((prev) => [
        ...prev,
        {
          id,
          origin: new THREE.Vector3(...position),
          color,
          streak,
          startTime: now,
        },
      ]);
      setShockwaves((prev) => [
        ...prev,
        {
          id: `sw-${id}`,
          origin: new THREE.Vector3(...position),
          color,
          startTime: now,
        },
      ]);
    },
    []
  );

  // ── Listen for global celebration events from store ───────
  useEffect(() => {
    const unsub = onCelebration((event: CelebrationEvent) => {
      spawnExplosion(event.position, event.color, event.streak);
    });
    return unsub;
  }, [spawnExplosion]);

  // ── Crystal click handler (also spawns local explosion) ───
  const handleCrystalClick = useCallback(
    (crystal: CrystalData) => {
      const color = getCrystalColor(crystal.category, crystal.color);
      spawnExplosion(crystal.position, color, crystal.streak);
      onCrystalClick?.(crystal.id);
    },
    [onCrystalClick, spawnExplosion]
  );

  const removeExplosion = useCallback((id: string) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const removeShockwave = useCallback((id: string) => {
    setShockwaves((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <>
      {/* ── Lighting rig ────────────────────────────────── */}
      <ambientLight intensity={0.08} color="#c4b5fd" />
      <pointLight position={[5, 6, 3]} intensity={0.7} color="#a78bfa" distance={20} decay={2} />
      <pointLight position={[-4, 2, 4]} intensity={0.3} color="#6366f1" distance={15} decay={2} />
      <pointLight position={[0, 3, -6]} intensity={0.25} color="#22d3ee" distance={15} decay={2} />
      <pointLight position={[0, -3, 0]} intensity={0.15} color="#d946ef" distance={8} decay={2} />

      {/* ── Fog for depth ───────────────────────────────── */}
      <fog attach="fog" args={["#0a0a0f", 8, 28]} />

      {/* ── Background stars ────────────────────────────── */}
      <Stars radius={60} depth={60} count={3000} factor={2.5} saturation={0.3} speed={0.3} />

      {/* ── Floating island base ────────────────────────── */}
      <IslandBase />

      {/* ── Habit crystals (custom shimmer shader) ──────── */}
      {activeCrystals.map((crystal, i) => (
        <HabitCrystal
          key={crystal.id}
          data={{
            ...crystal,
            position: crystal.position ?? positions[i] ?? DEFAULT_POSITIONS[i % DEFAULT_POSITIONS.length],
          }}
          onClick={() => handleCrystalClick(crystal)}
        />
      ))}

      {/* ── Completion explosions (1000-particle burst) ─── */}
      {explosions.map((exp) => (
        <CompletionExplosion
          key={exp.id}
          explosion={exp}
          onComplete={removeExplosion}
        />
      ))}

      {/* ── Shockwave rings ──────────────────────────────── */}
      {shockwaves.map((sw) => (
        <CompletionShockwave
          key={sw.id}
          origin={sw.origin}
          color={sw.color}
          startTime={sw.startTime}
          onComplete={() => removeShockwave(sw.id)}
        />
      ))}

      {/* ── Orbital particle rings (InstancedMesh) ──────── */}
      <OrbitalRings />

      {/* ── Ambient dust (InstancedMesh) ─────────────────── */}
      <AmbientDust />

      {/* ── Post-processing ─────────────────────────────── */}
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={0.15}
          luminanceSmoothing={0.7}
          intensity={1.5}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0008, 0.0008)}
          radialModulation={false}
          modulationOffset={0}
        />
        <DepthOfField
          focusDistance={0}
          focalLength={0.06}
          bokehScale={2}
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={0.15}
        />
      </EffectComposer>

      {/* ── Camera controls — mobile friendly with touch ── */}
      <OrbitControls
        enableZoom
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.25}
        maxPolarAngle={Math.PI / 1.6}
        minPolarAngle={Math.PI / 4}
        maxDistance={14}
        minDistance={5}
        dampingFactor={0.05}
        enableDamping
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
    </>
  );
}
