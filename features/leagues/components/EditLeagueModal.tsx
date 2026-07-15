"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  CreateLeagueForm,
  type CreateLeagueFormInput,
  type CreateLeagueFormValues,
} from "@/features/leagues/components/CreateLeagueForm";
import {
  isoToLocalDateAndTime,
  isLeagueCompetitionFormat,
  isLeagueFormat,
  type LeagueCompetitionFormat,
  type LeagueFormat,
} from "@/features/leagues/lib/league-formats";
import {
  getSampleSeasonsForOrganization,
  SAMPLE_VENUES,
} from "@/features/leagues/lib/sample-league-dashboard";
import type {
  LeagueWithVenue,
  UpdateLeagueInput,
} from "@/lib/supabase/queries/leagues";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";

interface EditLeagueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  league: LeagueWithVenue | null;
  venues: OrganizationMembership[];
  venuesLoading?: boolean;
  submitting?: boolean;
  onSave: (input: UpdateLeagueInput) => Promise<unknown>;
  onRequestCreateVenue?: () => void;
}

export function EditLeagueModal({
  open,
  onOpenChange,
  league,
  venues,
  venuesLoading = false,
  submitting = false,
  onSave,
  onRequestCreateVenue,
}: EditLeagueModalProps) {
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFormError(null);
    }
  }, [open]);

  const localSeasons = useMemo(() => {
    const fromSample = SAMPLE_VENUES.flatMap((venue) =>
      getSampleSeasonsForOrganization(venue.id),
    );

    if (!league?.season) {
      return fromSample;
    }

    const alreadyPresent = fromSample.some(
      (season) => season.id === league.season?.id,
    );

    if (alreadyPresent) {
      return fromSample;
    }

    return [
      ...fromSample,
      {
        id: league.season.id,
        organization_id: league.league.organization_id,
        name: league.season.name,
        slug: league.season.slug,
        created_by: league.league.created_by,
        created_at: league.league.created_at,
        updated_at: league.league.updated_at,
      },
    ];
  }, [league]);

  const initialValues = useMemo((): CreateLeagueFormValues | null => {
    if (!league) {
      return null;
    }

    const startParts = isoToLocalDateAndTime(league.league.starts_at);
    const endParts = isoToLocalDateAndTime(league.league.ends_at);
    const rawFormat = league.league.format;
    const format: LeagueFormat | "" =
      rawFormat && isLeagueFormat(rawFormat) ? rawFormat : "";
    const rawCompetitionFormat = league.league.competition_format;
    const competitionFormat: LeagueCompetitionFormat | "" =
      rawCompetitionFormat && isLeagueCompetitionFormat(rawCompetitionFormat)
        ? rawCompetitionFormat
        : "";

    return {
      organizationId: league.league.organization_id,
      seasonId: league.league.season_id,
      name: league.league.name,
      format,
      competitionFormat,
      startDate: startParts?.date ?? "",
      finishDate: endParts?.date ?? "",
      time: startParts?.time ?? endParts?.time ?? "",
      description: league.league.description,
      maxPlayers: league.league.max_players,
    };
  }, [league]);

  const close = () => {
    onOpenChange(false);
    setFormError(null);
  };

  const handleSubmit = async (input: CreateLeagueFormInput) => {
    if (!league) {
      return;
    }

    setFormError(null);

    try {
      await onSave({
        leagueId: league.league.id,
        organizationId: input.organizationId,
        seasonId: input.seasonId,
        seasonName: input.seasonName,
        name: input.name,
        format: input.format,
        competitionFormat: input.competitionFormat,
        startsAtLocal: input.startsAtLocal,
        endsAtLocal: input.endsAtLocal,
        description: input.description,
        maxPlayers: input.maxPlayers ?? null,
      });
      close();
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to update league.",
      );
    }
  };

  return (
    <BottomSheet
      open={open && Boolean(league)}
      title="Edit League"
      onClose={close}
      className="create-league-modal"
    >
      <div className="sheet-form create-league-modal__body">
        {league && initialValues ? (
          <CreateLeagueForm
            key={`${league.league.id}-${league.league.updated_at}`}
            venues={venues}
            venuesLoading={venuesLoading}
            submitting={submitting}
            error={formError}
            initialValues={initialValues}
            localSeasons={localSeasons}
            submitLabel="Save changes"
            submittingLabel="Saving..."
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
        ) : null}
      </div>
    </BottomSheet>
  );
}
