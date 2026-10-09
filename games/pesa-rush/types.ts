import type { GameResult } from "@/lib/game";
import type { ThemeConfig } from "@/lib/theme";

/** "primary" / "accent" read from the theme; anything else is a fixed hex like "#FFD54A". */
export type ColorToken = "primary" | "accent" | `#${string}`;
export type ShapeKey = "coin" | "airtime" | "golden" | "fraud";
export type ItemKind = "good" | "fraud";
export type SoundKey =
  | "coin"
  | "airtime"
  | "golden"
  | "fraud"
  | "miss"
  | "tick"
  | "go"
  | "levelUp"
  | "end"
  | "victory";

export interface ItemDef {
  id: string;
  kind: ItemKind;
  /** Shown on the start screen. */
  label: string;
  /** Points when caught. Negative for fraud. */
  points: number;
  /** Relative spawn chance. */
  weight: number;
  /** Built-in vector shape drawn in code. */
  shape: ShapeKey;
  color: ColorToken;
  /** Half the on-screen size, in game pixels. */
  radius: number;
  /** Spin speed in radians per second. */
  spin: number;
  sound: SoundKey;
  /** Optional PNG/SVG url that replaces the drawn shape. */
  imageUrl?: string;
}

export interface DifficultyConfig {
  levelDurationMs: number;
  maxLevel: number;
  /** Pixels per second at level 0. */
  baseFallSpeed: number;
  fallSpeedStep: number;
  baseSpawnIntervalMs: number;
  spawnIntervalStep: number;
  minSpawnIntervalMs: number;
  /** Extra fraud spawn weight added per level. */
  fraudWeightPerLevel: number;
}

export interface ComboConfig {
  /** Every `step` catches in a row raises the multiplier by 1. */
  step: number;
  maxMultiplier: number;
}

export interface PesaRushConfig {
  roundDurationMs: number;
  lives: number;
  countdownSeconds: number;
  /** Pause on the "Time's up" banner before onGameOver fires. */
  endDelayMs: number;
  items: ItemDef[];
  difficulty: DifficultyConfig;
  combo: ComboConfig;
  basket: { color: ColorToken; followRate: number; imageUrl?: string };
  dangerColor: `#${string}`;
  lifeColor: `#${string}`;
  text: {
    title: string;
    tagline: string;
    start: string;
    timesUp: string;
    outOfLives: string;
    faster: string;
    miss: string;
    comboLabel: string;
    scoreLabel: string;
    footer: string;
  };
}

export interface PlayerStats {
  name: string;
  score: number;
  itemsCaught: number;
  maxCombo: number;
  livesLeft: number;
}

export interface GameResult2P {
  player1: PlayerStats;
  player2: PlayerStats;
  winner: "player1" | "player2" | "tie";
}

/** Bridge between the React wrapper and the Phaser scene. */
export interface SceneBridge {
  config: PesaRushConfig;
  player1Name: string;
  player2Name: string;
  roundDurationMs: number;
  getTheme: () => ThemeConfig;
  isMuted: () => boolean;
  onGameOver: (result: GameResult) => void;
  onGameOver2P?: (result: GameResult2P) => void;
}

