# Agent notes

Guidance for automated coding agents working in this repository. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the human-facing version.

## What this is

NukeSim is a static, client-side educational nuclear-effects sandbox. React 19 + React Three Fiber + Zustand + Vite, Tailwind 4, Vitest, Playwright. No backend, no accounts, no runtime network calls.

## Commands

```bash
npm install
npm run dev            # http://localhost:5173
npm run lint           # oxlint
npm test               # unit tests
npm run test:coverage  # enforced thresholds
npm run build          # tsc -b && vite build
npm run check:bundle   # gzip budgets (main 110 KiB / scene 360 KiB)
npm run check:assets   # visual-asset budget
npm run test:e2e       # Playwright (desktop/tablet/phone)
npm run test:perf      # headed desktop FPS gate (local GPU)
npm run verify         # lint + coverage + build + budgets + e2e
npm run capture        # stage screenshots to artifacts/hitlist (dev server running)
```

Always finish a change by running `npm run lint`, `npx tsc -b`, `npm test`, and `npm run build` at minimum. Run `npm run verify` for anything touching the UI or scene.

## Layout

```
src/sim     pure physics — no React, no Three
src/data    cities, munitions, lessons, presets, model notes
src/state   scenario store, local draft and UI preferences
src/learn   mission evaluation and local progress
src/city    deterministic generator
src/scene   WebGL world
src/audio   synthesized sound
src/ui      bench, probe, academy, about
docs/       model card, city notes, asset provenance
```

## Hard rules

- **No stubs, mocks, placeholders, or dead flags.** Do not remove working behavior to make a test pass.
- **Physics is a contract.** `src/sim` is pure and deterministic. A formula change must update `docs/MODEL.md`, `src/data/model.ts`, and the affected tests in the same commit. Golden tests live in `tests/sim`.
- **No personal or device data** anywhere in the tree — no absolute home paths, usernames, machine names, or IPs.
- **Respect the bundle budget.** New panels and on-demand UI must be `lazy` and gated behind their open state. Run `npm run check:bundle` after adding imports to the shell.
- **Assets stay local** and are recorded in `docs/ASSET_PROVENANCE.md`. No runtime CDN fetches.
- **Accessibility**: label icon-only controls, keep toggle `aria-pressed`, honor reduced-motion, keep focus visible.
- Keep store subscriptions per-field (no bare `useSim()` in hot components); the sim clock publishes ~12 Hz during playback.

## Verifying visually

`npm run capture` writes stage screenshots to `artifacts/hitlist/` (gitignored). Use it to confirm scene or control changes; compare against the previous tag (`w18-*`, etc.).
