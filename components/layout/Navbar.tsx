// ============================================================
// Navbar — Liquid-glass top bar with neon indicators
// ============================================================

"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Flame, Zap, Activity, Shield } from "lucide-react";
import { useHabitStore } from "@/stores/habitStore";

/** Map paths to friendly page titles + neon accent color */
const PAGE_META: Record<string, { title: string; neon: string; icon: React.ElementType }> = {
  "/dashboard":  { title: "Sanctuary",  neon: "#a78bfa", icon: Shield },
  "/habits":     { title: "Crystals",   neon: "#d946ef", icon: Activity },
  "/calendar":   { title: "Calendar",   neon: "#22d3ee", icon: Activity },
  "/analytics":  { title: "Analytics",  neon: "#6366f1", icon: Activity },
  "/coach":      { title: "AI Coach",   neon: "#34d399", icon: Activity },
  "/profile":    { title: "Profile",    neon: "#f472b6", icon: Activity },
};

export default function Navbar() {
  const pathname = usePathname();
  const meta = PAGE_META[pathname] ?? { title: "LUMINA", neon: "#a78bfa", icon: Activity };
  const completionRate = useHabitStore((s) => s.getTodayCompletionRate());
  const habits = useHabitStore((s) => s.habits);
  const entries = useHabitStore((s) => s.entries);

  // Calculate best streak across all habits
  const getHabitStreak = useHabitStore((s) => s.getHabitStreak);
  const bestStreak = habits.length > 0
    ? Math.max(...habits.map((h) => getHabitStreak(h.id)), 0)
    : 0;

  // Today's completed count
  const today = new Date().toISOString().split("T")[0];
  const completedToday = habits.filter((h) =>
    entries.some((e) => e.habitId === h.id && e.date.startsWith(today) && e.completed)
  ).length;

  const isDashboard = pathname === "/dashboard";

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center justify-between px-6 transition-all duration-500 ${
        isDashboard
          ? "bg-transparent border-none"
          : "glass border-b border-white/[0.04]"
      }`}
    >
      {/* ── Page Title with neon dot ─────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Neon dot indicator */}
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: meta.neon,
            boxShadow: `0 0 8px ${meta.neon}88, 0 0 16px ${meta.neon}44`,
          }}
        />
        <h1 className="text-sm font-semibold tracking-tight text-white/80">
          {meta.title}
        </h1>
        {isDashboard && (
          <div className="flex items-center gap-1.5 rounded-full glass px-2.5 py-1">
            <Zap
              className="h-3 w-3 text-[#a78bfa]"
              style={{ filter: "drop-shadow(0 0 4px #a78bfa88)" }}
            />
            <span className="text-[11px] font-medium text-[#a78bfa]">Live</span>
          </div>
        )}
      </div>

      {/* ── Right side: progress + streak + user ──────────── */}
      <div className="flex items-center gap-3">
        {/* Today's completion arc */}
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2">
          <div className="relative h-5 w-5">
            <svg className="h-5 w-5 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={meta.neon}
                strokeWidth="3"
                strokeDasharray={`${completionRate}, 100`}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{ filter: `drop-shadow(0 0 4px ${meta.neon}88)` }}
              />
            </svg>
          </div>
          <span className="text-xs font-medium text-white/70">
            {completedToday}/{habits.filter((h) => !h.isArchived).length}
          </span>
        </div>

        {/* Streak indicator with neon glow */}
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <Flame
            className="h-3.5 w-3.5 text-[#d946ef]"
            style={{ filter: "drop-shadow(0 0 5px #d946ef88) drop-shadow(0 0 10px #d946ef44)" }}
          />
          <span className="text-xs font-semibold text-white/80 animate-count-up">
            {bestStreak}
          </span>
        </div>

        {/* Clerk User Button */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 ring-2 ring-[#a78bfa]/25 shadow-[0_0_12px_rgba(167,139,250,0.15)]",
            },
          }}
        />
      </div>
    </header>
  );
}
