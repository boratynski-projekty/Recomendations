import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b10",
        surface: "#15151d",
        border: "#24242f",
        accent: "#a78bfa",
        muted: "#9ca3af"
      }
    }
  },
  plugins: []
};

export default config;
