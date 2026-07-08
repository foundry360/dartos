"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/features/settings/store/settings-store";

export function useSettingsSessionHydration() {
  const hydrateFromSession = useSettingsStore((state) => state.hydrateFromSession);

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);
}
