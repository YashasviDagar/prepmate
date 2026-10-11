"use client";

import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  INTERVIEW_MODES,
  INTERVIEW_MODE_DESCRIPTIONS,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_DESCRIPTIONS,
  INTERVIEW_TYPE_LABELS,
  MAX_QUESTION_COUNT,
  MIN_QUESTION_COUNT,
  QUESTION_COUNT_PRESETS,
  ROLE_LABELS,
  ROLES,
  topicsForRole,
} from "@/lib/domain/interview";
import {
  Difficulty,
  ExperienceLevel,
  InterviewMode,
  InterviewType,
  Role,
} from "@/lib/generated/prisma/enums";

export type InterviewConfigDefaults = {
  role: Role;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
};

export function InterviewConfigForm({
  defaults,
}: {
  defaults: InterviewConfigDefaults;
}) {
  const router = useRouter();

  const [role, setRole] = useState<Role>(defaults.role);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    defaults.experienceLevel,
  );
  const [type, setType] = useState<InterviewType>(defaults.interviewType);
  const [mode, setMode] = useState<InterviewMode>(InterviewMode.PRACTICE);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [questionCount, setQuestionCount] = useState(5);
  const [customCount, setCustomCount] = useState("");
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availableTopics = useMemo(
    () => topicsForRole(role, type),
    [role, type],
  );
  const [topics, setTopics] = useState<string[]>(availableTopics);

  function handleRoleChange(nextRole: Role) {
    setRole(nextRole);
    setTopics(topicsForRole(nextRole, type));
  }

  function handleTypeChange(nextType: InterviewType) {
    setType(nextType);
    setTopics(topicsForRole(role, nextType));
  }

  function toggleTopic(topic: string) {
    setTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic],
    );
  }

  function resolveQuestionCount(): number {
    if (!isCustomCount) return questionCount;
    const parsed = Number.parseInt(customCount, 10);
    if (Number.isNaN(parsed)) return 0;
    return parsed;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const count = resolveQuestionCount();
    if (count < MIN_QUESTION_COUNT || count > MAX_QUESTION_COUNT) {
      toast.error(
        `Choose between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT} questions.`,
      );
      return;
    }
    if (topics.length === 0) {
      toast.error("Select at least one topic.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          type,
          mode,
          difficulty,
          questionCount: count,
          topics,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(
          payload?.error?.message ?? "Could not create the interview.",
        );
      }

      const payload = (await response.json()) as { interview: { id: string } };
      router.push(`/interview/${payload.interview.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-3">
        <Label>Role</Label>
        <Select value={role} onValueChange={(value) => handleRoleChange(value as Role)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((item) => (
              <SelectItem key={item} value={item}>
                {ROLE_LABELS[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-3">
          <Label>Experience level</Label>
          <Select
            value={experienceLevel}
            onValueChange={(value) => setExperienceLevel(value as ExperienceLevel)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_LEVELS.map((item) => (
                <SelectItem key={item} value={item}>
                  {EXPERIENCE_LEVEL_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-3">
          <Label>Interview type</Label>
          <Select
            value={type}
            onValueChange={(value) => handleTypeChange(value as InterviewType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {INTERVIEW_TYPE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {INTERVIEW_TYPE_DESCRIPTIONS[type]}
          </p>
        </section>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="space-y-3">
          <Label>Mode</Label>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as InterviewMode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_MODES.map((item) => (
                <SelectItem key={item} value={item}>
                  {INTERVIEW_MODE_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {INTERVIEW_MODE_DESCRIPTIONS[mode]}
          </p>
        </section>

        <section className="space-y-3">
          <Label>Difficulty</Label>
          <Select
            value={difficulty}
            onValueChange={(value) => setDifficulty(value as Difficulty)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {DIFFICULTY_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      </div>

      <section className="space-y-3">
        <Label>Number of questions</Label>
        <div className="flex flex-wrap items-center gap-2">
          {QUESTION_COUNT_PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={
                !isCustomCount && questionCount === preset ? "default" : "outline"
              }
              onClick={() => {
                setIsCustomCount(false);
                setQuestionCount(preset);
              }}
            >
              {preset}
            </Button>
          ))}
          <Button
            type="button"
            variant={isCustomCount ? "default" : "outline"}
            onClick={() => setIsCustomCount(true)}
          >
            Custom
          </Button>
          {isCustomCount ? (
            <Input
              type="number"
              min={MIN_QUESTION_COUNT}
              max={MAX_QUESTION_COUNT}
              value={customCount}
              onChange={(event) => setCustomCount(event.target.value)}
              placeholder={`${MIN_QUESTION_COUNT}–${MAX_QUESTION_COUNT}`}
              className="w-24"
            />
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Topics</Label>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-xs"
            onClick={() =>
              setTopics(
                topics.length === availableTopics.length ? [] : availableTopics,
              )
            }
          >
            {topics.length === availableTopics.length
              ? "Clear all"
              : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {availableTopics.map((topic) => {
            const checked = topics.includes(topic);
            return (
              <label
                key={topic}
                className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleTopic(topic)}
                />
                {topic}
              </label>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          Topics adapt to the selected role and interview type.
        </p>
      </section>

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <SparklesIcon className="size-4" />
        )}
        {submitting ? "Preparing interview…" : "Start interview"}
      </Button>
    </form>
  );
}
