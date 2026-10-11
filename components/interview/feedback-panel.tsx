import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  ListOrderedIcon,
} from "lucide-react";

import { ScoreBar } from "@/components/shared/score-bar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnswerEvaluation } from "@/lib/ai/types";

export function FeedbackPanel({
  evaluation,
}: {
  evaluation: AnswerEvaluation;
}) {
  const overallTone =
    evaluation.score >= 7.5
      ? "default"
      : evaluation.score >= 5
        ? "secondary"
        : "destructive";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base">Answer feedback</CardTitle>
        <Badge variant={overallTone}>{evaluation.score.toFixed(1)} / 10</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <ScoreBar label="Technical correctness" value={evaluation.technicalScore} />
          <ScoreBar label="Completeness" value={evaluation.completenessScore} />
          <ScoreBar label="Relevance" value={evaluation.relevanceScore} />
          <ScoreBar label="Clarity" value={evaluation.clarityScore} />
          <ScoreBar label="Communication" value={evaluation.communicationScore} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2Icon className="text-primary size-4" />
              What you did well
            </h3>
            <ul className="space-y-1 text-sm">
              {evaluation.well.map((item) => (
                <li key={item} className="text-muted-foreground">
                  ✓ {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <AlertCircleIcon className="text-destructive size-4" />
              What could improve
            </h3>
            <ul className="space-y-1 text-sm">
              {evaluation.improve.map((item) => (
                <li key={item} className="text-muted-foreground">
                  • {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <ListOrderedIcon className="size-4" />
            Better answer structure
          </h3>
          <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
            {evaluation.structure.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium">Model answer</h3>
          <p className="text-muted-foreground text-sm">
            {evaluation.modelAnswer}
          </p>
        </section>

        {evaluation.deliveryNote ? (
          <p className="text-muted-foreground flex items-start gap-2 text-xs">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
            Delivery (observable only): {evaluation.deliveryNote}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
