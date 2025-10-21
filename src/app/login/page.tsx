// src/app/login/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("bna_username");
    if (saved) {
      // if already signed in -> go home
      router.push("/home");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAs = (name: string) => {
    if (!name || name.trim().length === 0) {
      setError("Enter a Discord username or choose Guest.");
      return;
    }
    const clean = name.trim();
    localStorage.setItem("bna_username", clean);
    // set base progress if not exist
    const progressKey = `bna_progress_${clean}`;
    if (!localStorage.getItem(progressKey)) {
      localStorage.setItem(progressKey, JSON.stringify({ levelIndex: 0 }));
    }
    router.push("/home");
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#071019] border border-white/6 rounded-2xl p-8 shadow-lg">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#FFD700" }}>
          Billions Quiz Arena
        </h1>
        <p className="text-sm text-white/70 mb-6">Sign in with your Discord username or continue as Guest.</p>

        <input
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(""); }}
          placeholder="DiscordUsername#1234"
          className="w-full p-3 rounded-lg mb-3 bg-white/5 border border-white/8 placeholder:text-white/40"
        />

        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={() => startAs(username)}
            className="flex-1 py-3 rounded-lg bg-[#00FFFF] text-black font-semibold hover:opacity-90 transition"
          >
            Continue
          </button>
          <button
            onClick={() => startAs("Guest")}
            className="py-3 px-4 rounded-lg bg-white/5 border border-white/8 hover:bg-white/6 transition"
          >
            Guest
          </button>
        </div>

        <p className="text-xs text-white/50 mt-4">No wallet needed • Data saved locally</p>
      </div>
    </main>
  );
}
