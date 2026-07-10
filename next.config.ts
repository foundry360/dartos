import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
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
