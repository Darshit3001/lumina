// ============================================================
// Zustand Store — Habit state + celebration event system
// Fetches from API, Supabase realtime, subscription awareness
// ============================================================

import { create } from "zustand";
import { supabase } from "@/lib/supabase";

// ── Types ───────────────────────────────────────────────────
export interface Habit {
  id: string;
  name: string;
  description: string | null;
  category: string;
  color: string;
  frequency: string;
  target: number;
  icon: string;
  isArchived: boolean;
  createdAt: string;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  userId?: string;
  date: string;
  completed: boolean;
  value: number;
  note: string | null;
}

// ── Global celebration event bus ────────────────────────────
export interface CelebrationEvent {
  habitId: string;
  position: [number, number, number];
  color: string;
  streak: number;
}

type CelebrationListener = (event: CelebrationEvent) => void;
const celebrationListeners = new Set<CelebrationListener>();

export function onCelebration(listener: CelebrationListener): () => void {
  celebrationListeners.add(listener);
  return () => { celebrationListeners.delete(listener); };
}

function emitCelebration(event: CelebrationEvent) {
  celebrationListeners.forEach((fn) => fn(event));
}

// ── Store interface ─────────────────────────────────────────
interface HabitState {
  // ── Data ──────────────────────────────────────────────────
  habits: Habit[];
  entries: HabitEntry[];
  selectedDate: Date;
  isLoading: boolean;
  hasFetched: boolean;
  subscription: "free" | "pro" | "enterprise";

  // ── Fetch from API ────────────────────────────────────────
  fetchHabits: () => Promise<void>;
  fetchEntries: (from?: string, to?: string) => Promise<void>;
  fetchAll: () => Promise<void>;

  // ── Actions ───────────────────────────────────────────────
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  setEntries: (entries: HabitEntry[]) => void;
  addEntry: (entry: HabitEntry) => void;
  setSelectedDate: (date: Date) => void;
  setLoading: (loading: boolean) => void;
  setSubscription: (sub: "free" | "pro" | "enterprise") => void;

  /** Create habit via API */
  createHabit: (data: {
    name: string;
    description?: string;
    category?: string;
    color?: string;
    frequency?: string;
    target?: number;
    icon?: string;
  }) => Promise<{ success: boolean; upgradeRequired?: boolean; habit?: Habit }>;

  /** Delete habit via API */
  deleteHabit: (id: string) => Promise<void>;

  /** Update habit via API */
  patchHabit: (id: string, data: Partial<Habit>) => Promise<void>;

  /**
   * Mark a habit as complete for today.
   * Persists to DB via API, updates local state, and
   * emits a celebration event for the 3D scene.
   */
  completeHabit: (
    id: string,
    crystalPosition: [number, number, number],
    crystalColor: string
  ) => Promise<void>;

  // ── Realtime ──────────────────────────────────────────────
  subscribeRealtime: () => () => void;

  // ── Computed helpers ──────────────────────────────────────
  getHabitStreak: (habitId: string) => number;
  getTodayCompletionRate: () => number;
  getBestStreak: () => number;
  getTotalCompletions: () => number;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  entries: [],
  selectedDate: new Date(),
  isLoading: false,
  hasFetched: false,
  subscription: "free",

