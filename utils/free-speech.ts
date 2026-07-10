/** Browser TTS fallback is disabled — George clips only. */

export function primeFreeSpeech(): void {
  // No-op: we do not use speechSynthesis for match announcements.
}

export function cancelFreeSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
}

export async function speakFreePhrase(_text: string): Promise<void> {
  // No-op: never use browser TTS as a voice fallback.
}
