"use client";
import { useEffect, useState } from "react";
// Replaced: import { ArrowLeft, RefreshCw, ChevronRight, CheckCircle, XCircle, Timer } from 'lucide-react';

// --- SVG Icons (Replacement for lucide-react) ---

const ArrowLeftIcon = (props: { className?: string }) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

const RefreshCwIcon = (props: { className?: string }) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-3.35 1.7"/><path d="M6 8V5h3"/><path d="M3 3v3h3"/></svg>
);

const ChevronRightIcon = (props: { className?: string }) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);

const CheckCircleIcon = (props: { className?: string }) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
);

const XCircleIcon = (props: { className?: string }) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);

const TimerIcon = (props: { className?: string }) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 13a8 8 0 0 0 8 8 8 8 0 0 0 8-8"/></svg>
);


// --- Type Definitions ---
type Question = {
  question: string;
  options: string[];
  answer: string;
};

type Level = {
  title: string;
  questions: Question[];
  passMark: number;
};

// --- Quiz Data ---
// In a real application, this data would be fetched from a database (like the one managed in db.ts)
const levels: Level[] = [
  {
    title: "Beginner: Core Concepts",
    passMark: 60,
    questions: [
      { question: "What is staking?", options: ["Locking tokens to secure a network", "Sending tokens to a friend", "Burning tokens to reduce supply", "Minting new tokens on demand"], answer: "Locking tokens to secure a network" },
      { question: "What does DAO stand for?", options: ["Data Access Object", "Decentralized Autonomous Organization", "Digital Asset Option", "Direct Allocation Order"], answer: "Decentralized Autonomous Organization" },
    ],
  },
  {
    title: "Intermediate: Smart Contracts",
    passMark: 70,
    questions: [
      { question: "What is a smart contract?", options: ["A physical contract", "Code that runs on a blockchain", "A signature verification tool", "A digital ID"], answer: "Code that runs on a blockchain" },
      { question: "Which blockchain most famously uses Solidity?", options: ["Bitcoin", "Cardano", "Ethereum", "Polkadot"], answer: "Ethereum" },
    ],
  },
  {
    title: "Expert: DeFi Metrics",
    passMark: 80,
    questions: [
      { question: "What is TVL in DeFi?", options: ["Total Value Locked", "Token Value Level", "Transaction Volume Limit", "Trade Volume Ledger"], answer: "Total Value Locked" },
      { question: "What’s the primary purpose of a blockchain validator?", options: ["To confirm transactions", "To hold NFTs", "To create wallets", "To manage liquidity pools"], answer: "To confirm transactions" },
    ],
  },
  {
    title: "OG Level: Operator Networks",
    passMark: 90,
    questions: [
      { question: "Universal Staking allows staking across which boundary?", options: ["Single protocol", "Multiple protocols", "One wallet", "One chain"], answer: "Multiple protocols" },
      { question: "What’s an operator network?", options: ["A local blockchain fork", "An L2 liquidity pool", "A set of agents validating traps", "A trading bot"], answer: "A set of agents validating traps" },
    ],
  },
];

