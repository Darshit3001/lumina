// ============================================================
// NeonCursor — Glowing orb that follows the mouse + trail
// Renders via CSS transforms for peak performance
// ============================================================

"use client";

import { useEffect, useRef, useCallback } from "react";

const TRAIL_LENGTH = 12;
const TRAIL_DECAY = 0.85;

export default function NeonCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  const positions = useRef<{ x: number; y: number }[]>(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }))
  );
  const raf = useRef<number>(0);

  const animate = useCallback(() => {
    const { x, y } = mouse.current;

    // Update main dot
    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${x - 10}px, ${y - 10}px, 0)`;
    }

    // Update trail particles with spring-like follow
    positions.current.forEach((pos, i) => {
      const target = i === 0 ? { x, y } : positions.current[i - 1];
      const ease = 0.25 - i * 0.012;
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;

      const el = trailRefs.current[i];
      if (el) {
        const scale = 1 - i * (0.7 / TRAIL_LENGTH);
        const opacity = (1 - i / TRAIL_LENGTH) * TRAIL_DECAY;
        el.style.transform = `translate3d(${pos.x - 4}px, ${pos.y - 4}px, 0) scale(${scale})`;
        el.style.opacity = `${opacity}`;
      }
    });

    raf.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Hide on touch devices
    if (typeof window !== "undefined" && "ontouchstart" in window) return;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [animate]);

  // Don't render on touch devices / SSR
  if (typeof window !== "undefined" && "ontouchstart" in window) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ mixBlendMode: "screen" }}
      aria-hidden
    >
      {/* Trail particles */}
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { trailRefs.current[i] = el; }}
          className="absolute left-0 top-0 h-2 w-2 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(167,139,250,0.6) 0%, transparent 70%)`,
            willChange: "transform, opacity",
          }}
        />
      ))}

      {/* Main dot */}
      <div
        ref={dotRef}
        className="absolute left-0 top-0 h-5 w-5 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(167,139,250,0.9) 0%, rgba(167,139,250,0.3) 50%, transparent 70%)`,
          boxShadow: "0 0 12px rgba(167,139,250,0.5), 0 0 30px rgba(167,139,250,0.2)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
