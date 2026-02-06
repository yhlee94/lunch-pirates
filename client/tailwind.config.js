/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "#2563EB", // Project Blue
                "primary-bright": "#6366F1",
                "accent-green": "#CCFFA4", // Acid Green
                "accent-orange": "#FF9F43",
                "glass-border": "rgba(255, 255, 255, 0.4)",
                "surface-light": "#F0F4F8",
                "surface-dark": "#0B0C15",
                "primary-dark": "#0284c7", // Kept from original
                "accent-yellow": "#fbbf24", // Kept from original
                "game-blue": "#00b4d8", // Kept from original
                "game-dark-blue": "#0077b6", // Kept from original
                "game-navy": "#03045e", // Kept from original
                "background-light": "#caf0f8", // Kept from original
                "background-dark": "#0f172a", // Kept from original
                "retro-yellow": "#FFD60A", // Kept from original
                "retro-orange": "#FF9F1C", // Kept from original
                "card-blue": "#0096FF", // Kept from original
                "card-dark": "#1E3A8A", // Kept from original
            },
            fontFamily: {
                sans: ["'Inter'", "'Noto Sans KR'", "sans-serif"],
                display: ["Fredoka", "Noto Sans KR", "sans-serif"],
            },
            borderRadius: {
                DEFAULT: "1rem",
                'retro': "1.25rem",
                'xl': '1.5rem',
                '2xl': '2rem',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'neon': '0 0 20px rgba(79, 70, 229, 0.5)',
                'neon-green': '0 0 15px rgba(204, 255, 164, 0.6)',
                'card-float': '0 20px 40px -5px rgba(0, 0, 0, 0.1)',
                'retro': '0 4px 0 0 rgba(0,0,0,0.2)', // Kept from original
                'retro-inner': 'inset 0 4px 0 0 rgba(255,255,255,0.4)', // Kept from original
                'btn-orange': '0 4px 0 0 #C2410C, inset 0 2px 4px rgba(255,255,255,0.5)', // Kept from original
                'btn-blue': '0 4px 0 0 #1D4ED8, inset 0 2px 4px rgba(255,255,255,0.5)', // Kept from original
                'game': '0 4px 0 0 rgba(0, 0, 0, 0.2)', // Kept from original
                'game-inset': 'inset 0 4px 6px rgba(0, 0, 0, 0.15)', // Kept from original
                'game-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)', // Kept from original
                'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)', // Kept from original
                'glow': '0 0 15px rgba(14, 165, 233, 0.3)', // Kept from original
                'soft': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                'lobby-glow': '0 0 40px 10px rgba(255, 255, 255, 0.3)',
            },
            fontFamily: {
                sans: ["'Inter'", "'Noto Sans KR'", "sans-serif"],
                display: ["Fredoka", "Noto Sans KR", "sans-serif"],
                nunito: ['Nunito', 'sans-serif'],
            },
            colors: {
                primary: "#2563EB", // Project Blue
                "lobby-primary": "#FF5E5E", // Vibrant red from Cancel button
                "sky-top": "#4a759e",
                "sky-bottom": "#7abedb",
                "sky-top-dark": "#1a355e",
                "sky-bottom-dark": "#3a5e7b",
                "primary-bright": "#6366F1",
                "accent-green": "#CCFFA4", // Acid Green
                "accent-orange": "#FF9F43",
                "glass-border": "rgba(255, 255, 255, 0.4)",
                "surface-light": "#F0F4F8",
                "surface-dark": "#0B0C15",
                "primary-dark": "#0284c7", // Kept from original
                "accent-yellow": "#fbbf24", // Kept from original
                "game-blue": "#00b4d8", // Kept from original
                "game-dark-blue": "#0077b6", // Kept from original
                "game-navy": "#03045e", // Kept from original
                "background-light": "#caf0f8", // Kept from original
                "background-dark": "#0f172a", // Kept from original
                "retro-yellow": "#FFD60A", // Kept from original
                "retro-orange": "#FF9F1C", // Kept from original
                "card-blue": "#0096FF", // Kept from original
                "card-dark": "#1E3A8A", // Kept from original
            },
            backgroundImage: {
                'mesh': 'radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)',
                'glass-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.2) 100%)',
                'card-gradient-1': 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
                'button-shine': 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.05) 100%)', // Kept from original
            }
        },
    },
    plugins: [],
}
