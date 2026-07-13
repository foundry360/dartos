import type { MetadataRoute } from "next";
import { APP_PRIMARY_COLOR } from "@/lib/theme";

import { APP_NAME } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Professional dart scoring for cricket, 501, and more.",
    start_url: "/home",
    display: "fullscreen",
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
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
