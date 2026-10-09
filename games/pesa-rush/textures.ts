import * as Phaser from "phaser";
import type { ThemeConfig } from "@/lib/theme";
import { GAME_HEIGHT, GAME_WIDTH, backgroundGradient, hexToNumber, mixColors, resolveColor } from "./logic";
import type { ItemDef, PesaRushConfig } from "./types";

const S = 128; // item texture size
export const BASKET_TEX_W = 260;
export const BASKET_TEX_H = 150;

type Gfx = Phaser.GameObjects.Graphics;
const n = hexToNumber;

function star(cx: number, cy: number, outer: number, inner: number, points: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

function drawItem(g: Gfx, item: ItemDef, color: string): void {
  const dark = mixColors(color, "#000000", 0.35);
  const light = mixColors(color, "#ffffff", 0.55);
  switch (item.shape) {
    case "coin":
      g.fillStyle(n(color), 1).fillCircle(64, 64, 60);
      g.lineStyle(8, n(dark), 1).strokeCircle(64, 64, 44);
      g.fillStyle(n(dark), 1).fillRoundedRect(58, 38, 12, 52, 5);
      g.fillStyle(n(light), 0.7).fillCircle(40, 38, 9);
      break;
    case "airtime":
      g.fillStyle(0xffffff, 1).fillRoundedRect(18, 4, 92, 120, 16);
      g.fillStyle(n(color), 1).fillRoundedRect(18, 4, 92, 42, { tl: 16, tr: 16, bl: 0, br: 0 });
      g.fillStyle(n(mixColors(color, "#000000", 0.25)), 1);
      g.fillRoundedRect(32, 62, 64, 9, 4).fillRoundedRect(32, 82, 44, 9, 4);
      g.fillStyle(n(color), 1).fillCircle(84, 102, 11);
      g.fillStyle(0xffffff, 0.9).fillRoundedRect(32, 18, 30, 10, 5);
      break;
    case "golden":
      g.fillStyle(n(color), 0.3).fillCircle(64, 64, 62);
      g.fillStyle(n(color), 1).fillPoints(star(64, 64, 58, 30, 8), true);
      g.fillStyle(n(light), 1).fillPoints(star(64, 64, 34, 18, 8), true);
      g.fillStyle(0xffffff, 0.9).fillCircle(50, 48, 7);
      break;
    case "fraud":
      g.fillStyle(n(color), 1).fillTriangle(64, 6, 122, 112, 6, 112);
      g.lineStyle(7, 0xffffff, 1).strokeTriangle(64, 22, 108, 104, 20, 104);
      g.fillStyle(0xffffff, 1).fillRoundedRect(58, 46, 12, 36, 5).fillCircle(64, 94, 7);
      break;
  }
}

function drawBasket(g: Gfx, color: string, accent: string): void {
  const W = BASKET_TEX_W;
  const H = BASKET_TEX_H;

  // Trapezoid body points (wider at top, narrower at bottom)
  const body = [
    { x: 8, y: 30 },
    { x: W - 8, y: 30 },
    { x: W - 44, y: H - 4 },
    { x: 44, y: H - 4 },
  ];

  // Deep shadow layer (slightly wider, dark)
  const shadow = [
    { x: 10, y: 33 },
    { x: W - 10, y: 33 },
    { x: W - 42, y: H },
    { x: 42, y: H },
  ];
  g.fillStyle(0x000000, 0.35).fillPoints(shadow, true);

  // Main basket body — light tinted fill
  const bodyColor = mixColors(color, "#ffffff", 0.78);
  g.fillStyle(n(bodyColor), 1).fillPoints(body, true);

  // Inner shading gradient (darker bottom band for depth)
  const shadeBot = [
    { x: 50, y: H - 38 },
    { x: W - 50, y: H - 38 },
    { x: W - 44, y: H - 4 },
    { x: 44, y: H - 4 },
  ];
  g.fillStyle(n(mixColors(color, "#000000", 0.18)), 0.55).fillPoints(shadeBot, true);

  // Subtle vertical ribs
  const ribColor = mixColors(color, "#000000", 0.22);
  g.lineStyle(2, n(ribColor), 0.45);
  for (let i = 1; i < 6; i++) {
    const tx = 8 + (i * (W - 16)) / 6;
    const bx = 44 + (i * (W - 88)) / 6;
    g.lineBetween(tx, 32, bx, H - 5);
  }

  // Horizontal weave lines
  g.lineStyle(2, n(ribColor), 0.3);
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    const y = 30 + t * (H - 30);
    const xl = 8 + t * 36;
    const xr = W - 8 - t * 36;
    g.lineBetween(xl, y, xr, y);
  }

  // Bright colored rim (rounded pill on top)
  g.fillStyle(n(accent), 1).fillRoundedRect(0, 8, W, 32, 14);

  // Gloss on the rim
  g.fillStyle(0xffffff, 0.3).fillRoundedRect(16, 12, W - 32, 10, 6);
}





function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Gfx) => void): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Builds every texture from code. A texture loaded from an imageUrl is kept as is. */
export function buildTextures(scene: Phaser.Scene, theme: ThemeConfig, config: PesaRushConfig): void {
  for (const item of config.items) {
    const key = `item:${item.id}`;
    if (item.imageUrl && scene.textures.exists(key)) continue;
    make(scene, key, S, S, (g) => drawItem(g, item, resolveColor(item.color, theme)));
  }
  if (!(config.basket.imageUrl && scene.textures.exists("basket"))) {
    make(scene, "basket", BASKET_TEX_W, BASKET_TEX_H, (g) =>
      drawBasket(g, resolveColor(config.basket.color, theme), theme.accentColor),
    );
  }
  make(scene, "basket_p1", BASKET_TEX_W, BASKET_TEX_H, (g) =>
    drawBasket(g, resolveColor(config.basket.color, theme), "#00F0FF"),
  );
  make(scene, "basket_p2", BASKET_TEX_W, BASKET_TEX_H, (g) =>
    drawBasket(g, resolveColor(config.basket.color, theme), "#FF3366"),
  );

  make(scene, "spark", 24, 24, (g) => g.fillStyle(0xffffff, 1).fillCircle(12, 12, 10));

  const { top, bottom } = backgroundGradient(theme.primaryColor);
  make(scene, "bg", GAME_WIDTH, GAME_HEIGHT, (g) => {
    // Stage background gradient
    g.fillGradientStyle(n(top), n(top), n(bottom), n(bottom), 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Left Arena Ambient Glow (Blue/Cyan)
    g.fillStyle(0x00f0ff, 0.06);
    g.fillCircle(480, 540, 420);
    g.fillStyle(0x0088ff, 0.08);
    g.fillCircle(250, 300, 260);

    // Right Arena Ambient Glow (Red/Magenta)
    g.fillStyle(0xff3366, 0.06);
    g.fillCircle(1440, 540, 420);
    g.fillStyle(0xff0055, 0.08);
    g.fillCircle(1670, 300, 260);

    // Center Stage Divider Beam
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(957, 0, 6, GAME_HEIGHT);
    g.fillStyle(0x00f0ff, 0.3);
    g.fillRect(955, 0, 2, GAME_HEIGHT);
    g.fillStyle(0xff3366, 0.3);
    g.fillRect(963, 0, 2, GAME_HEIGHT);

    // Floor Baseline Rails
    g.fillStyle(0x00f0ff, 0.4).fillRect(40, GAME_HEIGHT - 60, 880, 4);
    g.fillStyle(0xff3366, 0.4).fillRect(1000, GAME_HEIGHT - 60, 880, 4);
  });
}
