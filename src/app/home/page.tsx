// src/app/home/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LEVELS } from "@/lib/questions";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [levelIndex, setLevelIndex] = useState(0);

  useEffect(() => {
    const u = localStorage.getItem("bna_username");
    if (!u) {
      router.push("/login");
      return;
    }
    setUsername(u);

    const progressKey = `bna_progress_${u}`;
    const progressRaw = localStorage.getItem(progressKey);
    if (progressRaw) {
      try {
        const parsed = JSON.parse(progressRaw);
        setLevelIndex(parsed.levelIndex ?? 0);
      } catch {
        setLevelIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startQuiz = () => {
    router.push("/quiz");
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#071019] border border-white/6 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#00FFFF" }}>
              Welcome{username ? `, ${username}` : ""} 👋
            </h1>
            <p className="text-sm text-white/70 mt-1">Your reputation is your passport to the future 🌐</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Current Level</p>
            <p className="text-sm font-semibold" style={{ color: "#FFD700" }}>
              {LEVELS[levelIndex]?.title ?? "Level 1"}
            </p>
          </div>
        </div>

        <p className="mb-6 text-white/70">Ready to prove your knowledge? Click Start Quiz to begin.</p>

        <div className="flex gap-4">
          <button onClick={startQuiz} className="flex-1 py-3 rounded-lg bg-[#00FFFF] text-black font-bold hover:opacity-95 transition">
            Start Quiz
          </button>
          <button
            onClick={() => {
              // small sign out
              localStorage.removeItem("bna_username");
              router.push("/login");
            }}
            className="py-3 px-4 rounded-lg bg-white/5 border border-white/8"
          >
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}
