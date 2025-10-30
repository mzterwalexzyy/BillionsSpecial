"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
// Assuming these are correct paths in your setup
import { LEVELS, Question, LevelPool } from "@/lib/questions"; 
import { saveProgress, addLeaderboardPoints, getOrCreateUser } from "@/lib/api"; 
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image"; // Added for safety if we use the component later


// --- Import Images ---
// Using .src is necessary since these are Next.js image imports outside of the Image component
import logo1 from "@/public/logos/billions_logo1.png";
import logo2 from "@/public/logos/billions_logo2.png";
import logo3 from "@/public/logos/billions_logo3.png";
import logo4 from "@/public/logos/billions_logo4.png";
import logo5 from "@/public/logos/billions_logo5.png";
import logo6 from "@/public/logos/billions_logo6.png";
import cyphPfp from "@/public/logos/cyph.jpg";
import billionsPfp from "@/public/logos/billions_logo7.png";

type TeamMember = {
  name: string;
  handle: string;
  role: string;
  pfp?: string; // path to public image or url
};

const BILLIONS_TEAM: TeamMember[] = [
  { name: "David Z", handle: "@davidsrz", role: "Co-founder at Billions Network, Privado ID, and Polygon Labs", pfp: "/team/davidz.png" },
  { name: "Ravidilse.eth (Ravi Agrawal)", handle: "@ravikantagrawal", role: "Director of Growth and AI Partnerships at Billions Network", pfp: "/team/ravi.png" },
  { name: "Laura Rodriguez 🌴", handle: "@TheMiamiApe", role: "Marketing LATAM/US and Host; former BAYC Council Member", pfp: "/team/laura.png" },
  { name: "Javi🥥.eth", handle: "@jgonzalezferrer", role: "Head of Community; founder of Cocobayworld", pfp: "/team/javi.png" },
  { name: "OttoMorac.eth", handle: "@ottomorac", role: "ZK Identity Maxi at Privado ID and Billions Network", pfp: "/team/otto.png" },
  { name: "Oleksandr Brezhniev", handle: "@OBrezhniev", role: "CTO at Billions Network / Privado ID; ZK & SSI expert", pfp: "/team/oleksandr.png" },
  { name: "Evin", handle: "@provenauthority", role: "Co-founder of Billions Network & Privado ID; founded Disco.xyz", pfp: "/team/evin.png" },
  { name: "Joanna ❤️‍🔥 ", handle: "@kryptojogi", role: "Business Development (BD) at Billions Network / Privado ID", pfp: "/team/joanna.png" },
  { name: "AlexDigital.eth", handle: "@0xAlexDigital", role: "Chief Marketing Officer (CMO) at Billions Network", pfp: "/team/alex.png" },
  { name: "Ron", handle: "@onchainron", role: "Marketing Lead at Billions Network", pfp: "/team/ron.png" },
];

const LAST_LEVEL_INDEX = LEVELS.length - 1;

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

/** pointsForLevel: Level 1 = 3pts, Level 2 = 5pts, Level 3 (index 2) = 10pts */
function pointsForLevel(levelIndex: number, correctCount: number) {
  // Use a simple exponential model for points based on levelIndex
  // Level 0: 3x, Level 1: 5x, Level 2: 10x
  const multiplier = Math.pow(2, levelIndex) + 2 + (levelIndex * 2);
  return correctCount * multiplier;
}

// -----------------
// Floating Logo
// -----------------
function FloatingLogosContainer() {
const logos = useMemo(() => [logo1.src, logo2.src, logo3.src, logo4.src, logo5.src, logo6.src], []);
  const [positions, setPositions] = useState<{ size: number; xStart: number; yStart: number; duration: number; xEnd: number; yEnd: number; rotateEnd: number }[] | null>(null);

  useEffect(() => {
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
  }, [logos]);

  if (!positions) return null; // don't render anything on the server

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((p, i) => (
        <motion.img
          key={i}
          src={logos[i]}
          alt="Billions Logo"
          className="absolute"
          style={{ width: p.size, height: p.size, top: p.yStart, left: p.xStart, opacity: 0.2 }}
          animate={{ x: [0, p.xEnd, 0], y: [0, p.yEnd, 0], rotate: [0, p.rotateEnd, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, repeatType: "loop", ease: "linear" }}
        />
      ))}
    </div>
  );
}


