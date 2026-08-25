export const SOURCES = [
  {
    id: 'glasstone',
    cite: 'Samuel Glasstone & Philip J. Dolan, The Effects of Nuclear Weapons, 3rd ed., 1977.',
    used: 'Blast scaling, fireball, thermal, prompt radiation, crater, cloud rise, Mach stem.',
  },
  {
    id: 'fletcher',
    cite: 'Fletcher et al., Nuclear Bomb Effects Computer (CEX-62.2), AEC, 1963.',
    used: 'Curve-fit family behind the circular slide rule packaged with Glasstone 1964.',
  },
  {
    id: 'miller',
    cite: 'Carl F. Miller, Fallout and Radiological Countermeasures, Vol. 1, SRI, 1963 (SFSS).',
    used: 'Local fallout plume shape and H+1 scaling. Same family as NUKEMAP.',
  },
  {
    id: 'dcpa',
    cite: 'DCPA Attack Environment Manual, 1973; OTA, The Effects of Nuclear War, 1979.',
    used: 'Fatality and injury fractions vs overpressure.',
  },
  {
    id: 'nukemap',
    cite: 'Alex Wellerstein, NUKEMAP, nuclearsecrecy.com — method notes, not code.',
    used: 'Pedagogical framing, airburst/surface distinction, honesty about model limits.',
  },
]

export const DISCLAIMER = `NukeSim is an educational model. It is not for emergency planning or targeting. Effects are unclassified scaling laws — order-of-magnitude estimates that ignore detailed terrain shielding, weather shear, and building-to-building shadowing except where noted. Cities are fictional. A nuclear effects calculator is not a nuclear weapon.`

export const PRODUCT_BLURB =
  'A walkable 3D city and an honest nuclear-effects library. Yield, height of burst, delivery, and weather are the variables. The point is scale — not spectacle for its own sake.'

export const EMP_NOTE =
  'Electromagnetic pulse is not drawn as a damage circle. Unclassified models are not good enough to say which electronics die at which range. High-altitude EMP is a different geometry from a city airburst. We refuse the fake number.'
