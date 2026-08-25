import * as THREE from 'three'

export function makeWaterMaterial(color: string, chop = 1): THREE.ShaderMaterial {
  const c = new THREE.Color(color)
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: c },
      uShallow: { value: new THREE.Color('#4aa0a8') },
      uSun: { value: new THREE.Vector3(0.35, 0.88, 0.22) },
      uChop: { value: chop },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uChop;
      attribute float baseY;
      varying vec3 vW;
      varying vec3 vN;
      void main(){
        vec3 p = position;
        float rest = baseY == 0.0 ? p.y : baseY;
        p.y = rest + (sin(p.x * 0.018 + uTime * 0.7) * 0.45 + cos(p.z * 0.014 + uTime * 0.55) * 0.35) * uChop;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vW = w.xyz;
        vec3 t = vec3(cos(p.x * 0.018 + uTime * 0.7) * 0.008, 1.0, -sin(p.z * 0.014 + uTime * 0.55) * 0.005);
        vN = normalize(mat3(modelMatrix) * normalize(t));
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uSun;
      varying vec3 vW;
      varying vec3 vN;
      void main(){
        vec3 n = normalize(vN);
        vec3 view = normalize(cameraPosition - vW);
        vec3 sun = normalize(uSun);
        float fres = pow(1.0 - max(0.0, dot(n, view)), 3.2);
        vec3 col = mix(uDeep, uShallow, fres * 0.62);
        col += vec3(0.62, 0.78, 0.84) * fres * 0.4;
        float spec = pow(max(0.0, dot(reflect(-sun, n), view)), 72.0);
        col += vec3(0.92, 0.95, 1.0) * spec * 0.7;
        float spark = pow(max(0.0, dot(n, sun)), 8.0) * 0.08;
        col += vec3(0.7, 0.82, 0.86) * spark;
        gl_FragColor = vec4(col, mix(0.78, 0.92, fres));
      }
    `,
  })
}
