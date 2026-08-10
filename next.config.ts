import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow a second local `next dev` (e.g. port 3001) via NEXT_DIST_DIR=.next-3001
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {},
};

// Keep the plugin wired but disabled. We ship a committed minimal `public/sw.js`
// and register it ourselves — next-pwa's Workbox precache was blocking Android install.
export default withPWA({
  dest: "public",
  disable: true,
  register: false,
})(nextConfig);
