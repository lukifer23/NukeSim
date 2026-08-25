export type FieldMoment = {
  label: string
  detail: string
}

/** Plain-language timeline phases that explain the visual without adding new physics claims. */
export function fieldMoment(simTimeS: number, falloutActive: boolean): FieldMoment {
  if (simTimeS < 0.08) return { label: 'Flash', detail: 'Light reaches the city before the blast wave.' }
  if (simTimeS < 1) return { label: 'Fireball growth', detail: 'The luminous fireball expands around the burst point.' }
  if (simTimeS < 20) return { label: 'Shock front', detail: 'The pressure front moves outward across the city.' }
  if (simTimeS < 90) return { label: 'Cloud rise', detail: 'The cloud rises while fires and structural damage settle.' }
  if (simTimeS < 3600) return { label: 'Early aftermath', detail: 'Probe the field to connect distance with local effects.' }
  return falloutActive
    ? { label: 'Fallout progression', detail: 'The displayed field follows arrival and 7/10 decay assumptions.' }
    : { label: 'Long-term view', detail: 'Local fallout remains inactive for this airburst.' }
}
