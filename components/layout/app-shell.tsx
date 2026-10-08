"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { CommandPalette } from "@/components/layout/command-palette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isAuthPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Navbar />
      <CommandPalette />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/80 py-5 px-6 text-center text-xs text-muted-foreground bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">LexiGuard</span>
            <span className="text-[10px] uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-mono">
              v1.2 Enterprise
            </span>
          </div>
          <p>
            Enterprise Contract Risk &amp; Redline Engine • AI-Assisted Analysis • Not Legal Advice
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            Protected under SOC 2 &amp; ISO 27001 policies
          </p>
        </div>
      </footer>
    </div>
  );
}
