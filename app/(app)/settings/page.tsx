// ============================================================
// Settings Page — Sound toggle, export data, delete account
// ============================================================

"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Settings,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  Loader2,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Monitor,
  Cpu,
  Zap,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabitStore } from "@/stores/habitStore";
import { useQualityStore, type QualityLevel } from "@/stores/qualityStore";
import { toast } from "sonner";
import {
  isSoundEnabled,
  setSoundEnabled,
  playToggleClick,
} from "@/lib/sounds";

export default function SettingsPage() {
  const habits = useHabitStore((s) => s.habits);
  const entries = useHabitStore((s) => s.entries);
  const quality = useQualityStore((s) => s.level);
  const setQuality = useQualityStore((s) => s.setLevel);

  const [soundOn, setSoundOn] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Hydrate sound preference
  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playToggleClick();
    toast.success(next ? "Sound effects enabled" : "Sound effects muted");
  }, [soundOn]);

  const exportJSON = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      habits: habits.map((h) => ({
        name: h.name,
        category: h.category,
        color: h.color,
        frequency: h.frequency,
        target: h.target,
        createdAt: h.createdAt,
      })),
      entries: entries.map((e) => ({
        habitId: e.habitId,
        date: e.date,
        completed: e.completed,
        value: e.value,
        note: e.note,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumina-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported as JSON");
  }, [habits, entries]);

  const exportCSV = useCallback(() => {
    const rows = [["Habit", "Date", "Completed", "Value", "Note"]];
    entries.forEach((e) => {
      const habit = habits.find((h) => h.id === e.habitId);
      rows.push([
        habit?.name ?? "Unknown",
        e.date,
        e.completed ? "Yes" : "No",
        String(e.value),
        e.note ?? "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumina-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported as CSV");
  }, [habits, entries]);

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted. Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        toast.error("Failed to delete account");
      }
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white/90 flex items-center gap-2">
          <Settings className="h-6 w-6 text-[#a78bfa]" style={{ filter: "drop-shadow(0 0 6px #a78bfa66)" }} />
          Settings
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Customize your Sanctuary experience
        </p>
      </div>

      {/* ── Sound Effects ───────────────────────────────── */}
      <section className="glass rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {soundOn ? (
              <Volume2 className="h-5 w-5 text-[#a78bfa]" style={{ filter: "drop-shadow(0 0 4px #a78bfa66)" }} />
            ) : (
              <VolumeX className="h-5 w-5 text-white/30" />
            )}
            <div>
              <p className="text-sm font-medium text-white/80">Sound Effects</p>
              <p className="text-[11px] text-white/30">
                Completion chimes, explosions, hover ticks
              </p>
            </div>
          </div>
          <button
            onClick={toggleSound}
            className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
              soundOn ? "bg-[#a78bfa]" : "bg-white/10"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                soundOn ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </section>

      {/* ── 3D Quality ──────────────────────────────────── */}
      <section className="glass rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Monitor className="h-5 w-5 text-[#22d3ee]" style={{ filter: "drop-shadow(0 0 4px #22d3ee66)" }} />
          <div>
            <p className="text-sm font-medium text-white/80">3D Quality</p>
            <p className="text-[11px] text-white/30">
              Adjust rendering quality for your device
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {([
            { key: "low" as QualityLevel, label: "Lite", icon: Zap, desc: "Best for mobile" },
            { key: "medium" as QualityLevel, label: "Balanced", icon: Cpu, desc: "Recommended" },
            { key: "high" as QualityLevel, label: "Ultra", icon: Monitor, desc: "Full effects" },
            { key: "premium" as QualityLevel, label: "Premium", icon: Crown, desc: "Max quality" },
          ]).map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              onClick={() => {
                setQuality(key);
                toast.success(`Quality set to ${label}`);
              }}
              className={`rounded-xl p-3 text-center transition-all duration-300 border ${
                quality === key
                  ? "bg-[#a78bfa]/15 border-[#a78bfa]/40 shadow-[0_0_12px_rgba(167,139,250,0.15)]"
                  : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
              }`}
            >
              <Icon className={`h-5 w-5 mx-auto mb-1.5 ${quality === key ? "text-[#a78bfa]" : "text-white/40"}`} />
              <p className={`text-xs font-medium ${quality === key ? "text-white/90" : "text-white/50"}`}>{label}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Export Data ──────────────────────────────────── */}
      <section className="glass rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Download className="h-5 w-5 text-[#22d3ee]" style={{ filter: "drop-shadow(0 0 4px #22d3ee66)" }} />
          <div>
            <p className="text-sm font-medium text-white/80">Export Data</p>
            <p className="text-[11px] text-white/30">
              Download your habits and entries
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={exportJSON}
            variant="secondary"
            className="bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]"
          >
            <FileJson className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button
            onClick={exportCSV}
            variant="secondary"
            className="bg-white/[0.04] text-white/60 hover:bg-white/[0.08] border border-white/[0.06]"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </section>

      {/* ── Danger Zone: Delete Account ──────────────────── */}
      <section className="glass rounded-2xl p-6 border-red-500/10">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="text-sm font-medium text-white/80">Danger Zone</p>
            <p className="text-[11px] text-white/30">
              Permanently delete your account and all data
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="destructive"
            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        ) : (
          <div className="glass rounded-xl p-4 border border-red-500/20 animate-modal-enter">
            <p className="text-sm text-white/60 mb-4">
              This action is <span className="text-red-400 font-semibold">permanent</span>.
              All your habits, entries, and coaching messages will be deleted forever.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="secondary"
                className="bg-white/[0.04] text-white/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting}
                variant="destructive"
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
