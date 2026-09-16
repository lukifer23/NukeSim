# Design QA — fidelity recovery

Date: 2026-08-25

## Visual truth

- Source audit: `/tmp/nukesim-audit-20260824/01-landing.png` through `11-tablet-configure.png`
- Source contact sheet: `/tmp/nukesim-audit-20260824/contact-sheet.jpg`
- Implementation captures: `artifacts/design-qa/`
- Exact setup comparison: `artifacts/design-qa/setup-before-after-exact.jpg`
- Field, cloud, and responsive comparison: `artifacts/design-qa/final-before-after.jpg`

## Matched comparisons

| State | Source | Implementation | Viewport |
| --- | --- | --- | --- |
| Desktop setup | `03-configure.png` | `desktop-setup-1512x828.png` | 1512 × 828 |
| Tablet setup | `11-tablet-configure.png` | `tablet-setup-final.png` | 768 × 1024 |

Both pairs were inspected together in `setup-before-after-exact.jpg`. The implementation preserves the established documentary palette and typography while replacing the competing workspace grammar with Setup / Lesson or Compare / Inspect, increasing readable control density, and moving the 768 px layout into a usable bottom sheet.

## Runtime states reviewed

- 10 kt optimized airburst: field at 1 minute, explicit ground-zero view, and cloud view
- 1 Mt surface burst: fireball growth, field aftermath, ground-zero destruction, and cloud view
- Desktop 1512 × 850 and tablet 768 × 1024
- Academy prediction → automatically opened Setup → baseline → comparison → explanation → persisted completion

## Findings and resolution history

- P0: none.
- P1 resolved: postprocessing produced black WebGL frames; the unstable pass was removed while ACES exposure and renderer lighting were retained.
- P1 resolved: collapsed podiums and zero-scale shadow casters produced giant black slabs and triangular shadow acne; collapsed meshes now become non-degenerate hidden instances and deterministic rubble.
- P1 resolved: the cloud camera clipped the cap and the volume read as a pawn; the camera framing and unified toroidal/lobed cap were corrected, with a shallow source-coupled base surge.
- P1 resolved: 768 px setup was a narrow desktop rail; it is now a full-width, scrollable bottom sheet with the run action always reachable.
- P2 resolved: city surfaces were nearly black and repetitive; locally packaged CC0 PBR maps, eleven deterministic massing families, brighter facade response, and lower window density restore readable form.
- P2 resolved: mission setup required hidden panel knowledge; configure stages now open Setup automatically and the two-run E2E follows that contract.
- P2 resolved: timeline scrubbing changed cinematic framing; Field, Ground zero, and Cloud are explicit stable camera modes.
- P3 accepted: Three.js emits an upstream `THREE.Clock` deprecation warning from the current React Three Fiber stack. There are no shader errors, page errors, or deprecated shadow-map warnings from application code.

## Verification

- `npm run verify`: passed — 64 unit tests, coverage gates, build, bundle budgets, asset budget, desktop/tablet/phone E2E, Axe checks, and mission persistence.
- `npm run test:perf`: passed — headed desktop 10 kt and 1 Mt frame-budget gate.
- Bundle: main 101.6 / 105 KiB gzip; lazy scene 260.0 / 360 KiB gzip.
- Packaged visual assets: 4.97 / 6 MiB.
- Live browser QA: no black frames; readable fireball; intact field context; explicit cloud framing; surface-coupled destruction without giant slab or shard artifacts.

final result: passed
