import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope, Space_Mono } from "next/font/google";

import { clerkAppName, clerkLocalization, clerkProviderAppearance } from "@/lib/clerk";
import { InteractiveDotBackground } from "@/components/interactive-dot-background";

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
      <body className={`${manrope.variable} ${monoFont.variable} antialiased`}>
        <ClerkProvider dynamic appearance={clerkProviderAppearance} localization={clerkLocalization}>
          <div className="app-shell">
            <InteractiveDotBackground />
            <div className="app-glow app-glow-left" />
            <div className="app-glow app-glow-right" />
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
