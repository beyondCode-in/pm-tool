import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { accentBootScript } from "@/lib/accent";
import "./globals.css";
import "./aurora.css";
import "./polish.css";

// Inter for interface text (legible at small sizes, tabular numbers),
// Fraunces, a soft warm serif, for headings (calm and human, Claude-like),
// JetBrains Mono for ticket numbers and keys.
const sans = Inter({ variable: "--font-ui", subsets: ["latin"], axes: ["opsz"], display: "swap" });
const display = Fraunces({ variable: "--font-display", subsets: ["latin"], axes: ["SOFT", "opsz"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-code", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "BeyondPM", template: "%s · BeyondPM" },
  description: "Plan, track and ship work on GitHub, the friendly way.",
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f3ec" }, { media: "(prefers-color-scheme: dark)", color: "#24211d" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentBootScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
