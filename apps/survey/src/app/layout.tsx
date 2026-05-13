import type { Metadata } from "next";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";

import { APP_NAME } from "@/lib/app-config";
import { InteractiveDotBackground } from "@/components/interactive-dot-background";
import { Toaster } from "@/components/ui/sonner";
import { getInitialAuth } from "@/lib/auth";

import "./globals.css";

const uncutSans = localFont({
  src: "../fonts/UncutSans-Variable.ttf",
  variable: "--font-body",
  display: "swap",
});

const monoFont = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ciao! Surveys",
  applicationName: APP_NAME,
  description: "Surveys to discover your personality and beliefs by Ciao!.",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialAuth = await getInitialAuth();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const storedMode = window.localStorage.getItem("ambi-theme-mode");
                const mode = storedMode === "dark" || storedMode === "light" || storedMode === "system" ? storedMode : "light";
                const resolved = mode === "system"
                  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                  : mode;
                document.documentElement.dataset.theme = resolved;
                document.documentElement.dataset.themeMode = mode;
              } catch {
                document.documentElement.dataset.theme = "light";
                document.documentElement.dataset.themeMode = "light";
              }
            })();`,
          }}
        />
      </head>
      <body className={`${uncutSans.variable} ${monoFont.variable} antialiased`}>
        <AuthKitProvider initialAuth={initialAuth}>
          <div className="app-shell">
            <InteractiveDotBackground />
            <div className="app-glow app-glow-left" />
            <div className="app-glow app-glow-right" />
            {children}
            <Toaster />
          </div>
        </AuthKitProvider>
      </body>
    </html>
  );
}
