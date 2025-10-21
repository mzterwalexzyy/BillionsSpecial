// src/app/leaderboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LBEntry = {
  username: string;
  level: string;
  score: number;
  total: number;
  date: string;
};

export default function LeaderboardPage() {
  const [list, setList] = useState<LBEntry[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("bna_leaderboard") || "[]";
    try {
      const parsed = JSON.parse(raw) as LBEntry[];
      // show newest first
      setList(parsed.slice().reverse());
    } catch {
      setList([]);
    }
  }, []);

  const clearLocal = () => {
    localStorage.removeItem("bna_leaderboard");
    setList([]);
  };

  const syncToServer = async () => {
    try {
      await fetch("/api/leaderboard/sync", { method: "POST" });
      alert("Sync request sent (server must implement endpoint).");
    } catch (e) {
      alert("Sync failed (no server?).");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#071019] rounded-2xl border border-white/6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[#00FFFF]">Leaderboard (Local)</h1>
          <div className="flex gap-2">
            <button onClick={syncToServer} className="px-3 py-1 bg-[#FFD700] text-black rounded">Sync</button>
            <button onClick={clearLocal} className="px-3 py-1 border rounded">Clear</button>
          </div>
        </div>

        {list.length === 0 ? (
          <p className="text-white/60">No scores yet — play the quiz to add your name!</p>
        ) : (
          <ol className="space-y-3">
            {list.map((row, i) => (
              <li key={i} className="p-3 bg-white/3 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold">{row.username} <span className="text-sm text-white/60">· {row.level}</span></div>
                  <div className="text-sm text-white/60">{row.score} / {row.total} · {new Date(row.date).toLocaleString()}</div>
                </div>
                <div className="text-[#FFD700] font-bold">{Math.round((row.score / row.total) * 100)}%</div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6 text-center">
          <Link href="/home" className="text-sm text-[#00FFFF] underline">← Back</Link>
        </div>
      </div>
    </main>
  );
}
