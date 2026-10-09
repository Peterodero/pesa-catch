import * as Phaser from "phaser";
import type { ThemeConfig } from "@/lib/theme";
import { GAME_HEIGHT, GAME_WIDTH, backgroundGradient, hexToNumber, mixColors, resolveColor } from "./logic";
import type { ItemDef, MpesaCatchConfig } from "./types";

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
  const body = mixColors(color, "#ffffff", 0.82);
  const weave = mixColors(color, "#ffffff", 0.55);
  g.fillStyle(n(body), 1).fillPoints(
    [
      { x: 14, y: 24 },
      { x: BASKET_TEX_W - 14, y: 24 },
      { x: BASKET_TEX_W - 52, y: BASKET_TEX_H - 6 },
      { x: 52, y: BASKET_TEX_H - 6 },
    ],
    true,
  );
  g.lineStyle(5, n(weave), 1);
  for (let i = 1; i < 4; i++) {
    const y = 24 + i * 29;
    g.lineBetween(14 + i * 9, y, BASKET_TEX_W - 14 - i * 9, y);
  }
  for (let i = 1; i < 6; i++) {
    const topX = 14 + (i * (BASKET_TEX_W - 28)) / 6;
    const botX = 52 + (i * (BASKET_TEX_W - 104)) / 6;
    g.lineBetween(topX, 26, botX, BASKET_TEX_H - 8);
  }
  g.fillStyle(n(accent), 1).fillRoundedRect(0, 6, BASKET_TEX_W, 30, 15);
  g.fillStyle(0xffffff, 0.35).fillRoundedRect(14, 12, BASKET_TEX_W - 28, 7, 3);
}

function drawHeart(g: Gfx, color: string): void {
  g.fillStyle(n(color), 1);
  g.fillCircle(36, 38, 28).fillCircle(76, 38, 28).fillTriangle(10, 52, 102, 52, 56, 104);
  g.fillStyle(0xffffff, 0.45).fillCircle(26, 28, 8);
}

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Gfx) => void): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Builds every texture from code. A texture loaded from an imageUrl is kept as is. */
export function buildTextures(scene: Phaser.Scene, theme: ThemeConfig, config: MpesaCatchConfig): void {
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

  make(scene, "life", 112, 112, (g) => drawHeart(g, config.lifeColor));
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
