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
        // ── Stitch SafePath Spatial Ultra-Premium Deep Colors ──
        "background":             "#05070a", // Deep Spatial Void Strict Rule
        "surface":                "#090a0f", // Deep Spatial Void variations
        "surface-dim":            "#05070a",
        "surface-bright":         "#1a1b26", // Slightly elevated
        "surface-container-lowest": "#000000",
        "surface-container-low":  "#030406",
        "surface-container":      "#090a0f",
        "surface-container-high": "#12141d",
        "surface-container-highest": "#1c1e2b",
        "surface-variant":        "#1c1e2b",
        "surface-tint":           "#ff3b30",
        "on-background":          "#ffffff", // Strict pure white for typography 
        "on-surface":             "#ffffff",
        "on-surface-variant":     "#a1a1aa", // Strict zinc-400 for muted text
        "outline":                "#27272a", // Zinc-800 for dark borders
        "outline-variant":        "#18181b", // Zinc-900
        "inverse-surface":        "#fcf8f8",
        "inverse-on-surface":     "#565554",
        // Primary (Emergency Red - Crimson Neon)
        "primary":                "#ff3b30",
        "primary-dim":            "#d00000",
        "primary-container":      "#ff5a50",
        "primary-fixed":          "#ff5a50",
        "primary-fixed-dim":      "#ff3b30",
        "on-primary":             "#4a0005",
        "on-primary-container":   "#2a0002",
        "on-primary-fixed":       "#000000",
        "on-primary-fixed-variant": "#4a0005",
        "inverse-primary":        "#ff3b30",
        // Secondary (Safety Green - Cyber Mint)
        "secondary":              "#00ff87",
        "secondary-dim":          "#10b981",
        "secondary-container":    "#00d672",
        "secondary-fixed":        "#00ff87",
        "secondary-fixed-dim":    "#10b981",
        "on-secondary":           "#004c26",
        "on-secondary-container": "#cdffe2",
        "on-secondary-fixed":     "#003318",
        "on-secondary-fixed-variant": "#004c26",
        // Tertiary (Warning Yellow/Caution)
        "tertiary":               "#ffe792",
        "tertiary-dim":           "#efc900",
        "tertiary-container":     "#ffd709",
        "tertiary-fixed":         "#ffd709",
        "tertiary-fixed-dim":     "#efc900",
        "on-tertiary":            "#655400",
        "on-tertiary-container":  "#5b4b00",
        "on-tertiary-fixed":      "#453900",
        "on-tertiary-fixed-variant": "#665500",
        // Error
        "error":                  "#ff6e84",
        "error-dim":              "#d73357",
        "error-container":        "#a70138",
        "on-error":               "#490013",
        "on-error-container":     "#ffb2b9",
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body:     ["Inter", "sans-serif"],
        label:    ["Inter", "sans-serif"],
        sans:     ["Space Grotesk", "Inter", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      backdropBlur: {
        '24': '24px',
        '32': '32px',
      },
      animation: {
        'pulse-ring': 'pulseRing 2.5s ease-out infinite',
        'radar':      'radarPing 3s cubic-bezier(0,0,0.2,1) infinite',
        'sos-glow':   'sosGlow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseRing: {
          '0%':   { transform: 'scale(1)',    opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0'   },
        },
        radarPing: {
          '0%':   { transform: 'scale(1)',    opacity: '0.6' },
          '75%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        sosGlow: {
          '0%, 100%': { boxShadow: '0 0 30px rgba(255,142,131,0.3)' },
          '50%':      { boxShadow: '0 0 55px rgba(255,59,48,0.7)' },
        },
      },
      boxShadow: {
        'sos':    '0 0 40px rgba(255,59,48,0.4)',
        'safe':   '0 0 20px rgba(0,255,135,0.2)',
        'nav':    '0 -25px 50px -12px rgba(0,0,0,0.8)',
        'header': '0 25px 50px -12px rgba(0,0,0,0.8)',
        'glass':  '0 25px 50px -12px rgba(0,0,0,0.5)',
        'tactile-btn': 'inset 0 4px 10px rgba(255,255,255,0.3), inset 0 -4px 10px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
