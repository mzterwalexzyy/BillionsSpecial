// src/lib/questions.ts
export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string; // must exactly match one of options (case-insensitive compare in UI)
};

export type QuizLevel = {
  title: string;
  color: string;
  questions: QuizQuestion[];
};

export const quizLevels: QuizLevel[] = [
  {
    title: "Novice",
    color: "#4ADE80",
    questions: [
      {
        question: "What does DeFi stand for?",
        options: ["Decentralized Finance", "Decentral Finance", "Digital Finance", "Distributed Fund"],
        answer: "Decentralized Finance",
      },
      {
        question: "What is the native token of Ethereum?",
        options: ["ETH", "ETC", "BTC", "SOL"],
        answer: "ETH",
      },
      {
        question: "What is a blockchain?",
        options: [
          "A distributed digital ledger",
          "A central database",
          "A web browser",
          "A file storage system",
        ],
        answer: "A distributed digital ledger",
      },
    ],
  },
  {
    title: "Intermediate",
    color: "#FACC15",
    questions: [
      {
        question: "What’s the smallest unit of Bitcoin called?",
        options: ["Satoshi", "Wei", "Gwei", "Bit"],
        answer: "Satoshi",
      },
      {
        question: "Who is credited with creating Bitcoin?",
        options: ["Satoshi Nakamoto", "Vitalik Buterin", "Hal Finney", "Nick Szabo"],
        answer: "Satoshi Nakamoto",
      },
    ],
  },
  {
    title: "Advanced",
    color: "#FB923C",
    questions: [
      {
        question: "What’s a smart contract?",
        options: [
          "Self-executing code on blockchain",
          "A legal document",
          "A centralized server program",
          "A cryptographic key",
        ],
        answer: "Self-executing code on blockchain",
      },
    ],
  },
  {
    title: "OG",
    color: "#F87171",
    questions: [
      {
        question: "What does 'zk' in zk-rollups stand for?",
        options: ["Zero Knowledge", "Zero Kilo", "Zonal Key", "Zigzag Key"],
        answer: "Zero Knowledge",
      },
    ],
  },
];
