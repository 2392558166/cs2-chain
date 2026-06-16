/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ember: "#f97316",
        steel: "#94a3b8",
        neon: "#22d3ee",
        void: "#050816",
        panel: "#0f172a"
      }
    }
  },
  plugins: []
}
