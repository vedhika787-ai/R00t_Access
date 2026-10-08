import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
          foreground: "hsl(var(--foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          navy: "hsl(var(--brand-navy))",
          primary: "hsl(var(--brand-primary))",
          violet: "#7C3AED",
          cyan: "#06B6D4",
        },
        severity: {
          critical: "#DC2626",
          high: "#EA580C",
          medium: "#D97706",
          low: "#16A34A",
          compliant: "#0891B2",
          missing: "#7C3AED",
          none: "#64748B",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(11, 23, 48, 0.05), 0 8px 24px -4px rgba(11, 23, 48, 0.06)",
        raised: "0 10px 30px -4px rgba(11, 23, 48, 0.08), 0 4px 12px -2px rgba(11, 23, 48, 0.04)",
        glow: "0 0 25px -5px rgba(79, 70, 229, 0.35)",
        "glow-critical": "0 0 25px -5px rgba(220, 38, 38, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
