# M-Pesa Catch

A 60-second catch game for event kiosks and phones. Drag the basket to catch coins, airtime and golden bonuses. Dodge fraud icons.

Built with Next.js 15 (App Router), TypeScript (strict), Tailwind CSS and Phaser 3.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Other commands:

```bash
npm run build      # production build
npm start          # serve the production build (use this on kiosks)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest unit tests for the game rules
npm run check      # typecheck + lint + test
```

On a desktop you can also use the left/right arrow keys or A/D.

## How to play

60 seconds, 3 lives. Coin +10, airtime +25, golden bonus +100. Fraud is -50 and costs a life.
Catching items in a row builds a combo: every 5 in a row adds 1 to the multiplier (up to x5).
A missed good item or a fraud hit resets the combo. Everything gets faster every 10 seconds.

## Folder layout

```
app/page.tsx                  Test harness (final score + Play again). Not part of the game.
lib/theme.ts                  ThemeConfig type and the placeholder default theme
lib/game.ts                   GameProps / GameResult types (the integration contract)
games/mpesa-catch/
  index.tsx                   Default export <Game />. Loads Phaser with next/dynamic (ssr: false)
  GameClient.tsx              Creates and destroys the Phaser game (1080x1920, Scale.FIT)
  MpesaCatchScene.ts          Gameplay, HUD, start screen, countdown, effects
  config.ts                   Game content and tuning (edit this)
  logic.ts / logic.test.ts    Pure rules (scoring, difficulty, combo) and their tests
  textures.ts                 Draws all sprites in code
  audio.ts                    WebAudio sound effects
```

## Drop it into a larger platform

Copy `games/mpesa-catch/`, `lib/theme.ts` and `lib/game.ts`. Then:

```tsx
import Game from "@/games/mpesa-catch";

<Game
  theme={theme}                       // ThemeConfig from lib/theme.ts
  muted={false}
  onGameOver={({ score, meta }) => {  // called once per round
    // meta = { maxCombo, itemsCaught }
  }}
/>
```

The game fills its parent element, so give the parent a size (for example `fixed inset-0`).
It has no lobby, name entry or leaderboard. Remount it (change `key`) to play again.
Dependencies it needs: `phaser`, `next`, `react`.

## Re-theme

Edit `lib/theme.ts` (or pass your own `ThemeConfig`):

| Field | Used for |
|---|---|
| `primaryColor` | Background gradient, basket, airtime card |
| `accentColor` | Coins, score highlights, "Tap to start", basket rim |
| `fontFamily` | All text. Use system fonts so it works offline |
| `sponsorName` | Start screen text |
| `logoUrl` | Start screen logo. Empty string shows the sponsor name instead |

Changing the theme remounts the game, because colors are baked into the sprites at start.
The default art is a placeholder. Do not add real trademarked logos to the repo without permission.

## Edit the game content

Open `games/mpesa-catch/config.ts`. No code changes needed.

- `roundDurationMs`: 30 000 to 90 000
- `lives`, `countdownSeconds`, `endDelayMs`
- `items`: points, spawn `weight`, size (`radius`), color, shape, sound. Add or remove entries freely.
  Each item has a `kind`: `"good"` or `"fraud"`.
- `difficulty`: fall speed, spawn rate, how often it ramps, extra fraud per level
- `combo`: how many catches per multiplier step and the cap
- `text`: every on-screen message

Colors: `"primary"` and `"accent"` follow the theme. Any other value is a fixed hex like `"#FFD54A"`.

To swap a sprite for your own art, set `imageUrl` on an item (or `basket.imageUrl`), for example
`imageUrl: "/art/coin.png"` with the file in `public/art/`. The image is stretched to a square of
`radius * 2`. If the image fails to load, the drawn shape is used.

## Kiosk setup tips

- Run `npm run build && npm start` and open the page in fullscreen/kiosk mode.
- The canvas is 1080x1920 and scales to fit. On a landscape screen it is centered with side bars
  in the brand color. On a 1080x1920 portrait kiosk it fills the screen.
- Touch zoom, text selection, long-press menu and pull-to-refresh are disabled.

## Known limitations

- Not yet tested on real hardware. Typecheck, lint, unit tests and the production build pass,
  but the 60fps target on mid-range Android and multi-touch on a kiosk still need a device check.
- On a landscape screen the portrait game does not stretch; it is centered with side bars.
- Only the pure logic has unit tests. The Phaser scene, rendering and audio have none.
- Basket follows the most recently moved finger. A second finger does not add a second basket.
- Theme and `muted` are read at start for colors; `muted` updates live, but a theme change restarts the round.
- Sounds are simple synth beeps. iOS only unlocks audio after a touch ends, so the very first sound can be late.
- `navigator.vibrate` works on Android browsers only. iOS Safari ignores it.
- Custom `imageUrl` art is stretched to a square, so non-square images will look squashed.
- The round pauses if the browser tab is hidden (Phaser stops its loop), then continues where it left off.
