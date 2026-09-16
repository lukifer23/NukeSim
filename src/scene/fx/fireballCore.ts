import * as THREE from 'three'

export const fireballCore = new THREE.Mesh(
  new THREE.SphereGeometry(1, 24, 16),
  new THREE.MeshBasicMaterial({ color: '#ffd59a', transparent: true, opacity: 0, depthWrite: false, depthTest: false }),
)

fireballCore.frustumCulled = false
fireballCore.renderOrder = 2
