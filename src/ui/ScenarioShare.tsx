import { useState } from 'react'
import { encodeScenario } from '../sim/scenario'
import { useSim } from '../state/store'
import { Share2 } from 'lucide-react'

export function ScenarioShare() {
  const cityId = useSim((s) => s.cityId)
  const munitionId = useSim((s) => s.munitionId)
  const scenario = useSim((s) => s.scenario)
  const [status, setStatus] = useState<'idle' | 'shared' | 'copied'>('idle')
  const share = async () => {
    const input = scenario()
    const url = new URL(window.location.href)
    url.search = encodeScenario({ ...input, cityId, munitionId })
    const text = `NukeSim educational scenario: ${Math.round(input.yieldKt)} kt at ${Math.round(input.hobM)} m HOB.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NukeSim scenario', text, url: url.toString() })
        setStatus('shared')
      } else {
        await navigator.clipboard.writeText(url.toString())
        setStatus('copied')
      }
      window.setTimeout(() => setStatus('idle'), 2200)
    } catch {
      // A dismissed native share sheet is not an application error.
    }
  }
  return (
    <button
      className="icon-action flex items-center gap-2 border border-white/15 px-3 py-2 text-sm text-body"
      onClick={share}
      aria-label={status === 'copied' ? 'Link copied' : status === 'shared' ? 'Scenario shared' : 'Share scenario'}
    >
      <Share2 aria-hidden="true" size={16} />
      {status === 'copied' ? 'Copied' : status === 'shared' ? 'Shared' : 'Share'}
    </button>
  )
}
