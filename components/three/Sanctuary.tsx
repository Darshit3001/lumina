// ============================================================
// Sanctuary — Full 3D scene: floating island, premium crystals,
// ambient particles, completion explosions, postprocessing
// ============================================================

"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Html, OrbitControls, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { useQualityStore } from "@/stores/qualityStore";
import { onCelebration, type CelebrationEvent } from "@/stores/habitStore";
import CompletionExplosion, {
  CompletionShockwave,
  type ExplosionInstance,
} from "./CompletionExplosion";

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

interface SanctuaryProps {
  crystals: CrystalData[];
  onCrystalClick: (habitId: string) => void;
}

// ── Fresnel shader for rim lighting ─────────────────────────
const fresnelVertex = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vUv = uv;
    // Subtle organic vertex displacement
    vec3 displaced = position;
    float wave = sin(position.y * 3.0 + uTime * 0.8) * 0.02;
    displaced += normal * wave;

    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fresnelFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uCompleted;
  uniform float uTime;

  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    float fresnel = pow(1.0 - dot(vWorldNormal, vViewDir), 3.5);
    
    // Emissive core glow — stronger on completed
    vec3 coreGlow = uColor * (0.4 + uCompleted * 0.6);
    
    // Rim light — vivid when completed
    float rimStrength = 0.7 + uCompleted * 0.8;
    vec3 rimColor = uColor * fresnel * rimStrength * 2.0;
    
    // Rainbow-shift shimmer
    float shimmer = sin(vUv.y * 25.0 + uTime * 2.5) * 0.05;
    float rainbowShift = sin(vUv.x * 10.0 + uTime * 1.2) * 0.02;
    
    vec3 finalColor = coreGlow + rimColor + shimmer + rainbowShift;
    float alpha = 0.2 + fresnel * 0.7 + uCompleted * 0.2;
    
    gl_FragColor = vec4(finalColor, alpha * uOpacity);
  }
