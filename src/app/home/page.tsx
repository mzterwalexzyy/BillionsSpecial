"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard, getUserStats } from "@/lib/api";
import { motion } from "framer-motion";
import logoSrc from "@/public/logos/billions_logo.png"; // floating logos

interface UserStats {
  points: number;
  total_score: number;
  max_level: number;
  rank: number | null;
}

// Hook to get window size
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

// FloatingLogo component
function FloatingLogo({
  src,
  size = 80,
  xStart = 0,
  yStart = 0,
  duration = 12,
}: {
  src: string;
  size?: number;
  xStart?: number;
  yStart?: number;
  duration?: number;
}) {
  const xEnd = xStart + (Math.random() * 200 - 100);
  const yEnd = yStart + (Math.random() * 200 - 100);

  return (
    <motion.img
      src={src}
      alt="Billions Logo"
      className="absolute pointer-events-none"
      style={{ width: size, height: size, top: yStart, left: xStart, opacity: 0.5 }}
      animate={{ x: xEnd, y: yEnd, rotate: Math.random() * 360 }}
      transition={{
        duration: duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    />
  );
}

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const windowSize = useWindowSize();
  const [logos, setLogos] = useState<
    { size: number; xStart: number; yStart: number; duration: number }[]
  >([]);

  // Redirect if not logged in
  useEffect(() => {
    const storedUsername = localStorage.getItem("bna_username");
    const storedUserId = localStorage.getItem("bna_user_id");

    if (!storedUsername) {
      router.push("/login");
      return;
    }

    setUsername(storedUsername);
    setUserId(storedUserId || null);
  }, [router]);

  // Fetch leaderboard and user stats
  useEffect(() => {
    if (!username) return;

    (async () => {
      setLoading(true);
      try {
        const lb = await getLeaderboard(10);
        setLeaderboard(lb || []);

        if (userId) {
          const stats = await getUserStats(userId);
          setUserStats(stats as UserStats);
        }
      } catch (err) {
        console.error("Error loading leaderboard or stats:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [username, userId]);

  // Generate floating logos after window size is available
  useEffect(() => {
    if (!windowSize.width || !windowSize.height) return;

    const generated = Array.from({ length: 12 }).map(() => ({
      size: 40 + Math.random() * 60,
      xStart: Math.random() * windowSize.width,
      yStart: Math.random() * windowSize.height,
      duration: 8 + Math.random() * 8,
    }));

    setLogos(generated);
  }, [windowSize]);

  const startQuiz = () => router.push("/quiz");
  const signOut = () => {
    localStorage.removeItem("bna_username");
    localStorage.removeItem("bna_user_id");
    router.push("/login");
  };

  const resetLevel = () => {
    if (!username) return;
    localStorage.setItem(`bna_progress_${username}`, JSON.stringify({ levelIndex: 0 }));
    setUserStats((prev) => prev && { ...prev, max_level: 0, total_score: 0, points: 0 });
    alert("Your progress has been reset!");
  };

  return (
    <main className="relative min-h-screen bg-black text-white p-6 flex items-start justify-center overflow-hidden">
      {/* Floating logos */}
      {logos.map((l, i) => (
        <FloatingLogo
          key={i}
          src={logoSrc.src}
          size={l.size}
          xStart={l.xStart}
          yStart={l.yStart}
          duration={l.duration}
        />
      ))}

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
        {/* MAIN SECTION */}
        <div className="col-span-1 md:col-span-2 bg-[#071019] p-6 rounded-2xl border border-white/10 shadow-lg relative">
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#00FFFF]">
                Welcome{username ? `, ${username}` : ""}
              </h1>
              <p className="text-sm text-white/70">
                Start the Billions Network quiz to earn points and climb the leaderboard.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">Current Level</p>
              <p className="text-sm font-semibold text-[#FFD700]">
                {userStats
                  ? `Level ${Math.min((userStats.max_level ?? 0) + 1, 2)}`
                  : "Level 1"}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={startQuiz}
              className="flex-1 py-3 rounded-lg bg-[#00FFFF] text-black font-bold hover:bg-[#00e6e6] transition"
            >
              Start Quiz
            </button>
            <button
              onClick={signOut}
              className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              Sign Out
            </button>
            <button
              onClick={resetLevel}
              className="py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
            >
              Reset Level
            </button>
          </div>

          {/* USER STATS */}
          <div className="bg-white/5 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Your Stats</h3>
            {loading ? (
              <p className="text-sm text-white/60">Loading...</p>
            ) : (
              <div className="text-sm text-white/70 space-y-1">
                <div>
                  Total Points:{" "}
                  <span className="text-[#FFD700] font-bold">
                    {userStats?.total_score ?? userStats?.points ?? 0}
                  </span>
                </div>

                <div>
                  Highest Level:{" "}
                  <span className="text-[#FFD700] font-bold">
                    Level {Math.min((userStats?.max_level ?? 0) + 1, 2)}
                  </span>
                </div>
                <div>
                  Rank:{" "}
                  <span className="text-[#FFD700] font-bold">{userStats?.rank ?? "—"}</span>
                </div>
              </div>
            )}
          </div>

          {/* ABOUT SECTION */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">About</h3>
            <p className="text-sm text-white/70">
              Billions Quiz Arena is a fun and competitive learning experience built for the
              Billions Network community. No wallet required — just your Discord username. Earn
              points, climb levels, and show your mastery!
            </p>
          </div>
        </div>

        {/* LEADERBOARD SIDEBAR */}
        <aside className="bg-[#071019] p-4 rounded-2xl border border-white/10 shadow-lg relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Leaderboard</h3>
            <a
              href="/leaderboard"
              className="text-xs text-[#00FFFF] underline hover:text-[#00e6e6]"
            >
              View all
            </a>
          </div>

          {loading ? (
            <p className="text-sm text-white/60">Loading leaderboard...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-sm text-white/60">No scores yet — be the first!</p>
          ) : (
            <ol className="space-y-2">
              {leaderboard.map((row: any, i: number) => {
                const name = row.users?.username ?? row.username ?? "Unknown Player";
                return (
                  <li
                    key={row.user_id ?? i}
                    className="flex items-center justify-between bg-white/5 p-2 rounded"
                  >
                    <div>
                      <div className="font-semibold">
                        {i + 1}. {name}
                      </div>
                      <div className="text-xs text-white/60">
                        Level {Math.min((row.max_level ?? 0) + 1, 2)}
                      </div>
                    </div>
                    <div className="font-bold text-[#FFD700]">{row.total_score ?? 0}</div>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </div>
    </main>
  );
}
