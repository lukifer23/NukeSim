import { useSim } from '../state/store'
import { formatRange } from './format'
import type { OverlayKey } from '../state/store'

export function FieldLegend() {
  const report = useSim((s) => s.report)
  const overlays = useSim((s) => s.overlays)
  const toggle = useSim((s) => s.toggleOverlay)
  const five = report.rings.find((ring) => ring.psi === 5)
  const thermal = report.rings.find((ring) => ring.id === 'thermal-3')
  const prompt = report.rings.find((ring) => ring.id === 'rad-500')
  const fields: Array<{ key: OverlayKey; label: string; color: string; value: string }> = [
    { key: 'blast', label: '5 psi blast', color: five?.color ?? '#d97a4a', value: formatRange(five?.radiusM ?? 0) },
    { key: 'thermal', label: '3° thermal', color: thermal?.color ?? '#c44b2b', value: formatRange(thermal?.radiusM ?? 0) },
    { key: 'radiation', label: '500 rem', color: prompt?.color ?? '#7ec8c9', value: formatRange(prompt?.radiusM ?? 0) },
    { key: 'fallout', label: 'Fallout field', color: '#7a6a3a', value: report.fireballTouchesGround ? 'on' : 'off' },
    { key: 'fireball', label: 'Fireball', color: '#fff4d6', value: formatRange(report.fireballMaxRadiusM) },
  ]
  return (
    <section className="field-legend pointer-events-auto">
      <div className="guide-eyebrow">Visible fields</div>
      {fields.map((field) => (
        <button
          key={field.key}
          aria-pressed={overlays[field.key]}
          className={overlays[field.key] ? '' : 'muted'}
          onClick={() => toggle(field.key)}
        >
          <i style={{ background: field.color }} /> <span>{field.label}</span><b>{field.value}</b>
        </button>
      ))}
      <p>{report.fireballTouchesGround ? 'Surface-coupled: local fallout field active. Arrow is wind, not a forecast.' : 'Airburst: local fallout field inactive.'}</p>
    </section>
  )
}
