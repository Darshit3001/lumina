"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Sparkles, Float, Sphere, Stars, CameraControls } from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import * as THREE from "three";
import { onCelebration } from "@/stores/habitStore";

// ── Glow Core (The blinding crystal orb) ────────────────────
function GlowingCore() {
    const meshRef = useRef<THREE.Mesh>(null!);
    const lightRef = useRef<THREE.PointLight>(null!);

    // Pulse animation on habit completion
    const targetIntensity = useRef(1);
    const currentIntensity = useRef(1);

    useEffect(() => {
        return onCelebration(() => {
            targetIntensity.current = 5; // spike the brightness
        });
    }, []);

    useFrame((state) => {
        // Smoooth decay of light
        targetIntensity.current = THREE.MathUtils.lerp(targetIntensity.current, 1, 0.02);
        currentIntensity.current = THREE.MathUtils.lerp(currentIntensity.current, targetIntensity.current, 0.1);

        if (lightRef.current) lightRef.current.intensity = currentIntensity.current * 4;
        if (meshRef.current) {
            const mat = meshRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = currentIntensity.current * 2;
            // Pulse scale
            const s = 1 + (currentIntensity.current - 1) * 0.1;
            meshRef.current.scale.set(s, s, s);
        }
    });

    return (
        <group position={[0, 1.2, 0]}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
                <pointLight ref={lightRef} color="#00ffff" distance={10} decay={2} />
                <Sphere ref={meshRef} args={[0.4, 64, 64]}>
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#00e5ff"
                        roughness={0.1}
                        metalness={0.8}
                        envMapIntensity={2}
                    />
                </Sphere>
            </Float>
        </group>
    );
}

// ── The Liquid Metal Hand ───────────────────────────────────
function HandModel() {
    // WebXR generic hand profile
    const { scene } = useGLTF("/models/hand.glb");
    const modelRef = useRef<THREE.Group>(null!);

    // Build the super-premium Chrome/Iridescent material
    const liquidMetal = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: "#0a0a0a", // deep black base
        metalness: 1,
        roughness: 0.15, // slightly rough to catch broad light spreads
        clearcoat: 1,    // glossy exterior
        clearcoatRoughness: 0.1,
        // Note: Iridescence properties may be ignored if Three.js version is older, 
        // but the clearcoat and metalness still look extremely premium.
        iridescence: 1,
        iridescenceIOR: 1.5,
        iridescenceThicknessRange: [100, 400],
        side: THREE.DoubleSide
    }), []);

    // Apply material recursively to all parts of the hand
    useEffect(() => {
        scene.traverse((node: any) => {
            if (node.isMesh) {
                node.material = liquidMetal;
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
    }, [scene, liquidMetal]);

    useFrame((state) => {
        if (modelRef.current) {
            // Very slow, majestic drift matching the reference video
            modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1 + Math.PI / 1.8;
            modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05 + -1.8;
        }
    });

    // Standard generic hands are small, so we scale it up and position it holding the orb
    return (
        <group ref={modelRef} scale={[12, 12, 12]} position={[1, -1.8, 0]} rotation={[0.4, Math.PI / 1.8, -0.6]}>
            <primitive object={scene} />
        </group>
    );
}

// ── Stardust Particles (Noise-driven drift) ─────────────────
function AmbientStardust() {
    return (
        <group position={[0, 1, 0]}>
            {/* Cyan particles */}
            <Sparkles count={300} scale={8} size={2} speed={0.4} opacity={0.5} color="#00e5ff" />
            {/* Pink/Magenta particles */}
            <Sparkles count={200} scale={10} size={1.5} speed={0.2} opacity={0.3} color="#d946ef" />
            {/* White inner dust */}
            <Sparkles count={100} scale={4} size={3} speed={0.8} opacity={0.8} color="#ffffff" />
        </group>
    );
}

// ── Main Scene ──────────────────────────────────────────────
export default function CosmicHandScene() {
    return (
        <Canvas
            camera={{ position: [0, 1.2, 5], fov: 45 }}
            style={{ background: "#05020a" }} // Deep cosmic void
            gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        >
            <color attach="background" args={["#05020a"]} />

            {/* Volumetric Fog imitating Nebula density */}
            <fogExp2 attach="fog" args={["#0a0514", 0.08]} />

            {/* Extreme backlighting (Rim light) for dramatic silhouette */}
            <directionalLight position={[-5, 5, -5]} intensity={3} color="#d946ef" />
            <directionalLight position={[5, -5, -5]} intensity={1} color="#22d3ee" />

            <HandModel />
            <GlowingCore />

            <AmbientStardust />

            <Stars radius={50} depth={30} count={3000} factor={4} saturation={1} fade speed={0.5} />

            {/* Insane Bloom Post-Processing that matches the reference blinding light */}
            <EffectComposer multisampling={4}>
                <Bloom
                    luminanceThreshold={0.5}
                    mipmapBlur
                    intensity={1.5}
                    radius={0.8}
                />
                <ToneMapping mode={THREE.ACESFilmicToneMapping} />
            </EffectComposer>

        </Canvas>
    );
}
