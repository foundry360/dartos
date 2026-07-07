let pendingUtterance: SpeechSynthesisUtterance | null = null;

export function trySpeak(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  const synth = window.speechSynthesis;
  synth.resume();

  pendingUtterance = new SpeechSynthesisUtterance(trimmed);
  pendingUtterance.lang = "en-US";
  pendingUtterance.rate = 0.95;
  pendingUtterance.volume = 1;

  synth.speak(pendingUtterance);
}

export function playVoiceTest(): void {
  trySpeak("Voice on");
}

export function announcePlayerTurn(playerName: string): void {
  const trimmedName = playerName.trim();
  if (!trimmedName) {
    return;
  }

  trySpeak(`${trimmedName}, your turn`);
}
