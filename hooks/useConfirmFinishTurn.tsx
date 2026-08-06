"use client";

import { useCallback } from "react";
import { DARTS_PER_VISIT } from "@/lib/constants";
import { useSettingsStore } from "@/features/settings/store/settings-store";

/**
 * Settings → Confirm finish turn
 * - ON: require Confirm/Finish Turn after a full visit
 * - OFF: the last dart of the visit ends it automatically
 *
 * Bust / checkout paths that already hand off should not call this.
 * Returns true when the visit was auto-finished.
 */
export function useConfirmFinishTurn() {
  const confirmFinishTurn = useSettingsStore((state) => state.confirmFinishTurn);

  const maybeAutoFinishVisit = useCallback(
    (options: {
      visitDartCount: number;
      status?: string | null;
      /** Defaults to 3; Killer can pass a different visit limit. */
      dartsPerVisit?: number;
      finish: () => void;
    }): boolean => {
      if (confirmFinishTurn) {
        return false;
      }

      if (options.status != null && options.status !== "playing") {
        return false;
      }

      const visitLimit = options.dartsPerVisit ?? DARTS_PER_VISIT;
      if (options.visitDartCount < visitLimit) {
        return false;
      }

      options.finish();
      return true;
    },
    [confirmFinishTurn],
  );

  return { confirmFinishTurn, maybeAutoFinishVisit };
}
