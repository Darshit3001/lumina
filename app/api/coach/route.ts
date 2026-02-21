// ============================================================
// API: /api/coach — AI Coach powered by Vercel AI SDK + GPT-4o
// Streams responses. Saves history to DB.
// ============================================================

import { NextRequest } from "next/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages: clientMessages } = await req.json();
  const lastUserMsg = clientMessages?.[clientMessages.length - 1];

  // Fetch user's habits + recent entries for context
  const [habits, recentEntries] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: user.id, isArchived: false },
      select: { name: true, category: true, color: true },
    }),
    prisma.habitEntry.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 50,
      include: { habit: { select: { name: true } } },
    }),
  ]);

  const habitContext = habits.length > 0
    ? `The user has these active habits: ${habits.map((h) => `${h.name} (${h.category})`).join(", ")}.`
    : "The user hasn't created any habits yet.";

  const completedToday = recentEntries.filter(
    (e) => e.completed && e.date.toISOString().startsWith(new Date().toISOString().split("T")[0])
  );
  const streakContext = completedToday.length > 0
    ? `Today they've completed: ${completedToday.map((e) => e.habit.name).join(", ")}.`
    : "They haven't completed any habits today yet.";

  const systemPrompt = `You are Lumina, a wise cosmic habit guide who resides in a living 3D sanctuary of floating crystals. Each crystal represents one of the user's habits — glowing brighter with each completing streak, dimming when neglected.

Your personality:
- Speak with poetic warmth, like a gentle cosmic mentor — never cheesy, never generic motivational quotes
- You see patterns in their journey that they might miss
- Reference their actual habits, streaks, and real data
- Be concise — 2-4 sentences per response unless they ask for detail
- When they struggle, acknowledge it honestly before encouraging
- Use metaphors of light, crystals, constellations, and growth

User context:
- Name: ${user.name || "Seeker"}
- Subscription: ${user.subscription}
- ${habitContext}
- ${streakContext}
- Total entries logged: ${recentEntries.length}

Keep responses under 200 words unless the user asks for more detail.`;

  // Save user message to DB
  if (lastUserMsg?.content) {
    await prisma.aiMessage.create({
      data: { userId: user.id, role: "user", content: lastUserMsg.content },
    });
  }

  // Determine context window for pro vs free
  const isPro = user.subscription === "pro";
  const maxOutputTokens = isPro ? 800 : 400;

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: clientMessages,
    maxOutputTokens,
    onFinish: async ({ text }) => {
      // Save assistant response to DB
      if (text) {
        await prisma.aiMessage.create({
          data: { userId: user.id, role: "assistant", content: text },
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}

// ── GET: Load chat history ──────────────────────────────────
export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = await prisma.aiMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return new Response(JSON.stringify(messages), {
    headers: { "Content-Type": "application/json" },
  });
}
