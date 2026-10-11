/**
 * Transactional email via the Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email).
 * Enabled when both RESEND_API_KEY and EMAIL_FROM are set; otherwise sending is
 * a no-op and callers fall back to their non-email behaviour.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Returns true when the email was accepted by the provider. */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Reset your InterviewPrep password",
      text: [
        "We received a request to reset your InterviewPrep password.",
        "",
        `Reset it here (valid for 30 minutes): ${resetLink}`,
        "",
        "If you didn't request this, you can ignore this email.",
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Email provider responded with ${response.status}`);
  }
  return true;
}
