-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SOFTWARE_ENGINEER', 'FRONTEND_DEVELOPER', 'BACKEND_DEVELOPER', 'FULL_STACK_DEVELOPER', 'DATA_ANALYST', 'DATA_SCIENTIST', 'CYBERSECURITY_ANALYST', 'DEVOPS_ENGINEER', 'PRODUCT_MANAGER');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('TECHNICAL', 'HR', 'BEHAVIORAL', 'MIXED');

-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('PRACTICE', 'REALISTIC', 'RAPID_FIRE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TECHNICAL', 'HR', 'BEHAVIORAL', 'CONCEPTUAL', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('AI', 'QUESTION_BANK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "targetRole" "Role",
    "experienceLevel" "ExperienceLevel",
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredInterviewType" "InterviewType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "type" "InterviewType" NOT NULL,
    "mode" "InterviewMode" NOT NULL DEFAULT 'PRACTICE',
    "difficulty" "Difficulty" NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "InterviewStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DOUBLE PRECISION,
    "technicalScore" DOUBLE PRECISION,
    "communicationScore" DOUBLE PRECISION,
    "problemSolvingScore" DOUBLE PRECISION,
    "durationSec" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "expectedConcepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "parentQuestionId" TEXT,
    "source" "QuestionSource" NOT NULL DEFAULT 'AI',
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "inputMode" TEXT NOT NULL DEFAULT 'text',
    "score" DOUBLE PRECISION,
    "technicalScore" DOUBLE PRECISION,
    "completenessScore" DOUBLE PRECISION,
    "relevanceScore" DOUBLE PRECISION,
    "clarityScore" DOUBLE PRECISION,
    "communicationScore" DOUBLE PRECISION,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_performance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_bank" (
    "id" TEXT NOT NULL,
    "role" "Role",
    "category" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'TECHNICAL',
    "question" TEXT NOT NULL,
    "expectedConcepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "idealAnswerPoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" "QuestionSource" NOT NULL DEFAULT 'QUESTION_BANK',
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewId" TEXT,
    "summary" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "interviews_userId_createdAt_idx" ON "interviews"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "interview_questions_interviewId_idx" ON "interview_questions"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_questions_interviewId_order_key" ON "interview_questions"("interviewId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "answers_questionId_key" ON "answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_performance_userId_skill_key" ON "skill_performance"("userId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "question_bank_question_key" ON "question_bank"("question");

-- CreateIndex
CREATE INDEX "question_bank_category_difficulty_idx" ON "question_bank"("category", "difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "recommendations_interviewId_key" ON "recommendations"("interviewId");

-- CreateIndex
CREATE INDEX "recommendations_userId_createdAt_idx" ON "recommendations"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_parentQuestionId_fkey" FOREIGN KEY ("parentQuestionId") REFERENCES "interview_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers" ADD CONSTRAINT "answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_performance" ADD CONSTRAINT "skill_performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
