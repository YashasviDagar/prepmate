"use client";

import { GitCompareIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DIFFICULTY_LABELS,
  INTERVIEW_MODE_LABELS,
  INTERVIEW_TYPE_LABELS,
  ROLE_LABELS,
} from "@/lib/domain/interview";
import { formatDuration, formatRelativeTime } from "@/lib/format";
import type { InterviewSummaryDto } from "@/lib/services/interview-service";

export function InterviewHistoryTable({
  interviews,
}: {
  interviews: InterviewSummaryDto[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const selectedInterviews = interviews.filter((interview) =>
    selected.includes(interview.id),
  );

  function toggleSelected(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }
      if (current.length >= 2) return [current[1]!, id];
      return [...current, id];
    });
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/interviews/${deleteId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        throw new Error("Delete failed");
      }
      toast.success("Interview deleted.");
      setSelected((current) => current.filter((id) => id !== deleteId));
      setDeleteId(null);
      router.refresh();
    } catch {
      toast.error("Could not delete that interview.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          Select up to two interviews to compare.
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={selected.length !== 2}
          onClick={() => setCompareOpen(true)}
        >
          <GitCompareIcon className="size-4" />
          Compare selected
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interviews.map((interview) => (
              <TableRow key={interview.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(interview.id)}
                    onCheckedChange={() => toggleSelected(interview.id)}
                    aria-label={`Select interview from ${ROLE_LABELS[interview.role]}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {ROLE_LABELS[interview.role]}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {INTERVIEW_TYPE_LABELS[interview.type]}
                  <span className="text-xs">
                    {" "}
                    · {INTERVIEW_MODE_LABELS[interview.mode]}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatRelativeTime(interview.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDuration(interview.durationSec)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {interview.answeredQuestions}
                </TableCell>
                <TableCell>
                  {interview.score != null ? (
                    <Badge>{interview.score.toFixed(0)}/100</Badge>
                  ) : (
                    <Badge variant="secondary">
                      {interview.status === "IN_PROGRESS"
                        ? "In progress"
                        : "No score"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {DIFFICULTY_LABELS[interview.difficulty]}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link
                        href={
                          interview.status === "COMPLETED"
                            ? `/interview/${interview.id}/results`
                            : `/interview/${interview.id}`
                        }
                      >
                        {interview.status === "COMPLETED" ? "View" : "Resume"}
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete interview"
                      onClick={() => setDeleteId(interview.id)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={deleteId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the interview, its questions, answers and
              feedback. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compare interviews</DialogTitle>
            <DialogDescription>
              Side-by-side comparison of the two selected interviews.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            {selectedInterviews.map((interview) => (
              <div key={interview.id} className="space-y-3 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">
                    {ROLE_LABELS[interview.role]}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {INTERVIEW_TYPE_LABELS[interview.type]} ·{" "}
                    {DIFFICULTY_LABELS[interview.difficulty]}
                  </p>
                </div>
                <dl className="space-y-1.5 text-sm">
                  <Row label="Score" value={interview.score?.toFixed(0) ?? "—"} />
                  <Row
                    label="Questions"
                    value={interview.answeredQuestions.toString()}
                  />
                  <Row
                    label="Duration"
                    value={formatDuration(interview.durationSec)}
                  />
                  <Row
                    label="Date"
                    value={formatRelativeTime(interview.createdAt)}
                  />
                </dl>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/interview/${interview.id}/results`}>
                    View full results
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
