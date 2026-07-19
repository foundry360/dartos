"use client";

import { useMemo, useState } from "react";
import {
  CreateLeagueForm,
  type CreateLeagueFormInput,
  type CreateLeagueFormValues,
} from "@/features/leagues/components/CreateLeagueForm";
import {
  isoToLocalDateAndTime,
  isLeagueCompetitionFormat,
  isLeagueFormat,
  normalizeLeagueGameFormat,
  type LeagueCompetitionFormat,
  type LeagueFormat,
  type LeagueGameFormat,
} from "@/features/leagues/lib/league-formats";
import type { LeagueSetupSaveStatus } from "@/features/leagues/lib/league-detail-sections";
import { getSampleSeasonsForOrganization } from "@/features/leagues/lib/sample-league-dashboard";
import type {
  LeagueWithVenue,
  UpdateLeagueInput,
} from "@/lib/supabase/queries/leagues";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";

interface LeagueDetailDetailsProps {
  leagueEntry: LeagueWithVenue;
  venues: OrganizationMembership[];
  venuesLoading?: boolean;
  submitting?: boolean;
  locked?: boolean;
  onUpdateLeague: (input: UpdateLeagueInput) => Promise<unknown>;
  onSetupSaveStatus?: (status: LeagueSetupSaveStatus) => void;
  onAdvanceSetup?: () => void;
  onBack?: () => void;
  onCreateVenue?: () => void;
}

function buildInitialValues(league: LeagueWithVenue): CreateLeagueFormValues {
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
  const gameFormat: LeagueGameFormat | "" =
    normalizeLeagueGameFormat(league.league.game_format) ?? "";

  return {
    organizationId: league.league.organization_id,
    seasonId: league.league.season_id,
    name: league.league.name,
    format,
    competitionFormat,
    gameFormat,
    startDate: startParts?.date ?? "",
    finishDate: endParts?.date ?? "",
    time: startParts?.time ?? endParts?.time ?? "",
    description: league.league.description,
    maxPlayers: league.league.max_players,
  };
}

export function LeagueDetailDetails({
  leagueEntry,
  venues,
  venuesLoading = false,
  submitting = false,
  locked = false,
  onUpdateLeague,
  onSetupSaveStatus,
  onAdvanceSetup,
  onBack,
  onCreateVenue,
}: LeagueDetailDetailsProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const localSeasons = useMemo(() => {
    const fromSample = venues.flatMap((venue) =>
      getSampleSeasonsForOrganization(venue.organization.id),
    );

    if (!leagueEntry.season) {
      return fromSample;
    }

    if (fromSample.some((season) => season.id === leagueEntry.season?.id)) {
      return fromSample;
    }

    return [
      ...fromSample,
      {
        id: leagueEntry.season.id,
        organization_id: leagueEntry.league.organization_id,
        name: leagueEntry.season.name,
        slug: leagueEntry.season.slug,
        created_by: leagueEntry.league.created_by,
        created_at: leagueEntry.league.created_at,
        updated_at: leagueEntry.league.updated_at,
      },
    ];
  }, [leagueEntry, venues]);

  const initialValues = useMemo(
    () => buildInitialValues(leagueEntry),
    [leagueEntry],
  );

  const handleSubmit = async (input: CreateLeagueFormInput) => {
    if (locked) {
      return;
    }

    setFormError(null);
    onSetupSaveStatus?.("saving");

    try {
      await onUpdateLeague({
        leagueId: leagueEntry.league.id,
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
      onSetupSaveStatus?.("saved");
      onAdvanceSetup?.();
    } catch (caught) {
      onSetupSaveStatus?.("idle");
      setFormError(
        caught instanceof Error ? caught.message : "Unable to update league.",
      );
    }
  };

  return (
    <div className="league-workspace league-details-admin">
      <section className="league-detail-card league-details-setup">
        <div className="league-detail-card__header">
          <h2 className="league-detail-card__title">League Details</h2>
        </div>
        <p className="league-details-setup__hint">
          Confirm the league name, venue, format, and schedule dates before
          configuring game rules.
        </p>
        <CreateLeagueForm
          key={`${leagueEntry.league.id}-${leagueEntry.league.updated_at}`}
          venues={venues}
          venuesLoading={venuesLoading}
          submitting={submitting}
          disabled={locked}
          error={formError}
          initialValues={initialValues}
          localSeasons={localSeasons}
          submitLabel={onAdvanceSetup ? "Next" : "Save changes"}
          submittingLabel="Saving..."
          cancelLabel="Back"
          actionStyle="league"
          onCancel={locked ? undefined : onBack}
          onCreateVenue={locked ? undefined : onCreateVenue}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
