"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchBoardThemes } from "@/lib/supabase/queries/board-themes";
import {
  BOARD_THEMES,
  DEFAULT_BOARD_THEME_ID,
  type BoardTheme,
} from "@/lib/board-themes";
import { useBoardThemesStore } from "@/features/settings/store/board-themes-store";

interface SupabaseContextValue {
  configured: boolean;
  connected: boolean | null;
  loading: boolean;
  themeSource: "local" | "supabase";
  themes: BoardTheme[];
}

const SupabaseContext = createContext<SupabaseContextValue>({
  configured: false,
  connected: null,
  loading: false,
  themeSource: "local",
  themes: BOARD_THEMES,
});

export function useSupabaseStatus() {
  return useContext(SupabaseContext);
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const setRemoteThemes = useBoardThemesStore((state) => state.setRemoteThemes);
  const resetThemes = useBoardThemesStore((state) => state.resetThemes);
  const themes = useBoardThemesStore((state) => state.themes);
  const themeSource = useBoardThemesStore((state) => state.source);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());

  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      resetThemes();
      setConnected(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setLoading(true);

      try {
        const supabase = createClient();

        if (!supabase) {
          throw new Error("Supabase client unavailable");
        }

        const remoteThemes = await fetchBoardThemes(supabase);

        if (cancelled) {
          return;
        }

        if (remoteThemes.length > 0) {
          setRemoteThemes(remoteThemes);
          setConnected(true);
          return;
        }

        resetThemes();
        setConnected(true);
      } catch {
        if (!cancelled) {
          resetThemes();
          setConnected(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [configured, resetThemes, setRemoteThemes]);

  const value = useMemo(
    () => ({
      configured,
      connected,
      loading,
      themeSource,
      themes: themes.length > 0 ? themes : BOARD_THEMES,
    }),
    [configured, connected, loading, themeSource, themes],
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

export { DEFAULT_BOARD_THEME_ID };
