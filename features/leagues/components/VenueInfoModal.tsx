"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  CreateOrganizationForm,
  type CreateOrganizationFormInput,
} from "@/features/organizations/components/CreateOrganizationForm";
import {
  formatOrganizationRole,
  type OrganizationMembership,
  type UpdateOrganizationInput,
} from "@/lib/supabase/queries/organizations";
import { cn } from "@/utils/cn";

export interface VenueActiveLeagueSummary {
  id: string;
  name: string;
  formatLabel: string | null;
  seasonName: string | null;
}

interface VenueInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: OrganizationMembership | null;
  activeLeagues?: VenueActiveLeagueSummary[];
  saving?: boolean;
  onSave?: (input: UpdateOrganizationInput) => Promise<OrganizationMembership>;
}

export function VenueInfoModal({
  open,
  onOpenChange,
  venue,
  activeLeagues = [],
  saving = false,
  onSave,
}: VenueInfoModalProps) {
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const organization = venue?.organization;
  const role = venue?.role;
  const canEdit = Boolean(onSave) && role === "owner";

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setFormError(null);
    }
  }, [open]);

  useEffect(() => {
    setEditing(false);
    setFormError(null);
  }, [venue?.organization.id]);

  const close = () => {
    setEditing(false);
    setFormError(null);
    onOpenChange(false);
  };

  const handleSave = async (input: CreateOrganizationFormInput) => {
    if (!venue || !onSave) {
      return;
    }

    setFormError(null);

    try {
      await onSave({
        organizationId: venue.organization.id,
        name: input.name,
        description: input.description,
        primaryContactName: input.primaryContactName,
        primaryContactEmail: input.primaryContactEmail,
        primaryContactPhone: input.primaryContactPhone,
        avatarFile: input.avatarFile,
        removeAvatar: input.removeAvatar,
      });
      setEditing(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to update venue.",
      );
    }
  };

  return (
    <BottomSheet
      open={open && Boolean(venue)}
      title={editing ? "Edit venue" : (organization?.name ?? "Venue")}
      onClose={close}
      className="venues-info-modal"
    >
      {organization && role ? (
        <div className="venues-info-modal__body">
          {editing ? (
            <div className="sheet-form venues-info-modal__edit">
              <CreateOrganizationForm
                key={`${organization.id}-edit`}
                initialValues={{
                  name: organization.name,
                  description: organization.description,
                  primaryContactName: organization.primary_contact_name,
                  primaryContactEmail: organization.primary_contact_email,
                  primaryContactPhone: organization.primary_contact_phone,
                  logoUrl: organization.logo_url,
                }}
                submitting={saving}
                error={formError}
                submitLabel="Save changes"
                submittingLabel="Saving..."
                onCancel={() => {
                  setEditing(false);
                  setFormError(null);
                }}
                onSubmit={handleSave}
              />
            </div>
          ) : (
            <>
              <div className="venues-info-modal__card venues-info-modal__card--solo">
                <div className="venues-info-modal__card-header">
                  <div className="venues-info-modal__identity">
                    <span className="venues-info-modal__avatar" aria-hidden>
                      {organization.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={organization.logo_url} alt="" />
                      ) : (
                        organization.name.trim().charAt(0).toUpperCase() || "V"
                      )}
                    </span>
                    <div className="venues-info-modal__titles">
                      <p className="venues-info-modal__name venues-info-modal__name--static">
                        {organization.name}
                      </p>
                      <span
                        className={cn(
                          "venues-info-modal__role",
                          `venues-info-modal__role--${role}`,
                        )}
                      >
                        {formatOrganizationRole(role)}
                      </span>
                    </div>
                  </div>
                  <p className="venues-info-modal__leagues">
                    {activeLeagues.length}{" "}
                    {activeLeagues.length === 1 ? "active league" : "active leagues"}
                  </p>
                </div>

                {organization.description ? (
                  <p className="venues-info-modal__description">
                    {organization.description}
                  </p>
                ) : (
                  <p className="venues-info-modal__description">
                    No description yet.
                  </p>
                )}

                <dl className="venues-info-modal__meta">
                  <div>
                    <dt>Contact</dt>
                    <dd>{organization.primary_contact_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{organization.primary_contact_email ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Phone</dt>
                    <dd>{organization.primary_contact_phone ?? "—"}</dd>
                  </div>
                </dl>
              </div>

              <section className="venues-info-modal__section" aria-label="Active leagues">
                <h4 className="venues-info-modal__section-title">Active leagues</h4>
                {activeLeagues.length === 0 ? (
                  <p className="venues-info-modal__empty">No active leagues.</p>
                ) : (
                  <ul className="venues-info-modal__league-list">
                    {activeLeagues.map((league) => {
                      const meta = [league.seasonName, league.formatLabel]
                        .filter(Boolean)
                        .join(" · ");

                      return (
                        <li key={league.id}>
                          <Link
                            href={`/leagues/league/${league.id}`}
                            className="venues-info-modal__league-row"
                            onClick={close}
                          >
                            <span className="venues-info-modal__league-name">
                              {league.name}
                            </span>
                            {meta ? (
                              <span className="venues-info-modal__league-meta">
                                {meta}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {canEdit ? (
                <button
                  type="button"
                  className="venues-info-modal__open"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </BottomSheet>
  );
}
