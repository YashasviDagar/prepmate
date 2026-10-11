import {
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewType,
  QuestionType,
  Role,
} from "@/lib/generated/prisma/enums";

export const ROLES = Object.values(Role) as Role[];

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SOFTWARE_ENGINEER]: "Software Engineer",
  [Role.FRONTEND_DEVELOPER]: "Frontend Developer",
  [Role.BACKEND_DEVELOPER]: "Backend Developer",
  [Role.FULL_STACK_DEVELOPER]: "Full Stack Developer",
  [Role.DATA_ANALYST]: "Data Analyst",
  [Role.DATA_SCIENTIST]: "Data Scientist",
  [Role.CYBERSECURITY_ANALYST]: "Cybersecurity Analyst",
  [Role.DEVOPS_ENGINEER]: "DevOps Engineer",
  [Role.PRODUCT_MANAGER]: "Product Manager",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.SOFTWARE_ENGINEER]: "Generalist coding, algorithms and system fundamentals.",
  [Role.FRONTEND_DEVELOPER]: "UI engineering, browser APIs and web performance.",
  [Role.BACKEND_DEVELOPER]: "APIs, databases, scalability and service design.",
  [Role.FULL_STACK_DEVELOPER]: "End-to-end product engineering across the stack.",
  [Role.DATA_ANALYST]: "SQL, reporting, dashboards and analytical thinking.",
  [Role.DATA_SCIENTIST]: "Statistics, machine learning and experimentation.",
  [Role.CYBERSECURITY_ANALYST]: "Threats, hardening, incident response and risk.",
  [Role.DEVOPS_ENGINEER]: "CI/CD, cloud infrastructure and reliability.",
  [Role.PRODUCT_MANAGER]: "Discovery, prioritisation, metrics and communication.",
};

export const TOPIC_CATALOG = [
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Databases",
  "DSA",
  "Operating Systems",
  "Computer Networks",
  "OOP",
  "System Design",
  "Git",
  "Cloud",
  "SQL",
  "Python",
  "Statistics",
  "Machine Learning",
  "Data Visualization",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "Linux",
  "Monitoring",
  "Networking",
  "Cryptography",
  "Threat Modeling",
  "Incident Response",
  "Product Strategy",
  "User Research",
  "Analytics",
  "Communication",
  "Teamwork",
  "Conflict Resolution",
  "Leadership",
  "Time Management",
] as const;

export type Topic = (typeof TOPIC_CATALOG)[number];

export const ROLE_TOPICS: Record<Role, string[]> = {
  [Role.SOFTWARE_ENGINEER]: [
    "DSA",
    "OOP",
    "Operating Systems",
    "Computer Networks",
    "Databases",
    "System Design",
    "Git",
  ],
  [Role.FRONTEND_DEVELOPER]: [
    "JavaScript",
    "React",
    "Next.js",
    "Operating Systems",
    "Git",
  ],
  [Role.BACKEND_DEVELOPER]: [
    "Node.js",
    "Databases",
    "System Design",
    "Computer Networks",
    "Cloud",
    "Git",
  ],
  [Role.FULL_STACK_DEVELOPER]: [
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Databases",
    "System Design",
    "Git",
  ],
  [Role.DATA_ANALYST]: [
    "SQL",
    "Databases",
    "Python",
    "Statistics",
    "Data Visualization",
  ],
  [Role.DATA_SCIENTIST]: [
    "Python",
    "Statistics",
    "Machine Learning",
    "SQL",
    "Data Visualization",
  ],
  [Role.CYBERSECURITY_ANALYST]: [
    "Networking",
    "Operating Systems",
    "Cryptography",
    "Threat Modeling",
    "Incident Response",
    "Cloud",
  ],
  [Role.DEVOPS_ENGINEER]: [
    "Cloud",
    "CI/CD",
    "Docker",
    "Kubernetes",
    "Linux",
    "Networking",
    "Monitoring",
  ],
  [Role.PRODUCT_MANAGER]: [
    "Product Strategy",
    "User Research",
    "Analytics",
    "Communication",
    "Leadership",
  ],
};

