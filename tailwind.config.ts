import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rda: {
          50: "#f0f5fa",
          100: "#e1ecf6",
          200: "#c7dbed",
          300: "#9ec2df",
          400: "#6da2cd",
          500: "#4884b8",
          600: "#346aa0",
          700: "#2a5482",
          800: "#1e3c5f",
          900: "#0b1f3a",
          950: "#061224",
        },
        govGold: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        }
      },
    },
  },
  plugins: [],
};
export default config;