export default function QuizPage() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);
  const [showLevelSummary, setShowLevelSummary] = useState(false);
  const [timeLeft, setTimeLeft] = useState(12);

  const level = levels[levelIndex];
  const currentQuestion = level?.questions[qIndex];

  // Base time decreases slightly as levels get harder (though data might be wrong, we follow the user's logic)
  const baseTimeByLevel = [12, 16, 20, 25];
  const baseTime = baseTimeByLevel[levelIndex] ?? 12;

  // --- Timer Effect ---
  useEffect(() => {
    if (!currentQuestion) return; // Prevent timer from running if level data is missing
    if (showLevelSummary || showFeedback) return;

    // Time out handler
    if (timeLeft <= 0) {
      handleAnswer(null, true);
      return;
    }

    const timer = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showFeedback, showLevelSummary, qIndex, levelIndex, currentQuestion]);

  // --- Answer Handling Logic ---
  const handleAnswer = (option: string | null, timedOut = false) => {
    if (!currentQuestion || showFeedback) return;

    const isCorrect = option !== null && option === currentQuestion.answer;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
    setSelectedOption(option);

    // Show feedback
    if (isCorrect) {
      setFeedbackText("✅ Correct — nice one!");
    } else if (timedOut) {
      setFeedbackText("⏰ Time’s up — the correct answer is highlighted!");
    } else {
      setFeedbackText("❌ That wasn’t it — the correct answer is highlighted.");
    }
    setShowFeedback(true);

    // Move to next question or summary after short delay
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackText("");
      setSelectedOption(null);
      const next = qIndex + 1;

      if (next < level.questions.length) {
        setQIndex(next);
        setTimeLeft(baseTimeByLevel[levelIndex] ?? 12); // Reset timer for the new question
      } else {
        const total = level.questions.length;
        const percent = (newScore / total) * 100;
        const didPass = percent >= level.passMark;
        setPassed(didPass);
        setShowLevelSummary(true);
      }
    }, 1600); // 1.6 seconds delay to show feedback
  };

  // --- Navigation/Reset Functions ---
  const resetLevel = () => {
    setQIndex(0);
    setScore(0);
    setShowLevelSummary(false);
    setTimeLeft(baseTime);
  };

  const goToNextLevel = () => {
    setLevelIndex((p) => p + 1);
    setQIndex(0);
    setScore(0);
    setShowLevelSummary(false);
    setTimeLeft(baseTimeByLevel[levelIndex + 1] ?? 12);
  };

  // Guard clause for when all levels are completed (shouldn't happen with the current data structure but good practice)
  if (!level) {
    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white text-center p-6">
            <h1 className="text-3xl font-bold mb-4 text-[#FFD700]">All Levels Complete! 🏆</h1>
            <p className="text-lg">You have achieved OG status. Check out the Scramble mode for a new challenge!</p>
            <a href="/scramble" className="mt-8 px-6 py-3 bg-[#FFD700] text-black rounded-lg font-bold transition duration-300 hover:bg-yellow-400 flex items-center">
                Go to Scramble Mode <ChevronRightIcon className="ml-2 w-5 h-5" />
            </a>
        </main>
    );
  }

  // --- Level Summary Screen ---
  if (showLevelSummary) {
    const total = level.questions.length;
    const percent = Math.round((score / total) * 100);

    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white text-center p-6">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className={`p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center ${passed ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
            {passed ? <CheckCircleIcon className="w-12 h-12 text-green-400"/> : <XCircleIcon className="w-12 h-12 text-red-400"/>}
          </div>
          
          <h1 className="text-3xl font-extrabold mb-4">{level.title} Summary</h1>
          <p className="text-xl mb-6">
            Score: <span className="text-[#FFD700] font-bold">{score}</span> / {total} ({percent}%)
          </p>

          {passed ? (
            <>
              <p className="text-green-400 text-lg mb-8">Great job! You’ve passed this level 🎉</p>
              {levelIndex + 1 < levels.length ? (
                <button
                  onClick={goToNextLevel}
                  className="w-full bg-[#FFD700] text-black px-6 py-3 rounded-xl font-bold transition duration-300 hover:bg-yellow-400 shadow-lg flex items-center justify-center"
                >
                  Proceed to {levels[levelIndex + 1].title} <ChevronRightIcon className="ml-2 w-5 h-5" />
                </button>
              ) : (
                <p className="text-[#FFD700] text-2xl font-bold">You’re now an OG! 🏆</p>
              )}
            </>
          ) : (
            <>
              <p className="text-red-400 text-lg mb-4">
                You need at least <span className="font-bold">{level.passMark}%</span> to move on.
              </p>
              <p className="text-gray-300 mb-8">
                You’ve done your part, but you can do better 💪 <br />
                Take a short break, read a bit, and come back stronger.
              </p>
              <div className="flex flex-col items-center space-y-4">
                <a
                  href="https://docs.billionsnetwork.xyz/"
                  target="_blank"
                  className="text-[#FFD700] text-sm underline hover:text-yellow-400 transition"
                >
                  <ArrowLeftIcon className="inline-block w-4 h-4 mr-1"/> Read Docs for a refresher
                </a>
                <button
                  onClick={resetLevel}
                  className="w-full bg-red-600/50 text-white px-6 py-3 rounded-xl font-bold transition duration-300 hover:bg-red-500 flex items-center justify-center"
                >
                  <RefreshCwIcon className="mr-2 w-4 h-4" /> Retry Level
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // --- Main Quiz Screen ---
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <div className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20">
        
        {/* Header/Status */}
        <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-3">
          <a href="/" className="text-gray-400 hover:text-[#FFD700] transition flex items-center text-sm">
            <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Home
          </a>
          <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
            {levelIndex + 1}: {level.title}
          </span>
        </div>

        {/* Timer & Question Progress */}
        <div className="flex justify-between items-center mb-6">
            <span className="text-gray-400 text-sm">
                Question {qIndex + 1} of {level.questions.length}
            </span>
            <span className="text-[#FFD700] font-bold text-lg flex items-center">
                <TimerIcon className="w-5 h-5 mr-1" /> {timeLeft}s
            </span>
        </div>
        
        {/* Question */}
        <h2 className="text-2xl font-bold mb-8 text-center">{currentQuestion?.question}</h2>

        {/* Options */}
        <div className="space-y-4">
          {currentQuestion?.options.map((option, i) => {
            const isCorrect = option === currentQuestion.answer;
            const isSelected = option === selectedOption;

            let colorClass = "bg-white/10 hover:bg-white/20 ring-1 ring-white/10";
            let icon = null;

            if (showFeedback) {
              if (isSelected && !isCorrect) {
                colorClass = "bg-red-500/60 ring-2 ring-red-400";
                icon = <XCircleIcon className="w-5 h-5" />;
              } else if (isCorrect) {
                colorClass = "bg-green-500/60 ring-2 ring-green-400";
                icon = <CheckCircleIcon className="w-5 h-5" />;
              } else {
                // Dim unselected incorrect answers
                colorClass = "bg-white/5 opacity-50"; 
              }
            }

            return (
              <button
                key={i}
                disabled={showFeedback}
                onClick={() => handleAnswer(option)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center justify-between ${colorClass} disabled:cursor-not-allowed`}
              >
                {option}
                {showFeedback && icon}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showFeedback && (
          <p className={`text-center text-sm mt-6 font-semibold rounded-lg p-3 ${feedbackText.startsWith('✅') ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
            {feedbackText}
          </p>
        )}
      </div>
    </main>
  );
}
