# Design QA — fidelity recovery

Date: 2026-08-25

## Visual truth

- Source audit: landing, setup, field, cloud, and tablet captures (11 screens) from a local pre-redesign audit
- Source contact sheet: `contact-sheet.jpg` from the same audit
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
- P1 resolved: postprocessing produced black WebGL frames; the unstable pass was removed while ACES exposure and renderer lighting were retained. (A stable, quality-gated bloom + SMAA pass was reintroduced later — see the 2026-09-18 follow-up below.)
- P1 resolved: collapsed podiums and zero-scale shadow casters produced giant black slabs and triangular shadow acne; collapsed meshes now become non-degenerate hidden instances and deterministic rubble.
- P1 resolved: the cloud camera clipped the cap and the volume read as a pawn; the camera framing and unified toroidal/lobed cap were corrected, with a shallow source-coupled base surge.
- P1 resolved: 768 px setup was a narrow desktop rail; it is now a full-width, scrollable bottom sheet with the run action always reachable.
- P2 resolved: city surfaces were nearly black and repetitive; locally packaged CC0 PBR maps, eleven deterministic massing families, brighter facade response, and lower window density restore readable form.
- P2 resolved: mission setup required hidden panel knowledge; configure stages now open Setup automatically and the two-run E2E follows that contract.
- P2 resolved: timeline scrubbing changed cinematic framing; Field, Ground zero, and Cloud are explicit stable camera modes.
- P3 accepted: Three.js emits an upstream `THREE.Clock` deprecation warning from the current React Three Fiber stack. There are no shader errors, page errors, or deprecated shadow-map warnings from application code.

## Verification (2026-08-25 baseline)

- `npm run verify`: passed — 64 unit tests, coverage gates, build, bundle budgets, asset budget, desktop/tablet/phone E2E, Axe checks, and mission persistence.
- `npm run test:perf`: passed — headed desktop 10 kt and 1 Mt frame-budget gate.
- Bundle: main 101.6 / 105 KiB gzip; lazy scene 260.0 / 360 KiB gzip.
- Packaged visual assets: 4.97 / 6 MiB.
- Live browser QA: no black frames; readable fireball; intact field context; explicit cloud framing; surface-coupled destruction without giant slab or shard artifacts.

final result: passed

## Follow-up — 2026-09-18 visual / feel wave

Five waves of visual, animation, physics, and feel work landed on top of the fidelity recovery above, followed by a sky/lighting pass and an audio pass. Captures: `artifacts/hitlist/` (`w1-*` … `w6-*`).

