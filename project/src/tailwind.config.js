/ @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src//*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./components//*.{js,jsx,ts,tsx}",
    "./App.js",
    "./index.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}