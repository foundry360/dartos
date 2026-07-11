"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getWalletApiErrorMessage } from "@/features/wallet/lib/wallet-api-error";
import { fetchWalletSnapshotForUser } from "@/lib/supabase/queries/wallet";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { WalletSnapshot } from "@/types/wallet";

const EMPTY_WALLET: WalletSnapshot = {
  customer: null,
  subscription: null,
  paymentMethods: [],
  invoices: [],
};

async function syncWalletPaymentMethods(): Promise<boolean> {
  try {
    const response = await fetch("/api/wallet/sync", { method: "POST" });
    return response.ok;
  } catch {
    return false;
  }
}

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

      const synced = await syncWalletPaymentMethods();
      if (synced) {
        const refreshedSnapshot = await fetchWalletSnapshotForUser(supabase, user.id);
        setWallet(refreshedSnapshot);
      }
    } catch (caught) {
      const message = getWalletApiErrorMessage(caught, "Unable to load wallet details.");
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
