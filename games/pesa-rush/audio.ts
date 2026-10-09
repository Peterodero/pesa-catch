import type { SoundKey } from "./types";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/** Tiny WebAudio synth. No audio files needed. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private readonly isMuted: () => boolean;

  constructor(isMuted: () => boolean) {
    this.isMuted = isMuted;
  }

  /** Call from a tap/click handler. Browsers block audio until then. */
  unlock(): void {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  play(kind: SoundKey, pitch = 1): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || this.isMuted()) return;
    const p = pitch;
    switch (kind) {
      case "coin":
        this.tone(880 * p, 0, 0.09, "square", 0.08);
        this.tone(1320 * p, 0.07, 0.14, "square", 0.08);
        break;
      case "airtime":
        [660, 880, 1320].forEach((f, i) => this.tone(f * p, i * 0.06, 0.12, "triangle", 0.16));
        break;
      case "golden":
        [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone(f, i * 0.07, 0.2, "sine", 0.18));
        break;
      case "fraud":
        this.tone(240, 0, 0.4, "sawtooth", 0.16, 60);
        break;
      case "miss":
        this.tone(320, 0, 0.16, "triangle", 0.1, 200);
        break;
      case "tick":
        this.tone(600, 0, 0.1, "square", 0.08);
        break;
      case "go":
        this.tone(900, 0, 0.3, "square", 0.1, 1200);
        break;
      case "levelUp":
        [440, 660, 880].forEach((f, i) => this.tone(f, i * 0.08, 0.14, "triangle", 0.16));
        break;
      case "end":
        [523, 392, 262].forEach((f, i) => this.tone(f, i * 0.16, 0.3, "triangle", 0.18));
        break;
      case "victory":
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, i * 0.1, 0.35, "sine", 0.22));
        break;
    }
  }

  dispose(): void {
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx && ctx.state !== "closed") void ctx.close();
  }

  private tone(
    freq: number,
    delay: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    slideTo?: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }
}
