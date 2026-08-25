import * as THREE from 'three'

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
        if (u >= 1.28) return 0.0;
        float bowl = u < 1.0 ? -uCraterD * (1.0 - u * u) * (1.0 - u * u) : 0.0;
        float lip = 0.0;
        if (u > 0.88) {
          float t = (u - 0.88) / 0.4;
          lip = uCraterD * 0.13 * 4.0 * t * (1.0 - t);
        }
        return bowl + lip;
      }`,
    ).replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float cY = craterY(length(transformed.xz - uGz.xz));
      transformed.y += cY;
      float e = max(6.0, uCraterR * 0.02);
      vec3 pr = transformed + vec3(e, 0.0, 0.0);
      vec3 pf = transformed + vec3(0.0, 0.0, e);
      pr.y += craterY(length(pr.xz - uGz.xz)) - cY;
      pf.y += craterY(length(pf.xz - uGz.xz)) - cY;
      objectNormal = normalize(cross(pf - transformed, pr - transformed));
      transformedNormal = normalMatrix * objectNormal;
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
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }`,
    ).replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      float n = noise(vWorldP.xz * 0.08) * 0.55 + noise(vWorldP.xz * 0.28) * 0.45;
      diffuseColor.rgb *= 0.88 + 0.16 * n * uGrain;
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
