import type { BoardTheme, BoardThemeColors } from "@/lib/board-themes";
import type { BoardThemeRow } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

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
