// ============================================================
// Marketing Landing Page — LUMINA (Premium)
// 3D hero crystal, features, testimonials, pricing, footer
// ============================================================

"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  Gem,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Shield,
  BarChart3,
  Flame,
  Star,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Features ────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Sparkles,
    title: "Living Crystals",
    description:
      "Each habit becomes a glowing 3D crystal that grows and evolves as you build streaks.",
    color: "#a78bfa",
  },
  {
    icon: Zap,
    title: "Particle Explosions",
    description:
      "Complete a habit and watch it explode with 1000+ GPU particles. Visual feedback that feels magical.",
    color: "#22d3ee",
  },
  {
    icon: Brain,
    title: "AI Coach",
    description:
      "GPT-4o powered coaching that understands your patterns and pushes you forward with insights.",
    color: "#d946ef",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description:
      "Track streaks, completion rates, and weekly patterns with beautiful glass-morphism charts.",
    color: "#6366f1",
  },
  {
    icon: Flame,
    title: "Streak System",
    description:
      "Crystals glow brighter with each day. Fire particles ignite after 7-day streaks.",
    color: "#f97316",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description:
      "End-to-end encryption with Clerk auth. Your habits are your business — nobody else's.",
    color: "#34d399",
  },
] as const;

// ── Testimonials ────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Arjun S.",
    role: "Software Engineer",
    text: "LUMINA turned habit tracking from a chore into something I actually look forward to. The 3D crystals are addictive.",
    avatar: "A",
  },
  {
    name: "Maya R.",
    role: "Design Lead",
    text: "The explosion animations when you complete a habit... chef's kiss. I've never been this consistent with meditation.",
    avatar: "M",
  },
  {
    name: "Kai T.",
    role: "Founder",
    text: "The AI coach actually gives personalized advice based on my patterns. It noticed I skip workouts on Wednesdays before I did.",
    avatar: "K",
  },
] as const;

// ── Pricing ─────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Up to 5 habit crystals",
      "3D Sanctuary with island",
      "Basic streak tracking",
      "7-day activity charts",
      "Community support",
    ],
    cta: "Start Free",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "For serious habit builders",
    features: [
      "Unlimited habit crystals",
      "Priority AI coaching (GPT-4o)",
      "Advanced analytics & export",
      "Fire particle effects",
      "Custom crystal colors",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    href: "/sign-up",
    highlighted: true,
  },
] as const;

