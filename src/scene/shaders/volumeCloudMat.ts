import * as THREE from 'three'

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

      float hash(vec3 p){
        return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      }
      float noise(vec3 x){
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                       mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                       mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
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
        q.xz -= uWind * q.y * 0.12;
        vec3 capP = q - vec3(0.0, 0.36, 0.0);
        float ring = sdTorus(capP, vec2(0.52, 0.15 + 0.02 * uGrow));
        float crown = sdEllipsoid(capP - vec3(0.0, 0.035, 0.0), vec3(0.82, 0.17, 0.82));
        float lobeA = sdEllipsoid(capP - vec3(0.43, 0.015, 0.10), vec3(0.40, 0.15, 0.36));
        float lobeB = sdEllipsoid(capP - vec3(-0.38, 0.025, -0.22), vec3(0.43, 0.16, 0.38));
        float cap = min(min(ring, crown), min(lobeA, lobeB));
        float ice = sdEllipsoid(q - vec3(0.0, 0.43, 0.0), vec3(0.62, 0.08, 0.62));
        float stem = sdCappedCone(q - vec3(0.0, -0.08, 0.0), 0.48, mix(0.10, 0.24, uSurface), 0.105);
        float collar = sdTorus(q - vec3(0.0, 0.08, 0.0), vec2(0.21, 0.07));
        float surge = uSurface > 0.5 ? sdEllipsoid(q - vec3(0.0, -0.52, 0.0), vec3(0.64, 0.035, 0.64)) : 1.0;
        float d = min(cap, ice);
        d = min(d, stem);
        d = min(d, collar);
        d = min(d, surge);
        return d;
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
        for (int i = 0; i < 36; i++) {
          if (float(i) >= uSteps) break;
          vec3 p = ro + rd * t;
          if (t > tExit || abs(p.x) > 1.2 || abs(p.y) > 1.2 || abs(p.z) > 1.2) break;
          float d = cloudSdf(p);
          float boil = fbm(p * 2.8 + vec3(uTime * 0.07, uTime * 0.04, 0.0));
          float dens = 1.0 - smoothstep(-0.05, 0.10, d + (boil - 0.45) * 0.10);
          dens *= 0.62 + 0.38 * boil;
          float lightDens = 0.0;
          for (int j = 1; j <= 3; j++) {
            vec3 sp = p + sun * float(j) * 0.075;
            float sd = cloudSdf(sp);
            lightDens += (1.0 - smoothstep(-0.04, 0.08, sd)) * 0.23;
          }
          float shadow = exp(-lightDens * 1.8);
          vec3 ash = vec3(0.24, 0.23, 0.22);
          vec3 lit = vec3(0.60, 0.57, 0.52);
          vec3 ice = vec3(0.68, 0.71, 0.73);
          float iceMix = smoothstep(0.33, 0.57, p.y) * 0.34;
          vec3 albedo = mix(mix(ash, lit, shadow), ice, iceMix);
          col += albedo * dens * T * 0.30;
          T *= exp(-dens * 0.40);
          if (T < 0.02) break;
          t += 0.048 + dens * 0.018;
        }
        float alpha = (1.0 - T) * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.94));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
}
