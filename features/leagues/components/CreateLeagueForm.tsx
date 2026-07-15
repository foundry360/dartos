"use client";

import { useEffect, useMemo, useState } from "react";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { OptionPickerField } from "@/components/ui/OptionPickerField";
import { TimePickerField } from "@/components/ui/TimePickerField";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  LEAGUE_FORMAT_OPTIONS,
  type LeagueFormat,
} from "@/features/leagues/lib/league-formats";
import { createClient } from "@/lib/supabase/client";
import type { SeasonRow } from "@/lib/supabase/database.types";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";
import { fetchSeasonsForOrganization } from "@/lib/supabase/queries/seasons";

export interface CreateLeagueFormInput {
  organizationId: string;
  seasonId?: string;
  seasonName?: string;
  name: string;
  format: LeagueFormat | "";
  startsAtLocal: string;
  endsAtLocal: string;
  description?: string;
}

interface CreateLeagueFormProps {
  venues: OrganizationMembership[];
  venuesLoading?: boolean;
  onSubmit: (input: CreateLeagueFormInput) => Promise<void>;
  onCancel?: () => void;
  onCreateVenue?: () => void;
  submitting?: boolean;
  error?: string | null;
}

export function CreateLeagueForm({
  venues,
  venuesLoading = false,
  onSubmit,
  onCancel,
  onCreateVenue,
  submitting = false,
  error = null,
}: CreateLeagueFormProps) {
  const [organizationId, setOrganizationId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [seasonName, setSeasonName] = useState("");
  const [addingSeason, setAddingSeason] = useState(false);
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<LeagueFormat | "">("");
  const [startDate, setStartDate] = useState("");
  const [finishDate, setFinishDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");

  const venueOptions = useMemo(
    () =>
      venues.map(({ organization }) => ({
        value: organization.id,
        label: organization.name,
      })),
    [venues],
  );

  const seasonOptions = useMemo(
    () =>
      seasons.map((season) => ({
        value: season.id,
        label: season.name,
      })),
    [seasons],
  );

  useEffect(() => {
    if (!organizationId && venues.length === 1) {
      setOrganizationId(venues[0].organization.id);
    }
  }, [organizationId, venues]);

  useEffect(() => {
    setSeasonId("");
    setSeasonName("");
    setSeasons([]);

    if (!organizationId) {
      setAddingSeason(false);
      setSeasonsLoading(false);
      return;
    }

    let cancelled = false;

    const loadSeasons = async () => {
      const supabase = createClient();

      if (!supabase) {
        return;
      }

      setSeasonsLoading(true);

      try {
        const remote = await fetchSeasonsForOrganization(supabase, organizationId);

        if (cancelled) {
          return;
        }

        setSeasons(remote);
        setAddingSeason(remote.length === 0);

        if (remote.length === 1) {
          setSeasonId(remote[0].id);
        }
      } catch (caught) {
        console.error("Failed to load seasons", caught);

        if (!cancelled) {
          setSeasons([]);
          setAddingSeason(true);
        }
      } finally {
        if (!cancelled) {
          setSeasonsLoading(false);
        }
      }
    };

    void loadSeasons();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const handleVenueChange = (nextVenueId: string | "") => {
    setOrganizationId(nextVenueId);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const startsAtLocal = `${startDate}T${time}`;
    const endsAtLocal = `${finishDate}T${time}`;

    await onSubmit({
      organizationId,
      seasonId: addingSeason ? undefined : seasonId || undefined,
      seasonName: addingSeason ? seasonName.trim() || undefined : undefined,
      name,
      format,
      startsAtLocal,
      endsAtLocal,
      description: description.trim() || undefined,
    });
  };

  const seasonReady = addingSeason ? Boolean(seasonName.trim()) : Boolean(seasonId);
  const scheduleReady = Boolean(startDate.trim() && finishDate.trim() && time.trim());

  if (!venuesLoading && venues.length === 0) {
    return (
      <div className="create-league-form create-league-form--empty">
        <p className="create-league-form__empty-copy">
          Create a venue before starting a league.
        </p>
        {error ? <p className="create-organization-form__error">{error}</p> : null}
        <div className="create-organization-form__actions">
          {onCreateVenue ? (
            <TouchButton type="button" fullWidth size="lg" onClick={onCreateVenue}>
              Add Venue
            </TouchButton>
          ) : null}
          {onCancel ? (
            <TouchButton
              type="button"
              variant="secondary"
              fullWidth
              size="lg"
              onClick={onCancel}
            >
              Cancel
            </TouchButton>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form
      className="create-organization-form create-league-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <label className="create-organization-form__field">
        <span className="create-organization-form__label">League name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="setup-input"
          placeholder="e.g. Thursday night league"
          autoFocus={!addingSeason}
          required
          maxLength={80}
          disabled={submitting}
        />
      </label>

      <div className="create-league-form__venue-format-row">
        <OptionPickerField
          label="Venue"
          value={organizationId}
          options={venueOptions}
          onChange={handleVenueChange}
          placeholder={venuesLoading ? "Loading venues..." : "Select a venue"}
          allowClear={false}
          disabled={submitting || venuesLoading || venueOptions.length === 0}
        />

        <OptionPickerField
          label="Format"
          value={format}
          options={LEAGUE_FORMAT_OPTIONS}
          onChange={setFormat}
          placeholder="Select a format"
          allowClear={false}
          disabled={submitting}
        />
      </div>

      {!organizationId ? (
        <label className="create-organization-form__field">
          <span className="create-organization-form__label">Season</span>
          <input
            className="setup-input"
            placeholder="Select a venue first"
            disabled
          />
        </label>
      ) : addingSeason ? (
        <div className="create-league-form__season-create">
          <label className="create-organization-form__field">
            <span className="create-organization-form__label">Season</span>
            <input
              value={seasonName}
              onChange={(event) => setSeasonName(event.target.value)}
              className="setup-input"
              placeholder="e.g. 2025/26"
              autoFocus
              required
              maxLength={80}
              disabled={submitting}
            />
          </label>
          {seasons.length > 0 ? (
            <button
              type="button"
              className="create-league-form__season-switch"
              onClick={() => {
                setAddingSeason(false);
                setSeasonName("");
              }}
              disabled={submitting}
            >
              Choose existing season
            </button>
          ) : (
            <p className="create-league-form__season-hint">
              No seasons yet — create one for this venue.
            </p>
          )}
        </div>
      ) : (
        <OptionPickerField
          label="Season"
          value={seasonId}
          options={seasonOptions}
          onChange={setSeasonId}
          placeholder={seasonsLoading ? "Loading seasons..." : "Select a season"}
          allowClear={false}
          disabled={submitting || seasonsLoading}
          emptyLabel="No seasons yet"
          actionLabel="Add new season"
          onAction={() => {
            setAddingSeason(true);
            setSeasonId("");
          }}
        />
      )}

      <div className="create-league-form__schedule-row">
        <DatePickerField
          label="Start"
          value={startDate}
          onChange={setStartDate}
          placeholder="Select date"
          disabled={submitting}
        />

        <DatePickerField
          label="Finish"
          value={finishDate}
          onChange={setFinishDate}
          placeholder="Select date"
          min={startDate || undefined}
          disabled={submitting}
        />

        <TimePickerField
          label="Time"
          value={time}
          onChange={setTime}
          placeholder="Select time"
          disabled={submitting}
        />
      </div>

      <label className="create-organization-form__field">
        <span className="create-organization-form__label">Description (optional)</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="setup-input create-organization-form__textarea"
          placeholder="Night of play or anything players should know"
          rows={2}
          maxLength={500}
          disabled={submitting}
        />
      </label>

      {error ? <p className="create-organization-form__error">{error}</p> : null}

      <div className="create-organization-form__actions create-league-form__actions">
        {onCancel ? (
          <TouchButton
            type="button"
            variant="secondary"
            size="lg"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </TouchButton>
        ) : null}
        <TouchButton
          type="submit"
          size="lg"
          disabled={
            submitting ||
            !name.trim() ||
            !organizationId ||
            !format ||
            !seasonReady ||
            !scheduleReady
          }
        >
          {submitting ? "Creating..." : "Create League"}
        </TouchButton>
      </div>
    </form>
  );
}
