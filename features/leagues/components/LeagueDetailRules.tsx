"use client";

import { useEffect, useMemo, useState } from "react";
import { OptionPickerField } from "@/components/ui/OptionPickerField";
import { TouchButton } from "@/components/ui/TouchButton";
import { formatLeagueGameFormatLabel } from "@/features/leagues/lib/league-formats";
import {
  formatLeagueRulesSummaryRows,
  getDefaultLeagueRules,
  getLeagueRuleFieldGroups,
  leagueHasSavedRules,
  normalizeLeagueRules,
  validateLeagueRules,
  type LeagueGameRules,
  type MixedRotationGame,
} from "@/features/leagues/lib/league-game-rules";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  updateLeagueRules,
  type LeagueWithVenue,
} from "@/lib/supabase/queries/leagues";
import { cn } from "@/utils/cn";

interface LeagueDetailRulesProps {
  leagueEntry: LeagueWithVenue;
  onLeagueUpdated: (entry: LeagueWithVenue) => void;
}

function readFieldValue(
  rules: LeagueGameRules,
  key: string,
): string | number | string[] | null {
  const record = rules as unknown as Record<string, unknown>;
  const value = record[key];

  if (value == null) {
    return null;
  }

  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return null;
}

function patchRules(
  rules: LeagueGameRules,
  key: string,
  value: string | number | string[] | null,
): LeagueGameRules {
  return {
    ...rules,
    [key]: value === "" ? null : value,
  } as LeagueGameRules;
}

