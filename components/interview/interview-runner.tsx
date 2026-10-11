"use client";

import {
  ArrowRightIcon,
  ClockIcon,
  Loader2Icon,
  MicIcon,
  SkipForwardIcon,
  SquareIcon,
  Volume2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { FeedbackPanel } from "@/components/interview/feedback-panel";
import { RapidFireCountdown } from "@/components/interview/rapid-fire-countdown";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerEvaluation } from "@/lib/ai/types";
import { DIFFICULTY_LABELS, INTERVIEW_MODE_LABELS } from "@/lib/domain/interview";
import { formatClock } from "@/lib/format";
import type { InterviewStateDto } from "@/lib/services/interview-service";
import {
  createSpeechRecognition,
  extractTranscript,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speak,
  speechErrorMessage,
  stopSpeaking,
  type SpeechRecognitionLike,
} from "@/lib/voice/speech";

type ApiError = { code: string; message: string; retryable: boolean };
type InterviewResponse = {
  interview?: InterviewStateDto;
  error?: ApiError;
};

export function InterviewRunner({
  initialState,
}: {
  initialState: InterviewStateDto;
}) {
  const router = useRouter();

  const [state, setState] = useState(initialState);
  const [answer, setAnswer] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastEvaluation, setLastEvaluation] = useState<{
    questionId: string;
    evaluation: AnswerEvaluation;
  } | null>(null);
  const [now, setNow] = useState(0);
  const [recording, setRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");

  const currentQuestion = state.progress.currentQuestion;
  const questionId = currentQuestion?.id ?? null;

  const startedAtMs = new Date(state.startedAt).getTime();
  const elapsed =
    now === 0 ? 0 : Math.max(0, Math.round((now - startedAtMs) / 1000));

  // Wall-clock ticker. State updates happen inside the interval callback.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Release speech resources on unmount.
  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      stopSpeaking();
    },
    [],
  );

  const goToResults = useCallback(
    (interviewId: string) => {
      router.push(`/interview/${interviewId}/results`);
    },
    [router],
  );

  const ensureQuestion = useCallback(
    async (interviewId: string) => {
      setSubmitting(true);
      try {
        const response = await fetch(`/api/interviews/${interviewId}/next`, {
          method: "POST",
        });
        const payload = (await response.json().catch(() => null)) as
          | InterviewResponse
          | null;

        if (!response.ok || !payload?.interview) {
          setError(
            payload?.error ?? {
              code: "AI_UNAVAILABLE",
              message: "The AI interviewer is temporarily unavailable.",
              retryable: true,
            },
          );
          return;
        }

        setState(payload.interview);
        if (payload.interview.status === "COMPLETED") {
          goToResults(interviewId);
        }
      } catch {
        setError({
          code: "NETWORK",
          message: "Network error. Your progress is saved.",
          retryable: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [goToResults],
  );

  const submit = useCallback(
    async (options: { skip?: boolean } = {}) => {
      const question = state.progress.currentQuestion;
      if (!question) return;

      const text = answer.trim();
      if (!options.skip && text.length === 0) {
        toast.error("Write or record an answer first.");
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/interviews/${state.id}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: question.id,
            answer: options.skip ? undefined : text,
            inputMode: options.skip ? undefined : inputMode,
            skip: options.skip ?? false,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | InterviewResponse
          | null;

        if (!response.ok || !payload?.interview) {
          setError(
            payload?.error ?? {
              code: "INTERNAL",
              message: "Something went wrong. Your progress is saved.",
              retryable: true,
            },
          );
          return;
        }

        const next = payload.interview;
        const answered = next.questions.find((item) => item.id === question.id);
        setLastEvaluation(
          next.revealFeedback && answered?.answer?.feedback
            ? { questionId: question.id, evaluation: answered.answer.feedback }
            : null,
        );

        setAnswer("");
        setInterimText("");
        setState(next);

        if (next.status === "COMPLETED") {
          goToResults(next.id);
          return;
        }

        if (!next.progress.currentQuestion) {
          await ensureQuestion(next.id);
        }
      } catch {
        setError({
          code: "NETWORK",
          message: "Network error. Your progress is saved.",
          retryable: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [answer, ensureQuestion, goToResults, inputMode, state.id, state.progress.currentQuestion],
  );

  const refreshState = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/interviews/${state.id}`);
      const payload = (await response.json().catch(() => null)) as
        | InterviewResponse
        | null;

      if (!response.ok || !payload?.interview) {
        setError(
          payload?.error ?? {
            code: "INTERNAL",
            message: "Could not reload the interview.",
            retryable: true,
          },
        );
        return;
      }

      const next = payload.interview;
      setState(next);

      if (next.status === "COMPLETED") {
        goToResults(next.id);
        return;
      }
      if (!next.progress.currentQuestion) {
        await ensureQuestion(next.id);
      }
    } catch {
      setError({
        code: "NETWORK",
        message: "Network error. Your progress is saved.",
        retryable: true,
      });
    } finally {
      setSubmitting(false);
    }
  }, [ensureQuestion, goToResults, state.id]);

  function toggleRecording() {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    finalTranscriptRef.current = answer ? `${answer.trim()} ` : "";
    recognitionRef.current = recognition;
    setInputMode("voice");
    setRecording(true);
    setVoiceError(null);
    setInterimText("");

    recognition.onresult = (event) => {
      const { finalText, interimText: interim } = extractTranscript(event);
      if (finalText) {
        finalTranscriptRef.current = `${finalTranscriptRef.current}${finalText}`;
        setAnswer(finalTranscriptRef.current.replace(/\s+/g, " ").trimStart());
      }
      setInterimText(interim);
    };
    recognition.onerror = (event) => {
      setVoiceError(speechErrorMessage(event.error));
      setRecording(false);
    };
    recognition.onend = () => {
      setRecording(false);
      setInterimText("");
    };

    try {
      recognition.start();
    } catch {
      setVoiceError("Could not start recording. Try again.");
      setRecording(false);
    }
  }

  function handleReadAloud() {
    if (!currentQuestion) return;
    if (!speak(currentQuestion.question)) {
      toast.error("Text-to-speech is not supported in this browser.");
    }
  }

  const progressPercentage =
    state.questionCount > 0
      ? (state.progress.answeredPrimary / state.questionCount) * 100
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{INTERVIEW_MODE_LABELS[state.mode]}</Badge>
            <Badge variant="outline">{DIFFICULTY_LABELS[state.difficulty]}</Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-4 text-sm">
            {state.secondsPerQuestion != null && questionId ? (
              <RapidFireCountdown
                key={questionId}
                seconds={state.secondsPerQuestion}
                onExpire={() => void submit({ skip: true })}
              />
            ) : null}
            <span className="flex items-center gap-1.5 tabular-nums">
              <ClockIcon className="size-4" />
              {formatClock(elapsed)}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              Question{" "}
              {Math.min(state.progress.currentPrimary, state.progress.totalPrimary)}{" "}
              of {state.progress.totalPrimary}
              {state.progress.isFollowUp ? " · follow-up" : ""}
            </span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} />
        </div>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>The AI interviewer is unavailable</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error.message} Your progress has been saved.</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={submitting}
              onClick={() => void refreshState()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {lastEvaluation ? (
        <div className="space-y-4">
          <FeedbackPanel evaluation={lastEvaluation.evaluation} />
          <Button type="button" onClick={() => setLastEvaluation(null)}>
            Continue to next question
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      ) : currentQuestion ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                {currentQuestion.topic} ·{" "}
                {DIFFICULTY_LABELS[currentQuestion.difficulty]}
              </p>
            </div>
            {isSpeechSynthesisSupported() ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Read question aloud"
                onClick={handleReadAloud}
              >
                <Volume2Icon className="size-4" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="answer" className="text-sm font-medium">
                Your answer
              </label>
              <Textarea
                id="answer"
                value={answer + (interimText ? ` ${interimText}` : "")}
                onChange={(event) => {
                  finalTranscriptRef.current = event.target.value;
                  setAnswer(event.target.value);
                }}
                placeholder="Type your answer…"
                rows={7}
                disabled={submitting}
              />
              {recording ? (
                <p className="text-destructive flex items-center gap-2 text-xs">
                  <span className="size-2 animate-pulse rounded-full bg-current" />
                  Recording — speak now. Audio is not stored; only the transcript
                  is used.
                </p>
              ) : null}
              {interimText ? (
                <p className="text-muted-foreground text-xs italic">
                  {interimText}
                </p>
              ) : null}
              {voiceError ? (
                <p className="text-destructive text-xs">{voiceError}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isSpeechRecognitionSupported() ? (
                <Button
                  type="button"
                  variant={recording ? "destructive" : "outline"}
                  onClick={toggleRecording}
                  disabled={submitting}
                >
                  {recording ? (
                    <>
                      <SquareIcon className="size-4" /> Stop recording
                    </>
                  ) : (
                    <>
                      <MicIcon className="size-4" /> Record answer
                    </>
                  )}
                </Button>
              ) : null}

              <div className="flex-1" />

              <Button
                type="button"
                variant="ghost"
                onClick={() => void submit({ skip: true })}
                disabled={submitting}
              >
                <SkipForwardIcon className="size-4" />
                Skip
              </Button>

              <Button
                type="button"
                onClick={() => void submit()}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                {submitting ? "Evaluating…" : "Submit answer"}
              </Button>
            </div>

            {!state.revealFeedback ? (
              <p className="text-muted-foreground text-xs">
                Realistic mode: scores and feedback are withheld until the final
                report.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="text-muted-foreground flex items-center justify-center gap-3 py-10 text-sm">
            {submitting ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Preparing the next question…
              </>
            ) : (
              "This interview has no further questions."
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
