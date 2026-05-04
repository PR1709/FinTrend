import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#06060A",
        surface: { 0: "#0D0D14", 1: "#14141F", 2: "#1C1C2E" },
        border: "#242436",
        accent: "#4ECDC4",
        bull: "#22D17A",
        bear: "#FF4D6A",
        neutral: "#F5A623",
        muted: "#8888AA",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
