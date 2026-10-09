"use client";

import { useState } from "react";
import Game from "@/games/mpesa-catch";
import type { GameResult2P } from "@/games/mpesa-catch/types";
import { defaultTheme } from "@/lib/theme";
import {
  Trophy,
  Play,
  Users,
  Timer,
  Volume2,
  VolumeX,
  RotateCcw,
  Gamepad2,
  Sparkles,
  Flame,
  Target,
  Heart,
  Scale,
  User,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const [inLobby, setInLobby] = useState(true);
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [roundDurationSec, setRoundDurationSec] = useState(45);
  const [roundKey, setRoundKey] = useState(0);
  const [result2P, setResult2P] = useState<GameResult2P | null>(null);
  const [muted, setMuted] = useState(false);

  const theme = defaultTheme;

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    setResult2P(null);
    setInLobby(false);
    setRoundKey((k) => k + 1);
  };

  const handleRematch = () => {
    setResult2P(null);
    setRoundKey((k) => k + 1);
  };

  const handleNewMatch = () => {
    setResult2P(null);
    setInLobby(true);
  };

  return (
    <main
      className={`relative min-h-screen w-full bg-slate-950 font-sans text-slate-100 ${
        inLobby ? "overflow-y-auto" : "h-screen overflow-hidden"
      }`}
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* BACKGROUND GRADIENT & AMBIENT LIGHTING */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90" />
      <div className="fixed -left-40 -top-40 h-[28rem] w-[28rem] pointer-events-none rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="fixed -right-40 -top-40 h-[28rem] w-[28rem] pointer-events-none rounded-full bg-rose-500/10 blur-[120px]" />

      {/* LOBBY / REGISTRATION SCREEN */}
      {inLobby ? (
        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-4 py-8 sm:px-6 sm:py-10 md:px-12 lg:px-16">
          {/* HEADER SECTION */}
          <header className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              2-Player Competitive Arcade
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white">
              M-PESA CATCH{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                SHOWDOWN
              </span>
            </h1>

            <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl">
              Catch coins, airtime, and bonuses while dodging fraud. Play live side-by-side!
            </p>
          </header>

          {/* PLAYER FORM & MATCH CONFIGURATION */}
          <form
            onSubmit={handleStartGame}
            className="mx-auto my-6 sm:my-8 flex w-full max-w-5xl flex-col gap-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* PLAYER 1 CARD (CYAN THEME) */}
              <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5 sm:p-7 backdrop-blur-xl transition hover:border-cyan-500/40 shadow-xl shadow-cyan-950/20">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-950/80 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-400 border border-cyan-500/30">
                    <User className="w-3.5 h-3.5" /> Player 1 — Left Arena
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <span className="text-slate-500">Keys:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300">A</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-cyan-300">D</kbd>
                  </div>
                </div>

                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Player 1 Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={player1Name}
                    onChange={(e) => setPlayer1Name(e.target.value)}
                    maxLength={16}
                    required
                    className="w-full rounded-xl border border-cyan-500/30 bg-slate-950/80 px-4 py-3.5 text-lg font-bold text-cyan-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
                    placeholder="Player 1"
                  />
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">A</kbd>
                    <span>Left</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">D</kbd>
                    <span>Right</span>
                  </div>
                  <span className="text-slate-600 ml-auto hidden sm:inline">Or Touch Screen Left</span>
                </div>
              </div>

              {/* PLAYER 2 CARD (ROSE THEME) */}
              <div className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-slate-900/60 p-5 sm:p-7 backdrop-blur-xl transition hover:border-rose-500/40 shadow-xl shadow-rose-950/20">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-950/80 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-rose-400 border border-rose-500/30">
                    <User className="w-3.5 h-3.5" /> Player 2 — Right Arena
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <span className="text-slate-500">Keys:</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-rose-300">←</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-rose-300">→</kbd>
                  </div>
                </div>

                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Player 2 Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    maxLength={16}
                    required
                    className="w-full rounded-xl border border-rose-500/30 bg-slate-950/80 px-4 py-3.5 text-lg font-bold text-rose-200 placeholder-slate-600 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition"
                    placeholder="Player 2"
                  />
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-400 font-mono">
                      <ArrowLeft className="w-3 h-3 inline" />
                    </kbd>
                    <span>Left</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-rose-400 font-mono">
                      <ArrowRight className="w-3 h-3 inline" />
                    </kbd>
                    <span>Right</span>
                  </div>
                  <span className="text-slate-600 ml-auto hidden sm:inline">Or Touch Screen Right</span>
                </div>
              </div>
            </div>

            {/* DURATION & CTA CONTROLS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Timer className="w-4 h-4 text-amber-400" />
                  <span>Match Time:</span>
                </div>
                <div className="flex gap-2">
                  {[30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setRoundDurationSec(sec)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                        roundDurationSec === sec
                          ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-extrabold"
                          : "bg-slate-800/90 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-8 py-4 text-base font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START SHOWDOWN</span>
              </button>
            </div>
          </form>

          {/* FOOTER */}
          <footer className="mx-auto text-center text-xs text-slate-500 py-2">
            Supports Keyboard Controls & Dual Touch Controls • Works on Mobile, Tablet & Kiosk
          </footer>
        </div>
      ) : (
        /* GAME ARENA & WINNER MODAL */
        <div className="relative h-screen w-full">
          <Game
            key={roundKey}
            theme={theme}
            muted={muted}
            player1Name={player1Name}
            player2Name={player2Name}
            roundDurationMs={roundDurationSec * 1000}
            onGameOver={() => {}}
            onGameOver2P={(res) => setResult2P(res)}
          />

          {/* WINNER CEREMONY OVERLAY (SCROLLABLE ON SHORT SCREENS) */}
          {result2P && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xl p-4 sm:p-6 flex items-center justify-center animate-fade-in">
              <div className="w-full max-w-3xl my-auto rounded-3xl border border-slate-700/60 bg-slate-900/95 p-6 sm:p-8 text-center shadow-2xl">
                {/* WINNER HEADER */}
                <div className="flex flex-col items-center justify-center gap-2 mb-6">
                  {result2P.winner === "tie" ? (
                    <>
                      <div className="p-3 rounded-full bg-slate-800 border border-slate-700">
                        <Scale className="w-10 h-10 text-amber-400" />
                      </div>
                      <h2 className="text-3xl sm:text-5xl font-extrabold text-amber-300">
                        IT&apos;S A DRAW!
                      </h2>
                      <p className="text-xs uppercase tracking-wider text-slate-400">Equal Points Scored</p>
                    </>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-full bg-amber-400/10 border border-amber-400/30">
                        <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                        Match Winner
                      </span>
                      <h2
                        className={`text-3xl sm:text-5xl font-black tracking-tight ${
                          result2P.winner === "player1" ? "text-cyan-300" : "text-rose-400"
                        }`}
                      >
                        {result2P[result2P.winner].name.toUpperCase()} WINS!
                      </h2>
                    </>
                  )}
                </div>

                {/* STATS COMPARISON GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 text-left">
                  {/* PLAYER 1 STATS */}
                  <div
                    className={`rounded-2xl border p-4 sm:p-5 bg-slate-950/70 ${
                      result2P.winner === "player1"
                        ? "border-cyan-400 ring-2 ring-cyan-500/20"
                        : "border-slate-800 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                      <span className="text-base font-bold text-cyan-300">{result2P.player1.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        Player 1
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Target className="w-4 h-4 text-cyan-400" /> Score
                        </span>
                        <span className="font-black text-xl text-cyan-300">
                          {result2P.player1.score}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Sparkles className="w-4 h-4 text-slate-400" /> Items Caught
                        </span>
                        <span className="font-bold">{result2P.player1.itemsCaught}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Flame className="w-4 h-4 text-amber-400" /> Best Combo
                        </span>
                        <span className="font-bold">{result2P.player1.maxCombo}x</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Heart className="w-4 h-4 text-rose-400" /> Lives Left
                        </span>
                        <span className="font-bold">{result2P.player1.livesLeft}</span>
                      </div>
                    </div>
                  </div>

                  {/* PLAYER 2 STATS */}
                  <div
                    className={`rounded-2xl border p-4 sm:p-5 bg-slate-950/70 ${
                      result2P.winner === "player2"
                        ? "border-rose-400 ring-2 ring-rose-500/20"
                        : "border-slate-800 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                      <span className="text-base font-bold text-rose-300">{result2P.player2.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                        Player 2
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Target className="w-4 h-4 text-rose-400" /> Score
                        </span>
                        <span className="font-black text-xl text-rose-300">
                          {result2P.player2.score}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Sparkles className="w-4 h-4 text-slate-400" /> Items Caught
                        </span>
                        <span className="font-bold">{result2P.player2.itemsCaught}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Flame className="w-4 h-4 text-amber-400" /> Best Combo
                        </span>
                        <span className="font-bold">{result2P.player2.maxCombo}x</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Heart className="w-4 h-4 text-rose-400" /> Lives Left
                        </span>
                        <span className="font-bold">{result2P.player2.livesLeft}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleRematch}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-md transition active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>REMATCH</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNewMatch}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-6 py-3.5 text-sm font-bold text-slate-200 transition active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>CHANGE PLAYERS</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUDIO MUTE TOGGLE */}
      <button
        type="button"
        aria-label={muted ? "Unmute" : "Mute"}
        onClick={() => setMuted((m) => !m)}
        className="fixed bottom-4 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/90 text-slate-200 shadow-xl backdrop-blur-md hover:bg-slate-800 transition"
      >
        {muted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
      </button>
    </main>
  );
}
