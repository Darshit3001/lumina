// ============================================================
// Dashboard — Full-screen 3D Sanctuary with liquid glass HUD
// Uses completeHabit() for DB persistence + 3D celebration
// ============================================================

"use client";

import { Suspense, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import {
  Loader2,
  Gem,
  Sparkles,
  CheckCircle2,
  Flame,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useHabitStore } from "@/stores/habitStore";
import { playCompletionChime, playExplosionBurst, playSuccessFanfare, playHoverTick } from "@/lib/sounds";
import type { CrystalData } from "@/components/three/Sanctuary";

const SanctuaryScene = dynamic(
  () => import("@/components/three/Sanctuary"),
  { ssr: false }
);

// ── Default crystal positions (ring layout) ─────────────────
const POSITIONS: [number, number, number][] = [
  [-2.2,  1.0, -0.5],
  [ 1.8,  1.4,  0.8],
  [-0.5,  1.8, -2.0],
  [ 2.5,  0.8, -1.5],
  [-1.8,  1.2,  1.8],
  [ 0.8,  2.0,  1.5],
  [-2.8,  0.6,  0.5],
  [ 0.0,  1.6, -1.0],
];

// ── Dynamic crystal positions ───────────────────────────
/** Compute circular positions for N crystals */
function computeRingPositions(count: number): [number, number, number][] {
  if (count <= POSITIONS.length) {
    return POSITIONS.slice(0, count);
  }
  const radius = 2.5;
  const positions: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const y = 1.0 + Math.sin(angle * 2) * 0.4;
    positions.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
  }
  return positions;
}

/** Category → color fallback */
const CATEGORY_COLORS: Record<string, string> = {
  wellness: "#a78bfa", fitness: "#22d3ee", learning: "#6366f1",
  mindfulness: "#d946ef", creativity: "#f472b6", general: "#a78bfa",
};

function getCrystalColor(cat: string, custom?: string) {
  if (custom && custom !== "#a855f7") return custom;
  return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.general;
}

