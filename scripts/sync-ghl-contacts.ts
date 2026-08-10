/**
 * One-off / ops: upsert Supabase profiles into GoHighLevel.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/sync-ghl-contacts.ts
 *   npx tsx --env-file=.env scripts/sync-ghl-contacts.ts --subscribers-only
 *
 * Use production Supabase + GHL keys in .env when backfilling live contacts.
 */
import { createAdminClient } from "../lib/supabase/admin";
import { isGhlConfigured } from "../lib/ghl/env";
import { syncUserContactToGhl } from "../lib/ghl/upsert-contact";

const subscribersOnly = process.argv.includes("--subscribers-only");

async function main() {
  if (!isGhlConfigured()) {
    throw new Error("Set GHL_PRIVATE_TOKEN and GHL_LOCATION_ID in .env");
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client unavailable (check NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  }

  let subscriberIds: Set<string> | null = null;
  if (subscribersOnly) {
    const { data: subscriptions, error: subscriptionsError } = await admin
      .from("subscriptions")
      .select("user_id")
      .order("updated_at", { ascending: false });

    if (subscriptionsError) {
      throw new Error(subscriptionsError.message);
    }

    subscriberIds = new Set(
      (subscriptions ?? []).map((row) => row.user_id).filter(Boolean),
    );
    console.log(`Found ${subscriberIds.size} user(s) with a subscription row.`);
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, account_kind, deactivated_at")
    .is("deactivated_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (profiles ?? []).filter((profile) =>
    subscriberIds ? subscriberIds.has(profile.id) : true,
  );
  console.log(
    `Syncing ${rows.length} active profile(s)${subscribersOnly ? " (subscribers only)" : ""} to GoHighLevel…`,
  );

  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const profile of rows) {
    const label = profile.display_name?.trim() || profile.id;
    try {
      const result = await syncUserContactToGhl(admin, profile.id);
      if (result.status === "synced") {
        synced += 1;
        console.log(`✓ ${label} (${profile.account_kind}): synced`, result.contactId ?? "");
      } else {
        skipped += 1;
        console.log(`· ${label} (${profile.account_kind}): ${result.status} — ${result.reason}`);
      }
    } catch (caught) {
      failed += 1;
      const message = caught instanceof Error ? caught.message : String(caught);
      console.error(`✗ ${label}: ${message}`);
    }
  }

  console.log(`Done. synced=${synced} skipped=${skipped} failed=${failed}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
