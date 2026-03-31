/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        court: {
          bg: "#0A0F1E",
          card: "#111827",
          border: "#1F2A3C",
          surface: "#162033",
        },
        tennis: {
          yellow: "#D4F000",
          green: "#00C896",
          orange: "#FF6B35",
          blue: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