// -----------------
// QuestionBox
// -----------------
function QuestionBox({ children, questionId }: { children: React.ReactNode; questionId: number }) {
  const logos = [logo1.src, logo2.src, logo3.src, logo4.src, logo5.src, logo6.src];
  const [bgLogo, setBgLogo] = useState<string>(logos[0]);

  useEffect(() => {
    // Select a random logo based on the question ID to ensure it changes on new question
    const chosen = logos[Math.floor(Math.random() * logos.length)];
    setBgLogo(chosen);
  }, [questionId]);

  return (
    <div className="relative max-w-2xl w-full rounded-2xl p-6 border border-white/6 shadow-xl bg-[#071019] overflow-hidden">
      {/* Background Logo for Question Box */}
      <img src={bgLogo} alt="" className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// -----------------
// Timer Progress Bar (NEW)
// -----------------
// FIX: Changed 'key' prop to 'resetKey' to avoid React special prop warning
function TimerProgressBar({ duration, resetKey }: { duration: number, resetKey: string }) {
    return (
        <div className="w-full bg-white/10 rounded-full h-2.5 mb-4 overflow-hidden">
            <motion.div
                key={resetKey} // Key ensures the animation restarts on prop change (new question)
                className="h-2.5 rounded-full bg-[#FFD700]"
                initial={{ scaleX: 1, originX: 0 }} // Start full width
                animate={{ scaleX: 0, originX: 0 }} // Shrink to zero
                transition={{ duration: duration, ease: "linear" }}
            />
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
      if (count >= 5) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [active]);

  const renderPieces = (burstId: number) =>
    Array.from({ length: 40 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 300;
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
                  top: "50%",
                }}
              />
            ))}
          </div>
        ))}
    </AnimatePresence>
  );
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

  // Level 3 Feedback states
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [sending, setSending] = useState(false);
  // State for showing in-page feedback/error messages on the summary screen
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Team view state
  const [showTeamPage, setShowTeamPage] = useState(false);
  // Key to force timer bar animation restart
  const [timerKey, setTimerKey] = useState(0); 

  const levelConfig = useMemo<LevelPool>(() => LEVELS[playerLevel] || LEVELS[0], [playerLevel]);

  // --- Load user ---
  useEffect(() => {
    const u = localStorage.getItem("bna_username");
    const uid = localStorage.getItem("bna_user_id");
    
    // Fallback: If no username, redirect to login
    if (!u) {
      router.push("/login");
      return;
    }
    
    setUsername(u);
    setUserId(uid || null);

    // Load level and points from local storage
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
          setTimerKey(t => t + 1); // Reset timer bar
          return;
        }
      } catch {}
    }
    
    // Pick new set of questions
    const chosen = pickRandom(levelConfig.pool, levelConfig.perSession);
    sessionStorage.setItem(sessKey, JSON.stringify(chosen));
    sessionStorage.setItem(`${sessKey}_index`, "0");
    sessionStorage.setItem(`${sessKey}_correct`, "0");
    setSessionQs(chosen);
    setQIndex(0);
    setCorrectCount(0);
    setTimeLeft(levelConfig.timePerQuestion);
    setTimerKey(t => t + 1); // Reset timer bar
  }, [playerLevel, username, levelConfig]);


  
  // --- Handle answer or timeout submission (Made into a useCallback for stability) ---
  const handleSubmit = useCallback(async (option: string | null, timedOut = false) => {
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
        // Move to next question
        setQIndex(next);
        sessionStorage.setItem(`${sessKey}_index`, String(next));
        setTimeLeft(levelConfig.timePerQuestion);
        setTimerKey(t => t + 1); // Reset timer bar
      } else {
        // Level end
        sessionStorage.setItem(`${sessKey}_index`, String(sessionQs.length));
        const total = sessionQs.length;
        const percent = (newCorrect / total) * 100;
        const didPass = percent >= levelConfig.passMark;
        setPassed(didPass);
        setShowSummary(true);
        setFeedbackMessage(null); // Clear previous feedback message

                    const pointsEarned = pointsForLevel(playerLevel, newCorrect);

            // --- API & Progress Save Logic ---
            try {
              let currentUserId = userId ?? localStorage.getItem("bna_user_id");
              if (!currentUserId && username) {
                const created = await getOrCreateUser(username);
                if (created?.id) {
                  localStorage.setItem("bna_user_id", created.id);
                  setUserId(created.id);
                  currentUserId = created.id;
                }
              }
              
              if (currentUserId) {
                const nextQuestionIndex = sessionQs.length; // Final state
                
                // 1. Save Session Progress
                await saveProgress({ 
                  user_id: currentUserId, 
                  level: playerLevel, 
                  score: newCorrect, 
                  passed: didPass, 
                  current_question: nextQuestionIndex 
                });
                
                // 2. Add Leaderboard Points (via secure API)
                if (didPass) {
                  // Determine the next level to update
                  const levelToUpdate = playerLevel < LAST_LEVEL_INDEX ? playerLevel + 1 : playerLevel;

                  // Call your secure /api/leaderboard endpoint
                  await fetch("/api/leaderboard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      user_id: currentUserId,
                      points: pointsEarned,
                      level: levelToUpdate,
                    }),
                  });

                  setConfettiActive(true);
                  setTimeout(() => setConfettiActive(false), 2000); 
                }
              }
            } catch (err) { 
              console.warn("Supabase save failed", err); 
            }

        // --- Local Storage Progress Update (for UI state) ---
        if (username) {
          const progKey = `bna_progress_${username}`;
          const raw = localStorage.getItem(progKey);
          let existing = { levelIndex: playerLevel, points: 0 };
          if (raw) { try { existing = JSON.parse(raw); } catch {} }
          
          existing.points = (existing.points || 0) + pointsEarned;
          
          // Only advance level if passed AND it's not the last level
          if (didPass && playerLevel < LAST_LEVEL_INDEX) {
              existing.levelIndex = playerLevel + 1;
          }

          localStorage.setItem(progKey, JSON.stringify(existing));

          if (playerLevel === LAST_LEVEL_INDEX && didPass) {
              setCompletedAll(true);
          }
        }
      }
    }, 1400); // Delay before next question/summary
  }, [sessionQs, qIndex, correctCount, username, playerLevel, levelConfig, userId, LAST_LEVEL_INDEX]);
