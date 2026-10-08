import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/layout/app-shell";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LexiGuard | Enterprise Contract Risk & Redline Assistant",
  description:
    "AI-powered contract risk analysis, playbook discrepancy matching, deterministic scoring, and interactive redline workspace for enterprise legal teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased text-foreground bg-background`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
