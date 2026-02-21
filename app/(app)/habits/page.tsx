// ============================================================
// Habits Page — Full CRUD with glass modal & subscription gate
// ============================================================

"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Sparkles,
  Filter,
  Pencil,
  Trash2,
  X,
  Flame,
  Check,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useHabitStore, type Habit } from "@/stores/habitStore";
import { toast } from "sonner";
import { playCompletionChime, playToggleClick, playHoverTick } from "@/lib/sounds";

// ── Category config ─────────────────────────────────────────
const CATEGORIES = [
  { name: "All", value: "all", color: "#ffffff" },
  { name: "Wellness", value: "wellness", color: "#a78bfa" },
  { name: "Fitness", value: "fitness", color: "#22d3ee" },
  { name: "Learning", value: "learning", color: "#6366f1" },
  { name: "Mindfulness", value: "mindfulness", color: "#d946ef" },
  { name: "Creativity", value: "creativity", color: "#f472b6" },
  { name: "Health", value: "health", color: "#34d399" },
];

const COLORS = [
  "#a78bfa", "#6366f1", "#22d3ee", "#d946ef", "#f472b6",
  "#34d399", "#fbbf24", "#fb923c", "#ef4444", "#8b5cf6",
];

const FREQUENCIES = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Custom", value: "custom" },
];

// ── Modal state types ───────────────────────────────────────
interface ModalState {
  open: boolean;
  mode: "create" | "edit";
  editId?: string;
  name: string;
  description: string;
  category: string;
  color: string;
  frequency: string;
  target: number;
}

const INITIAL_MODAL: ModalState = {
  open: false,
  mode: "create",
  name: "",
  description: "",
  category: "wellness",
  color: "#a78bfa",
  frequency: "daily",
  target: 1,
};

