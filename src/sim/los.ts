/** Sample a heightmap along a 3D segment. Returns false if terrain occludes. */
export function lineOfSightClear(
  heightAt: (x: number, z: number) => number,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  samples = 40,
): boolean {
  const dx = x1 - x0
  const dy = y1 - y0
  const dz = z1 - z0
  const len = Math.hypot(dx, dz)
  if (len < 8) return true
  const n = Math.max(8, Math.min(samples, Math.ceil(len / 40)))
  for (let i = 1; i < n; i++) {
    const t = i / n
    const x = x0 + dx * t
    const z = z0 + dz * t
    const y = y0 + dy * t
    // Small clearance so we do not self-hit the pad under GZ.
    if (heightAt(x, z) > y - 6) return false
  }
  return true
}

/** Heuristic blast leftover behind a ridge — not a hard zero. */
export function ridgeBlastFactor(clear: boolean): number {
  return clear ? 1 : 0.45
}
