// ============================================================
// API: /api/habits — CRUD for habits
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

// ── GET: Fetch all habits for current user ──────────────────
export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const habits = await prisma.habit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(habits);
}

// ── POST: Create a new habit ────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Subscription gate: free users limited to 5 habits ─────
  if (user.subscription === "free") {
    const count = await prisma.habit.count({
      where: { userId: user.id, isArchived: false },
    });
    if (count >= 5) {
      return NextResponse.json(
        { error: "UPGRADE_REQUIRED", message: "Free plan limited to 5 crystals" },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const { name, description, category, color, frequency, target, icon } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      category: category || "general",
      color: color || "#a855f7",
      frequency: frequency || "daily",
      target: target ?? 1,
      icon: icon || "sparkles",
    },
  });

  return NextResponse.json(habit, { status: 201 });
}

// ── PATCH: Update a habit ───────────────────────────────────
export async function PATCH(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Habit id required" }, { status: 400 });

  // Verify ownership
  const existing = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const habit = await prisma.habit.update({
    where: { id },
    data: {
      ...(updates.name !== undefined && { name: updates.name.trim() }),
      ...(updates.description !== undefined && { description: updates.description?.trim() || null }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.frequency !== undefined && { frequency: updates.frequency }),
      ...(updates.target !== undefined && { target: updates.target }),
      ...(updates.icon !== undefined && { icon: updates.icon }),
      ...(updates.isArchived !== undefined && { isArchived: updates.isArchived }),
    },
  });

  return NextResponse.json(habit);
}

// ── DELETE: Remove a habit ──────────────────────────────────
export async function DELETE(req: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Habit id required" }, { status: 400 });

  const existing = await prisma.habit.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.habit.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
