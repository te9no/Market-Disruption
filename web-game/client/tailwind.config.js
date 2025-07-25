import { defineConfig } from '@tailwindcss/postcss'

export default defineConfig({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-console': '#ef4444',     // red
        'diy-gadget': '#3b82f6',      // blue  
        'figure': '#8b5cf6',          // purple
        'accessory': '#22c55e',       // green
        'toy': '#eab308',             // yellow
      },
      gridTemplateColumns: {
        '20': 'repeat(20, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        '6': 'repeat(6, minmax(0, 1fr))',
      },
      scale: {
        '102': '1.02',
      }
    },
  },
  plugins: [],
})