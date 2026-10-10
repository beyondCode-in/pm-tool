import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { accentBootScript } from "@/lib/accent";
import "./globals.css";
import "./aurora.css";

// Inter for interface text (legible at small sizes, tabular numbers),
// Bricolage Grotesque for headings (gives the brand its character),
// JetBrains Mono for ticket numbers and keys.
const sans = Inter({ variable: "--font-ui", subsets: ["latin"], display: "swap" });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-code", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "BeyondPM", template: "%s · BeyondPM" },
  description: "Plan, track and ship work on GitHub, the friendly way.",
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#fafafc" }, { media: "(prefers-color-scheme: dark)", color: "#121218" }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
