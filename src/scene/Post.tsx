import { Bloom, EffectComposer, SMAA } from '@react-three/postprocessing'
import { useSim } from '../state/store'

export function Post() {
  const quality = useSim((s) => s.renderQuality)
  if (quality === 'safe') return null
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.82} luminanceThreshold={0.85} luminanceSmoothing={0.22} radius={0.52} />
      <SMAA />
    </EffectComposer>
  )
}