export function LeagueDetailRules({
  leagueEntry,
  onLeagueUpdated,
}: LeagueDetailRulesProps) {
  const { league } = leagueEntry;
  const gameFormat = league.game_format;
  const gameFormatLabel = formatLeagueGameFormatLabel(gameFormat);
  const fieldGroups = useMemo(
    () => getLeagueRuleFieldGroups(gameFormat),
    [gameFormat],
  );

  const [draft, setDraft] = useState<LeagueGameRules | null>(() =>
    normalizeLeagueRules(league.rules, gameFormat),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(normalizeLeagueRules(league.rules, league.game_format));
    setError(null);
    setSavedFlash(false);
  }, [league.id, league.game_format, league.rules, league.updated_at]);

  const hasSaved = leagueHasSavedRules(league);
  const previewRows = useMemo(() => {
    if (!draft) {
      return [];
    }

    return formatLeagueRulesSummaryRows(draft, gameFormatLabel);
  }, [draft, gameFormatLabel]);

  async function handleSave() {
    if (!draft) {
      return;
    }

    const validationError = validateLeagueRules(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (league.id.startsWith("sample-") || !isSupabaseConfigured()) {
        onLeagueUpdated({
          ...leagueEntry,
          league: {
            ...league,
            rules: draft as unknown as LeagueWithVenue["league"]["rules"],
            updated_at: new Date().toISOString(),
          },
        });
        setSavedFlash(true);
        return;
      }

      const supabase = createClient();

      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      const updated = await updateLeagueRules(supabase, league.id, draft);
      onLeagueUpdated(updated);
      setSavedFlash(true);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to save game rules.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    const defaults = getDefaultLeagueRules(gameFormat);
    setDraft(defaults);
    setError(null);
    setSavedFlash(false);
  }

  if (!gameFormat || !draft || fieldGroups.length === 0) {
    return (
      <div className="league-workspace league-workspace--single">
        <section className="league-detail-card">
          <h2 className="league-detail-card__title">Game Rules</h2>
          <p className="league-detail-card__copy">
            Set a Game Format on the league first. Rules fields are based on the
            selected format and apply to every scheduled match.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="league-workspace league-rules">
      <div className="league-workspace__main">
        <section className="league-detail-card league-rules__intro">
          <div className="league-detail-card__header">
            <div>
              <h2 className="league-detail-card__title">Game Rules</h2>
              <p className="league-rules__lede">
                Define scoring and gameplay rules for{" "}
                <strong>{gameFormatLabel}</strong>.
              </p>
            </div>
            {hasSaved ? (
              <span className="league-rules__badge">Saved</span>
            ) : (
              <span className="league-rules__badge league-rules__badge--draft">
                Not saved
              </span>
            )}
          </div>
        </section>

        {fieldGroups.map((group) => (
          <section key={group.id} className="league-detail-card">
            <div className="league-detail-card__header">
              <div>
                <h2 className="league-detail-card__title">{group.title}</h2>
                {group.description ? (
                  <p className="league-rules__group-desc">{group.description}</p>
                ) : null}
              </div>
            </div>

            <div className="league-rules__fields">
              {group.fields.map((field) => {
                if (field.type === "readonly") {
                  return (
                    <div key={field.key} className="league-rules__field">
                      <span className="league-rules__label">{field.label}</span>
                      <p className="league-rules__readonly">{field.displayValue}</p>
                    </div>
                  );
                }

                if (field.type === "number") {
                  const rawValue = readFieldValue(draft, field.key);
                  const displayValue =
                    rawValue === "" || rawValue == null ? "" : String(rawValue);
                  return (
                    <label key={field.key} className="league-rules__field">
                      <span className="league-rules__label">{field.label}</span>
                      <input
                        type="number"
                        className="league-rules__input"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={displayValue}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        onChange={(event) => {
                          const next = event.target.value;
                          setDraft(
                            patchRules(
                              draft,
                              field.key,
                              next === "" ? null : Number(next),
                            ),
                          );
                          setSavedFlash(false);
                        }}
                      />
                    </label>
                  );
                }

                if (field.type === "textarea") {
                  const value = String(readFieldValue(draft, field.key) ?? "");
                  return (
                    <label key={field.key} className="league-rules__field">
                      <span className="league-rules__label">{field.label}</span>
                      <textarea
                        className="league-rules__textarea"
                        rows={field.rows ?? 8}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(event) => {
                          setDraft(
                            patchRules(draft, field.key, event.target.value),
                          );
                          setSavedFlash(false);
                        }}
                      />
                    </label>
                  );
                }

                if (field.type === "multiselect") {
                  const selected = readFieldValue(draft, field.key);
                  const selectedSet = new Set(
                    Array.isArray(selected) ? selected : [],
                  );

                  return (
                    <div key={field.key} className="league-rules__field">
                      <span className="league-rules__label">{field.label}</span>
                      <div className="league-rules__chips" role="group">
                        {field.options.map((option) => {
                          const active = selectedSet.has(option.value);
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={cn(
                                "league-rules__chip",
                                active && "is-active",
                              )}
                              aria-pressed={active}
                              onClick={() => {
                                const next = new Set(selectedSet);
                                if (next.has(option.value)) {
                                  next.delete(option.value);
                                } else {
                                  next.add(option.value);
                                }
                                setDraft(
                                  patchRules(draft, field.key, [
                                    ...next,
                                  ] as MixedRotationGame[]),
                                );
                                setSavedFlash(false);
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const raw = readFieldValue(draft, field.key);
                const value = raw == null ? "" : String(raw);
                return (
                  <div key={field.key} className="league-rules__field">
                    <OptionPickerField
                      label={field.label}
                      value={value}
                      options={field.options}
                      placeholder={`Select ${field.label.toLowerCase()}`}
                      allowClear={false}
                      onChange={(next) => {
                        setDraft(patchRules(draft, field.key, next || null));
                        setSavedFlash(false);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <aside className="league-workspace__side">
        <section className="league-detail-card">
          <div className="league-detail-card__header">
            <h2 className="league-detail-card__title">Preview</h2>
          </div>
          <dl className="league-info">
            {previewRows.map((row) => (
              <div key={row.label} className="league-info__row">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {error ? <p className="league-rules__error">{error}</p> : null}
        {savedFlash ? (
          <p className="league-rules__success">
            Game rules saved. Scheduled matches will inherit these settings.
          </p>
        ) : null}

        <div className="league-rules__actions">
          <TouchButton
            type="button"
            variant="secondary"
            onClick={handleResetDefaults}
            disabled={saving}
          >
            Clear
          </TouchButton>
          <TouchButton
            type="button"
            variant="primary"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Game Rules"}
          </TouchButton>
        </div>
      </aside>
    </div>
  );
}
