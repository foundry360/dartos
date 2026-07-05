import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { checkSupabaseConnection } from "@/lib/supabase/queries/board-themes";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      message: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local",
    });
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({
      configured: true,
      connected: false,
      message: "Supabase client could not be created",
    });
  }

  const result = await checkSupabaseConnection(supabase);

  if (!result.ok) {
    return NextResponse.json({
      configured: true,
      connected: false,
      message: result.message,
    });
  }

  return NextResponse.json({
    configured: true,
    connected: true,
    themeCount: result.themeCount,
  });
}
