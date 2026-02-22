// ============================================================
// Clerk Middleware — Protect app routes, allow marketing pages
// ============================================================

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/habits(.*)",
  "/calendar(.*)",
  "/analytics(.*)",
  "/coach(.*)",
  "/settings(.*)",
  "/api/habits(.*)",
  "/api/entries(.*)",
  "/api/coach(.*)",
  "/api/account(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
