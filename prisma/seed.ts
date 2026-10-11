import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import {
  Difficulty,
  QuestionSource,
  QuestionType,
} from "../lib/generated/prisma/enums";
import { PrismaClient } from "../lib/generated/prisma/client";

type BankSeed = {
  category: string;
  topic: string;
  difficulty: Difficulty;
  questionType?: QuestionType;
  question: string;
  expectedConcepts: string[];
  idealAnswerPoints: string[];
};

const QUESTION_BANK: BankSeed[] = [
  // ---------------------------------------------------------------- JavaScript
  {
    category: "JavaScript",
    topic: "JavaScript",
    difficulty: Difficulty.EASY,
    question: "What is the difference between `let`, `const` and `var`?",
    expectedConcepts: ["block scope", "reassignment", "hoisting", "temporal dead zone"],
    idealAnswerPoints: [
      "`var` is function-scoped and hoisted with an initial value of undefined.",
      "`let` and `const` are block-scoped and hoisted but not initialised (TDZ).",
      "`const` prevents reassignment but does not make objects immutable.",
    ],
  },
  {
    category: "JavaScript",
    topic: "JavaScript",
    difficulty: Difficulty.MEDIUM,
    question: "Explain how closures work and give a practical use case.",
    expectedConcepts: ["lexical scope", "captured variables", "encapsulation"],
    idealAnswerPoints: [
      "A closure is a function that retains access to its lexical scope after the outer function returns.",
      "Variables are captured by reference, not by value.",
      "Used for data privacy, function factories and memoisation.",
    ],
  },
  {
    category: "JavaScript",
    topic: "JavaScript",
    difficulty: Difficulty.MEDIUM,
    question: "What is the event loop and how do microtasks differ from macrotasks?",
    expectedConcepts: ["call stack", "task queue", "microtask queue", "Promise"],
    idealAnswerPoints: [
      "The event loop moves tasks from queues to the call stack when it is empty.",
      "Microtasks (Promises, queueMicrotask) run before the next macrotask and drain fully.",
      "Macrotasks include setTimeout, setInterval and I/O callbacks.",
    ],
  },
  {
    category: "JavaScript",
    topic: "JavaScript",
    difficulty: Difficulty.HARD,
    question: "Explain prototypal inheritance and how `Object.create` differs from `class`.",
    expectedConcepts: ["prototype chain", "[[Prototype]]", "constructor", "class sugar"],
    idealAnswerPoints: [
      "Objects delegate property lookups up the prototype chain.",
      "`Object.create(proto)` sets the prototype directly.",
      "`class` is syntactic sugar over prototype-based inheritance with extra semantics.",
    ],
  },

  // -------------------------------------------------------------------- React
  {
    category: "React",
    topic: "React",
    difficulty: Difficulty.MEDIUM,
    question: "What is the difference between `useMemo` and `useCallback`?",
    expectedConcepts: ["memoisation", "referential equality", "dependency array"],
    idealAnswerPoints: [
      "`useMemo` memoises a computed value; `useCallback` memoises a function reference.",
      "`useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.",
      "Both should be used to fix measured referential-equality problems, not preemptively.",
    ],
  },
  {
    category: "React",
    topic: "React",
    difficulty: Difficulty.MEDIUM,
    question: "When would `useMemo` hurt performance rather than help?",
    expectedConcepts: ["overhead", "dependency comparison", "cheap computation"],
    idealAnswerPoints: [
      "Memoisation adds bookkeeping and dependency comparison cost.",
      "For cheap computations it can be slower than recomputing.",
      "It also consumes memory retaining previous values.",
    ],
  },
  {
    category: "React",
    topic: "React",
    difficulty: Difficulty.EASY,
    question: "What problem do React keys solve in lists?",
    expectedConcepts: ["reconciliation", "identity", "state preservation"],
    idealAnswerPoints: [
      "Keys give elements a stable identity during reconciliation.",
      "Wrong keys (like array index) can cause state to attach to the wrong item.",
      "Keys must be unique among siblings.",
    ],
  },
  {
    category: "React",
    topic: "React",
    difficulty: Difficulty.HARD,
    question: "How does React state batching work, and how has it changed in React 18+?",
    expectedConcepts: ["batching", "automatic batching", "transitions"],
    idealAnswerPoints: [
      "React groups multiple state updates into one render for efficiency.",
      "React 18 introduced automatic batching in promises, timeouts and native handlers.",
      "`flushSync` can opt out when synchronous DOM updates are required.",
    ],
  },

  // -------------------------------------------------------------------- DSA
  {
    category: "DSA",
    topic: "DSA",
    difficulty: Difficulty.EASY,
    question: "What is the time complexity of binary search and why?",
    expectedConcepts: ["O(log n)", "sorted input", "halving"],
    idealAnswerPoints: [
      "Binary search is O(log n) because the search space halves each step.",
      "It requires a sorted collection and random access.",
      "Space complexity is O(1) iteratively, O(log n) recursively.",
    ],
  },
  {
    category: "DSA",
    topic: "DSA",
    difficulty: Difficulty.MEDIUM,
    question: "How would you detect a cycle in a linked list?",
    expectedConcepts: ["Floyd's algorithm", "fast and slow pointers", "O(1) space"],
    idealAnswerPoints: [
      "Use two pointers moving at different speeds; if they meet, a cycle exists.",
      "Floyd's tortoise and hare runs in O(n) time and O(1) space.",
      "A hash set also works but costs O(n) space.",
    ],
  },
  {
    category: "DSA",
    topic: "DSA",
    difficulty: Difficulty.MEDIUM,
    question: "Compare a hash table and a balanced binary search tree.",
    expectedConcepts: ["average vs worst case", "ordering", "range queries"],
    idealAnswerPoints: [
      "Hash tables give average O(1) lookup but O(n) worst case and no ordering.",
      "Balanced BSTs give O(log n) guarantees and support ordered/range queries.",
      "Hash tables are preferred for pure key lookups.",
    ],
  },
  {
    category: "DSA",
    topic: "DSA",
    difficulty: Difficulty.HARD,
    question: "Explain dynamic programming and how it differs from greedy algorithms.",
    expectedConcepts: ["overlapping subproblems", "optimal substructure", "local optimum"],
    idealAnswerPoints: [
      "DP solves overlapping subproblems by storing results (memo/tabulation).",
      "Greedy makes locally optimal choices and needs an exchange-argument proof.",
      "DP is used when greedy cannot guarantee a global optimum.",
    ],
  },

  // -------------------------------------------------------------------- DBMS
  {
    category: "DBMS",
    topic: "Databases",
    difficulty: Difficulty.EASY,
    question: "What is the difference between SQL and NoSQL databases?",
    expectedConcepts: ["relational model", "schema flexibility", "scaling"],
    idealAnswerPoints: [
      "SQL databases are relational with a fixed schema and ACID transactions.",
      "NoSQL databases trade some guarantees for flexible schemas and horizontal scale.",
      "Choice depends on access patterns, consistency needs and scale.",
    ],
  },
  {
    category: "DBMS",
    topic: "Databases",
    difficulty: Difficulty.MEDIUM,
    question: "When would a NoSQL database be preferred over a relational one?",
    expectedConcepts: ["horizontal scaling", "access patterns", "schema evolution"],
    idealAnswerPoints: [
      "High write throughput with predictable key access patterns.",
      "Rapidly evolving or denormalised document structures.",
      "When eventual consistency is acceptable.",
    ],
  },
  {
    category: "DBMS",
    topic: "Databases",
    difficulty: Difficulty.MEDIUM,
    question: "Explain database normalization and when you might denormalize.",
    expectedConcepts: ["redundancy", "anomalies", "read performance"],
    idealAnswerPoints: [
      "Normalization removes redundancy and update anomalies.",
      "Denormalization trades storage/consistency for read speed.",
      "Read-heavy analytics or caching layers often denormalize deliberately.",
    ],
  },
  {
    category: "DBMS",
    topic: "Databases",
    difficulty: Difficulty.HARD,
    question: "How do database indexes work and what is the cost of adding one?",
    expectedConcepts: ["B-tree", "write amplification", "selectivity"],
    idealAnswerPoints: [
      "Indexes are typically B-trees enabling O(log n) lookups.",
      "They speed reads but slow writes and consume storage.",
      "Low-selectivity columns benefit less; composite index order matters.",
    ],
  },

  // ------------------------------------------------------- Operating Systems
  {
    category: "Operating Systems",
    topic: "Operating Systems",
    difficulty: Difficulty.EASY,
    question: "What is the difference between a process and a thread?",
    expectedConcepts: ["address space", "isolation", "shared memory"],
    idealAnswerPoints: [
      "Processes have separate address spaces; threads share one within a process.",
      "Threads are cheaper to create and switch between.",
      "Shared state across threads requires synchronisation.",
    ],
  },
  {
    category: "Operating Systems",
    topic: "Operating Systems",
    difficulty: Difficulty.MEDIUM,
    question: "What is a deadlock and what conditions are required for it?",
    expectedConcepts: ["Coffman conditions", "mutual exclusion", "circular wait"],
    idealAnswerPoints: [
      "Deadlock is when processes wait on each other indefinitely.",
      "Requires mutual exclusion, hold-and-wait, no preemption and circular wait.",
      "Prevention removes one condition; avoidance uses ordering or detection.",
    ],
  },
  {
    category: "Operating Systems",
    topic: "Operating Systems",
    difficulty: Difficulty.MEDIUM,
    question: "Explain virtual memory and paging.",
    expectedConcepts: ["page table", "address translation", "page fault"],
    idealAnswerPoints: [
      "Virtual memory gives each process an isolated address space.",
      "Paging maps virtual pages to physical frames via page tables.",
      "Page faults load missing pages; thrashing degrades performance.",
    ],
  },

  // --------------------------------------------------------- Computer Networks
  {
    category: "Computer Networks",
    topic: "Computer Networks",
    difficulty: Difficulty.EASY,
    question: "What happens when you type a URL into a browser and press enter?",
    expectedConcepts: ["DNS", "TCP/TLS", "HTTP", "rendering"],
    idealAnswerPoints: [
      "DNS resolves the hostname to an IP address.",
      "A TCP connection is established and TLS negotiated for HTTPS.",
      "The HTTP request is sent, response parsed and the page rendered.",
    ],
  },
  {
    category: "Computer Networks",
    topic: "Computer Networks",
    difficulty: Difficulty.MEDIUM,
    question: "Compare TCP and UDP.",
    expectedConcepts: ["reliability", "ordering", "latency"],
    idealAnswerPoints: [
      "TCP is connection-oriented, reliable and ordered with congestion control.",
      "UDP is connectionless with no delivery guarantees but lower latency.",
      "UDP suits real-time media; TCP suits file transfer and web traffic.",
    ],
  },
  {
    category: "Computer Networks",
    topic: "Computer Networks",
    difficulty: Difficulty.HARD,
    question: "How does HTTPS establish a secure channel?",
    expectedConcepts: ["TLS handshake", "asymmetric then symmetric", "certificates"],
    idealAnswerPoints: [
      "The TLS handshake authenticates the server with a certificate.",
      "Asymmetric crypto negotiates a shared symmetric key.",
      "Bulk data is then encrypted symmetrically for performance.",
    ],
  },

  // -------------------------------------------------------------------- OOP
  {
    category: "OOP",
    topic: "OOP",
    difficulty: Difficulty.EASY,
    question: "Explain the four pillars of object-oriented programming.",
    expectedConcepts: ["encapsulation", "abstraction", "inheritance", "polymorphism"],
    idealAnswerPoints: [
      "Encapsulation hides internal state behind an interface.",
      "Abstraction exposes essential behaviour while hiding detail.",
      "Inheritance reuses behaviour; polymorphism allows substitutable types.",
    ],
  },
  {
    category: "OOP",
    topic: "OOP",
    difficulty: Difficulty.MEDIUM,
    question: "What is the difference between an abstract class and an interface?",
    expectedConcepts: ["implementation", "multiple inheritance", "contract"],
    idealAnswerPoints: [
      "Interfaces define a contract with no (or default) implementation.",
      "Abstract classes can hold state and partial implementation.",
      "A class may implement many interfaces but extend one class.",
    ],
  },
  {
    category: "OOP",
    topic: "OOP",
    difficulty: Difficulty.HARD,
    question: "Explain the SOLID principles with a short example.",
    expectedConcepts: ["SRP", "OCP", "LSP", "ISP", "DIP"],
    idealAnswerPoints: [
      "Single Responsibility, Open/Closed, Liskov Substitution.",
      "Interface Segregation and Dependency Inversion.",
      "Each principle reduces coupling and improves testability.",
    ],
  },

  // ------------------------------------------------------------ System Design
  {
    category: "System Design",
    topic: "System Design",
    difficulty: Difficulty.MEDIUM,
    question: "How does load balancing work and what algorithms are common?",
    expectedConcepts: ["round robin", "least connections", "health checks"],
    idealAnswerPoints: [
      "Load balancers distribute traffic across healthy backends.",
      "Common algorithms: round robin, least connections, hashing.",
      "Health checks and sticky sessions address failure and state.",
    ],
  },
  {
    category: "System Design",
    topic: "System Design",
    difficulty: Difficulty.MEDIUM,
    question: "Explain caching strategies and cache invalidation.",
    expectedConcepts: ["TTL", "write-through", "eviction", "consistency"],
    idealAnswerPoints: [
      "Cache-aside, write-through and write-behind are common strategies.",
      "TTL and LRU/LFU govern eviction.",
      "Invalidation and stampedes are the hard parts; consider versioned keys.",
    ],
  },
  {
    category: "System Design",
    topic: "System Design",
    difficulty: Difficulty.HARD,
    question: "How would you scale a relational database for read-heavy traffic?",
    expectedConcepts: ["read replicas", "sharding", "caching", "partitioning"],
    idealAnswerPoints: [
      "Add read replicas and route reads away from the primary.",
      "Introduce caching for hot data.",
      "Shard or partition when a single primary is saturated.",
    ],
  },

  // -------------------------------------------------------------------- Node.js
  {
    category: "Node.js",
    topic: "Node.js",
    difficulty: Difficulty.MEDIUM,
    question: "Why is Node.js considered single-threaded, and when does that matter?",
    expectedConcepts: ["event loop", "libuv", "worker pool", "CPU-bound"],
    idealAnswerPoints: [
      "JavaScript runs on one thread with an event loop; I/O is offloaded to libuv.",
      "CPU-bound work blocks the loop and stalls all requests.",
      "Worker threads or child processes handle CPU-bound tasks.",
    ],
  },
  {
    category: "Node.js",
    topic: "Node.js",
    difficulty: Difficulty.MEDIUM,
    question: "How does middleware work in Express-style Node frameworks?",
    expectedConcepts: ["request pipeline", "next()", "ordering", "error middleware"],
    idealAnswerPoints: [
      "Middleware functions run in order and call next() to continue.",
      "Error middleware has four arguments and handles thrown errors.",
      "Ordering matters for auth, parsing and routing.",
    ],
  },

  // ---------------------------------------------------------------- Behavioral
  {
    category: "Behavioral",
    topic: "Teamwork",
    difficulty: Difficulty.EASY,
    questionType: QuestionType.BEHAVIORAL,
    question: "Tell me about a time you disagreed with a teammate. How did you handle it?",
    expectedConcepts: ["STAR", "empathy", "evidence-based reasoning", "outcome"],
    idealAnswerPoints: [
      "Describe the situation and both perspectives fairly.",
      "Explain how you sought data and a shared goal.",
      "Conclude with the resolution and what you learned.",
    ],
  },
  {
    category: "Behavioral",
    topic: "Time Management",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.BEHAVIORAL,
    question: "Describe a project that slipped. What did you do?",
    expectedConcepts: ["ownership", "communication", "prioritisation", "retrospective"],
    idealAnswerPoints: [
      "Acknowledge the slip and your role in it.",
      "Explain how you communicated and re-prioritised.",
      "Share the process change you adopted afterwards.",
    ],
  },
  {
    category: "Behavioral",
    topic: "Conflict Resolution",
    difficulty: Difficulty.HARD,
    questionType: QuestionType.BEHAVIORAL,
    question: "Tell me about a time you received difficult feedback.",
    expectedConcepts: ["self-awareness", "growth", "concrete change"],
    idealAnswerPoints: [
      "Describe the feedback without defensiveness.",
      "Explain what you changed concretely.",
      "Show the measurable improvement that followed.",
    ],
  },

  // ----------------------------------------------------------------------- HR
  {
    category: "HR",
    topic: "Communication",
    difficulty: Difficulty.EASY,
    questionType: QuestionType.HR,
    question: "Tell me about yourself.",
    expectedConcepts: ["concise narrative", "relevance", "motivation"],
    idealAnswerPoints: [
      "Present, past, future structure in 60–90 seconds.",
      "Connect experience to the role.",
      "End with why you are here.",
    ],
  },
  {
    category: "HR",
    topic: "Communication",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.HR,
    question: "Why do you want to work here?",
    expectedConcepts: ["company research", "role fit", "genuine motivation"],
    idealAnswerPoints: [
      "Reference specific products, values or challenges.",
      "Tie your skills to their needs.",
      "Avoid generic praise.",
    ],
  },
  {
    category: "HR",
    topic: "Communication",
    difficulty: Difficulty.MEDIUM,
    questionType: QuestionType.HR,
    question: "What is your biggest weakness?",
    expectedConcepts: ["honesty", "self-awareness", "mitigation"],
    idealAnswerPoints: [
      "Choose a real, non-fatal weakness.",
      "Explain the concrete steps you take to mitigate it.",
      "Show evidence of progress.",
    ],
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — cannot run seed.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  console.log(`Seeding ${QUESTION_BANK.length} question-bank items...`);

  let created = 0;
  for (const item of QUESTION_BANK) {
    const existing = await prisma.questionBankItem.findUnique({
      where: { question: item.question },
      select: { id: true },
    });

    if (existing) continue;

    await prisma.questionBankItem.create({
      data: {
        category: item.category,
        topic: item.topic,
        difficulty: item.difficulty,
        questionType: item.questionType ?? QuestionType.TECHNICAL,
        question: item.question,
        expectedConcepts: item.expectedConcepts,
        idealAnswerPoints: item.idealAnswerPoints,
        source: QuestionSource.QUESTION_BANK,
        validated: true,
      },
    });
    created += 1;
  }

  console.log(`Question bank ready (+${created} new).`);

  if (process.env.SEED_DEMO_USER === "true") {
    const email = "demo@interviewprep.dev";
    const passwordHash = await bcrypt.hash("Demo1234!", 12);

    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: "Demo Candidate",
        passwordHash,
        targetRole: "FRONTEND_DEVELOPER",
        experienceLevel: "INTERMEDIATE",
        preferredInterviewType: "TECHNICAL",
        skills: ["JavaScript", "React"],
      },
    });

    console.log(`Demo user ready: ${email} / Demo1234!`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
