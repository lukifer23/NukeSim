# NukeSim

A walkable 3D city and an honest nuclear-effects library. Yield, height of burst, delivery, and weather are the variables. The point is scale — not spectacle for its own sake.

NukeSim is an educational model. It is not for emergency planning or targeting. Effects are unclassified scaling laws — order-of-magnitude estimates that ignore detailed terrain shielding (except ridge line-of-sight), weather shear, and building-to-building shadowing. Cities are fictional. A nuclear effects calculator is not a nuclear weapon.

## The v0.3 learning loop

1. Start a five-minute Academy mission covering cube-root scale, burst height, fallout, or prompt radiation.
2. Predict the result before loading the field, then run the declared baseline and comparison.
3. Read the causal observation from immutable run snapshots instead of trusting the animation or edited controls.
4. Complete the explanation to save local, model-versioned progress. No account or backend is involved.
5. Move to **Inspect** or **Compare** for free investigation, probes, timeline, and model limits. The field, ground-zero, and cloud cameras are explicit views; scrubbing time never silently changes the camera.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). **Chrome on an M3 Pro is the performance target.** Safari works via WebGL2.

The full 3D field targets desktop and tablet viewports (768 px wide and above). Phones receive a readable Academy/model landing instead of a compressed, misleading control surface.

```bash
npm test             # physics + city + mission state
npm run test:coverage # enforced model and state coverage gates
npm run test:e2e      # desktop/tablet/phone and Academy accessibility
npm run build
npm run check:bundle  # 105 KiB main / 360 KiB lazy scene gzip ceilings
npm run check:assets  # 6 MiB packaged visual-asset ceiling
npm run verify        # full non-hardware release gate
npm run test:perf     # headed Chrome FPS gate on the documented M3 Pro target
npm run preview
```

## What you can change

| Control | What it teaches |
|---|---|
| Yield (log slider, 0.1 kt–50 Mt) | Radius grows as the cube root, not linearly |
| Height of burst | Mach stem vs local fallout (the physical fireball-touches-ground switch; visual footprint does not change it) |
| Historical delivery context | Separate non-operational context module; the core simulation begins at the scenario |
| Fission fraction | Fallout and prompt source term |
| Wind / visibility | Plume cartoon; thermal transmittance |
| Time of day | Solar angle, shadow direction, and the sky-derived reflection palette |
| City | Density, climate, and (on Kite Pass) a ridge that actually shadows |
| Camera view | Field, Ground zero, and Cloud framing only — never a model result |

Historical presets: Little Boy, Fat Man, Ivy King, Castle Bravo, Tsar Bomba.

## Keyboard

| Key | Action |
|---|---|
| `Space` | Play / pause the field |
| `←` / `→` | Scrub back / forward (pauses playback) |
| `1` / `2` / `3` | Field / Ground zero / Cloud camera |
| `B` `T` `R` `F` `L` | Toggle blast, thermal, radiation, fallout, fireball overlays |
| `K` | Skip the launch cinematic |

## Audio

Blast sound is synthesized in the browser, not loaded from assets: a shock crack, a sweeping whoosh, sub-bass, and a yield-scaled rumble, all timed so the peak lands when the shock actually reaches the field camera. A short blip confirms each probe. Audio starts on the Run gesture (browser autoplay policy) and the Setup **mute** toggle silences everything.

## What the numbers mean

- **5 psi** — usual “most buildings collapse” contour.
- **Fireball touches ground** — local fallout on. Airburst: negligible local fallout.
- **H+1 fallout** — Miller SFSS scaling cartoon, not a weather forecast.
- **Fatalities / injuries** — DCPA/OTA vs blast overpressure **only**. Fire and fallout are not in the headline.

The full contract is [`docs/MODEL.md`](docs/MODEL.md). Cities: [`docs/CITIES.md`](docs/CITIES.md). In the app: **About**.

## v2 model boundary

NukeSim uses a canonical scenario origin. The selected ground zero is shared by probes, building damage, fires, fallout, and aggregate population sampling. It still does **not** provide a local forecast, targeting analysis, emergency plan, or medical diagnosis. The fallout field is an educational time-and-wind progression based on an H+1 reference pattern; it does not model live weather, rainout, or terrain deposition.

## Sources

Glasstone & Dolan, *The Effects of Nuclear Weapons*, 1977; Fletcher et al., CEX-62.2, 1963; Carl F. Miller, SFSS, 1963; DCPA 1973 / OTA 1979. Pedagogical framing inspired by [NUKEMAP](https://nuclearsecrecy.com/nukemap/) (Alex Wellerstein) — we did not copy its code.

## Stack

Vite 8 · React 19 · TypeScript · Three.js / React Three Fiber · @react-three/postprocessing · Zustand · Tailwind 4 · Lucide · Vitest

```
src/sim     pure physics, no React, no Three
src/learn   pure mission evaluation and local progress contract
src/city    deterministic generator
src/scene   WebGL world
src/audio   synthesized blast and probe sound
src/ui      bench, probe, academy, about
docs/       model card, city notes, asset provenance
```

The simulation uses one progressive **Setup** surface instead of competing workspace tabs. Environment controls stay available in the same sheet, collapsed until needed. Renderer quality may adapt before a run, then locks for that run so a comparison cannot change appearance midway through playback. Error boundaries isolate the field from the shell, a lost WebGL context surfaces a recoverable notice, and every asset — textures and fonts — is packaged locally, so the app makes no runtime CDN fetches. Texture and font sources are recorded in [`docs/ASSET_PROVENANCE.md`](docs/ASSET_PROVENANCE.md).