export default function HabitsPage() {
  const habits = useHabitStore((s) => s.habits);
  const entries = useHabitStore((s) => s.entries);
  const isLoading = useHabitStore((s) => s.isLoading);
  const createHabit = useHabitStore((s) => s.createHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const patchHabit = useHabitStore((s) => s.patchHabit);
  const getHabitStreak = useHabitStore((s) => s.getHabitStreak);

  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const activeHabits = habits.filter((h) => !h.isArchived);
  const filtered = filter === "all"
    ? activeHabits
    : activeHabits.filter((h) => h.category === filter);

  // count per category
  const categoryCounts = CATEGORIES.map((cat) => ({
    ...cat,
    count: cat.value === "all"
      ? activeHabits.length
      : activeHabits.filter((h) => h.category === cat.value).length,
  }));

  const today = new Date().toISOString().split("T")[0];

  const openCreate = useCallback(() => {
    setModal({ ...INITIAL_MODAL, open: true, mode: "create" });
  }, []);

  const openEdit = useCallback((h: Habit) => {
    setModal({
      open: true,
      mode: "edit",
      editId: h.id,
      name: h.name,
      description: h.description ?? "",
      category: h.category,
      color: h.color,
      frequency: h.frequency,
      target: h.target,
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!modal.name.trim()) {
      toast.error("Crystal needs a name");
      return;
    }
    setSaving(true);

    if (modal.mode === "create") {
      const result = await createHabit({
        name: modal.name.trim(),
        description: modal.description.trim() || undefined,
        category: modal.category,
        color: modal.color,
        frequency: modal.frequency,
        target: modal.target,
      });

      if (result.upgradeRequired) {
        setSaving(false);
        setModal((m) => ({ ...m, open: false }));
        setShowUpgrade(true);
        return;
      }
      if (result.success) {
        playCompletionChime();
        toast.success("Crystal created!", { description: `${modal.name} has been added to your Sanctuary` });
      } else {
        toast.error("Failed to create crystal");
      }
    } else if (modal.mode === "edit" && modal.editId) {
      await patchHabit(modal.editId, {
        name: modal.name.trim(),
        description: modal.description.trim() || null,
        category: modal.category,
        color: modal.color,
        frequency: modal.frequency,
        target: modal.target,
      });
      toast.success("Crystal updated!");
    }

    setSaving(false);
    setModal(INITIAL_MODAL);
  }, [modal, createHabit, patchHabit]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteHabit(id);
    setDeleteConfirm(null);
    playToggleClick();
    toast.success("Crystal removed from sanctuary");
  }, [deleteHabit]);

  // ── Upgrade Modal Component ───────────────────────────────
  const UpgradeModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-overlay-enter" onClick={() => setShowUpgrade(false)}>
      <div className="glass rounded-3xl p-8 max-w-md mx-4 text-center relative overflow-hidden animate-modal-enter" onClick={(e) => e.stopPropagation()}>
        <div className="glass-shine-effect absolute inset-0" />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#d946ef]">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white/90 mb-2">Unlock Unlimited Crystals</h2>
          <p className="text-sm text-white/50 mb-6">
            Free accounts can grow up to 5 crystals. Upgrade to Pro for unlimited habits,
            priority AI coaching, and advanced analytics.
          </p>
          <div className="glass rounded-2xl p-4 mb-6">
            <p className="text-3xl font-bold text-white/90">
              ₹499<span className="text-sm font-normal text-white/40">/month</span>
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/stripe/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({}),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              } catch {
                toast.error("Failed to start checkout");
              }
            }}
            className="w-full rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#d946ef] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(167,139,250,0.4)] transition-all hover:shadow-[0_0_40px_rgba(167,139,250,0.6)] hover:scale-[1.02]"
          >
            Upgrade to Pro
          </button>
          <button onClick={() => setShowUpgrade(false)} className="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );

  // ── Loading skeleton ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="h-7 w-40 rounded-lg shimmer" />
            <div className="mt-2 h-4 w-64 rounded-md shimmer" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="h-5 w-24 rounded shimmer mb-3" />
              <div className="h-3 w-full rounded shimmer" />
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
            Your Crystals
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Each habit is a living crystal in your Sanctuary
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-[#a78bfa] to-[#d946ef] text-white shadow-[0_0_15px_rgba(167,139,250,0.25)] hover:shadow-[0_0_25px_rgba(167,139,250,0.4)] transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Crystal
        </Button>
      </div>

      {/* ── Category filter pills ────────────────────────── */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categoryCounts.map((cat) => (
          <Badge
            key={cat.value}
            variant="secondary"
            onClick={() => setFilter(cat.value)}
            className={`cursor-pointer border px-3 py-1.5 transition-all ${
              filter === cat.value
                ? "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-white/80"
                : "border-transparent bg-white/[0.03] text-white/40 hover:border-white/10 hover:text-white/60"
            }`}
          >
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            {cat.name}
            <span className="ml-2 text-xs opacity-50">{cat.count}</span>
          </Badge>
        ))}
      </div>

      {/* ── Habit Cards Grid ─────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((habit) => {
            const streak = getHabitStreak(habit.id);
            const completedToday = entries.some(
              (e) => e.habitId === habit.id && e.date.startsWith(today) && e.completed
            );

            return (
              <div
                key={habit.id}
                className="group glass rounded-2xl p-5 transition-all duration-300 hover:border-white/10 relative overflow-hidden"
              >
                {/* Shine sweep */}
                <div className="glass-shine-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  {/* Top row: color dot + name + actions */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full shrink-0"
                        style={{
                          backgroundColor: habit.color,
                          boxShadow: completedToday ? `0 0 12px ${habit.color}60` : "none",
                        }}
                      />
                      <div>
                        <h3 className="text-sm font-semibold text-white/80">{habit.name}</h3>
                        {habit.description && (
                          <p className="text-xs text-white/30 mt-0.5 line-clamp-1">
                            {habit.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(habit)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5 text-white/30 hover:text-white/60" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(habit.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white/30 hover:text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 relative">
                      <Flame className="h-3.5 w-3.5 text-[#d946ef]" style={{ filter: "drop-shadow(0 0 4px #d946ef66)" }} />
                      <span className="text-xs font-medium text-white/50">
                        {streak} day{streak !== 1 ? "s" : ""}
                      </span>
                      {/* Fire particles for high streaks */}
                      {streak >= 7 && (
                        <span className="absolute -top-1 left-0">
                          <span className="fire-particle" />
                          <span className="fire-particle" />
                          <span className="fire-particle" />
                          <span className="fire-particle" />
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="border-0 bg-white/[0.04] text-[10px] text-white/35 capitalize"
                    >
                      {habit.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="border-0 bg-white/[0.04] text-[10px] text-white/35 capitalize"
                    >
                      {habit.frequency}
                    </Badge>
                    {completedToday && (
                      <div className="ml-auto flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 text-[#a78bfa]" />
                        <span className="text-[10px] text-[#a78bfa]/70">Done today</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delete confirmation overlay */}
                {deleteConfirm === habit.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl z-10">
                    <div className="text-center">
                      <p className="text-sm text-white/70 mb-3">Remove this crystal?</p>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs text-white/50 hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDelete(habit.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-xs text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ──────────────────────────────────── */
        <div className="glass rounded-3xl border-dashed p-12 text-center">
          <div className="relative mx-auto mb-6 w-fit">
            <div className="absolute inset-0 rounded-full bg-[#a78bfa]/15 blur-2xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#a78bfa]/20 bg-white/[0.03]">
              <Sparkles className="h-8 w-8 text-[#a78bfa]" style={{ filter: "drop-shadow(0 0 8px #a78bfa66)" }} />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white/80">No crystals yet</h3>
          <p className="mt-2 max-w-sm mx-auto text-sm text-white/35">
            Create your first habit crystal to begin growing your Sanctuary.
            Each crystal glows brighter as your streak builds.
          </p>
          <Button
            onClick={openCreate}
            className="mt-6 bg-gradient-to-r from-[#a78bfa] to-[#d946ef] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Crystal
          </Button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          CREATE / EDIT MODAL — Glass overlay
         ════════════════════════════════════════════════════ */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-overlay-enter" onClick={() => !saving && setModal(INITIAL_MODAL)}>
          <div
            className="glass rounded-3xl p-8 w-full max-w-lg mx-4 relative overflow-hidden animate-modal-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-shine-effect absolute inset-0" />

            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white/90">
                  {modal.mode === "create" ? "New Crystal" : "Edit Crystal"}
                </h2>
                <button
                  onClick={() => !saving && setModal(INITIAL_MODAL)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <X className="h-5 w-5 text-white/40" />
                </button>
              </div>

              {/* Name */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-white/40 mb-1.5">Name</label>
                <input
                  type="text"
                  value={modal.name}
                  onChange={(e) => setModal((m) => ({ ...m, name: e.target.value }))}
                  placeholder="e.g., Morning Meditation"
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:border-[#a78bfa]/30 focus:outline-none focus:ring-1 focus:ring-[#a78bfa]/20 transition-colors"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-white/40 mb-1.5">Description (optional)</label>
                <input
                  type="text"
                  value={modal.description}
                  onChange={(e) => setModal((m) => ({ ...m, description: e.target.value }))}
                  placeholder="Brief description..."
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:border-[#a78bfa]/30 focus:outline-none focus:ring-1 focus:ring-[#a78bfa]/20 transition-colors"
                />
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-white/40 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.value !== "all").map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setModal((m) => ({ ...m, category: cat.value }))}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all ${
                        modal.category === cat.value
                          ? "border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-white/80"
                          : "border border-white/[0.04] bg-white/[0.02] text-white/40 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-white/40 mb-1.5">Crystal Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setModal((m) => ({ ...m, color: c }))}
                      className={`h-8 w-8 rounded-full transition-all ${
                        modal.color === c
                          ? "ring-2 ring-white/40 scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{
                        backgroundColor: c,
                        boxShadow: modal.color === c ? `0 0 12px ${c}60` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Frequency + Target */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Frequency</label>
                  <div className="flex gap-2">
                    {FREQUENCIES.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => setModal((m) => ({ ...m, frequency: f.value }))}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs transition-all ${
                          modal.frequency === f.value
                            ? "border border-[#a78bfa]/30 bg-[#a78bfa]/10 text-white/80"
                            : "border border-white/[0.04] bg-white/[0.02] text-white/40 hover:bg-white/[0.05]"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Target</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={modal.target}
                    onChange={(e) => setModal((m) => ({ ...m, target: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm text-white/80 text-center focus:border-[#a78bfa]/30 focus:outline-none focus:ring-1 focus:ring-[#a78bfa]/20 transition-colors"
                  />
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || !modal.name.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#d946ef] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] transition-all hover:shadow-[0_0_30px_rgba(167,139,250,0.5)] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {modal.mode === "create" ? "Create Crystal" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upgrade Modal ─────────────────────────────────── */}
      {showUpgrade && <UpgradeModal />}
    </div>
  );
}