- **Detonation impact.** Quality-gated bloom + SMAA (`src/scene/Post.tsx`, skipped at `safe` quality); blackbody fireball ramp; rebuilt mushroom-cloud SDF; turbulent shock; longer, wider detonation and cloud camera framing.
- **Destruction payoff.** Progressive collapse poses, instanced collapse dust, outward-velocity debris, coupled fire/ember/smoke seeds, grain-textured fallout, building color gated on shock arrival.
- **World beauty.** Earth-tone terrain palette with per-district tinting, broader building tint variation, dashed overlay rings, redesigned probe marker.
- **Feel and UX.** Keyboard shortcuts (`src/ui/useHotkeys.ts`), Skip during the launch cinematic, honest effective-rate readout, ambient visible-fields legend, click-to-probe on buildings, yield-scaled rumble, reduced-motion-aware transitions.
- **Sky and light.** Real solar arc (low at dawn/dusk), sky-derived PMREM environment per time-of-day, and a procedural sun/moon sprite.
- **Physics honesty.** Far-field blast falloff blends toward acoustic R⁻¹, cloud cap saturates toward the tropopause, crater note corrected, fallout wind clamp aligned with the model, report memoized for probing. `docs/MODEL.md` updated in the same change.
- **Audio.** A shared, gesture-gated Web Audio engine (`src/audio/`) synthesizes a shock crack, sweeping whoosh, sub-bass, and yield-scaled rumble timed to the shock's arrival at the field camera, plus a probe blip. Pure scaling math in `design.ts` is unit-tested; no audio assets are packaged.
- **Destruction depth.** Collapse now leans away from ground zero, severe and collapsed failures stagger by seed as a cascade rather than failing at once, debris is flung outward, and facades shatter window-by-window through a per-instance damage attribute.
- **Stability & resilience.** App-level and field-level error boundaries with themed fallbacks, WebGL context-loss/restore handling with a HUD notice, a guarded PMREM probe, and self-hosted IBM Plex fonts (no runtime CDN fetch).
- **Performance.** `atmosphereLook` is memoized so the lighting-driven layers stop rebuilding HSL objects every frame; all four building layers early-out once every instance has settled instead of rescanning the city each frame; shadow-map resolution scales with the quality tier.
- **UX polish.** An in-app keyboard-shortcut panel (`?` or the header button), scenario autosave that resumes the last setup on reload while keeping the safety gate, and a debrief **Copy results** action with a shareable link. The shortcut and debrief panels are lazy chunks, which kept the main bundle under budget.
- **Debris.** Fragments are launched outward from ground zero on shock arrival and integrated analytically against the real terrain: they arc, bounce with restitution and friction, then settle into piles instead of snapping to a precomputed point. No physics dependency; the effects model is unchanged.
- **Review fixes.** Sky now clones three-stdlib's shared material for its PMREM probe; `startLaunch` bumps the field revision so a re-run resets the scene; shared scenarios persist a draft; the shortcut dialog manages focus; lazy chunks degrade in place.
- **Bundle.** On-demand panels (model card, glossary, probe, compare) are lazy chunks, dropping the main bundle below the 100 KiB mark and restoring headroom for future work.
- **Dedupe.** Report rings are looked up through `ringByPsi`/`ringById`; the fallout arrival/spread constants and the crater bowl/lip constants are declared once and injected into their GLSL copies so JS and shader cannot drift; the identical GLSL `hash` and value-noise helpers are shared snippets; debris idles out when paused.
- **Accessibility & recovery.** A named `main` landmark, a polite live region for the field-phase caption, and a focus-trapped, `aria-modal` model card join the shortcut dialog's focus handling and the existing Axe checks. A "skip to setup controls" link bypasses the canvas for keyboard users.
- **Reset.** `resetScenario` restores the free-play defaults in one click (hidden during a guided mission), invalidates any recorded run, and clears the comparison baseline.
- **Controls & view state.** Sliders draw their filled progress so the current value reads at a glance; every overlay row and camera button shows its hotkey (B/T/R/F/L, 1/2/3) with `aria-keyshortcuts`; the header exposes a labeled **Shortcuts** control. The saved draft now also persists the overlay set and camera mode, so a reload resumes the exact view.

### Current verification

- `npm run verify`: passed — 90 unit tests, coverage gates, build, bundle budgets, asset budget, desktop/tablet/phone E2E, Axe checks, and mission persistence.
- `npm run test:perf`: passed — headed desktop 10 kt and 1 Mt frame-budget gate.
- Bundle: main 100.1 / 105 KiB gzip; lazy scene 343.1 / 360 KiB gzip.
- Packaged visual assets: 4.97 / 6 MiB.

### Code health pass

A dead-code and duplication review followed the audio and destruction waves. Removed: unused exports (`city/generate` street constants, unused `sim/units` conversions, `BlastPsi`, `glossaryById`, `taperedBlock`, the `runtimeClock` launch channel, `controls` Panel/Stat/Dock, the `city/index` barrel, `setLesson`), and the never-read `Building.floors`/`cols` fields. Centralized: `playbackRate`/`MAX_SIM_TIME_S`/`classifyTimeOfDay` (`sim/timeline`), `hidden`/`dummy` (`scene/instancing`), `isSurfaceBurst`, `FIREBALL_PSI`, `CAMERA_FAR`/`CAMERA_FOV_DEG`, `SHOCK_CULL_M`, LOS shadow/origin constants, and podium helpers. Every instanced building layer now routes through `buildingVisualEvent` with a precomputed range, and `resolveHob` is memoized. No behavior change; all gates and captures re-verified (`artifacts/hitlist/cleanup-*`).