export const BEHAVIORAL_TOPICS = [
  "Communication",
  "Teamwork",
  "Conflict Resolution",
  "Leadership",
  "Time Management",
];

export const EXPERIENCE_LEVELS = Object.values(ExperienceLevel) as ExperienceLevel[];

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  [ExperienceLevel.BEGINNER]: "Beginner",
  [ExperienceLevel.INTERMEDIATE]: "Intermediate",
  [ExperienceLevel.ADVANCED]: "Advanced",
};

export const EXPERIENCE_LEVEL_DESCRIPTIONS: Record<ExperienceLevel, string> = {
  [ExperienceLevel.BEGINNER]: "0–1 years, learning fundamentals.",
  [ExperienceLevel.INTERMEDIATE]: "1–4 years, comfortable building features.",
  [ExperienceLevel.ADVANCED]: "4+ years, design and lead systems.",
};

export const INTERVIEW_TYPES = Object.values(InterviewType) as InterviewType[];

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  [InterviewType.TECHNICAL]: "Technical",
  [InterviewType.HR]: "HR",
  [InterviewType.BEHAVIORAL]: "Behavioral",
  [InterviewType.MIXED]: "Mixed",
};

export const INTERVIEW_TYPE_DESCRIPTIONS: Record<InterviewType, string> = {
  [InterviewType.TECHNICAL]: "Concept and problem-solving questions.",
  [InterviewType.HR]: "Motivation, fit and career questions.",
  [InterviewType.BEHAVIORAL]: "Situational and past-experience questions.",
  [InterviewType.MIXED]: "A blend of technical, HR and behavioral.",
};

export const INTERVIEW_MODES = Object.values(InterviewMode) as InterviewMode[];

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  [InterviewMode.PRACTICE]: "Practice",
  [InterviewMode.REALISTIC]: "Realistic",
  [InterviewMode.RAPID_FIRE]: "Rapid Fire",
};

export const INTERVIEW_MODE_DESCRIPTIONS: Record<InterviewMode, string> = {
  [InterviewMode.PRACTICE]: "Feedback and scores after every question.",
  [InterviewMode.REALISTIC]: "No hints or scores until the full report.",
  [InterviewMode.RAPID_FIRE]: "Short questions with a strict time limit.",
};

export const DIFFICULTIES = Object.values(Difficulty) as Difficulty[];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  [Difficulty.EASY]: "Easy",
  [Difficulty.MEDIUM]: "Medium",
  [Difficulty.HARD]: "Hard",
};

export const QUESTION_TYPES = Object.values(QuestionType) as QuestionType[];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.TECHNICAL]: "Technical",
  [QuestionType.HR]: "HR",
  [QuestionType.BEHAVIORAL]: "Behavioral",
  [QuestionType.CONCEPTUAL]: "Conceptual",
  [QuestionType.FOLLOW_UP]: "Follow-up",
};

export const QUESTION_COUNT_PRESETS = [5, 10, 15] as const;
export const MIN_QUESTION_COUNT = 3;
export const MAX_QUESTION_COUNT = 30;

export const QUESTION_BANK_CATEGORIES = [
  "DSA",
  "OOP",
  "DBMS",
  "Operating Systems",
  "Computer Networks",
  "System Design",
  "JavaScript",
  "React",
  "Node.js",
  "Behavioral",
  "HR",
] as const;

export const RAPID_FIRE_SECONDS_PER_QUESTION = 60;

/** Practice and rapid-fire modes reveal per-question evaluation immediately. */
export function revealsFeedbackImmediately(mode: InterviewMode): boolean {
  return mode === InterviewMode.PRACTICE || mode === InterviewMode.RAPID_FIRE;
}

export function topicsForRole(
  role: Role,
  type: InterviewType,
): string[] {
  if (type === InterviewType.HR || type === InterviewType.BEHAVIORAL) {
    return BEHAVIORAL_TOPICS;
  }
  if (type === InterviewType.MIXED) {
    return [...ROLE_TOPICS[role], ...BEHAVIORAL_TOPICS];
  }
  return ROLE_TOPICS[role];
}
