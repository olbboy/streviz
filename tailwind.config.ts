import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Enhanced Professional Broadcast Color System
        broadcast: {
          // Modern Blue Gradient System - Contemporary professional blues
          blue: {
            50: "#EFF6FF",
            100: "#DBEAFE",
            200: "#BFDBFE",
            300: "#93C5FD",
            400: "#60A5FA",
            500: "#3B82F6", // Primary modern blue
            600: "#2563EB", // Enhanced from #0066FF for better contrast
            700: "#1D4ED8",
            800: "#1E40AF",
            900: "#1E3A8A",
            950: "#172554",
            DEFAULT: "#2563EB", // Updated primary
            light: "#60A5FA",
            dark: "#1D4ED8",
            gradient: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
          },
          // Enhanced Status Colors with better visibility
          success: {
            50: "#ECFDF5",
            100: "#D1FAE5",
            200: "#A7F3D0",
            300: "#6EE7B7",
            400: "#34D399",
            500: "#10B981",
            600: "#059669", // Enhanced emerald for better contrast
            700: "#047857",
            800: "#065F46",
            900: "#064E3B",
            950: "#022C22",
            DEFAULT: "#059669",
            light: "#34D399",
            dark: "#047857",
            gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          },
          warning: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706", // Enhanced amber for better contrast
            700: "#B45309",
            800: "#92400E",
            900: "#78350F",
            950: "#451A03",
            DEFAULT: "#D97706",
            light: "#FBBF24",
            dark: "#B45309",
            gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          },
          error: {
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626", // Enhanced red for better contrast
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
            950: "#450A0A",
            DEFAULT: "#DC2626",
            light: "#F87171",
            dark: "#B91C1C",
            gradient: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
          },
          // Sophisticated Neutral Palette - Slate-based
          neutral: {
            0: "#FFFFFF",
            50: "#F8FAFC",
            100: "#F1F5F9",
            200: "#E2E8F0",
            300: "#CBD5E1",
            400: "#94A3B8",
            500: "#64748B",
            600: "#475569",
            700: "#334155",
            800: "#1E293B",
            900: "#0F172A",
            950: "#020617",
            DEFAULT: "#64748B",
            surface: "#F8FAFC",
            border: "#E2E8F0",
            text: "#0F172A",
            "text-secondary": "#64748B",
            "text-muted": "#94A3B8",
          },
          // Glassmorphism Transparency System
          glass: {
            // Light mode glass surfaces
            "surface-01": "rgba(255, 255, 255, 0.03)", // Very subtle
            "surface-02": "rgba(255, 255, 255, 0.06)", // Default cards
            "surface-03": "rgba(255, 255, 255, 0.10)", // Hover states
            "surface-04": "rgba(255, 255, 255, 0.15)", // Active elements
            "surface-05": "rgba(255, 255, 255, 0.20)", // Emphasis
            // Dark mode glass surfaces
            "surface-dark-01": "rgba(15, 23, 42, 0.40)",
            "surface-dark-02": "rgba(15, 23, 42, 0.60)",
            "surface-dark-03": "rgba(15, 23, 42, 0.80)",
            "surface-dark-04": "rgba(15, 23, 42, 0.90)",
            // Glass borders
            "border-light": "rgba(255, 255, 255, 0.08)",
            "border-dark": "rgba(255, 255, 255, 0.06)",
            // Glass shadows
            "shadow-light": "rgba(0, 0, 0, 0.05)",
            "shadow-medium": "rgba(0, 0, 0, 0.10)",
            "shadow-strong": "rgba(0, 0, 0, 0.15)",
          },
          // Professional gradient system
          gradient: {
            primary: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            success: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            warning: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
            error: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
            surface: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
            "surface-dark": "linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.2) 100%)",
            // Special effects
            glow: "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 70%)",
            "glow-success": "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
            "glow-warning": "radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.15) 0%, transparent 70%)",
            "glow-error": "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 70%)",
          },
          // Backward compatibility aliases
          "blue": "#2563EB",
          "blue-light": "#60A5FA",
          "blue-dark": "#1D4ED8",
          "success": "#059669",
          "warning": "#D97706",
          "error": "#DC2626",
          "surface-01": "rgba(255, 255, 255, 0.06)",
          "surface-02": "rgba(255, 255, 255, 0.10)",
          "surface-03": "rgba(255, 255, 255, 0.15)",
          "surface-04": "rgba(255, 255, 255, 0.20)",
          "glass-border": "rgba(255, 255, 255, 0.08)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
      },
      fontFamily: {
        // Enhanced Professional Typography for Streviz Streaming
        display: ["Inter Display", "Inter", "system-ui", "sans-serif"],
        heading: ["Inter Display", "Inter", "system-ui", "sans-serif"],
        subheading: ["Inter Display", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        caption: ["Inter", "system-ui", "sans-serif"],
        // Technical/Code Typography
        mono: ["JetBrains Mono", "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", "Courier New", "monospace"],
        "mono-display": ["JetBrains Mono", "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", "Courier New", "monospace"],
        "mono-body": ["JetBrains Mono", "SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", "Consolas", "Courier New", "monospace"],
        // Backward compatibility
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.25)",
      },
      fontSize: {
        // Enhanced Type Scale for Streviz Professional Streaming
        micro: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.05em" }],
        xs: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.025em" }],
        sm: ["0.9375rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "0em" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.025em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.03em" }],
        "5xl": ["3rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.025em",
        snug: "-0.015em",
        normal: "0em",
        relaxed: "0.025em",
        loose: "0.05em",
      },
      lineHeight: {
        none: "1",
        tight: "1.25",
        snug: "1.375",
        normal: "1.5",
        relaxed: "1.625",
        loose: "2",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography"), require("@tailwindcss/forms")],
}

export default config