// ============================================================
// DataProvider — Fetches all data on mount + Supabase realtime
// Wrap in (app) layout so all protected pages have data ready
// ============================================================

"use client";

import { useEffect } from "react";
import { useHabitStore } from "@/stores/habitStore";

export default function DataProvider({ children }: { children: React.ReactNode }) {
  const fetchAll = useHabitStore((s) => s.fetchAll);
  const hasFetched = useHabitStore((s) => s.hasFetched);
  const subscribeRealtime = useHabitStore((s) => s.subscribeRealtime);

  useEffect(() => {
    if (!hasFetched) {
      fetchAll();
    }
  }, [fetchAll, hasFetched]);

  // Supabase realtime
  useEffect(() => {
    const unsub = subscribeRealtime();
    return unsub;
  }, [subscribeRealtime]);

  return <>{children}</>;
}
