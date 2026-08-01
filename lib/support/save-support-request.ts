import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupportAccountTypeId } from "@/features/support/lib/support-account-types";
import type { SupportCategoryId } from "@/features/support/lib/support-categories";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = SupabaseClient<Database>;

export interface SaveSupportRequestInput {
  id: string;
  userId: string;
  category: SupportCategoryId;
  accountType: SupportAccountTypeId;
  subject: string;
  message: string;
  userEmail: string;
  alternativeEmail: string | null;
  imagePath: string | null;
  imageFilename: string | null;
  resendEmailId: string | null;
}

export async function uploadSupportAttachment(
  admin: AdminClient,
  userId: string,
  requestId: string,
  file: File,
): Promise<{ path: string; filename: string }> {
  const filename = file.name.trim() || "support-image.png";
  const safeName = filename.replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const path = `${userId}/${requestId}-${safeName}`;

  const { error } = await admin.storage.from("support-attachments").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { path, filename };
}

export async function saveSupportRequest(
  admin: AdminClient,
  input: SaveSupportRequestInput,
): Promise<void> {
  const { error } = await admin.from("support_requests").insert({
    id: input.id,
    user_id: input.userId,
    category: input.category,
    account_type: input.accountType,
    subject: input.subject,
    message: input.message,
    user_email: input.userEmail,
    alternative_email: input.alternativeEmail,
    image_path: input.imagePath,
    image_filename: input.imageFilename,
    resend_email_id: input.resendEmailId,
    status: "open",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSupportRequestEmailId(
  admin: AdminClient,
  requestId: string,
  resendEmailId: string,
): Promise<void> {
  const { error } = await admin
    .from("support_requests")
    .update({ resend_email_id: resendEmailId })
    .eq("id", requestId);

  if (error) {
    throw new Error(error.message);
  }
}
