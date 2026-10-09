"use client";

import dynamic from "next/dynamic";
import type { GameProps } from "@/lib/game";
import type { GameResult2P } from "./types";

const GameClient = dynamic(() => import("./GameClient"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-black flex items-center justify-center text-white text-2xl font-bold">Loading Arena...</div>,
});

export interface ExtendedGameProps extends GameProps {
  player1Name?: string;
  player2Name?: string;
  roundDurationMs?: number;
  onGameOver2P?: (result: GameResult2P) => void;
}

export default function Game(props: ExtendedGameProps) {
  const { primaryColor, accentColor, fontFamily, sponsorName, logoUrl } = props.theme;
  const p1 = props.player1Name || "p1";
  const p2 = props.player2Name || "p2";
  const dur = props.roundDurationMs || 45000;
  const themeKey = [primaryColor, accentColor, fontFamily, sponsorName, logoUrl, p1, p2, dur].join("|");

  return <GameClient key={themeKey} {...props} />;
}
