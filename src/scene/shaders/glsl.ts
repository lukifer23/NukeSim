/**
 * GLSL snippets shared verbatim by several materials. Kept as strings so the
 * identical function body cannot drift between shaders.
 */
export const GLSL_HASH2 =
  'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }'

/** Trilinear value noise on the shared 2D hash. fbm loops stay per-effect. */
export const GLSL_VALUE_NOISE2 = `float noise(vec2 x){
  vec2 i = floor(x);
  vec2 f = fract(x);
  f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}`

/** Sin-based 3D hash + trilinear value noise, shared by the volume/shell shaders. */
export const GLSL_NOISE3_VALUE = `float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
float noise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
                 mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                 mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
}`
