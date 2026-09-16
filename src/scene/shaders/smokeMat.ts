import * as THREE from 'three'

export function makeSmokeMaterial(opts: { ice: boolean }): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: new THREE.Vector2(0.2, 0.0) },
      uOpacity: { value: 0.62 },
      uIce: { value: opts.ice ? 1 : 0 },
    },
    transparent: true,
    depthWrite: false,
    fog: false,
    toneMapped: true,
    dithering: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uWind;
      varying vec2 vUv;
      varying float vAge;
      void main(){
        vUv = uv;
        vec3 worldPos = vec3(0.0);
        float sx = 1.0;
        float sy = 1.0;
        #ifdef USE_INSTANCING
          worldPos = instanceMatrix[3].xyz;
          sx = length(instanceMatrix[0].xyz);
          sy = length(instanceMatrix[1].xyz);
        #endif
        vAge = sy;
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 p = worldPos
          + right * position.x * sx
          + up * position.y * sy
          + right * uWind.x * (position.y + 0.5) * sx * 0.22
          + vec3(0.0, 1.0, 0.0) * uWind.y * (position.y + 0.5) * 0.08;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uOpacity;
      uniform float uIce;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 x){
        vec2 i = floor(x);
        vec2 f = fract(x);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float a = 0.5; float s = 0.0;
        for(int i=0;i<4;i++){ s += a * noise(p); p *= 2.07; a *= 0.52; }
        return s;
      }
      void main(){
        vec2 q = vUv * 2.0 - 1.0;
        float r = length(q);
        float boil = fbm(q * 2.2 + vec2(uTime * 0.07, uTime * 0.05));
        float blob = smoothstep(1.05, 0.18, r + (boil - 0.45) * 0.45);
        if (blob < 0.02) discard;
        vec3 ash = vec3(0.18, 0.16, 0.14);
        vec3 ice = vec3(0.62, 0.66, 0.7);
        vec3 col = mix(ash, ice, uIce * smoothstep(0.35, 0.9, vUv.y) * 0.7);
        col += vec3(0.05, 0.04, 0.03) * boil;
        float a = blob * uOpacity * (0.35 + 0.65 * (1.0 - vUv.y));
        gl_FragColor = vec4(col, clamp(a, 0.0, 0.72));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
