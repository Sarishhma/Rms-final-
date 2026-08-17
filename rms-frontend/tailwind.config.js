/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        success: "hsl(var(--success))",
        destructive: "hsl(var(--destructive))",
      },
    },
  },
  plugins: [],
};
