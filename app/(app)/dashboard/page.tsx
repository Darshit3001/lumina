"use client";

import { Suspense, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Loader2,
  Gem,
  Sparkles,
  CheckCircle2,
  Flame,
  Plus,
  ArrowRight,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { useHabitStore } from "@/stores/habitStore";
import { playCompletionChime, playExplosionBurst, playSuccessFanfare, playHoverTick } from "@/lib/sounds";
import ActivityHeatmap from "@/components/ui/ActivityHeatmap";

const CosmicHandScene = dynamic(
  () => import("@/components/three/CosmicHandScene"),
  { ssr: false }
);

function CosmicLoader() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#05020a]">
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-[#00e5ff]/20 blur-2xl animate-pulse-glow" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl glass border border-[#00e5ff]/20">
          <Loader2 className="h-6 w-6 animate-spin text-[#00e5ff]" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium tracking-widest uppercase text-white/50">
          Materializing Core...
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
  const hasHabits = activeHabits.length > 0;

  // Compute habit completion state
  const habitData = useMemo(() => {
    return activeHabits.map((h) => ({
      ...h,
      streak: getHabitStreak(h.id),
      completed: entries.some(
        (e) => e.habitId === h.id && e.date.startsWith(today) && e.completed
      ),
    }));
  }, [activeHabits, entries, today, getHabitStreak]);

  const completedCount = habitData.filter((h) => h.completed).length;

  const handleHabitClick = useCallback(
    (habitId: string, color: string, isCompleted: boolean) => {
      if (isCompleted) return;
      playCompletionChime();
      playExplosionBurst();

      const streak = getHabitStreak(habitId);
      if (streak > 0 && (streak + 1) % 7 === 0) {
        setTimeout(playSuccessFanfare, 300);
      }

      // Inject dummy coordinate since we are clicking UI instead of 3D objects
      completeHabit(habitId, [0, 0, 0], color || "#00e5ff");
    },
    [completeHabit, getHabitStreak]
  );

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[#05020a]">

      {/* ── Background: Immersive 3D Cosmic Hand + Nebula ── */}
      <Suspense fallback={<CosmicLoader />}>
        <div className="absolute inset-0 z-0">
          <CosmicHandScene />
        </div>
      </Suspense>

      {/* ── Foreground: Glassmorphic Floating HUD ── */}
      {/* Left Panel: Stats & Heatmap */}
      {hasHabits && (
        <div className="absolute left-6 top-6 bottom-6 w-[360px] z-10 flex flex-col gap-6 pointer-events-none">

          {/* Top Stat Ribbon */}
          <div className="glass rounded-[2rem] p-6 glass-shine-effect pointer-events-auto border border-white/[0.05] shadow-2xl backdrop-blur-xl bg-black/40">
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white/40 mb-5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00e5ff]" />
              Vitals
            </h2>

            <div className="flex items-center gap-6 mb-6">
              <div className="relative flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="#00e5ff"
                    strokeWidth="3"
                    strokeDasharray={`${completionRate * 0.94} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-white">{completionRate}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-white/90 leading-tight">Sync Rate</p>
                <p className="text-xs text-white/40 mt-1">{completedCount} of {habitData.length} stabilized</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-center items-start">
                <Flame className="w-5 h-5 text-[#d946ef] mb-2 drop-shadow-[0_0_6px_rgba(217,70,239,0.8)]" />
                <span className="text-2xl font-black text-white">{Math.max(...habitData.map(h => h.streak), 0)}</span>
                <span className="text-[10px] text-white/40 uppercase font-semibold">Max Streak</span>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-center items-start">
                <Trophy className="w-5 h-5 text-[#22d3ee] mb-2 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                <span className="text-2xl font-black text-white">{habitData.length}</span>
                <span className="text-[10px] text-white/40 uppercase font-semibold">Total Cores</span>
              </div>
            </div>
          </div>

          {/* Activity Heatmap Overlay */}
          <div className="pointer-events-auto transform transition-transform hover:scale-[1.02] duration-500 will-change-transform">
            <ActivityHeatmap />
          </div>

        </div>
      )}

      {/* ── Right Panel: Actionable Habit Cores ── */}
      {hasHabits && (
        <div className="absolute right-6 top-6 bottom-6 w-[360px] z-10 overflow-y-auto scrollbar-hide pointer-events-none pb-12">
          <div className="flex flex-col gap-3 pointer-events-auto">
            <div className="sticky top-0 z-20 pt-2 pb-4 bg-gradient-to-b from-[#05020a] to-transparent">
              <h2 className="text-xs uppercase tracking-[0.2em] font-bold text-white/40 flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#d946ef]" />
                Action Cores
              </h2>
            </div>

            {habitData.map((habit, i) => (
              <button
                key={habit.id}
                onClick={() => handleHabitClick(habit.id, habit.color, habit.completed)}
                className={`group relative w-full text-left rounded-[1.5rem] p-5 transition-all duration-500 overflow-hidden ${habit.completed
                    ? "bg-black/40 border border-[#00e5ff]/20 backdrop-blur-md opacity-70"
                    : "glass border border-white/[0.08] hover:border-white/20 hover:scale-[1.02] active:scale-[0.98] shadow-lg backdrop-blur-xl bg-black/40"
                  }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Subtle hover gradient wash */}
                {!habit.completed && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent"
                    style={{ backgroundImage: `linear-gradient(to right, transparent, ${habit.color || "#00e5ff"})` }} />
                )}

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Color indicator node */}
                    <div className="relative flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full transition-all duration-500 ${habit.completed ? 'scale-0' : 'scale-100'}`}
                        style={{ backgroundColor: habit.color || "#00e5ff", boxShadow: `0 0 15px ${habit.color || "#00e5ff"}` }} />
                      {habit.completed && (
                        <CheckCircle2 className="absolute w-5 h-5 text-[#00e5ff] scale-100 animate-in fade-in zoom-in duration-300 drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
                      )}
                    </div>

                    <div>
                      <h3 className={`font-bold transition-colors ${habit.completed ? 'text-white/40' : 'text-white/90'}`}>
                        {habit.name}
                      </h3>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-white/30 mt-0.5">
                        Streak: {habit.streak}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!hasHabits && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none px-6">
          <div className="pointer-events-auto max-w-lg w-full glass rounded-[2.5rem] p-12 text-center relative overflow-hidden border border-white/[0.08] shadow-2xl bg-black/60">
            <div className="glass-shine-effect absolute inset-0" />

            <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#00e5ff]/10 blur-3xl animate-pulse-glow" />
              <div className="absolute inset-[-10px] rounded-full border border-dashed border-[#00e5ff]/20 animate-spin" style={{ animationDuration: "12s" }} />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00e5ff]/80 to-[#d946ef]/80 shadow-[0_0_40px_rgba(0,229,255,0.4)] animate-float">
                <Gem className="h-10 w-10 text-white drop-shadow-md" />
              </div>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white mb-4">
              Initialize Sequence
            </h2>
            <p className="text-sm leading-relaxed text-white/40 mb-10 max-w-sm mx-auto font-medium">
              Your cosmic core is dormant. Assign your first habit to ignite the nexus and begin charting your trajectory.
            </p>

            <Link
              href="/habits"
              onMouseEnter={() => playHoverTick()}
              className="group inline-flex items-center gap-3 rounded-2xl bg-white px-10 py-4 text-base font-bold text-black shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)]"
            >
              <Plus className="h-5 w-5" />
              <span>Synthesize Habit</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
