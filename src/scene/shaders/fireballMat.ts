import * as THREE from 'three'

const fireballUniforms = {
  uTime: { value: 0 },
  uPulse: { value: 1 },
  uSurface: { value: 0 },
  uCool: { value: 0 },
  uFade: { value: 1 },
  uInvModel: { value: new THREE.Matrix4() },
  uSteps: { value: 28 },
}

export function makeFireballMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(fireballUniforms),
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: true,
    dithering: true,
    side: THREE.BackSide,
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vObj;
      void main(){
        vObj = position;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPulse;
      uniform float uCool;
      uniform float uSurface;
      uniform float uFade;
      uniform mat4 uInvModel;
      uniform float uSteps;
      varying vec3 vWorld;
      varying vec3 vObj;

      float hash(vec3 p){
        p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 x){
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        return mix(
          mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
              mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
              mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y),
          f.z);
      }
      float fbm(vec3 p){
        float a = 0.5;
        float s = 0.0;
        for(int i=0;i<5;i++){
          s += a * noise(p);
          p *= 2.07;
          a *= 0.52;
        }
        return s;
      }

      vec3 blackbody(float cool, float pulse){
        vec3 hot = vec3(1.55, 1.06, 0.62);
        vec3 mid = vec3(1.18, 0.42, 0.09);
        vec3 soot = vec3(0.16, 0.06, 0.025);
        vec3 col = mix(hot, mid, smoothstep(0.05, 0.52, cool));
        col = mix(col, soot, smoothstep(0.52, 1.0, cool));
        return col * (0.75 + pulse * 0.7);
      }

      void main(){
        vec3 camObj = (uInvModel * vec4(cameraPosition, 1.0)).xyz;
        vec3 rd = normalize(vObj - camObj);
        vec3 ro = camObj;
        float b = dot(ro, rd);
        float c = dot(ro, ro) - 1.0;
        float h = b*b - c;
        if (h < 0.0) discard;
        float t0 = max(0.0, -b - sqrt(h));
        float t1 = -b + sqrt(h);
        if (t1 < 0.0) discard;

        vec3 col = vec3(0.0);
        float alpha = 0.0;
        float dt = (t1 - t0) / uSteps;
        float jitter = hash(vec3(gl_FragCoord.xy, uTime * 143.0)) - 0.5;
        for (int i = 0; i < 36; i++) {
          if (float(i) >= uSteps) break;
          vec3 p = ro + rd * (t0 + (float(i) + 0.5 + jitter * 0.55) * dt);
          if (uSurface > 0.5 && p.y < -0.02) continue;
          float rad = length(p);
          // Two octaves at different scales give the surface a boiling,
          // turbulent skin instead of a smooth ball.
          float boil = fbm(p * 3.1 + vec3(0.0, uTime * 0.5, uTime * 0.2));
          float gnarl = fbm(p * 8.5 - vec3(uTime * 0.35, 0.0, uTime * 0.3));
          float core = 1.0 - smoothstep(0.10, 0.5 + boil * 0.22, rad);
          float shell = smoothstep(0.42, 0.74, rad) * (1.0 - smoothstep(0.78, 1.0, rad));
          float dens = core * 1.5 + shell * 0.6 * (0.45 + boil * 0.8 + gnarl * 0.3);
          dens *= 1.0 - uCool * 0.5;
          vec3 emit = blackbody(uCool, uPulse);
          emit = mix(emit, vec3(1.0, 0.3, 0.05), shell * (1.0 - uCool));
          // Hot core reads brighter and whiter; the cooler shell keeps its hue.
          emit *= mix(1.45, 0.75, clamp(rad, 0.0, 1.0));
          float a = 1.0 - exp(-dens * dt * 2.35);
          // Hue-preserving compositing: bright emission rolls off without
          // flattening every channel to pure white.
          col += emit * a * (1.0 - alpha);
          alpha += a * (1.0 - alpha);
          if (alpha > 0.97) break;
        }
        col = col / (1.0 + col * 0.62);
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.86) * uFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
