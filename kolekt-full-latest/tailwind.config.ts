import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFBF5",
        card: "#F7EFE5",
        accent: "#C3ACD0",
        primary: { DEFAULT: "#7743DB", dark: "#6233BF" },
        ink: "#241B35",
        muted: "#82778B",
      },
      fontFamily: { sans: ["var(--font-jakarta)", "system-ui", "sans-serif"] },
      boxShadow: {
        soft: "0 1px 2px rgba(36,27,53,.04), 0 14px 32px -14px rgba(119,67,219,.22)",
        cta: "0 12px 26px -8px rgba(119,67,219,.55), inset 0 1px 0 rgba(255,255,255,.25)",
      },
    },
  },
  plugins: [],
};
export default config;
