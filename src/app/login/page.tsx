// src/app/login/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getOrCreateUser } from "@/lib/api";
import { motion } from "framer-motion";
import logoSrc from "@/public/logos/billions_logo.png"; // make sure you have this logo in /public

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
      className="absolute"
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

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const windowSize = useWindowSize();
  const [logos, setLogos] = useState<
    { size: number; xStart: number; yStart: number; duration: number }[]
  >([]);

  // Redirect if user already signed in
  useEffect(() => {
    const saved = localStorage.getItem("bna_username");
    if (saved) router.push("/home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate floating logos only on client after window size is available
  useEffect(() => {
    if (!windowSize.width || !windowSize.height) return;

    const generated = Array.from({ length: 8 }).map(() => ({
      size: 40 + Math.random() * 60,
      xStart: Math.random() * windowSize.width,
      yStart: Math.random() * windowSize.height,
      duration: 8 + Math.random() * 8,
    }));

    setLogos(generated);
  }, [windowSize]);

  const startAs = async (name: string) => {
    const clean = (name || "").trim();
    if (!clean) {
      setError("Enter a Discord username or choose Guest.");
      return;
    }
    setError("");

    const user = await getOrCreateUser(clean);
    if (user?.id) {
      localStorage.setItem("bna_username", user.username);
      localStorage.setItem("bna_user_id", user.id);
      localStorage.setItem(`bna_progress_${user.username}`, JSON.stringify({ levelIndex: 0 }));
      router.push("/home");
    } else {
      localStorage.setItem("bna_username", clean);
      localStorage.removeItem("bna_user_id");
      router.push("/home");
    }
  };

  return (
    <main className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden p-6">
      {/* Floating logos */}
      {logos.map((l, i) => (
        <FloatingLogo
          key={i}
          src={logoSrc.src} // use .src to get URL string
          size={l.size}
          xStart={l.xStart}
          yStart={l.yStart}
          duration={l.duration}
        />
      ))}

      {/* Login box */}
      <div className="z-10 max-w-md w-full bg-[#071019]/90 border border-white/6 rounded-2xl p-8 shadow-lg text-white">
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#FFD700" }}>
          Billions Quiz Arena
        </h1>
        <p className="text-sm text-white/70 mb-6">
          Sign in with your Discord username or continue as Guest.
        </p>

        <input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
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
