import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useX01Store } from "@/features/x01/store/x01-store";

export function isMatchInProgress(): boolean {
  const x01Game = useX01Store.getState().game;
  if (x01Game?.status === "playing") {
    return true;
  }

  const cricketGame = useCricketStore.getState().game;
  return cricketGame?.status === "playing";
}
