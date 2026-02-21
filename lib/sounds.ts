// ============================================================
// LUMINA Sound System — Howler.js with Web Audio synthesis
// Sounds: completion chime, explosion burst, ambient loop,
//         button hover, toggle click
// ============================================================

import { Howl, Howler } from "howler";

// ── Volume defaults ─────────────────────────────────────────
const SFX_VOLUME = 0.35;
const AMBIENT_VOLUME = 0.08;

// ── State: user preference stored in localStorage ───────────
let _enabled = true;

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("lumina-sound");
  if (stored !== null) _enabled = stored === "1";
  return _enabled;
}

export function setSoundEnabled(enabled: boolean) {
  _enabled = enabled;
  if (typeof window !== "undefined") {
    localStorage.setItem("lumina-sound", enabled ? "1" : "0");
  }
  if (!enabled) {
    Howler.volume(0);
    stopAmbient();
  } else {
    Howler.volume(1);
  }
}

// ── Web Audio synthesis helpers ─────────────────────────────
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.__luminaAudioCtx) {
    w.__luminaAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return w.__luminaAudioCtx as AudioContext;
}

/** Crystal completion chime — ascending two-tone bell */
export function playCompletionChime() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(SFX_VOLUME * 0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  // First tone
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + 0.4);

  // Second tone (delayed harmonic)
  const gain2 = ctx.createGain();
  gain2.connect(ctx.destination);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(SFX_VOLUME * 0.4, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1320, now + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
  osc2.connect(gain2);
  osc2.start(now + 0.1);
  osc2.stop(now + 0.7);
}

/** Explosion burst — short noise burst with filter sweep */
export function playExplosionBurst() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);
  filter.Q.value = 1.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SFX_VOLUME * 0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(now);
}

/** Button hover — soft tick */
export function playHoverTick() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 3500;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SFX_VOLUME * 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

/** Toggle click — mechanical pop */
export function playToggleClick() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(SFX_VOLUME * 0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
}

// ── Ambient Loop (Howler for smooth looping) ────────────────
let ambientHowl: Howl | null = null;
let ambientId: number | null = null;

/** Start ambient cosmic drone. Creates a generated tone if no file. */
export function startAmbient() {
  if (!isSoundEnabled()) return;

  // Use Web Audio for a generative ambient pad
  const ctx = getAudioCtx();
  if (!ctx) return;

  // If already running, skip
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).__luminaAmbientRunning) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__luminaAmbientRunning = true;

  const gain = ctx.createGain();
  gain.gain.value = AMBIENT_VOLUME;
  gain.connect(ctx.destination);

  // Low drone
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 55; // low hum
  osc1.connect(gain);
  osc1.start();

  // Subtle harmonic
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 82.5;
  const g2 = ctx.createGain();
  g2.gain.value = AMBIENT_VOLUME * 0.5;
  osc2.connect(g2);
  g2.connect(ctx.destination);
  osc2.start();

  // Store refs for cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__luminaAmbientOscs = [osc1, osc2];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__luminaAmbientGains = [gain, g2];
}

export function stopAmbient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__luminaAmbientOscs) {
    w.__luminaAmbientOscs.forEach((o: OscillatorNode) => {
      try { o.stop(); } catch { /* already stopped */ }
    });
    w.__luminaAmbientOscs = null;
  }
  w.__luminaAmbientRunning = false;

  // Also stop Howler ambient if any
  if (ambientHowl && ambientId !== null) {
    ambientHowl.stop(ambientId);
    ambientHowl = null;
    ambientId = null;
  }
}

/** Success fanfare — for streak milestones */
export function playSuccessFanfare() {
  if (!isSoundEnabled()) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const t = now + i * 0.12;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(SFX_VOLUME * 0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  });
}
