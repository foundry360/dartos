import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isPublicPath,
  LOGIN_PATH,
  SUBSCRIBE_PATH,
  VERIFY_EMAIL_PATH,
} from "@/lib/auth/routes";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";
import {
  getDefaultAppLandingPath,
  resolvePostAuthDestination,
} from "@/lib/auth/post-auth-path";
import {
  fetchProfileDeactivatedAt,
  isAccountDeactivated,
} from "@/lib/account/account-status";
import { getSignUpNextPath } from "@/features/onboarding/lib/onboarding-path";
import {
  isSubscribeFlowPath,
  isSubscriptionEnforcementEnabled,
  userHasActiveSubscription,
} from "@/lib/subscription/access";

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

  if (user) {
    const deactivatedAt = await fetchProfileDeactivatedAt(supabase, user.id);

    if (isAccountDeactivated({ deactivated_at: deactivatedAt })) {
      await supabase.auth.signOut();

      if (!isPublicPath(pathname) && pathname !== LOGIN_PATH) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = LOGIN_PATH;
        redirectUrl.search = "";
        redirectUrl.searchParams.set("error", "account_deactivated");
        return redirectWithCookies(redirectUrl, supabaseResponse);
      }
    }
  }

  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    if (user) {
      redirectUrl.pathname = await getDefaultAppLandingPath(supabase, user.id);
    } else {
      redirectUrl.pathname = LOGIN_PATH;
    }
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
    const destination = await resolvePostAuthDestination(
      supabase,
      user.id,
      nextParam,
    );
    const destinationUrl = new URL(destination, request.url);
    redirectUrl.pathname = destinationUrl.pathname;
    redirectUrl.search = destinationUrl.search;
    return redirectWithCookies(redirectUrl, supabaseResponse);
  }

  if (user && pathname === VERIFY_EMAIL_PATH) {
    const redirectUrl = request.nextUrl.clone();
    const destination = new URL(getSignUpNextPath(request.nextUrl.searchParams), request.url);
    redirectUrl.pathname = destination.pathname;
    redirectUrl.search = destination.search;
    return redirectWithCookies(redirectUrl, supabaseResponse);
  }

  if (
    user &&
    isSubscriptionEnforcementEnabled() &&
    !isSubscribeFlowPath(pathname) &&
    !isPublicPath(pathname)
  ) {
    const hasSubscription = await userHasActiveSubscription(supabase, user.id);

    if (!hasSubscription) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = SUBSCRIBE_PATH;
      redirectUrl.search = "";
      return redirectWithCookies(redirectUrl, supabaseResponse);
    }
  }

  return supabaseResponse;
}
