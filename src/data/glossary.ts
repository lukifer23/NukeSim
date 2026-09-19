export type GlossaryEntry = {
  id: string
  term: string
  short: string
  body: string
  source: string
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'yield',
    term: 'Yield',
    short: 'Energy released, in kilotons or megatons of TNT.',
    body: 'One kiloton is 4.184×10¹² joules. Destructive *radius* grows only as the cube root of yield — a 1,000× bomb is about 10× the radius, not 1,000×.',
    source: 'Glasstone & Dolan 1977 §1',
  },
  {
    id: 'hob',
    term: 'Height of burst',
    short: 'Detonation altitude above the surface.',
    body: 'An intermediate height lets the blast reflect off the ground and merge with the incident wave (the Mach stem), stretching a given overpressure farther. Too high and the wave never couples. Too low and you pick up local fallout.',
    source: 'Glasstone Fig. 3.73 family',
  },
  {
    id: 'overpressure',
    term: 'Overpressure',
    short: 'Pressure above one atmosphere at the shock front.',
    body: '5 psi is the usual “city destroyed” contour: most buildings collapse. 1 psi throws glass. 20 psi levels heavy concrete. Dynamic pressure is the wind that follows.',
    source: 'Glasstone Ch. III; DCPA / OTA tables',
  },
  {
    id: 'mach',
    term: 'Mach stem',
    short: 'Merged incident + reflected blast near the ground.',
    body: 'After the reflected shock catches the incident shock, a nearly vertical front walks outward. That is why airbursts are chosen for cities.',
    source: 'Glasstone §2.33–2.35',
  },
  {
    id: 'fireball',
    term: 'Fireball',
    short: 'X-ray-heated air and weapon debris, not the casing glowing.',
    body: 'Radius scales ~W^0.4. If it touches the ground it sucks dirt and rubble into the cloud and you get local fallout. If it does not, local fallout is negligible.',
    source: 'Glasstone §2.04–2.05',
  },
  {
    id: 'thermal',
    term: 'Thermal radiation',
    short: '~35% of the energy, in two pulses.',
    body: 'The first pulse is short and UV-heavy (eye hazard). The second carries most of the burn energy. Thresholds rise with yield because the pulse lasts longer.',
    source: 'Glasstone Ch. VII',
  },
  {
    id: 'prompt',
    term: 'Prompt radiation',
    short: 'Neutrons and gammas in the first minute.',
    body: 'Only decisive at low yield. For ≥100 kt the lethal prompt radius sits inside the severe-blast radius. For 1–15 kt it can outrange blast.',
    source: 'Glasstone Ch. VIII',
  },
  {
    id: 'fallout',
    term: 'Local fallout',
    short: 'Radioactive dirt that falls out in hours to weeks.',
    body: 'Requires a fireball on the ground. Modeled here with Miller’s SFSS — a scaling cartoon, not a weather forecast. Dose rate falls roughly as t^−1.2 (the 7/10 rule).',
    source: 'Miller SFSS 1963; NUKEMAP FAQ',
  },
  {
    id: 'cep',
    term: 'CEP',
    short: 'Circular error probable — radius of 50% of impacts.',
    body: 'Open figures: modern ICBMs ~100–200 m. Delivery accuracy is not the same as yield. A miss still teaches the ring geometry.',
    source: 'Open military fact sheets',
  },
  {
    id: 'fission-fraction',
    term: 'Fission fraction',
    short: 'Share of yield from fission rather than fusion.',
    body: 'Thermonuclear weapons are often ~50% fission. Fission products drive fallout and a large part of prompt radiation. Tsar Bomba was deliberately “clean.”',
    source: 'Glasstone; open historical accounts',
  },
]
