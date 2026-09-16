import * as THREE from 'three'

const STYLE: Record<string, number> = {
  house: 0,
  walkup: 1,
  tower: 2,
  slab: 3,
  shed: 4,
  bunker: 5,
  rowhouse: 6,
  courtyard: 7,
  stepped: 8,
  warehouse: 9,
  civic: 10,
}

export function styleId(variant: string): number {
  return STYLE[variant] ?? 1
}

export function makeFacadeMaterial(opts: {
  metalness: number
  roughness: number
  map?: THREE.Texture | null
  normalMap?: THREE.Texture | null
  armMap?: THREE.Texture | null
}): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    roughness: opts.roughness,
    metalness: opts.metalness,
    // Instance tints arrive through InstancedMesh.instanceColor. Setting
    // vertexColors true without a `color` attribute zeroed vColor and with it
    // every wall albedo, leaving buildings lit only by the constant emissive.
    vertexColors: false,
    map: opts.map ?? null,
    normalMap: opts.normalMap ?? null,
    aoMap: opts.armMap ?? null,
    roughnessMap: opts.armMap ?? null,
    metalnessMap: opts.armMap ?? null,
    emissive: '#1b1e22',
    emissiveIntensity: 0.22,
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
        attribute vec2 aCols;
        attribute float aStyle;
        varying vec2 vFuv;
        varying float vFloors;
        varying float vSeed;
        varying float vColsX;
        varying float vColsZ;
        varying float vFaceX;
        varying float vStyle;`,
      )
      .replace(
        '#include <uv_vertex>',
        `#include <uv_vertex>
        vFuv = uv;
        vFloors = aFloors;
        vSeed = aSeed;
        vColsX = aCols.x;
        vColsZ = aCols.y;
        vFaceX = abs(normal.x) > abs(normal.z) ? 1.0 : 0.0;
        vStyle = aStyle;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec2 vFuv;
        varying float vFloors;
        varying float vSeed;
        varying float vColsX;
        varying float vColsZ;
        varying float vFaceX;
        varying float vStyle;
        uniform float uDay;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // Column counts are derived per face in bindFacade, so a narrow slab
        // face no longer stretches the same window grid as its wide face.
        float cols = vFaceX > 0.5 ? vColsZ : vColsX;
        float floors = vFloors;
        float house = step(vStyle, 0.5);
        float bunker = 1.0 - step(0.5, abs(vStyle - 5.0));
        float shed = max(1.0 - step(0.5, abs(vStyle - 4.0)), 1.0 - step(0.5, abs(vStyle - 9.0)));
        if (house > 0.5) { floors = min(floors, 3.0); cols = min(cols, 4.0); }
        if (bunker > 0.5) { floors = min(floors, 5.0); cols = clamp(cols, 2.0, 4.0); }
        if (shed > 0.5) { floors = 2.0; cols = clamp(cols, 3.0, 12.0); }
        vec2 grid = vec2(vFuv.x * cols, vFuv.y * floors);
        vec2 cell = fract(grid);
        vec2 id = floor(grid);
        vec2 gw = fwidth(grid);
        float aa = max(gw.x, gw.y) * 1.15;
        float insetX = mix(0.30, 0.38, house + bunker * 0.3);
        float insetY = mix(0.28, 0.38, house);
        float winX = smoothstep(insetX - aa, insetX + aa, cell.x) * (1.0 - smoothstep(1.0 - insetX - aa, 1.0 - insetX + aa, cell.x));
        float winY = smoothstep(insetY - aa, insetY + aa, cell.y) * (1.0 - smoothstep(1.0 - insetY - aa, 1.0 - insetY + aa, cell.y));
        float win = winX * winY;
        float floorBand = 1.0 - smoothstep(0.0, 0.10 + aa, cell.y);
        float night = 1.0 - smoothstep(0.28, 0.48, uDay);
        float lit = step(0.80, hash(id + vSeed)) * night;
        float glow = mix(0.5, 1.0, hash(id * 1.73 + vSeed));
        vec3 wall = diffuseColor.rgb;
        vec3 band = wall * 0.88;
        vec3 glassDay = vec3(0.06, 0.10, 0.14);
        vec3 glassNight = vec3(0.98, 0.74, 0.38);
        vec3 glass = mix(glassDay, glassNight, lit * glow);
        diffuseColor.rgb = mix(mix(wall, band, floorBand), glass, win);
        float litWin = win * lit * glow;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        // Lit windows actually emit at night instead of only tinting the diffuse.
        totalEmissiveRadiance += vec3(1.0, 0.72, 0.36) * (litWin * 1.35);`,
      )
  }
  mat.customProgramCacheKey = () => `facade-v8-${opts.map ? 'tex' : 'plain'}`
  return mat
}
