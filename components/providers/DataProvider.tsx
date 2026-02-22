// ============================================================
// DataProvider — Fetches all data on mount + Supabase realtime
// Wrap in (app) layout so all protected pages have data ready
// ============================================================

"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/stores/habitStore";
import { isSupabaseConnected } from "@/lib/supabase";

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const fetchAll = useHabitStore((s) => s.fetchAll);
  const hasFetched = useHabitStore((s) => s.hasFetched);
  const subscribeRealtime = useHabitStore((s) => s.subscribeRealtime);

  useEffect(() => {
    if (!hasFetched) {
      console.info("[LUMINA] 🚀 Fetching habits & entries...");
      fetchAll().then(() => {
        console.info("[LUMINA] ✅ Data loaded");
      });
    }
  }, [fetchAll, hasFetched]);

  // Supabase realtime
  useEffect(() => {
    if (isSupabaseConnected) {
      console.info("[LUMINA] 📡 Connecting Supabase realtime...");
    }
    const unsub = subscribeRealtime();
    return unsub;
  }, [subscribeRealtime]);

  return <>{children}</>;
}
