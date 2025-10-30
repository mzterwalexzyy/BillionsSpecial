export type Question = {
  id?: string;
  question: string;
  options: string[];
  answer: string;
};

export type LevelPool = {
  title: string;
  passMark: number;
  pool: Question[]; // full pool for that level
  perSession: number; // number of questions to draw per session
  timePerQuestion: number; // seconds
  /** FIX: Added description to the LevelPool type to resolve the TypeScript error. */
  description: string;
  /** Added index for easy reference, as used in the main component logic. */
  level: number;
};

// -----------------------------
// Level 1 — Beginner
// -----------------------------
const level1Pool: Question[] = [
  { id: "l1-1", question: "The core concept of Billions is to create a digital identity layer for the internet.", options: ["True", "False"], answer: "True" },
  { id: "l1-2", question: "Does Billions use Zero-Knowledge (ZK) technology to solve the identity problem?", options: ["Yes", "No"], answer: "Yes" },
  { id: "l1-3", question: "A key problem Billions aims to solve is the prevalence of bots, fakes, and spam on the internet.", options: ["True", "False"], answer: "True" },
  { id: "l1-4", question: "Billions' verification system is not privacy-first.", options: ["True", "False"], answer: "False" },
  { id: "l1-5", question: "Is 'Cross-chain' listed as one of the features of Billions?", options: ["Yes", "No"], answer: "Yes" },
  { id: "l1-6", question: "The Billions system records your trust and contributions as an 'Onchain reputation.'", options: ["True", "False"], answer: "True" },
  { id: "l1-7", question: "Has Billions integrated with over 10,000 projects so far?", options: ["Yes", "No"], answer: "No" },
  { id: "l1-8", question: "Coinbase Ventures is one of the backers of Billions.", options: ["True", "False"], answer: "True" },
  { id: "l1-9", question: "Is Billions positioning itself as the universal identity layer for Web3 and AI?", options: ["Yes", "No"], answer: "Yes" },
  { id: "l1-10", question: "The digital identity market is expected to be worth less than $100 Billion by 2030.", options: ["True", "False"], answer: "False" },
  { id: "l1-11", question: "Are Supermasks the first official NFT collection from Billions?", options: ["Yes", "No"], answer: "No" },
  { id: "l1-12", question: "Does the Billions Network let you prove you are human without biometrics or central servers?", options: ["Yes", "No"], answer: "Yes" },
  { id: "l1-13", question: "The technology for the Billions Network comes from a ZK team called Privado ID.", options: ["True", "False"], answer: "True" },
  { id: "l1-14", question: "Is 'Zero knowledge proofs' listed as a key feature of the Billions Network?", options: ["Yes", "No"], answer: "Yes" },
  { id: "l1-15", question: "The Billions Network uses 'Per app IDs' so that apps can easily track users across the internet.", options: ["True", "False"], answer: "False" },
  { id: "l1-16", question: "Has Billions raised $30M to build its identity layer?", options: ["Yes", "No"], answer: "Yes" },
  { id: "l1-17", question: "The Billions Network is only designed to verify humans, not AI agents.", options: ["True", "False"], answer: "False" },
  { id: "l1-18", question: "Does the Billions Network allow you to build a trusted reputation online?", options: ["Yes", "No"], answer: "Yes" },
  { id: "l1-19", question: "The Billions Supermasks NFT was minted for free.", options: ["True", "False"], answer: "True" },
  { id: "l1-20", question: "The Supermasks NFT has been minted.", options: ["True", "False"], answer: "True" },
];

