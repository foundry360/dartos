import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isSupportAccountTypeId } from "@/features/support/lib/support-account-types";
import { isSupportCategoryId } from "@/features/support/lib/support-categories";
import { sendSupportRequestEmail } from "@/lib/email/send-support-request";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  saveSupportRequest,
  updateSupportRequestEmailId,
  uploadSupportAttachment,
} from "@/lib/support/save-support-request";
import { isImageFile } from "@/utils/image-file";

export const runtime = "nodejs";

const MAX_SUBJECT = 120;
const MAX_MESSAGE = 5000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  if (!supabase || !admin) {
    return NextResponse.json({ error: "Support services are unavailable." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Your account has no email address." }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const category = String(formData.get("category") ?? "").trim();
  const accountType = String(formData.get("accountType") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const alternativeEmailRaw = String(formData.get("alternativeEmail") ?? "").trim().toLowerCase();
  const image = formData.get("image");

  if (!isSupportCategoryId(category)) {
    return NextResponse.json({ error: "Choose a valid support category." }, { status: 400 });
  }

  if (!isSupportAccountTypeId(accountType)) {
    return NextResponse.json({ error: "Choose a valid account type." }, { status: 400 });
  }

  if (!subject || subject.length > MAX_SUBJECT) {
    return NextResponse.json(
      { error: `Subject is required (max ${MAX_SUBJECT} characters).` },
      { status: 400 },
    );
  }

  if (!message || message.length > MAX_MESSAGE) {
    return NextResponse.json(
      { error: `Message is required (max ${MAX_MESSAGE} characters).` },
      { status: 400 },
    );
  }

  const alternativeEmail = alternativeEmailRaw || null;
  if (alternativeEmail && !isValidEmail(alternativeEmail)) {
    return NextResponse.json({ error: "Enter a valid alternative email address." }, { status: 400 });
  }

  let attachment:
    | {
        filename: string;
        content: string;
      }
    | null = null;
  let imagePath: string | null = null;
  let imageFilename: string | null = null;
  const requestId = randomUUID();

  if (image instanceof File && image.size > 0) {
    if (!isImageFile(image)) {
      return NextResponse.json(
        { error: "Attachment must be an image (PNG, JPG, GIF, or WebP)." },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be 4 MB or smaller." }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    attachment = {
      filename: image.name.trim() || "support-image.png",
      content: buffer.toString("base64"),
    };

    try {
      const uploaded = await uploadSupportAttachment(admin, user.id, requestId, image);
      imagePath = uploaded.path;
      imageFilename = uploaded.filename;
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Unable to upload support image.";
      return NextResponse.json({ error: messageText }, { status: 500 });
    }
  }

  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim()
      : null;

  try {
    await saveSupportRequest(admin, {
      id: requestId,
      userId: user.id,
      category,
      accountType,
      subject,
      message,
      userEmail: email,
      alternativeEmail,
      imagePath,
      imageFilename,
      resendEmailId: null,
    });
  } catch (error) {
    const messageText =
      error instanceof Error ? error.message : "Unable to save support request.";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }

  try {
    const result = await sendSupportRequestEmail({
      category,
      accountType,
      subject,
      message,
      userEmail: email,
      alternativeEmail,
      userName: displayName,
      userId: user.id,
      attachment,
    });

    if (result.status === "unavailable") {
      return NextResponse.json(
        {
          success: true,
          requestId,
          emailSent: false,
          error: result.reason,
        },
        { status: 201 },
      );
    }

    await updateSupportRequestEmailId(admin, requestId, result.emailId).catch(() => undefined);

    return NextResponse.json({
      success: true,
      requestId,
      emailId: result.emailId,
      emailSent: true,
    });
  } catch (error) {
    // Request is already saved; surface email failure without losing the ticket.
    const messageText =
      error instanceof Error ? error.message : "Support request saved, but email failed.";
    return NextResponse.json(
      {
        success: true,
        requestId,
        emailSent: false,
        error: messageText,
      },
      { status: 201 },
    );
  }
}
