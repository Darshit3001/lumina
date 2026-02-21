// ============================================================
// Calendar Page — Habit completion calendar view (real data)
// ============================================================

"use client";

import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { useState, useMemo } from "react";
import { useHabitStore } from "@/stores/habitStore";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const habits = useHabitStore((s) => s.habits);
  const entries = useHabitStore((s) => s.entries);
  const isLoading = useHabitStore((s) => s.isLoading);

  const activeHabits = habits.filter((h) => !h.isArchived);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const goToPrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const isToday = (day: Date) => {
    return day.toISOString().split("T")[0] === todayStr;
  };

  // Compute completion rate per day
  const dayCompletionMap = useMemo(() => {
    const map: Record<string, { completed: number; total: number }> = {};
    if (activeHabits.length === 0) return map;

    days.forEach((day) => {
      const dateStr = day.toISOString().split("T")[0];
      const total = activeHabits.length;
      const completed = activeHabits.filter((h) =>
        entries.some(
          (e) => e.habitId === h.id && e.date.startsWith(dateStr) && e.completed
        )
      ).length;
      if (completed > 0) {
        map[dateStr] = { completed, total };
      }
    });

    return map;
  }, [days, activeHabits, entries]);

  const getDayStyle = (day: Date) => {
    const dateStr = day.toISOString().split("T")[0];
    const data = dayCompletionMap[dateStr];
    const today = isToday(day);

    if (!data) {
      if (today) return "bg-[#a78bfa]/15 font-semibold text-[#a78bfa] ring-1 ring-[#a78bfa]/40";
      return "text-white/40 hover:text-white/60 hover:bg-white/[0.04]";
    }

    const rate = data.completed / data.total;
    if (rate >= 1) {
      // Full completion
      return `bg-[#a78bfa]/25 text-white/90 font-semibold ${today ? "ring-1 ring-[#a78bfa]/60" : ""}`;
    }
    // Partial
    return `bg-[#a78bfa]/10 text-white/60 ${today ? "ring-1 ring-[#a78bfa]/40" : ""}`;
  };

  // Monthly stats
  const monthlyStats = useMemo(() => {
    const daysWithCompletion = Object.values(dayCompletionMap);
    const perfectDays = daysWithCompletion.filter((d) => d.completed >= d.total).length;
    const totalCompletions = daysWithCompletion.reduce((sum, d) => sum + d.completed, 0);
    return { perfectDays, totalCompletions };
  }, [dayCompletionMap]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="h-7 w-32 rounded-lg shimmer mb-8" />
        <div className="glass rounded-2xl p-8">
          <div className="h-64 rounded-lg shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Track your habit completions across time
        </p>
      </div>

      {/* Monthly stats row */}
      {activeHabits.length > 0 && (
        <div className="mb-6 flex gap-4">
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a78bfa]/10">
              <Flame className="h-4 w-4 text-[#a78bfa]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30">Perfect Days</p>
              <p className="text-lg font-bold text-white/80">{monthlyStats.perfectDays}</p>
            </div>
          </div>
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d946ef]/10">
              <Flame className="h-4 w-4 text-[#d946ef]" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/30">Completions</p>
              <p className="text-lg font-bold text-white/80">{monthlyStats.totalCompletions}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendar Card ─────────────────────────────────── */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-white/80">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevMonth}
              className="h-8 w-8 border-white/[0.06] bg-transparent text-white/40 hover:border-[#a78bfa]/30 hover:text-white/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8 border-white/[0.06] bg-transparent text-white/40 hover:border-[#a78bfa]/30 hover:text-white/60"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6">
          {/* Weekday headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-white/25"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {days.map((day) => {
              const dateStr = day.toISOString().split("T")[0];
              const data = dayCompletionMap[dateStr];

              return (
                <div
                  key={day.toISOString()}
                  className={`flex aspect-square cursor-default flex-col items-center justify-center rounded-lg text-sm transition-all ${getDayStyle(day)}`}
                  title={
                    data
                      ? `${data.completed}/${data.total} habits completed`
                      : undefined
                  }
                >
                  <span>{day.getDate()}</span>
                  {data && (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(data.completed, 4) }).map((_, i) => (
                        <div key={i} className="h-1 w-1 rounded-full bg-[#a78bfa]" />
                      ))}
                      {data.completed > 4 && (
                        <span className="text-[7px] text-[#a78bfa]/60">+</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────── */}
      <div className="mt-6 flex items-center gap-6 text-xs text-white/30">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#a78bfa]/15 ring-1 ring-[#a78bfa]/40" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#a78bfa]/25" />
          <span>All completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-[#a78bfa]/10" />
          <span>Partial</span>
        </div>
      </div>
    </div>
  );
}
