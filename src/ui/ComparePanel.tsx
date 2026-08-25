import { useSim } from '../state/store'
import { formatRange, formatYield } from './format'
import { BurstMode } from '../sim/types'

function ringRadius(report: { rings: Array<{ id?: string; psi?: number; radiusM: number }> }, pred: (r: { id?: string; psi?: number }) => boolean) {
  return report.rings.find(pred)?.radiusM ?? 0
}

export function ComparePanel() {
  const current = useSim((s) => s.report)
  const comparison = useSim((s) => s.comparison)
  const clear = useSim((s) => s.clearComparison)
  const save = useSim((s) => s.saveComparison)
  const hobMode = useSim((s) => s.hobMode)

  const rows = [
    { label: '5 psi', a: comparison ? ringRadius(comparison.report, (r) => r.psi === 5) : 0, b: ringRadius(current, (r) => r.psi === 5), kind: 'range' as const },
    { label: '1 psi', a: comparison ? ringRadius(comparison.report, (r) => r.psi === 1) : 0, b: ringRadius(current, (r) => r.psi === 1), kind: 'range' as const },
    { label: 'Fireball', a: comparison?.report.fireballMaxRadiusM ?? 0, b: current.fireballMaxRadiusM, kind: 'range' as const },
    { label: '3° thermal', a: comparison ? ringRadius(comparison.report, (r) => r.id === 'thermal-3') : 0, b: ringRadius(current, (r) => r.id === 'thermal-3'), kind: 'range' as const },
    { label: '500 rem', a: comparison ? ringRadius(comparison.report, (r) => r.id === 'rad-500') : 0, b: ringRadius(current, (r) => r.id === 'rad-500'), kind: 'range' as const },
    { label: 'HOB', a: comparison?.report.hobM ?? 0, b: current.hobM, kind: 'meters' as const },
  ]
  const falloutA = comparison?.report.fireballTouchesGround ?? false
  const falloutB = current.fireballTouchesGround
  const fiveDelta = rows[0].a ? ((rows[0].b / rows[0].a - 1) * 100) : 0
  const derivedHob = Boolean(
    comparison &&
    comparison.input.yieldKt !== current.yieldKt &&
    comparison.hobMode === hobMode &&
    hobMode !== BurstMode.Custom &&
    comparison.input.hobM !== current.hobM,
  )

  return (
    <section className="compare-card pointer-events-auto">
      <div className="guide-eyebrow">Comparison field</div>
      <h2>Change one variable</h2>
      {!comparison ? (
        <>
          <p>Save the current scenario, change one control, then read the difference instead of trusting the spectacle.</p>
          <button onClick={save}>Use current scenario as baseline</button>
        </>
      ) : (
        <>
          <div className="compare-grid">
            <div>
              <span>Baseline</span>
              <strong>{comparison.label}</strong>
              <b>{formatRange(rows[0].a)}</b>
            </div>
            <div>
              <span>Now</span>
              <strong>
                {formatYield(current.yieldKt)} · {Math.round(current.hobM)} m HOB
              </strong>
              <b>{formatRange(rows[0].b)}</b>
            </div>
          </div>
          <table className="compare-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Baseline</th>
                <th>Now</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.kind === 'range' ? formatRange(row.a) : `${Math.round(row.a)} m`}</td>
                  <td>{row.kind === 'range' ? formatRange(row.b) : `${Math.round(row.b)} m`}</td>
                </tr>
              ))}
              <tr>
                <td>Local fallout</td>
                <td>{falloutA ? 'on' : 'off'}</td>
                <td>{falloutB ? 'on' : 'off'}</td>
              </tr>
            </tbody>
          </table>
          <p className="compare-takeaway">
            The 5 psi radius is <strong>{fiveDelta >= 0 ? '+' : ''}{fiveDelta.toFixed(0)}%</strong> from the saved scenario.
            Compare only one changed variable for a useful causal read.
          </p>
          {derivedHob && (
            <p className="compare-derived">Yield changed directly; the selected optimization moved HOB with it.</p>
          )}
          <button className="quiet" onClick={clear}>
            Clear baseline
          </button>
        </>
      )}
    </section>
  )
}
