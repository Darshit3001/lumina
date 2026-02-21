// ============================================================
// Sidebar — Liquid-glass navigation with animated neon icons
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sparkles,
  CalendarDays,
  BarChart3,
  MessageCircle,
  Settings,
  Gem,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Neon color per nav item for icon glow */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Sanctuary", icon: LayoutDashboard, neon: "#a78bfa" },
  { href: "/habits",    label: "Crystals",  icon: Sparkles,        neon: "#d946ef" },
  { href: "/calendar",  label: "Calendar",  icon: CalendarDays,    neon: "#22d3ee" },
  { href: "/analytics", label: "Analytics", icon: BarChart3,       neon: "#6366f1" },
  { href: "/coach",     label: "AI Coach",  icon: MessageCircle,   neon: "#34d399" },
  { href: "/settings",  label: "Settings",  icon: Settings,        neon: "#f472b6" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center py-4">
      {/* Glass background panel */}
      <div className="absolute inset-y-3 inset-x-2 rounded-2xl glass" />

      {/* ── Logo ──────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        className="group relative z-10 mb-8 mt-2 flex items-center justify-center"
      >
        {/* Animated outer ring on hover */}
        <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-[#a78bfa]/0 to-[#d946ef]/0 group-hover:from-[#a78bfa]/20 group-hover:to-[#d946ef]/20 transition-all duration-500 blur-sm" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#d946ef] shadow-[0_0_20px_rgba(167,139,250,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(167,139,250,0.7)]">
          <Gem className="h-5 w-5 text-white drop-shadow-lg" />
        </div>
      </Link>

      {/* ── Navigation Links ─────────────────────────────── */}
      <nav className="relative z-10 flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, neon }) => {
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                    isActive
                      ? "glass text-white shadow-[0_0_22px_rgba(167,139,250,0.3)]"
                      : "text-white/35 hover:text-white/70 hover:bg-white/5"
                  )}
                >
                  {/* Neon icon glow — animated drop-shadow per-color */}
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] transition-all duration-300",
                      isActive && "animate-pulse-glow-icon"
                    )}
                    style={isActive ? {
                      color: neon,
                      filter: `drop-shadow(0 0 6px ${neon}99) drop-shadow(0 0 12px ${neon}44)`,
                    } : undefined}
                  />

                  {/* Active indicator — neon bar with per-item color */}
                  {isActive && (
                    <span
                      className="absolute -left-[10px] top-1/2 h-6 w-[2.5px] -translate-y-1/2 rounded-r-full"
                      style={{
                        background: `linear-gradient(to bottom, ${neon}, #d946ef)`,
                        boxShadow: `0 0 14px ${neon}cc`,
                      }}
                    />
                  )}

                  {/* Hover glow ring */}
                  {!isActive && (
                    <span
                      className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        boxShadow: `inset 0 0 12px ${neon}15, 0 0 8px ${neon}10`,
                      }}
                    />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={16}
                className="glass border-white/10 text-white/90 text-xs"
              >
                {label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* ── Bottom accent ─────────────────────────────────── */}
      <div className="relative z-10 mt-auto flex flex-col items-center gap-3 mb-2">
        <div className="h-px w-8 bg-gradient-to-r from-transparent via-[#a78bfa]/30 to-transparent" />
        <span className="text-[9px] font-semibold tracking-[0.25em] text-white/20 neon-glow">
          LUMINA
        </span>
      </div>
    </aside>
  );
}
