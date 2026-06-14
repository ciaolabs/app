import type { Metadata } from "next";

import { BodySection } from "@/components/body-section";

export const metadata: Metadata = {
  title: "Ciao! Chat",
  description: "Chat with your Ciao survey results.",
};

export default function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-section="chat" className="app-shell">
      <BodySection section="chat" />
      {children}
    </div>
  );
}
