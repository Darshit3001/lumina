// ============================================================
// lib/auth.ts — Clerk auth helper for API routes
// ============================================================

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Get or create the DB user for the current Clerk session.
 * Call from any server action / API route.
 */
export async function getDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${clerkId}@lumina.app`;
  const name = clerkUser?.firstName
    ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
    : null;
  const avatarUrl = clerkUser?.imageUrl ?? null;

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { email, name, avatarUrl },
    create: { clerkId, email, name, avatarUrl },
  });

  return user;
}
