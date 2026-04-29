import type { Metadata } from "next";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { Manrope, Space_Mono } from "next/font/google";

import { APP_NAME } from "@/lib/app-config";
import { InteractiveDotBackground } from "@/components/interactive-dot-background";
import { getInitialAuth } from "@/lib/auth";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    icon: "/favicon.ico",
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
                const stored = window.localStorage.getItem("ambi-theme");
                const theme = stored === "dark" || stored === "light" ? stored : "light";
                document.documentElement.dataset.theme = theme;
              } catch {
                document.documentElement.dataset.theme = "light";
              }
            })();`,
          }}
        />
      </head>
      <body className={`${manrope.variable} ${monoFont.variable} antialiased`}>
        <AuthKitProvider initialAuth={initialAuth}>
          <div className="app-shell">
            <InteractiveDotBackground />
            <div className="app-glow app-glow-left" />
            <div className="app-glow app-glow-right" />
            {children}
          </div>
        </AuthKitProvider>
      </body>
    </html>
  );
}
