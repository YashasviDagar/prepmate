import { describe, expect, it } from "vitest";

import {
  BEHAVIORAL_TOPICS,
  ROLE_TOPICS,
  revealsFeedbackImmediately,
  topicsForRole,
} from "@/lib/domain/interview";
import {
  InterviewMode,
  InterviewType,
  Role,
} from "@/lib/generated/prisma/enums";

describe("topicsForRole", () => {
  it("returns role topics for a technical interview", () => {
    expect(topicsForRole(Role.FRONTEND_DEVELOPER, InterviewType.TECHNICAL)).toEqual(
      ROLE_TOPICS[Role.FRONTEND_DEVELOPER],
    );
  });

  it("returns behavioral topics for HR interviews", () => {
    expect(topicsForRole(Role.BACKEND_DEVELOPER, InterviewType.HR)).toEqual(
      BEHAVIORAL_TOPICS,
    );
  });

  it("merges role and behavioral topics for mixed interviews", () => {
    const topics = topicsForRole(Role.DATA_ANALYST, InterviewType.MIXED);

    expect(topics).toContain("SQL");
    expect(topics).toContain("Communication");
  });
});

describe("revealsFeedbackImmediately", () => {
  it("reveals feedback in practice mode", () => {
    expect(revealsFeedbackImmediately(InterviewMode.PRACTICE)).toBe(true);
  });

  it("reveals feedback in rapid-fire mode", () => {
    expect(revealsFeedbackImmediately(InterviewMode.RAPID_FIRE)).toBe(true);
  });

  it("withholds feedback in realistic mode", () => {
    expect(revealsFeedbackImmediately(InterviewMode.REALISTIC)).toBe(false);
  });
});
