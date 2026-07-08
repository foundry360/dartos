import type { BoardTheme, BoardThemeColors } from "@/lib/board-themes";
import { BOARD_THEMES, getBoardTheme } from "@/lib/board-themes";
import type { BoardThemeRow } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

function isBoardThemeColors(value: unknown): value is BoardThemeColors {
  if (!value || typeof value !== "object") {
    return false;
  }

  const colors = value as Record<string, unknown>;

  return (
    typeof colors.boardBase === "string" &&
    typeof colors.segmentPrimary === "string" &&
    typeof colors.segmentSecondary === "string" &&
    typeof colors.triple === "string" &&
    typeof colors.double === "string" &&
    typeof colors.bullOuter === "string" &&
    typeof colors.bullInner === "string" &&
    typeof colors.wire === "string" &&
    typeof colors.wireDark === "string" &&
    typeof colors.label === "string"
  );
}

export function mapBoardThemeRow(row: BoardThemeRow): BoardTheme | null {
  if (!isBoardThemeColors(row.colors)) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    colors: row.colors,
  };
}

export async function fetchBoardThemes(
  supabase: SupabaseClient<Database>,
): Promise<BoardTheme[]> {
  const { data, error } = await supabase
    .from("board_themes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map(mapBoardThemeRow)
    .filter((theme): theme is BoardTheme => theme !== null);
}

function getBundledBoardThemeSortOrder(themeId: string): number {
  const index = BOARD_THEMES.findIndex((theme) => theme.id === themeId);
  return index >= 0 ? index : 99;
}

function isMissingRpcError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  const message = candidate.message?.toLowerCase() ?? "";

  return (
    candidate.code === "42883" ||
    candidate.code === "PGRST202" ||
    message.includes("could not find the function") ||
    message.includes("schema cache")
  );
}

export async function ensureBoardThemeInDatabase(
  supabase: SupabaseClient<Database>,
  themeId: string,
): Promise<boolean> {
  const theme = getBoardTheme(themeId);

  const { error } = await supabase.rpc("ensure_board_theme", {
    theme_id: theme.id,
    theme_name: theme.name,
    theme_description: theme.description,
    theme_colors: theme.colors as unknown as Json,
    theme_sort_order: getBundledBoardThemeSortOrder(theme.id),
  });

  if (error) {
    if (isMissingRpcError(error)) {
      return false;
    }

    throw error;
  }

  return true;
}

export async function ensureBoardThemeSyncedForProfile(
  supabase: SupabaseClient<Database>,
  themeId: string,
): Promise<string | null> {
  const remoteThemes = await fetchBoardThemes(supabase);
  const remoteIds = new Set(remoteThemes.map((theme) => theme.id));

  if (remoteIds.has(themeId)) {
    return themeId;
  }

  const ensured = await ensureBoardThemeInDatabase(supabase, themeId);
  return ensured ? themeId : null;
}

export async function checkSupabaseConnection(
  supabase: SupabaseClient<Database>,
): Promise<{ ok: true; themeCount: number } | { ok: false; message: string }> {
  const { count, error } = await supabase
    .from("board_themes")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, themeCount: count ?? 0 };
}
