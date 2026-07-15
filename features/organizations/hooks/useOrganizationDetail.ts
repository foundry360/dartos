"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchOrganizationBySlug,
  type OrganizationMembership,
} from "@/lib/supabase/queries/organizations";

export function useOrganizationDetail(slug: string | undefined) {
  const { user } = useAuth();
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [loading, setLoading] = useState(Boolean(slug) && isSupabaseConfigured());
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!slug || !isSupabaseConfigured()) {
      setLoading(false);
      setMembership(null);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setMembership(null);
        setNotFound(Boolean(user === null));
        return;
      }

      const result = await fetchOrganizationBySlug(supabase, slug);

      if (!result) {
        setMembership(null);
        setNotFound(true);
        return;
      }

      setMembership(result);
    } catch (caught) {
      console.error("Failed to load venue", caught);
      setMembership(null);
      setError("Unable to load venue.");
    } finally {
      setLoading(false);
    }
  }, [slug, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    membership,
    loading,
    error,
    notFound,
    isCloudConfigured: isSupabaseConfigured(),
    refresh: load,
  };
}
