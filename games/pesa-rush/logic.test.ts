import { describe, expect, it } from "vitest";
import config from "./config";
import {
  applyCatch,
  applyMiss,
  backgroundGradient,
  clamp,
  comboMultiplier,
  createInitialState,
  createRng,
  getArenaSpawnX,
  getDifficulty,
  getLeadStatus,
  getLevel,
  getWinner,
  hexToNumber,
  isCaught,
  isMissed,
  isRoundOver,
  mixColors,
  nextSpawnDelay,
  parseHex,
  pickItem,
  resolveColor,
  secondsLeft,
  smoothFollow,
  spawnX,
} from "./logic";

const { difficulty, combo, items } = config;
const good = { kind: "good" as const, points: 10 };
const fraud = { kind: "fraud" as const, points: -50 };

describe("difficulty", () => {
  it("ramps one level every 10 seconds and stops at max", () => {
    expect(getLevel(0, difficulty)).toBe(0);
    expect(getLevel(9_999, difficulty)).toBe(0);
    expect(getLevel(10_000, difficulty)).toBe(1);
    expect(getLevel(59_999, difficulty)).toBe(5);
    expect(getLevel(500_000, difficulty)).toBe(difficulty.maxLevel);
    expect(getLevel(-5, difficulty)).toBe(0);
  });

  it("falls faster and spawns quicker with each level, within limits", () => {
    let prev = getDifficulty(0, difficulty);
    for (let l = 1; l <= difficulty.maxLevel; l++) {
      const d = getDifficulty(l, difficulty);
      expect(d.fallSpeed).toBeGreaterThan(prev.fallSpeed);
      expect(d.spawnIntervalMs).toBeLessThanOrEqual(prev.spawnIntervalMs);
      expect(d.spawnIntervalMs).toBeGreaterThanOrEqual(difficulty.minSpawnIntervalMs);
      prev = d;
    }
    expect(getDifficulty(99, difficulty).level).toBe(difficulty.maxLevel);
  });

  it("keeps spawn delay inside the jitter range", () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const d = nextSpawnDelay(1000, rng, 0.3);
      expect(d).toBeGreaterThanOrEqual(700);
      expect(d).toBeLessThanOrEqual(1300);
    }
  });

  it("spawns inside the margins", () => {
    const rng = createRng(2);
    for (let i = 0; i < 200; i++) {
      const x = spawnX(rng, 1080, 80);
      expect(x).toBeGreaterThanOrEqual(80);
      expect(x).toBeLessThanOrEqual(1000);
    }
  });
});

describe("pickItem", () => {
  it("is deterministic for a seed and covers every item type", () => {
    const a = createRng(7);
    const b = createRng(7);
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const x = pickItem(items, a, 0);
      expect(pickItem(items, b, 0)).toBe(x);
      seen.add(x.id);
    }
    expect(seen.size).toBe(items.length);
  });

  it("spawns more fraud when the bonus is higher", () => {
    const count = (bonus: number) => {
      const rng = createRng(11);
      let n = 0;
      for (let i = 0; i < 4000; i++) if (pickItem(items, rng, bonus).kind === "fraud") n++;
      return n;
    };
    expect(count(10)).toBeGreaterThan(count(0));
  });

  it("falls back to the first item when every weight is zero", () => {
    const zero = items.map((i) => ({ ...i, weight: 0 }));
    expect(pickItem(zero, createRng(1)).id).toBe(items[0]?.id);
  });

  it("throws on an empty list", () => {
    expect(() => pickItem([], createRng(1))).toThrow();
  });
});

describe("scoring", () => {
  it("raises the multiplier every 5 catches, capped at x5", () => {
    expect(comboMultiplier(0, combo)).toBe(1);
    expect(comboMultiplier(4, combo)).toBe(1);
    expect(comboMultiplier(5, combo)).toBe(2);
    expect(comboMultiplier(10, combo)).toBe(3);
    expect(comboMultiplier(1000, combo)).toBe(combo.maxMultiplier);
  });

  it("adds points, grows combo and tracks the best combo", () => {
    let s = createInitialState(3);
    for (let i = 0; i < 5; i++) s = applyCatch(s, good, combo).state;
    expect(s.combo).toBe(5);
    expect(s.maxCombo).toBe(5);
    expect(s.itemsCaught).toBe(5);
    // first four at x1 = 40, fifth at x2 = 20
    expect(s.score).toBe(60);
  });

  it("reports the multiplied points in delta", () => {
    let s = createInitialState(3);
    for (let i = 0; i < 4; i++) s = applyCatch(s, good, combo).state;
    const r = applyCatch(s, { kind: "good", points: 25 }, combo);
    expect(r.multiplier).toBe(2);
    expect(r.delta).toBe(50);
  });

  it("fraud costs 50 points and a life, and resets the combo but keeps the best", () => {
    let s = createInitialState(3);
    for (let i = 0; i < 6; i++) s = applyCatch(s, good, combo).state;
    const before = s.score;
    const r = applyCatch(s, fraud, combo);
    expect(r.lostLife).toBe(true);
    expect(r.state.lives).toBe(2);
    expect(r.state.combo).toBe(0);
    expect(r.state.maxCombo).toBe(6);
    expect(r.state.score).toBe(before - 50);
    expect(r.state.itemsCaught).toBe(6);
  });

  it("never lets score or lives go below zero", () => {
    const s = createInitialState(1);
    const r = applyCatch(s, fraud, combo);
    expect(r.state.score).toBe(0);
    expect(r.state.lives).toBe(0);
    expect(applyCatch(r.state, fraud, combo).state.lives).toBe(0);
  });

  it("resets combo on a missed good item but not on a missed fraud item", () => {
    let s = createInitialState(3);
    s = applyCatch(s, good, combo).state;
    s = applyCatch(s, good, combo).state;
    expect(applyMiss(s, { kind: "fraud" }).combo).toBe(2);
    const m = applyMiss(s, { kind: "good" });
    expect(m.combo).toBe(0);
    expect(m.maxCombo).toBe(2);
  });

  it("does not mutate the previous state", () => {
    const s = createInitialState(3);
    applyCatch(s, good, combo);
    expect(s).toEqual(createInitialState(3));
  });
});

