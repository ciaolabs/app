import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ciao Docs",
    template: "%s | Ciao Docs",
  },
  description: "Documentation for Ciao personality, values, and beliefs measures.",
  metadataBase: new URL("https://docs.ciaobang.com"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
