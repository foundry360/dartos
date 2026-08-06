import { isBotPlayer } from "@/features/bot/lib/is-bot-player";

type BotMatchUndoGame = {
  isBotMatch?: boolean;
  visitDarts: unknown[];
  currentPlayerIndex: number;
  players: Array<{
    playerKind?: "human" | "bot";
    botDifficultyId?: string;
  }>;
  history: Array<{ playerIndex: number }>;
};

function isLastHistoryEntryFromBot(game: BotMatchUndoGame): boolean {
  const lastEntry = game.history.at(-1);
  if (!lastEntry) {
    return false;
  }

  return isBotPlayer(game.players[lastEntry.playerIndex]);
}

/**
 * Undo for bot matches: if the last dart(s) were from the bot, rewind the whole
 * trailing bot visit (and handoff) in one step so the human lands back on their
 * previous visit and can fix a wrong score. Otherwise undoes a single dart.
 */
export function undoInBotMatch<T extends BotMatchUndoGame>(
  game: T,
  undoOnce: (state: T) => T,
): T {
  if (!game.isBotMatch || game.history.length === 0) {
    return undoOnce(game);
  }

  if (!isLastHistoryEntryFromBot(game)) {
    return undoOnce(game);
  }

  let next = game;

  while (next.history.length > 0 && isLastHistoryEntryFromBot(next)) {
    next = undoOnce(next);
  }

  // After stripping bot darts we're on the bot's empty visit — cross back onto
  // the human's completed visit so they can undo individual wrong darts.
  if (
    next.history.length > 0 &&
    next.visitDarts.length === 0 &&
    isBotPlayer(next.players[next.currentPlayerIndex])
  ) {
    next = undoOnce(next);
  }

  return next;
}