`;

// ════════════════════════════════════════════════════════════
// CRYSTAL COMPONENT — Premium faceted gem with physical material
// ════════════════════════════════════════════════════════════
interface CrystalProps {
  data: CrystalData;
  onClick: () => void;
}

function Crystal({ data, onClick }: CrystalProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const fresnelRef = useRef<THREE.ShaderMaterial>(null!);
  const preset = useQualityStore((s) => s.preset);
  const frameCount = useRef(0);

  const color = useMemo(() => new THREE.Color(data.color), [data.color]);

  // Fresnel overlay uniforms
  const fresnelUniforms = useMemo(
    () => ({
      uColor: { value: color },
      uOpacity: { value: 1.0 },
      uCompleted: { value: data.completed ? 1.0 : 0.0 },
      uTime: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.color]
  );

  // Animate
  useFrame((state) => {
    frameCount.current++;
    if (preset.throttleFrames > 0 && frameCount.current % (preset.throttleFrames + 1) !== 0) return;

    const t = state.clock.elapsedTime;

    if (meshRef.current) {
      // Smooth gentle rotation
      meshRef.current.rotation.y = t * 0.15 + data.position[0];
      meshRef.current.rotation.x = Math.sin(t * 0.1 + data.position[2]) * 0.05;
    }

    if (fresnelRef.current) {
      fresnelRef.current.uniforms.uTime.value = t;
      // Smooth transition for completed state
      const target = data.completed ? 1.0 : 0.0;
      const current = fresnelRef.current.uniforms.uCompleted.value;
      fresnelRef.current.uniforms.uCompleted.value += (target - current) * 0.05;
    }

    // Glow pulse
    if (glowRef.current) {
      const pulse = data.completed
        ? 1.2 + Math.sin(t * 3) * 0.3
        : 0.8 + Math.sin(t * 1.5) * 0.15;
      glowRef.current.scale.setScalar(pulse);
    }
  });

  const segments = preset.crystalSegments;

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.15}
      floatIntensity={0.4}
      floatingRange={[-0.1, 0.1]}
    >
      <group position={data.position}>
        {/* Main crystal — MeshPhysicalMaterial for ultra realism */}
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          castShadow
        >
          <icosahedronGeometry args={[0.55, segments]} />
          <meshPhysicalMaterial
            color={data.color}
            transmission={0.95}
            roughness={0.02}
            metalness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.02}
            ior={2.42}
            thickness={2.2}
            envMapIntensity={2.5}
            emissive={data.color}
            emissiveIntensity={data.completed ? 0.9 : 0.25}
            transparent
            opacity={0.96}
            toneMapped={false}
            attenuationColor={new THREE.Color(data.color)}
            attenuationDistance={1.5}
            specularIntensity={1.5}
            sheen={0.3}
            sheenColor={new THREE.Color(data.color)}
          />
        </mesh>

        {/* Fresnel rim light overlay */}
        <mesh scale={0.57}>
          <icosahedronGeometry args={[1, segments]} />
          <shaderMaterial
            ref={fresnelRef}
            vertexShader={fresnelVertex}
            fragmentShader={fresnelFragment}
            uniforms={fresnelUniforms}
            transparent
            depthWrite={false}
            side={THREE.FrontSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Inner glow sphere */}
        <mesh ref={glowRef} scale={0.9}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={data.completed ? 0.18 : 0.06}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer volumetric halo */}
        <mesh scale={1.4}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={data.completed ? 0.06 : 0.02}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Streak fire particles (streak > 7) */}
        {data.streak >= 7 && (
          <Sparkles
            count={10 + Math.min(data.streak, 30)}
            scale={1.2}
            size={2}
            speed={0.4}
            color={data.color}
            opacity={0.6}
          />
        )}

        {/* Label — always sharp via Html */}
        <Html
          position={[0, -0.9, 0]}
          center
          distanceFactor={8}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="whitespace-nowrap text-[11px] font-semibold tracking-tight drop-shadow-lg"
              style={{
                color: data.completed ? data.color : "rgba(255,255,255,0.55)",
                textShadow: data.completed
                  ? `0 0 8px ${data.color}88, 0 0 16px ${data.color}44`
                  : "0 0 4px rgba(0,0,0,0.8)",
              }}
            >
              {data.name}
            </span>
            {data.streak > 0 && (
              <span
                className="text-[9px] font-medium"
                style={{ color: `${data.color}99` }}
              >
                🔥 {data.streak}d
              </span>
            )}
          </div>
        </Html>
      </group>
    </Float>
  );
}

// ════════════════════════════════════════════════════════════
// FLOATING ISLAND — Base platform for the Sanctuary
// ════════════════════════════════════════════════════════════
function FloatingIsland() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <group position={[0, -0.8, 0]}>
      {/* Top surface — flat disc */}
      <mesh ref={meshRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[4.5, 3.5, 0.8, 32, 1]} />
        <meshPhysicalMaterial
          color="#0d0d1a"
          roughness={0.7}
          metalness={0.3}
          clearcoat={0.3}
          emissive="#1a1a30"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Edge glow ring */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.2, 0.04, 8, 64]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Under-glow */}
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[3.5, 16, 8]} />
        <meshBasicMaterial
          color="#6366f1"
          transparent
          opacity={0.03}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ════════════════════════════════════════════════════════════
// AMBIENT PARTICLES — Floating cosmic dust
// ════════════════════════════════════════════════════════════
function AmbientParticles() {
  const preset = useQualityStore((s) => s.preset);
  const count = preset.ambientParticles;

  return (
    <>
      {/* Primary violet dust */}
      <Sparkles
        count={count}
        scale={14}
        size={1.8}
        speed={0.15}
        color="#a78bfa"
        opacity={0.35}
      />
      {/* Secondary cyan motes */}
      <Sparkles
        count={Math.round(count * 0.3)}
        scale={10}
        size={1.2}
        speed={0.25}
        color="#22d3ee"
        opacity={0.2}
      />
      {/* Faint fuchsia wisps */}
      <Sparkles
        count={Math.round(count * 0.15)}
        scale={16}
        size={2.2}
        speed={0.08}
        color="#d946ef"
        opacity={0.12}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// SCENE LIGHTING
// ════════════════════════════════════════════════════════════
function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.25} color="#c4b5fd" />
      <hemisphereLight intensity={0.2} color="#e0d4ff" groundColor="#0d0d1a" />
      {/* Key light — warm violet */}
      <directionalLight
        position={[5, 8, 3]}
        intensity={1.0}
        color="#e0d4ff"
        castShadow
      />
      {/* Fill light — cool cyan */}
      <directionalLight
        position={[-3, 6, -4]}
        intensity={0.4}
        color="#22d3ee"
      />
      {/* Rim/back light for depth */}
      <directionalLight
        position={[0, 3, -6]}
        intensity={0.3}
        color="#d946ef"
      />
      <pointLight position={[-3, 4, -2]} intensity={0.6} color="#a78bfa" distance={14} />
      <pointLight position={[3, 3, 2]} intensity={0.5} color="#22d3ee" distance={12} />
      <pointLight position={[0, 2, 0]} intensity={0.4} color="#d946ef" distance={10} />
      {/* Ground bounce */}
      <pointLight position={[0, -1, 0]} intensity={0.15} color="#6366f1" distance={8} />
    </>
  );
}

// ════════════════════════════════════════════════════════════
// POSTPROCESSING
// ════════════════════════════════════════════════════════════
function PostFX() {
  const preset = useQualityStore((s) => s.preset);
  if (!preset.enablePostProcessing) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={preset.bloomIntensity}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.95}
        mipmapBlur
        levels={6}
      />
    </EffectComposer>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN SANCTUARY SCENE
// ════════════════════════════════════════════════════════════
export default function SanctuaryScene({ crystals, onCrystalClick }: SanctuaryProps) {
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);
  const [shockwaves, setShockwaves] = useState<{ id: string; origin: THREE.Vector3; color: string; startTime: number }[]>([]);
  const clockRef = useRef<THREE.Clock | null>(null);
  const { clock } = useThree();

  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  // Listen for celebration events from the habit store
  useEffect(() => {
    const unsub = onCelebration((event: CelebrationEvent) => {
      const origin = new THREE.Vector3(...event.position);
      const id = `exp-${Date.now()}-${Math.random()}`;
      const startTime = clockRef.current?.elapsedTime ?? 0;

      setExplosions((prev) => [
        ...prev,
        { id, origin, color: event.color, streak: event.streak, startTime },
      ]);
      setShockwaves((prev) => [
        ...prev,
        { id: `sw-${id}`, origin, color: event.color, startTime },
      ]);
    });
    return unsub;
  }, []);

  const removeExplosion = useCallback((id: string) => {
    setExplosions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const removeShockwave = useCallback((id: string) => {
    setShockwaves((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <>
      {/* Environment for reflections */}
      <Environment preset="night" />

      {/* Lighting */}
      <SceneLighting />

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 6}
        autoRotate
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
        enableDamping
      />

      {/* Floating island */}
      <FloatingIsland />

      {/* Crystals */}
      {crystals.map((crystal) => (
        <Crystal
          key={crystal.id}
          data={crystal}
          onClick={() => onCrystalClick(crystal.id)}
        />
      ))}

      {/* Ambient particles */}
      <AmbientParticles />

      {/* Completion explosions */}
      {explosions.map((exp) => (
        <CompletionExplosion
          key={exp.id}
          explosion={exp}
          onComplete={removeExplosion}
        />
      ))}

      {/* Shockwave rings */}
      {shockwaves.map((sw) => (
        <CompletionShockwave
          key={sw.id}
          origin={sw.origin}
          color={sw.color}
          startTime={sw.startTime}
          onComplete={() => removeShockwave(sw.id)}
        />
      ))}

      {/* Postprocessing */}
      <PostFX />
    </>
  );
}
