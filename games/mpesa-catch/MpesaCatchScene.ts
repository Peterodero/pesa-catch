import * as Phaser from "phaser";
import type { ThemeConfig } from "@/lib/theme";
import { Sfx } from "./audio";
import { buildTextures } from "./textures";
import {
  ARENA_WIDTH,
  GAME_HEIGHT as H,
  GAME_WIDTH as W,
  PLAYER1_COLOR,
  PLAYER2_COLOR,
  applyCatch,
  applyMiss,
  clamp,
  createInitialState,
  getDifficulty,
  getLeadStatus,
  getLevel,
  getWinner,
  hexToNumber,
  isCaught,
  isMissed,
  nextSpawnDelay,
  pickItem,
  resolveColor,
  secondsLeft,
  smoothFollow,
  type BasketZone,
  type Difficulty,
  type Rng,
  type RoundState,
} from "./logic";
import type { GameResult2P, ItemDef, MpesaCatchConfig, SceneBridge } from "./types";

type Phase = "ready" | "countdown" | "playing" | "ending";

interface Faller {
  sprite: Phaser.GameObjects.Image;
  def: ItemDef | null;
  owner: "p1" | "p2";
  active: boolean;
  missed: boolean;
  vy: number;
  spin: number;
  radius: number;
}
interface Spark {
  sprite: Phaser.GameObjects.Image;
  active: boolean;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}
interface Floater {
  text: Phaser.GameObjects.Text;
  active: boolean;
  life: number;
  maxLife: number;
  vy: number;
}

const BASKET_W = 220;
const BASKET_H = 130;
const BASKET_Y = H - 160;
const CATCH_DEPTH = 85;
const KEY_SPEED = 1600;
const FALLER_POOL_PER_PLAYER = 20;
const SPARK_POOL = 200;
const FLOATER_POOL = 30;
const GRAVITY = 1100;

export class MpesaCatchScene extends Phaser.Scene {
  private readonly bridge: SceneBridge;
  private readonly cfg: MpesaCatchConfig;
  private readonly rng: Rng = Math.random;

  private theme!: ThemeConfig;
  private sfx!: Sfx;
  private accent = "#ffffff";
  private danger = "#ff0000";

  private p1Name = "Player 1";
  private p2Name = "Player 2";

  private phase: Phase = "ready";
  private stateP1: RoundState;
  private stateP2: RoundState;

  private elapsed = 0;
  private level = 0;
  private difficulty!: Difficulty;
  private spawnTimer = 0;
  private countdownLeft = 0;
  private lastCountdownNumber = 0;
  private finished = false;
  private disposed = false;
  private clock = 0;

  // Player 1 basket & zone
  private basketP1!: Phaser.GameObjects.Image;
  private basketP1TargetX = 480;
  private basketP1Pulse = 0;
  private zoneP1!: BasketZone;

  // Player 2 basket & zone
  private basketP2!: Phaser.GameObjects.Image;
  private basketP2TargetX = 1440;
  private basketP2Pulse = 0;
  private zoneP2!: BasketZone;

  // Object pools
  private fallers: Faller[] = [];
  private sparks: Spark[] = [];
  private floaters: Floater[] = [];

  // HUD Elements
  private scoreP1Text!: Phaser.GameObjects.Text;
  private scoreP2Text!: Phaser.GameObjects.Text;
  private comboP1Text!: Phaser.GameObjects.Text;
  private comboP2Text!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private leaderText!: Phaser.GameObjects.Text;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private livesP1Icons: Phaser.GameObjects.Image[] = [];
  private livesP2Icons: Phaser.GameObjects.Image[] = [];
  private hudObjects: Phaser.GameObjects.GameObject[] = [];

  private readyLayer!: Phaser.GameObjects.Container;
  private startText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Text;

  private displayScoreP1 = 0;
  private displayScoreP2 = 0;

