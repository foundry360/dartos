"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createOrganization,
  fetchMyOrganizations,
  updateOrganization,
  type CreateOrganizationInput,
  type OrganizationMembership,
  type UpdateOrganizationInput,
} from "@/lib/supabase/queries/organizations";

export function useOrganizations() {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase || !user) {
        setMemberships([]);
        return;
      }

      const remote = await fetchMyOrganizations(supabase);
      setMemberships(remote);
    } catch (caught) {
      console.error("Failed to load venues", caught);
      setMemberships([]);
      setError("Unable to load venues.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOrganizations();
  }, [loadOrganizations]);

  const create = useCallback(
    async (input: CreateOrganizationInput): Promise<OrganizationMembership> => {
      const supabase = createClient();

      if (!supabase) {
        throw new Error("Sign in to create a venue.");
      }

      setSaving(true);
      setError(null);

      try {
        const membership = await createOrganization(supabase, input);
        setMemberships((current) => [membership, ...current]);
        return membership;
      } catch (caught) {
        console.error("Failed to create venue", caught);
        throw caught instanceof Error
          ? caught
          : new Error("Unable to create venue.");
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const update = useCallback(
    async (input: UpdateOrganizationInput): Promise<OrganizationMembership> => {
      const supabase = createClient();

      if (!supabase) {
        throw new Error("Sign in to update this venue.");
      }

      setSaving(true);
      setError(null);

      try {
        const organization = await updateOrganization(supabase, input);
        const existing = memberships.find(
          (entry) => entry.organization.id === organization.id,
        );
        const updatedMembership: OrganizationMembership = {
          organization,
          role: existing?.role ?? "owner",
        };

        setMemberships((current) =>
          current.map((entry) =>
            entry.organization.id === organization.id ? updatedMembership : entry,
          ),
        );

        return updatedMembership;
      } catch (caught) {
        console.error("Failed to update venue", caught);
        throw caught instanceof Error
          ? caught
          : new Error("Unable to update venue.");
      } finally {
        setSaving(false);
      }
    },
    [memberships],
  );

  return {
    memberships,
    loading,
    saving,
    error,
    isCloudConfigured: isSupabaseConfigured(),
    refresh: loadOrganizations,
    createOrganization: create,
    updateOrganization: update,
  };
}
