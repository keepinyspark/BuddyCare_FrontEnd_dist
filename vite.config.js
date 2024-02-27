import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import mkcert from 'vite-plugin-mkcert';
import { splitVendorChunkPlugin } from 'vite';
import path from 'path';
import tailwindcss from 'tailwindcss';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	base: './',
	build: {
		assetsPublicPath: './',
	},
	esbuild: {
		minifySyntax: true,
	},
	plugins: [
		vue(),
		// minify({}),
		// mkcert(),
		VitePWA({
			// injectRegister: null,
			injectRegister: 'auto',
			// includeAssets: ['assets/webfonts/*.{woff2,woff}', 'assets/libs/draco/*.{js,wasm}', 'assets/images/**/*.{png,jpg,svg,webp}'],
			// includeAssets: [],
			registerType: 'autoUpdate',
			// injectManifest: {},
			workbox: {
				// globPatterns: ['**/*{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2,wasm,webp}'],
				globDirectory: 'dist/',
				globPatterns: ['**/*.{js,html,css}'],
				maximumFileSizeToCacheInBytes: 10000000,
				sourcemap: true,
				runtimeCaching: [
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|webp|wasm)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'Buddycare Images',
							expiration: {
								maxEntries: 10,
							},
						},
					},
				],
				skipWaiting: true,
				clientsClaim: true,
			},
			manifest: {
				name: 'Buddycare',
				short_name: 'Buddycare',
				description: 'Buddycare',
				theme_color: '#8601E7',
			},
		}),
		splitVendorChunkPlugin(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			'@src': path.resolve(__dirname, './src'),
			'@utils': path.resolve(__dirname, './src/utils'),
			'@components': path.resolve(__dirname, './src/components'),
			'@views': path.resolve(__dirname, './src/views'),
		},
	},
});
