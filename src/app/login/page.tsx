"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  const handleLogin = async (guest = false) => {
    const name = guest ? `Guest_${Math.floor(Math.random() * 10000)}` : username.trim();
    if (!name) {
      alert("Please enter your Discord username or continue as guest.");
      return;
    }

    // Save username locally (mock session)
    localStorage.setItem("bna_username", name);

    // Redirect to quiz dashboard
    router.push("/quiz");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#121212] to-[#2c2c2c] text-white p-6">
      <div className="max-w-md w-full bg-black/40 rounded-2xl p-8 shadow-lg border border-white/10">
        <h1 className="text-3xl font-bold text-center mb-4 text-[#FFD700]">
          Billions Quiz Arena
        </h1>
        <p className="text-center text-gray-400 mb-6">
          Enter your Discord username to continue or sign in as a guest.
        </p>

        <input
          type="text"
          placeholder="Discord Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 mb-4 focus:outline-none focus:border-[#FFD700]"
        />

        <button
          onClick={() => handleLogin(false)}
          className="w-full bg-[#FFD700] text-black font-semibold py-3 rounded-xl hover:bg-yellow-400 transition"
        >
          Continue
        </button>

        <div className="text-center my-4 text-gray-400">or</div>

        <button
          onClick={() => handleLogin(true)}
          className="w-full bg-transparent border border-white/20 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition"
        >
          Sign in as Guest
        </button>

        <p className="text-xs text-center mt-6 text-gray-500">
          ⚡ Powered by Billions Network
        </p>
      </div>
    </div>
  );
}
