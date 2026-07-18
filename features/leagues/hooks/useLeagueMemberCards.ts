"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import type { LeagueMemberProfileCard } from "@/features/leagues/lib/league-member-profile-card";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchManagedLeagueMemberCardById,
  fetchManagedLeagueMemberCards,
} from "@/lib/supabase/queries/league-member-cards";

export function useLeagueMemberCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<LeagueMemberProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setCards([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setCards([]);
        return;
      }

      const next = await fetchManagedLeagueMemberCards(supabase);
      setCards(next);
    } catch (err) {
      setCards([]);
      setError(
        err instanceof Error ? err.message : "Unable to load player cards.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { cards, loading, error, refresh: load };
}

export function useLeagueMemberCard(cardId: string | undefined) {
  const { user } = useAuth();
  const [card, setCard] = useState<LeagueMemberProfileCard | null>(null);
  const [loading, setLoading] = useState(Boolean(cardId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cardId?.trim()) {
      setCard(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!user || !isSupabaseConfigured()) {
      setCard(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setCard(null);
        return;
      }

      const next = await fetchManagedLeagueMemberCardById(supabase, cardId);
      setCard(next);
    } catch (err) {
      setCard(null);
      setError(
        err instanceof Error ? err.message : "Unable to load player card.",
      );
    } finally {
      setLoading(false);
    }
  }, [cardId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { card, loading, error, refresh: load };
}
