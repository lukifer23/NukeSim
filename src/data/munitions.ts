export const DeliveryKind = {
  Gravity: 'gravity',
  Icbm: 'icbm',
  Slbm: 'slbm',
  Historical: 'historical',
} as const
export type DeliveryKind = (typeof DeliveryKind)[keyof typeof DeliveryKind]

export type Munition = {
  id: string
  name: string
  analog: string
  kind: DeliveryKind
  yieldKt: number
  yieldMinKt: number
  yieldMaxKt: number
  defaultHobMode: 'surface' | 'optimize-5psi' | 'optimize-thermal' | 'custom'
  defaultHobM?: number
  fissionFraction: number
  flightS: number
  warningLabel: string
  cepM: number
  blurb: string
  teaching: string
}

export const MUNITIONS: Munition[] = [
  {
    id: 'gravity-b61',
    name: 'Gravity bomb',
    analog: 'B61-12 family (public analog)',
    kind: DeliveryKind.Gravity,
    yieldKt: 10,
    yieldMinKt: 0.3,
    yieldMaxKt: 50,
    defaultHobMode: 'optimize-5psi',
    fissionFraction: 1,
    flightS: 18,
    warningLabel: 'Minutes — bomber already nearby',
    cepM: 30,
    blurb: 'Aircraft-delivered, dial-a-yield. The only nuclear delivery used in war.',
    teaching: 'Variable yield and a chosen height of burst. Longest human-scale moment before the flash.',
  },
  {
    id: 'icbm-mm3',
    name: 'ICBM',
    analog: 'Minuteman III / W78–W87 class',
    kind: DeliveryKind.Icbm,
    yieldKt: 300,
    yieldMinKt: 150,
    yieldMaxKt: 475,
    defaultHobMode: 'optimize-5psi',
    fissionFraction: 0.5,
    flightS: 24,
    warningLabel: '~25–30 min, no recall after launch',
    cepM: 160,
    blurb: 'Silo-based intercontinental missile. Prompt, accurate, land leg of a triad.',
    teaching: 'Cube-root blast at strategic yield. CEP jitter is visible and educational.',
  },
  {
    id: 'slbm-d5',
    name: 'SLBM',
    analog: 'Trident II D5 / W76 or W88 class',
    kind: DeliveryKind.Slbm,
    yieldKt: 90,
    yieldMinKt: 90,
    yieldMaxKt: 455,
    defaultHobMode: 'optimize-5psi',
    fissionFraction: 0.5,
    flightS: 20,
    warningLabel: '~15–20 min typical, less warning',
    cepM: 220,
    blurb: 'Submarine-launched. The sea-based leg exists because it is hard to find.',
    teaching: 'Same physics, different warning time and launch geometry.',
  },
  {
    id: 'little-boy',
    name: 'Little Boy',
    analog: 'Hiroshima, 6 Aug 1945',
    kind: DeliveryKind.Historical,
    yieldKt: 15,
    yieldMinKt: 15,
    yieldMaxKt: 15,
    defaultHobMode: 'custom',
    defaultHobM: 580,
    fissionFraction: 1,
    flightS: 16,
    warningLabel: 'Gravity bomb, historical',
    cepM: 0,
    blurb: 'Uranium gun-type. ~15 kt airburst. The educational baseline.',
    teaching: 'Prompt radiation still matters at this yield. 5 psi is about 1.7 km.',
  },
  {
    id: 'fat-man',
    name: 'Fat Man',
    analog: 'Nagasaki, 9 Aug 1945',
    kind: DeliveryKind.Historical,
    yieldKt: 21,
    yieldMinKt: 21,
    yieldMaxKt: 21,
    defaultHobMode: 'custom',
    defaultHobM: 500,
    fissionFraction: 1,
    flightS: 16,
    warningLabel: 'Gravity bomb, historical',
    cepM: 0,
    blurb: 'Plutonium implosion. Similar yield to Little Boy, different physics inside the casing.',
    teaching: 'Yield, not design family, sets the rings.',
  },
  {
    id: 'ivy-king',
    name: 'Ivy King',
    analog: 'Largest US pure-fission test, 1952',
    kind: DeliveryKind.Historical,
    yieldKt: 500,
    yieldMinKt: 500,
    yieldMaxKt: 500,
    defaultHobMode: 'optimize-5psi',
    fissionFraction: 1,
    flightS: 14,
    warningLabel: 'Test device',
    cepM: 0,
    blurb: '500 kt, all fission. A reminder that fission alone can be strategic.',
    teaching: 'High fission fraction means a dirtier residual if it touches ground.',
  },
  {
    id: 'castle-bravo',
    name: 'Castle Bravo',
    analog: 'Bikini Atoll, 1954 — 15 Mt',
    kind: DeliveryKind.Historical,
    yieldKt: 15000,
    yieldMinKt: 15000,
    yieldMaxKt: 15000,
    defaultHobMode: 'surface',
    fissionFraction: 0.5,
    flightS: 12,
    warningLabel: 'Surface test',
    cepM: 0,
    blurb: 'US thermonuclear test. Yield was a surprise. The fallout plume became the lesson.',
    teaching: 'Surface + megatons + fission products = a continental-scale cartoon plume.',
  },
  {
    id: 'tsar',
    name: 'Tsar Bomba',
    analog: 'RDS-220, 50 Mt tested (100 Mt design)',
    kind: DeliveryKind.Historical,
    yieldKt: 50000,
    yieldMinKt: 50000,
    yieldMaxKt: 50000,
    defaultHobMode: 'optimize-5psi',
    fissionFraction: 0.03,
    flightS: 12,
    warningLabel: 'High airburst test',
    cepM: 0,
    blurb: 'Largest detonation ever. Almost no local fallout — a very high airburst, low fission.',
    teaching: 'Upper bound of the slider. Radius grows as the cube root; it does not eat the planet.',
  },
]

export const YIELD_NOTCHES: Array<{ kt: number; label: string }> = [
  { kt: 0.3, label: '0.3 kt' },
  { kt: 15, label: 'Hiroshima' },
  { kt: 21, label: 'Nagasaki' },
  { kt: 90, label: 'W76' },
  { kt: 300, label: 'W87-class' },
  { kt: 455, label: 'W88' },
  { kt: 1000, label: '1 Mt' },
  { kt: 15000, label: 'Bravo' },
  { kt: 50000, label: 'Tsar' },
]

export function munitionById(id: string): Munition {
  return MUNITIONS.find((m) => m.id === id) ?? MUNITIONS[0]
}

/** Header label: preset name while yield is inside that analog's published band. */
export function munitionLabel(id: string, yieldKt: number): string {
  const m = MUNITIONS.find((item) => item.id === id)
  if (!m) return 'Custom'
  if (yieldKt >= m.yieldMinKt * 0.98 && yieldKt <= m.yieldMaxKt * 1.02) return m.name
  return 'Custom'
}
