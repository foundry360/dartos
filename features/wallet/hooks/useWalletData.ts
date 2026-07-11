"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchWalletSnapshotForUser } from "@/lib/supabase/queries/wallet";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { WalletSnapshot } from "@/types/wallet";

const EMPTY_WALLET: WalletSnapshot = {
  customer: null,
  subscription: null,
  paymentMethods: [],
  invoices: [],
};

export function useWalletData() {
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<WalletSnapshot>(EMPTY_WALLET);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setWallet(EMPTY_WALLET);
      setError(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setWallet(EMPTY_WALLET);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const snapshot = await fetchWalletSnapshotForUser(supabase, user.id);
      setWallet(snapshot);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to load wallet details.";
      setError(message);
      setWallet(EMPTY_WALLET);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void reload();
  }, [authLoading, reload]);

  return {
    wallet,
    loading: authLoading || loading,
    error,
    reload,
  };
}
