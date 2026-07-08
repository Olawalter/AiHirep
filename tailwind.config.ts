import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "panel-black": "#070A12",
        "hiring-navy": "#111827",
        "signal-blue": "#2563EB",
        "consensus-cyan": "#22D3EE",
        "skill-green": "#2CE88A",
        "reference-gold": "#F5B841",
        "risk-red": "#FF4D5E",
        "culture-purple": "#8B5CF6",
        "paper-white": "#F7F3EA",
        "slate-grey": "#8B93A1",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        accent: ["Archivo Black", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
