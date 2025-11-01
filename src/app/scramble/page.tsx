"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { getOrCreateUser, addLeaderboardPoints } from "@/lib/api";
import { scrambleWords } from "@/lib/scrambleWords";

// ─── SETTINGS ─────────────────────────────────────
const SETTINGS = {
  Easy: { points: 3, time: 15 },
  Medium: { points: 5, time: 30 },
  Hard: { points: 10, time: 60 },
};

// ─── Floating Logos Component ─────────────────────
import logo1 from "@/public/logos/billions_logo1.png";
import logo2 from "@/public/logos/billions_logo2.png";
import logo3 from "@/public/logos/billions_logo3.png";
import logo4 from "@/public/logos/billions_logo4.png";
import logo5 from "@/public/logos/billions_logo5.png";
import logo6 from "@/public/logos/billions_logo6.png";

// Move this outside the component
const logos = [logo1.src, logo2.src, logo3.src, logo4.src, logo5.src, logo6.src];

function FloatingLogos() {
  const [positions, setPositions] = React.useState<any[]>([]);

  React.useEffect(() => {
    const pos = logos.map(() => ({
      size: 40 + Math.random() * 60,
      xStart: Math.random() * 1000,
      yStart: Math.random() * 600,
      duration: 8 + Math.random() * 8,
      xEnd: Math.random() * 200 - 100,
      yEnd: Math.random() * 200 - 100,
      rotateEnd: Math.random() * 360,
    }));
    setPositions(pos);
  }, []); // ✅ empty array: run only once on mount

  if (!positions.length) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((p, i) => (
        <motion.img
          key={i}
          src={logos[i]}
          alt="Billions Logo"
          className="absolute"
          style={{ width: p.size, height: p.size, top: p.yStart, left: p.xStart, opacity: 0.15 }}
          animate={{ x: [0, p.xEnd, 0], y: [0, p.yEnd, 0], rotate: [0, p.rotateEnd, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        />
      ))}
    </div>
  );
}


// ─── MAIN SCRAMBLE PAGE ──────────────────────────
export default function ScramblePage() {
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | null>(null);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [scrambled, setScrambled] = useState("");
  const [input, setInput] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);

  // ─── Load user and initial points ────────────────
  useEffect(() => {
    const fetchUser = async () => {
      const username = localStorage.getItem("username") || "guest";
      const u = await getOrCreateUser(username);
      setUser(u);
      setPointsEarned(u?.points ?? 0);
    };
    fetchUser();
  }, []);

  // ─── Timer logic ─────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft <= 0) {
      handleTimeUp();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);

    const totalTime = SETTINGS[difficulty!].time;
    if (timeLeft === Math.floor(totalTime / 2)) setHintVisible(true);

    return () => clearTimeout(timer);
  }, [timeLeft, isPlaying, difficulty]);

  // ─── Start a new word ────────────────────────────
  const startGame = (diff: "Easy" | "Medium" | "Hard") => {
    setDifficulty(diff);
    const pool = scrambleWords.filter((w) => w.difficulty === diff);

    if (pool.length === 0) {
      setMessage(`No words available for ${diff} difficulty.`);
      setIsPlaying(false);
      return;
    }

    const random = pool[Math.floor(Math.random() * pool.length)];
    let scrambledWord = random.word.split("").sort(() => Math.random() - 0.5).join("");
    while (scrambledWord === random.word) {
      scrambledWord = random.word.split("").sort(() => Math.random() - 0.5).join("");
    }

    setCurrentWord(random);
    setScrambled(scrambledWord);
    setInput("");
    setHintVisible(false);
    setTimeLeft(SETTINGS[diff].time);
    setIsPlaying(true);
    setMessage("");
  };

  // ─── Submit guess ────────────────────────────────
  const handleSubmit = async () => {
    if (!currentWord || !input.trim()) return;

    const inputLower = input.toLowerCase().trim();
    const wordLower = currentWord.word.toLowerCase();

    if (inputLower === wordLower) {
      const pts = SETTINGS[difficulty!].points;
      await addLeaderboardPoints({ user_id: user.id, points: pts, level: 0 });
      setMessage(`✅ Correct! +${pts} points`);
      setPointsEarned((prev) => prev + pts);
      setIsPlaying(false);
    } else {
      setMessage("❌ Wrong answer! Try again!");
      setIsPlaying(false);
    }
  };

  // ─── Handle time-up ──────────────────────────────
  const handleTimeUp = () => {
    setIsPlaying(false);
    setMessage(`⏰ Time's up! The word was "${currentWord?.word.toUpperCase()}".`);
  };

  // ─── Style helpers ───────────────────────────────
  const getButtonClass = (d: string) => {
    let base = "px-6 py-3 rounded-xl font-bold text-lg transition shadow-lg w-full";
    if (d === "Easy") return `${base} bg-green-600/50 hover:bg-green-600 border border-green-400`;
    if (d === "Medium") return `${base} bg-yellow-600/50 hover:bg-yellow-600 border border-yellow-400`;
    if (d === "Hard") return `${base} bg-red-600/50 hover:bg-red-600 border border-red-400`;
    return base;
  };

  const getTimerClass = (time: number) => {
    const totalTime = SETTINGS[difficulty!]?.time || 1;
    const percent = (time / totalTime) * 100;

    let color = "text-green-400";
    if (percent < 50) color = "text-yellow-400";
    if (percent < 25) color = "text-red-400 animate-pulse";
    return `font-extrabold text-2xl tracking-widest ${color}`;
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-gradient-to-b from-[#0A0A1A] to-[#111] text-white p-4 font-sans">
      
      {/* ─── Floating Logos Background ────── */}
      <FloatingLogos />

      {/* ─── Back Button ─────────────────────────── */}
      <div className="absolute top-6 left-6 z-20">
        <a
          href="/home"
          className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-semibold backdrop-blur-sm transition duration-200 shadow-xl"
        >
          ⬅ Back to Dashboard
        </a>
      </div>

      {/* ─── Main Game Card ───────────────────────── */}
      <div className="relative z-10 flex flex-col items-center p-6 w-full max-w-lg">
        <h1 className="text-4xl font-extrabold mb-8 text-[#00FFFF] drop-shadow-lg">
          Crypto Scramble
        </h1>

        {!difficulty ? (
          // Difficulty selection
          <div className="flex flex-col gap-4 w-full bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10">
            <p className="text-lg mb-3 text-white/70">Select difficulty to begin:</p>
            {(["Easy", "Medium", "Hard"] as const).map((d) => (
              <button key={d} onClick={() => startGame(d)} className={getButtonClass(d)}>
                {d}
              </button>
            ))}
          </div>
        ) : (
          // Game Play / Result
          <div className="w-full bg-white/5 rounded-2xl p-8 shadow-2xl border border-[#00FFFF]/20">
            {isPlaying ? (
              <>
                {/* Timer */}
                <div className="flex justify-between items-center mb-5">
                  <div className="text-lg text-white/70">
                    Difficulty: <span className="font-bold text-[#FFD700]">{difficulty}</span>
                  </div>
                  <div className={getTimerClass(timeLeft)} key={timeLeft}>
                    ⏱️ {timeLeft}s
                  </div>
                </div>

                {/* Scrambled Word */}
                <h2 className="text-5xl font-extrabold tracking-[0.3em] mb-6 text-[#00FFFF]">
                  {scrambled}
                </h2>

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Unscramble..."
                  className="w-full text-center bg-white/10 hover:bg-white/20 rounded-lg p-3 text-white font-semibold outline-none border border-transparent focus:border-[#00FFFF] transition"
                />

                <button
                  onClick={handleSubmit}
                  className="mt-6 px-8 py-3 bg-[#FFD700]/80 text-gray-900 font-extrabold rounded-xl shadow-lg hover:bg-[#FFD700] transition"
                >
                  Submit
                </button>

                {hintVisible && (
                  <div className="mt-4 text-sm text-[#FFD700] transition-opacity duration-500">
                    💡 Hint: {currentWord?.hint}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mb-6 text-xl font-medium text-white/90">{message}</p>
                <button
                  onClick={() => startGame(difficulty!)}
                  className="mt-2 px-8 py-3 bg-[#00FFFF]/30 hover:bg-[#00FFFF]/40 text-white font-bold rounded-xl transition shadow-md"
                >
                  Next Word
                </button>
                <button
                  onClick={() => setDifficulty(null)}
                  className="block mx-auto mt-4 px-4 py-2 text-sm text-white/60 hover:text-white underline transition"
                >
                  Change Difficulty
                </button>
              </>
            )}
          </div>
        )}

        {pointsEarned > 0 && (
          <div className="mt-6 text-[#00FFFF] text-lg font-bold p-3 bg-white/5 rounded-lg shadow-lg">
            🪙 Total Points Earned: {pointsEarned}
          </div>
        )}
      </div>
    </div>
  );
}
