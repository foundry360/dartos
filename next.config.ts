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
  // Default next-pwa precaches all of /public. Sounds + marketing alone are ~1000
  // files, which keeps the SW stuck in "installing" on Android and hides Install.
  // Note: each pattern must be prefixed with "!" per @ducanh2912/next-pwa.
  publicExcludes: [
    "!sounds/**/*",
    "!marketing/**/*",
    "!email-previews/**/*",
    "!email/**/*",
    "!dartos-home-mockup.png",
    "!dartos-home-mockup-landscape.png",
  ],
  workboxOptions: {
    skipWaiting: true,
    // Voice clips / large assets are fetched on demand (see NetworkOnly rules below).
    maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
    runtimeCaching: [
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
