/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      colors: {
        // Semantic SOC tokens
        soc: {
          bg: 'var(--soc-bg)',
          card: 'var(--soc-card)',
          'card-hover': 'var(--soc-card-hover)',
          border: 'var(--soc-border)',
          'border-subtle': 'var(--soc-border-subtle)',
          text: 'var(--soc-text)',
          'text-secondary': 'var(--soc-text-secondary)',
          'text-muted': 'var(--soc-text-muted)',
          primary: 'var(--soc-primary)',
          'primary-hover': 'var(--soc-primary-hover)',
          success: 'var(--soc-success)',
          warning: 'var(--soc-warning)',
          critical: 'var(--soc-critical)',
          info: 'var(--soc-info)',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      }
    },
  },
  plugins: [],
}
