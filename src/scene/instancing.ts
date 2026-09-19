import * as THREE from 'three'

/** Scratch transform for writing instanced matrices. */
export function dummy(): THREE.Object3D {
  return new THREE.Object3D()
}

/**
 * Non-degenerate matrix parked outside the scene and every shadow frustum.
 * Zero or paper-thin matrices can create enormous triangular shadow acne.
 */
export function hidden(tmp: THREE.Object3D): THREE.Matrix4 {
  tmp.position.set(0, -10000, 0)
  tmp.rotation.set(0, 0, 0)
  tmp.scale.setScalar(0.001)
  tmp.updateMatrix()
  return tmp.matrix
}
