import * as THREE from 'three'
import { CRATER_EXTENT, CRATER_LIP, CRATER_RIM_START } from '../craterRelief'
import { GLSL_HASH2, GLSL_VALUE_NOISE2 } from './glsl'

export type TerrainUniforms = {
  uGz: { value: THREE.Vector3 }
  uShock: { value: number }
  uFireball: { value: number }
  uPsi20: { value: number }
  uGrain: { value: number }
  uCraterR: { value: number }
  uCraterD: { value: number }
}

export function makeTerrainMaterial(): THREE.MeshStandardMaterial {
  const extras: TerrainUniforms = {
    uGz: { value: new THREE.Vector3() },
    uShock: { value: 0 },
    uFireball: { value: 0 },
    uPsi20: { value: 0 },
    uGrain: { value: 1 },
    uCraterR: { value: 0 },
    uCraterD: { value: 0 },
  }
  const mat = new THREE.MeshStandardMaterial({
    roughness: 0.96,
    metalness: 0.02,
    vertexColors: true,
  })
  mat.userData.scorch = extras
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGz = extras.uGz
    shader.uniforms.uShock = extras.uShock
    shader.uniforms.uFireball = extras.uFireball
    shader.uniforms.uPsi20 = extras.uPsi20
    shader.uniforms.uGrain = extras.uGrain
    shader.uniforms.uCraterR = extras.uCraterR
    shader.uniforms.uCraterD = extras.uCraterD
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      uniform vec3 uGz;
      uniform float uCraterR;
      uniform float uCraterD;
      varying vec3 vWorldP;
      float craterY(float d){
        if (uCraterR <= 1.0 || uCraterD <= 0.0) return 0.0;
        float u = d / uCraterR;
        if (u >= ${CRATER_EXTENT}) return 0.0;
        float bowl = u < 1.0 ? -uCraterD * (1.0 - u * u) * (1.0 - u * u) : 0.0;
        float lip = 0.0;
        if (u > ${CRATER_RIM_START}) {
          float t = (u - ${CRATER_RIM_START}) / ${(CRATER_EXTENT - CRATER_RIM_START).toFixed(2)};
          lip = uCraterD * ${CRATER_LIP} * t * (1.0 - t);
        }
        return bowl + lip;
      }`,
    ).replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
      // The crater is a vertical displacement field layered on the baked terrain.
      // Fold its gradient into the baked normal here, before defaultnormal_vertex
      // turns objectNormal into transformedNormal (doing this in begin_vertex was
      // too late: vNormal had already been written).
      {
        float e = max(6.0, uCraterR * 0.02);
        float c0 = craterY(length(position.xz - uGz.xz));
        float cx = craterY(length(position.xz + vec2(e, 0.0) - uGz.xz));
        float cz = craterY(length(position.xz + vec2(0.0, e) - uGz.xz));
        objectNormal = normalize(objectNormal + vec3(-(cx - c0) / e, 0.0, -(cz - c0) / e));
      }`,
    ).replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      transformed.y += craterY(length(transformed.xz - uGz.xz));
      vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      uniform vec3 uGz;
      uniform float uShock;
      uniform float uFireball;
      uniform float uPsi20;
      uniform float uGrain;
      varying vec3 vWorldP;
      ${GLSL_HASH2}
      ${GLSL_VALUE_NOISE2}`,
    ).replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      // Multi-octave ground detail with derivative fade so distant terrain does
      // not shimmer. Higher octaves drop out as a texel spans their wavelength.
      float deriv = fwidth(vWorldP.x) + fwidth(vWorldP.z);
      float n1 = noise(vWorldP.xz * 0.09);
      float n2 = noise(vWorldP.xz * 0.34);
      float n3 = noise(vWorldP.xz * 0.95);
      float n = n1 * 0.6 + n2 * 0.3 * (1.0 - smoothstep(0.35, 2.2, deriv)) + n3 * 0.2 * (1.0 - smoothstep(0.12, 0.7, deriv));
      diffuseColor.rgb *= 0.88 + 0.17 * n * uGrain;
      float r = length(vWorldP.xz - uGz.xz);
      float scorch = 0.0;
      if (uShock > 1.0) {
        if (r < uFireball) scorch = 0.78;
        else if (r < uPsi20) scorch = 0.48 * (1.0 - smoothstep(uFireball, uPsi20, r));
        else if (r < uShock) scorch = 0.16 * (1.0 - smoothstep(uPsi20, uShock, r));
      }
      diffuseColor.rgb = mix(diffuseColor.rgb * (1.0 - scorch), vec3(0.07, 0.05, 0.04), scorch * 0.55);`,
    )
  }
  mat.customProgramCacheKey = () => 'terrain-lit-scorch-crater-v2'
  return mat
}
