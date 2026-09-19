import * as THREE from 'three'
import { GLSL_HASH2 } from './glsl'

/**
 * Ground-hugging collapse dust: camera-facing soft billboards with a
 * per-instance alpha so each building's dust pulse fades independently.
 */
export function makeDustMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uColor: { value: new THREE.Color('#b6a890') },
    },
    transparent: true,
    depthWrite: false,
    fog: false,
    toneMapped: true,
    dithering: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aSeed;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vSeed;
      void main(){
        vUv = uv;
        vAlpha = aAlpha;
        vSeed = aSeed;
        vec3 worldPos = vec3(0.0);
        float sx = 1.0;
        float sy = 1.0;
        #ifdef USE_INSTANCING
          worldPos = instanceMatrix[3].xyz;
          sx = length(instanceMatrix[0].xyz);
          sy = length(instanceMatrix[1].xyz);
        #endif
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 p = worldPos + right * position.x * sx + up * position.y * sy;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vAlpha;
      varying float vSeed;
      ${GLSL_HASH2}
      float noise(vec2 x){
        vec2 i = floor(x); vec2 f = fract(x); f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float a = 0.5; float s = 0.0;
        for(int i=0;i<4;i++){ s += a * noise(p); p *= 2.11; a *= 0.52; }
        return s;
      }
      void main(){
        if (vAlpha < 0.004) discard;
        vec2 q = vUv * 2.0 - 1.0;
        float r = length(q);
        float boil = fbm(q * 2.4 + vec2(uTime * 0.12 + vSeed, uTime * 0.08 - vSeed));
        float blob = smoothstep(1.0, 0.12, r + (boil - 0.45) * 0.55);
        if (blob < 0.02) discard;
        vec3 col = uColor * (0.72 + 0.5 * boil);
        float a = blob * vAlpha * uOpacity * (0.5 + 0.5 * (1.0 - vUv.y));
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.8));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
