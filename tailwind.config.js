/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#1b2021",
                "background-light": "#f7f7f7",
                "background-dark": "#181a1a",
                "accent-success": "#059669",
                "accent-warning": "#d97706",
                "accent-danger": "#dc2626",
            },
            fontFamily: {
                "display": ["Lexend", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "1rem",
                "lg": "2rem",
                "xl": "3rem",
                "full": "9999px",
            },
        },
    },
    plugins: [],
}
