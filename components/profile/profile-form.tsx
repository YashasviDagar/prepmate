"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/shared/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  ROLE_LABELS,
  ROLES,
} from "@/lib/domain/interview";
import { initialFormState } from "@/lib/forms";
import { updateProfileAction } from "@/lib/profile/actions";

export type ProfileFormValues = {
  name: string;
  targetRole?: string | null;
  experienceLevel?: string | null;
  preferredInterviewType?: string | null;
  skills: string[];
};

const NONE = "NONE";

export function ProfileForm({ values }: { values: ProfileFormValues }) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === "success" && state.message ? (
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" defaultValue={values.name} required />
        {state.fieldErrors?.name?.map((message) => (
          <p key={message} className="text-destructive text-xs">
            {message}
          </p>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="targetRole">Target role</Label>
          <Select name="targetRole" defaultValue={values.targetRole ?? NONE}>
            <SelectTrigger id="targetRole" className="w-full">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not set</SelectItem>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experienceLevel">Experience level</Label>
          <Select
            name="experienceLevel"
            defaultValue={values.experienceLevel ?? NONE}
          >
            <SelectTrigger id="experienceLevel" className="w-full">
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Not set</SelectItem>
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {EXPERIENCE_LEVEL_LABELS[level]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredInterviewType">Preferred interview type</Label>
        <Select
          name="preferredInterviewType"
          defaultValue={values.preferredInterviewType ?? NONE}
        >
          <SelectTrigger id="preferredInterviewType" className="w-full sm:w-1/2">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Not set</SelectItem>
            {INTERVIEW_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {INTERVIEW_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="skills">Skills</Label>
        <Input
          id="skills"
          name="skills"
          defaultValue={values.skills.join(", ")}
          placeholder="JavaScript, React, SQL"
        />
        <p className="text-muted-foreground text-xs">
          Comma-separated. Used to tailor recommendations.
        </p>
      </div>

      <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
    </form>
  );
}
