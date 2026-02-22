// ============================================================
// Quality Settings Store — Performance presets for 3D rendering
// Auto-detects mobile/low-end devices, user can override
// ============================================================

import { create } from "zustand";

export type QualityLevel = "low" | "medium" | "high" | "premium";

interface QualityPreset {
  maxParticles: number;          // total particles per explosion
  ambientParticles: number;      // floating ambient particles
  ringParticles: number;         // shockwave ring particles
  bloomIntensity: number;
  chromaticAberration: boolean;
  crystalSegments: number;       // icosahedron detail level
  throttleFrames: number;        // skip N frames in useFrame (0 = every frame)
  enablePostProcessing: boolean;
  shadowQuality: number;
}

const PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    maxParticles: 200,
    ambientParticles: 50,
    ringParticles: 50,
    bloomIntensity: 0.4,
    chromaticAberration: false,
    crystalSegments: 2,
    throttleFrames: 2,       // every 3rd frame
    enablePostProcessing: false,
    shadowQuality: 0,
  },
  medium: {
    maxParticles: 400,
    ambientParticles: 120,
    ringParticles: 100,
    bloomIntensity: 0.8,
    chromaticAberration: false,
    crystalSegments: 4,
    throttleFrames: 1,       // every 2nd frame
    enablePostProcessing: true,
    shadowQuality: 512,
  },
  high: {
    maxParticles: 400,
    ambientParticles: 200,
    ringParticles: 200,
    bloomIntensity: 0.8,
    chromaticAberration: true,
    crystalSegments: 6,
    throttleFrames: 0,       // every frame
    enablePostProcessing: true,
    shadowQuality: 1024,
  },
  premium: {
    maxParticles: 800,
    ambientParticles: 550,
    ringParticles: 400,
    bloomIntensity: 1.3,
    chromaticAberration: true,
    crystalSegments: 10,
    throttleFrames: 0,
    enablePostProcessing: true,
    shadowQuality: 2048,
  },
};

interface QualityState {
  level: QualityLevel;
  preset: QualityPreset;
  setLevel: (level: QualityLevel) => void;
}

/** Detect device capabilities */
function detectDefaultQuality(): QualityLevel {
  if (typeof window === "undefined") return "medium";

  // Mobile / touch → low
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) return "low";

  // Check device memory (Chrome-only API)
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (nav.deviceMemory && nav.deviceMemory < 4) return "low";

  // Check GPU via WebGL renderer string
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        const renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // Integrated GPUs → medium
        if (renderer.includes("intel") || renderer.includes("mesa") || renderer.includes("swiftshader")) {
          return "medium";
        }
      }
    }
  } catch {
    // ignore
  }

  return "premium";
}

function getStoredLevel(): QualityLevel | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("lumina-quality");
  if (stored === "low" || stored === "medium" || stored === "high" || stored === "premium") return stored;
  return null;
}

export const useQualityStore = create<QualityState>((set) => {
  const initial = getStoredLevel() ?? detectDefaultQuality();
  return {
    level: initial,
    preset: PRESETS[initial],
    setLevel: (level) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("lumina-quality", level);
      }
      set({ level, preset: PRESETS[level] });
    },
  };
});
