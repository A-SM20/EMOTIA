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
        background: '#080B12',
        surface: {
          DEFAULT: '#111722',
          light: '#182234',
          lighter: '#202D44',
          border: '#1E293B',
        },
        cyan: {
          DEFAULT: '#22D3EE',
          glow: '#06B6D4',
          dark: '#0891B2',
        },
        electric: {
          blue: '#3B82F6',
          cyan: '#22D3EE',
          indigo: '#6366F1',
        },
        emotion: {
          positive: '#10B981',
          neutral: '#06B6D4',
          calm: '#38BDF8',
          frustrated: '#F59E0B',
          stressed: '#EF4444',
          sad: '#8B5CF6',
          surprised: '#EC4899',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(34, 211, 238, 0.35)',
        'glow-blue': '0 0 20px -3px rgba(59, 130, 246, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'subtle-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'ripple': 'ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
