import type { MetadataRoute } from "next";
import { APP_NAME, APP_PRIMARY_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Professional dart scoring for cricket, 501, and more.",
    // Root resolves plan-based landing (League Pro → /leagues, others → /home).
    start_url: "/",
    // standalone is more reliable for Chrome desktop install prompts than fullscreen
    display: "standalone",
    display_override: ["standalone", "fullscreen"],
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
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
