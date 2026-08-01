import "server-only";
import { Resend } from "resend";

const FROM_ADDRESS = "AlphasAxis <notifications@alphasaxis.com>";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Fire-and-forget notification email. Never throws — a failed email should
 * never block the underlying action (e.g. assigning a case). Logs instead.
 */
export async function sendNotificationEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.error("RESEND_API_KEY not configured — skipping email:", subject);
    return;
  }

  try {
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  } catch (err) {
    console.error("Failed to send email:", subject, err);
  }
}