// -----------------------------
// Level 2 — Pro
// -----------------------------
const level2Pool: Question[] = [
  { id: "l2-1", question: "What is the most accurate description of Billions?", options: ["A new cryptocurrency exchange", "The first human + AI network, acting as a digital identity layer", "A decentralized social media platform"], answer: "The first human + AI network, acting as a digital identity layer" },
  { id: "l2-2", question: "What is the primary technical method Billions uses to allow users to prove they're real without exposing personal info?", options: ["Biometric scanning", "Encrypted passwords", "Zero-Knowledge (ZK) technology"], answer: "Zero-Knowledge (ZK) technology" },
  { id: "l2-3", question: "How many projects has Billions integrated with so far?", options: ["Exactly 1,800,000 projects", "12,000+ projects", "More than 9,000 projects"], answer: "More than 9,000 projects" },
  { id: "l2-4", question: "Which financial institution or VC is explicitly mentioned as a key backer of Billions?", options: ["Goldman Sachs", "Polygon", "BlackRock"], answer: "Polygon" },
  { id: "l2-5", question: "What value is the digital identity market expected to hit by 2030?", options: ["Under $10 Billion", "Exactly $50 Billion", "Over $101 Billion"], answer: "Over $101 Billion" },
  { id: "l2-6", question: "How does Billions refer to the system that records a user's trust and contributions?", options: ["An AI ranking score", "Onchain reputation", "A centralized credit score"], answer: "Onchain reputation" },
  { id: "l2-7", question: "What is the name of Billions' second official NFT collection?", options: ["Cryptomasks", "Supermasks", "ZK-Identities"], answer: "Supermasks" },
  { id: "l2-8", question: "What is one action required to earn a whitelist spot for the Supermasks NFT?", options: ["Paying a minting fee", "Following the official Twitter page and tagging a friend", "Completing a biometric scan"], answer: "Following the official Twitter page and tagging a friend" },
  { id: "l2-9", question: "The Billions Network provides a digital passport for whom?", options: ["Only humans", "Only Web3 enterprises", "Every human and AI agent"], answer: "Every human and AI agent" },
  { id: "l2-10", question: "What is a key benefit of 'Per app IDs'?", options: ["It allows central servers to easily track user activity", "It ensures that no one can track you across different apps", "It improves blockchain transaction speed"], answer: "It ensures that no one can track you across different apps" },
  { id: "l2-11", question: "What is the approximate number of users Billions has achieved so far?", options: ["12,000+", "1.8 Million+", "9,000+"], answer: "1.8 Million+" },
  { id: "l2-12", question: "What is a primary method listed for a user to verify their identity in the Billions Network?", options: ["Wallet address signing", "Phone-based verification", "Email confirmation"], answer: "Phone-based verification" },
  { id: "l2-13", question: "What problem does Billions help solve concerning AI?", options: ["The high cost of AI computing", "The ability of AI to clone a person's voice, face, or writing", "The energy consumption of AI models"], answer: "The ability of AI to clone a person's voice, face, or writing" },
  { id: "l2-14", question: "For communities, what does verification through Billions unlock?", options: ["Free token airdrops only", "Rewards, reputation, and access across the ecosystem", "Mandatory government ID links"], answer: "Rewards, reputation, and access across the ecosystem" },
  { id: "l2-15", question: "Which of these venture firms is not listed as a Billions backer?", options: ["Polychain", "Andreessen Horowitz (a16z)", "BITKRAFTVC"], answer: "Andreessen Horowitz (a16z)" },
  { id: "l2-16", question: "Which entity is not explicitly mentioned as an identity layer target for Billions?", options: ["Web3", "Non-profit organizations", "Enterprises"], answer: "Non-profit organizations" },
  { id: "l2-17", question: "Billions Network's ZK team that provided tech is called?", options: ["ZK-Tech Solutions", "Privado ID", "Coinbase ZK"], answer: "Privado ID" },
  { id: "l2-18", question: "How much has Billions stated it raised to build its identity layer?", options: ["$1.8 Million", "$30 Million", "$101 Billion"], answer: "$30 Million" },
  { id: "l2-19", question: "Billions aims to be a foundation for humans and AI with what core value?", options: ["Competition", "Collaboration", "Trust"], answer: "Trust" },
  { id: "l2-20", question: "What is the stated number of community members Billions has so far?", options: ["12k+", "1.8 Million+", "9,000+"], answer: "12k+" },
];

