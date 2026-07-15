"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { CreateOrganizationForm } from "@/features/organizations/components/CreateOrganizationForm";
import type { CreateOrganizationFormInput } from "@/features/organizations/components/CreateOrganizationForm";
import { useOrganizations } from "@/features/organizations/hooks/useOrganizations";
import { LOGIN_PATH } from "@/lib/auth/routes";
import type { OrganizationMembership } from "@/lib/supabase/queries/organizations";

interface OrganizationsPanelProps {
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
  hideCreateButton?: boolean;
  /** Render list content without its own GlassPanel (parent provides the card). */
  bare?: boolean;
  /** Only keep the create venue sheet (parent renders the list). */
  hideList?: boolean;
  /** Cap how many venues are shown in the list (e.g. dashboard preview). */
  listLimit?: number;
  /** When set, venue rows open this callback instead of navigating to detail. */
  onVenueClick?: (membership: OrganizationMembership) => void;
}

export function OrganizationsPanel({
  createOpen: controlledCreateOpen,
  onCreateOpenChange,
  hideCreateButton = false,
  bare = false,
  hideList = false,
  listLimit,
  onVenueClick,
}: OrganizationsPanelProps = {}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    memberships,
    loading,
    saving,
    error,
    isCloudConfigured,
    createOrganization,
  } = useOrganizations();
  const [uncontrolledCreateOpen, setUncontrolledCreateOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isCreateControlled = typeof controlledCreateOpen === "boolean";
  const createOpen = isCreateControlled ? controlledCreateOpen : uncontrolledCreateOpen;

  const setCreateOpen = (open: boolean) => {
    if (isCreateControlled) {
      onCreateOpenChange?.(open);
      return;
    }

    setUncontrolledCreateOpen(open);
  };

  useEffect(() => {
    if (!createOpen) {
      setFormError(null);
    }
  }, [createOpen]);

  const closeCreateSheet = () => {
    setCreateOpen(false);
    setFormError(null);
  };

  const handleCreate = async (input: CreateOrganizationFormInput) => {
    setFormError(null);

    try {
      const membership = await createOrganization({
        name: input.name,
        description: input.description,
        primaryContactName: input.primaryContactName,
        primaryContactEmail: input.primaryContactEmail,
        primaryContactPhone: input.primaryContactPhone,
        avatarFile: input.avatarFile,
      });
      closeCreateSheet();
      router.push(`/leagues/${membership.organization.slug}`);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Unable to create venue.",
      );
    }
  };

  const Frame = bare ? "div" : GlassPanel;

  if (!isCloudConfigured) {
    if (hideList) {
      return null;
    }

    return (
      <Frame>
        <p className="settings-panel__subdescription">
          Connect Supabase to create and manage venues.
        </p>
      </Frame>
    );
  }

  if (authLoading || loading) {
    if (hideList) {
      return null;
    }

    return (
      <Frame>
        <p className="settings-panel__subdescription">Loading venues...</p>
      </Frame>
    );
  }

  if (!user) {
    if (hideList) {
      return null;
    }

    return (
      <Frame>
        <p className="settings-panel__subdescription">
          Sign in to view and create venues.
        </p>
        <Link href={LOGIN_PATH} className="mt-4 block">
          <TouchButton fullWidth size="lg">
            Sign in
          </TouchButton>
        </Link>
      </Frame>
    );
  }

  return (
    <>
      {!hideList ? (
        <Frame className={bare ? undefined : "space-y-4"}>
          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="organization-list">
            {memberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You do not have any venues yet.
              </p>
            ) : (
              (typeof listLimit === "number"
                ? memberships.slice(0, listLimit)
                : memberships
              ).map((membership) => {
                const { organization } = membership;
                const content = (
                  <>
                    <span className="organization-list__avatar" aria-hidden>
                      {organization.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={organization.logo_url} alt="" />
                      ) : (
                        organization.name.trim().charAt(0).toUpperCase() || "V"
                      )}
                    </span>
                    <div className="organization-list__copy">
                      <p className="organization-list__name">{organization.name}</p>
                      {organization.primary_contact_name ? (
                        <p className="organization-list__description">
                          {organization.primary_contact_name}
                        </p>
                      ) : organization.description ? (
                        <p className="organization-list__description">
                          {organization.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="organization-list__chevron" aria-hidden>
                      ›
                    </span>
                  </>
                );

                if (onVenueClick) {
                  return (
                    <button
                      key={organization.id}
                      type="button"
                      className="organization-list__row organization-list__row--button"
                      onClick={() => onVenueClick(membership)}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={organization.id}
                    href={`/leagues/${organization.slug}`}
                    className="organization-list__row"
                  >
                    {content}
                  </Link>
                );
              })
            )}
          </div>

          {!hideCreateButton ? (
            <TouchButton fullWidth size="lg" onClick={() => setCreateOpen(true)}>
              Create venue
            </TouchButton>
          ) : null}
        </Frame>
      ) : null}

      <BottomSheet
        open={createOpen}
        title="Create venue"
        onClose={closeCreateSheet}
        className="create-venue-modal"
      >
        <div className="sheet-form create-venue-modal__body">
          <CreateOrganizationForm
            submitting={saving}
            error={formError}
            onCancel={closeCreateSheet}
            onSubmit={handleCreate}
          />
        </div>
      </BottomSheet>
    </>
  );
}
