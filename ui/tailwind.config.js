/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  presets: [require("@neo4j-ndl/base").tailwindConfig],
  prefix: "",
  theme: {
    extend: {},
  },
  // The preset has this safelist, but with the "n-" prefix. Should be removed eventually as per
  safelist: [
    {
      pattern:
        /^(hover:)?text-(light|primary|danger|warning|success|blueberry|mint|neutral)-/,
      variants: ["hover"],
    },
    {
      pattern:
        /^(hover:)?bg-(light|primary|danger|warning|success|blueberry|mint|neutral)-/,
      variants: ["hover"],
    },
    {
      // For clicked classes
      pattern: /^(active:)?bg-light-/,
      variants: ["active"],
    },
    {
      pattern: /^(hover:)?border-light-/,
      variants: ["hover"],
    },
  ],
  plugins: [require("daisyui"), require('@tailwindcss/typography')],
};
