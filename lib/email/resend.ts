export interface ResendEmailAttachment {
  filename: string;
  /** Base64-encoded file contents for Resend. */
  content: string;
  content_id?: string;
}

interface ResendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string | string[];
  tags?: Array<{ name: string; value: string }>;
  attachments?: ResendEmailAttachment[];
}

interface ResendScheduleEmailInput extends ResendEmailInput {
  scheduledAt: Date;
}

interface ResendEmailResult {
  id: string;
}

function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function getResendFromAddress(): string {
  const email = process.env.RESEND_SENDER_EMAIL?.trim() || "support@vectordarts.app";
  const name = process.env.RESEND_SENDER_NAME?.trim() || "VectorOS";
  return `${name} <${email}>`;
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey());
}

async function postResendEmail(body: Record<string, unknown>): Promise<ResendEmailResult> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; name?: string }
    | null;

  if (!response.ok || !payload?.id) {
    const message = payload?.message || payload?.name || `Resend error (${response.status})`;
    throw new Error(message);
  }

  return { id: payload.id };
}

export async function sendResendEmail(input: ResendEmailInput): Promise<ResendEmailResult> {
  const replyTo = input.replyTo
    ? Array.isArray(input.replyTo)
      ? input.replyTo
      : [input.replyTo]
    : undefined;

  return postResendEmail({
    from: getResendFromAddress(),
    to: [input.to],
    subject: input.subject,
    html: input.html,
    reply_to: replyTo,
    tags: input.tags,
    attachments: input.attachments,
  });
}

export async function scheduleResendEmail(
  input: ResendScheduleEmailInput,
): Promise<ResendEmailResult> {
  return postResendEmail({
    from: getResendFromAddress(),
    to: [input.to],
    subject: input.subject,
    html: input.html,
    scheduled_at: input.scheduledAt.toISOString(),
    tags: input.tags,
    attachments: input.attachments,
  });
}

export async function cancelResendEmail(emailId: string): Promise<void> {
  const apiKey = getResendApiKey();

  if (!apiKey || !emailId.trim()) {
    return;
  }

  const response = await fetch(
    `https://api.resend.com/emails/${encodeURIComponent(emailId.trim())}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  // 404 / already-sent are fine; nothing left to cancel.
  if (response.ok || response.status === 404 || response.status === 422) {
    return;
  }

  const payload = (await response.json().catch(() => null)) as { message?: string } | null;
  const message = payload?.message || `Resend cancel error (${response.status})`;
  throw new Error(message);
}
