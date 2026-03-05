"use client";

import { useEffect, useState } from "react";
import { onCelebration, type CelebrationEvent, useHabitStore } from "@/stores/habitStore";
import { Trophy, Star, Shield, Crown, X } from "lucide-react";

const MILESTONES = [7, 30, 100, 365];

function getBadgeDetails(streak: number) {
    if (streak === 7) return { icon: Star, color: "#22d3ee", name: "Stardust Initiate", desc: "A full week of consistency!" };
    if (streak === 30) return { icon: Shield, color: "#a78bfa", name: "Void Walker", desc: "A month unbroken. Unstoppable." };
    if (streak === 100) return { icon: Trophy, color: "#d946ef", name: "Ascended Master", desc: "100 days! You've forged a new reality." };
    if (streak === 365) return { icon: Crown, color: "#fbbf24", name: "Lumina Legend", desc: "A full year. Absolute perfection." };
    return null;
}

export default function MilestoneBadgeModal() {
    const [activeBadge, setActiveBadge] = useState<{ event: CelebrationEvent, habitName: string } | null>(null);
    const habits = useHabitStore(s => s.habits);

    useEffect(() => {
        const unsubscribe = onCelebration((event) => {
            if (MILESTONES.includes(event.streak)) {
                const habit = useHabitStore.getState().habits.find(h => h.id === event.streak.toString() || h.id === event.habitId);
                if (habit) {
                    // Add a slight delay so it pops up after the completion explosion
                    setTimeout(() => {
                        setActiveBadge({ event, habitName: habit.name });
                    }, 1500);
                }
            }
        });
        return unsubscribe;
    }, []);

    if (!activeBadge) return null;

    const badge = getBadgeDetails(activeBadge.event.streak);
    if (!badge) return null;

    const Icon = badge.icon;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-overlay-enter p-4" onClick={() => setActiveBadge(null)}>
            <div
                className="glass rounded-[2rem] p-10 max-w-md w-full text-center relative overflow-hidden animate-modal-enter shadow-[0_0_100px_rgba(167,139,250,0.15)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="glass-shine-effect absolute inset-0 pointer-events-none" />

                <button
                    onClick={() => setActiveBadge(null)}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
                >
                    <X className="w-4 h-4 text-white/50" />
                </button>

                <span className="inline-block text-[10px] uppercase tracking-widest text-white/50 font-bold mb-8">
                    Milestone Unlocked
                </span>

                {/* Floating animated badge element */}
                <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center animate-float">
                    <div className="absolute inset-0 rounded-full animate-pulse-glow" style={{ backgroundColor: badge.color, opacity: 0.15, filter: "blur(20px)" }} />
                    <div className="absolute inset-2 rounded-full animate-pulse-glow" style={{ backgroundColor: badge.color, opacity: 0.25, filter: "blur(10px)", animationDelay: "0.2s" }} />

                    <div className="absolute inset-[-10px] rounded-full border border-dashed border-white/20 animate-spin" style={{ animationDuration: "15s" }} />
                    <div className="absolute inset-[-20px] rounded-full border border-white/10 animate-spin" style={{ animationDuration: "25s", animationDirection: "reverse" }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: badge.color, boxShadow: `0 0 10px ${badge.color}` }} />
                    </div>

                    <div
                        className="relative w-24 h-24 rounded-2xl flex items-center justify-center transform rotate-45 border border-white/20 shadow-xl"
                        style={{
                            background: `linear-gradient(135deg, ${activeBadge.event.color}40, ${badge.color}aa)`,
                            boxShadow: `0 0 40px ${badge.color}50, inset 0 0 20px rgba(255,255,255,0.2)`
                        }}
                    >
                        <div className="transform -rotate-45">
                            <Icon className="w-12 h-12 text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                    {badge.name}
                </h2>

                <p className="text-white/60 text-sm mb-6">
                    {badge.desc}
                </p>

                <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-white/[0.05] border border-white/10 mb-8">
                    <span className="text-xs text-white/40">Crystal</span>
                    <span className="font-semibold text-white/80">{activeBadge.habitName}</span>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-xs text-white/40">Streak</span>
                    <span className="font-bold text-white shadow-sm" style={{ color: badge.color }}>{activeBadge.event.streak} Days</span>
                </div>

                <button
                    onClick={() => setActiveBadge(null)}
                    className="w-full flex justify-center py-4 rounded-xl text-sm font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                        background: `linear-gradient(90deg, ${badge.color}dd, ${activeBadge.event.color}dd)`,
                        boxShadow: `0 0 30px ${badge.color}40`
                    }}
                >
                    Claim Reward
                </button>
            </div>
        </div>
    );
}
