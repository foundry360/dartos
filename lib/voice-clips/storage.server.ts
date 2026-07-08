import { createAdminClient } from "@/lib/supabase/admin";
import {
  getVoiceClipPublicUrl,
  isVoiceClipCdnConfigured,
  VOICE_CLIPS_BUCKET,
} from "@/lib/voice-clips/paths";

export async function fetchVoiceClipBuffer(storagePath: string): Promise<Buffer | null> {
  const admin = createAdminClient();

  if (admin) {
    const { data, error } = await admin.storage.from(VOICE_CLIPS_BUCKET).download(storagePath);

    if (!error && data) {
      return Buffer.from(await data.arrayBuffer());
    }
  }

  if (!isVoiceClipCdnConfigured()) {
    return null;
  }

  const publicUrl = getVoiceClipPublicUrl(storagePath);
  if (!publicUrl) {
    return null;
  }

  try {
    const response = await fetch(publicUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function uploadVoiceClip(
  storagePath: string,
  audio: Buffer,
): Promise<string | null> {
  const admin = createAdminClient();
  if (!admin) {
    return null;
  }

  const { error } = await admin.storage.from(VOICE_CLIPS_BUCKET).upload(storagePath, audio, {
    upsert: true,
    contentType: "audio/wav",
    cacheControl: "31536000",
  });

  if (error) {
    console.error("[voice-clips] upload failed:", error.message);
    return null;
  }

  return getVoiceClipPublicUrl(storagePath);
}
