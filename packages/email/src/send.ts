import type { ReactElement } from "react";
import { resend } from "./client";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}

const DEFAULT_FROM = "Locker <noreply@locker.dev>";

export async function sendEmail({
  to,
  subject,
  react,
  from,
}: SendEmailOptions) {
  if (!resend) {
    console.warn(
      "RESEND_API_KEY is not set in the environment. Skipping sending email.",
    );
    return;
  }

  return await resend.emails.send({
    from: from ?? DEFAULT_FROM,
    to: typeof to === "string" ? [to] : to,
    subject,
    react,
  });
}
