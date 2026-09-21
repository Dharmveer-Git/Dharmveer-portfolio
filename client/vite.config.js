import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../', import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const port = Number(process.env.PORT || env.PORT) || 5001
  const target = `http://127.0.0.1:${port}`
  return {
    envDir: projectRoot,
    plugins: [react()],
    server: {
      proxy: {
        '/api': target,
        '/uploads': target,
      },
    },
  }
})