// -----------------------------
// Level 3 — Know the Billions Team
// -----------------------------
const level3Pool: Question[] = [
  { id: "l3-1", question: "David Z is a co-founder of Billions Network.", options: ["True", "False"], answer: "True" },
  { id: "l3-2", question: "Ravidilse.eth works as Director of Growth and AI Partnerships at Billions Network.", options: ["True", "False"], answer: "True" },
  { id: "l3-3", question: "Laura Rodriguez was previously part of the Bored Ape Yacht Club Council.", options: ["True", "False"], answer: "True" },
  { id: "l3-4", question: "Javi🥥.eth is currently Head of Product at Billions Network.", options: ["True", "False"], answer: "False" },
  { id: "l3-5", question: "OttoMorac.eth lists ZK Identity and Privado ID among his interests.", options: ["True", "False"], answer: "True" },
  { id: "l3-6", question: "Oleksandr Brezhniev is the CTO of Billions Network.", options: ["True", "False"], answer: "True" },
  { id: "l3-7", question: "Evin is new to Web3 and has no previous startups.", options: ["True", "False"], answer: "False" },
  { id: "l3-8", question: "Joanna works in Business Development (BD) at Billions Network.", options: ["True", "False"], answer: "True" },
  { id: "l3-9", question: "AlexDigital.eth is the Chief Marketing Officer (CMO) at Billions Network.", options: ["True", "False"], answer: "True" },
  { id: "l3-10", question: "Ron previously worked at Polygon before joining Billions Network.", options: ["True", "False"], answer: "True" },
  { id: "l3-11", question: "Which of the following companies did David Z co-found?", options: ["Decentraland", "Billions Network", "Disco.xyz"], answer: "Billions Network" },
  { id: "l3-12", question: "Ravidilse.eth (Ravi) is focused on which area at Billions Network?", options: ["Growth and AI Partnerships", "Blockchain Engineering", "Legal and Compliance"], answer: "Growth and AI Partnerships" },
  { id: "l3-13", question: "Laura Rodriguez hosts and manages marketing primarily across which regions?", options: ["Asia and Africa", "LATAM and US", "Europe"], answer: "LATAM and US" },
  { id: "l3-14", question: "Javi🥥.eth was previously associated with:", options: ["Ethereum Foundation", "Polygon", "Chainlink"], answer: "Polygon" },
  { id: "l3-15", question: "Which of these is OttoMorac.eth passionate about?", options: ["Machine Learning", "ZK Identity and Tennis", "AI Regulation"], answer: "ZK Identity and Tennis" },
  { id: "l3-16", question: "Oleksandr Brezhniev has expertise in which technical area?", options: ["Zero Knowledge (ZK) and Self-Sovereign Identity (SSI)", "Game Development", "Token Economics"], answer: "Zero Knowledge (ZK) and Self-Sovereign Identity (SSI)" },
  { id: "l3-17", question: "Evin, cofounder of Billions Network, also cofounded which project acquired by ConsenSys?", options: ["Disco.xyz", "Lens Protocol", "Privado ID"], answer: "Disco.xyz" },
  { id: "l3-18", question: "Joanna is a Business Development (BD) team member who previously studied at:", options: ["Harvard", "Penn", "Stanford"], answer: "Penn" },
  { id: "l3-19", question: "AlexDigital.eth describes his mission as:", options: ["Saving the internet in the era of AI", "Building bridges between chains", "Promoting meme culture"], answer: "Saving the internet in the era of AI" },
  { id: "l3-20", question: "Ron, Marketing Lead at Billions Network, also describes himself as:", options: ["A Music and Rants creator", "A Solidity Developer", "An NFT artist"], answer: "A Music and Rants creator" },
];

// -----------------------------
// Export Levels
// -----------------------------
export const LEVELS: LevelPool[] = [
  { 
    level: 0, 
    title: "Level 1 — Beginner", 
    description: "Test your fundamental knowledge of the Billions Network's core mission, backers, and identity concepts.", // <-- Added description
    passMark: 60, 
    pool: level1Pool, 
    perSession: 10, 
    timePerQuestion: 10 
  },
  { 
    level: 1, 
    title: "Level 2 — Pro", 
    description: "Challenge your understanding of tokenomics, technology (ZK), and specific user metrics related to Billions.", // <-- Added description
    passMark: 70, 
    pool: level2Pool, 
    perSession: 10, 
    timePerQuestion: 15 
  },
  { 
    level: 2, 
    title: "Level 3 — Know the Billions Team", 
    description: "Identify the key contributors and their roles, which is essential for understanding the project's leadership.", // <-- Added description
    passMark: 70, 
    pool: level3Pool, 
    perSession: 10, 
    timePerQuestion: 20 
  },
];
