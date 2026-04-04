/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#000000",
        "bg-card": "#111111",
        "bg-elevated": "#1c1c1e",
        "border-color": "rgba(255,255,255,0.08)",
        "text-primary": "#f5f5f7",
        "text-secondary": "#a1a1a6",
        "text-tertiary": "#6e6e73",
        "accent": "#0071e3",
        "system-green": "#30d158",
        "system-red": "#ff453a",
        "system-amber": "#ffd60a",
      },
      fontFamily: {
        sans: ["-apple-system", "Inter", "sans-serif"],
      },
      animation: {
        'pulse-ring': 'pulseRing 2s ease-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
