/**
 * Pure game rules: no Phaser, no DOM, no randomness unless an Rng is passed in.
 * Everything here is unit tested in logic.test.ts.
 */
import type { ThemeConfig } from "@/lib/theme";
import type { ColorToken, ComboConfig, DifficultyConfig, ItemDef } from "./types";

export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;
export const ARENA_WIDTH = 960;
export const PLAYER1_COLOR = "#00F0FF";
export const PLAYER2_COLOR = "#FF3366";

export function getWinner(p1Score: number, p2Score: number): "player1" | "player2" | "tie" {
  if (p1Score > p2Score) return "player1";
  if (p2Score > p1Score) return "player2";
  return "tie";
}

export interface LeadStatus {
  leader: "player1" | "player2" | "tie";
  diff: number;
  label: string;
}

export function getLeadStatus(
  p1Name: string,
  p1Score: number,
  p2Name: string,
  p2Score: number,
): LeadStatus {
  const diff = Math.abs(p1Score - p2Score);
  if (p1Score > p2Score) {
    return { leader: "player1", diff, label: `${p1Name.toUpperCase()} LEADS BY +${diff}` };
  }
  if (p2Score > p1Score) {
    return { leader: "player2", diff, label: `${p2Name.toUpperCase()} LEADS BY +${diff}` };
  }
  return { leader: "tie", diff: 0, label: "TIED MATCH!" };
}

export function getArenaSpawnX(rng: Rng, arena: "left" | "right", margin = 60): number {
  const arenaW = 960;
  const relX = margin + rng() * (arenaW - 2 * margin);
  return arena === "left" ? relX : arenaW + relX;
}

export type Rng = () => number;

/** Small seeded random generator (mulberry32), handy for tests. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/* ------------------------------ difficulty ------------------------------ */

export function getLevel(
  elapsedMs: number,
  d: Pick<DifficultyConfig, "levelDurationMs" | "maxLevel">,
): number {
  return clamp(Math.floor(Math.max(0, elapsedMs) / d.levelDurationMs), 0, d.maxLevel);
}

export interface Difficulty {
  level: number;
  fallSpeed: number;
  spawnIntervalMs: number;
  fraudWeightBonus: number;
}

export function getDifficulty(level: number, d: DifficultyConfig): Difficulty {
  const l = clamp(Math.floor(level), 0, d.maxLevel);
  return {
    level: l,
    fallSpeed: d.baseFallSpeed + l * d.fallSpeedStep,
    spawnIntervalMs: Math.max(d.minSpawnIntervalMs, d.baseSpawnIntervalMs - l * d.spawnIntervalStep),
    fraudWeightBonus: l * d.fraudWeightPerLevel,
  };
}

/** Random wait before the next spawn, +/- jitter around the base interval. */
export function nextSpawnDelay(intervalMs: number, rng: Rng, jitter = 0.3): number {
  return intervalMs * (1 - jitter + rng() * jitter * 2);
}

export function spawnX(rng: Rng, width: number, margin: number): number {
  return margin + rng() * (width - 2 * margin);
}

/** Weighted random pick. Fraud items get `fraudWeightBonus` extra weight. */
export function pickItem<T extends Pick<ItemDef, "kind" | "weight">>(
  items: readonly T[],
  rng: Rng,
  fraudWeightBonus = 0,
): T {
  const weights = items.map((i) =>
    Math.max(0, i.weight + (i.kind === "fraud" ? fraudWeightBonus : 0)),
  );
  const total = weights.reduce((sum, w) => sum + w, 0);
  const first = items[0];
  if (first === undefined) throw new Error("pickItem needs at least one item");
  if (total <= 0) return first;
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll < 0) return items[i] ?? first;
  }
  return items[items.length - 1] ?? first;
}

/* -------------------------------- scoring -------------------------------- */

export interface RoundState {
  score: number;
  lives: number;
  combo: number;
  maxCombo: number;
  itemsCaught: number;
}

export function createInitialState(lives: number): RoundState {
  return { score: 0, lives, combo: 0, maxCombo: 0, itemsCaught: 0 };
}

/** x1 at the start, +1 every `step` catches in a row, capped. */
export function comboMultiplier(combo: number, c: ComboConfig): number {
  return clamp(1 + Math.floor(Math.max(0, combo) / c.step), 1, c.maxMultiplier);
}

export interface CatchResult {
  state: RoundState;
  /** Points shown to the player: multiplied for good items, the raw penalty for fraud. */
  delta: number;
  multiplier: number;
  lostLife: boolean;
}

export function applyCatch(
  state: RoundState,
  item: Pick<ItemDef, "kind" | "points">,
  combo: ComboConfig,
): CatchResult {
  if (item.kind === "fraud") {
    return {
      state: {
        ...state,
        score: Math.max(0, state.score + item.points),
        lives: Math.max(0, state.lives - 1),
        combo: 0,
      },
      delta: item.points,
      multiplier: 1,
      lostLife: true,
    };
  }
  const nextCombo = state.combo + 1;
  const multiplier = comboMultiplier(nextCombo, combo);
  const delta = item.points * multiplier;
  return {
    state: {
      ...state,
      score: state.score + delta,
      combo: nextCombo,
      maxCombo: Math.max(state.maxCombo, nextCombo),
      itemsCaught: state.itemsCaught + 1,
    },
    delta,
    multiplier,
    lostLife: false,
  };
}

/** A good item that fell past the basket resets the combo. Missing fraud is fine. */
export function applyMiss(state: RoundState, item: Pick<ItemDef, "kind">): RoundState {
  return item.kind === "good" ? { ...state, combo: 0 } : state;
}

export function isRoundOver(
  state: RoundState,
  elapsedMs: number,
  roundMs: number,
): "lives" | "time" | null {
  if (state.lives <= 0) return "lives";
  if (elapsedMs >= roundMs) return "time";
  return null;
}

export function secondsLeft(elapsedMs: number, roundMs: number): number {
  return Math.max(0, Math.ceil((roundMs - elapsedMs) / 1000));
}

/* ------------------------------- movement -------------------------------- */

/** Frame-rate independent smoothing toward a target. Higher rate = snappier. */
export function smoothFollow(current: number, target: number, dtSec: number, rate: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dtSec));
}

export interface FallingBody {
  x: number;
  y: number;
  radius: number;
}
export interface BasketZone {
  x: number;
  topY: number;
  halfWidth: number;
  depth: number;
}

export function isCaught(item: FallingBody, basket: BasketZone): boolean {
  return (
    Math.abs(item.x - basket.x) <= basket.halfWidth + item.radius * 0.4 &&
    item.y + item.radius >= basket.topY &&
    item.y - item.radius <= basket.topY + basket.depth
  );
}

/** True once the whole item is below the catch zone. */
export function isMissed(item: FallingBody, basket: BasketZone): boolean {
  return item.y - item.radius > basket.topY + basket.depth;
}

/* -------------------------------- colors --------------------------------- */

export function parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function toHex([r, g, b]: [number, number, number]): string {
  const part = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** t = 0 gives `a`, t = 1 gives `b`. */
export function mixColors(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}

export function hexToNumber(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (r << 16) | (g << 8) | b;
}

export function resolveColor(token: ColorToken, theme: Pick<ThemeConfig, "primaryColor" | "accentColor">): string {
  if (token === "primary") return theme.primaryColor;
  if (token === "accent") return theme.accentColor;
  return token;
}

/** Dark background gradient derived from the brand color. */
export function backgroundGradient(primary: string): { top: string; bottom: string } {
  return { top: mixColors(primary, "#000000", 0.82), bottom: mixColors(primary, "#000000", 0.55) };
}