  // ── Fetch habits from API ─────────────────────────────────
  fetchHabits: async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        set({ habits: data });
      }
    } catch {
      // silently fail — offline state
    }
  },

  // ── Fetch entries from API ────────────────────────────────
  fetchEntries: async (from?: string, to?: string) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const url = `/api/entries${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ entries: data });
      }
    } catch {
      // silently fail
    }
  },

  // ── Fetch all data ────────────────────────────────────────
  fetchAll: async () => {
    set({ isLoading: true });
    await Promise.all([get().fetchHabits(), get().fetchEntries()]);
    set({ isLoading: false, hasFetched: true });
  },

  // ── Setters ───────────────────────────────────────────────
  setHabits: (habits) => set({ habits }),
  addHabit: (habit) => set((s) => ({ habits: [...s.habits, habit] })),
  removeHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),
  updateHabit: (id, updates) =>
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) })),
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSubscription: (sub) => set({ subscription: sub }),

  // ── Create habit via API ──────────────────────────────────
  createHabit: async (data) => {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 403) {
        const body = await res.json();
        if (body.error === "UPGRADE_REQUIRED") {
          return { success: false, upgradeRequired: true };
        }
        return { success: false };
      }
      if (res.ok) {
        const habit = await res.json();
        set((s) => ({ habits: [...s.habits, habit] }));
        return { success: true, habit };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  },

  // ── Delete habit via API ──────────────────────────────────
  deleteHabit: async (id) => {
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
    try {
      await fetch(`/api/habits?id=${id}`, { method: "DELETE" });
    } catch {
      // Re-fetch on failure
      get().fetchHabits();
    }
  },

  // ── Update habit via API ──────────────────────────────────
  patchHabit: async (id, data) => {
    // Optimistic
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...data } : h)) }));
    try {
      await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
    } catch {
      get().fetchHabits();
    }
  },

  // ── Complete habit: DB + local state + 3D celebration ─────
  completeHabit: async (id, crystalPosition, crystalColor) => {
    const { entries } = get();
    const today = new Date().toISOString().split("T")[0];

    const alreadyDone = entries.some(
      (e) => e.habitId === id && e.date.startsWith(today) && e.completed
    );
    if (alreadyDone) return;

    const newEntry: HabitEntry = {
      id: `entry-${Date.now()}`,
      habitId: id,
      date: today,
      completed: true,
      value: 1,
      note: null,
    };
    set((s) => ({ entries: [...s.entries, newEntry] }));

    const streak = get().getHabitStreak(id);

    emitCelebration({
      habitId: id,
      position: crystalPosition,
      color: crystalColor,
      streak,
    });

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId: id, date: today, completed: true, value: 1 }),
      });
      if (res.ok) {
        const saved = await res.json();
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === newEntry.id ? { ...saved, id: saved.id ?? e.id } : e
          ),
        }));
      }
    } catch {
      // keep optimistic
    }
  },

  // ── Supabase Realtime subscriptions ───────────────────────
  subscribeRealtime: () => {
    if (!supabase) {
      console.info("[LUMINA] Supabase not configured — realtime disabled");
      return () => {};
    }

    const channel = supabase
      .channel("lumina-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits" },
        () => { get().fetchHabits(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_entries" },
        () => { get().fetchEntries(); }
      )
      .subscribe((status) => {
        console.info(`[LUMINA] Supabase realtime: ${status}`);
      });

    return () => { supabase!.removeChannel(channel); };
  },

  // ── Compute the current streak for a habit ────────────────
  getHabitStreak: (habitId: string) => {
    const { entries } = get();
    const habitEntries = entries
      .filter((e) => e.habitId === habitId && e.completed)
      .map((e) => new Date(e.date).getTime())
      .sort((a, b) => b - a);

    if (habitEntries.length === 0) return 0;

    let streak = 1;
    const oneDay = 86_400_000;
    for (let i = 0; i < habitEntries.length - 1; i++) {
      if (habitEntries[i] - habitEntries[i + 1] === oneDay) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  // ── Today's completion percentage ─────────────────────────
  getTodayCompletionRate: () => {
    const { habits, entries } = get();
    const today = new Date().toISOString().split("T")[0];
    const activeHabits = habits.filter((h) => !h.isArchived);
    if (activeHabits.length === 0) return 0;

    const completed = activeHabits.filter((h) =>
      entries.some(
        (e) => e.habitId === h.id && e.date.startsWith(today) && e.completed
      )
    ).length;

    return Math.round((completed / activeHabits.length) * 100);
  },

  // ── Best streak across all habits ─────────────────────────
  getBestStreak: () => {
    const { habits } = get();
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => get().getHabitStreak(h.id)), 0);
  },

  // ── Total completions ───────────────────────────────────
  getTotalCompletions: () => {
    return get().entries.filter((e) => e.completed).length;
  },
}));
