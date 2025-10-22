// src/app/quiz/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LEVELS, Question, LevelPool } from "@/lib/questions";
import { saveProgress, addLeaderboardPoints, getOrCreateUser } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import logo1 from "@/public/logos/billions_logo1.png";
import logo2 from "@/public/logos/billions_logo2.png";
import logo3 from "@/public/logos/billions_logo3.png";
import logo4 from "@/public/logos/billions_logo4.png";
import logo5 from "@/public/logos/billions_logo5.png";
import logo6 from "@/public/logos/billions_logo6.png";
import cyphPfp from "@/public/logos/cyph.jpg";
import billionsPfp from "@/public/logos/billions_logo7.png";

// -----------------
// Floating Logo
// -----------------
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
  const rotateEnd = Math.random() * 360;

  return (
    <motion.img
      src={src}
      alt="Billions Logo"
      className="absolute"
      style={{ width: size, height: size, top: yStart, left: xStart, opacity: 0.3 }}
      animate={{ x: [0, xEnd], y: [0, yEnd], rotate: [0, rotateEnd] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    />
  );
}

// -----------------
// Floating Logos Container
// -----------------
function FloatingLogosContainer() {
  const logos = [logo1.src, logo2.src, logo3.src, logo4.src, logo5.src, logo6.src];

  const [positions] = useState(() =>
    logos.map(() => ({
      size: 40 + Math.random() * 60,
      xStart: Math.random() * 1000,
      yStart: Math.random() * 600,
      duration: 8 + Math.random() * 8,
      xEnd: Math.random() * 200 - 100,
      yEnd: Math.random() * 200 - 100,
      rotateEnd: Math.random() * 360,
    }))
  );

  return (
    <>
      {positions.map((p, i) => (
        <motion.img
          key={i}
          src={logos[i]}
          alt="Billions Logo"
          className="absolute"
          style={{ width: p.size, height: p.size, top: p.yStart, left: p.xStart, opacity: 0.3 }}
          animate={{ x: p.xEnd, y: p.yEnd, rotate: p.rotateEnd }}
          transition={{ duration: p.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      ))}
    </>
  );
}



// -----------------
// QuestionBox.tsx
function QuestionBox({ children, questionId }: { children: React.ReactNode; questionId: number }) {
  const logos = [logo1.src, logo2.src, logo3.src, logo4.src, logo5.src, logo6.src];
  const [bgLogo, setBgLogo] = useState<string>(logos[0]);

  useEffect(() => {
    // Only pick a new logo when questionId changes
    const chosen = logos[Math.floor(Math.random() * logos.length)];
    setBgLogo(chosen);
  }, [questionId]);

  return (
    <div className="relative max-w-2xl w-full rounded-2xl p-6 border border-white/6 shadow-xl bg-[#071019] overflow-hidden">
      <img src={bgLogo} alt="" className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}


// -----------------
// Confetti
// -----------------
function Confetti({ active }: { active: boolean }) {
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    if (!active) return;
    let count = 0;
    const interval = setInterval(() => {
      setBursts((b) => [...b, count]);
      count++;
      if (count >= 5) clearInterval(interval); // more bursts for bigger effect
    }, 200);
    return () => clearInterval(interval);
  }, [active]);

  const renderPieces = (burstId: number) =>
    Array.from({ length: 40 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 300; // spread farther
      const delay = Math.random() * 0.25;
      const colorPool = ["#FFD700", "#00FFFF", "#7AF3FF", "#00FF99", "#BBD8FF", "#FF69B4", "#FF4500"];
      return { id: `${burstId}-${i}`, angle, dist, delay, color: colorPool[i % colorPool.length] };
    });

  return (
    <AnimatePresence>
      {active &&
        bursts.map((b) => (
          <div key={b} className="pointer-events-none fixed inset-0 z-50 overflow-visible">
            {renderPieces(b).map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 0, x: 0, rotate: 0, scale: 0.8 }}
                animate={{
                  opacity: [1, 0.9, 0],
                  x: Math.cos(p.angle) * p.dist,
                  y: Math.sin(p.angle) * p.dist,
                  rotate: (Math.random() - 0.5) * 1080,
                  scale: [1, 0.8, 0.5],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, delay: p.delay, ease: "easeOut" }}
                style={{
                  background: p.color,
                  width: 12 + (p.id.length % 4) * 6,
                  height: 6 + (p.id.length % 3) * 6,
                  borderRadius: 3,
                  boxShadow: `${p.color}99 0 8px 20px`,
                  position: "absolute",
                  left: "50%",
                  top: "50%", // start from center of the screen
                }}
              />
            ))}
          </div>
        ))}
    </AnimatePresence>
  );
}


