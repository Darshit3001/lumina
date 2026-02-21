// ============================================================
// API: /api/entries — Habit completion entries
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

// ── GET: Fetch entries for current user ─────────────────────
export async function GET(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // ISO date
  const to = searchParams.get("to");     // ISO date

  const where: Record<string, unknown> = { userId: user.id };
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const entries = await prisma.habitEntry.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // Return dates as ISO strings
  return NextResponse.json(
    entries.map((e) => ({
      ...e,
      date: e.date.toISOString().split("T")[0],
    }))
  );
}

// ── POST: Create a completion entry ─────────────────────────
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { habitId, date, completed = true, value = 1, note } = body;

  if (!habitId) return NextResponse.json({ error: "habitId required" }, { status: 400 });

  // Verify habit ownership
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: user.id },
  });
  if (!habit) return NextResponse.json({ error: "Habit not found" }, { status: 404 });

  const entryDate = date ? new Date(date) : new Date();
  // Normalize to midnight UTC
  entryDate.setUTCHours(0, 0, 0, 0);

  // Upsert — if entry for this habit+date already exists, update it
  const entry = await prisma.habitEntry.upsert({
    where: {
      habitId_date: { habitId, date: entryDate },
    },
    create: {
      habitId,
      userId: user.id,
      date: entryDate,
      completed,
      value,
      note: note || null,
    },
    update: {
      completed,
      value,
      note: note || null,
    },
  });

  return NextResponse.json({
    ...entry,
    date: entry.date.toISOString().split("T")[0],
  }, { status: 201 });
}
