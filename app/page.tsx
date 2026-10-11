import {
  ArrowRightIcon,
  BarChart3Icon,
  BrainCircuitIcon,
  GaugeIcon,
  ListChecksIcon,
  MessagesSquareIcon,
  SparklesIcon,
  TargetIcon,
  WandSparklesIcon,
} from "lucide-react";
import Link from "next/link";

import { SiteHeader } from "@/components/shared/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES } from "@/lib/domain/interview";

const FEATURES = [
  {
    icon: WandSparklesIcon,
    title: "AI-generated questions",
    description:
      "Questions are written for your exact role, experience level and topics — never a static list.",
  },
  {
    icon: ListChecksIcon,
    title: "Technical interviews",
    description:
      "DSA, system design, databases, OS, networks and language-specific depth.",
  },
  {
    icon: MessagesSquareIcon,
    title: "HR & behavioral interviews",
    description:
      "Structured behavioral questions with guidance on the STAR approach.",
  },
  {
    icon: GaugeIcon,
    title: "Real-time feedback",
    description:
      "Practice mode scores every answer and shows exactly what to improve.",
  },
  {
    icon: BarChart3Icon,
    title: "Performance analytics",
    description:
      "Track scores over time, per topic, with charts that surface weak spots.",
  },
  {
    icon: TargetIcon,
    title: "Personalised recommendations",
    description:
      "Get an ordered study plan built from your weakest topics.",
  },
];

const STEPS = [
  { title: "Choose your role", detail: "Pick a role, experience level and interview type." },
  { title: "Start the interview", detail: "The AI asks questions one at a time, like a real interview." },
  { title: "Answer questions", detail: "Type your answer or use voice mode with speech-to-text." },
  { title: "Receive AI feedback", detail: "Practice mode reveals scoring and actionable feedback." },
  { title: "Improve and repeat", detail: "Follow your recommendations and track progress over time." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <Badge variant="secondary" className="mb-6">
            <SparklesIcon className="size-3" />
            AI-powered interview practice
          </Badge>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            Practice Smarter.
            <br />
            Interview Better.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-2xl text-lg text-pretty">
            AI-powered mock interviews built for real-world preparation. Get
            role-specific questions, adaptive difficulty and honest feedback on
            every answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Interview
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Explore Features</a>
            </Button>
          </div>
          <p className="text-muted-foreground mt-6 text-xs">
            No credit card. Questions and scoring are AI-driven heuristics, not a
            validated assessment.
          </p>
        </section>

        <section
          id="features"
          className="border-t bg-muted/30 scroll-mt-16"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Everything you need to prepare
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              A complete practice loop: configure, interview, get scored, and
              improve.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader>
                    <feature.icon className="text-primary size-5" />
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              How it works
            </h2>
            <ol className="mt-10 grid gap-5 md:grid-cols-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="space-y-2">
                  <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-full text-sm font-medium">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-medium">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="roles" className="border-t bg-muted/30 scroll-mt-16">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-20">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Supported roles
            </h2>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Each role has its own topic set, difficulty curve and question
              style. More roles are easy to add.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ROLES.map((role) => (
                <Card key={role}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {ROLE_LABELS[role]}
                    </CardTitle>
                    <CardDescription>{ROLE_DESCRIPTIONS[role]}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-6 md:py-24">
          <div className="flex flex-col items-start gap-6 rounded-2xl border p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to run your first mock interview?
              </h2>
              <p className="text-muted-foreground max-w-xl">
                It takes about a minute to set up and you get a full report at
                the end.
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">Create account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-4 py-8 text-xs md:flex-row md:items-center md:px-6">
          <span className="flex items-center gap-2">
            <BrainCircuitIcon className="size-4" />
            InterviewPrep
          </span>
          <span className="max-w-2xl">
            Feedback is generated by an AI heuristic. It does not measure
            personality, confidence as a trait, employability or hiring
            potential.
          </span>
        </div>
      </footer>
    </div>
  );
}
