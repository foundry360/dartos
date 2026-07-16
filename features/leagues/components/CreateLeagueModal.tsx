"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  CreateLeagueForm,
  type CreateLeagueFormInput,
} from "@/features/leagues/components/CreateLeagueForm";
import type { CreateLeagueInput } from "@/lib/supabase/queries/leagues";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";

interface CreateLeagueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venues: OrganizationMembership[];
  venuesLoading?: boolean;
  submitting?: boolean;
  onCreate: (input: CreateLeagueInput) => Promise<unknown>;
  onRequestCreateVenue?: () => void;
}

export function CreateLeagueModal({
  open,
  onOpenChange,
  venues,
  venuesLoading = false,
  submitting = false,
  onCreate,
  onRequestCreateVenue,
}: CreateLeagueModalProps) {
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFormError(null);
    }
  }, [open]);

  const close = () => {
    onOpenChange(false);
    setFormError(null);
  };

  const handleSubmit = async (input: CreateLeagueFormInput) => {
    setFormError(null);

    try {
      await onCreate({
        organizationId: input.organizationId,
        seasonId: input.seasonId,
        seasonName: input.seasonName,
        name: input.name,
        format: input.format,
        competitionFormat: input.competitionFormat,
        gameFormat: input.gameFormat,
        startsAtLocal: input.startsAtLocal,
        endsAtLocal: input.endsAtLocal,
        description: input.description,
        maxPlayers: input.maxPlayers ?? null,
      });
      close();
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to create league.",
      );
    }
  };

  return (
    <BottomSheet
      open={open}
      title="Create League"
      onClose={close}
      className="create-league-modal"
    >
      <div className="sheet-form create-league-modal__body">
        <CreateLeagueForm
          venues={venues}
          venuesLoading={venuesLoading}
          submitting={submitting}
          error={formError}
          onCancel={close}
          onCreateVenue={
            onRequestCreateVenue
              ? () => {
                  close();
                  onRequestCreateVenue();
                }
              : undefined
          }
          onSubmit={handleSubmit}
        />
      </div>
    </BottomSheet>
  );
}
