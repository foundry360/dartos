import { abandonActiveMatchCloud } from "@/features/match-play/lib/abandon-active-match-cloud";
import type { ActiveMatchSnapshot } from "@/features/match-play/lib/active-match-snapshot";
import { useActiveMatchCloudStore } from "@/features/match-play/store/active-match-cloud-store";
import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useX01Store } from "@/features/x01/store/x01-store";

function resetLocalGameForSnapshot(snapshot: ActiveMatchSnapshot) {
  if (snapshot.gameMode === "x01") {
    const game = useX01Store.getState().game;

    if (game?.matchId === snapshot.id) {
      useX01Store.getState().reset();
    }

    return;
  }

  const game = useCricketStore.getState().game;

  if (game?.matchId === snapshot.id) {
    useCricketStore.getState().reset();
  }
}

export function deleteActiveMatch(userId: string | undefined, matchId: string) {
  const snapshot = useActiveMatchCloudStore
    .getState()
    .snapshots.find((entry) => entry.id === matchId);

  if (snapshot) {
    resetLocalGameForSnapshot(snapshot);
  }

  void abandonActiveMatchCloud(userId, matchId);
}
