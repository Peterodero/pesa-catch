"use client";

import { useState } from "react";
import Game from "@/games/mpesa-catch";
import type { GameResult2P } from "@/games/mpesa-catch/types";
import { defaultTheme } from "@/lib/theme";

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
      className="fixed inset-0 select-none overflow-hidden bg-slate-950 font-sans text-white"
      style={{ fontFamily: theme.fontFamily }}
    >
      {/* BACKGROUND GRADIENT & STAGE LIGHTING */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-950 to-black opacity-90" />
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />

      {/* LOBBY / REGISTRATION SCREEN */}
      {inLobby ? (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-between p-6 md:p-12">
          {/* TOP HEADER */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-4 py-1.5 text-xs md:text-sm font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Big Screen Gameshow Edition
            </div>
            <h1 className="mt-3 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400 drop-shadow-lg">
              M-PESA CATCH: SHOWDOWN
            </h1>
            <p className="mt-2 text-base md:text-xl text-slate-300">
              Two players compete live on the big screen! High score takes the trophy.
            </p>
          </div>

          {/* PLAYER CARDS ENTRY FORM */}
          <form onSubmit={handleStartGame} className="w-full max-w-5xl my-auto flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* PLAYER 1 CARD (LEFT) */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-cyan-500/40 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-cyan-950/50">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-blue-500" />
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold uppercase text-cyan-400 border border-cyan-500/40">
                    Player 1 — Left Side
                  </span>
                  <span className="text-sm font-mono text-cyan-300">Keys: [ A ] [ D ]</span>
                </div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Enter Player 1 Name
                </label>
                <input
                  type="text"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  maxLength={16}
                  required
                  className="w-full rounded-2xl border-2 border-cyan-500/40 bg-slate-950 px-5 py-4 text-2xl font-bold text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition"
                  placeholder="Player 1"
                />
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-1 font-mono text-cyan-400">A</span> Move Left
                  <span className="rounded bg-slate-800 px-2 py-1 font-mono text-cyan-400">D</span> Move Right
                </div>
              </div>

              {/* PLAYER 2 CARD (RIGHT) */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/40 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-rose-950/50">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 to-amber-500" />
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold uppercase text-rose-400 border border-rose-500/40">
                    Player 2 — Right Side
                  </span>
                  <span className="text-sm font-mono text-rose-300">Keys: [ ← ] [ → ]</span>
                </div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Enter Player 2 Name
                </label>
                <input
                  type="text"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  maxLength={16}
                  required
                  className="w-full rounded-2xl border-2 border-rose-500/40 bg-slate-950 px-5 py-4 text-2xl font-bold text-rose-300 placeholder-slate-600 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-500/20 transition"
                  placeholder="Player 2"
                />
                <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-1 font-mono text-rose-400">←</span> Move Left
                  <span className="rounded bg-slate-800 px-2 py-1 font-mono text-rose-400">→</span> Move Right
                </div>
              </div>
            </div>

            {/* DURATION SELECTOR & SUBMIT */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Match Duration:
                </span>
                <div className="flex gap-2">
                  {[30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setRoundDurationSec(sec)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                        roundDurationSec === sec
                          ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20 scale-105"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 px-12 py-5 text-2xl font-black text-slate-950 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition transform duration-200"
              >
                START SHOWDOWN ⚔️
              </button>
            </div>
          </form>

          {/* FOOTER */}
          <div className="text-center text-xs text-slate-500">
            Playable via Keyboard or Dual Touch Control • Big Screen TV Compatible
          </div>
        </div>
      ) : (
        /* GAME ARENA & WINNER MODAL */
        <div className="relative h-full w-full">
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

          {/* WINNER CEREMONY OVERLAY */}
          {result2P && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-xl animate-fadeIn">
              <div className="w-full max-w-4xl rounded-3xl border-2 border-amber-400/50 bg-slate-900/90 p-8 text-center shadow-2xl shadow-amber-500/20">
                {/* WINNER BANNER */}
                <div className="mb-6">
                  {result2P.winner === "tie" ? (
                    <h2 className="text-5xl md:text-7xl font-extrabold text-amber-300 drop-shadow-md">
                      🤝 IT&apos;S A DRAW! 🤝
                    </h2>
                  ) : (
                    <div>
                      <p className="text-xl font-bold uppercase tracking-widest text-amber-400">
                        Gameshow Champion
                      </p>
                      <h2
                        className={`text-5xl md:text-7xl font-black tracking-tight mt-1 ${
                          result2P.winner === "player1" ? "text-cyan-300" : "text-rose-400"
                        }`}
                      >
                        🏆 WINNER: {result2P[result2P.winner].name.toUpperCase()}! 🏆
                      </h2>
                    </div>
                  )}
                </div>

                {/* STATS COMPARISON GRID */}
                <div className="grid grid-cols-2 gap-6 my-8 text-left">
                  {/* PLAYER 1 STATS */}
                  <div
                    className={`rounded-2xl border-2 p-5 bg-slate-950/80 ${
                      result2P.winner === "player1"
                        ? "border-cyan-400 ring-4 ring-cyan-500/20"
                        : "border-slate-800 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <span className="text-xl font-bold text-cyan-300">{result2P.player1.name}</span>
                      <span className="text-xs uppercase px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold">
                        P1
                      </span>
                    </div>
                    <div className="space-y-2 text-sm md:text-base">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Score</span>
                        <span className="font-extrabold text-2xl text-cyan-300">
                          {result2P.player1.score}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Items Caught</span>
                        <span className="font-bold">{result2P.player1.itemsCaught}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Best Combo</span>
                        <span className="font-bold">{result2P.player1.maxCombo}x</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Lives Left</span>
                        <span className="font-bold">{result2P.player1.livesLeft}</span>
                      </div>
                    </div>
                  </div>

                  {/* PLAYER 2 STATS */}
                  <div
                    className={`rounded-2xl border-2 p-5 bg-slate-950/80 ${
                      result2P.winner === "player2"
                        ? "border-rose-400 ring-4 ring-rose-500/20"
                        : "border-slate-800 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <span className="text-xl font-bold text-rose-300">{result2P.player2.name}</span>
                      <span className="text-xs uppercase px-2.5 py-0.5 rounded bg-rose-950 text-rose-400 font-bold">
                        P2
                      </span>
                    </div>
                    <div className="space-y-2 text-sm md:text-base">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Score</span>
                        <span className="font-extrabold text-2xl text-rose-300">
                          {result2P.player2.score}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Items Caught</span>
                        <span className="font-bold">{result2P.player2.itemsCaught}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Best Combo</span>
                        <span className="font-bold">{result2P.player2.maxCombo}x</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Lives Left</span>
                        <span className="font-bold">{result2P.player2.livesLeft}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <button
                    type="button"
                    onClick={handleRematch}
                    className="rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 px-10 py-4 text-xl font-extrabold text-black shadow-lg hover:scale-105 active:scale-95 transition"
                  >
                    REMATCH ⚡
                  </button>
                  <button
                    type="button"
                    onClick={handleNewMatch}
                    className="rounded-full border-2 border-slate-700 bg-slate-800 px-8 py-4 text-xl font-bold text-slate-200 hover:bg-slate-700 hover:scale-105 active:scale-95 transition"
                  >
                    CHANGE PLAYERS 👥
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
        className="fixed bottom-4 left-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-xl font-bold text-white shadow-lg backdrop-blur-md hover:bg-slate-800"
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </main>
  );
}
