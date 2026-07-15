import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  getPostAuthDestination,
  resolvePostAuthDestination,
} from "@/lib/auth/post-auth-path";
import { LOGIN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next");

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(LOGIN_PATH, origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const next = user
        ? await resolvePostAuthDestination(supabase, user.id, nextParam)
        : getPostAuthDestination(nextParam);
      return NextResponse.redirect(new URL(next, origin));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const next = user
        ? await resolvePostAuthDestination(supabase, user.id, nextParam)
        : getPostAuthDestination(nextParam);
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const errorUrl = new URL(LOGIN_PATH, origin);
  errorUrl.searchParams.set("error", "auth_callback");
  return NextResponse.redirect(errorUrl);
}
