"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MobileAppShell } from "@/components/layout/MobileAppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { EliteUpgradePanel } from "@/features/organizations/components/EliteUpgradePanel";
import { useLeagueManagementAccess } from "@/features/organizations/hooks/useLeagueManagementAccess";
import { useOrganizationDetail } from "@/features/organizations/hooks/useOrganizationDetail";
import { LOGIN_PATH } from "@/lib/auth/routes";
import "@/features/organizations/organizations-page.css";

export function OrganizationDetailScreen() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : undefined;
  const { user, loading: authLoading } = useAuth();
  const {
    allowed: canManageLeagues,
    loading: accessLoading,
  } = useLeagueManagementAccess();
  const { membership, loading, error, notFound, isCloudConfigured } =
    useOrganizationDetail(slug);

  const pageLoading = authLoading || loading || accessLoading;

  return (
    <MobileAppShell title="Venue" className="organizations-page shell-page">
      <div className="organizations-screen">
        <div className="organization-detail__nav">
          <Link href="/leagues" className="organization-detail__back">
            ← League Management
          </Link>
        </div>

        {!isCloudConfigured ? (
          <GlassPanel>
            <h2 className="settings-panel__subheading text-2xl font-bold">
              Venue
            </h2>
            <p className="settings-panel__subdescription">
              Connect Supabase to view venue details.
            </p>
          </GlassPanel>
        ) : pageLoading ? (
          <GlassPanel>
            <h2 className="settings-panel__subheading text-2xl font-bold">
              Venue
            </h2>
            <p className="settings-panel__subdescription">Loading venue...</p>
          </GlassPanel>
        ) : !user ? (
          <GlassPanel>
            <h2 className="settings-panel__subheading text-2xl font-bold">
              Venue
            </h2>
            <p className="settings-panel__subdescription">
              Sign in to view this venue.
            </p>
            <Link href={LOGIN_PATH} className="mt-4 block">
              <TouchButton fullWidth size="lg">
                Sign in
              </TouchButton>
            </Link>
          </GlassPanel>
        ) : !canManageLeagues ? (
          <EliteUpgradePanel
            title="League Pro required"
            description="Venue details and league management are included with the League Pro plan."
          />
        ) : error ? (
          <GlassPanel>
            <h2 className="settings-panel__subheading text-2xl font-bold">
              Venue
            </h2>
            <p className="text-sm text-danger">{error}</p>
          </GlassPanel>
        ) : notFound || !membership ? (
          <GlassPanel>
            <h2 className="settings-panel__subheading text-2xl font-bold">
              Venue not found
            </h2>
            <p className="settings-panel__subdescription">
              This venue does not exist or you do not have access.
            </p>
            <Link href="/leagues" className="mt-4 block">
              <TouchButton fullWidth size="lg" variant="secondary">
                Back to League Management
              </TouchButton>
            </Link>
          </GlassPanel>
        ) : (
          <GlassPanel className="organization-detail space-y-4">
            <div className="organization-detail__header">
              <div className="organization-detail__identity">
                <span className="organization-detail__avatar" aria-hidden>
                  {membership.organization.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={membership.organization.logo_url} alt="" />
                  ) : (
                    membership.organization.name.trim().charAt(0).toUpperCase() || "V"
                  )}
                </span>
                <div>
                  <h2 className="settings-panel__subheading text-2xl font-bold">
                    {membership.organization.name}
                  </h2>
                  <p className="organization-detail__slug">
                    /{membership.organization.slug}
                  </p>
                </div>
              </div>
            </div>

            {membership.organization.description ? (
              <p className="organization-detail__description">
                {membership.organization.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No description yet.</p>
            )}

            <dl className="organization-detail__meta">
              <div>
                <dt>Primary contact / organizer</dt>
                <dd>
                  {membership.organization.primary_contact_name ||
                  membership.organization.primary_contact_email ? (
                    <div className="organization-detail__contact">
                      {membership.organization.primary_contact_name ? (
                        <span>{membership.organization.primary_contact_name}</span>
                      ) : null}
                      {membership.organization.primary_contact_email ? (
                        <span>{membership.organization.primary_contact_email}</span>
                      ) : null}
                    </div>
                  ) : (
                    "Not set"
                  )}
                </dd>
              </div>
            </dl>

            <p className="organization-detail__footnote">
              Boards, matches, and venue details will appear here in a future update.
            </p>
          </GlassPanel>
        )}
      </div>
    </MobileAppShell>
  );
}
