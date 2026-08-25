import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json-summary'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 90,
        lines: 80,
        'src/sim/**.ts': { statements: 85, branches: 70, functions: 90, lines: 85 },
        'src/sim/fallout.ts': { statements: 80, branches: 70, functions: 90, lines: 80 },
        'src/state/store.ts': { statements: 75, branches: 70, functions: 75, lines: 75 },
        'src/learn/**.ts': { statements: 85, branches: 70, functions: 90, lines: 85 },
      },
    },
  },
})
