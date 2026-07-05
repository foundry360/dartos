import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { AppFullscreenProvider } from "@/components/providers/AppFullscreenProvider";
import { APP_PRIMARY_COLOR } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DartScorer",
  description: "The fastest, easiest, and most beautiful dart scoring app.",
  applicationName: "DartScorer",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DartScorer",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: APP_PRIMARY_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppFullscreenProvider>
          <SupabaseProvider>{children}</SupabaseProvider>
        </AppFullscreenProvider>
      </body>
    </html>
  );
}
