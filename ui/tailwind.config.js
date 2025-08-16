/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "terminal-panel": "#0b0f12",
        "terminal-border": "#6b7280",
        "terminal-accent": "#96d8a3",
        "terminal-dim": "#9ca3af",
        "terminal-bg": "#282a36",
        "terminal-text": "#ffffff",
        "terminal-warning": "#ebedad",
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
