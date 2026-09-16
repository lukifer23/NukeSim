import { useState } from 'react'
import { encodeScenario } from '../sim/scenario'
import { useSim } from '../state/store'
import { Share2 } from 'lucide-react'

export function ScenarioShare() {
  const s = useSim()
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const scenario = s.scenario()
    const url = new URL(window.location.href)
    url.search = encodeScenario({ ...scenario, cityId: s.cityId, munitionId: s.munitionId })
    const text = `NukeSim educational scenario: ${Math.round(scenario.yieldKt)} kt at ${Math.round(scenario.hobM)} m HOB.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NukeSim scenario', text, url: url.toString() })
        setCopied(true)
      } else {
        await navigator.clipboard.writeText(url.toString())
        setCopied(true)
      }
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      // A dismissed native share dialog is not an application error.
    }
  }
  return (
    <button className="icon-action flex items-center gap-2 border border-white/15 px-3 py-2 text-sm text-body" onClick={share}>
      <Share2 aria-hidden="true" size={16} />
      {copied ? 'Copied' : 'Share'}
    </button>
  )
}
