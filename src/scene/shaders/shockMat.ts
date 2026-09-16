import * as THREE from 'three'

export function makeShockMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFade: { value: 0.5 },
      uDust: { value: 0.2 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vW;
      void main(){
        vN = normalize(normalMatrix * normal);
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade;
      uniform float uDust;
      varying vec3 vN;
      varying vec3 vW;
      void main(){
        vec3 n = normalize(vN);
        vec3 view = normalize(cameraPosition - vW);
        float fres = pow(1.0 - abs(dot(n, view)), 2.15);
        vec3 col = mix(vec3(0.95, 0.92, 0.86), vec3(0.62, 0.52, 0.42), uDust);
        float a = uFade * (0.04 + fres * 0.46);
        gl_FragColor = vec4(col, a);
      }
    `,
  })
}
