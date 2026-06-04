import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        v1: resolve(__dirname, 'index_v1.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
}))