  // Input bindings
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  constructor(bridge: SceneBridge) {
    super("mpesa-catch");
    this.bridge = bridge;
    this.cfg = bridge.config;
    this.p1Name = bridge.player1Name || "Player 1";
    this.p2Name = bridge.player2Name || "Player 2";
    this.stateP1 = createInitialState(bridge.config.lives);
    this.stateP2 = createInitialState(bridge.config.lives);
  }

  /* ------------------------------ lifecycle ------------------------------ */

  preload(): void {
    const theme = this.bridge.getTheme();
    for (const item of this.cfg.items) {
      if (item.imageUrl) this.load.image(`item:${item.id}`, item.imageUrl);
    }
    if (this.cfg.basket.imageUrl) this.load.image("basket", this.cfg.basket.imageUrl);
    if (theme.logoUrl) this.load.image("logo", theme.logoUrl);
  }

  create(): void {
    this.theme = this.bridge.getTheme();
    this.accent = this.theme.accentColor;
    this.danger = this.cfg.dangerColor;
    this.sfx = new Sfx(() => this.bridge.isMuted());
    buildTextures(this, this.theme, this.cfg);

    // Widescreen Stage Background
    this.add.image(W / 2, H / 2, "bg").setDepth(0);

    // Player 1 Basket (Left Arena)
    const texP1 = this.textures.exists("basket_p1") ? "basket_p1" : "basket";
    this.basketP1 = this.add.image(480, BASKET_Y, texP1).setDepth(10);
    this.basketP1.setDisplaySize(BASKET_W, BASKET_H);
    this.zoneP1 = {
      x: 480,
      topY: BASKET_Y - BASKET_H / 2 + 10,
      halfWidth: (BASKET_W / 2) * 0.88,
      depth: CATCH_DEPTH,
    };

    // Player 2 Basket (Right Arena)
    const texP2 = this.textures.exists("basket_p2") ? "basket_p2" : "basket";
    this.basketP2 = this.add.image(1440, BASKET_Y, texP2).setDepth(10);
    this.basketP2.setDisplaySize(BASKET_W, BASKET_H);
    this.zoneP2 = {
      x: 1440,
      topY: BASKET_Y - BASKET_H / 2 + 10,
      halfWidth: (BASKET_W / 2) * 0.88,
      depth: CATCH_DEPTH,
    };

    this.createPools();
    this.createHud();
    this.createReadyLayer();
    this.createCenterTexts();
    this.setupInput();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.dispose, this);

