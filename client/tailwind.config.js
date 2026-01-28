/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#0ea5e9",
                "primary-dark": "#0284c7",
                "accent-yellow": "#fbbf24",
                "game-blue": "#00b4d8",
                "game-dark-blue": "#0077b6",
                "game-navy": "#03045e",
                "background-light": "#caf0f8",
                "background-dark": "#0f172a",
                "surface-light": "#0096c7",
                "surface-dark": "#1e293b",
                "retro-yellow": "#FFD60A",
                "retro-orange": "#FF9F1C",
                "card-blue": "#0096FF",
                "card-dark": "#1E3A8A",
            },
            fontFamily: {
                display: ["Fredoka", "Noto Sans KR", "sans-serif"],
                sans: ["Noto Sans KR", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                'retro': "1.25rem",
                'xl': '1.5rem',
                '2xl': '2rem',
            },
            boxShadow: {
                'retro': '0 4px 0 0 rgba(0,0,0,0.2)',
                'retro-inner': 'inset 0 4px 0 0 rgba(255,255,255,0.4)',
                'btn-orange': '0 4px 0 0 #C2410C, inset 0 2px 4px rgba(255,255,255,0.5)',
                'btn-blue': '0 4px 0 0 #1D4ED8, inset 0 2px 4px rgba(255,255,255,0.5)',
                'game': '0 4px 0 0 rgba(0, 0, 0, 0.2)',
                'game-inset': 'inset 0 4px 6px rgba(0, 0, 0, 0.15)',
                'game-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
                'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                'glow': '0 0 15px rgba(14, 165, 233, 0.3)',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                'button-shine': 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.05) 100%)',
            }
        },
    },
    plugins: [],
}
