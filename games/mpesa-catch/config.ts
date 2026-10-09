import type { MpesaCatchConfig } from "./types";

/**
 * Edit this file to change the game without touching code.
 * Brand colors live in lib/theme.ts; here "primary" and "accent" point to the theme.
 */
const config: MpesaCatchConfig = {
  roundDurationMs: 60_000, // 30 000 to 90 000 recommended
  lives: 3,
  countdownSeconds: 3,
  endDelayMs: 1600,

  items: [
    {
      id: "coin",
      kind: "good",
      label: "Coin",
      points: 10,
      weight: 55,
      shape: "coin",
      color: "accent",
      radius: 56,
      spin: 3,
      sound: "coin",
    },
    {
      id: "airtime",
      kind: "good",
      label: "Airtime bundle",
      points: 25,
      weight: 22,
      shape: "airtime",
      color: "primary",
      radius: 60,
      spin: 0.8,
      sound: "airtime",
    },
    {
      id: "golden",
      kind: "good",
      label: "Golden bonus",
      points: 100,
      weight: 4,
      shape: "golden",
      color: "#FFD54A",
      radius: 68,
      spin: 2,
      sound: "golden",
    },
    {
      id: "fraud",
      kind: "fraud",
      label: "Fraud: lose a life",
      points: -50,
      weight: 17,
      shape: "fraud",
      color: "#E5383B",
      radius: 60,
      spin: 0,
      sound: "fraud",
    },
  ],

  difficulty: {
    levelDurationMs: 10_000, // speed up every 10 seconds
    maxLevel: 5,
    baseFallSpeed: 520,
    fallSpeedStep: 120,
    baseSpawnIntervalMs: 900,
    spawnIntervalStep: 110,
    minSpawnIntervalMs: 330,
    fraudWeightPerLevel: 2,
  },

  combo: { step: 5, maxMultiplier: 5 },

  basket: { color: "primary", followRate: 18 },
  dangerColor: "#E5383B",
  lifeColor: "#FF5A6E",

  text: {
    title: "Catch & Win",
    tagline: "Drag to move the basket.\nCatch coins and airtime. Dodge fraud!",
    start: "Tap to start",
    timesUp: "Time's up!",
    outOfLives: "Out of lives!",
    faster: "Faster!",
    miss: "Miss",
    comboLabel: "Combo",
    scoreLabel: "Score",
    footer: "Presented by",
  },
};

export default config;
