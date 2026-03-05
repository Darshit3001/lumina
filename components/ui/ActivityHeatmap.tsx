"use client";

import { useMemo } from "react";
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { useHabitStore } from "@/stores/habitStore";

export default function ActivityHeatmap() {
    const habits = useHabitStore((s) => s.habits);
    const entries = useHabitStore((s) => s.entries);
    const activeHabits = habits.filter((h) => !h.isArchived);

    // Generate last 90 days grid
    const days = useMemo(() => {
        const today = new Date();
        // Go back 90 days, then align to the start of that week (Sunday)
        const startDate = startOfWeek(subDays(today, 90));

        const intervalDays = eachDayOfInterval({ start: startDate, end: today });

        return intervalDays.map((day) => {
            const dateStr = day.toISOString().split("T")[0];

            const total = activeHabits.length;
            const completed = activeHabits.filter((h) =>
                entries.some(
                    (e) => e.habitId === h.id && e.date.startsWith(dateStr) && e.completed
                )
            ).length;

            let intensity = 0;
            if (total > 0 && completed > 0) {
                intensity = completed / total; // 0 to 1
            }

            return {
                date: day,
                dateStr,
                intensity,
                completed,
                total,
            };
        });
    }, [activeHabits, entries]);

    // Group into columns of 7 days
    const weeks = useMemo(() => {
        const cols = [];
        for (let i = 0; i < days.length; i += 7) {
            cols.push(days.slice(i, i + 7));
        }
        return cols;
    }, [days]);

    return (
        <div className="glass rounded-2xl overflow-hidden mb-8 p-6">
            <h2 className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-6">
                <svg className="w-4 h-4 text-[#22d3ee]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Activity Heatmap (Last 90 Days)
            </h2>

            <div className="flex bg-black/20 p-4 rounded-xl border border-white/[0.04] overflow-x-auto scrollbar-hide">
                <div className="flex flex-col gap-[3px] pr-2 pt-5 text-[10px] text-white/30 font-medium">
                    <span className="h-[12px] leading-[12px]">Sun</span>
                    <span className="h-[12px] leading-[12px] opacity-0">Mon</span>
                    <span className="h-[12px] leading-[12px]">Tue</span>
                    <span className="h-[12px] leading-[12px] opacity-0">Wed</span>
                    <span className="h-[12px] leading-[12px]">Thu</span>
                    <span className="h-[12px] leading-[12px] opacity-0">Fri</span>
                    <span className="h-[12px] leading-[12px]">Sat</span>
                </div>

                <div className="flex gap-[3px]">
                    {weeks.map((week, i) => (
                        <div key={i} className="flex flex-col gap-[3px]">
                            {/* Optional Month Label for first week of month */}
                            <div className="h-4 text-[10px] text-white/40 mb-1 pointer-events-none whitespace-nowrap">
                                {week[0].date.getDate() <= 7 && i > 0 ? format(week[0].date, "MMM") : ""}
                            </div>

                            {week.map((day, j) => {
                                // Determine color based on intensity
                                let bgClass = "bg-white/[0.04]";
                                if (day.intensity > 0) {
                                    if (day.intensity < 0.25) bgClass = "bg-[#a78bfa]/20 border border-[#a78bfa]/10";
                                    else if (day.intensity < 0.5) bgClass = "bg-[#a78bfa]/40 border border-[#a78bfa]/20";
                                    else if (day.intensity < 0.75) bgClass = "bg-[#a78bfa]/60 border border-[#a78bfa]/30";
                                    else bgClass = "bg-[#a78bfa] border border-[#a78bfa]/50 shadow-[0_0_8px_#a78bfa40]";
                                }

                                return (
                                    <div
                                        key={day.dateStr}
                                        title={`${format(day.date, "MMM d, yyyy")}: ${day.completed}/${day.total} crystals`}
                                        className={`w-[12px] h-[12px] rounded-[3px] transition-colors duration-200 hover:ring-1 hover:ring-white/50 ${bgClass}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end items-center mt-4 text-[10px] text-white/30 gap-2">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-[2px] bg-white/[0.04]"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#a78bfa]/20"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#a78bfa]/40"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#a78bfa]/60"></div>
                    <div className="w-3 h-3 rounded-[2px] bg-[#a78bfa]"></div>
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
