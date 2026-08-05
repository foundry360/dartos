/**
 * One-off / ops: upsert all Supabase profiles into GoHighLevel.
 * Usage: npx tsx --env-file=.env scripts/sync-ghl-contacts.ts
 */
import { createAdminClient } from "../lib/supabase/admin";
import { isGhlConfigured } from "../lib/ghl/env";
import { syncUserContactToGhl } from "../lib/ghl/upsert-contact";

async function main() {
  if (!isGhlConfigured()) {
    throw new Error("Set GHL_PRIVATE_TOKEN and GHL_LOCATION_ID in .env");
  }

  const admin = createAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client unavailable (check NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
  }

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, account_kind, deactivated_at")
    .is("deactivated_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = profiles ?? [];
  console.log(`Found ${rows.length} active profile(s). Syncing to GoHighLevel…`);

  for (const profile of rows) {
    const label = profile.display_name?.trim() || profile.id;
    try {
      const result = await syncUserContactToGhl(admin, profile.id);
      console.log(`✓ ${label} (${profile.account_kind}): ${result.status}`, result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      console.error(`✗ ${label}: ${message}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
