/** @type {import('tailwindcss').Config} */
export default {
	// The 'content' array tells Tailwind where to look for class names
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	// 'class' strategy allows us to toggle dark mode by adding the 'dark' class to the <html> or <body> tag
	darkMode: "class",
	theme: {
		extend: {
			// Custom configuration to match the premium design system
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
			},
			// Adding subtle animation utility for the feed staggered entry
			animation: {
				"fade-in-up": "fadeInUp 0.5s ease-out forwards",
			},
			keyframes: {
				fadeInUp: {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
			},
		},
	},
	plugins: [],
};
