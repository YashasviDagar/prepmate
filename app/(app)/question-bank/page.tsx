import { LibraryIcon } from "lucide-react";
import type { Metadata } from "next";

import { QuestionBankBrowser } from "@/components/question-bank/question-bank-browser";
import { EmptyState } from "@/components/shared/empty-state";
import { requireUser } from "@/lib/auth/guards";
import {
  listQuestionBank,
  listQuestionBankCategories,
} from "@/lib/services/question-bank-service";

export const metadata: Metadata = { title: "Question bank" };

export default async function QuestionBankPage() {
  await requireUser();

  const [items, categories] = await Promise.all([
    listQuestionBank(),
    listQuestionBankCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Question bank</h1>
        <p className="text-muted-foreground text-sm">
          A curated library of practice questions with expected concepts and
          ideal answer points.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={LibraryIcon}
          title="The question bank is empty"
          description="Run the database seed to load the starter question bank, or generate a question with AI."
        />
      ) : (
        <QuestionBankBrowser initialItems={items} categories={categories} />
      )}
    </div>
  );
}
