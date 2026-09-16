import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Terrain } from './Terrain'
import { Water } from './Water'
import { Roads } from './Roads'
import { Buildings } from './Buildings'
import { Vegetation } from './Vegetation'
import { Landmarks } from './Landmarks'
import { OverlayRings } from './OverlayRings'
import { FalloutVolume } from './FalloutVolume'
import { ProbeMarker } from './ProbeMarker'
import { Detonation } from './Detonation'
import { Cameras } from './Cameras'
import { DistrictMarkers } from './DistrictMarkers'
import { Atmosphere } from './Sky'
import { useSim } from '../state/store'

export function World() {
  const { camera } = useThree()
  const cityId = useSim((s) => s.cityId)

  useEffect(() => {
    camera.far = 60000
    camera.updateProjectionMatrix()
  }, [camera])

  return (
    <>
      <Atmosphere />
      <Cameras />
      <group key={cityId}>
        <Terrain />
        <Water />
        <Roads />
        <Buildings />
        <Vegetation />
        <Landmarks />
        <DistrictMarkers />
      </group>
      <OverlayRings />
      <FalloutVolume />
      <ProbeMarker />
      <Detonation />
    </>
  )
}