// -----------------
// Utilities
// -----------------
function pickRandom<T>(arr: T[], n: number) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function pointsForLevel(levelIndex: number, correctCount: number) {
  if (levelIndex === 0) return correctCount * 2;
  if (levelIndex === 1) return correctCount * 5;
  return correctCount;
}

// -----------------
// Main Quiz Page
// -----------------
export default function QuizPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [playerLevel, setPlayerLevel] = useState<number>(0);
  const [sessionQs, setSessionQs] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [showIntro, setShowIntro] = useState(true);
  const [showSummary, setShowSummary] = useState(false);
  const [passed, setPassed] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [completedAll, setCompletedAll] = useState(false);

  // Feedback text
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");

  const levelConfig = useMemo<LevelPool>(() => LEVELS[playerLevel], [playerLevel]);

  // --- Load user ---
  useEffect(() => {
    const u = localStorage.getItem("bna_username");
    const uid = localStorage.getItem("bna_user_id");
    if (!u) return router.push("/login");
    setUsername(u);
    setUserId(uid || null);

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
      localStorage.setItem(progressKey, JSON.stringify({ levelIndex: 0, points: 0 }));
      setPlayerLevel(0);
    }
  }, [router]);

  // --- Load session questions ---
  useEffect(() => {
    if (!username) return;
    const sessKey = `bna_session_${username}_level_${playerLevel}`;
    const stored = sessionStorage.getItem(sessKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Question[];
        if (parsed.length) {
          setSessionQs(parsed);
          setQIndex(parseInt(sessionStorage.getItem(`${sessKey}_index`) || "0", 10) || 0);
          setCorrectCount(parseInt(sessionStorage.getItem(`${sessKey}_correct`) || "0", 10) || 0);
          setTimeLeft(levelConfig.timePerQuestion);
          return;
        }
      } catch {}
    }
    const chosen = pickRandom(levelConfig.pool, levelConfig.perSession);
    sessionStorage.setItem(sessKey, JSON.stringify(chosen));
    sessionStorage.setItem(`${sessKey}_index`, "0");
    sessionStorage.setItem(`${sessKey}_correct`, "0");
    setSessionQs(chosen);
    setQIndex(0);
    setCorrectCount(0);
    setTimeLeft(levelConfig.timePerQuestion);
  }, [playerLevel, username, levelConfig]);

  // --- Timer ---
  useEffect(() => {
    if (!sessionQs.length || showFeedback || showSummary || showIntro) return;
    if (qIndex >= sessionQs.length) return;
    if (timeLeft <= 0) {
      handleSubmit(null, true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, showFeedback, showSummary, showIntro, qIndex, sessionQs.length]);

  // --- Handle answer ---
  const handleSubmit = async (option: string | null, timedOut = false) => {
    if (!sessionQs.length || showFeedback) return;
    const curr = sessionQs[qIndex];
    const isCorrect = option !== null && option === curr.answer;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    setCorrectCount(newCorrect);
    setSelected(option);

    if (isCorrect) setFeedbackText("✅ Correct — nice one!");
    else if (timedOut) setFeedbackText(`⏰ Time's up — correct: ${curr.answer}`);
    else setFeedbackText(`❌ Wrong — correct: ${curr.answer}`);

    setShowFeedback(true);

    const sessKey = `bna_session_${username}_level_${playerLevel}`;
    sessionStorage.setItem(`${sessKey}_index`, String(qIndex));
    sessionStorage.setItem(`${sessKey}_correct`, String(newCorrect));

    setTimeout(async () => {
      setShowFeedback(false);
      setSelected(null);

      const next = qIndex + 1;
      if (next < sessionQs.length) {
        setQIndex(next);
        sessionStorage.setItem(`${sessKey}_index`, String(next));
        setTimeLeft(levelConfig.timePerQuestion);
      } else {
        // Level end
        sessionStorage.setItem(`${sessKey}_index`, String(sessionQs.length));
        const total = sessionQs.length;
        const percent = (newCorrect / total) * 100;
        const didPass = percent >= levelConfig.passMark;
        setPassed(didPass);
        setShowSummary(true);

        const pointsEarned = pointsForLevel(playerLevel, newCorrect);

        try {
          let uid = userId ?? localStorage.getItem("bna_user_id");
          if (!uid && username) {
            const created = await getOrCreateUser(username);
            if (created?.id) {
              localStorage.setItem("bna_user_id", created.id);
              setUserId(created.id);
              uid = created.id;
            }
          }
          if (uid) {
            await saveProgress({ user_id: uid, level: playerLevel, score: newCorrect, passed: didPass, current_question: next });
            if (didPass) {
              await addLeaderboardPoints({ user_id: uid, points: pointsEarned, level: playerLevel });
              setConfettiActive(true);
              setTimeout(() => setConfettiActive(false), 1600);
            }
          }
        } catch (err) { console.warn("Supabase save failed", err); }

        if (username) {
          const progKey = `bna_progress_${username}`;
          const raw = localStorage.getItem(progKey);
          let existing = { levelIndex: playerLevel, points: 0 };
          if (raw) {
            try { existing = JSON.parse(raw); } catch {}
          }
          existing.points = (existing.points || 0) + pointsEarned;
          existing.levelIndex = didPass ? Math.min(playerLevel + 1, LEVELS.length - 1) : playerLevel;
          localStorage.setItem(progKey, JSON.stringify(existing));

          if (playerLevel + 1 >= LEVELS.length && didPass) setCompletedAll(true);
        }
      }
    }, 1400);
  };

  // --- Start/Retry/Next ---
  const startLevel = () => {
    if (!username) return;
    const sessKey = `bna_session_${username}_level_${playerLevel}`;
    const chosen = pickRandom(levelConfig.pool, levelConfig.perSession);
    sessionStorage.setItem(sessKey, JSON.stringify(chosen));
    sessionStorage.setItem(`${sessKey}_index`, "0");
    sessionStorage.setItem(`${sessKey}_correct`, "0");
    setSessionQs(chosen);
    setQIndex(0);
    setCorrectCount(0);
    setShowIntro(false);
    setShowSummary(false);
    setPassed(false);
    setTimeLeft(levelConfig.timePerQuestion);
  };
  const retryLevel = () => startLevel();
  const proceedAfterPass = () => {
    const progKey = `bna_progress_${username}`;
    const raw = localStorage.getItem(progKey);
    let nextIndex = playerLevel;
    if (raw) { try { const parsed = JSON.parse(raw); nextIndex = parsed.levelIndex ?? playerLevel; } catch {} }
    setPlayerLevel(nextIndex);
    setShowIntro(true);
    setShowSummary(false);
    setPassed(false);
    setCompletedAll(false);
    setSessionQs([]);
  };
  const restartAll = async () => {
    if (userId) { try { await fetch("/api/reset_user", { method: "POST", body: JSON.stringify({ user_id: userId }) }); } catch {} }
    if (username) localStorage.setItem(`bna_progress_${username}`, JSON.stringify({ levelIndex: 0, points: 0 }));
    for (let i = 0; i < LEVELS.length; i++) {
      sessionStorage.removeItem(`bna_session_${username}_level_${i}`);
      sessionStorage.removeItem(`bna_session_${username}_level_${i}_index`);
      sessionStorage.removeItem(`bna_session_${username}_level_${i}_correct`);
    }
    setPlayerLevel(0);
    router.push("/home");
  };
  const goHome = () => router.push("/home");

  // -----------------
  // RENDER
  // -----------------
  if (showIntro) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center relative">
        <FloatingLogosContainer />
        <div className="max-w-2xl w-full bg-[#071019] rounded-2xl p-8 border border-white/6 shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#FFD700" }}>{LEVELS[playerLevel].title}</h2>
          <p className="text-sm text-white/70 mb-2">This level has {levelConfig.perSession} beginner friendly questions.</p>
          <p className="text-sm text-white/70 mb-6">Need at least {levelConfig.passMark}% to advance. You have {levelConfig.timePerQuestion}s per question.</p>
          <button onClick={startLevel} className="px-6 py-3 bg-[#00FFFF] text-black rounded-xl font-bold">Start Level</button>
          <div className="mt-6">
            <button onClick={goHome} className="text-xs text-white/50 underline">← Back to Home</button>
          </div>
        </div>
      </main>
    );
  }

  // --------- Render Summary ---------
