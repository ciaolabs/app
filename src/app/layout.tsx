import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Manrope } from "next/font/google";

import { clerkAppName, clerkLocalization, clerkProviderAppearance } from "@/lib/clerk";

import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AMBI Survey MVP",
  applicationName: clerkAppName,
  description: "A modern intake experience for the 181-item AMBI personality survey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <ClerkProvider dynamic appearance={clerkProviderAppearance} localization={clerkLocalization}>
          <div className="app-shell">
            <div className="app-glow app-glow-left" />
            <div className="app-glow app-glow-right" />
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
