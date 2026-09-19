import { useSim } from '../state/store'
import { formatNum, formatRange, formatTime } from './format'
import { BuildingClass, Shelter } from '../sim/types'
import { Chip, Slider } from './controls'

export function Probe() {
  const probe = useSim((s) => s.probe)
  const shelter = useSim((s) => s.shelter)
  const setShelter = useSim((s) => s.setShelter)
  const hoursOut = useSim((s) => s.hoursOut)
  const setHoursOut = useSim((s) => s.setHoursOut)
  const clear = useSim((s) => s.clearProbe)
  const buildingClass = useSim((s) => s.buildingClass)
  const setBuildingClass = useSim((s) => s.setBuildingClass)
  if (!probe) {
    return (
      <div className="pointer-events-auto border border-white/10 bg-panel/90 p-3 text-[12px] text-mute">
        Click the city to probe a point. Numbers cite Glasstone / DCPA / Miller.
      </div>
    )
  }
  return (
    <div className="pointer-events-auto w-[300px] border border-white/10 bg-panel/92 p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">Probe</p>
        <button className="text-[11px] text-mute" onClick={clear}>
          clear
        </button>
      </div>
      <Row k="Ground range" v={formatRange(probe.groundRangeM)} />
      <Row k="Slant range" v={formatRange(probe.slantRangeM)} />
      <Row k="Shock arrival" v={formatTime(probe.arrivalS)} />
      <Row k="Overpressure" v={`${formatNum(probe.overpressurePsi)} psi`} tip="overpressure" />
      <Row k="Dynamic / wind" v={`${formatNum(probe.dynamicPressurePsi)} psi · ${formatNum(probe.equivalentWindMph)} mph`} />
      <Row k="Thermal" v={`${formatNum(probe.thermalCalCm2)} cal/cm²`} tip="thermal" />
      <Row k="Prompt dose" v={`${formatNum(probe.promptRem)} rem`} tip="prompt" />
      <Row k="Fallout H+1" v={`${formatNum(probe.falloutRateH1RadH)} rad/h`} />
      <Row k={`Dose ${hoursOut}h`} v={`${formatNum(probe.falloutDoseRad)} rad`} />
      <Row k="Line of sight" v={probe.losClear ? 'clear' : 'ridge-shadowed'} />
      <Row k="Building" v={probe.buildingDamage} />
      <Row k="Fatality / injury" v={`${Math.round(probe.fatalityFrac * 100)}% / ${Math.round(probe.injuryFrac * 100)}%`} />
      <div className="mt-2 flex flex-wrap gap-1">
        {Object.values(BuildingClass).map((cls) => (
          <Chip key={cls} on={buildingClass === cls} onClick={() => setBuildingClass(cls)}>
            {cls}
          </Chip>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        {Object.values(Shelter).map((sh) => (
          <Chip key={sh} on={shelter === sh} onClick={() => setShelter(sh)}>
            {sh}
          </Chip>
        ))}
      </div>
      <div className="mt-2">
        <Slider
          label="Exposure"
          ariaLabel="Exposure duration"
          accent="accent"
          min={1}
          max={72}
          value={hoursOut}
          onChange={setHoursOut}
          display={`${hoursOut} h`}
        />
      </div>
      <p className="mt-2 text-[11px] leading-snug text-mute">{probe.notes.join(' ')}</p>
    </div>
  )
}

function Row({ k, v, tip }: { k: string; v: string; tip?: string }) {
  const setGlossary = useSim((s) => s.setGlossary)
  return (
    <div className="mt-1 flex justify-between gap-3 font-mono text-[11px]">
      {tip ? (
        <button className="text-mute has-tip ns-label hover:text-signal-hot" onClick={() => setGlossary(tip)}>
          {k}
        </button>
      ) : (
        <span className="text-mute">{k}</span>
      )}
      <span className="text-paper">{v}</span>
    </div>
  )
}