if (showSummary) {
  const total = sessionQs.length;
  const percent = Math.round((correctCount / Math.max(1, total)) * 100);
  const pointsEarned = pointsForLevel(playerLevel, correctCount);
  const shareText = encodeURIComponent(
    passed
      ? `🏆 I just passed @billions_ntwk ${LEVELS[playerLevel].title} quiz! Scored ${percent}% and earned ${pointsEarned} points! Try it now!`
      : `❌ I attempted @billions_ntwk ${LEVELS[playerLevel].title} quiz and scored ${percent}%. Can you do better?`
  );
  const shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center relative">
      <FloatingLogosContainer />
      <Confetti active={confettiActive} />
      <div className="max-w-lg w-full bg-[#071019] rounded-2xl p-8 text-center border border-white/10 shadow-xl">
        <h2 className="text-2xl font-bold text-[#FFD700] mb-3">
          {completedAll
            ? "🏆 You completed all levels — you're an OG!"
            : passed
            ? "✅ Level Passed!"
            : "❌ Level Failed"}
        </h2>
        <p className="text-white/80 mb-2">Score: {percent}%</p>
        <p className="text-white/80 mb-2">Points Earned: {pointsEarned}</p>

        {/* ⭐ Only show stars & feedback for Level 2 */}
        {playerLevel === 1 && (
          <>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl transition ${n <= rating ? "text-[#FFD700]" : "text-white/50"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              placeholder="Share feedback (optional)"
              className="w-full p-3 text-sm text-black placeholder-gray-500 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#FFD700] bg-white"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </>
        )}
            {playerLevel === 1 && ( // only show feedback submit for Level 2
                <button
                    onClick={() => {
                    console.log("Feedback submitted:", feedback, "Rating:", rating);
                // Optional: send feedback to backend here

                // Clear feedback and rating
                    setFeedback("");
                    setRating(0);
            }}
                    className="w-full px-5 py-3 bg-[#00FFFF] text-black rounded-lg font-semibold hover:bg-[#7AF3FF] transition mb-4"
                    >
                     💬 Submit Feedback
                </button>

        )}

        <div className="flex flex-col gap-3 mb-6">
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full px-5 py-3 bg-[#00FFFF] text-black rounded-lg font-semibold hover:bg-[#7AF3FF] transition"
          >
            📤 Share on X
          </a>
          
          {!completedAll && passed && (
                <button
                    onClick={proceedAfterPass}
                    className="w-full px-5 py-3 bg-[#FFD700] text-black rounded-lg font-semibold hover:bg-yellow-400 transition"
  >
                    ➡ Next Level
                </button>
            )}

          {!passed && playerLevel !== 0 && (
            <button
              onClick={retryLevel}
              className="w-full px-5 py-3 bg-[#FFD700] text-black rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              🔁 Retry Level
            </button>
          )}
          <button
            onClick={restartAll}
            className="w-full px-5 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition"
          >
            ← Back to Home
          </button>
        </div>

        {/* Footer X handles */}
{completedAll && (
  <>
    <div className="mt-6 border-t border-white/20 pt-4 flex justify-center gap-6">
      <a href="https://twitter.com/0x_cyph" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:opacity-80 transition">
        <img src={cyphPfp.src} alt="Your PFP" className="w-10 h-10 rounded-full border-2 border-[#00FFFF]" />
        <span className="text-white/80">@0x_cyph</span>
      </a>
      <a href="https://twitter.com/billions_ntwk" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:opacity-80 transition">
        <img src={billionsPfp.src} alt="Billions PFP" className="w-10 h-10 rounded-full border-2 border-[#FFD700]" />
        <span className="text-white/80">@billions_ntwk</span>
      </a>
    </div>

    {/* More levels message below the handles */}
    {playerLevel === 1 && (
      <p className="mt-2 text-xs text-white/50 text-center">
        More levels will be added and shared by the builder on X.
      </p>
    )}
  </>

             )}
             
        </div>

      </main>
    );
  }

  // --------- Render Quiz ---------
  const current = sessionQs[qIndex];
  if (!current) return <div>Preparing questions...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center relative">
      <FloatingLogosContainer />

      <Confetti active={confettiActive} />

      <QuestionBox questionId={qIndex}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={goHome} className="text-xs text-white/60 hover:text-[#00FFFF]">← Back to Home</button>
          <div className="text-sm text-white/60">Level {playerLevel + 1}: <span className="text-[#FFD700]">{levelConfig.title}</span></div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-white/70">Question {qIndex + 1} / {sessionQs.length}</div>
          <div className="text-sm text-[#00FFFF] font-semibold">⏱ {timeLeft}s</div>
        </div>

        <h3 className="text-xl font-bold mb-6 text-center">{current.question}</h3>

        <div className="grid gap-3">
          {current.options.map((opt, i) => {
            const isCorrect = showFeedback && opt === current.answer;
            const isSelectedWrong = showFeedback && selected === opt && opt !== current.answer;
            let cls = "bg-white/6 hover:bg-white/10 text-left px-4 py-3 rounded-xl transition flex justify-between items-center";
            if (isCorrect) cls = "bg-green-600/60 text-white px-4 py-3 rounded-xl flex justify-between items-center";
            if (isSelectedWrong) cls = "bg-red-600/60 text-white px-4 py-3 rounded-xl flex justify-between items-center";

            return (
              <button key={i} disabled={showFeedback} onClick={() => handleSubmit(opt)} className={cls}>
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
      </QuestionBox>
    </main>
  );
}
