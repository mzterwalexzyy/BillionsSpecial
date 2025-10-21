// src/app/quiz/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LEVELS, Question, LevelPool } from "@/lib/questions";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- Small confetti using framer-motion ---------- */

function FramerMotionConfetti({ active }: { active: boolean }) {
  // create 24 pieces with random positions/directions
  const pieces = Array.from({ length: 24 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 160;
    const rotate = (Math.random() - 0.5) * 720;
    const delay = Math.random() * 0.35;
    const colorPool = ["#FFD700", "#00FFFF", "#7AF3FF", "#00FF99", "#BBD8FF"];
    const color = colorPool[i % colorPool.length];
    return { id: i, angle, distance, rotate, delay, color };
  });

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center">
          <div className="relative w-full h-full">
            {pieces.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: -20, x: 0, rotate: 0, scale: 0.8 }}
                animate={{
                  opacity: [1, 1, 0],
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  rotate: p.rotate,
                  scale: [1, 0.9, 0.7],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
                className="absolute left-1/2 top-1/4"
                style={{
                  background: p.color,
                  width: 10 + (p.id % 3) * 5,
                  height: 6 + (p.id % 2) * 6,
                  borderRadius: 2,
                  boxShadow: `0 6px 18px ${p.color}33`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Helper: pickRandom (unchanged) ---------- */
function pickRandom<T>(arr: T[], n: number) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/* ---------- Leaderboard local push helper ---------- */
function pushToLocalLeaderboard(username: string, levelTitle: string, score: number, total: number) {
  try {
    const raw = localStorage.getItem("bna_leaderboard") || "[]";
    const list = JSON.parse(raw) as any[];
    const entry = {
      username,
      level: levelTitle,
      score,
      total,
      date: new Date().toISOString(),
    };
    list.push(entry);
    // keep top 100
    localStorage.setItem("bna_leaderboard", JSON.stringify(list.slice(-100)));
  } catch (e) {
    console.error("leaderboard push failed", e);
  }
}

/* ---------- Optional: POST to API stub if exists (non-blocking) ---------- */
async function postToServerLeaderboard(entry: { username: string; level: string; score: number; total: number }) {
  try {
    await fetch("/api/leaderboard/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
  } catch (e) {
    // ignore network errors (server might not exist yet)
    console.debug("server leaderboard post failed (expected if no backend):", e);
  }
}

/* ---------- Main QuizPage (based on previous logic) ---------- */
export default function QuizPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [playerLevel, setPlayerLevel] = useState<number>(0);

  // session-level data
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);

  // feedback/timer UI
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);

  // level summary / overlay
  const [showSummary, setShowSummary] = useState(false);
  const [passed, setPassed] = useState(false);

  // confetti control
  const [confettiActive, setConfettiActive] = useState(false);

  // current level config
  const levelConfig = useMemo<LevelPool>(() => LEVELS[playerLevel], [playerLevel]);

  // load username + progress
  useEffect(() => {
    const u = localStorage.getItem("bna_username");
    if (!u) {
      router.push("/login");
      return;
    }
    setUsername(u);

    const progressKey = `bna_progress_${u}`;
    const raw = localStorage.getItem(progressKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setPlayerLevel(parsed.levelIndex ?? 0);
      } catch {
        setPlayerLevel(0);
      }
    } else {
      localStorage.setItem(progressKey, JSON.stringify({ levelIndex: 0 }));
      setPlayerLevel(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // build / load session questions
  useEffect(() => {
    if (playerLevel == null) return;
    if (!username) return;

    const sessKeyBase = `bna_session_${username}_level_${playerLevel}`;
    const stored = sessionStorage.getItem(sessKeyBase);
    if (stored) {
      try {
        const parsed: Question[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessionQuestions(parsed);
          setQIndex(parseInt(sessionStorage.getItem(`${sessKeyBase}_index`) || "0", 10) || 0);
          setScore(parseInt(sessionStorage.getItem(`${sessKeyBase}_score`) || "0", 10) || 0);
          setTimeLeft(levelConfig?.timePerQuestion ?? 10);
          return;
        }
      } catch {}
    }

    const chosen = pickRandom(levelConfig.pool, levelConfig.perSession);
    sessionStorage.setItem(sessKeyBase, JSON.stringify(chosen));
    sessionStorage.setItem(`${sessKeyBase}_index`, "0");
    sessionStorage.setItem(`${sessKeyBase}_score`, "0");
    setSessionQuestions(chosen);
    setQIndex(0);
    setScore(0);
    setTimeLeft(levelConfig?.timePerQuestion ?? 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerLevel, username]);

  // Timer effect
  useEffect(() => {
    if (!sessionQuestions.length) return;
    if (showFeedback || showSummary) return;
    if (timeLeft <= 0) {
      submitAnswer(null, true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, showFeedback, showSummary, qIndex, sessionQuestions.length]);

  // submitAnswer
  const submitAnswer = (option: string | null, timedOut = false) => {
    if (!sessionQuestions.length) return;
    if (showFeedback) return;

    const current = sessionQuestions[qIndex];
    const isCorrect = option !== null && option === current.answer;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
    setSelected(option);

    if (isCorrect) setFeedbackText("✅ Correct — nice one!");
    else if (timedOut) setFeedbackText(`⏰ Time’s up — correct: ${current.answer}`);
    else setFeedbackText(`❌ Wrong — correct: ${current.answer}`);

    setShowFeedback(true);

    // persist
    const sessKeyBase = `bna_session_${username ?? "anon"}_level_${playerLevel}`;
    sessionStorage.setItem(`${sessKeyBase}_index`, String(qIndex));
    sessionStorage.setItem(`${sessKeyBase}_score`, String(newScore));

    setTimeout(() => {
      setShowFeedback(false);
      setSelected(null);
      const next = qIndex + 1;

      if (next < sessionQuestions.length) {
        setQIndex(next);
        sessionStorage.setItem(`${sessKeyBase}_index`, String(next));
        setTimeLeft(levelConfig.timePerQuestion);
      } else {
        // finished level
        const total = sessionQuestions.length;
        const percent = (newScore / total) * 100;
        const didPass = percent >= levelConfig.passMark;
        setPassed(didPass);
        setShowSummary(true);

        if (didPass) {
          // show confetti and record leaderboard entry
          setConfettiActive(true);
          setTimeout(() => setConfettiActive(false), 1600);

          if (username) {
            pushToLocalLeaderboard(username, levelConfig.title, newScore, total);
            postToServerLeaderboard({ username, level: levelConfig.title, score: newScore, total }).catch(() => {});
            // advance locally
            const progressKey = `bna_progress_${username}`;
            localStorage.setItem(progressKey, JSON.stringify({ levelIndex: Math.min(playerLevel + 1, LEVELS.length - 1) }));
          }
        }
      }
    }, 1400);
  };

  // retry level (reshuffle)
  const retryLevel = () => {
    if (!username) return;
    const sessKeyBase = `bna_session_${username}_level_${playerLevel}`;
    const chosen = pickRandom(levelConfig.pool, levelConfig.perSession);
    sessionStorage.setItem(sessKeyBase, JSON.stringify(chosen));
    sessionStorage.setItem(`${sessKeyBase}_index`, "0");
    sessionStorage.setItem(`${sessKeyBase}_score`, "0");
    setSessionQuestions(chosen);
    setQIndex(0);
    setScore(0);
    setShowSummary(false);
    setPassed(false);
    setTimeLeft(levelConfig.timePerQuestion);
  };

  // proceed to next level
  const proceed = () => {
    const next = Math.min(playerLevel + 1, LEVELS.length - 1);
    setPlayerLevel(next);
    setShowSummary(false);
    setPassed(false);
    setSessionQuestions([]); // effect will rebuild
  };

  // go home
  const goHome = () => router.push("/home");

  if (!username) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#071019] rounded-2xl p-6 text-center">Loading session...</div>
      </main>
    );
  }

  // summary screen
  if (showSummary) {
    const total = sessionQuestions.length || levelConfig.perSession;
    const percent = Math.round((score / Math.max(1, total)) * 100);
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <FramerMotionConfetti active={confettiActive} />
        <div className="max-w-lg w-full bg-[#071019] rounded-2xl border border-white/6 p-8 text-center shadow-lg">
          <h2 className={`text-2xl font-bold mb-3 ${passed ? "text-[#00FFFF]" : "text-red-400"}`}>
            {passed ? "Level Cleared 🎉" : "Almost there"}
          </h2>
          <p className="mb-4">You scored <span className="text-[#FFD700] font-bold">{score}</span> / {total} ({percent}%)</p>

          {!passed ? (
            <>
              <p className="text-white/70 mb-6">You’ve done your part, but you can do better 💪</p>

              <div className="flex flex-col items-center gap-3">
                <a href="https://billions.network/" target="_blank" rel="noreferrer" className="w-full text-center px-5 py-3 bg-[#FFD700] text-black rounded-lg font-semibold hover:bg-yellow-400 transition">
                  📘 Read Docs
                </a>

                <button onClick={retryLevel} className="w-full px-5 py-3 border border-white/10 rounded-lg hover:bg-white/6 transition">
                  🔁 Retry Level
                </button>

                <button onClick={goHome} className="mt-3 text-xs text-white/50">← Back to Home</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-white/70 mb-6">Nice job! You're ready for the next challenge.</p>
              {playerLevel + 1 < LEVELS.length ? (
                <button onClick={proceed} className="w-full px-5 py-3 bg-[#00FFFF] text-black rounded-lg font-semibold hover:opacity-95">
                  Proceed to {LEVELS[playerLevel + 1].title}
                </button>
              ) : (
                <p className="text-[#FFD700] font-bold">You completed all levels — you're an OG!</p>
              )}

              <div className="mt-4">
                <a href="/leaderboard" className="text-sm text-[#00FFFF] underline">View Leaderboard</a>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  const current = sessionQuestions[qIndex];
  if (!current) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#071019] rounded-2xl p-6 text-center">Preparing questions...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-[#071019] rounded-2xl border border-white/6 p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <button onClick={goHome} className="text-xs text-white/60 hover:text-[#00FFFF]">← Back to Home</button>
          <div className="text-sm text-white/60">Level {playerLevel + 1}: <span className="text-[#FFD700]">{levelConfig.title}</span></div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-white/70">Question {qIndex + 1} / {sessionQuestions.length}</div>
          <div className="text-sm text-[#00FFFF] font-semibold">⏱ {timeLeft}s</div>
        </div>

        <h3 className="text-xl font-bold mb-6 text-center">{current.question}</h3>

        <div className="grid gap-3">
          {current.options.map((opt, idx) => {
            const isCorrect = showFeedback && opt === current.answer;
            const isSelectedWrong = showFeedback && selected === opt && opt !== current.answer;

            let cls = "bg-white/6 hover:bg-white/10 text-left px-4 py-3 rounded-xl transition flex justify-between items-center";
            if (isCorrect) cls = "bg-green-600/60 text-white px-4 py-3 rounded-xl flex justify-between items-center";
            if (isSelectedWrong) cls = "bg-red-600/60 text-white px-4 py-3 rounded-xl flex justify-between items-center";

            return (
              <button
                key={idx}
                disabled={showFeedback}
                onClick={() => submitAnswer(opt)}
                className={cls}
              >
                <span>{opt}</span>
                {showFeedback && (isCorrect ? <span className="text-white">✓</span> : isSelectedWrong ? <span className="text-white">✕</span> : null)}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`mt-5 p-3 rounded-lg text-center ${feedbackText.startsWith("✅") ? "bg-[#003322]/60 text-[#00FFBB]" : "bg-[#330000]/60 text-[#FFB2B2]"}`}>
            {feedbackText}
          </div>
        )}
      </div>
    </main>
  );
}
