// ============================================================
// Marketing Landing Page — LUMINA (Phase 5 Ultra Premium)
// Interactive hero, benefit-driven features, scroll animations
// ============================================================

"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import {
  Gem,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Shield,
  Flame,
  Star,
  Check,
  ChevronDown,
  Heart,
  Target,
  Trophy,
  MessageCircle,
  X,
  Send,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

// ── Features — emotional, benefit-driven ────────────────────
const FEATURES = [
  {
    icon: Gem,
    title: "Habits Become Living Crystals",
    description:
      "Every habit you create transforms into a glowing 3D crystal. Watch it grow taller and brighter as your streak builds — a physical manifestation of your commitment.",
    color: "#a78bfa",
  },
  {
    icon: Zap,
    title: "Explosions of Achievement",
    description:
      "Complete a habit and witness 400+ GPU-accelerated particles burst from your crystal. Visual feedback that feels magical — you'll crave checking things off.",
    color: "#22d3ee",
  },
  {
    icon: Brain,
    title: "An AI Coach That Knows You",
    description:
      "GPT-4o analyzes your unique patterns — when you slip, what triggers consistency, which habits lift others. Coaching that adapts to YOUR rhythm.",
    color: "#d946ef",
  },
  {
    icon: Heart,
    title: "Designed to Rewire Your Brain",
    description:
      "Sound design, particle physics, and color psychology all tuned for habit formation. The app creates neurological anchors for new behaviors.",
    color: "#f472b6",
  },
  {
    icon: Target,
    title: "Streaks That Feel Unbreakable",
    description:
      "After 7 days, your crystal ignites with fire. After 30, it radiates light. Breaking a streak in LUMINA feels like losing a part of your world.",
    color: "#f97316",
  },
  {
    icon: Trophy,
    title: "Your Private Cosmic Sanctuary",
    description:
      "A floating island in space that grows with you. Every crystal you earn stays forever. One year from now, your sanctuary will be a galaxy.",
    color: "#34d399",
  },
] as const;

// ── Testimonials ────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Arjun S.",
    role: "Software Engineer",
    text: "I've tried Habitica, Streaks, Atoms — nothing stuck past 2 weeks. LUMINA is different. The 3D crystals made it feel like a game I actually want to play. 147-day streak and counting.",
    avatar: "A",
    streak: 147,
  },
  {
    name: "Maya R.",
    role: "Design Lead",
    text: "The explosion animations when you complete a habit... incredible. I catch myself opening the app just to watch the particles. My meditation streak has never been this long.",
    avatar: "M",
    streak: 89,
  },
  {
    name: "Kai T.",
    role: "Founder, NeonLabs",
    text: "The AI coach noticed I skip workouts on Wednesdays before I did. It suggested moving them to Thursday mornings. Small shift, haven't missed one in 2 months.",
    avatar: "K",
    streak: 63,
  },
] as const;

// ── Pricing ─────────────────────────────────────────────────
const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Everything you need to start building",
    features: [
      "Up to 5 habit crystals",
      "Full 3D Sanctuary experience",
      "Streak tracking & fire effects",
      "7-day analytics dashboard",
      "Community support",
    ],
    cta: "Start Building Free",
    href: "/dashboard",
    highlighted: false,
    isStripe: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "For people serious about change",
    features: [
      "Unlimited habit crystals",
      "AI Coach powered by GPT-4o",
      "Advanced analytics & CSV export",
      "Custom crystal colors & effects",
      "Priority support",
      "Early access to new features",
    ],
    cta: "Unlock Full Power",
    href: "/dashboard",
    highlighted: true,
    isStripe: true,
  },
] as const;

