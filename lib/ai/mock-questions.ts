import { QuestionType } from "@/lib/generated/prisma/enums";

export type MockQuestion = {
  question: string;
  expectedConcepts: string[];
  questionType?: QuestionType;
};

/**
 * Offline question pool used by the mock AI provider. This is intentionally
 * hand-authored so the app is fully functional without any external API key.
 */
export const MOCK_QUESTION_POOL: Record<string, MockQuestion[]> = {
  JavaScript: [
    {
      question: "Explain the difference between `==` and `===` in JavaScript.",
      expectedConcepts: ["type coercion", "strict equality", "reference vs value"],
    },
    {
      question: "How does the JavaScript event loop handle asynchronous callbacks?",
      expectedConcepts: ["call stack", "task queue", "microtasks", "non-blocking"],
    },
    {
      question: "What are closures and when would you use one?",
      expectedConcepts: ["lexical scope", "encapsulation", "state retention"],
    },
  ],
  React: [
    {
      question: "Explain the difference between `useMemo` and `useCallback` in React.",
      expectedConcepts: ["memoisation", "referential equality", "dependency array"],
    },
    {
      question: "When can memoisation with `useMemo` hurt performance?",
      expectedConcepts: ["overhead", "dependency comparison", "cheap computation"],
    },
    {
      question: "How does React reconcile lists and why do keys matter?",
      expectedConcepts: ["reconciliation", "stable identity", "state preservation"],
    },
  ],
  "Next.js": [
    {
      question: "Compare server components and client components in Next.js.",
      expectedConcepts: ["RSC", "bundle size", "data fetching", "use client"],
    },
    {
      question: "What are the trade-offs of static generation versus dynamic rendering?",
      expectedConcepts: ["build time", "freshness", "caching", "TTFB"],
    },
  ],
  "Node.js": [
    {
      question: "Why is Node.js described as single-threaded and when does that matter?",
      expectedConcepts: ["event loop", "libuv", "CPU-bound work", "worker threads"],
    },
    {
      question: "How would you handle CPU-intensive work in a Node.js API?",
      expectedConcepts: ["worker threads", "queue", "offloading", "latency"],
    },
  ],
  Databases: [
    {
      question: "What is the difference between SQL and NoSQL databases?",
      expectedConcepts: ["relational model", "schema", "scaling", "consistency"],
    },
    {
      question: "When would a NoSQL database be preferred over a relational one?",
      expectedConcepts: ["access patterns", "horizontal scaling", "flexible schema"],
    },
    {
      question: "How do database indexes improve performance and what do they cost?",
      expectedConcepts: ["B-tree", "read speed", "write cost", "selectivity"],
    },
  ],
  DSA: [
    {
      question: "What is the time complexity of binary search and why?",
      expectedConcepts: ["O(log n)", "sorted input", "halving search space"],
    },
    {
      question: "How would you detect a cycle in a linked list?",
      expectedConcepts: ["fast and slow pointers", "Floyd", "O(1) space"],
    },
    {
      question: "Compare a hash table with a balanced binary search tree.",
      expectedConcepts: ["average vs worst case", "ordering", "range queries"],
    },
  ],
  "Operating Systems": [
    {
      question: "What is the difference between a process and a thread?",
      expectedConcepts: ["address space", "isolation", "shared memory", "context switch"],
    },
    {
      question: "What conditions are required for a deadlock?",
      expectedConcepts: ["mutual exclusion", "hold and wait", "no preemption", "circular wait"],
    },
  ],
  "Computer Networks": [
    {
      question: "What happens when you type a URL into a browser and press enter?",
      expectedConcepts: ["DNS", "TCP", "TLS", "HTTP", "rendering"],
    },
    {
      question: "Compare TCP and UDP.",
      expectedConcepts: ["reliability", "ordering", "latency", "connectionless"],
    },
  ],
  OOP: [
    {
      question: "Explain the four pillars of object-oriented programming.",
      expectedConcepts: ["encapsulation", "abstraction", "inheritance", "polymorphism"],
    },
    {
      question: "What is the difference between an abstract class and an interface?",
      expectedConcepts: ["contract", "implementation", "multiple inheritance"],
    },
  ],
  "System Design": [
    {
      question: "How does load balancing work and which algorithms are common?",
      expectedConcepts: ["round robin", "least connections", "health checks", "availability"],
    },
    {
      question: "Explain caching strategies and how you would invalidate a cache.",
      expectedConcepts: ["TTL", "cache-aside", "eviction", "consistency"],
    },
    {
      question: "How would you scale a read-heavy relational database?",
      expectedConcepts: ["read replicas", "caching", "sharding", "partitioning"],
    },
  ],
  Git: [
    {
      question: "Explain the difference between merge and rebase.",
      expectedConcepts: ["history", "linearity", "conflicts", "shared branches"],
    },
    {
      question: "How would you recover a commit that was accidentally removed?",
      expectedConcepts: ["reflog", "reset", "revert", "safety"],
    },
  ],
  Cloud: [
    {
      question: "What factors influence choosing between a VM and serverless?",
      expectedConcepts: ["cold starts", "cost model", "scaling", "operational overhead"],
    },
  ],
  SQL: [
    {
      question: "Explain the difference between an inner join and a left join.",
      expectedConcepts: ["matching rows", "nulls", "result set size"],
    },
    {
      question: "How would you find the second highest salary in a table?",
      expectedConcepts: ["subquery", "window function", "ordering", "distinct"],
    },
  ],
  Python: [
    {
      question: "What is the difference between a list and a tuple in Python?",
      expectedConcepts: ["mutability", "performance", "hashability"],
    },
  ],
  Statistics: [
    {
      question: "Explain the difference between correlation and causation.",
      expectedConcepts: ["confounding", "experiment", "observational data"],
    },
    {
      question: "What is a p-value and how should it be interpreted?",
      expectedConcepts: ["null hypothesis", "false positive", "effect size"],
    },
  ],
  "Machine Learning": [
    {
      question: "Explain the bias-variance trade-off.",
      expectedConcepts: ["underfitting", "overfitting", "regularisation", "generalisation"],
    },
  ],
  Docker: [
    {
      question: "What is the difference between a Docker image and a container?",
      expectedConcepts: ["layers", "runtime instance", "immutability"],
    },
  ],
  Kubernetes: [
    {
      question: "What problem do Kubernetes Deployments solve?",
      expectedConcepts: ["replicas", "rolling updates", "self-healing", "desired state"],
    },
  ],
  "CI/CD": [
    {
      question: "What would you include in a healthy CI pipeline?",
      expectedConcepts: ["linting", "tests", "build", "artifacts", "fast feedback"],
    },
  ],
  Linux: [
    {
      question: "How would you investigate a process consuming high CPU on Linux?",
      expectedConcepts: ["top", "ps", "strace", "logs", "profiling"],
    },
  ],
  Networking: [
    {
      question: "What is the difference between a stateful and a stateless firewall?",
      expectedConcepts: ["connection tracking", "rules", "performance"],
    },
  ],
  Cryptography: [
    {
      question: "Explain the difference between symmetric and asymmetric encryption.",
      expectedConcepts: ["shared key", "public/private key", "performance", "key exchange"],
    },
  ],
  "Threat Modeling": [
    {
      question: "How would you threat model a new public API?",
      expectedConcepts: ["assets", "attack surface", "STRIDE", "mitigations"],
    },
  ],
  "Incident Response": [
    {
      question: "Walk through the first steps you take when a breach is suspected.",
      expectedConcepts: ["containment", "evidence preservation", "communication", "postmortem"],
    },
  ],
  Monitoring: [
    {
      question: "Which signals would you monitor for a production web service?",
      expectedConcepts: ["latency", "error rate", "saturation", "traffic"],
    },
  ],
  "Data Visualization": [
    {
      question: "How do you choose the right chart for a dataset?",
      expectedConcepts: ["data type", "comparison vs trend", "clarity", "audience"],
    },
  ],
  "Product Strategy": [
    {
      question: "How would you prioritise a backlog with limited engineering capacity?",
      expectedConcepts: ["impact", "effort", "confidence", "opportunity cost"],
    },
  ],
  "User Research": [
    {
      question: "How would you validate a feature idea before building it?",
      expectedConcepts: ["interviews", "prototype", "success metric", "assumptions"],
    },
  ],
  Analytics: [
    {
      question: "Which metrics would you track to judge a new onboarding flow?",
      expectedConcepts: ["activation", "retention", "conversion", "guardrail metrics"],
    },
  ],
  Communication: [
    {
      question: "Tell me about a time you explained something complex to a non-technical stakeholder.",
      expectedConcepts: ["audience", "analogy", "clarity", "outcome"],
      questionType: QuestionType.BEHAVIORAL,
    },
  ],
  Teamwork: [
    {
      question: "Describe a time you had to rely on a teammate to meet a deadline.",
      expectedConcepts: ["collaboration", "communication", "ownership", "result"],
      questionType: QuestionType.BEHAVIORAL,
    },
  ],
  "Conflict Resolution": [
    {
      question: "Tell me about a disagreement with a colleague and how you resolved it.",
      expectedConcepts: ["empathy", "evidence", "shared goal", "resolution"],
      questionType: QuestionType.BEHAVIORAL,
    },
  ],
  Leadership: [
    {
      question: "Describe a time you took ownership without being asked.",
      expectedConcepts: ["initiative", "impact", "communication", "reflection"],
      questionType: QuestionType.BEHAVIORAL,
    },
  ],
  "Time Management": [
    {
      question: "How do you prioritise when several deadlines collide?",
      expectedConcepts: ["prioritisation", "communication", "trade-offs", "delivery"],
      questionType: QuestionType.BEHAVIORAL,
    },
  ],
};

export const GENERIC_HR_QUESTIONS: MockQuestion[] = [
  {
    question: "Tell me about yourself and why you are interested in this role.",
    expectedConcepts: ["relevant experience", "motivation", "clarity", "fit"],
    questionType: QuestionType.HR,
  },
  {
    question: "What is a strength you would bring to this team?",
    expectedConcepts: ["concrete example", "impact", "self-awareness"],
    questionType: QuestionType.HR,
  },
  {
    question: "Where do you see your career progressing over the next few years?",
    expectedConcepts: ["direction", "realism", "alignment", "growth"],
    questionType: QuestionType.HR,
  },
];

export const GENERIC_TECHNICAL_QUESTIONS: MockQuestion[] = [
  {
    question:
      "Walk me through how you would approach debugging an intermittent production issue.",
    expectedConcepts: ["reproduction", "observability", "hypothesis", "isolation"],
  },
  {
    question:
      "Describe a technical decision you made recently and the trade-offs involved.",
    expectedConcepts: ["options", "constraints", "trade-offs", "outcome"],
  },
  {
    question:
      "How do you ensure the code you write is maintainable by others?",
    expectedConcepts: ["readability", "tests", "documentation", "review"],
  },
];