/** Fullscreen loader */
function SanctuaryLoader() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-[#a78bfa]/15 blur-2xl animate-pulse-glow" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl glass">
          <Loader2 className="h-6 w-6 animate-spin text-[#a78bfa]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white/60">
          Materializing your Sanctuary...
        </p>
        <p className="mt-1 text-xs text-white/25">
          Crystals are forming from your habits
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const habits = useHabitStore((s) => s.habits);
  const entries = useHabitStore((s) => s.entries);
  const completeHabit = useHabitStore((s) => s.completeHabit);
  const getHabitStreak = useHabitStore((s) => s.getHabitStreak);
  const completionRate = useHabitStore((s) => s.getTodayCompletionRate());
  const today = new Date().toISOString().split("T")[0];
  const activeHabits = habits.filter((h) => !h.isArchived);

  // Map habits → CrystalData for 3D
  const crystals: CrystalData[] = useMemo(() => {
    const ringPositions = computeRingPositions(activeHabits.length);
    return activeHabits.map((h, i) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      color: getCrystalColor(h.category, h.color),
      streak: getHabitStreak(h.id),
      completed: entries.some(
        (e) => e.habitId === h.id && e.date.startsWith(today) && e.completed
      ),
      position: ringPositions[i] ?? POSITIONS[i % POSITIONS.length],
    }));
  }, [activeHabits, entries, today, getHabitStreak]);

  // Crystal click → completeHabit (DB + celebration event)
  const handleCrystalClick = useCallback(
    (habitId: string) => {
      const crystal = crystals.find((c) => c.id === habitId);
      if (!crystal || crystal.completed) return;
      playCompletionChime();
      playExplosionBurst();
      // Fanfare on milestone streaks
      if (crystal.streak > 0 && (crystal.streak + 1) % 7 === 0) {
        setTimeout(playSuccessFanfare, 300);
      }
      completeHabit(habitId, crystal.position, crystal.color);
    },
    [crystals, completeHabit]
  );

  const todayCrystals = crystals.length > 0 ? crystals : [];
  const completedCount = todayCrystals.filter((c) => c.completed).length;
  const hasHabits = activeHabits.length > 0;

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#0a0a0f]">
      {/* ── Full-screen 3D Canvas ─────────────────────────── */}
      <Suspense fallback={<SanctuaryLoader />}>
        <Canvas
          camera={{ position: [0, 2.5, 9], fov: 48 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          className="!absolute inset-0"
          style={{ background: "#0a0a0f", touchAction: "none" }}
        >
          <SanctuaryScene
            crystals={crystals}
            onCrystalClick={handleCrystalClick}
          />
        </Canvas>
      </Suspense>

      {/* ── Top-left: Progress ring ───────────────────────── */}
      {hasHabits && (
        <div className="absolute left-5 top-5 glass rounded-2xl px-5 py-4 glass-hover">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="2.5"
                />
                <circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2.5"
                  strokeDasharray={`${completionRate * 0.88} 88`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{ filter: "drop-shadow(0 0 6px rgba(167,139,250,0.6))" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80">
                {completionRate}%
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30">Today</p>
              <p className="text-sm font-semibold text-white/70">
                {completedCount}/{todayCrystals.length} crystals
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Top-right: Streak counter ─────────────────────── */}
      {hasHabits && (
        <div className="absolute right-5 top-5 glass rounded-2xl px-5 py-4 glass-hover">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d946ef]/10">
              <Flame
                className="h-5 w-5 text-[#d946ef]"
                style={{ filter: "drop-shadow(0 0 6px #d946ef99)" }}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/30">Streak</p>
              <p className="text-2xl font-bold text-white/90 animate-count-up">
                {Math.max(...todayCrystals.map((c) => c.streak), 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom: Active crystals panel ─────────────────── */}
      {hasHabits && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-2xl px-5">
          <div className="glass rounded-2xl p-4 glass-shine-effect relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gem className="h-4 w-4 text-[#a78bfa]" style={{ filter: "drop-shadow(0 0 4px #a78bfa88)" }} />
                <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Active Crystals
                </span>
              </div>
              <span className="text-[11px] text-white/25">
                Click crystals in 3D to complete
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {todayCrystals.map((crystal) => (
                <button
                  key={crystal.id}
                  onClick={() => handleCrystalClick(crystal.id)}
                  className={`group flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 shrink-0 ${
                    crystal.completed
                      ? "glass border border-[#a78bfa]/20"
                      : "bg-white/[0.03] border border-white/[0.06] hover:border-white/10 hover:bg-white/[0.05]"
                  }`}
                >
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: crystal.color,
                      boxShadow: crystal.completed
                        ? `0 0 10px ${crystal.color}60`
                        : "none",
                    }}
                  />
                  <span className={`text-xs font-medium whitespace-nowrap ${
                    crystal.completed ? "text-white/70" : "text-white/45"
                  }`}>
                    {crystal.name}
                  </span>
                  {crystal.completed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#a78bfa] shrink-0" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-white/20 group-hover:text-white/40 shrink-0 transition-colors" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          EMPTY STATE — Immersive "Create your first crystal"
         ══════════════════════════════════════════════════════ */}
      {!hasHabits && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
          <div className="pointer-events-auto relative max-w-lg w-full">
            {/* Outer pulsating rings */}
            <div className="absolute inset-[-40px] rounded-full border border-[#a78bfa]/12 animate-ping" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-[-25px] rounded-full border border-[#d946ef]/10 animate-ping" style={{ animationDuration: "4s", animationDelay: "0.5s" }} />
            <div className="absolute inset-[-60px] rounded-full border border-[#22d3ee]/8 animate-ping" style={{ animationDuration: "5s", animationDelay: "1s" }} />
            <div className="absolute inset-[-80px] rounded-full border border-[#6366f1]/5 animate-ping" style={{ animationDuration: "6s", animationDelay: "1.5s" }} />

            {/* Volumetric glow backdrop */}
            <div className="absolute -inset-24 rounded-full bg-gradient-to-br from-[#a78bfa]/12 via-[#d946ef]/8 to-[#22d3ee]/6 blur-[100px] animate-pulse-glow" />
            <div className="absolute -inset-12 rounded-full bg-[#a78bfa]/5 blur-[60px] animate-pulse-glow" style={{ animationDelay: "1s" }} />

            <div className="glass rounded-3xl px-10 py-12 text-center relative overflow-hidden border border-white/[0.1] shadow-[0_0_80px_rgba(167,139,250,0.12),0_0_120px_rgba(217,70,239,0.06)]">
              {/* Animated shine sweep */}
              <div className="glass-shine-effect absolute inset-0" />

              {/* Inner neon border glow */}
              <div className="absolute inset-0 rounded-3xl border border-[#a78bfa]/15 shadow-[inset_0_0_30px_rgba(167,139,250,0.05)]" />

              {/* Floating gem with layered glow */}
              <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
                {/* Triple glow layers */}
                <div className="absolute inset-0 rounded-full bg-[#a78bfa]/10 blur-3xl animate-pulse-glow" />
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#a78bfa]/20 to-[#d946ef]/15 blur-2xl animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
                <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#a78bfa]/25 to-[#d946ef]/20 blur-xl" />

                {/* Orbiting ring */}
                <div className="absolute inset-[-8px] rounded-full border border-[#a78bfa]/20 animate-spin" style={{ animationDuration: "12s" }}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#a78bfa] shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                </div>
                <div className="absolute inset-[-16px] rounded-full border border-[#22d3ee]/10 animate-spin" style={{ animationDuration: "20s", animationDirection: "reverse" }}>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#22d3ee] shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                </div>

                {/* Gem icon with subtle rotation */}
                <div className="relative flex h-22 w-22 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#d946ef] shadow-[0_0_50px_rgba(167,139,250,0.6),0_0_100px_rgba(167,139,250,0.25),0_0_150px_rgba(217,70,239,0.1)] animate-float"
                  style={{ animation: "float 3s ease-in-out infinite, spin 20s linear infinite" }}
                >
                  <Gem className="h-10 w-10 text-white drop-shadow-lg" />
                </div>
              </div>

              <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.3em] text-[#a78bfa]/50 mb-4">
                Your Sanctuary Awaits
              </span>

              <h2 className="text-3xl font-bold tracking-tight text-white/90 mb-4">
                Create Your First{" "}
                <span className="bg-gradient-to-r from-[#a78bfa] via-[#d946ef] to-[#22d3ee] bg-clip-text text-transparent">
                  Crystal
                </span>
              </h2>

              <p className="text-sm leading-relaxed text-white/40 mb-10 max-w-sm mx-auto">
                Each habit becomes a glowing crystal in your 3D sanctuary.
                It grows taller with your streak, pulses with energy, and
                explodes with 800+ particles when you complete it.
              </p>

              {/* CTA Button with hover sound */}
              <Link
                href="/habits"
                onMouseEnter={() => playHoverTick()}
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#a78bfa] via-[#d946ef] to-[#a78bfa] bg-[length:200%_100%] animate-shimmer px-8 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(167,139,250,0.4),0_0_60px_rgba(167,139,250,0.15)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(167,139,250,0.6),0_0_100px_rgba(167,139,250,0.2)] hover:scale-105"
              >
                <Plus className="h-5 w-5" />
                <span>Create First Crystal</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>

              <p className="mt-6 text-[11px] text-white/15">
                Takes 10 seconds · Your sanctuary starts building immediately
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
