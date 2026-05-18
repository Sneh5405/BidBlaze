/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E85D24',      // bidblaze orange
        dark: '#1a1a2e',         // deep dark background
        card: '#16213e',         // card background
        surface: '#0f3460',      // surface color
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}