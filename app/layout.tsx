import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Navbar />
            <CommandPalette />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border py-4 px-6 text-center text-xs text-muted-foreground bg-background/50">
              <p>
                LexiGuard v1.0 • Enterprise Legal Tech • AI-Assisted Analysis. Not Legal Advice. Qualified Counsel Review Required.
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
