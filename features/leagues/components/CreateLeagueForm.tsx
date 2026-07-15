"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DatePickerField } from "@/components/ui/DatePickerField";
import { OptionPickerField } from "@/components/ui/OptionPickerField";
import { TimePickerField } from "@/components/ui/TimePickerField";
import { TouchButton } from "@/components/ui/TouchButton";
import {
  LEAGUE_COMPETITION_FORMAT_OPTIONS,
  LEAGUE_FORMAT_OPTIONS,
  type LeagueCompetitionFormat,
  type LeagueFormat,
} from "@/features/leagues/lib/league-formats";
import { createClient } from "@/lib/supabase/client";
import type { SeasonRow } from "@/lib/supabase/database.types";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";
import { fetchSeasonsForOrganization } from "@/lib/supabase/queries/seasons";

const ORGANIZATION_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreateLeagueFormInput {
  organizationId: string;
  seasonId?: string;
  seasonName?: string;
  name: string;
  format: LeagueFormat | "";
  competitionFormat: LeagueCompetitionFormat | "";
  startsAtLocal: string;
  endsAtLocal: string;
  description?: string;
  maxPlayers?: number | null;
}

export interface CreateLeagueFormValues {
  organizationId?: string;
  seasonId?: string | null;
  name?: string;
  format?: LeagueFormat | "";
  competitionFormat?: LeagueCompetitionFormat | "";
  startDate?: string;
  finishDate?: string;
  time?: string;
  description?: string | null;
  maxPlayers?: number | null;
}

interface CreateLeagueFormProps {
  venues: OrganizationMembership[];
  venuesLoading?: boolean;
  onSubmit: (input: CreateLeagueFormInput) => Promise<void>;
  onCancel?: () => void;
  onCreateVenue?: () => void;
  submitting?: boolean;
  error?: string | null;
  initialValues?: CreateLeagueFormValues | null;
  /** Used when the selected venue is sample/local (non-UUID) and remote fetch cannot run. */
  localSeasons?: SeasonRow[];
  submitLabel?: string;
  submittingLabel?: string;
}

