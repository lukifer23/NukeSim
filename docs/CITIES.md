# Fictional cities

All five worlds are generated from a seed plus a biome spec. None are real places. The point of each city is one lesson the rings cannot teach alone.

## Port Meridian (`harbor`)

- **Tag.** Coastal megacity · ~4.2 million · 80 km² · seed 1945
- **Climate.** Temperate marine, 12 km visibility, hazy
- **Construction.** Concrete and steel downtown, masonry mid-rise, some wood
- **Look for.** Bridges, container cranes, a dense core against the water. The classic “what does 300 kt do to a megacity?”
- **Notice.** A 5 psi ring that crosses a named bridge. Cube-root day lives here.

## Cinder Reach (`foundry`)

- **Tag.** River industrial · ~850 thousand · 45 km² · seed 1954
- **Climate.** Continental, industrial haze, 10 km visibility
- **Construction.** Steel and masonry, tank farms
- **Look for.** The river, rail-adjacent tanks, refinery drums
- **Notice.** Fuel load. Ignition rings mean more here than in the desert. Lesson 4 (small and dirty) starts on this river.

## Solara Basin (`dune`)

- **Tag.** Desert sprawl · ~320 thousand · 60 km² · seed 1962
- **Climate.** Arid, 28 km visibility
- **Construction.** Masonry and concrete, low wood fraction
- **Look for.** A thin downtown, long suburban reach, no water
- **Notice.** Thermal ranges stretch in clear air. Blast does not care about humidity. Castle Bravo’s fallout lesson is staged on this sand.

## Kite Pass (`saddle`)

- **Tag.** Alpine valley · ~180 thousand · 18 km² · seed 1963
- **Climate.** Alpine, inversion-prone, 8 km visibility
- **Construction.** Wood and masonry on the floor
- **Look for.** A tight valley, ridges left and right, a hospital on the floor
- **Notice.** **Ridge line-of-sight.** Probe the far slope: thermal and prompt drop when the mountain sits between you and the fireball. Blast is only knocked down (heuristic), not deleted. This is the reason the city exists.

## North Haven (`atoll`)

- **Tag.** Island outpost · ~12 thousand · 6 km² · seed 1952
- **Climate.** Subpolar maritime, 20 km visibility, strong wind
- **Construction.** Wood and masonry on a ring of land
- **Look for.** Lagoon, thin ring of settlement, ocean everywhere else
- **Notice.** Tiny population, huge water. Local fallout still draws a plume; almost nobody is under it.

## Generator notes

`src/city/generate.ts` turns a biome into height, water, districts, streets, buildings, landmarks, and a land ground zero. Instance caps: harbor ≤ 2,400, typical cities ≤ 1,400, North Haven ≤ 420. Streets are empty rights-of-way, not painted lines on a solid brick. Detonation uses that land ground zero, not the map origin.
