/**
 * Brand settings shared by every game on the platform.
 * Games must read colors, font and sponsor info from here (never hardcode brand colors).
 */
export interface ThemeConfig {
  /** Main brand color, hex like "#12A150". Drives background, basket, buttons. */
  primaryColor: string;
  /** Highlight color, hex. Drives coins, score highlights, call-to-action text. */
  accentColor: string;
  /** CSS font-family string. Use system fonts for offline kiosks. */
  fontFamily: string;
  /** Sponsor name shown on the start screen. */
  sponsorName: string;
  /** Optional sponsor logo URL. Empty string means "no logo" (a name is shown instead). */
  logoUrl: string;
}

/** Placeholder theme: generic green and gold, no real trademarks. */
export const defaultTheme: ThemeConfig = {
  primaryColor: "#12A150",
  accentColor: "#FFC21E",
  fontFamily: '"Trebuchet MS", "Segoe UI", Roboto, system-ui, sans-serif',
  sponsorName: "Your Brand Here",
  logoUrl: "",
};
