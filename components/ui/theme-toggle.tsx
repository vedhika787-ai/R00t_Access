"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const darkActive = document.documentElement.classList.contains("dark");
    setIsDark(darkActive);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl border border-border/80 bg-surface/50 ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border/80 bg-surface text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${className}`}
      title={isDark ? "Light Mode" : "Dark Mode"}
    >
      <Sun
        className={`w-4 h-4 transition-all duration-300 ${
          isDark ? "rotate-90 scale-0 opacity-0 absolute" : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`w-4 h-4 transition-all duration-300 ${
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0 absolute"
        }`}
      />
    </button>
  );
}
