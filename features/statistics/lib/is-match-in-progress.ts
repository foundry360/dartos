import { useCricketStore } from "@/features/cricket/store/cricket-store";
import { useBobs27Store } from "@/features/classic-games/store/bobs-27-store";
import { useHalveItStore } from "@/features/classic-games/store/halve-it-store";
import { useShanghaiStore } from "@/features/classic-games/store/shanghai-store";
import { useX01Store } from "@/features/x01/store/x01-store";

export function isMatchInProgress(): boolean {
  const x01Game = useX01Store.getState().game;
  if (x01Game?.status === "playing") {
    return true;
  }

  const cricketGame = useCricketStore.getState().game;
  if (cricketGame?.status === "playing") {
    return true;
  }

  const bobs27Game = useBobs27Store.getState().game;
  if (bobs27Game?.isBotMatch && bobs27Game.status === "playing") {
    return true;
  }

  const shanghaiGame = useShanghaiStore.getState().game;
  if (shanghaiGame?.isBotMatch && shanghaiGame.status === "playing") {
    return true;
  }

  const halveItGame = useHalveItStore.getState().game;
  if (halveItGame?.isBotMatch && halveItGame.status === "playing") {
    return true;
  }

  return false;
}
