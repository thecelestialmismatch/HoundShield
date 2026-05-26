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
        /* Cream / sand scale (palette: F3E3D0, D2C4B4) — v3 sand-light + cream-deep */
        cream: {
          50:  "#FAFCFF",   /* v3 surface-0: cool white */
          75:  "#F5F8FB",   /* v3 surface-1: subtle blue tint */
          100: "#F3E3D0",   /* palette Cream (v3 surface-2) */
          150: "#EDD5BC",   /* v3 cream-deep (surface-3) */
          200: "#E8DDD1",   /* v3 sand-light */
          300: "#D2C4B4",   /* palette Beige */
          400: "#B8A89A",
          DEFAULT: "#F3E3D0",
        },
        /* v3 ink (navy) text ramp */
        ink: {
          DEFAULT:   "#0F1E2E",
          primary:   "#0F1E2E",
          secondary: "#3D5166",
          tertiary:  "#6B8299",
          deep:      "#0D1B2A",
        },
        /* v3 steel — between brand-500 and brand-200 */
        steel: {
          light: "#C5DAE9",
          DEFAULT: "#5A86A8",
          dark: "#4A7FA5",
        },
        /* Soft-blue accent alias */
        neon: {
          DEFAULT: "#81A6C6",
          light:   "#AACDDC",
          dark:    "#6790B5",
        },
        /* Brand blue scale anchored to palette #81A6C6 */
        brand: {
          50:  "#F3F7FA",
          100: "#E1ECF4",
          200: "#C4D9E8",
          300: "#AACDDC",   /* palette Sea */
          400: "#95B9D0",
          500: "#81A6C6",   /* palette Blue - PRIMARY CTA */
          600: "#6790B5",   /* pressed state */
          700: "#527A9F",
          800: "#3D6485",
          900: "#2C4E6B",
        },
        accent: {
          DEFAULT: "#81A6C6",
          light:   "#AACDDC",
          dark:    "#6790B5",
          muted:   "rgba(129, 166, 198, 0.08)",
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
          DEFAULT: "#81A6C6",
          light:   "#AACDDC",
          muted:   "rgba(129, 166, 198, 0.1)",
        },
        /* v3 surface scale (cool white → cream → sand) */
        surface: {
          DEFAULT: "#FAFCFF",
          0:   "#FAFCFF",
          1:   "#F5F8FB",
          2:   "#F3E3D0",
          3:   "#EDD5BC",
          50:  "#FAFCFF",
          75:  "#F5F8FB",
          100: "#F3E3D0",
          150: "#EDD5BC",
          200: "#E8DDD1",
          300: "#D2C4B4",
        },
      },
      fontFamily: {
        /* v3: DM Sans body, Fraunces display, JetBrains Mono code */
        sans:      ["'DM Sans'", "var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display:   ["'Fraunces'", "Georgia", "var(--font-playfair)", "ui-serif", "serif"],
        editorial: ["'Fraunces'", "Georgia", "var(--font-playfair)", "ui-serif", "serif"],
        mono:      ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "SF Mono", "Menlo", "Consolas", "monospace"],
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
        "card-hover": "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 4px 10px -4px rgba(0, 0, 0, 0.06)",
        "card-lg":    "0 20px 40px -10px rgba(0, 0, 0, 0.12)",
        "glow-sm":    "0 0 15px -3px rgba(129, 166, 198, 0.20)",
        "glow":       "0 0 30px -5px rgba(129, 166, 198, 0.22)",
        "glow-lg":    "0 0 60px -10px rgba(129, 166, 198, 0.25)",
        "glow-xl":    "0 0 80px -15px rgba(129, 166, 198, 0.28)",
        "frost":      "0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
        "inner-light":"inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)",
      },
      backgroundImage: {
        "gradient-radial":  "radial-gradient(var(--tw-gradient-stops))",
        "gradient-arctic":  "linear-gradient(135deg, #FBF8F2 0%, #F3E3D0 50%, #E5D2BD 100%)",
      },
    },
  },
  plugins: [],
};
