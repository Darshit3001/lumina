// ============================================================
// Analytics Page — Real habit statistics & weekly activity chart
// ============================================================

"use client";

import { useMemo, useCallback } from "react";
import { TrendingUp, Target, Flame, Trophy, Gem, BarChart3, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { useHabitStore } from "@/stores/habitStore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const habits = useHabitStore((s) => s.habits);
  const entries = useHabitStore((s) => s.entries);
  const isLoading = useHabitStore((s) => s.isLoading);
  const getHabitStreak = useHabitStore((s) => s.getHabitStreak);
  const completionRate = useHabitStore((s) => s.getTodayCompletionRate());

  const activeHabits = habits.filter((h) => !h.isArchived);

  // ── Export handlers ───────────────────────────────────────
  const exportJSON = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      habits: habits.map((h) => ({
        name: h.name, category: h.category, color: h.color,
        frequency: h.frequency, target: h.target, createdAt: h.createdAt,
      })),
      entries: entries.map((e) => ({
        habitId: e.habitId, date: e.date, completed: e.completed,
        value: e.value, note: e.note,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumina-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  }, [habits, entries]);

  const exportCSV = useCallback(() => {
    const rows = [["Habit", "Date", "Completed", "Value", "Note"]];
    entries.forEach((e) => {
      const habit = habits.find((h) => h.id === e.habitId);
      rows.push([habit?.name ?? "Unknown", e.date, e.completed ? "Yes" : "No", String(e.value), e.note ?? ""]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumina-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  }, [habits, entries]);

  // Compute stats
  const stats = useMemo(() => {
    const bestStreak = activeHabits.length > 0
      ? Math.max(...activeHabits.map((h) => getHabitStreak(h.id)), 0)
      : 0;
    const totalCompletions = entries.filter((e) => e.completed).length;
    const currentStreak = bestStreak; // highest active streak

    return { currentStreak, completionRate, totalCompletions, bestStreak };
  }, [activeHabits, entries, getHabitStreak, completionRate]);

  // Weekly activity: last 7 days
  const weeklyData = useMemo(() => {
    const days: { label: string; completed: number; total: number }[] = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const total = activeHabits.length;
      const completed = activeHabits.filter((h) =>
        entries.some(
          (e) => e.habitId === h.id && e.date.startsWith(dateStr) && e.completed
        )
      ).length;
      days.push({
        label: dayNames[d.getDay()],
        completed,
        total,
      });
    }
    return days;
  }, [activeHabits, entries]);

  const maxCompleted = Math.max(...weeklyData.map((d) => d.total), 1);

  // Per-habit stats
  const habitStats = useMemo(() => {
    return activeHabits.map((h) => {
      const streak = getHabitStreak(h.id);
      const completions = entries.filter((e) => e.habitId === h.id && e.completed).length;
      return { ...h, streak, completions };
    }).sort((a, b) => b.streak - a.streak);
  }, [activeHabits, entries, getHabitStreak]);

  const STAT_CARDS = [
    {
      label: "Current Streak",
      value: stats.currentStreak.toString(),
      unit: "days",
      icon: Flame,
      color: "#d946ef",
    },
    {
      label: "Today's Rate",
      value: stats.completionRate.toString(),
      unit: "%",
      icon: Target,
      color: "#a78bfa",
    },
    {
      label: "Total Completions",
      value: stats.totalCompletions.toString(),
      unit: "",
      icon: Trophy,
      color: "#22d3ee",
    },
    {
      label: "Best Streak",
      value: stats.bestStreak.toString(),
      unit: "days",
      icon: TrendingUp,
      color: "#6366f1",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="h-7 w-32 rounded-lg shimmer mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="h-16 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white/90">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Insights into your habit-building journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportJSON}
            variant="secondary"
            size="sm"
            className="bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]"
          >
            <FileJson className="mr-1.5 h-3.5 w-3.5" />
            JSON
          </Button>
          <Button
            onClick={exportCSV}
            variant="secondary"
            size="sm"
            className="bg-white/[0.04] text-white/50 hover:bg-white/[0.08] border border-white/[0.06]"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            CSV
          </Button>
        </div>
      </div>

      {/* ── Stats Grid ────────────────────────────────────── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map(({ label, value, unit, icon: Icon, color }) => (
          <div
            key={label}
            className="glass rounded-2xl p-5 transition-all duration-300 hover:border-white/10"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: color + "15" }}
              >
                <Icon className="h-5 w-5" style={{ color, filter: `drop-shadow(0 0 4px ${color}66)` }} />
              </div>
              <div>
                <p className="text-xs text-white/30">{label}</p>
                <p className="mt-0.5 text-2xl font-bold text-white/80">
                  {value}
                  {unit && (
                    <span className="ml-1 text-sm font-normal text-white/30">
                      {unit}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Weekly Activity Chart ─────────────────────────── */}
      <div className="glass rounded-2xl overflow-hidden mb-8">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.06]">
          <BarChart3 className="h-4 w-4 text-[#a78bfa]" />
          <h2 className="text-sm font-semibold text-white/60">Weekly Activity</h2>
        </div>
        <div className="p-6">
          {activeHabits.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <div className="text-center">
                <TrendingUp className="mx-auto mb-3 h-8 w-8 text-[#a78bfa]/30" />
                <p className="text-sm text-white/30">
                  Charts will appear once you start tracking habits
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-3 h-48">
              {weeklyData.map((day, i) => {
                const height = day.total > 0 ? (day.completed / maxCompleted) * 100 : 0;
                const isToday = i === 6;
                return (
                  <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full flex flex-col items-center justify-end h-36">
                      {/* Bar background */}
                      <div
                        className="w-full max-w-[32px] rounded-t-lg transition-all duration-500 relative"
                        style={{
                          height: `${Math.max(height, 4)}%`,
                          backgroundColor: isToday ? "#a78bfa" : "#a78bfa40",
                          boxShadow: isToday ? "0 0 12px #a78bfa40" : "none",
                        }}
                      >
                        {day.completed > 0 && (
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white/50">
                            {day.completed}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium ${isToday ? "text-[#a78bfa]" : "text-white/25"}`}>
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Per-Habit Breakdown ────────────────────────────── */}
      {habitStats.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.06]">
            <Gem className="h-4 w-4 text-[#d946ef]" />
            <h2 className="text-sm font-semibold text-white/60">Crystal Performance</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {habitStats.map((h) => (
              <div key={h.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: h.color, boxShadow: `0 0 8px ${h.color}40` }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white/70">{h.name}</p>
                    <p className="text-[10px] text-white/25 capitalize">{h.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-white/30">Streak</p>
                    <p className="text-sm font-semibold text-white/70">{h.streak}d</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/30">Done</p>
                    <p className="text-sm font-semibold text-white/70">{h.completions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
