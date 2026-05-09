const path = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    path.join(__dirname, "./app/**/*.{js,ts,jsx,tsx,mdx}"),
    path.join(__dirname, "./components/**/*.{js,ts,jsx,tsx,mdx}"),
  ],
  theme: {
    extend: {
      colors: {
        /* ── Cream / off-white scale ─────────────────────────── */
        cream: {
          50:  "#FAFAF9",
          100: "#FAF7F2",
          200: "#F5F0E8",
          DEFAULT: "#FAF7F2",
        },
        /* ── Neon accent (coral alias) ───────────────────────── */
        neon: {
          DEFAULT: "#DA7756",
          light:   "#E48B6A",
          dark:    "#C96441",
        },
        /* ── Brand coral scale — Anthropic/Claude palette ───── */
        brand: {
          50:  "#FDF4F0",
          100: "#FAE5DC",
          200: "#F5C9B5",
          300: "#EDA98A",
          400: "#E48B6A",   /* claude.ai light accent */
          500: "#DA7756",   /* Anthropic primary coral */
          600: "#C96441",   /* PRIMARY CTA — pressed state */
          700: "#B05230",   /* dark pressed */
          800: "#8A3F23",   /* deep */
          900: "#6B2F18",   /* deepest */
        },
        accent: {
          DEFAULT: "#DA7756",
          light:   "#E48B6A",
          dark:    "#C96441",
          muted:   "rgba(218, 119, 86, 0.08)",
        },
        success: {
          DEFAULT: "#10B981",
          light:   "#34D399",
          dark:    "#059669",
          muted:   "rgba(16, 185, 129, 0.1)",
        },
        danger: {
          DEFAULT: "#EF4444",
          light:   "#F87171",
          dark:    "#DC2626",
          muted:   "rgba(239, 68, 68, 0.1)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light:   "#FBBF24",
          dark:    "#D97706",
          muted:   "rgba(245, 158, 11, 0.1)",
        },
        info: {
          DEFAULT: "#DA7756",
          light:   "#E48B6A",
          muted:   "rgba(218, 119, 86, 0.1)",
        },
        /* ── Neutral dark scale ──────────────────────────────── */
        surface: {
          DEFAULT: "#FAF7F2",
          50:  "#FAF7F2",
          100: "#F5F0E8",
          200: "#E8E0D8",
          300: "#D0C8C0",
        },
      },
      fontFamily: {
        sans:      ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display:   ["var(--font-outfit)", "var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        editorial: ["var(--font-playfair)", "Georgia", "ui-serif", "serif"],
        mono:      ["ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "monospace"],
        grotesk:   ["Anton", "Impact", "ui-sans-serif", "system-ui", "sans-serif"],
        condiment: ["Condiment", "cursive"],
      },
      fontSize: {
        "display-lg": ["4.5rem", { lineHeight: "1",   letterSpacing: "-0.02em", fontWeight: "700" }],
        "display":    ["3.75rem", { lineHeight: "1",   letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["3rem",    { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "glow-pulse":           "glow-pulse 3s ease-in-out infinite",
        "fade-in":              "fade-in 0.6s ease-out forwards",
        "fade-in-up":           "fade-in-up 0.6s ease-out forwards",
        "slide-in-left":        "slide-in-left 0.4s ease-out",
        "pulse-slow":           "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "grid-fade":            "grid-fade 8s ease-in-out infinite",
        shimmer:                "shimmer 2s linear infinite",
        float:                  "float 6s ease-in-out infinite",
        "float-delayed":        "float 6s ease-in-out 2s infinite",
        "float-slow":           "float 8s ease-in-out infinite",
        "spin-slow":            "spin 8s linear infinite",
        "spin-reverse":         "spin-reverse 12s linear infinite",
        "orbit":                "orbit 20s linear infinite",
        "scale-pulse":          "scale-pulse 4s ease-in-out infinite",
        "gradient-shift":       "gradient-shift 6s ease infinite",
        "marquee":              "marquee 30s linear infinite",
        "marquee-slow":         "marquee 35s linear infinite",
        "marquee-fast":         "marquee 15s linear infinite",
        "marquee-reverse":      "marquee-reverse 30s linear infinite",
        "marquee-reverse-slow": "marquee-reverse 45s linear infinite",
        "reveal-up":            "reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "reveal-left":          "reveal-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "reveal-right":         "reveal-right 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        "glow-pulse":    { "0%, 100%": { opacity: "0.4" }, "50%": { opacity: "0.8" } },
        "fade-in":       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "fade-in-up":    { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-in-left": { "0%": { opacity: "0", transform: "translateX(-16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "grid-fade":     { "0%, 100%": { opacity: "0.3" }, "50%": { opacity: "0.6" } },
        shimmer:         { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        float:           { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        "spin-reverse":  { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(-360deg)" } },
        orbit:           { "0%": { transform: "rotate(0deg) translateX(80px) rotate(0deg)" }, "100%": { transform: "rotate(360deg) translateX(80px) rotate(-360deg)" } },
        "scale-pulse":   { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.05)" } },
        "gradient-shift":{ "0%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" }, "100%": { backgroundPosition: "0% 50%" } },
        "marquee":         { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        "marquee-reverse": { "0%": { transform: "translateX(-50%)" }, "100%": { transform: "translateX(0)" } },
        "reveal-up":   { "0%": { opacity: "0", transform: "translateY(40px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "reveal-left": { "0%": { opacity: "0", transform: "translateX(-40px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        "reveal-right":{ "0%": { opacity: "0", transform: "translateX(40px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
      },
      boxShadow: {
        "card":       "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 10px -4px rgba(0, 0, 0, 0.08)",
        "card-lg":    "0 20px 40px -10px rgba(0, 0, 0, 0.15)",
        "glow-sm":    "0 0 15px -3px rgba(218, 119, 86, 0.25)",
        "glow":       "0 0 30px -5px rgba(218, 119, 86, 0.30)",
        "glow-lg":    "0 0 60px -10px rgba(218, 119, 86, 0.35)",
        "glow-xl":    "0 0 80px -15px rgba(218, 119, 86, 0.40)",
        "frost":      "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        "inner-light":"inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-arctic":  "linear-gradient(135deg, #FAF7F2 0%, #FAFAF9 50%, #F5F0E8 100%)",
      },
    },
  },
  plugins: [],
};
