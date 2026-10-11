"use client";

import { Loader2Icon, SearchIcon, SparklesIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  QUESTION_TYPE_LABELS,
} from "@/lib/domain/interview";
import { Difficulty } from "@/lib/generated/prisma/enums";
import type { QuestionBankItemDto } from "@/lib/services/question-bank-service";

const ALL = "ALL";

export function QuestionBankBrowser({
  initialItems,
  categories,
}: {
  initialItems: QuestionBankItemDto[];
  categories: string[];
}) {
  const [items, setItems] = useState(initialItems);
  const [category, setCategory] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [genCategory, setGenCategory] = useState(categories[0] ?? "DSA");
  const [genDifficulty, setGenDifficulty] = useState<Difficulty>(
    Difficulty.MEDIUM,
  );
  const [generating, setGenerating] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== ALL && item.category !== category) return false;
      if (difficulty !== ALL && item.difficulty !== difficulty) return false;
      if (
        term &&
        !item.question.toLowerCase().includes(term) &&
        !item.topic.toLowerCase().includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [items, category, difficulty, search]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await fetch("/api/question-bank/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: genCategory, difficulty: genDifficulty }),
      });

      const payload = (await response.json().catch(() => null)) as {
        item?: QuestionBankItemDto;
        error?: { message?: string };
      } | null;

      if (!response.ok || !payload?.item) {
        throw new Error(payload?.error?.message ?? "Generation failed.");
      }

      setItems((current) => {
        if (current.some((item) => item.id === payload.item!.id)) {
          return current;
        }
        return [payload.item!, ...current];
      });
      setDialogOpen(false);
      toast.success("Question added to the bank (pending validation).");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not generate a question.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              id="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions or topics"
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Difficulty</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All levels</SelectItem>
              {DIFFICULTIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {DIFFICULTY_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          <SparklesIcon className="size-4" />
          Generate question
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        {filtered.length} question{filtered.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
            No questions match these filters.
          </p>
        ) : (
          filtered.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge variant="outline">
                    {DIFFICULTY_LABELS[item.difficulty]}
                  </Badge>
                  <Badge variant="outline">
                    {QUESTION_TYPE_LABELS[item.questionType]}
                  </Badge>
                  {!item.validated ? (
                    <Badge variant="destructive">Pending validation</Badge>
                  ) : null}
                </div>
                <CardTitle className="text-sm leading-relaxed font-normal">
                  {item.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    Expected concepts
                  </p>
                  <p className="text-muted-foreground">
                    {item.expectedConcepts.join(", ") || "—"}
                  </p>
                </div>
                {item.idealAnswerPoints.length > 0 ? (
                  <div>
                    <p className="text-muted-foreground text-xs font-medium">
                      Ideal answer points
                    </p>
                    <ul className="text-muted-foreground list-disc space-y-0.5 pl-5">
                      {item.idealAnswerPoints.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate a question</DialogTitle>
            <DialogDescription>
              The AI writes one question for the selected category and
              difficulty. It is stored as pending validation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gen-category">Category</Label>
              <Select value={genCategory} onValueChange={setGenCategory}>
                <SelectTrigger id="gen-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-difficulty">Difficulty</Label>
              <Select
                value={genDifficulty}
                onValueChange={(value) => setGenDifficulty(value as Difficulty)}
              >
                <SelectTrigger id="gen-difficulty" className="w-full">
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
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating}
            >
              {generating ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <SparklesIcon className="size-4" />
              )}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
