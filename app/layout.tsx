import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Gruppo } from "next/font/google";
import { SupabaseProvider } from "@/components/providers/SupabaseProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ProfileBootstrap } from "@/components/providers/ProfileBootstrap";
import { AppFullscreenProvider } from "@/components/providers/AppFullscreenProvider";
import { APP_NAME, APP_PRIMARY_COLOR } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const gruppo = Gruppo({
  variable: "--font-gruppo",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "The fastest, easiest, and most beautiful dart scoring app.",
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  other: {
    "mobile-web-app-capable": "yes",
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
      className={`${geistSans.variable} ${geistMono.variable} ${gruppo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppFullscreenProvider>
          <AuthProvider>
            <ProfileBootstrap />
            <SupabaseProvider>{children}</SupabaseProvider>
          </AuthProvider>
        </AppFullscreenProvider>
      </body>
    </html>
  );
}
