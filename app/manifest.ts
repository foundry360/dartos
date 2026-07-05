import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DartScorer",
    short_name: "DartScorer",
    description: "Professional dart scoring for cricket, 501, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#070708",
    theme_color: "#070708",
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
