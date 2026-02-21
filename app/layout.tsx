// ============================================================
// LUMINA — Root Layout
// ClerkProvider + dark theme + fonts
// ============================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import NeonCursor from "@/components/ui/NeonCursor";
import PwaInstallBanner from "@/components/ui/PwaInstallBanner";
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
  title: "LUMINA — 3D Habit Sanctuary",
  description:
    "A premium 3D habit tracker. Your habits become glowing crystals in a living floating island.",
  icons: { icon: "/favicon.ico" },
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://lumina.app"),
  openGraph: {
    title: "LUMINA — 3D Habit Sanctuary",
    description:
      "Build habits that glow. A premium tracker where each habit becomes a living crystal.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "LUMINA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "LUMINA — 3D Habit Sanctuary",
    description:
      "Build habits that glow. A premium tracker where each habit becomes a living crystal.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LUMINA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#a855f7",
          colorBackground: "#0a0a1a",
          colorInputBackground: "#111127",
          colorInputText: "#e8e4f0",
        },
      }}
    >
      <html lang="en" className="dark">
        <head>
          <meta name="theme-color" content="#0a0a0f" />
          <link rel="apple-touch-icon" href="/icon-192.png" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-cosmic-dark min-h-screen`}
        >
          <NeonCursor />
          <PwaInstallBanner />
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "rgba(15, 15, 30, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(20px)",
                  color: "rgba(255, 255, 255, 0.8)",
                },
              }}
            />
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
