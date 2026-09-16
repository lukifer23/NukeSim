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
        vec3 hot = vec3(2.15, 1.72, 1.22);
        vec3 mid = vec3(1.42, 0.48, 0.10);
        vec3 soot = vec3(0.16, 0.07, 0.03);
        vec3 col = mix(hot, mid, smoothstep(0.08, 0.55, cool));
        col = mix(col, soot, smoothstep(0.48, 1.0, cool));
        return col * (0.88 + pulse * 0.55);
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
          float boil = fbm(p * 3.4 + vec3(0.0, uTime * 0.55, uTime * 0.22));
          float core = 1.0 - smoothstep(0.12, 0.62 + boil * 0.18, rad);
          float shell = smoothstep(0.45, 0.78, rad) * (1.0 - smoothstep(0.82, 1.0, rad));
          float dens = core * 1.35 + shell * 0.55 * (0.55 + boil);
          dens *= 1.0 - uCool * 0.55;
          vec3 emit = blackbody(uCool, uPulse);
          emit = mix(emit, vec3(0.9, 0.25, 0.04), shell * (1.0 - uCool));
          float a = 1.0 - exp(-dens * dt * 2.35);
          col += emit * a * (1.0 - alpha);
          alpha += a * (1.0 - alpha);
          if (alpha > 0.97) break;
        }
        col = 1.0 - exp(-col * 0.82);
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.96) * uFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
