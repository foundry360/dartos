import type { MetadataRoute } from "next";
import { APP_PRIMARY_COLOR } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DartScorer",
    short_name: "DartScorer",
    description: "Professional dart scoring for cricket, 501, and more.",
    start_url: "/",
    display: "standalone",
    display_override: ["fullscreen", "standalone"],
    background_color: "#070708",
    theme_color: APP_PRIMARY_COLOR,
    orientation: "any",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
