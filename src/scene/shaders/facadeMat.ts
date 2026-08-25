import * as THREE from 'three'

const STYLE: Record<string, number> = {
  house: 0,
  walkup: 1,
  tower: 2,
  slab: 3,
  shed: 4,
  bunker: 5,
}

export function styleId(variant: string): number {
  return STYLE[variant] ?? 1
}

export function makeFacadeMaterial(opts: {
  metalness: number
  roughness: number
  map?: THREE.Texture | null
}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    roughness: opts.roughness,
    metalness: opts.metalness,
    vertexColors: true,
    map: opts.map ?? null,
  })
  const extras = { uDay: { value: 0.7 } }
  mat.userData.uDay = extras.uDay
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDay = extras.uDay
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute float aFloors;
        attribute float aSeed;
        attribute float aCols;
        attribute float aStyle;
        varying vec2 vFuv;
        varying float vFloors;
        varying float vSeed;
        varying float vCols;
        varying float vStyle;`,
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vFuv = uv;
        vFloors = aFloors;
        vSeed = aSeed;
        vCols = aCols;
        vStyle = aStyle;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec2 vFuv;
        varying float vFloors;
        varying float vSeed;
        varying float vCols;
        varying float vStyle;
        uniform float uDay;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float floors = max(2.0, vFloors * 0.42);
        float cols = max(2.0, vCols * 0.38);
        float house = step(vStyle, 0.5);
        float bunker = step(4.5, vStyle);
        float shed = step(3.5, vStyle) * (1.0 - bunker);
        if (house > 0.5) { floors = min(floors, 2.0); cols = min(cols, 3.0); }
        if (bunker > 0.5) { floors = max(2.0, floors * 0.5); cols = 2.0; }
        if (shed > 0.5) { floors = 2.0; cols = max(3.0, cols); }
        vec2 grid = vec2(vFuv.x * cols, vFuv.y * floors);
        vec2 cell = fract(grid);
        vec2 id = floor(grid);
        float insetX = mix(0.28, 0.38, house + bunker * 0.3);
        float insetY = mix(0.3, 0.4, house);
        float win = step(insetX, cell.x) * step(cell.x, 1.0 - insetX) * step(insetY, cell.y) * step(cell.y, 1.0 - insetY);
        float floorBand = step(cell.y, 0.12);
        float night = 1.0 - smoothstep(0.28, 0.48, uDay);
        float lit = step(0.82, hash(id + vSeed)) * night;
        vec3 wall = diffuseColor.rgb;
        vec3 band = wall * 0.88;
        vec3 glassDay = vec3(0.2, 0.23, 0.26);
        vec3 glassNight = vec3(0.62, 0.48, 0.24);
        vec3 glass = mix(glassDay, glassNight, lit);
        diffuseColor.rgb = mix(mix(wall, band, floorBand), glass, win);
        `,
      )
  }
  mat.customProgramCacheKey = () => `facade-v7-${opts.map ? 'tex' : 'plain'}`
  return mat
}
