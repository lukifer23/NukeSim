import * as THREE from 'three'

export function makeShockMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFade: { value: 0.5 },
      uDust: { value: 0.2 },
      uTime: { value: 0 },
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
      uniform float uDust;
      uniform float uTime;
      varying vec3 vN;
      varying vec3 vW;
      varying vec3 vObj;

      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float noise(vec3 x){
        vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                       mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                       mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
      }

      void main(){
        vec3 n = normalize(vN);
        vec3 view = normalize(cameraPosition - vW);
        float fres = pow(1.0 - abs(dot(n, view)), 2.15);
        // Turbulent breakup so the front reads as a pressure wave, not glass.
        float grain = 0.55 + 0.45 * noise(vObj * 6.5 + vec3(0.0, uTime * 0.6, 0.0));
        grain *= 0.6 + 0.4 * noise(vObj * 17.0 - vec3(uTime * 0.9, 0.0, uTime * 0.5));
        vec3 col = mix(vec3(0.95, 0.92, 0.86), vec3(0.66, 0.56, 0.46), uDust);
        float rim = clamp(fres * (0.35 + 0.65 * grain), 0.0, 1.0);
        float a = uFade * (0.015 + rim * 0.34);
        if (a < 0.004) discard;
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