export default function MarketingPage() {
  const featuresRef = useRef<HTMLElement>(null);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-cosmic-dark">
      {/* ── Background effects ────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 cosmic-gradient stars-bg" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/8 blur-[140px] animate-pulse-glow" />
      <div className="pointer-events-none absolute right-1/4 top-2/3 h-[300px] w-[300px] rounded-full bg-neon-cyan/5 blur-[100px] animate-pulse-glow" style={{ animationDelay: "2s" }} />

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-neon-violet to-neon-fuchsia shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Gem className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            LUMINA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            className="bg-neon-violet hover:bg-neon-violet/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          >
            <Link href="/sign-up">
              Get Started
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
         ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-20 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neon-violet/20 bg-neon-violet/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-neon-violet" />
          <span className="text-sm text-neon-violet">
            Your habits, reimagined in 3D
          </span>
        </div>

        {/* Title */}
        <h1 className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-7xl lg:text-8xl">
          Your{" "}
          <span className="bg-gradient-to-r from-neon-violet via-neon-fuchsia to-neon-cyan bg-clip-text text-transparent">
            3D Habit
          </span>
          <br />
          Sanctuary
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Build habits that glow. Each habit becomes a living crystal on a
          floating island. Streaks emit light. Completions explode with
          particles.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Button
            size="lg"
            asChild
            className="h-13 bg-gradient-to-r from-neon-violet to-neon-fuchsia px-8 text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] transition-all duration-300 hover:scale-[1.02]"
          >
            <Link href="/sign-up">
              Enter the Sanctuary
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-13 border-neon-violet/20 text-neon-violet hover:bg-neon-violet/10 px-8"
          >
            <Link href="#features">Learn More</Link>
          </Button>
        </div>

        {/* 3D Crystal Hero Orb */}
        <div className="relative mt-20 h-64 w-64 animate-float">
          {/* Outer glow rings */}
          <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-neon-violet/15 to-neon-fuchsia/10 blur-3xl animate-pulse-glow" />
          <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-neon-violet/20 to-neon-cyan/10 blur-2xl" />

          {/* Crystal body */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-neon-violet/50 to-neon-indigo/40 blur-lg" />
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-neon-violet via-neon-fuchsia to-neon-cyan opacity-80 shadow-[0_0_60px_rgba(168,85,247,0.5)]" />

          {/* Inner light */}
          <div className="absolute inset-16 rounded-full bg-white/20 blur-md" />

          {/* Floating mini orbs */}
          <div className="absolute -right-6 top-8 h-4 w-4 rounded-full bg-neon-cyan/60 blur-[2px] animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute -left-4 bottom-12 h-3 w-3 rounded-full bg-neon-fuchsia/60 blur-[2px] animate-float" style={{ animationDelay: "2s" }} />
          <div className="absolute right-4 -bottom-4 h-2.5 w-2.5 rounded-full bg-neon-violet/60 blur-[1px] animate-float" style={{ animationDelay: "3s" }} />
        </div>

        {/* Scroll hint */}
        <button
          onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="mt-12 flex flex-col items-center gap-1 text-white/20 hover:text-white/40 transition-colors"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* ══════════════════════════════════════════════════════
          FEATURES SECTION
         ══════════════════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        id="features"
        className="relative z-10 px-6 pb-24 pt-16 md:px-12"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-neon-violet to-neon-cyan bg-clip-text text-transparent">
                build habits that stick
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              LUMINA combines 3D visualization, AI coaching, and gamification
              into a habit tracker that actually makes you want to show up.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group glass rounded-2xl p-6 transition-all duration-300 hover:border-white/12 glass-hover"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon
                    className="h-5 w-5 transition-all duration-300 group-hover:scale-110"
                    style={{
                      color,
                      filter: `drop-shadow(0 0 6px ${color}66)`,
                    }}
                  />
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS SECTION
         ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 pb-24 pt-8 md:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Loved by{" "}
              <span className="bg-gradient-to-r from-neon-fuchsia to-neon-violet bg-clip-text text-transparent">
                habit builders
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              See what our users have to say about their Sanctuary.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text, avatar }) => (
              <div
                key={name}
                className="glass rounded-2xl p-6 transition-all duration-300 hover:border-white/10"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-[#fbbf24] text-[#fbbf24]"
                    />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-white/60">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neon-violet/30 to-neon-fuchsia/20 text-sm font-bold text-white/70">
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/70">{name}</p>
                    <p className="text-[11px] text-white/30">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING SECTION
         ══════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 px-6 pb-28 pt-8 md:px-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Simple{" "}
              <span className="bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                pricing
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free. Upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mx-auto max-w-2xl">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`glass rounded-3xl p-7 transition-all duration-300 relative overflow-hidden ${
                  plan.highlighted
                    ? "border-neon-violet/30 glass-glow-violet"
                    : "hover:border-white/10"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-neon-violet/20 px-3 py-1 text-[10px] font-semibold text-neon-violet uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-white/80">{plan.name}</h3>
                <p className="mt-1 text-xs text-white/35">{plan.description}</p>

                <div className="mt-5 mb-6">
                  <span className="text-4xl font-bold text-white/90">
                    {plan.price}
                  </span>
                  <span className="text-sm text-white/35">{plan.period}</span>
                </div>

                <ul className="mb-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-white/55"
                    >
                      <Check className="h-4 w-4 shrink-0 text-neon-violet" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-neon-violet to-neon-fuchsia text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_30px_rgba(167,139,250,0.5)] hover:scale-[1.01]"
                      : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                  }`}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-cosmic-border px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-neon-violet to-neon-fuchsia">
              <Gem className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-white/50">LUMINA</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} LUMINA. Crafted with obsession.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
