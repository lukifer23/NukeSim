import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // The GitHub Pages project site is served from /NukeSim/; local dev and the
  // test servers stay at the root unless VITE_BASE says otherwise.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  // Keep three addons pre-bundled so a new import cannot trigger a Vite dep
  // re-optimization reload mid-session (which resets app state under test).
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/utils/BufferGeometryUtils.js',
      'three/examples/jsm/environments/RoomEnvironment.js',
    ],
  },
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
