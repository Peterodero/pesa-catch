import type { ThemeConfig } from "./theme";

/** What every game reports when a round ends. */
export interface GameResult {
  score: number;
  meta?: Record<string, unknown>;
}

/** Props every game's default export must accept (the integration contract). */
export interface GameProps {
  onGameOver: (result: GameResult) => void;
  theme: ThemeConfig;
  muted: boolean;
}
