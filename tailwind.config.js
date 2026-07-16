/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          glow: "var(--primary-glow)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          glow: "var(--secondary-glow)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--error)",
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-surface-elevated)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          hover: "var(--border-color-hover)",
        },
        text: {
          main: "var(--text-main)",
          muted: "var(--text-muted)",
        }
      },
      fontFamily: {
        sans: ["Manrope", "David888 JetBrains Mono", "David888 Roundhand TC", "Noto Sans TC", "sans-serif"],
        display: ["Cormorant Garamond", "David888 JetBrains Mono", "David888 Roundhand TC", "Noto Sans TC", "serif"],
        mono: ["David888 JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      animation: {
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