export function CreateLeagueForm({
  venues,
  venuesLoading = false,
  onSubmit,
  onCancel,
  onCreateVenue,
  submitting = false,
  error = null,
  initialValues = null,
  localSeasons = [],
  submitLabel = "Create League",
  submittingLabel = "Creating...",
}: CreateLeagueFormProps) {
  const [organizationId, setOrganizationId] = useState(
    initialValues?.organizationId ?? "",
  );
  const [seasonId, setSeasonId] = useState(initialValues?.seasonId ?? "");
  const [seasonName, setSeasonName] = useState("");
  const [addingSeason, setAddingSeason] = useState(false);
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [format, setFormat] = useState<LeagueFormat | "">(
    initialValues?.format ?? "",
  );
  const [competitionFormat, setCompetitionFormat] = useState<
    LeagueCompetitionFormat | ""
  >(initialValues?.competitionFormat ?? "");
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? "");
  const [finishDate, setFinishDate] = useState(initialValues?.finishDate ?? "");
  const [time, setTime] = useState(initialValues?.time || "12:00");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [maxPlayers, setMaxPlayers] = useState(
    initialValues?.maxPlayers != null ? String(initialValues.maxPlayers) : "",
  );
  const localSeasonsRef = useRef(localSeasons);
  localSeasonsRef.current = localSeasons;

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
    const onlyVenue = venues.length === 1 ? venues[0] : undefined;

    if (!organizationId && onlyVenue) {
      setOrganizationId(onlyVenue.organization.id);
    }
  }, [organizationId, venues]);

  useEffect(() => {
    setSeasonName("");
    setSeasons([]);

    if (!organizationId) {
      setSeasonId("");
      setAddingSeason(false);
      setSeasonsLoading(false);
      return;
    }

    let cancelled = false;
    const preferredSeasonId = seasonId;

    const applySeasons = (remote: SeasonRow[]) => {
      if (cancelled) {
        return;
      }

      setSeasons(remote);

      const preferredStillValid =
        Boolean(preferredSeasonId) &&
        remote.some((season) => season.id === preferredSeasonId);

      if (preferredStillValid) {
        setSeasonId(preferredSeasonId);
        setAddingSeason(false);
      } else if (remote.length === 0) {
        setSeasonId("");
        setAddingSeason(true);
      } else if (remote.length === 1) {
        const onlySeason = remote[0];

        if (onlySeason) {
          setSeasonId(onlySeason.id);
          setAddingSeason(false);
        }
      } else {
        setSeasonId(preferredSeasonId || "");
        setAddingSeason(false);
      }
    };

    const loadSeasons = async () => {
      if (!ORGANIZATION_ID_UUID_RE.test(organizationId)) {
        const local = localSeasonsRef.current.filter(
          (season) => season.organization_id === organizationId,
        );
        applySeasons(local);
        setSeasonsLoading(false);
        return;
      }

      const supabase = createClient();

      if (!supabase) {
        applySeasons(
          localSeasonsRef.current.filter(
            (season) => season.organization_id === organizationId,
          ),
        );
        setSeasonsLoading(false);
        return;
      }

      setSeasonsLoading(true);

      try {
        const remote = await fetchSeasonsForOrganization(supabase, organizationId);
        applySeasons(remote);
      } catch (caught) {
        console.error("Failed to load seasons", caught);

        if (!cancelled) {
          applySeasons(
            localSeasonsRef.current.filter(
              (season) => season.organization_id === organizationId,
            ),
          );
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
    // Intentionally depend on organizationId only; seasonId seeds preferred selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const handleVenueChange = (nextVenueId: string | "") => {
    setOrganizationId(nextVenueId);
    setSeasonId("");
    setSeasonName("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const startsAtLocal = `${startDate}T${time}`;
    const endsAtLocal = `${finishDate}T${time}`;
    const trimmedMax = maxPlayers.trim();
    const parsedMax = trimmedMax ? Number.parseInt(trimmedMax, 10) : null;

    if (
      trimmedMax &&
      (!Number.isFinite(parsedMax) || parsedMax == null || parsedMax <= 0)
    ) {
      return;
    }

    await onSubmit({
      organizationId,
      seasonId: addingSeason ? undefined : seasonId || undefined,
      seasonName: addingSeason ? seasonName.trim() || undefined : undefined,
      name,
      format,
      competitionFormat,
      startsAtLocal,
      endsAtLocal,
      description: description.trim() || undefined,
      maxPlayers: parsedMax,
    });
  };

  const seasonReady = addingSeason ? Boolean(seasonName.trim()) : Boolean(seasonId);
  const scheduleReady = Boolean(startDate.trim() && finishDate.trim() && time.trim());
  const maxPlayersReady =
    !maxPlayers.trim() ||
    (() => {
      const parsed = Number.parseInt(maxPlayers.trim(), 10);
      return Number.isFinite(parsed) && parsed > 0;
    })();

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
      <div className="create-league-form__venue-format-row">
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

        <OptionPickerField
          label="Venue"
          value={organizationId}
          options={venueOptions}
          onChange={handleVenueChange}
          placeholder={venuesLoading ? "Loading venues..." : "Select a venue"}
          allowClear={false}
          disabled={submitting || venuesLoading || venueOptions.length === 0}
        />
      </div>

      <div className="create-league-form__venue-format-row">
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

        <OptionPickerField
          label="League Format"
          value={competitionFormat}
          options={LEAGUE_COMPETITION_FORMAT_OPTIONS}
          onChange={setCompetitionFormat}
          placeholder="Select a league format"
          allowClear={false}
          disabled={submitting}
        />
      </div>

      <div className="create-league-form__venue-format-row">
        <OptionPickerField
          label="League Type"
          value={format}
          options={LEAGUE_FORMAT_OPTIONS}
          onChange={setFormat}
          placeholder="Select a league type"
          allowClear={false}
          disabled={submitting}
        />

        <label className="create-organization-form__field">
          <span className="create-organization-form__label">
            Maximum players (optional)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={maxPlayers}
            onChange={(event) => setMaxPlayers(event.target.value)}
            className="setup-input"
            placeholder="e.g. 24"
            disabled={submitting}
          />
        </label>
      </div>

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
            !competitionFormat ||
            !seasonReady ||
            !scheduleReady ||
            !maxPlayersReady
          }
        >
          {submitting ? submittingLabel : submitLabel}
        </TouchButton>
      </div>
    </form>
  );
}
