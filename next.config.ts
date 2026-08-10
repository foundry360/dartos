import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow a second local `next dev` (e.g. port 3001) via NEXT_DIST_DIR=.next-3001
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {},
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // start_url redirects by auth; tell Workbox the public landing page.
  dynamicStartUrl: true,
  dynamicStartUrlRedirect: "/login",
  // Default next-pwa precaches all of /public. Heavy media keeps the SW stuck in
  // "installing" on Android tablets, which hides Install app.
  // Note: each pattern must be prefixed with "!" per @ducanh2912/next-pwa.
  publicExcludes: [
    "!sounds/**/*",
    "!marketing/**/*",
    "!email-previews/**/*",
    "!email/**/*",
    "!player/**/*",
    "!wallet/**/*",
    "!auth/**/*",
    "!dartos-home-mockup.png",
    "!dartos-home-mockup-landscape.png",
    "!home-cricket-icon.png",
    "!home-practice-icon.png",
    "!vectoros-logo-email.png",
    "!vectoros-logo.png",
    "!vectoros-splash-logo.png",
  ],
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    // Keep the install-time precache tiny. App JS/CSS are loaded from network.
    maximumFileSizeToCacheInBytes: 512 * 1024,
    exclude: [
      ({ asset }) => {
        const name = asset.name ?? "";
        // Precaching every Next chunk makes Android SW install take minutes/fail.
        if (/\.(js|css|map|woff2?|ttf|otf)$/i.test(name)) return true;
        if (name.includes("static/chunks") || name.includes("static/media")) return true;
        return false;
      },
    ],
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 5,
        },
      },
      {
        urlPattern: ({ url }) =>
          url.pathname.startsWith("/api/voice-clip") ||
          url.pathname.startsWith("/api/local-say") ||
          url.pathname.startsWith("/api/tts"),
        handler: "NetworkOnly",
        options: {
          cacheName: "voice-api",
        },
      },
      {
        urlPattern: ({ url }) =>
          url.hostname.endsWith(".supabase.co") &&
          url.pathname.includes("/storage/v1/object/public/voice-clips/"),
        handler: "NetworkOnly",
        options: {
          cacheName: "voice-cdn",
        },
      },
    ],
  },
})(nextConfig);
