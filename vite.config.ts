import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { join } from 'path'

// HTTPS certificates path
const certDir = join(__dirname, 'certs')
const httpsConfig = {
  key: readFileSync(join(certDir, 'localhost-key.pem')),
  cert: readFileSync(join(certDir, 'localhost.pem')),
}

export default defineConfig({
  root: './renderer',
  plugins: [react()],
  server: {
    https: httpsConfig,
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  publicDir: '../public',
})
