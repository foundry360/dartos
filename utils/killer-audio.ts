import {
  buildDoubleHitClipPath,
  buildPlayerEliminatedClipPath,
  buildPlayerNumbersAssignedClipPath,
  getKillerCalloutClipPath,
  getKillerCalloutPhrase,
  getKillerIsKillerClipEntries,
  getKillerPlayerTargetClipEntries,
  getKillerPlayerWinsClipEntries,
  KILLER_CLIP_BASE_PATH,
  type KillerCallout,
} from "@/lib/killer-callouts";
import { resolveKillerAnnouncementsAfterVisit } from "@/features/classic-games/lib/killer-engine";
import type { KillerGameState } from "@/types/killer";
import type { DartHit } from "@/types/dart";
import { speakFreePhrase } from "@/utils/free-speech";

let activeKillerAudio: HTMLAudioElement | null = null;

function stopActiveKillerAudio(): void {
  if (!activeKillerAudio) {
    return;
  }

  activeKillerAudio.pause();
  activeKillerAudio.currentTime = 0;
  activeKillerAudio = null;
}

export function primeKillerClips(): void {
  if (typeof window === "undefined") {
    return;
  }

  for (const entry of getKillerPlayerTargetClipEntries()) {
    const audio = new Audio(`${KILLER_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const entry of getKillerIsKillerClipEntries()) {
    const audio = new Audio(`${KILLER_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const entry of getKillerPlayerWinsClipEntries()) {
    const audio = new Audio(`${KILLER_CLIP_BASE_PATH}/${entry.slug}.wav`);
    audio.preload = "auto";
    audio.load();
  }

  for (const clipPath of [
    buildPlayerNumbersAssignedClipPath(),
    buildDoubleHitClipPath(),
    buildPlayerEliminatedClipPath(),
  ]) {
    const audio = new Audio(clipPath);
    audio.preload = "auto";
    audio.load();
  }
}

async function playKillerClipPath(clipPath: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  stopActiveKillerAudio();

  const audio = new Audio(clipPath);
  audio.volume = 0.95;
  audio.preload = "auto";
  activeKillerAudio = audio;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = (failed = false) => {
        if (activeKillerAudio === audio) {
          activeKillerAudio = null;
        }

        if (failed) {
          reject(new Error("Killer clip playback failed"));
          return;
        }

        resolve();
      };

      audio.onended = () => cleanup(false);
      audio.onerror = () => cleanup(true);
      void audio.play().catch(() => cleanup(true));
    });

    return true;
  } catch {
    return false;
  }
}

export async function announceKillerCallout(callout: KillerCallout): Promise<void> {
  const clipPath = getKillerCalloutClipPath(callout);
  if (clipPath) {
    const playedClip = await playKillerClipPath(clipPath);
    if (playedClip) {
      return;
    }
  }

  await speakFreePhrase(getKillerCalloutPhrase(callout));
}

export async function announceKillerCallouts(callouts: KillerCallout[]): Promise<void> {
  for (const callout of callouts) {
    await announceKillerCallout(callout);
  }
}

export function resolveKillerPreAssignedTargetAnnouncements(
  game: KillerGameState,
): KillerCallout[] {
  if (game.numberAssignment === "first_dart" || game.phase !== "playing") {
    return [];
  }

  const announcements: KillerCallout[] = [];

  for (let index = 0; index < game.players.length; index += 1) {
    const target = game.players[index]?.assignedNumber;
    if (target != null) {
      announcements.push({
        type: "player-target",
        playerNumber: index + 1,
        target,
      });
    }
  }

  if (announcements.length > 0) {
    announcements.push({ type: "player-numbers-assigned" });
  }

  return announcements;
}

export function announceKillerAfterTurn(
  before: KillerGameState,
  after: KillerGameState,
  completedPlayerIndex: number,
  visitDarts: DartHit[],
): void {
  const callouts = resolveKillerAnnouncementsAfterVisit(
    before,
    after,
    completedPlayerIndex,
    visitDarts,
  );

  if (callouts.length === 0) {
    return;
  }

  void announceKillerCallouts(callouts);
}
