import * as THREE from 'three'
import { GLSL_NOISE3_VALUE } from './glsl'

export function makeVolumeCloudMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: new THREE.Vector2(0.2, 0) },
      uOpacity: { value: 0.7 },
      uGrow: { value: 0 },
      uSurface: { value: 0 },
      uSun: { value: new THREE.Vector3(0.3, 0.9, 0.2) },
      uInvModel: { value: new THREE.Matrix4() },
      uSteps: { value: 28 },
    },
    transparent: true,
    depthWrite: false,
    fog: false,
    toneMapped: true,
    dithering: true,
    side: THREE.BackSide,
    vertexShader: /* glsl */ `
      varying vec3 vObj;
      varying vec3 vWorld;
      void main(){
        vObj = position;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uWind;
      uniform float uOpacity;
      uniform float uGrow;
      uniform float uSurface;
      uniform vec3 uSun;
      uniform mat4 uInvModel;
      uniform float uSteps;
      varying vec3 vObj;
      varying vec3 vWorld;

      ${GLSL_NOISE3_VALUE}
      float fbm(vec3 p){
        float a = 0.5; float s = 0.0;
        for(int i=0;i<5;i++){ s += a * noise(p); p *= 2.03; a *= 0.5; }
        return s;
      }

      float sdEllipsoid(vec3 p, vec3 r){
        float k0 = length(p / r);
        float k1 = length(p / (r * r));
        return k0 * (k0 - 1.0) / max(k1, 1e-4);
      }
      float sdCappedCone(vec3 p, float h, float r1, float r2){
        vec2 q = vec2(length(p.xz), p.y);
        vec2 k1 = vec2(r2, h);
        vec2 k2 = vec2(r2 - r1, 2.0 * h);
        vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
        vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
        float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
        return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
      }
      float sdTorus(vec3 p, vec2 t){
        vec2 q = vec2(length(p.xz) - t.x, p.y);
        return length(q) - t.y;
      }

      float cloudSdf(vec3 p){
        vec3 q = p;
        float g = clamp(uGrow, 0.0, 1.0);
        // Altitude-dependent shear: the stem stays roughly vertical while the
        // cap smears downwind, instead of the whole column sliding as one slab.
        float shear = max(0.0, q.y + 0.05);
        q.xz -= uWind * shear * (0.05 + 0.18 * shear);
        vec3 capP = q - vec3(0.0, 0.40, 0.0);
        float capR = 0.44 + 0.14 * g;
        float ring = sdTorus(capP, vec2(capR, 0.13 + 0.03 * g));
        float crown = sdEllipsoid(capP - vec3(0.0, 0.03, 0.0), vec3(0.66 + 0.18 * g, 0.15 + 0.05 * g, 0.66 + 0.18 * g));
        float lobeA = sdEllipsoid(capP - vec3(0.36, 0.0, 0.08), vec3(0.34, 0.13, 0.30));
        float lobeB = sdEllipsoid(capP - vec3(-0.32, 0.02, -0.18), vec3(0.36, 0.14, 0.32));
        float cap = min(min(ring, crown), min(lobeA, lobeB));
        float ice = sdEllipsoid(q - vec3(0.0, 0.46, 0.0), vec3(0.52, 0.07, 0.52));
        float stem = sdCappedCone(q - vec3(0.0, -0.05, 0.0), 0.44, mix(0.07, 0.16, uSurface), 0.085);
        float collar = sdTorus(q - vec3(0.0, 0.10, 0.0), vec2(0.16, 0.04));
        float surge = uSurface > 0.5 ? sdEllipsoid(q - vec3(0.0, -0.5, 0.0), vec3(0.4, 0.028, 0.4)) : 1.0;
        return min(min(cap, ice), min(min(stem, collar), surge));
      }

      void main(){
        vec3 camObj = (uInvModel * vec4(cameraPosition, 1.0)).xyz;
        vec3 rd = normalize(vObj - camObj);
        vec3 ro = camObj;
        vec3 invRd = 1.0 / rd;
        vec3 t0 = (-vec3(1.0) - ro) * invRd;
        vec3 t1 = ( vec3(1.0) - ro) * invRd;
        vec3 tsm = min(t0, t1);
        vec3 tsx = max(t0, t1);
        float tEnter = max(max(tsm.x, tsm.y), tsm.z);
        float tExit = min(min(tsx.x, tsx.y), tsx.z);
        if (tExit < max(tEnter, 0.0)) discard;
        float t = max(tEnter, 0.0) + 0.01 + (hash(vec3(gl_FragCoord.xy, uTime * 143.0)) - 0.5) * 0.025;
        float T = 1.0;
        vec3 col = vec3(0.0);
        vec3 sun = normalize(uSun);
        // Box spans -1..1 (2 units); keep optical density independent of steps.
        float stepLen = 2.0 / max(uSteps, 12.0);
        for (int i = 0; i < 36; i++) {
          if (float(i) >= uSteps) break;
          vec3 p = ro + rd * t;
          if (t > tExit || abs(p.x) > 1.2 || abs(p.y) > 1.2 || abs(p.z) > 1.2) break;
          float d = cloudSdf(p);
          float boil = fbm(p * 2.6 + vec3(uTime * 0.07, uTime * 0.04, 0.0));
          float detail = fbm(p * 7.5 - vec3(uTime * 0.05, 0.0, uTime * 0.04));
          float dens = 1.0 - smoothstep(-0.06, 0.07, d + (boil - 0.45) * 0.14 + (detail - 0.5) * 0.05);
          dens *= 0.38 + 0.62 * boil;
          // 4-tap sun march gives the cap readable light and shadow faces.
          float lightDens = 0.0;
          for (int j = 1; j <= 4; j++) {
            vec3 sp = p + sun * float(j) * 0.085;
            float sd = cloudSdf(sp);
            lightDens += (1.0 - smoothstep(-0.04, 0.07, sd)) * 0.2;
          }
          float shadow = exp(-lightDens * 2.3);
          // Warm under-lit base, cool shadowed flanks, bright sunward crown.
          vec3 ash = vec3(0.28, 0.26, 0.24);
          vec3 lit = vec3(0.86, 0.82, 0.76);
          vec3 ice = vec3(0.80, 0.84, 0.88);
          float iceMix = smoothstep(0.3, 0.55, p.y) * (0.4 + 0.3 * detail);
          vec3 albedo = mix(mix(ash, lit, shadow), ice, iceMix);
          albedo *= 0.72 + 0.5 * shadow;
          // Optical density is integrated with step length so changing the
          // quality step count changes smoothness, not opacity.
          col += albedo * dens * stepLen * 7.6 * T;
          T *= exp(-dens * stepLen * 10.5);
          if (T < 0.02) break;
          t += stepLen + dens * stepLen * 0.4;
        }
        float alpha = (1.0 - T) * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
