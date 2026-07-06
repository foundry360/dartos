"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue>({
  configured: false,
  loading: true,
  user: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setUser(null);
      setLoading(false);
      return;
    }

    const client = createClient();

    if (!client) {
      setLoading(false);
      return;
    }

    const supabase = client;
    let cancelled = false;

    async function loadSession() {
      const { data } = await supabase.auth.getUser();

      if (!cancelled) {
        setUser(data.user);
        setLoading(false);
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  const value = useMemo(
    () => ({
      configured,
      loading,
      user,
    }),
    [configured, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
