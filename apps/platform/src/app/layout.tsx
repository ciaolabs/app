import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { APP_NAME } from "@/lib/app-config";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { getStaticInitialAuth } from "@/lib/auth";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Never read the session cookie here: a dynamic API in the root layout
  // forces every route (landing, docs, sign-in) into per-request serverless
  // rendering. AuthKitProvider resolves the real session client-side instead;
  // auth-gated pages keep their own server-side checks.
  const initialAuth = getStaticInitialAuth();

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
        <AuthProvider initialAuth={initialAuth}>
          {children}
          <Toaster />
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
