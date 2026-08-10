import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static PWA / icon assets so installability checks never hit auth redirects.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw\\.js|pwa-install-capture\\.js|icon|apple-icon|\\.well-known/|downloads/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|apk|aab|json)$).*)",
  ],
};
