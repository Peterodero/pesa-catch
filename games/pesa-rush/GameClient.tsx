"use client";

import * as Phaser from "phaser";
import { useEffect, useRef } from "react";
import type { GameProps } from "@/lib/game";
import config from "./config";
import { GAME_HEIGHT, GAME_WIDTH, backgroundGradient } from "./logic";
import { PesaRushScene } from "./PesaRushScene";
import type { GameResult2P } from "./types";

export interface GameClientProps extends GameProps {
  player1Name?: string;
  player2Name?: string;
  roundDurationMs?: number;
  onGameOver2P?: (result: GameResult2P) => void;
}

/** Loaded with next/dynamic (ssr: false) from ./index.tsx, so Phaser never runs on the server. */
export default function GameClient({
  onGameOver,
  onGameOver2P,
  theme,
  muted,
  player1Name = "Player 1",
  player2Name = "Player 2",
  roundDurationMs = 45000,
}: GameClientProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const latest = useRef({ onGameOver, onGameOver2P, theme, muted, player1Name, player2Name, roundDurationMs });

  useEffect(() => {
    latest.current = { onGameOver, onGameOver2P, theme, muted, player1Name, player2Name, roundDurationMs };
  });

  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: "#000000",
      banner: false,
      disableContextMenu: true,
      audio: { noAudio: true }, // sounds come from our own WebAudio synth
      render: { antialias: true, powerPreference: "high-performance" },
      input: { activePointers: 4, touch: { capture: true } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: new PesaRushScene({
        config,
        player1Name: latest.current.player1Name,
        player2Name: latest.current.player2Name,
        roundDurationMs: latest.current.roundDurationMs,
        getTheme: () => latest.current.theme,
        isMuted: () => latest.current.muted,
        onGameOver: (result) => latest.current.onGameOver(result),
        onGameOver2P: (result) => {
          if (latest.current.onGameOver2P) {
            latest.current.onGameOver2P(result);
          }
        },
      }),
    });

    const stop = (e: Event) => e.preventDefault();
    parent.addEventListener("contextmenu", stop);
    parent.addEventListener("gesturestart", stop);
    parent.addEventListener("touchmove", stop, { passive: false });

    return () => {
      parent.removeEventListener("contextmenu", stop);
      parent.removeEventListener("gesturestart", stop);
      parent.removeEventListener("touchmove", stop);
      game.destroy(true);
    };
  }, []);

  const { top } = backgroundGradient(theme.primaryColor);
  return (
    <div
      ref={parentRef}
      className="h-full w-full touch-none select-none overflow-hidden"
      style={{ backgroundColor: top, touchAction: "none", overscrollBehavior: "none" }}
    />
  );
}
