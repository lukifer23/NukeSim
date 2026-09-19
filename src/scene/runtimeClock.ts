/** High-frequency render values stay outside the UI store. */
let renderTime = 0

export function setRenderTime(value: number) { renderTime = value }
export function getRenderTime() { return renderTime }
