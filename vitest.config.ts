import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    exclude: ['node_modules', 'dist', 'e2e/**'],
    coverage: { provider: 'v8', reporter: ['text', 'lcov'], include: ['src/lib/**'] },
  },
})
