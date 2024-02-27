/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
	darkMode: `media`, // or 'media' or 'class'
	important: true,
	theme: {
		extend: {
			height: {
				105: '26rem',
			},
			keyframes: {
				wiggle: {
					'0%, 100%': { transform: 'rotate(-3deg)' },
					'50%': { transform: 'rotate(3deg)' },
				},
				rotate: {
					'0%': { transform: 'rotate( 0deg )' },
					'100%': { transform: 'rotate( 180deg )' },
				},
			},
			// animation: {
			// 	arrow: 'rotate 1s infinite',
			// },
		},
		screens: {
			sm: '465px',
			md: '768px',
			lg: '1024px',
			xl: '1640px',
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
};
