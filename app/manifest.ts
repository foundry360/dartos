import type { MetadataRoute } from "next";
import { APP_NAME, APP_PRIMARY_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Professional dart scoring for cricket, 501, and more.",
    // Public document (no auth redirect). Logged-in users are bounced onward by middleware.
    // Keep id + start_url aligned; bump the pwa token when tablets are stuck on a ghost WebAPK.
    start_url: "/login?pwa=vectoros-v3",
    scope: "/",
    id: "/?pwa=vectoros-v3",
    // Keep display simple — some Android Chrome builds are picky about display_override.
    display: "standalone",
    prefer_related_applications: false,
    background_color: "#070708",
    theme_color: APP_PRIMARY_COLOR,
    orientation: "any",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
