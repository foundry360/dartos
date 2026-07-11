import { IBM_Plex_Mono, Inter, Manrope } from "next/font/google";

const manrope = Manrope({
  variable: "--font-auth-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const inter = Inter({
  variable: "--font-auth-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-auth-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${manrope.variable} ${inter.variable} ${ibmPlexMono.variable} auth-page-root`}
    >
      {children}
    </div>
  );
}
