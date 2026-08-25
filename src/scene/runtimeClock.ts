/** High-frequency render values stay outside the UI store. */
let renderTime = 0
let renderLaunchU = 0

export function setRenderTime(value: number) { renderTime = value }
export function getRenderTime() { return renderTime }
export function setRenderLaunchU(value: number) { renderLaunchU = value }
export function getRenderLaunchU() { return renderLaunchU }