// --- Timer Tick ---
  useEffect(() => {
    if (!sessionQs.length || showFeedback || showSummary || showIntro) return;
    if (qIndex >= sessionQs.length) return;
    if (timeLeft <= 0) {
      // Auto-submit on timeout
      handleSubmit(null, true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, showFeedback, showSummary, showIntro, qIndex, sessionQs.length, handleSubmit]); // Added handleSubmit to dependencies
  
  // --- Level 3 Feedback Submission (NEW) ---
  const handleFeedbackSubmit = async () => {
    setFeedbackMessage(null); // Clear previous message
    if (!feedback && rating === 0) {
      setFeedbackMessage({ type: 'error', text: 'Please add some feedback or a rating before submitting!' });
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      // NOTE: This uses a mock API endpoint. Ensure /api/sendFeedback is implemented in your Next.js project.
      const res = await fetch("/api/sendFeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            username, 
            userId,
            rating, 
            feedback, 
            level: LEVELS[playerLevel].title 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: '✅ Feedback sent successfully! Thank you.' });
        setFeedback("");
        setRating(0);
      } else {
        setFeedbackMessage({ type: 'error', text: `❌ Failed to send feedback: ${data.error || "Unknown error"}` });
      }
    } catch (err) {
      console.error("Error sending feedback:", err);
      setFeedbackMessage({ type: 'error', text: '⚠️ Network error — check your connection.' });
    } finally {
      setSending(false);
    }
  };

  // --- Navigation/State Reset Functions ---
  const startLevel = () => {
    if (!username) return;
    // Clears existing session storage for current level
    sessionStorage.removeItem(`bna_session_${username}_level_${playerLevel}`); 
    
    // Pick new questions and start
    const chosen = pickRandom(levelConfig.pool, levelConfig.perSession);
    sessionStorage.setItem(`bna_session_${username}_level_${playerLevel}`, JSON.stringify(chosen));
    sessionStorage.setItem(`bna_session_${username}_level_${playerLevel}_index`, "0");
    sessionStorage.setItem(`bna_session_${username}_level_${playerLevel}_correct`, "0");
    
    setSessionQs(chosen);
    setQIndex(0);
    setCorrectCount(0);
    setShowIntro(false);
    setShowSummary(false);
    setPassed(false);
    setCompletedAll(false);
    setTimeLeft(levelConfig.timePerQuestion);
    setTimerKey(t => t + 1); // Reset timer bar
  };
  
  const retryLevel = () => startLevel();

  const proceedAfterPass = () => {
    // Determine the next level index from local storage progress
    const progKey = `bna_progress_${username}`;
    const raw = localStorage.getItem(progKey);
    let nextIndex = playerLevel;
    if (raw) { try { const parsed = JSON.parse(raw); nextIndex = parsed.levelIndex ?? playerLevel; } catch {} }
    
    // Safety check to ensure we don't proceed past the max level
    const newLevel = Math.min(nextIndex, LAST_LEVEL_INDEX);

    setPlayerLevel(newLevel);
    setShowIntro(true);
    setShowSummary(false);
    setPassed(false);
    setCompletedAll(false);
    setSessionQs([]);
  };

  const restartAll = async () => {
    // API call to reset server-side progress (if implemented on server)
    if (userId) { 
      try { 
          await fetch("/api/reset_user", { 
              method: "POST", 
              body: JSON.stringify({ user_id: userId }) 
          }); 
      } catch (e) { 
          console.error("Failed to reset user on server", e); 
      } 
    }
    
    // Reset local storage progress
    if (username) localStorage.setItem(`bna_progress_${username}`, JSON.stringify({ levelIndex: 0, points: 0 }));
    
    // Clear all session storage quiz data
    for (let i = 0; i < LEVELS.length; i++) {
      sessionStorage.removeItem(`bna_session_${username}_level_${i}`);
      sessionStorage.removeItem(`bna_session_${username}_level_${i}_index`);
      sessionStorage.removeItem(`bna_session_${username}_level_${i}_correct`);
    }
    // New: Reset state to level 0 and show intro
    setPlayerLevel(0);
    setQIndex(0);
    setCorrectCount(0);
    setShowIntro(true);
    setShowSummary(false);
    setPassed(false);
    setCompletedAll(false);
    setSessionQs([]);
  }; // <--- CLOSES restartAll function

  const goHome = () => router.push("/");
  
  // ----------------- Conditional Rendering -----------------

  // --- Render Team Page ---
  if (showTeamPage) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center relative">
        <FloatingLogosContainer />
        <div className="max-w-4xl w-full rounded-2xl p-8 border border-white/6 shadow-xl bg-[#071019] relative z-10">
            <button onClick={() => setShowTeamPage(false)} className="absolute top-4 right-4 text-white/60 hover:text-[#00FFFF] text-sm">
                ← Back to Quiz
            </button>
            <h2 className="text-3xl font-extrabold text-[#FFD700] mb-6 text-center">Meet the Billions Network Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                {BILLIONS_TEAM.map((member) => (
                    <motion.div 
                        key={member.handle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[#00FFFF]">
                          <Image
                              src={member.pfp || billionsPfp.src}
                              alt={member.name}
                              width={80}
                              height={80}
                              className="object-cover"
                              unoptimized={true}
                          />
                        </div>
                        <h4 className="font-bold text-lg text-white">{member.name}</h4>
                        <p className="text-sm mb-1">
                          <a
                            href={`https://x.com/${member.handle.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#FFD700] hover:text-[#00FFFF] transition"
                          >
                            {member.handle}
                          </a>
                        </p>
                        <p className="text-xs text-white/70">{member.role}</p>
                    </motion.div>
                ))}
            </div>
            <div className="mt-8 text-center">
                <p className="text-white/60 text-sm">Follow Billions Network:</p>
                <a href="https://x.com/billions_ntwk" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-[#00FFFF] hover:text-[#FFD700] transition">
                    @billions_ntwk
                </a>
            </div>
        </div>
      </main>
    );
  }

  // --- Render Intro Page ---
  if (showIntro) {
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center relative">
        <FloatingLogosContainer />
        <QuestionBox questionId={-1}>
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-[#FFD700] mb-2">Level {playerLevel + 1}: {levelConfig.title}</h2>
            <p className="text-white/70 mb-6 max-w-sm mx-auto">{levelConfig.description}</p>
            
            <div className="space-y-2 mb-6 p-4 bg-white/5 rounded-xl text-center">
                <p className="text-sm">📝 <strong>Questions:</strong> {levelConfig.perSession}</p>
                <p className="text-sm">⏱ <strong>Time/Q:</strong> {levelConfig.timePerQuestion} seconds</p>
                <p className="text-sm">✅ <strong>Pass Mark:</strong> {levelConfig.passMark}% correct</p>
            </div>


            <button
              onClick={startLevel}
              className="w-full bg-[#00FFFF] text-black font-bold py-3 rounded-xl hover:bg-[#FFD700] transition duration-300 shadow-lg shadow-[#00FFFF]/30"
            >
              Start Level {playerLevel + 1}
            </button>

            <div className="mt-6 flex flex-col items-center space-y-3">
              <button 
                onClick={goHome} 
                className="text-sm text-white/60 hover:text-[#FFD700] transition"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </QuestionBox>
      </main>
    );
  }

  // --- Render Summary Page ---
  if (showSummary) {
    const total = sessionQs.length;
    const percent = (correctCount / total) * 100;
    const pointsEarned = pointsForLevel(playerLevel, correctCount);
    const resultMessage = passed ? 
      (completedAll ? "You've mastered all levels! Congrats!" : "Level Passed! Great job.") : 
      "Level Failed. You can retry anytime.";
      
    const icon = passed ? (completedAll ? "🏆" : "✨") : "📚";
    const bgColor = passed ? "bg-[#00FF99]/10 border-[#00FF99]" : "bg-red-900/10 border-red-700";
    
    return (
      <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center relative">
        <FloatingLogosContainer />
        <Confetti active={confettiActive} />
        <QuestionBox questionId={-1}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className={`text-center p-6 rounded-2xl border ${bgColor} relative`}
          >
            <h2 className="text-5xl mb-4">{icon}</h2>
            <h3 className="text-3xl font-extrabold text-[#FFD700] mb-2">{resultMessage}</h3>
            <p className="text-white/70 mb-6">You answered <strong>{correctCount}</strong> out of <strong>{total}</strong> questions correctly.</p>

            <div className="flex justify-center space-x-8 mb-8">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-white/60">Score</p>
                <p className="text-2xl font-bold text-[#00FFFF]">{percent.toFixed(0)}%</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-white/60">Points Earned</p>
                <p className="text-2xl font-bold text-[#FFD700]">{pointsEarned}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              {passed && playerLevel < LAST_LEVEL_INDEX && (
                <button
                  onClick={proceedAfterPass}
                  className="w-full bg-[#00FFFF] text-black font-bold py-3 rounded-xl hover:bg-[#FFD700] transition duration-300 shadow-lg shadow-[#00FFFF]/30"
                >
                  Proceed to Level {playerLevel + 2}
                </button>
              )}
              {playerLevel === LAST_LEVEL_INDEX && passed && (
                <button 
                  onClick={() => setShowTeamPage(true)}
                  className="mt-4 w-full bg-[#00FFFF] text-black font-bold py-2 rounded-xl hover:bg-[#FFD700] transition duration-300"
                >
                  Meet the Team
                </button>
              )}

              {!passed && (
                <button
                  onClick={retryLevel}
                  className="w-full bg-[#FFD700] text-black font-bold py-3 rounded-xl hover:bg-[#00FFFF] transition duration-300 shadow-lg shadow-[#FFD700]/30"
                >
                  Retry Level {playerLevel + 1}
                </button>
              )}
              {/* 🌐 SHARE BUTTON */}
             
  <button
    onClick={() => {
      const score = pointsEarned;
      const shareText = passed
        ? `I just tried out the @billions_ntwk quiz and scored ${score} points! 🎯 You SHOULD TRY IT OUT with the link below 👇
            https://billions-special.vercel.app

            Don’t forget to share your score!!! 
            gBillions💙💙`
                    : `I just tried out the @billions_ntwk quiz and scored ${score} points 😅 If you can do better, try it out with the link below 👇
            https://billions-special.vercel.app/home

            Don’t forget to share your score!!! 
            gBillions💙💙`;

      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(shareUrl, "_blank");
    }}
    className="w-full bg-[#1DA1F2] text-white font-bold py-3 rounded-xl hover:bg-[#0d8ddb] transition duration-300 shadow-lg shadow-[#1DA1F2]/30"
  >
    Share Your Score 💙
  </button>
              <button 
                onClick={goHome} 
                className="w-full border border-white/20 text-white/80 font-semibold py-3 rounded-xl hover:bg-white/10 transition"
              >
                Back to Dashboard
              </button>
              
            </div>
            {completedAll && (
              <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <div className="text-sm text-white/50">
                <p className="mb-2">Follow builder for more updates:</p>
                <div className="flex justify-center items-center gap-4">
                  {/* Cyph handle */}
                  <a
                    href="https://x.com/0x_cyph"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-white/80 hover:text-[#00FFFF] transition"
                  >
                  <Image
                    src={cyphPfp.src}
                    alt="Cyph"
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                    unoptimized={true}
                  />
                  <span className="font-bold">@0x_cyph</span>
                </a>

                {/* Billions handle */}
                <a
                  href="https://x.com/billions_ntwk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/80 hover:text-[#00FFFF] transition"
                >
                  <Image
                    src={billionsPfp.src}
                    alt="Billions Network"
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                    unoptimized={true}
                            />
                  <span className="font-bold">@billions_ntwk</span>
                </a>
              </div>
            </div>
          </div>
            )}
          </motion.div>
        </QuestionBox>
      </main>
    );
  }

  // --------- Render Quiz ---------
  const current = sessionQs[qIndex];
  if (!current) return <div className="min-h-screen flex items-center justify-center">Preparing questions...</div>;

  const totalProgressPercentage = (qIndex / sessionQs.length) * 100;

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center relative">
      <FloatingLogosContainer />
      <Confetti active={confettiActive} />

      <QuestionBox questionId={qIndex}>
        <div className="flex justify-between items-center mb-4">
          <button onClick={goHome} className="text-xs text-white/60 hover:text-[#00FFFF]">← Back to Home</button>
          <div className="text-sm text-white/60">Level {playerLevel + 1}: <span className="text-[#FFD700] font-semibold">{levelConfig.title}</span></div>
        </div>

        {/* Question Progress Bar (Overall) */}
        <div className="w-full bg-white/10 rounded-full h-2.5 mb-2 overflow-hidden">
          <motion.div
            className="h-2.5 rounded-full bg-[#00FFFF]"
            initial={{ width: 0 }}
            animate={{ width: `${totalProgressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-right text-xs text-white/50 mb-4">
              {qIndex + 1} / {sessionQs.length} Questions Complete
        </div>


        <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
          <h3 className="text-xl font-bold">Question {qIndex + 1}</h3>
          <div className="text-lg text-[#FFD700] font-bold">⏱ {timeLeft}s</div>
        </div>
        
        {/* Timer Countdown Bar (Per Question) */}
        <TimerProgressBar duration={levelConfig.timePerQuestion} resetKey={timerKey.toString()} />

        <h3 className="text-2xl font-bold mb-6 text-center">{current.question}</h3>

        <div className="grid gap-3">
          {current.options.map((opt, i) => {
            const isCorrect = showFeedback && opt === current.answer;
            const isSelectedWrong = showFeedback && selected === opt && opt !== current.answer;
            
            let cls = "bg-white/6 hover:bg-white/10 text-left px-4 py-3 rounded-xl transition flex justify-between items-center";
            if (showFeedback) {
                // Lock selection and apply feedback colors
                cls = "text-left px-4 py-3 rounded-xl transition flex justify-between items-center cursor-not-allowed";
                if (isCorrect) cls = "bg-green-600/60 text-white px-4 py-3 rounded-xl flex justify-between items-center shadow-lg shadow-green-900/50";
                else if (isSelectedWrong) cls = "bg-red-600/60 text-white px-4 py-3 rounded-xl flex justify-between items-center shadow-lg shadow-red-900/50";
                else cls = "bg-white/3 text-white/50 px-4 py-3 rounded-xl flex justify-between items-center"; // Unselected options fade
            }
            
            return (
              <button 
                key={i} 
                disabled={showFeedback} 
                onClick={() => handleSubmit(opt)} 
                className={cls}
              >
                <span>{opt}</span>
                {showFeedback && (isCorrect ? <span className="text-white">✓</span> : isSelectedWrong ? <span className="text-white">✕</span> : null)}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
            className={`mt-5 p-3 rounded-lg text-center ${feedbackText.startsWith("✅") ? "bg-[#003322]/60 text-[#00FFBB]" : "bg-[#330000]/60 text-[#FFB2B2]"}`}
          >
            {feedbackText}
          </motion.div>
        )}
      </QuestionBox>
    </main>
  );
}