    this.difficulty = getDifficulty(0, this.cfg.difficulty);
    this.setHudVisible(false);
  }

  private dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.sfx.dispose();
    this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerInput, this);
    this.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerInput, this);
    this.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
  }

  /* --------------------------------- setup -------------------------------- */

  private makeText(x: number, y: number, str: string, size: number, color: string, ox = 0.5, oy = 0.5) {
    return this.add
      .text(x, y, str, {
        fontFamily: this.theme.fontFamily,
        fontSize: `${size}px`,
        fontStyle: "bold",
        color,
        align: "center",
        stroke: "rgba(0,0,0,0.6)",
        strokeThickness: Math.max(2, Math.round(size / 12)),
      })
      .setOrigin(ox, oy);
  }

  private createPools(): void {
    // 20 fallers for Player 1, 20 fallers for Player 2
    for (let i = 0; i < FALLER_POOL_PER_PLAYER * 2; i++) {
      const sprite = this.add.image(0, 0, "spark").setDepth(5).setVisible(false).setActive(false);
      this.fallers.push({
        sprite,
        def: null,
        owner: i < FALLER_POOL_PER_PLAYER ? "p1" : "p2",
        active: false,
        missed: false,
        vy: 0,
        spin: 0,
        radius: 0,
      });
    }

    for (let i = 0; i < SPARK_POOL; i++) {
      const sprite = this.add.image(0, 0, "spark").setDepth(15).setVisible(false).setActive(false);
      this.sparks.push({ sprite, active: false, vx: 0, vy: 0, life: 0, maxLife: 1 });
    }

    for (let i = 0; i < FLOATER_POOL; i++) {
      const text = this.makeText(0, 0, "", 54, "#ffffff").setDepth(25).setVisible(false).setActive(false);
      this.floaters.push({ text, active: false, life: 0, maxLife: 1, vy: 0 });
    }
  }

  private createHud(): void {
    const roundSecs = Math.ceil((this.bridge.roundDurationMs || this.cfg.roundDurationMs) / 1000);

    // --- PLAYER 1 HUD (LEFT SIDE) ---
    const p1Badge = this.add.rectangle(40, 24, 280, 80, 0x001830, 0.75).setOrigin(0, 0);
    p1Badge.setStrokeStyle(3, hexToNumber(PLAYER1_COLOR));
    const p1Label = this.makeText(54, 34, this.p1Name.toUpperCase(), 26, PLAYER1_COLOR, 0, 0);
    this.scoreP1Text = this.makeText(54, 62, "0", 52, "#ffffff", 0, 0);
    this.comboP1Text = this.makeText(230, 68, "", 32, PLAYER1_COLOR, 0, 0).setVisible(false);

    const lives = this.cfg.lives;
    for (let i = 0; i < lives; i++) {
      const x = 360 + i * 44;
      this.livesP1Icons.push(this.add.image(x, 64, "life").setDisplaySize(40, 40));
    }

    // --- PLAYER 2 HUD (RIGHT SIDE) ---
    const p2Badge = this.add.rectangle(W - 320, 24, 280, 80, 0x300010, 0.75).setOrigin(0, 0);
    p2Badge.setStrokeStyle(3, hexToNumber(PLAYER2_COLOR));
    const p2Label = this.makeText(W - 54, 34, this.p2Name.toUpperCase(), 26, PLAYER2_COLOR, 1, 0);
    this.scoreP2Text = this.makeText(W - 54, 62, "0", 52, "#ffffff", 1, 0);
    this.comboP2Text = this.makeText(W - 230, 68, "", 32, PLAYER2_COLOR, 1, 0).setVisible(false);

    for (let i = 0; i < lives; i++) {
      const x = W - 360 - (lives - 1 - i) * 44;
      this.livesP2Icons.push(this.add.image(x, 64, "life").setDisplaySize(40, 40));
    }

    // --- CENTER BROADCAST TOWER ---
    const timerBg = this.add.rectangle(W / 2, 44, 200, 70, 0x000000, 0.8).setOrigin(0.5, 0.5);
    timerBg.setStrokeStyle(3, hexToNumber(this.accent));
    this.timerText = this.makeText(W / 2, 44, String(roundSecs), 54, "#ffffff", 0.5, 0.5);

    const leaderBg = this.add.rectangle(W / 2, 102, 420, 36, 0x000000, 0.7).setOrigin(0.5, 0.5);
    leaderBg.setStrokeStyle(2, 0xffffff, 0.4);
    this.leaderText = this.makeText(W / 2, 102, "TIED MATCH", 22, "#ffffff", 0.5, 0.5);

    const barBg = this.add.rectangle(0, 130, W, 10, 0x000000, 0.4).setOrigin(0, 0);
    this.timerBar = this.add.rectangle(0, 130, W, 10, hexToNumber(this.accent)).setOrigin(0, 0);

    this.hudObjects = [
      p1Badge,
      p1Label,
      this.scoreP1Text,
      this.comboP1Text,
      ...this.livesP1Icons,
      p2Badge,
      p2Label,
      this.scoreP2Text,
      this.comboP2Text,
      ...this.livesP2Icons,
      timerBg,
      this.timerText,
      leaderBg,
      this.leaderText,
      barBg,
      this.timerBar,
    ];

    for (const o of this.hudObjects) (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(20);
  }

  private setHudVisible(visible: boolean): void {
    for (const o of this.hudObjects) (o as unknown as Phaser.GameObjects.Components.Visible).setVisible(visible);
  }

  private createReadyLayer(): void {
    const layer = this.add.container(0, 0).setDepth(30);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.5).setOrigin(0, 0);
    layer.add(dim);

    // Header Title
    layer.add(this.makeText(W / 2, 130, "M-PESA CATCH: 2-PLAYER SHOWDOWN", 64, this.accent));
    layer.add(this.makeText(W / 2, 205, "COMPETITIVE ARCADE EDITION", 28, "#ffffff").setAlpha(0.8));

    // Player 1 Card (Left)
    const cardP1 = this.add.rectangle(W / 2 - 400, 480, 600, 440, 0x001a35, 0.9);
    cardP1.setStrokeStyle(4, hexToNumber(PLAYER1_COLOR));
    layer.add(cardP1);
    layer.add(this.makeText(W / 2 - 400, 310, "BLUE TEAM (LEFT)", 30, PLAYER1_COLOR));
    layer.add(this.makeText(W / 2 - 400, 390, this.p1Name, 54, "#ffffff"));
    layer.add(this.makeText(W / 2 - 400, 480, "CONTROLS", 22, PLAYER1_COLOR));
    layer.add(this.makeText(W / 2 - 400, 530, "A / D Keys to Move", 28, "#ffffff"));
    layer.add(this.makeText(W / 2 - 400, 585, "Or Touch Left Side of Screen", 22, "#ffffff").setAlpha(0.7));

    // Player 2 Card (Right)
    const cardP2 = this.add.rectangle(W / 2 + 400, 480, 600, 440, 0x35001a, 0.9);
    cardP2.setStrokeStyle(4, hexToNumber(PLAYER2_COLOR));
    layer.add(cardP2);
    layer.add(this.makeText(W / 2 + 400, 310, "RED TEAM (RIGHT)", 30, PLAYER2_COLOR));
    layer.add(this.makeText(W / 2 + 400, 390, this.p2Name, 54, "#ffffff"));
    layer.add(this.makeText(W / 2 + 400, 480, "CONTROLS", 22, PLAYER2_COLOR));
    layer.add(this.makeText(W / 2 + 400, 530, "Left / Right Arrow Keys", 28, "#ffffff"));
    layer.add(this.makeText(W / 2 + 400, 585, "Or Touch Right Side of Screen", 22, "#ffffff").setAlpha(0.7));

    // Start Button Call To Action
    const roundSecs = Math.round((this.bridge.roundDurationMs || this.cfg.roundDurationMs) / 1000);
    layer.add(this.makeText(W / 2, 780, `${roundSecs} SECONDS ROUND  •  ${this.cfg.lives} LIVES EACH`, 30, "#ffffff").setAlpha(0.85));

    this.startText = this.makeText(W / 2, 880, "TAP OR PRESS ANY KEY TO START", 50, this.accent);
    layer.add(this.startText);

    this.readyLayer = layer;
  }

  private createCenterTexts(): void {
    this.countdownText = this.makeText(W / 2, H / 2, "", 220, "#ffffff").setDepth(31).setVisible(false);
    this.banner = this.makeText(W / 2, H / 2 - 50, "", 90, this.accent).setDepth(31).setVisible(false);
  }

  private setupInput(): void {
    this.input.addPointer(4);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerInput, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerInput, this);
    this.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasdKeys = this.input.keyboard?.addKeys("A,D") as { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | undefined;
  }

  private onPointerInput(p: Phaser.Input.Pointer): void {
    this.sfx.unlock();
    if (this.phase === "ready") {
      this.startCountdown();
      return;
    }

    if (p.x < W / 2) {
      this.basketP1TargetX = clamp(p.x, 110, ARENA_WIDTH - 110);
    } else {
      this.basketP2TargetX = clamp(p.x, ARENA_WIDTH + 110, W - 110);
    }
  }

  private onPointerUp(): void {
    this.sfx.unlock();
  }

  /* ------------------------------- game flow ------------------------------ */

  private startCountdown(): void {
    this.phase = "countdown";
    this.readyLayer.setVisible(false);
    this.setHudVisible(true);
    this.countdownLeft = this.cfg.countdownSeconds * 1000;
    this.lastCountdownNumber = 0;
    this.countdownText.setVisible(true);
  }

  private startPlaying(): void {
    this.phase = "playing";
    this.countdownText.setVisible(false);
    this.elapsed = 0;
    this.level = 0;
    this.difficulty = getDifficulty(0, this.cfg.difficulty);
    this.spawnTimer = 200;
    this.stateP1 = createInitialState(this.cfg.lives);
    this.stateP2 = createInitialState(this.cfg.lives);
    this.sfx.play("go");
    this.floatText(W / 2, H / 2 - 80, "GO!", this.accent, 120);
    this.refreshHud();
  }

  private endRound(): void {
    if (this.phase === "ending") return;
    this.phase = "ending";

    const winnerKey = getWinner(this.stateP1.score, this.stateP2.score);
    this.sfx.play(winnerKey === "tie" ? "end" : "victory");

    for (const f of this.fallers) if (f.active) this.release(f);

    const winnerName = winnerKey === "player1" ? this.p1Name : winnerKey === "player2" ? this.p2Name : "TIE";
    const bannerStr = winnerKey === "tie" ? "MATCH TIED!" : `${winnerName.toUpperCase()} WINS!`;
    this.banner.setText(bannerStr).setVisible(true);


    if (winnerKey !== "tie") {
      this.burst(W / 2, H / 2 - 100, hexToNumber(winnerKey === "player1" ? PLAYER1_COLOR : PLAYER2_COLOR), 80);
    }

    this.time.delayedCall(this.cfg.endDelayMs, this.finish, [], this);
  }

  private finish(): void {
    if (this.finished || this.disposed) return;
    this.finished = true;

    const winnerKey = getWinner(this.stateP1.score, this.stateP2.score);
    const result2P: GameResult2P = {
      player1: {
        name: this.p1Name,
        score: this.stateP1.score,
        itemsCaught: this.stateP1.itemsCaught,
        maxCombo: this.stateP1.maxCombo,
        livesLeft: this.stateP1.lives,
      },
      player2: {
        name: this.p2Name,
        score: this.stateP2.score,
        itemsCaught: this.stateP2.itemsCaught,
        maxCombo: this.stateP2.maxCombo,
        livesLeft: this.stateP2.lives,
      },
      winner: winnerKey,
    };

    if (this.bridge.onGameOver2P) {
      this.bridge.onGameOver2P(result2P);
    } else {
      this.bridge.onGameOver({
        score: Math.max(this.stateP1.score, this.stateP2.score),
        meta: result2P as unknown as Record<string, unknown>,
      });
    }
  }

  /* -------------------------------- update -------------------------------- */

  update(_time: number, deltaMs: number): void {
    if (this.disposed) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this.clock += dt;
    this.updateBaskets(dt);
    this.updateEffects(dt);

    switch (this.phase) {
      case "ready":
        this.startText.setScale(1 + 0.06 * Math.sin(this.clock * 4));
        break;
      case "countdown":
        this.updateCountdown(dt);
        break;
      case "playing":
        this.updatePlaying(dt);
        break;
      case "ending":
        break;
    }
    this.updateHud(dt);
  }

  private updateBaskets(dt: number): void {
    const half = BASKET_W / 2;
    const k = this.cursors;
    const w = this.wasdKeys;

    // Player 1 Keyboard (A / D)
    if (w) {
      if (w.A.isDown) this.basketP1TargetX -= KEY_SPEED * dt;
      if (w.D.isDown) this.basketP1TargetX += KEY_SPEED * dt;
    }
    this.basketP1TargetX = clamp(this.basketP1TargetX, half + 20, ARENA_WIDTH - half - 20);
    this.basketP1.x = smoothFollow(this.basketP1.x, this.basketP1TargetX, dt, this.cfg.basket.followRate);
    this.zoneP1.x = this.basketP1.x;
    this.basketP1Pulse = Math.max(0, this.basketP1Pulse - dt * 5);
    this.basketP1.setScale(1 + this.basketP1Pulse * 0.1, 1 - this.basketP1Pulse * 0.08);

    // Player 2 Keyboard (Left / Right)
    if (k) {
      if (k.left.isDown) this.basketP2TargetX -= KEY_SPEED * dt;
      if (k.right.isDown) this.basketP2TargetX += KEY_SPEED * dt;
    }
    this.basketP2TargetX = clamp(this.basketP2TargetX, ARENA_WIDTH + half + 20, W - half - 20);
    this.basketP2.x = smoothFollow(this.basketP2.x, this.basketP2TargetX, dt, this.cfg.basket.followRate);
    this.zoneP2.x = this.basketP2.x;
    this.basketP2Pulse = Math.max(0, this.basketP2Pulse - dt * 5);
    this.basketP2.setScale(1 + this.basketP2Pulse * 0.1, 1 - this.basketP2Pulse * 0.08);
  }

  private updateCountdown(dt: number): void {
    this.countdownLeft -= dt * 1000;
    if (this.countdownLeft <= 0) {
      this.startPlaying();
      return;
    }
    const num = Math.ceil(this.countdownLeft / 1000);
    const frac = 1 - (this.countdownLeft - (num - 1) * 1000) / 1000;
    if (num !== this.lastCountdownNumber) {
      this.lastCountdownNumber = num;
      this.countdownText.setText(String(num));
      this.sfx.play("tick");
    }
    this.countdownText.setScale(1.5 - 0.5 * frac).setAlpha(1 - frac * 0.4);
  }

  private updatePlaying(dt: number): void {
    this.elapsed += dt * 1000;

    const level = getLevel(this.elapsed, this.cfg.difficulty);
    if (level > this.level) {
      this.level = level;
      this.difficulty = getDifficulty(level, this.cfg.difficulty);
      this.sfx.play("levelUp");
      this.floatText(W / 2, 380, this.cfg.text.faster, this.accent, 80);
    }

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0) {
      this.spawnSynchronizedFallers();
      this.spawnTimer += nextSpawnDelay(this.difficulty.spawnIntervalMs, this.rng);
    }

    for (const f of this.fallers) {
      if (!f.active || f.def === null) continue;
      f.sprite.y += f.vy * dt;
      f.sprite.rotation += f.spin * dt;
      const body = { x: f.sprite.x, y: f.sprite.y, radius: f.radius };
      const zone = f.owner === "p1" ? this.zoneP1 : this.zoneP2;

      if (!f.missed && isCaught(body, zone)) {
        this.handleCatch(f);
        if (this.phase !== "playing") return;
      } else if (!f.missed && isMissed(body, zone)) {
        f.missed = true;
        this.handleMiss(f);
      } else if (f.sprite.y - f.radius > H + 20) {
        this.release(f);
      }
    }

    const roundDuration = this.bridge.roundDurationMs || this.cfg.roundDurationMs;
    const p1Dead = this.stateP1.lives <= 0;
    const p2Dead = this.stateP2.lives <= 0;

    if (p1Dead && p2Dead) {
      this.endRound();
    } else if (this.elapsed >= roundDuration) {
      this.endRound();
    }
  }

  private spawnSynchronizedFallers(): void {
    const def = pickItem(this.cfg.items, this.rng, this.difficulty.fraudWeightBonus);
    const relRatio = 0.1 + this.rng() * 0.8; // Normalized X offset inside player arena
    const speed = this.difficulty.fallSpeed * (0.88 + this.rng() * 0.24);
    const spin = def.spin * (this.rng() < 0.5 ? -1 : 1);

    // Spawn for Player 1 (if alive)
    if (this.stateP1.lives > 0) {
      const f1 = this.getInactiveFaller("p1");
      if (f1) {
        const x1 = 60 + relRatio * (ARENA_WIDTH - 120);
        this.activateFaller(f1, def, x1, speed, spin);
      }
    }

    // Spawn for Player 2 (if alive)
    if (this.stateP2.lives > 0) {
      const f2 = this.getInactiveFaller("p2");
      if (f2) {
        const x2 = ARENA_WIDTH + 60 + relRatio * (ARENA_WIDTH - 120);
        this.activateFaller(f2, def, x2, speed, spin);
      }
    }
  }

  private getInactiveFaller(owner: "p1" | "p2"): Faller | undefined {
    return this.fallers.find((f) => !f.active && f.owner === owner);
  }

  private activateFaller(f: Faller, def: ItemDef, x: number, vy: number, spin: number): void {
    f.def = def;
    f.active = true;
    f.missed = false;
    f.radius = def.radius;
    f.vy = vy;
    f.spin = spin;
    f.sprite
      .setTexture(`item:${def.id}`)
      .setDisplaySize(def.radius * 2, def.radius * 2)
      .setPosition(x, -def.radius)
      .setRotation(0)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
  }

  private release(f: Faller): void {
    f.active = false;
    f.def = null;
    f.sprite.setVisible(false).setActive(false);
  }

  private handleCatch(f: Faller): void {
    const def = f.def;
    if (!def) return;
    const x = f.sprite.x;
    const isP1 = f.owner === "p1";
    const zone = isP1 ? this.zoneP1 : this.zoneP2;
    const currentState = isP1 ? this.stateP1 : this.stateP2;

    const res = applyCatch(currentState, def, this.cfg.combo);
    if (isP1) {
      this.stateP1 = res.state;
      this.basketP1Pulse = 1;
    } else {
      this.stateP2 = res.state;
      this.basketP2Pulse = 1;
    }

    this.release(f);

    if (def.kind === "good") {
      const color = resolveColor(def.color, this.theme);
      this.burst(x, zone.topY, hexToNumber(color), def.id === "golden" ? 30 : 14);
      const label = res.multiplier > 1 ? `+${res.delta} x${res.multiplier}` : `+${res.delta}`;
      this.floatText(x, zone.topY - 60, label, def.id === "golden" ? "#FFD54A" : "#ffffff", def.id === "golden" ? 72 : 56);
      this.sfx.play(def.sound, 1 + Math.min(res.state.combo, 12) * 0.025);
    } else {
      this.burst(x, zone.topY, hexToNumber(this.danger), 24);
      this.floatText(x, zone.topY - 60, String(def.points), this.danger, 68);
      this.sfx.play("fraud");
      this.cameras.main.shake(200, 0.01);
    }

    this.refreshHud();
  }

  private handleMiss(f: Faller): void {
    const def = f.def;
    if (!def || def.kind !== "good") return;
    const isP1 = f.owner === "p1";
    const currentState = isP1 ? this.stateP1 : this.stateP2;
    const nextState = applyMiss(currentState, def);

    if (isP1) this.stateP1 = nextState;
    else this.stateP2 = nextState;

    this.sfx.play("miss");
    this.floatText(f.sprite.x, (isP1 ? this.zoneP1 : this.zoneP2).topY + 30, this.cfg.text.miss, "#ffffff", 36, 0.6);
    this.refreshHud();
  }

  /* -------------------------------- effects ------------------------------- */

  private burst(x: number, y: number, tint: number, count: number): void {
    let made = 0;
    for (const s of this.sparks) {
      if (s.active) continue;
      const angle = -Math.PI / 2 + (this.rng() - 0.5) * Math.PI * 1.5;
      const speed = 240 + this.rng() * 480;
      s.active = true;
      s.vx = Math.cos(angle) * speed;
      s.vy = Math.sin(angle) * speed;
      s.maxLife = s.life = 0.4 + this.rng() * 0.35;
      s.sprite.setPosition(x, y).setTint(tint).setScale(0.5 + this.rng() * 0.6).setAlpha(1).setVisible(true).setActive(true);
      if (++made >= count) break;
    }
  }

  private floatText(x: number, y: number, str: string, color: string, size: number, life = 1): void {
    for (const f of this.floaters) {
      if (f.active) continue;
      f.active = true;
      f.maxLife = f.life = life;
      f.vy = -150;
      f.text
        .setText(str)
        .setColor(color)
        .setFontSize(size)
        .setPosition(x, y)
        .setScale(0.7)
        .setAlpha(1)
        .setVisible(true)
        .setActive(true);
      return;
    }
  }

  private updateEffects(dt: number): void {
    for (const s of this.sparks) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        s.sprite.setVisible(false).setActive(false);
        continue;
      }
      s.vy += GRAVITY * dt;
      s.sprite.x += s.vx * dt;
      s.sprite.y += s.vy * dt;
      s.sprite.setAlpha(s.life / s.maxLife);
    }

    for (const f of this.floaters) {
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        f.text.setVisible(false).setActive(false);
        continue;
      }
      const age = 1 - f.life / f.maxLife;
      f.text.y += f.vy * dt;
      f.text.setScale(Math.min(1, 0.7 + age * 3)).setAlpha(f.life / f.maxLife < 0.35 ? (f.life / f.maxLife) / 0.35 : 1);
    }
  }

  /* ---------------------------------- HUD --------------------------------- */

  private refreshHud(): void {
    this.livesP1Icons.forEach((icon, i) => icon.setAlpha(i < this.stateP1.lives ? 1 : 0.2));
    this.livesP2Icons.forEach((icon, i) => icon.setAlpha(i < this.stateP2.lives ? 1 : 0.2));

    if (this.stateP1.combo >= 2) {
      this.comboP1Text.setText(`x${1 + Math.floor(this.stateP1.combo / this.cfg.combo.step)}`).setVisible(true);
    } else {
      this.comboP1Text.setVisible(false);
    }

    if (this.stateP2.combo >= 2) {
      this.comboP2Text.setText(`x${1 + Math.floor(this.stateP2.combo / this.cfg.combo.step)}`).setVisible(true);
    } else {
      this.comboP2Text.setVisible(false);
    }

    const lead = getLeadStatus(this.p1Name, this.stateP1.score, this.p2Name, this.stateP2.score);
    this.leaderText.setText(lead.label);

    if (lead.leader === "player1") {
      this.leaderText.setColor(PLAYER1_COLOR);
    } else if (lead.leader === "player2") {
      this.leaderText.setColor(PLAYER2_COLOR);
    } else {
      this.leaderText.setColor("#ffffff");
    }
  }

  private updateHud(dt: number): void {
    if (this.phase === "ready") return;

    this.displayScoreP1 += (this.stateP1.score - this.displayScoreP1) * Math.min(1, dt * 12);
    this.scoreP1Text.setText(String(Math.round(this.displayScoreP1)));

    this.displayScoreP2 += (this.stateP2.score - this.displayScoreP2) * Math.min(1, dt * 12);
    this.scoreP2Text.setText(String(Math.round(this.displayScoreP2)));

    if (this.phase === "playing") {
      const roundDuration = this.bridge.roundDurationMs || this.cfg.roundDurationMs;
      const left = secondsLeft(this.elapsed, roundDuration);
      this.timerText.setText(String(left)).setColor(left <= 10 ? this.danger : "#ffffff");
      this.timerBar.setScale(clamp(1 - this.elapsed / roundDuration, 0, 1), 1);
    }
  }
}
