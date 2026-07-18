import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f8f9fa",
        "surface-dim": "#d9dadb",
        "surface-bright": "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f4f5",
        "surface-container": "#edeeef",
        "surface-container-high": "#e7e8e9",
        "surface-container-highest": "#e1e3e4",
        "surface-variant": "#e1e3e4",
        "surface-tint": "#5e5e5e",
        primary: "#000000",
        "primary-container": "#1b1b1b",
        secondary: "#4648d4",
        "secondary-container": "#6063ee",
        tertiary: "#000000",
        "tertiary-container": "#1b1b1b",
        background: "#f8f9fa",
        outline: "#7e7576",
        "outline-variant": "#cfc4c5",
        "on-surface": "#191c1d",
        "on-surface-variant": "#4c4546",
        "on-primary": "#ffffff",
        "on-primary-container": "#848484",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#fffbff",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#848484",
        "on-background": "#191c1d",
        "inverse-surface": "#2e3132",
        "inverse-on-surface": "#f0f1f2",
        "inverse-primary": "#c6c6c6",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a"
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      spacing: {
        gutter: "24px",
        margin_desktop: "40px",
        sidebar_width: "260px",
        container_max: "1200px",
        margin_mobile: "16px",
        safe: "env(safe-area-inset-bottom, 20px)"
      },
      fontFamily: {
        sans: ["Geist", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Geist", "sans-serif"],
        body: ["Geist", "sans-serif"],
        label: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        card: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)"
      },
      maxWidth: {
        canvas: "1200px"
      }
    }
  },
  plugins: []
} satisfies Config;
