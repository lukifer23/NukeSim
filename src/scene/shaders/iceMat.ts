import * as THREE from 'three'
import { GLSL_NOISE3_VALUE } from './glsl'

export function makeIceMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFade: { value: 0 },
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector3(0.35, 0.88, 0.22) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: true,
    dithering: true,
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vW;
      varying vec3 vObj;
      void main(){
        vObj = position;
        vN = normalize(normalMatrix * normal);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade;
      uniform float uTime;
      uniform vec3 uSun;
      varying vec3 vN;
      varying vec3 vW;
      varying vec3 vObj;
      ${GLSL_NOISE3_VALUE}
      void main(){
        vec3 n = normalize(vN);
        vec3 view = normalize(cameraPosition - vW);
        float fres = pow(1.0 - abs(dot(n, view)), 2.0);
        float billow = noise(vObj * 3.1 + vec3(0.0, uTime * 0.15, 0.0));
        vec3 sun = normalize(uSun);
        float lit = 0.72 + 0.28 * max(0.0, dot(n, sun));
        vec3 col = mix(vec3(0.82, 0.86, 0.9), vec3(1.0), billow) * lit;
        float a = uFade * (0.03 + fres * 0.55) * (0.7 + 0.3 * billow);
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.9));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
