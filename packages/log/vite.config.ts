import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
	if (mode === 'library') {
		return {
			build: {
				lib: {
					entry: resolve(__dirname, 'main.ts'),
					name: 'WebMonitor',
					fileName: (format) => `web-monitor.${format}.js`,
					formats: ['es', 'umd']
				},
				rollupOptions: {
					output: {
						globals: {}
					}
				},
				outDir: 'dist',
				sourcemap: true,
				minify: false,
				emptyOutDir: false
			}
		}
	}

	// Default dev/demo configuration
	return {
		root: '.',
		publicDir: 'public'
	}
})
