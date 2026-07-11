import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  APP_HOME_PATH,
  getSafeNextPath,
  isPublicPath,
  LOGIN_PATH,
} from "@/lib/auth/routes";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

function redirectWithCookies(url: URL, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  const pathname = request.nextUrl.pathname;

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? APP_HOME_PATH : LOGIN_PATH;
    redirectUrl.search = "";
    return redirectWithCookies(redirectUrl, supabaseResponse);
  }

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", pathname);
    return redirectWithCookies(redirectUrl, supabaseResponse);
  }

  if (user && pathname === LOGIN_PATH) {
    const redirectUrl = request.nextUrl.clone();
    const nextParam = request.nextUrl.searchParams.get("next");
    redirectUrl.pathname = nextParam
      ? getSafeNextPath(nextParam, APP_HOME_PATH)
      : APP_HOME_PATH;
    redirectUrl.search = "";
    return redirectWithCookies(redirectUrl, supabaseResponse);
  }

  return supabaseResponse;
}
