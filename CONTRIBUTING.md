# Contributing

Thanks for helping improve NukeSim — an educational nuclear-effects sandbox. This is a static client-side app: no backend, no accounts, and no tracking.

## Setup

Requires Node 22+ and npm.

```bash
npm install
npm run dev   # http://localhost:5173
```

## Gates

Run these before opening a pull request. `npm run verify` chains the non-hardware ones:

| Command | Checks |
|---|---|
| `npm run lint` | oxlint |
| `npm test` | unit tests (physics, generator, state, UI helpers) |
| `npm run test:coverage` | enforced coverage thresholds |
| `npm run build` | `tsc -b` + Vite production build |
| `npm run check:bundle` | gzip budget for the main and lazy bundles |
| `npm run check:assets` | packaged visual-asset budget |
| `npm run test:e2e` | Playwright: desktop/tablet/phone, Axe, resilience |
| `npm run test:perf` | headed desktop FPS gate (local, needs a GPU) |

CI runs lint, coverage, build, the budgets, and the Playwright suite (desktop + phone on software WebGL). The tablet matrix and the FPS gate run locally.

## Conventions

- **Physics is a contract.** `src/sim` is pure and React/Three-free. If you change a formula, update `docs/MODEL.md`, `src/data/model.ts`, and the affected tests in the same change. Golden tests live in `tests/sim`.
- **Keep the shell light.** The main bundle has a gzip budget; new panels and on-demand UI should be `lazy` and gated behind their open state so they stay out of the initial chunk.
- **Assets stay local.** No runtime CDN fetches. Record new textures/fonts in `docs/ASSET_PROVENANCE.md`.
- **No personal or device data** in the tree — no local absolute paths, usernames, or hardware names.
- **Accessibility** matters: label icon-only controls, keep toggles `aria-pressed`, and honor reduced-motion.
- Prefer small, typed, tested changes; no stubs, placeholders, or dead flags.

## Commits and PRs

- Use short, scoped commit subjects (e.g. `sim:`, `scene:`, `ui:`, `ci:`, `docs:`).
- Describe what changed and how you verified it. Note any physics or budget impact.
- Fill in the pull-request template, including which gates you ran.

## Reporting

- Bugs and ideas: GitHub Issues.
- Security: see [`SECURITY.md`](SECURITY.md).