describe("round end", () => {
  it("ends on time or on zero lives", () => {
    const s = createInitialState(3);
    expect(isRoundOver(s, 59_999, 60_000)).toBeNull();
    expect(isRoundOver(s, 60_000, 60_000)).toBe("time");
    expect(isRoundOver({ ...s, lives: 0 }, 1_000, 60_000)).toBe("lives");
  });

  it("counts whole seconds left", () => {
    expect(secondsLeft(0, 60_000)).toBe(60);
    expect(secondsLeft(59_001, 60_000)).toBe(1);
    expect(secondsLeft(70_000, 60_000)).toBe(0);
  });

  it("ships a round length inside the 30-90 second limit", () => {
    expect(config.roundDurationMs).toBeGreaterThanOrEqual(30_000);
    expect(config.roundDurationMs).toBeLessThanOrEqual(90_000);
  });
});

describe("movement and catching", () => {
  it("moves toward the target without overshooting", () => {
    let x = 0;
    for (let i = 0; i < 120; i++) {
      x = smoothFollow(x, 100, 1 / 60, 18);
      expect(x).toBeLessThanOrEqual(100);
    }
    expect(x).toBeGreaterThan(99);
    expect(smoothFollow(50, 50, 0.016, 18)).toBe(50);
  });

  it("gives the same result for one big step or many small ones", () => {
    let x = 0;
    for (let i = 0; i < 10; i++) x = smoothFollow(x, 100, 0.01, 18);
    expect(x).toBeCloseTo(smoothFollow(0, 100, 0.1, 18), 6);
  });

  const basket = { x: 500, topY: 1700, halfWidth: 120, depth: 100 };
  it("catches items that reach the basket and ignores others", () => {
    expect(isCaught({ x: 500, y: 1700, radius: 50 }, basket)).toBe(true);
    expect(isCaught({ x: 600, y: 1660, radius: 50 }, basket)).toBe(true);
    expect(isCaught({ x: 900, y: 1700, radius: 50 }, basket)).toBe(false);
    expect(isCaught({ x: 500, y: 1500, radius: 50 }, basket)).toBe(false);
    expect(isCaught({ x: 500, y: 1900, radius: 50 }, basket)).toBe(false);
  });

  it("flags an item as missed only after it passes the zone", () => {
    expect(isMissed({ x: 500, y: 1700, radius: 50 }, basket)).toBe(false);
    expect(isMissed({ x: 500, y: 1851, radius: 50 }, basket)).toBe(true);
  });

  it("clamps numbers", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, 0, 3)).toBe(0);
  });
});

describe("colors", () => {
  it("parses short, long and invalid hex values", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("#12A150")).toEqual([18, 161, 80]);
    expect(parseHex("nope")).toEqual([0, 0, 0]);
  });

  it("mixes colors and converts to a number", () => {
    expect(mixColors("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mixColors("#12A150", "#000000", 0)).toBe("#12a150");
    expect(hexToNumber("#ff0000")).toBe(0xff0000);
  });

  it("reads theme tokens and passes fixed colors through", () => {
    const theme = { primaryColor: "#111111", accentColor: "#222222" };
    expect(resolveColor("primary", theme)).toBe("#111111");
    expect(resolveColor("accent", theme)).toBe("#222222");
    expect(resolveColor("#abcdef", theme)).toBe("#abcdef");
  });

  it("derives a dark background from the brand color", () => {
    const g = backgroundGradient("#12A150");
    expect(parseHex(g.top)[1]).toBeLessThan(parseHex(g.bottom)[1]);
    expect(parseHex(g.bottom)[1]).toBeLessThan(161);
  });
});

describe("2-player gameshow rules", () => {
  it("determines winner accurately", () => {
    expect(getWinner(250, 180)).toBe("player1");
    expect(getWinner(120, 300)).toBe("player2");
    expect(getWinner(200, 200)).toBe("tie");
  });

  it("calculates real-time lead status and labels", () => {
    const p1Lead = getLeadStatus("Amina", 200, "Juma", 150);
    expect(p1Lead.leader).toBe("player1");
    expect(p1Lead.diff).toBe(50);
    expect(p1Lead.label).toContain("AMINA LEADS BY +50");

    const p2Lead = getLeadStatus("Amina", 100, "Juma", 250);
    expect(p2Lead.leader).toBe("player2");
    expect(p2Lead.diff).toBe(150);
    expect(p2Lead.label).toContain("JUMA LEADS BY +150");

    const tied = getLeadStatus("Amina", 300, "Juma", 300);
    expect(tied.leader).toBe("tie");
    expect(tied.diff).toBe(0);
    expect(tied.label).toBe("TIED MATCH!");
  });

  it("spawns items within bounds of left and right arenas", () => {
    const rng = createRng(42);
    for (let i = 0; i < 50; i++) {
      const leftX = getArenaSpawnX(rng, "left", 60);
      expect(leftX).toBeGreaterThanOrEqual(60);
      expect(leftX).toBeLessThanOrEqual(900);

      const rightX = getArenaSpawnX(rng, "right", 60);
      expect(rightX).toBeGreaterThanOrEqual(1020);
      expect(rightX).toBeLessThanOrEqual(1860);
    }
  });
});

