import * as THREE from 'three'

export function makeFireMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSeed: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    toneMapped: true,
    dithering: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        #ifdef USE_INSTANCING
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        #else
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #endif
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uSeed;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f*f*(3.0-2.0*f);
        return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float s = 0.0; float a = 0.5;
        for(int i=0;i<4;i++){ s += a * noise(p); p *= 2.13; a *= 0.55; }
        return s;
      }
      void main(){
        vec2 uv = vUv;
        uv.y = 1.0 - uv.y;
        float n = fbm(vec2(uv.x * 3.2 + uSeed, uv.y * 2.4 - uTime * 1.6));
        float shape = smoothstep(0.48, 0.08, abs(uv.x - 0.5) / (0.18 + uv.y * 0.55));
        shape *= smoothstep(0.0, 0.12, uv.y) * (1.0 - smoothstep(0.55, 1.0, uv.y + n * 0.22));
        vec3 hot = vec3(1.0, 0.92, 0.55);
        vec3 mid = vec3(1.0, 0.42, 0.08);
        vec3 dark = vec3(0.25, 0.04, 0.01);
        vec3 col = mix(mid, hot, n);
        col = mix(col, dark, smoothstep(0.35, 0.9, uv.y));
        float alpha = shape * (0.55 + n * 0.45);
        if (alpha < 0.04) discard;
        gl_FragColor = vec4(col * 1.4, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
