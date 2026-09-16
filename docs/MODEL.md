# NukeSim model card

Unclassified scaling laws, implemented in `src/sim`. Order-of-magnitude estimates. Not emergency planning. Not a targeting tool.

Every public number in the HUD carries a `confidence` tag. If a visual change would require silently fudging a golden test, we change the visual — not the number.

## v0.3 learning and field contract

- **Canonical origin.** Every reported and rendered effect is evaluated relative to the same selected ground zero. Aggregate population sampling receives that origin too; comparison baselines retain their own complete input and report.
- **Confidence lives with the output.** The sandbox Model card exposes source family, uncertainty, excluded variables, and primary sensitivities for blast, thermal, prompt radiation, fallout, fireball, and crater fields.
- **Time matters.** The fallout overlay is an educational progression from plume arrival to an H+1 reference rate and later 7/10 decay. It is not a deposition forecast.
- **No precision theater.** A radius or rate communicates a relationship under stated assumptions, not a promise about a street, building, person, or operational scenario.
- **Lessons use captured runs.** Guided observations compare immutable baseline and comparison reports captured when each declared scenario actually launches. Later control edits cannot rewrite the lesson result.
- **Progress is local and versioned.** Completion records remain in the browser and are tied to the model version. A model update requires revisiting the mission before it receives a current badge.
- **Camera and quality are presentation state.** Field, ground-zero, and cloud views never alter a scenario result. Adaptive renderer quality may settle before launch and then remains locked for the captured run, so a comparison cannot acquire a different visual sampling level halfway through playback.

## Confidence

| Tag | Meaning |
|---|---|
| `standard-scaling` | Published formula, applied as written (cube-root, fireball W^0.4, thermal Q = fWτ / 4πD²). |
| `interpolated` | Fit or search over published charts (HOB knee, prompt-dose curve). Typical ±10–15%. |
| `heuristic` | Engineering table or cartoon (building damage vs psi, Miller plume shape, ridge blast knockdown). |
| `qualitative` | Spoken, not drawn as a damage circle (EMP). |

## Blast

- Law: D(W) = D₁ · W^(1/3). Scaled height of burst z = H / W^(1/3).
- HOB: a smooth “knee” peaks near the Mach-reflection optimum (about 205 m·kt^(−1/3) for 5 psi). Surface burst is 65–85% of that optimum, depending on psi. Interpolation of the Glasstone Fig. 3.73 *family*, not a digitised reprint.
- Rings: 20, 12, 5, 3, 1, 0.25 psi.
- Arrival: faster than sound near GZ, approaching 340 m/s. Time scales as W^(1/3).
- Dynamic pressure: Rankine–Hugoniot, γ = 1.4.
- Source: Glasstone & Dolan 1977 Ch. III; OTA 1979 destructive-radius figures.
- Confidence: `interpolated`.
- Fails when: terrain channeling, inversion layers, and building-to-building shielding are ignored except the ridge LOS knockdown.

## Fireball

- R_breakaway ≈ 90 W^0.4 ft; R_max ≈ 180 W^0.4 ft (1 Mt ≈ 2,850 ft radius).
- The physical R_max drives effects and the ground-coupling decision. The surface-burst renderer expands only the visible ground footprint ×1.15 to depict a hemispherical contact shape; that visual expansion never changes a model result.
- Fallout switch: local fallout is on iff HOB < physical R_max.
- Source: Glasstone §2.04–2.05.
- Confidence: `standard-scaling`.

## Thermal

- Q = f W τ / (4π D²) cal/cm². f ≈ 0.35 airburst; surface ≈ 0.7 of that.
- τ from meteorological visibility (Beer-like).
- Burn thresholds grow with yield because the pulse lasts longer: t ≈ 0.417 W^0.44 s (Glasstone 1977 revision).
- Ridge line-of-sight: if terrain occludes the fireball, fluence at that point is treated as ~0.
- Building-to-building shadow is still not modeled.
- Confidence: `standard-scaling` for the sphere; `heuristic` for ridge cutoff.

## Prompt radiation

- dose = A · W · f_f · exp(−R/λ) / R², tuned so 1 kt / 100% fission ≈ 500 rem at 1.0 km.
- Educational point: this only outranges severe blast at low yield.
- Ridge LOS applies the same way as thermal.
- Source: Glasstone Ch. VIII / Fletcher CEX-62.2 family.
- Confidence: `interpolated`.

## Fallout (Miller SFSS)

- Stem + downwind cloud smear. H+1 hour dose-rate contours (3000 / 1000 / 300 / 100 / 10 rad/h).
- Off unless the fireball touches the ground.
- 7/10 rule: R(t) = R(1 h) · t^(−1.2). Shelter factors: open 1, wood 0.5, basement 0.1, heavy RC 0.02.
- This is a scaling cartoon, not a weather forecast. No wind shear, no live MET.
- Source: Carl F. Miller, SFSS, 1963 — same family NUKEMAP uses.
- Confidence: `heuristic`.
- v2 render: an arrival/deposition progression explains why a downwind field is not present everywhere at detonation. Reference dose rates remain H+1 values.

## Casualties

- DCPA Attack Environment Manual (1973) / OTA 1979 fractions vs peak overpressure.
- Headline fatalities and injuries are **blast only**.
- Fire, fallout, and hospital collapse are shown as separate, lower-confidence holes — not added into the headline.
- Confidence: `heuristic`.

## EMP

- Not drawn as a damage radius. Unclassified dynamic models are too weak to put a number on a city.
- One paragraph in About / Academy. Confidence: `qualitative`.

## Crater and mushroom

- Crater: surface / near-surface only; Sedan-class engineering fit.
- Cloud rise: Miller / Glasstone curve fits. 1 Mt → ~20 km cap, ~80–100 m/s early rise.
- Fireball, shock, cloud, damage, and rubble rendering are explanatory visualizations of the reported model state. Their color, exposure, geometry sampling, and camera framing are not additional physical outputs.

## Golden tests (`npm test`)

| Case | Expectation |
|---|---|
| 15 kt, ~600 m HOB | 5 psi in 1.6–2.1 km |
| 1 Mt optimized airburst | 5 psi ~ 7 km |
| Fireball 1 Mt | 0.8–1.0 km |
| 1 kt vs 1000 kt | 5 psi ratio ≈ 10, not 1000 |
| 300 kt air vs surface | surface 5 psi smaller; fallout on only for surface |
| 10 kt surface prompt 500 rem | outranges 5 psi |
| 300 kt airburst prompt 500 rem | inside 5 psi |

Compare to [NUKEMAP](https://nuclearsecrecy.com/nukemap/) for order of magnitude, not pixels. They interpolate unpublished charts; so do we, differently.

## Adding a test

Put fixtures in `tests/sim/`. Import from `src/sim` only — no React, no Three. If you change a formula, update this card in the same commit.
