import { isPiperConfigured } from "@/lib/local-say/env";
import { synthesizeMacSay } from "@/lib/local-say/synthesize-macsay";
import { synthesizePiper } from "@/lib/local-say/synthesize-piper";

export function synthesizeLocalSay(
  text: string,
  voice: string,
  rate: string,
): Buffer {
  if (process.platform === "darwin") {
    return synthesizeMacSay(text, voice, rate);
  }

  if (isPiperConfigured()) {
    return synthesizePiper(text);
  }

  throw new Error("No voice synthesis backend is configured for this platform");
}
