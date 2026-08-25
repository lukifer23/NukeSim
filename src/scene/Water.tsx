import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSim } from '../state/store'
import { makeWaterMaterial } from './shaders/waterMat'
import { atmosphereLook } from './atmosphere'
import { buildShore } from './shore'
import type { GeneratedCity } from '../city/types'

export function Water() {
  const city = useSim((s) => s.city)
  if (city.biome.water === 'none') return null
  return <WaterBody city={city} />
}

function WaterBody({ city }: { city: GeneratedCity }) {
  const biome = city.biome
  const geo = useMemo(() => buildShore(city), [city])
  const mat = useMemo(() => {
    const color = biome.water === 'ocean' ? '#163a4c' : biome.water === 'lagoon' ? '#2a6a78' : '#245866'
    const chop = biome.water === 'ocean' ? 2.1 : biome.water === 'lagoon' ? 1.25 : 1
    return makeWaterMaterial(color, chop)
  }, [biome.water])
  const timeOfDay = useSim((s) => s.timeOfDay)

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    const look = atmosphereLook(timeOfDay, biome)
    mat.uniforms.uSun.value.set(look.sunPos[0], look.sunPos[1], look.sunPos[2])
  })

  if (!geo) return null
  return <mesh geometry={geo} material={mat} receiveShadow />
}
