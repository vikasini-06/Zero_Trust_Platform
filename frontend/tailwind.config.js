/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#0a0d14',
          darker: '#06080d',
          card: '#111726',
          border: '#1e293b',
          accent: '#00f2fe',
          cyan: '#06b6d4',
          green: '#10b981',
          emerald: '#059669',
          amber: '#f59e0b',
          rose: '#f43f5e',
          purple: '#8b5cf6',
          blue: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
