/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        mist: "#F4F7F5",
        ink: "#16261F",
        clinical: {
          50: "#EEF5F1",
          100: "#D8E9DF",
          400: "#4B8F76",
          500: "#2F6B57",
          600: "#25543F",
          700: "#1B3E30",
        },
        bloom: {
          200: "#F2D3CA",
          400: "#E4A597",
          500: "#D98E82",
          600: "#BE6F63",
        },
        clay: "#E4DED4",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
