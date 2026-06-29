import type { Metadata } from "next";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { APP_NAME } from "@/lib/app-config";
import { Toaster } from "@/components/ui/sonner";
import { getInitialAuth } from "@/lib/auth";

import "./globals.css";

const uncutSans = localFont({
  src: "../fonts/UncutSans-Variable.woff2",
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
  title: {
    default: "Ciao!",
    template: "%s | Ciao!",
  },
  applicationName: APP_NAME,
  description:
    "Ciao! — personality and values surveys, your results dashboard, AI chat, and documentation.",
  metadataBase: new URL("https://platform.ciaobang.com"),
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
    <html lang="en" data-theme="light" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const apply = (resolved, mode) => {
                const root = document.documentElement;
                root.dataset.theme = resolved;
                root.dataset.themeMode = mode;
                root.classList.remove("light", "dark");
                root.classList.add(resolved);
              };
              try {
                const storedMode = window.localStorage.getItem("ambi-theme-mode");
                const mode = storedMode === "dark" || storedMode === "light" || storedMode === "system" ? storedMode : "light";
                const resolved = mode === "system"
                  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                  : mode;
                apply(resolved, mode);
              } catch {
                apply("light", "light");
              }
            })();`,
          }}
        />
      </head>
      <body className={`${uncutSans.variable} ${monoFont.variable} antialiased`}>
        <AuthKitProvider initialAuth={initialAuth}>
          {children}
          <Toaster />
        </AuthKitProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
