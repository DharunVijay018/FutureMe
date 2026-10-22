import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jet: "#08090D",
        surface: {
          deep: "#10131B",
          elevated: "#161B27",
          card: "#121722",
          hover: "#1A2030",
          highlight: "#222B3F",
        },
        cerulean: {
          DEFAULT: "#36B8F5",
          hover: "#22A8E8",
          glow: "rgba(54, 184, 245, 0.25)",
          muted: "rgba(54, 184, 245, 0.12)",
        },
        neonRose: {
          DEFAULT: "#FF4F9A",
          hover: "#FA3B8E",
          glow: "rgba(255, 79, 154, 0.25)",
          muted: "rgba(255, 79, 154, 0.12)",
        },
        text: {
          primary: "#F4F7FC",
          secondary: "#A8B3C7",
          muted: "#73829C",
        },
        charcoal: {
          border: "#1E2638",
          borderLight: "#26324A",
          subtle: "#141A26",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Space Grotesk", "sans-serif"],
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Courier New", "monospace"],
      },
      boxShadow: {
        "glow-cerulean": "0 0 35px -5px rgba(54, 184, 245, 0.28)",
        "glow-rose": "0 0 35px -5px rgba(255, 79, 154, 0.28)",
        "glow-subtle": "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
        "inner-glow": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)",
        "vault-card": "0 4px 24px -2px rgba(8, 9, 13, 0.6), 0 0 0 1px rgba(38, 50, 74, 0.5)",
      },
      animation: {
        "pulse-subtle": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-shift": "glowShift 8s ease infinite",
        "unlock-spin": "spin 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowShift: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.7" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
