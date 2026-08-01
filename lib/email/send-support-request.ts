import {
  getSupportAccountTypeLabel,
  type SupportAccountTypeId,
} from "@/features/support/lib/support-account-types";
import {
  getSupportCategoryLabel,
  type SupportCategoryId,
} from "@/features/support/lib/support-categories";
import {
  isResendConfigured,
  sendResendEmail,
  type ResendEmailAttachment,
} from "@/lib/email/resend";

/** Inbox for inbound support tickets (separate from the Resend From address). */
const SUPPORT_INBOX =
  process.env.SUPPORT_INBOX_EMAIL?.trim() || "support@vectordarts.app";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface SupportRequestInput {
  category: SupportCategoryId;
  accountType: SupportAccountTypeId;
  subject: string;
  message: string;
  userEmail: string;
  alternativeEmail: string | null;
  userName: string | null;
  userId: string;
  attachment?: ResendEmailAttachment | null;
}

export type SendSupportRequestResult =
  | { status: "sent"; emailId: string }
  | { status: "unavailable"; reason: string };

function renderSupportRequestHtml(input: SupportRequestInput): string {
  const categoryLabel = getSupportCategoryLabel(input.category);
  const accountTypeLabel = getSupportAccountTypeLabel(input.accountType);
  const name = input.userName?.trim() || "Unknown";
  const altEmail = input.alternativeEmail?.trim() || null;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Support request</title></head>
<body style="margin:0;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1410;color:#e8eee4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#1a211c;border:1px solid #2d3830;border-radius:12px;">
    <tr><td style="padding:24px 28px;">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8aa07a;">VectorOS Support</p>
      <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#f4f7f1;">${escapeHtml(input.subject)}</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;font-size:14px;line-height:1.5;color:#c5d0bc;">
        <tr><td style="padding:4px 0;"><strong style="color:#e8eee4;">Category:</strong> ${escapeHtml(categoryLabel)}</td></tr>
        <tr><td style="padding:4px 0;"><strong style="color:#e8eee4;">Account type:</strong> ${escapeHtml(accountTypeLabel)}</td></tr>
        <tr><td style="padding:4px 0;"><strong style="color:#e8eee4;">From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(input.userEmail)}&gt;</td></tr>
        ${
          altEmail
            ? `<tr><td style="padding:4px 0;"><strong style="color:#e8eee4;">Alternative email:</strong> ${escapeHtml(altEmail)}</td></tr>`
            : ""
        }
        <tr><td style="padding:4px 0;"><strong style="color:#e8eee4;">User ID:</strong> ${escapeHtml(input.userId)}</td></tr>
        ${
          input.attachment
            ? `<tr><td style="padding:4px 0;"><strong style="color:#e8eee4;">Attachment:</strong> ${escapeHtml(input.attachment.filename)}</td></tr>`
            : ""
        }
      </table>
      <div style="padding:16px 18px;border-radius:10px;background:#121812;border:1px solid #2d3830;font-size:15px;line-height:1.55;color:#e8eee4;white-space:pre-wrap;">${escapeHtml(input.message)}</div>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendSupportRequestEmail(
  input: SupportRequestInput,
): Promise<SendSupportRequestResult> {
  if (!isResendConfigured()) {
    return { status: "unavailable", reason: "Resend is not configured." };
  }

  const categoryLabel = getSupportCategoryLabel(input.category);
  const replyTo = input.alternativeEmail?.trim() || input.userEmail;
  const { id } = await sendResendEmail({
    to: SUPPORT_INBOX,
    replyTo,
    subject: `[${categoryLabel}] ${input.subject}`,
    html: renderSupportRequestHtml(input),
    attachments: input.attachment ? [input.attachment] : undefined,
    tags: [
      { name: "category", value: "support" },
      { name: "support_type", value: input.category },
    ],
  });

  return { status: "sent", emailId: id };
}
