import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@web-monitor/log': path.resolve(__dirname, '../log/main.ts'),
			'@': path.resolve(__dirname, './src')
		}
	},
	server: {
		proxy: {
			'^/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			}
		}
	}
})