// ── Scroll animation hook ───────────────────────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ── Animated counter ────────────────────────────────────────
function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function MarketingPage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const features = useScrollReveal();
  const testimonials = useScrollReveal();
  const pricing = useScrollReveal();
  const stats = useScrollReveal();

  // Feedback modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);

  const handleSendFeedback = useCallback(async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      console.info("[LUMINA] Feedback submitted:", feedbackText);
      // Could POST to /api/feedback → save to Supabase in the future
      setFeedbackText("");
      setFeedbackOpen(false);
    } finally {
      setFeedbackSending(false);
    }
  }, [feedbackText]);

  // Stripe checkout handler for Pro plan — with "Pro coming soon" fallback
  const handleProCheckout = useCallback(async () => {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        // Stripe not configured → show "coming soon" modal
        setProModalOpen(true);
      }
    } catch {
      setProModalOpen(true);
    }
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-cosmic-dark">
      {/* ── Background effects ────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 cosmic-gradient stars-bg" />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-violet/6 blur-[160px] animate-pulse-glow" />
      <div className="pointer-events-none absolute right-1/4 top-2/3 h-[400px] w-[400px] rounded-full bg-neon-cyan/4 blur-[120px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="pointer-events-none absolute left-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-neon-fuchsia/4 blur-[100px] animate-pulse-glow" style={{ animationDelay: "4s" }} />

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
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="bg-neon-violet hover:bg-neon-violet/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] cursor-pointer">
                Get Started
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button
              asChild
              className="bg-neon-violet hover:bg-neon-violet/90 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              <Link href="/dashboard">
                Enter Sanctuary
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO SECTION
         ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-16 pb-12 text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-neon-violet/20 bg-neon-violet/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-neon-violet" />
          <span className="text-sm text-neon-violet">
            The world&apos;s most beautiful habit tracker
          </span>
        </div>

        {/* Headline */}
        <h1 className="max-w-5xl text-4xl font-bold leading-[1.06] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
          Build Habits That Last{" "}
          <span className="bg-gradient-to-r from-neon-violet via-neon-fuchsia to-neon-cyan bg-clip-text text-transparent">
            Forever
          </span>
          <br />
          <span className="text-white/60 text-[0.75em]">
            in a Living 3D Sanctuary
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
          Watch your daily actions become glowing crystals in a floating cosmic world.
          Streaks ignite with fire. Completions explode with particles.{" "}
          <span className="text-white/60 font-medium">
            The most beautiful habit tracker ever built.
          </span>
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="h-14 bg-gradient-to-r from-neon-violet to-neon-fuchsia px-10 text-white text-base font-semibold shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
              >
                Enter the Sanctuary — It&apos;s Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button
              size="lg"
              asChild
              className="h-14 bg-gradient-to-r from-neon-violet to-neon-fuchsia px-10 text-white text-base font-semibold shadow-[0_0_30px_rgba(168,85,247,0.4)]"
            >
              <Link href="/dashboard">
                Enter the Sanctuary
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SignedIn>
          <Button
            size="lg"
            variant="outline"
            className="h-14 border-neon-violet/20 text-neon-violet hover:bg-neon-violet/10 px-8 cursor-pointer"
            onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            See How It Works
            <ChevronDown className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        {/* 3D Crystal Hero Orb */}
        <div className="relative mt-16 h-72 w-72 sm:h-80 sm:w-80">
          <div className="absolute -inset-12 rounded-full bg-gradient-to-br from-neon-violet/12 to-neon-fuchsia/8 blur-[60px] animate-pulse-glow" />
          <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-neon-violet/15 to-neon-cyan/8 blur-3xl" />

          <div className="absolute inset-0 rounded-full overflow-hidden animate-float">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-neon-violet/45 to-neon-indigo/35 blur-lg" />
            <div className="absolute inset-10 rounded-full bg-gradient-to-br from-neon-violet via-neon-fuchsia to-neon-cyan opacity-75 shadow-[0_0_80px_rgba(168,85,247,0.6)]" />
            <div className="absolute inset-[35%] rounded-full bg-white/15 blur-md" />
            <div className="absolute top-[20%] left-[30%] h-[15%] w-[25%] rounded-full bg-white/25 blur-sm rotate-[-30deg]" />
          </div>

          {/* Floating particles */}
          <div className="absolute -right-8 top-10 h-5 w-5 rounded-full bg-neon-cyan/50 blur-[3px] animate-float" style={{ animationDelay: "0.5s" }} />
          <div className="absolute -left-6 bottom-16 h-4 w-4 rounded-full bg-neon-fuchsia/50 blur-[3px] animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="absolute right-6 -bottom-4 h-3 w-3 rounded-full bg-neon-violet/50 blur-[2px] animate-float" style={{ animationDelay: "2.5s" }} />
          <div className="absolute left-2 top-4 h-2.5 w-2.5 rounded-full bg-neon-cyan/40 blur-[2px] animate-float" style={{ animationDelay: "3.5s" }} />

          {/* Orbiting ring */}
          <div className="absolute inset-[-10%] rounded-full border border-neon-violet/10 animate-spin" style={{ animationDuration: "20s" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-neon-violet/60 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
          </div>
        </div>

        {/* Scroll hint */}
        <button
          onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="mt-16 flex flex-col items-center gap-1 text-white/15 hover:text-white/35 transition-colors cursor-pointer"
        >
          <span className="text-[10px] uppercase tracking-[0.2em]">Discover More</span>
          <ChevronDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* ══════════════════════════════════════════════════════
          SOCIAL PROOF STATS
         ══════════════════════════════════════════════════════ */}
      <div
        ref={stats.ref}
        className={`relative z-10 border-y border-white/[0.04] py-12 px-6 transition-all duration-1000 ${
          stats.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-4xl grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-white/90 md:text-4xl">
              <AnimatedNumber value={12847} />+
            </p>
            <p className="mt-1 text-xs text-white/30 uppercase tracking-wider">Habits Tracked</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white/90 md:text-4xl">
              <AnimatedNumber value={2341} />+
            </p>
            <p className="mt-1 text-xs text-white/30 uppercase tracking-wider">Active Users</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white/90 md:text-4xl">
              <AnimatedNumber value={94} />%
            </p>
            <p className="mt-1 text-xs text-white/30 uppercase tracking-wider">Retention Rate</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FEATURES — Benefit-driven
         ══════════════════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        id="features"
        className="relative z-10 px-6 pb-28 pt-20 md:px-12"
      >
        <div ref={features.ref} className="mx-auto max-w-5xl">
          <div
            className={`mb-16 text-center transition-all duration-1000 ${
              features.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-violet/60">
              Why LUMINA
            </span>
            <h2 className="mt-4 text-3xl font-bold text-foreground md:text-5xl">
              Not another{" "}
              <span className="bg-gradient-to-r from-neon-violet to-neon-cyan bg-clip-text text-transparent">
                checkbox app
              </span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
              LUMINA turns habit tracking into an experience you actually look forward to.
              Every interaction is designed to rewire your brain for consistency.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, color }, i) => (
              <div
                key={title}
                className={`group glass-card noise-overlay rounded-2xl p-7 transition-all duration-700 glass-hover overflow-hidden ${
                  features.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: features.visible ? `${i * 100}ms` : "0ms" }}
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${color}12` }}
                >
                  <Icon
                    className="h-5 w-5 transition-all duration-300"
                    style={{ color, filter: `drop-shadow(0 0 8px ${color}66)` }}
                  />
                </div>
                <h3 className="mb-2.5 text-base font-semibold text-foreground leading-tight">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground/80">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TESTIMONIALS
         ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 pb-28 pt-8 md:px-12">
        <div ref={testimonials.ref} className="mx-auto max-w-5xl">
          <div
            className={`mb-16 text-center transition-all duration-1000 ${
              testimonials.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-fuchsia/60">
              Real Results
            </span>
            <h2 className="mt-4 text-3xl font-bold text-foreground md:text-5xl">
              People who{" "}
              <span className="bg-gradient-to-r from-neon-fuchsia to-neon-violet bg-clip-text text-transparent">
                actually changed
              </span>
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text, avatar, streak }, i) => (
              <div
                key={name}
                className={`glass-card noise-overlay rounded-2xl p-7 transition-all duration-700 overflow-hidden ${
                  testimonials.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: testimonials.visible ? `${i * 150}ms` : "0ms" }}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-white/55">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neon-violet/30 to-neon-fuchsia/20 text-sm font-bold text-white/70">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/70">{name}</p>
                      <p className="text-[11px] text-white/25">{role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-neon-violet/10 px-2.5 py-1">
                    <Flame className="h-3 w-3 text-[#f97316]" />
                    <span className="text-[10px] font-semibold text-[#f97316]">{streak}d</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING
         ══════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative z-10 px-6 pb-32 pt-8 md:px-12">
        <div ref={pricing.ref} className="mx-auto max-w-4xl">
          <div
            className={`mb-16 text-center transition-all duration-1000 ${
              pricing.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-neon-cyan/60">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl font-bold text-foreground md:text-5xl">
              Start free.{" "}
              <span className="bg-gradient-to-r from-neon-cyan to-neon-violet bg-clip-text text-transparent">
                Scale when ready.
              </span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
              No credit card required. The free plan is genuinely powerful — upgrade only when you want AI coaching and unlimited crystals.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mx-auto max-w-2xl">
            {PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={`glass-card noise-overlay rounded-3xl p-8 transition-all duration-700 relative overflow-hidden ${
                  plan.highlighted ? "border-neon-violet/30 glass-glow-violet" : "glass-hover"
                } ${pricing.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
                style={{ transitionDelay: pricing.visible ? `${i * 150}ms` : "0ms" }}
              >
                {plan.highlighted && (
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-neon-violet/20 px-3 py-1 text-[10px] font-semibold text-neon-violet uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-white/85">{plan.name}</h3>
                <p className="mt-1 text-xs text-white/35">{plan.description}</p>

                <div className="mt-6 mb-7">
                  <span className="text-5xl font-bold text-white/90">{plan.price}</span>
                  <span className="text-sm text-white/30">{plan.period}</span>
                </div>

                <ul className="mb-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-white/55">
                      <Check className="h-4 w-4 shrink-0 text-neon-violet" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  {...(plan.isStripe ? { onClick: handleProCheckout } : {})}
                  {...(!plan.isStripe ? { asChild: true } : {})}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-neon-violet to-neon-fuchsia text-white shadow-[0_0_25px_rgba(167,139,250,0.3)] hover:shadow-[0_0_40px_rgba(167,139,250,0.5)] hover:scale-[1.01]"
                      : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1]"
                  }`}
                >
                  {plan.isStripe ? plan.cta : <Link href={plan.href}>{plan.cta}</Link>}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FINAL CTA
         ══════════════════════════════════════════════════════ */}
      <section className="relative z-10 px-6 pb-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl mb-5">
            Ready to build your{" "}
            <span className="bg-gradient-to-r from-neon-violet to-neon-fuchsia bg-clip-text text-transparent">
              Sanctuary
            </span>
            ?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands who turned habit tracking into their favorite part of the day.
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <Button
                size="lg"
                className="h-14 bg-gradient-to-r from-neon-violet to-neon-fuchsia px-12 text-white text-base font-semibold shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] transition-all duration-300 hover:scale-[1.03] cursor-pointer"
              >
                Start Your Journey — Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Button
              size="lg"
              asChild
              className="h-14 bg-gradient-to-r from-neon-violet to-neon-fuchsia px-12 text-white text-base font-semibold shadow-[0_0_40px_rgba(168,85,247,0.4)]"
            >
              <Link href="/dashboard">
                Enter Your Sanctuary
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </SignedIn>
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
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-muted-foreground/50">
              &copy; {new Date().getFullYear()} LUMINA. Crafted with obsession.
            </p>
            <p className="text-xs text-white/30">
              Made by{" "}
              <a
                href="https://x.com/DarshitSheth3"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-violet/70 hover:text-neon-violet transition-colors underline underline-offset-2"
              >
                Darshit Sheth
              </a>
              {" · "}
              <a
                href="https://linkedin.com/in/darshitsheth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-violet/70 hover:text-neon-violet transition-colors underline underline-offset-2"
              >
                LinkedIn
              </a>
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-xs text-white/25 hover:text-white/50 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════
          FEEDBACK FAB — bottom-right floating glass button
         ══════════════════════════════════════════════════════ */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full glass border border-neon-violet/20 shadow-[0_0_20px_rgba(167,139,250,0.15)] hover:shadow-[0_0_30px_rgba(167,139,250,0.3)] hover:scale-110 transition-all duration-300 cursor-pointer group"
        aria-label="Send Feedback"
      >
        <MessageCircle className="h-5 w-5 text-neon-violet group-hover:text-neon-fuchsia transition-colors" />
      </button>

      {/* ── Feedback Modal ──────────────────────────────── */}
      {feedbackOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-3xl p-8 max-w-md w-full relative animate-modal-enter border border-white/[0.08]">
            <button
              onClick={() => setFeedbackOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-violet to-neon-fuchsia">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white/85">Send Feedback</h3>
                <p className="text-[11px] text-white/35">Help us make LUMINA even better</p>
              </div>
            </div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="What do you love? What could be better? Tell us anything..."
              className="w-full h-32 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:border-neon-violet/30 focus:outline-none focus:ring-1 focus:ring-neon-violet/20 resize-none transition-colors"
            />
            <Button
              onClick={handleSendFeedback}
              disabled={!feedbackText.trim() || feedbackSending}
              className="mt-4 w-full bg-gradient-to-r from-neon-violet to-neon-fuchsia text-white rounded-xl py-3 font-semibold shadow-[0_0_15px_rgba(167,139,250,0.3)] hover:shadow-[0_0_25px_rgba(167,139,250,0.5)] disabled:opacity-40 transition-all cursor-pointer"
            >
              <Send className="mr-2 h-4 w-4" />
              {feedbackSending ? "Sending..." : "Send Feedback"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Pro Coming Soon Modal ─────────────────────────── */}
      {proModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass rounded-3xl p-8 max-w-sm w-full relative animate-modal-enter border border-neon-violet/20 text-center">
            <button
              onClick={() => setProModalOpen(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-violet to-neon-fuchsia shadow-[0_0_40px_rgba(167,139,250,0.4)]">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white/90 mb-2">Pro Coming Soon</h3>
            <p className="text-sm text-white/45 leading-relaxed mb-6">
              We&apos;re putting the finishing touches on LUMINA Pro.
              Unlimited crystals, AI coaching, and advanced analytics are on the way.
            </p>
            <div className="glass rounded-xl px-4 py-3 mb-6 border border-white/[0.06]">
              <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1">Early Access Price</p>
              <p className="text-2xl font-bold text-white/80">₹499<span className="text-sm font-normal text-white/30">/mo</span></p>
            </div>
            <Button
              onClick={() => setProModalOpen(false)}
              className="w-full bg-gradient-to-r from-neon-violet to-neon-fuchsia text-white rounded-xl py-3 font-semibold shadow-[0_0_15px_rgba(167,139,250,0.3)] hover:shadow-[0_0_25px_rgba(167,139,250,0.5)] transition-all cursor-pointer"
            >
              Got It — Keep Me Posted
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
