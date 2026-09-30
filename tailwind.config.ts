import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#0B2E1F",
        botanical: "#123D2A",
        emerald: "#1F7A4D",
        sage: "#A8BFA3",
        cream: "#F7F3E8",
        gold: "#D5B86A"
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
