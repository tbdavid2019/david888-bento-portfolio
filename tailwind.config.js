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
        saffron: {
          DEFAULT: "var(--saffron)",
          hover: "var(--saffron-hover)",
          light: "var(--saffron-light)",
        },
        navy: {
          DEFAULT: "var(--deep-blue)",
          dark: "var(--deep-blue-dark)",
        },
        clay: "var(--clay)",
        ink: "var(--ink)",
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
        sans: ["'Outfit'", "'Noto Sans TC'", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Outfit'", "'Noto Sans TC'", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'Fira Code'", "'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      animation: {
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
