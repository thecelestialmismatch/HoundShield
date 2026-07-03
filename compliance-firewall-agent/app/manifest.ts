import type { MetadataRoute } from "next";

/**
 * Web app manifest. Improves PWA/installability signals and gives search
 * engines a canonical app name + icons. Colors match the light landing theme
 * (theme_color mirrors the viewport themeColor in app/layout.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HoundShield — AI Compliance Firewall",
    short_name: "HoundShield",
    description:
      "Local-only AI compliance firewall for CMMC Level 2, HIPAA, and SOC 2. Scan AI prompts for CUI/PHI/PII before they leave your network.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFCFF",
    theme_color: "#FAFCFF",
    icons: [
      { src: "/icon.png", sizes: "any", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
