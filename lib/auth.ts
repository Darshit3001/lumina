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

  let user = await prisma.user.findUnique({ where: { clerkId } });

  if (!user) {
    const clerkUser = await currentUser();
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${clerkId}@lumina.app`,
        name: clerkUser?.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
          : null,
        avatarUrl: clerkUser?.imageUrl ?? null,
      },
    });
  }

  return user;
}
